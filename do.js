import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';

/* ================================================================
   1. CORE STATE & GESTURE DEFINITIONS (32 GESTURES)
   ================================================================ */
const State = {
    h1: null, h2: null,
    h1Active: false, h2Active: false,
    gesture: 'IDLE', lastGesture: 'IDLE',
    zoom: 1.0, rotZ: 0, isExploded: false,
    particles: { count: 12000, color: new THREE.Color(0x00ffff) }
};

/* ================================================================
   2. SPATIAL PARTICLE ENGINE (FIXED GLITCHING)
   ================================================================ */
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

        this.createVoxelMatrix();
        this.setupBloom();
    },

    createVoxelMatrix() {
        const geo = new THREE.BufferGeometry();
        const pos = new Float32Array(State.particles.count * 3);
        const col = new Float32Array(State.particles.count * 3);
        this.originData = new Float32Array(State.particles.count * 3);

        for (let i = 0; i < State.particles.count; i++) {
            const r = 55 + Math.random() * 25;
            const t = Math.random() * Math.PI * 2;
            const p = Math.acos(2 * Math.random() - 1);
            
            const x = r * Math.sin(p) * Math.cos(t);
            const y = r * Math.sin(p) * Math.sin(t);
            const z = r * Math.cos(p);

            pos[i*3] = this.originData[i*3] = x;
            pos[i*3+1] = this.originData[i*3+1] = y;
            pos[i*3+2] = this.originData[i*3+2] = z;
            
            col[i*3] = 0; col[i*3+1] = 1; col[i*3+2] = 1;
        }

        geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
        geo.setAttribute('color', new THREE.BufferAttribute(col, 3));

        const mat = new THREE.PointsMaterial({
            size: 1.6,
            vertexColors: true,
            transparent: true,
            opacity: 0.8,
            blending: THREE.AdditiveBlending,
            depthWrite: false // FIX: Prevents particles from flickering/glitching
        });

        this.points = new THREE.Points(geo, mat);
        this.scene.add(this.points);
    },

    setupBloom() {
        this.composer = new EffectComposer(this.renderer);
        this.composer.addPass(new RenderPass(this.scene, this.camera));
        const bloom = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 1.8, 0.4, 0.85);
        this.composer.addPass(bloom);
    },

    render() {
        requestAnimationFrame(() => this.render());
        const pAttr = this.points.geometry.attributes.position.array;
        
        // Target color shift based on gesture
        let targetCol = new THREE.Color(0x00ffff);
        if (State.gesture === 'X_BLOCK' || State.gesture === 'THUMB_DOWN') targetCol.set(0xff3300);
        if (State.gesture === 'HEART_SYNC') targetCol.set(0xff0088);

        for (let i = 0; i < State.particles.count; i++) {
            const idx = i * 3;
            let tx = this.originData[idx], ty = this.originData[idx+1], tz = this.originData[idx+2];

            // Shape Morphing
            if (State.gesture === 'STACK_VERTICAL') { ty *= 3; tx *= 0.1; }
            if (State.isExploded) { tx *= 3; ty *= 3; tz *= 3; }

            // Smooth Movement (Lerp)
            pAttr[idx] += (tx - pAttr[idx]) * 0.1;
            pAttr[idx+1] += (ty - pAttr[idx+1]) * 0.1;
            pAttr[idx+2] += (tz - pAttr[idx+2]) * 0.1;
        }

        this.points.geometry.attributes.position.needsUpdate = true;
        this.points.rotation.y += 0.005;
        this.points.rotation.z = THREE.MathUtils.lerp(this.points.rotation.z, State.rotZ, 0.1);
        this.camera.position.z = THREE.MathUtils.lerp(this.camera.position.z, 180 / State.zoom, 0.1);

        this.composer.render();
    }
};

/* ================================================================
   3. NEURAL GESTURE RECOGNITION (32 POINTS)
   ================================================================ */
const NeuralEngine = {
    dist(a, b) { return Math.hypot(a.x - b.x, a.y - b.y); },
    
    detectHand(lm) {
        const d = (i, j) => this.dist(lm[i], lm[j]);
        const iE = lm[8].y < lm[6].y; // Index Extended
        const mE = lm[12].y < lm[10].y; // Middle
        const rE = lm[16].y < lm[14].y; // Ring
        const pE = lm[20].y < lm[18].y; // Pinky
        const tE = d(4, 9) > 0.15; // Thumb

        // --- SINGLE HAND (22 GESTURES) ---
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
        if (d(4, 8) < 0.05 && !mE) return "PINCH_INDEX";
        if (d(4, 12) < 0.05 && !iE) return "PINCH_MIDDLE";
        if (d(4, 16) < 0.05) return "PINCH_RING";
        if (d(4, 20) < 0.05) return "PINCH_PINKY";
        if (iE && mE && d(8, 12) < 0.04 && !rE) return "VULCAN_SALUTE";
        if (d(4, 8) > 0.1 && d(4, 8) < 0.2 && !rE) return "C_SHAPE";
        if (tE && iE && !mE && !rE) return "L_SHAPE";
        if (!iE && mE && rE && pE) return "FOLDED_INDEX";
        if (lm[0].y < lm[9].y) return "PALM_SLEEP";
        if (mE && !iE && !rE && !pE) return "MIDDLE_POINT";

        return "TRACKING";
    },

    processTwoHands(h1, h2) {
        const d = (a, b) => this.dist(a, b);
        const centerDist = d(h1[9], h2[9]);
        
        // --- TWO HANDED (10 GESTURES) ---
        State.zoom = THREE.MathUtils.clamp(centerDist * 3, 0.5, 4.0);
        State.rotZ = Math.atan2(h2[9].y - h1[9].y, h2[9].x - h1[9].x);

        if (d(h1[4], h2[4]) < 0.07 && d(h1[8], h2[8]) < 0.07) return "HEART_SYNC";
        if (d(h1[4], h2[8]) < 0.1 && d(h2[4], h1[8]) < 0.1) return "FRAME_SCAN";
        if (centerDist < 0.1) return "CLAP_RESET";
        if (centerDist < 0.25 && Math.abs(h1[9].x - h2[9].x) < 0.05) return "X_BLOCK";
        if (Math.abs(h1[9].x - h2[9].x) < 0.1 && Math.abs(h1[9].y - h2[9].y) > 0.35) return "STACK_VERTICAL";
        if (d(h1[8], h2[8]) < 0.05 && d(h1[20], h2[20]) < 0.05) return "TENT_SHIELD";
        if (centerDist > 0.7) { State.isExploded = true; return "EXPAND_VIEW"; } 
        else State.isExploded = false;
        
        if (Math.abs(h1[9].y - h2[9].y) < 0.1 && centerDist > 0.5) return "PARALLEL_SLIDE";
        
        return (centerDist > 0.5) ? "ZOOM_IN" : "ZOOM_OUT";
    }
};

/* ================================================================
   4. SYSTEM INIT
   ================================================================ */
document.getElementById('start-btn').addEventListener('click', () => {
    document.getElementById('start-overlay').style.display = 'none';
    Engine3D.init();
    Engine3D.render();

    const hands = new window.Hands({locateFile: (f) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${f}`});
    hands.setOptions({ maxNumHands: 2, modelComplexity: 1, minDetectionConfidence: 0.8, minTrackingConfidence: 0.8 });

    hands.onResults(res => {
        const h = res.multiHandLandmarks;
        State.h1Active = h.length > 0;
        State.h2Active = h.length > 1;

        if (State.h1Active) {
            State.gesture = State.h2Active ? NeuralEngine.processTwoHands(h[0], h[1]) : NeuralEngine.detectHand(h[0]);
            
            document.getElementById('gesture-status').innerText = State.gesture;
            document.getElementById('val-zoom').innerText = State.zoom.toFixed(1) + 'x';
            document.getElementById('val-rot').innerText = Math.round(State.rotZ * 57.3) + '°';
            document.getElementById('subtitle-box').innerText = "GESTURE RECOGNIZED: " + State.gesture;

            const ret = document.getElementById('reticle');
            ret.style.display = 'block';
            ret.style.left = ((1 - h[0][9].x) * window.innerWidth) + 'px';
            ret.style.top = (h[0][9].y * window.innerHeight) + 'px';
        } else {
            document.getElementById('gesture-status').innerText = 'IDLE';
            document.getElementById('reticle').style.display = 'none';
        }
    });

    const camera = new window.Camera(document.getElementById('video-input'), {
        onFrame: async () => { await hands.send({image: document.getElementById('video-input')}); },
        width: 640, height: 480
    });
    camera.start();
});
