import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';

const State = {
    gesture: 'IDLE', lastGesture: 'IDLE',
    rotZ: 0, isExploded: false,
    handPos: { x: 0.5, y: 0.5 },
    particles: { count: 12000 },
    audio: { analyser: null, dataArray: null, active: false },
    // PERSISTENT CONTROLS
    manualZoom: 180,
    activeHue: 0.5,
    rainbowMode: false
};

const SoundEngine = {
    playStartup() {
        const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3'); 
        audio.volume = 0.4;
        audio.play().catch(e => console.log("Audio play blocked."));
        const msg = new SpeechSynthesisUtterance("Neural Link Established. Performance mode active.");
        msg.rate = 1.0; msg.pitch = 0.8;
        window.speechSynthesis.speak(msg);
    }
};

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
        this.camera.position.z = State.manualZoom;

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

        let targetCol = new THREE.Color().setHSL(State.activeHue, 1.0, 0.5);

        // OPTIMIZED SPEEDS
        const physicsSpeed = 0.15; 
        const colorSpeed = 0.2; 

        for (let i = 0; i < State.particles.count; i++) {
            const idx = i * 3;
            let tx = this.originData[idx], ty = this.originData[idx+1], tz = this.originData[idx+2];

            if (State.gesture === 'HEART_SYNC') {
                const t = (i / State.particles.count) * Math.PI * 2;
                tx = 16 * Math.pow(Math.sin(t), 3) * 4;
                ty = (13 * Math.cos(t) - 5 * Math.cos(2*t) - 2 * Math.cos(3*t) - Math.cos(4*t)) * 4;
                const heartBeat = 1.0 + Math.pow(Math.sin(Date.now() * 0.006), 12) * 0.25;
                tx *= heartBeat; ty *= heartBeat;
            } 
            else if (State.gesture === 'FIST_CLOSED') { tx *= 0.1; ty *= 0.1; tz *= 0.1; } 
            else if (State.gesture === 'PALM_OPEN') {
                tx = this.originData[idx]; ty = this.originData[idx+1]; tz = this.originData[idx+2];
                this.points.rotation.y = THREE.MathUtils.lerp(this.points.rotation.y, -(State.handPos.x - 0.5) * 5, 0.15);
                this.points.rotation.x = THREE.MathUtils.lerp(this.points.rotation.x, (State.handPos.y - 0.5) * 5, 0.15);
            }

            pAttr[idx] += (tx - pAttr[idx]) * physicsSpeed;
            pAttr[idx+1] += (ty - pAttr[idx+1]) * physicsSpeed;
            pAttr[idx+2] += (tz - pAttr[idx+2]) * physicsSpeed;

            if (State.rainbowMode) {
                const pCol = new THREE.Color().setHSL((i / State.particles.count) + (Date.now() * 0.0005), 0.9, 0.5);
                cAttr[idx] += (pCol.r - cAttr[idx]) * colorSpeed;
                cAttr[idx+1] += (pCol.g - cAttr[idx+1]) * colorSpeed;
                cAttr[idx+2] += (pCol.b - cAttr[idx+2]) * colorSpeed;
            } else {
                cAttr[idx] += (targetCol.r - cAttr[idx]) * colorSpeed;
                cAttr[idx+1] += (targetCol.g - cAttr[idx+1]) * colorSpeed;
                cAttr[idx+2] += (targetCol.b - cAttr[idx+2]) * colorSpeed;
            }
        }

        this.points.geometry.attributes.position.needsUpdate = true;
        this.points.geometry.attributes.color.needsUpdate = true;
        
        if (State.gesture !== 'PALM_OPEN') this.points.rotation.y += 0.006 + (bass * 0.06);
        
        this.camera.position.z = THREE.MathUtils.lerp(this.camera.position.z, State.manualZoom, 0.15);
        this.composer.render();
    }
};

const NeuralEngine = {
    dist(a, b) { return Math.hypot(a.x - b.x, a.y - b.y); },
    detectHand(lm) {
        const d = (i, j) => this.dist(lm[i], lm[j]);
        const iE = d(8, 0) > d(6, 0); const mE = d(12, 0) > d(10, 0); 
        const rE = d(16, 0) > d(14, 0); const pE = d(20, 0) > d(18, 0);

        if (d(4, 8) < 0.04) { State.rainbowMode = true; return "RAINBOW_MODE"; }

        if (iE && mE && rE && !pE) { 
            State.rainbowMode = false;
            State.activeHue = (State.activeHue + 0.012) % 1.0; 
            return "COLOR_CYCLE"; 
        }

        if (iE && mE && rE && pE) return "PALM_OPEN"; 
        if (!iE && !mE && !rE && !pE) return "FIST_CLOSED";
        return "TRACKING";
    },

    processTwoHands(h1, h2) {
        const d = (a, b) => this.dist(a, b);
        const centerDist = d(h1[9], h2[9]);
        
        if (centerDist > 0.55) State.manualZoom -= (centerDist * 25); 
        if (centerDist < 0.35) State.manualZoom += ((0.5 - centerDist) * 30);

        State.manualZoom = THREE.MathUtils.clamp(State.manualZoom, 35, 800);

        if (d(h1[8], h2[8]) < 0.08 && d(h1[4], h2[4]) < 0.08) return "HEART_SYNC";
        return "DUAL_NAV";
    }
};

document.getElementById('start-btn').addEventListener('click', () => {
    document.getElementById('start-overlay').style.display = 'none';
    SoundEngine.playStartup();
    AudioEngine.init();
    Engine3D.init();
    Engine3D.render();

    const hands = new window.Hands({locateFile: (f) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${f}`});
    hands.setOptions({ maxNumHands: 2, modelComplexity: 1, minDetectionConfidence: 0.8, minTrackingConfidence: 0.8 });

    hands.onResults(res => {
        const h = res.multiHandLandmarks;
        if (h.length > 0) {
            State.handPos.x = h[0][9].x;
            State.handPos.y = h[0][9].y;
            State.gesture = h.length > 1 ? NeuralEngine.processTwoHands(h[0], h[1]) : NeuralEngine.detectHand(h[0]);
            document.getElementById('subtitle-box').innerText = "SYSTEM: " + State.gesture;
        }
    });

    const camera = new window.Camera(document.getElementById('video-input'), {
        onFrame: async () => { await hands.send({image: document.getElementById('video-input')}); },
        width: 640, height: 480
    });
    camera.start();
});
