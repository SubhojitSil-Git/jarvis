import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';

const State = {
    gesture: 'IDLE', lastGesture: 'IDLE',
    zoom: 1.0, rotZ: 0, isExploded: false,
    particles: { count: 12000 },
    audio: { analyser: null, dataArray: null, active: false }
};

// --- AUDIO ANALYSER ---
const AudioEngine = {
    async init() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const ctx = new (window.AudioContext || window.webkitAudioContext)();
            const source = ctx.createMediaStreamSource(stream);
            State.audio.analyser = ctx.createAnalyser();
            State.audio.analyser.fftSize = 128;
            source.connect(State.audio.analyser);
            State.audio.dataArray = new Uint8Array(State.audio.analyser.frequencyBinCount);
            State.audio.active = true;
        } catch (e) { console.warn("Audio link disabled."); }
    }
};

const Engine3D = {
    scene: null, camera: null, renderer: null, composer: null,
    points: null, originData: null,
    
    init() {
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 2000);
        this.camera.position.z = 180;

        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        document.body.appendChild(this.renderer.domElement);

        this.createIronManMatrix();
        this.setupPostProcessing();
    },

    createIronManMatrix() {
        const geo = new THREE.BufferGeometry();
        const pos = new Float32Array(State.particles.count * 3);
        const col = new Float32Array(State.particles.count * 3);
        this.originData = new Float32Array(State.particles.count * 3);

        for (let i = 0; i < State.particles.count; i++) {
            // Creating a "Shell" look
            const r = (i < 2000) ? Math.random() * 20 : 60 + Math.random() * 15;
            const t = Math.random() * Math.PI * 2;
            const p = Math.acos(2 * Math.random() - 1);
            
            pos[i*3] = this.originData[i*3] = r * Math.sin(p) * Math.cos(t);
            pos[i*3+1] = this.originData[i*3+1] = r * Math.sin(p) * Math.sin(t);
            pos[i*3+2] = this.originData[i*3+2] = r * Math.cos(p);
            
            col[i*3] = 0; col[i*3+1] = 1; col[i*3+2] = 1;
        }

        geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
        geo.setAttribute('color', new THREE.BufferAttribute(col, 3));

        const mat = new THREE.PointsMaterial({
            size: 1.5, vertexColors: true, transparent: true, opacity: 0.8,
            blending: THREE.AdditiveBlending, depthWrite: false
        });

        this.points = new THREE.Points(geo, mat);
        this.scene.add(this.points);
    },

    setupPostProcessing() {
        this.composer = new EffectComposer(this.renderer);
        this.composer.addPass(new RenderPass(this.scene, this.camera));
        // High bloom for the "Iron Man" energy look
        const bloom = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 1.4, 0.5, 0.8);
        this.composer.addPass(bloom);
    },

    render() {
        requestAnimationFrame(() => this.render());
        const pAttr = this.points.geometry.attributes.position.array;
        const cAttr = this.points.geometry.attributes.color.array;

        let bass = 0;
        if (State.audio.active) {
            State.audio.analyser.getByteFrequencyData(State.audio.dataArray);
            bass = State.audio.dataArray[0] / 255;
        }

        let targetCol = new THREE.Color(0x00ffff);
        if (State.gesture === 'X_BLOCK' || State.gesture === 'ROCK_ON') targetCol.set(0xff2200);
        if (State.gesture === 'HEART_SYNC') targetCol.set(0xff00cc);
        if (State.gesture === 'FRAME_SCAN') targetCol.set(0x00ff88);

        for (let i = 0; i < State.particles.count; i++) {
            const idx = i * 3;
            let tx = this.originData[idx], ty = this.originData[idx+1], tz = this.originData[idx+2];

            // --- GESTURE PHYSICS ---
            if (State.gesture === 'FIST_CLOSED') { tx *= 0.15; ty *= 0.15; tz *= 0.15; }
            if (State.gesture === 'STACK_VERT') { ty *= 3.5; tx *= 0.2; }
            if (State.gesture === 'TENT_SHIELD') { tx *= 1.2; ty *= 1.2; tz *= 1.2; }
            if (State.isExploded || State.gesture === 'EXPAND_VIEW') { tx *= 4; ty *= 4; tz *= 4; }

            // Apply Sonic Jitter
            const pulse = 1.0 + (bass * 0.4);
            pAttr[idx] += (tx * pulse - pAttr[idx]) * 0.1;
            pAttr[idx+1] += (ty * pulse - pAttr[idx+1]) * 0.1;
            pAttr[idx+2] += (tz * pulse - pAttr[idx+2]) * 0.1;

            // Smooth Color Shift
            cAttr[idx] += (targetCol.r - cAttr[idx]) * 0.1;
            cAttr[idx+1] += (targetCol.g - cAttr[idx+1]) * 0.1;
            cAttr[idx+2] += (targetCol.b - cAttr[idx+2]) * 0.1;
        }

        this.points.geometry.attributes.position.needsUpdate = true;
        this.points.geometry.attributes.color.needsUpdate = true;
        this.points.rotation.y += 0.005 + (bass * 0.05);
        this.points.rotation.z = THREE.MathUtils.lerp(this.points.rotation.z, State.rotZ, 0.1);
        this.camera.position.z = THREE.MathUtils.lerp(this.camera.position.z, 180 / State.zoom, 0.1);

        this.composer.render();
    }
};

const NeuralEngine = {
    dist(a, b) { return Math.hypot(a.x - b.x, a.y - b.y); },
    detectHand(lm) {
        const d = (i, j) => this.dist(lm[i], lm[j]);
        const iE = lm[8].y < lm[6].y; const mE = lm[12].y < lm[10].y;
        const rE = lm[16].y < lm[14].y; const pE = lm[20].y < lm[18].y;
        const tE = d(4, 9) > 0.15;

        if (iE && mE && rE && pE && tE) return "PALM_OPEN";
        if (!iE && !mE && !rE && !pE) return "FIST_CLOSED";
        if (iE && !mE && !rE && !pE) return "INDEX_POINT";
        if (iE && mE && !rE && !pE) return "PEACE_SIGN";
        if (iE && pE && !mE && !rE) return "ROCK_ON";
        if (tE && !iE && !mE && !rE && !pE) return (lm[4].y < lm[3].y) ? "THUMB_UP" : "THUMB_DOWN";
        if (d(4, 8) < 0.05 && mE && rE && pE) return "OK_SIGN";
        if (tE && iE && pE && !mE && !rE) return "SPIDERMAN";
        if (pE && !iE && !mE && !rE) return "PINKY_POINT";
        if (tE && pE && !iE && !mE && !rE) return "CALL_ME";
        if (iE && mE && rE && pE && !tE) return "FOUR_FINGERS";
        if (iE && mE && rE && !pE && !tE) return "THREE_FINGERS";
        if (iE && mE && d(8, 12) < 0.05 && !rE) return "VULCAN_SALUTE";
        if (d(4, 8) < 0.04) return "PINCH_INDEX";
        if (d(4, 12) < 0.04) return "PINCH_MIDDLE";
        if (d(4, 16) < 0.04) return "PINCH_RING";
        if (d(4, 20) < 0.04) return "PINCH_PINKY";
        if (d(4, 8) > 0.1 && d(4, 8) < 0.2) return "C_SHAPE";
        if (tE && iE && !mE && !rE) return "L_SHAPE";
        if (!iE && mE && rE && pE) return "FOLDED_INDEX";
        if (lm[0].y < lm[9].y) return "PALM_SLEEP";
        return "TRACKING";
    },
    processTwoHands(h1, h2) {
        const d = (a, b) => this.dist(a, b);
        const cD = d(h1[9], h2[9]);
        State.zoom = THREE.MathUtils.clamp(cD * 3, 0.5, 4.0);
        State.rotZ = Math.atan2(h2[9].y - h1[9].y, h2[9].x - h1[9].x);
        if (d(h1[4], h2[4]) < 0.07 && d(h1[8], h2[8]) < 0.07) return "HEART_SYNC";
        if (d(h1[4], h2[8]) < 0.1 && d(h2[4], h1[8]) < 0.1) return "FRAME_SCAN";
        if (cD < 0.1) return "CLAP_RESET";
        if (cD < 0.25 && Math.abs(h1[9].x - h2[9].x) < 0.05) {
            document.body.classList.add('shake'); // Shake the HUD
            setTimeout(() => document.body.classList.remove('shake'), 500);
            return "X_BLOCK";
        }
        if (Math.abs(h1[9].y - h2[9].y) > 0.3) return "STACK_VERT";
        if (d(h1[8], h2[8]) < 0.05) return "TENT_SHIELD";
        if (cD > 0.75) { State.isExploded = true; return "EXPAND_VIEW"; } else State.isExploded = false;
        return (cD > 0.5) ? "ZOOM_EXPAND" : "ZOOM_SHRINK";
    }
};

document.getElementById('start-btn').addEventListener('click', () => {
    document.getElementById('start-overlay').style.display = 'none';
    AudioEngine.init();
    Engine3D.init();
    Engine3D.render();

    const hands = new window.Hands({locateFile: (f) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${f}`});
    hands.setOptions({ maxNumHands: 2, modelComplexity: 1, minDetectionConfidence: 0.8, minTrackingConfidence: 0.8 });

    hands.onResults(res => {
        const h = res.multiHandLandmarks;
        if (h.length > 0) {
            State.gesture = h.length > 1 ? NeuralEngine.processTwoHands(h[0], h[1]) : NeuralEngine.detectHand(h[0]);
            document.getElementById('gesture-status').innerText = State.gesture;
            document.getElementById('subtitle-box').innerText = "GESTURE: " + State.gesture;
            const ret = document.getElementById('reticle');
            ret.style.display = 'block';
            ret.style.left = ((1 - h[0][9].x) * window.innerWidth) + 'px';
            ret.style.top = (h[0][9].y * window.innerHeight) + 'px';
        } else {
            document.getElementById('reticle').style.display = 'none';
        }
    });

    const camera = new window.Camera(document.getElementById('video-input'), {
        onFrame: async () => { await hands.send({image: document.getElementById('video-input')}); },
        width: 640, height: 480
    });
    camera.start();
});
