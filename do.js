import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';

// --- STARK TECH AUDIO ENGINE ---
const AudioEngine = {
    ctx: null,
    init() { this.ctx = new (window.AudioContext || window.webkitAudioContext)(); },
    
    // Smooth pitch-shifting hum for zoom/rotate
    playHum(freq = 200, vol = 0.02) {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
        g.gain.setValueAtTime(vol, this.ctx.currentTime);
        g.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.3);
        osc.connect(g); g.connect(this.ctx.destination);
        osc.start(); osc.stop(this.ctx.currentTime + 0.3);
    },

    // Heavy "thump" for Pulse/Heartbeat
    playThump() {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        osc.type = 'sine'; osc.frequency.setValueAtTime(50, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(10, this.ctx.currentTime + 0.5);
        g.gain.setValueAtTime(0.3, this.ctx.currentTime);
        g.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 0.5);
        osc.connect(g); g.connect(this.ctx.destination);
        osc.start(); osc.stop(this.ctx.currentTime + 0.5);
    }
};

const State = {
    zoom: 1.0, rotZ: 0, isExploded: false, isPinching: false,
    activeColor: new THREE.Color(0x00ffff),
    colors: { idle: 0x00ffff, active: 0xffaa00, heart: 0xff0055, blueprint: 0x55ffaa }
};

// --- HOLOGRAPHIC ENGINE ---
const Visuals = {
    scene: null, camera: null, renderer: null, points: null,
    init() {
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 2000);
        this.camera.position.z = 180;

        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        document.body.appendChild(this.renderer.domElement);

        this.createParticles();
        this.setupPost();
    },

    createParticles() {
        const isPC = window.innerWidth > 1024;
        const count = isPC ? 15000 : 5000;
        const radius = isPC ? 90 : 50; // Adaptive Size
        
        const geo = new THREE.BufferGeometry();
        const pos = new Float32Array(count * 3);
        const col = new Float32Array(count * 3);
        
        for (let i = 0; i < count; i++) {
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(2 * Math.random() - 1);
            pos[i*3] = radius * Math.sin(phi) * Math.cos(theta);
            pos[i*3+1] = radius * Math.sin(phi) * Math.sin(theta);
            pos[i*3+2] = radius * Math.cos(phi);
            col[i*3] = 0; col[i*3+1] = 1; col[i*3+2] = 1;
        }

        geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
        geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
        this.points = new THREE.Points(geo, new THREE.PointsMaterial({
            size: 0.8, vertexColors: true, transparent: true, opacity: 0.8, blending: THREE.AdditiveBlending
        }));
        this.scene.add(this.points);
        this.origPos = new Float32Array(pos);
    },

    setupPost() {
        const bloom = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 1.5, 0.4, 0.85);
        this.composer = new EffectComposer(this.renderer);
        this.composer.addPass(new RenderPass(this.scene, this.camera));
        this.composer.addPass(bloom);
    },

    animate() {
        requestAnimationFrame(() => this.animate());
        const time = Date.now() * 0.001;
        
        // 1. Smooth Camera Zoom
        this.camera.position.z = THREE.MathUtils.lerp(this.camera.position.z, 180 / State.zoom, 0.1);
        
        // 2. Gesture Based Color/Position Lerping
        const posAttr = this.points.geometry.attributes.position;
        const colAttr = this.points.geometry.attributes.color;
        const targetColor = State.isPinching ? State.colors.active : State.colors.idle;

        for (let i = 0; i < posAttr.count; i++) {
            let tx = this.origPos[i*3], ty = this.origPos[i*3+1], tz = this.origPos[i*3+2];
            
            // Explosion Effect
            if (State.isExploded) { tx *= 2.5; ty *= 2.5; tz *= 2.5; }
            
            posAttr.array[i*3] += (tx - posAttr.array[i*3]) * 0.1;
            posAttr.array[i*3+1] += (ty - posAttr.array[i*3+1]) * 0.1;
            posAttr.array[i*3+2] += (tz - posAttr.array[i*3+2]) * 0.1;

            colAttr.array[i*3] += (targetColor.r - colAttr.array[i*3]) * 0.1;
            colAttr.array[i*3+1] += (targetColor.g - colAttr.array[i*3+1]) * 0.1;
            colAttr.array[i*3+2] += (targetColor.b - colAttr.array[i*3+2]) * 0.1;
        }

        posAttr.needsUpdate = true;
        colAttr.needsUpdate = true;
        this.points.rotation.z = State.rotZ;
        this.points.rotation.y += 0.002;
        this.composer.render();
    }
};

// --- GESTURE ENGINE: 12+ GESTURES ---
function analyzeGestures(h1, h2) {
    const dist = (p1, p2) => Math.hypot(p1.x - p2.x, p1.y - p2.y);
    
    // Single Hand Detection
    const getHandType = (lm) => {
        if (dist(lm[4], lm[8]) < 0.04) return 'PINCH';
        if (lm[8].y < lm[6].y && lm[12].y > lm[10].y) return 'POINT';
        if (lm[8].y < lm[6].y && lm[12].y < lm[10].y && lm[16].y > lm[14].y) return 'PEACE';
        if (dist(lm[8], lm[0]) < 0.15) return 'FIST';
        return 'IDLE';
    };

    const g1 = getHandType(h1);
    document.getElementById('h1-label').innerText = g1;
    State.isPinching = (g1 === 'PINCH');

    if (h2) {
        const g2 = getHandType(h2);
        document.getElementById('h2-label').innerText = g2;
        const dHands = dist(h1[9], h2[9]);
        
        // 1. Zoom (Expansion)
        State.zoom = THREE.MathUtils.clamp(dHands * 4, 0.5, 3.5);
        document.getElementById('zoom-ui').innerText = State.zoom.toFixed(1) + 'x';

        // 2. Globe Rotate (Steering Wheel)
        State.rotZ = Math.atan2(h2[9].y - h1[9].y, h2[9].x - h1[9].x);
        document.getElementById('rot-ui').innerText = Math.round(State.rotZ * 57.3) + '°';

        // 3. The Heart / Pulse
        if (dist(h1[4], h2[4]) < 0.05 && dist(h1[8], h2[8]) < 0.05) {
            AudioEngine.playThump();
            return 'HEART_PULSE';
        }

        // 4. Push Apart (Explode)
        if (dHands > 0.7) { State.isExploded = true; return 'EXPLODE'; }
        else { State.isExploded = false; }

        // 5. The Clap (Shutdown)
        if (dHands < 0.1) return 'SHUTDOWN';
    }
    return g1;
}

// --- INITIALIZE ---
document.getElementById('start-btn').addEventListener('click', async () => {
    AudioEngine.init();
    document.getElementById('start-overlay').style.display = 'none';
    Visuals.init();
    Visuals.animate();

    const hands = new Hands({locateFile: (f) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${f}`});
    hands.setOptions({ maxNumHands: 2, modelComplexity: 1, minDetectionConfidence: 0.75 });

    hands.onResults(res => {
        const h = res.multiHandLandmarks || [];
        if (h.length > 0) {
            const mainGesture = analyzeGestures(h[0], h[1] || null);
            document.getElementById('subtitle-box').innerText = mainGesture;
            if (mainGesture !== 'IDLE') AudioEngine.playHum(200 + (State.zoom * 100));
        }
    });

    const video = document.getElementById('video-input');
    const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: "user", width: 640, height: 480 } 
    });
    video.srcObject = stream;
    video.play();

    const process = async () => {
        await hands.send({image: video});
        requestAnimationFrame(process);
    };
    process();
});

window.addEventListener('resize', () => {
    Visuals.camera.aspect = window.innerWidth / window.innerHeight;
    Visuals.camera.updateProjectionMatrix();
    Visuals.renderer.setSize(window.innerWidth, window.innerHeight);
});
