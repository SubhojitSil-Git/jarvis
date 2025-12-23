import * as THREE from "three";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";

/* ================= STATE ================= */
const State = {
  handActive: false,
  gesture: "IDLE",
  lastGesture: "IDLE",
  hold: 0,
  frozen: false,
  chaos: false,
  combat: false
};

/* ================= UI ================= */
const UI = {
  gesture: document.getElementById("gesture-status"),
  mode: document.getElementById("mode-status"),
  subtitle: document.getElementById("subtitle-box"),
  reticle: document.getElementById("reticle"),
  body: document.body
};

/* ================= VISUALS ================= */
const Visuals = {
  scene: null,
  camera: null,
  renderer: null,
  composer: null,
  geometry: null,
  colors: null,
  count: 0,

  init() {
    const mobile = /Android|iPhone/i.test(navigator.userAgent);
    this.count = mobile ? 1800 : 4000;

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(75, innerWidth / innerHeight, 0.1, 1000);
    this.camera.position.z = 80;

    this.renderer = new THREE.WebGLRenderer({ powerPreference: "high-performance" });
    this.renderer.setSize(innerWidth, innerHeight);
    document.body.appendChild(this.renderer.domElement);

    this.composer = new EffectComposer(this.renderer);
    this.composer.addPass(new RenderPass(this.scene, this.camera));
    this.composer.addPass(new UnrealBloomPass(new THREE.Vector2(innerWidth, innerHeight), 1.4, 0.4, 0.85));

    this.createParticles();
  },

  createParticles() {
    const pos = new Float32Array(this.count * 3);
    const col = new Float32Array(this.count * 3);

    for (let i = 0; i < this.count; i++) {
      pos[i*3] = (Math.random()-0.5)*120;
      pos[i*3+1] = (Math.random()-0.5)*120;
      pos[i*3+2] = (Math.random()-0.5)*120;

      col[i*3] = 0;
      col[i*3+1] = 1;
      col[i*3+2] = 1;
    }

    this.geometry = new THREE.BufferGeometry();
    this.geometry.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    this.geometry.setAttribute("color", new THREE.BufferAttribute(col, 3));
    this.colors = col;

    const mat = new THREE.PointsMaterial({
      size: 0.9,
      vertexColors: true,
      blending: THREE.AdditiveBlending
    });

    this.scene.add(new THREE.Points(this.geometry, mat));
  },

  animate() {
    requestAnimationFrame(() => this.animate());

    if (!State.frozen && State.handActive) {
      const p = this.geometry.attributes.position.array;

      for (let i = 0; i < this.count; i++) {
        let force = State.chaos ? 1.2 : 0.25;

        p[i*3] += (Math.random()-0.5)*force;
        p[i*3+1] += (Math.random()-0.5)*force;

        if (State.chaos) {
          this.colors[i*3] = Math.random();
          this.colors[i*3+1] = Math.random();
          this.colors[i*3+2] = Math.random();
        } else if (State.combat) {
          this.colors[i*3] = 1;
          this.colors[i*3+1] = 0;
          this.colors[i*3+2] = 0;
        } else {
          this.colors[i*3] = 0;
          this.colors[i*3+1] = 1;
          this.colors[i*3+2] = 1;
        }
      }

      this.geometry.attributes.position.needsUpdate = true;
      this.geometry.attributes.color.needsUpdate = true;
    }

    this.composer.render();
  }
};

/* ================= GESTURES ================= */
function detectGesture(lm) {
  const d = (a,b)=>Math.hypot(lm[a].x-lm[b].x,lm[a].y-lm[b].y);

  if (d(4,8) < 0.05) return "PINCH";       // Freeze
  if (d(8,0) < 0.25) return "FIST";        // Gravity (visual)
  if (d(8,0) > 0.4 && d(20,0) > 0.4) return "ROCK"; // Chaos
  return "PALM";
}

/* ================= INIT ================= */
document.getElementById("start-btn").onclick = async () => {
  document.getElementById("start-overlay").style.display = "none";

  Visuals.init();
  Visuals.animate();

  const video = document.getElementById("video-input");

  const hands = new window.Hands({
    locateFile: f => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${f}`
  });

  hands.setOptions({
    maxNumHands: 1,
    modelComplexity: 1,
    minDetectionConfidence: 0.6,
    minTrackingConfidence: 0.5
  });

  hands.onResults(res => {
    if (!res.multiHandLandmarks.length) {
      State.handActive = false;
      UI.reticle.style.display = "none";
      return;
    }

    State.handActive = true;
    const lm = res.multiHandLandmarks[0];

    UI.reticle.style.display = "block";
    UI.reticle.style.left = lm[9].x * innerWidth + "px";
    UI.reticle.style.top = lm[9].y * innerHeight + "px";

    const g = detectGesture(lm);

    if (g === State.lastGesture) State.hold++;
    else State.hold = 0;

    if (State.hold === 8) {
      State.gesture = g;

      if (g === "PINCH") State.frozen = !State.frozen;
      if (g === "ROCK") State.chaos = !State.chaos;

      UI.subtitle.innerText =
        g === "PINCH" ? (State.frozen ? "TIME FROZEN" : "TIME RESUMED") :
        g === "ROCK" ? "CHAOS MODE" :
        " ";

      State.hold = 0;
    }

    State.lastGesture = g;
    UI.gesture.innerText = g;
  });

  // Voice commands (combat mode)
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (SpeechRecognition) {
    const recog = new SpeechRecognition();
    recog.continuous = true;
    recog.lang = "en-US";

    recog.onresult = e => {
      const t = e.results[e.results.length-1][0].transcript.toLowerCase();

      if (t.includes("combat")) {
        State.combat = true;
        UI.body.classList.add("combat");
        UI.mode.innerText = "COMBAT";
        UI.subtitle.innerText = "COMBAT MODE ENGAGED";
      }

      if (t.includes("relax") || t.includes("stand down")) {
        State.combat = false;
        UI.body.classList.remove("combat");
        UI.mode.innerText = "NORMAL";
        UI.subtitle.innerText = "STANDING DOWN";
      }
    };

    recog.start();
  }

  const stream = await navigator.mediaDevices.getUserMedia({
    video: { facingMode: "user", width: {ideal:1280}, height:{ideal:720} }
  });

  video.srcObject = stream;
  video.play();

  const loop = async () => {
    if (video.readyState >= 2) await hands.send({ image: video });
    requestAnimationFrame(loop);
  };
  loop();
};

/* ================= RESIZE ================= */
window.addEventListener("resize", () => {
  if (!Visuals.camera) return;
  Visuals.camera.aspect = innerWidth / innerHeight;
  Visuals.camera.updateProjectionMatrix();
  Visuals.renderer.setSize(innerWidth, innerHeight);
  Visuals.composer.setSize(innerWidth, innerHeight);
});
