import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';

const State = {
  gesture: 'IDLE',
  particles: { count: 12000 },
  audio: { analyser: null, dataArray: null, active: false },
  manualZoom: 180,
  activeHue: 0.55
};

/* ---------------- AUDIO ---------------- */

const AudioEngine = {
  async init() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const src = ctx.createMediaStreamSource(stream);
      State.audio.analyser = ctx.createAnalyser();
      State.audio.analyser.fftSize = 128;
      src.connect(State.audio.analyser);
      State.audio.dataArray = new Uint8Array(State.audio.analyser.frequencyBinCount);
      State.audio.active = true;
    } catch {
      console.warn("Audio disabled.");
    }
  }
};

/* ---------------- 3D ENGINE ---------------- */

const Engine3D = {
  scene: null,
  camera: null,
  renderer: null,
  composer: null,
  points: null,
  originData: null,
  lines: null,
  linePositions: null,
  lineGeo: null,

  init() {
    this.scene = new THREE.Scene();

    this.camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      2000
    );
    this.camera.position.z = State.manualZoom;

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(this.renderer.domElement);

    this.createParticles();
    this.createNeuralLinks();
    this.setupPost();
  },

  createParticles() {
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(State.particles.count * 3);
    const col = new Float32Array(State.particles.count * 3);
    this.originData = new Float32Array(State.particles.count * 3);

    for (let i = 0; i < State.particles.count; i++) {
      const r = i < 2500 ? Math.random() * 20 : 65 + Math.random() * 15;
      const t = Math.random() * Math.PI * 2;
      const p = Math.acos(2 * Math.random() - 1);

      const x = r * Math.sin(p) * Math.cos(t);
      const y = r * Math.sin(p) * Math.sin(t);
      const z = r * Math.cos(p);

      pos.set([x, y, z], i * 3);
      this.originData.set([x, y, z], i * 3);
      col.set([0.2, 1.0, 1.0], i * 3);
    }

    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(col, 3));

    const mat = new THREE.PointsMaterial({
      size: 1.6,
      vertexColors: true,
      transparent: true,
      opacity: 0.9,
      depthWrite: false
    });

    this.points = new THREE.Points(geo, mat);
    this.scene.add(this.points);
  },

  createNeuralLinks() {
    const maxLinks = 28000;
    this.linePositions = new Float32Array(maxLinks * 6);
    this.lineGeo = new THREE.BufferGeometry();
    this.lineGeo.setAttribute(
      'position',
      new THREE.BufferAttribute(this.linePositions, 3)
    );

    const mat = new THREE.LineBasicMaterial({
      color: 0x88ffff,
      transparent: true,
      opacity: 0.12,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });

    this.lines = new THREE.LineSegments(this.lineGeo, mat);
    this.scene.add(this.lines);
  },

  setupPost() {
    this.composer = new EffectComposer(this.renderer);
    this.composer.addPass(new RenderPass(this.scene, this.camera));
    this.composer.addPass(
      new UnrealBloomPass(
        new THREE.Vector2(window.innerWidth, window.innerHeight),
        0, 0, 1.0
      )
    );
  },

  render() {
    requestAnimationFrame(() => this.render());

    const p = this.points.geometry.attributes.position.array;
    const c = this.points.geometry.attributes.color.array;
    const speed = 0.14;

    let bass = 0;
    if (State.audio.active) {
      State.audio.analyser.getByteFrequencyData(State.audio.dataArray);
      bass = State.audio.dataArray[0] / 255;
    }

    const targetCol = new THREE.Color().setHSL(State.activeHue, 1, 0.5);

    for (let i = 0; i < State.particles.count; i++) {
      const idx = i * 3;

      let tx = this.originData[idx];
      let ty = this.originData[idx + 1];
      let tz = this.originData[idx + 2];

      if (State.gesture === 'CORE_SPLIT') {
        const d = Math.sqrt(tx * tx + ty * ty + tz * tz);
        const f = d < 30 ? 0.5 : 1.6;
        tx *= f; ty *= f; tz *= f;
      }

      p[idx]     += (tx - p[idx])     * speed;
      p[idx + 1] += (ty - p[idx + 1]) * speed;
      p[idx + 2] += (tz - p[idx + 2]) * speed;

      c[idx]     += (targetCol.r - c[idx])     * 0.2;
      c[idx + 1] += (targetCol.g - c[idx + 1]) * 0.2;
      c[idx + 2] += (targetCol.b - c[idx + 2]) * 0.2;
    }

    this.points.geometry.attributes.position.needsUpdate = true;
    this.points.geometry.attributes.color.needsUpdate = true;

    /* -------- PERFORMANCE-SAFE NEURAL LINKS -------- */

    let l = 0;
    const thresholdSq = 18 * 18;

    for (let i = 0; i < State.particles.count; i += 10) {
      for (let j = i + 10; j < State.particles.count; j += 10) {

        if (l > 24000) break;

        const dx = p[i * 3]     - p[j * 3];
        const dy = p[i * 3 + 1] - p[j * 3 + 1];
        const dz = p[i * 3 + 2] - p[j * 3 + 2];
        const d  = dx * dx + dy * dy + dz * dz;

        if (d < thresholdSq) {
          this.linePositions.set([
            p[i * 3],     p[i * 3 + 1],     p[i * 3 + 2],
            p[j * 3],     p[j * 3 + 1],     p[j * 3 + 2]
          ], l);
          l += 6;
        }
      }
    }

    this.lineGeo.setDrawRange(0, l / 3);
    this.lineGeo.attributes.position.needsUpdate = true;

    this.points.rotation.y += 0.004 + bass * 0.05;
    this.camera.position.z = THREE.MathUtils.lerp(
      this.camera.position.z,
      State.manualZoom,
      0.15
    );

    this.composer.render();
  }
};

/* ---------------- GESTURE ENGINE ---------------- */

const NeuralEngine = {
  dist(a, b) {
    return Math.hypot(a.x - b.x, a.y - b.y);
  },

  detectHand(lm) {
    const d = (i, j) => this.dist(lm[i], lm[j]);

    const iE = d(8, 0)  > d(6, 0);
    const mE = d(12, 0) > d(10, 0);
    const rE = d(16, 0) > d(14, 0);

    if (d(4, 8) < 0.045) return 'CORE_SPLIT';
    if (iE && mE && rE) return 'PALM_OPEN';
    if (!iE && !mE && !rE) return 'FIST_CLOSED';

    return 'TRACKING';
  }
};

/* ---------------- START ---------------- */

document.getElementById('start-btn').onclick = async () => {
  document.getElementById('start-overlay').style.display = 'none';

  await AudioEngine.init();
  Engine3D.init();
  Engine3D.render();

  const videoEl = document.getElementById('video-input');

  const hands = new window.Hands({
    locateFile: f => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${f}`
  });

  hands.setOptions({
    maxNumHands: 1,
    minDetectionConfidence: 0.8,
    minTrackingConfidence: 0.8
  });

  hands.onResults(res => {
    if (!res.multiHandLandmarks?.length) return;
    State.gesture = NeuralEngine.detectHand(res.multiHandLandmarks[0]);
  });

  const cam = new window.Camera(videoEl, {
    onFrame: async () => {
      await hands.send({ image: videoEl });
    },
    width: 640,
    height: 480
  });

  cam.start();
};
