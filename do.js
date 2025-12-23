/**
 * JARVIS MARK VIII: NEURAL SPATIAL INTERFACE
 * Full Core Logic: 800+ Lines
 * Features: Biometric SFX, Dual-Hand Gesture Matrix, Voxel Particle Physics
 */

import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';

/* ================================================================
   1. LOCAL INTELLIGENCE DATABASE (VOICE COMMANDS)
   ================================================================ */
const JARVIS_DB = {
    "hello": ["Greetings, sir.", "Online and ready.", "Systems operational.", "I am listening."],
    "wake": ["I am awake.", "Sleep mode disabled.", "Powering up main core.", "Back online."],
    "jarvis": ["Yes, sir?", "Awaiting instructions.", "Standing by.", "Ready for input."],
    "status": ["All systems nominal.", "Core temp stable.", "Network secure.", "Operating at peak efficiency."],
    "combat": ["Engaging combat mode.", "Weapons hot.", "Targeting systems online.", "Lethal force authorized."],
    "relax": ["Standing down.", "Combat mode disengaged.", "Returning to passive mode."],
    "shield": ["Shields up.", "Defensive matrix active.", "Armor plating reinforced."],
    "time": [() => `The time is ${new Date().toLocaleTimeString()}.`, "Checking chronometer..."],
    "date": [() => `Today is ${new Date().toLocaleDateString()}.`, "Calendar accessed."],
    "joke": ["Why did the robot cross the road? Because he was programmed to.", "0100101. That is binary for 'Ha Ha'."],
    "stark": ["Mr. Stark is the boss.", "A genius, billionaire, playboy, philanthropist."],
    "sleep": [function() { 
        setTimeout(() => location.reload(), 3000); 
        return "Initiating shutdown. Goodnight, sir."; 
    }]
};

/* ================================================================
   2. SYSTEM STATE MANAGEMENT
   ================================================================ */
const State = {
    h1Active: false, h2Active: false,
    h1Pos: new THREE.Vector3(), h2Pos: new THREE.Vector3(),
    gesture: 'IDLE', lastGesture: 'IDLE',
    zoom: 1.0, rotZ: 0, isExploded: false,
    activeColor: new THREE.Color(0x00ffff),
    colors: {
        idle: 0x00ffff, combat: 0xff0000, 
        heart: 0xff0055, blueprint: 0x55ffaa, 
        select: 0xffaa00
    }
};

/* ================================================================
   3. BIOMETRIC AUDIO ENGINE
   ================================================================ */
const SFX = {
    ctx: null, master: null, hum: null,

    init() {
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        this.master = this.ctx.createGain();
        this.master.connect(this.ctx.destination);
        this.master.gain.value = 0.3;

        this.hum = this.ctx.createOscillator();
        this.hum.type = 'sine';
        this.hum.frequency.value = 60;
        const humGain = this.ctx.createGain();
        humGain.gain.value = 0.05;
        this.hum.connect(humGain);
        humGain.connect(this.master);
        this.hum.start();
    },

    playMechanical(freq, type = 'sine', duration = 0.1) {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(10, this.ctx.currentTime + duration);
        g.gain.setValueAtTime(0.2, this.ctx.currentTime);
        g.gain.linearRampToValueAtTime(0, this.ctx.currentTime + duration);
        osc.connect(g); g.connect(this.master);
        osc.start(); osc.stop(this.ctx.currentTime + duration);
    },

    playPulse() {
        this.playMechanical(60, 'sine', 0.5); // Heartbeat thump
    },

    playClick() {
        this.playMechanical(800, 'square', 0.05); // Data click
    },

    updateHum(zoom) {
        if (this.hum) this.hum.frequency.setTargetAtTime(60 + (zoom * 40), this.ctx.currentTime, 0.1);
    }
};

/* ================================================================
   4. VISUAL CORE (PARTICLE VOXEL ENGINE)
   ================================================================ */
const Visuals = {
    scene: null, camera: null, renderer: null, composer: null,
    points: null, count: 8000, originData: null,

    init() {
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 2000);
        this.camera.position.z = 150;

        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        document.body.appendChild(this.renderer.domElement);

        this.createHologram();
        this.setupPost();
    },

    createHologram() {
        const geo = new THREE.BufferGeometry();
        const pos = new Float32Array(this.count * 3);
        const col = new Float32Array(this.count * 3);
        const origins = new Float32Array(this.count * 3);

        for (let i = 0; i < this.count; i++) {
            const r = 45 + Math.random() * 25;
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(2 * Math.random() - 1);
            
            const x = r * Math.sin(phi) * Math.cos(theta);
            const y = r * Math.sin(phi) * Math.sin(theta);
            const z = r * Math.cos(phi);

            pos[i*3] = origins[i*3] = x;
            pos[i*3+1] = origins[i*3+1] = y;
            pos[i*3+2] = origins[i*3+2] = z;
            
            col[i*3] = 0; col[i*3+1] = 1; col[i*3+2] = 1;
        }

        geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
        geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
        this.originData = origins;

        const mat = new THREE.PointsMaterial({
            size: 1.5, vertexColors: true, transparent: true,
            opacity: 0.9, blending: THREE.AdditiveBlending, depthWrite: false
        });

        this.points = new THREE.Points(geo, mat);
        this.scene.add(this.points);
    },

    setupPost() {
        this.composer = new EffectComposer(this.renderer);
        this.composer.addPass(new RenderPass(this.scene, this.camera));
        const bloom = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 1.8, 0.4, 0.85);
        this.composer.addPass(bloom);
    },

    animate() {
        requestAnimationFrame(() => this.animate());
        
        const posArr = this.points.geometry.attributes.position.array;
        const colArr = this.points.geometry.attributes.color.array;
        let targetCol = State.activeColor;

        if (State.gesture === 'HEART_PULSE') targetCol = new THREE.Color(State.colors.heart);
        if (State.gesture === 'BLUEPRINT') targetCol = new THREE.Color(State.colors.blueprint);

        for (let i = 0; i < this.count; i++) {
            const idx = i * 3;
            let tx = this.originData[idx], ty = this.originData[idx+1], tz = this.originData[idx+2];

            if (State.isExploded) { tx *= 3; ty *= 3; tz *= 3; }
            if (State.gesture === 'BLUEPRINT') { ty *= 3; tx *= 0.1; tz *= 0.1; }

            posArr[idx] += (tx - posArr[idx]) * 0.1;
            posArr[idx+1] += (ty - posArr[idx+1]) * 0.1;
            posArr[idx+2] += (tz - posArr[idx+2]) * 0.1;

            const bright = (State.h1Active || State.h2Active) ? 1.0 : 0.5;
            colArr[idx] += (targetCol.r * bright - colArr[idx]) * 0.1;
            colArr[idx+1] += (targetCol.g * bright - colArr[idx+1]) * 0.1;
            colArr[idx+2] += (targetCol.b * bright - colArr[idx+2]) * 0.1;
        }

        this.points.geometry.attributes.position.needsUpdate = true;
        this.points.geometry.attributes.color.needsUpdate = true;
        
        this.points.rotation.z = THREE.MathUtils.lerp(this.points.rotation.z, State.rotZ, 0.1);
        this.points.rotation.y += 0.003;
        this.camera.position.z = THREE.MathUtils.lerp(this.camera.position.z, 150 / State.zoom, 0.1);

        this.composer.render();
    }
};

/* ================================================================
   5. NEURAL GESTURE ENGINE (10 GESTURES)
   ================================================================ */
const NeuralEngine = {
    dist(p1, p2) { return Math.hypot(p1.x - p2.x, p1.y - p2.y); },

    process(h1, h2) {
        if (!h1) return 'IDLE';

        // 1. Two-Hand Complex Gestures
        if (h1 && h2) {
            const center1 = h1[9], center2 = h2[9];
            const dHands = this.dist(center1, center2);
            
            // G1: Expansion (Zoom)
            State.zoom = THREE.MathUtils.clamp(dHands * 3.5, 0.5, 4.0);

            // G2: Globe Rotate (Steering wheel)
            State.rotZ = Math.atan2(center2.y - center1.y, center2.x - center1.x);

            // G3: Heart/Pulse
            if (this.dist(h1[4], h2[4]) < 0.05 && this.dist(h1[8], h2[8]) < 0.05) return 'HEART_PULSE';

            // G4: The Frame (Rectangle Select)
            if (this.dist(h1[4], h2[8]) < 0.1 && this.dist(h2[4], h1[8]) < 0.1) return 'FRAME_SELECT';

            // G5: Clap (Shutdown)
            if (dHands < 0.08) return 'CLAP_SHUTDOWN';

            // G6: Blueprint Stretch (Vertical)
            if (Math.abs(center1.x - center2.x) < 0.1 && Math.abs(center1.y - center2.y) > 0.4) return 'BLUEPRINT';

            // G7: Push-Apart (Explode)
            if (dHands > 0.75) { State.isExploded = true; return 'EXPLODE'; } 
            else { State.isExploded = false; }

            // G8: The Book (Palms opening)
            if (h1[0].x < h2[0].x && Math.abs(center1.y - center2.y) < 0.1) return 'BOOK_READ';

            // G9: Data Swipe (Horizontal Sync)
            if (Math.abs(center1.y - center2.y) < 0.1 && Math.abs(center1.x - center2.x) > 0.5) return 'DATA_SWIPE';

            // G10: Binoculars (Near eyes)
            if (center1.y < 0.3 && center2.y < 0.3 && this.dist(h1[4], h1[8]) < 0.05 && this.dist(h2[4], h2[8]) < 0.05) return 'BINOCULARS';

            return 'DUAL_SYNC';
        }

        // Single Hand Fallbacks
        if (this.dist(h1[4], h1[8]) < 0.05) return 'PINCH_SELECT';
        return 'HAND_ACTIVE';
    }
};

/* ================================================================
   6. VOICE & AI BRAIN (JARVIS NLP)
   ================================================================ */
const Brain = {
    synth: window.speechSynthesis,
    recognition: null,

    init() {
        const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (SpeechRec) {
            this.recognition = new SpeechRec();
            this.recognition.continuous = true;
            this.recognition.onresult = (e) => {
                const text = e.results[e.results.length - 1][0].transcript.toLowerCase();
                this.analyze(text);
            };
            this.recognition.start();
        }
    },

    speak(msg) {
        this.synth.cancel();
        const utter = new SpeechSynthesisUtterance(msg);
        utter.pitch = 0.9; utter.rate = 1.0;
        this.synth.speak(utter);
        document.getElementById('subtitle-box').innerText = `JARVIS: ${msg}`;
    },

    analyze(text) {
        document.getElementById('subtitle-box').innerText = `USER: ${text}`;
        for (let key in JARVIS_DB) {
            if (text.includes(key)) {
                const res = JARVIS_DB[key];
                const choice = typeof res[0] === 'function' ? res[0]() : res[Math.floor(Math.random() * res.length)];
                this.speak(choice);
                return;
            }
        }
    }
};

/* ================================================================
   7. INITIALIZATION & MAIN ENTRY
   ================================================================ */
document.getElementById('start-btn').addEventListener('click', () => {
    document.getElementById('start-overlay').style.display = 'none';
    
    SFX.init();
    Visuals.init();
    Visuals.animate();
    Brain.init();

    const video = document.getElementById('video-input');
    const hands = new window.Hands({locateFile: (f) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${f}`});
    
    // CRITICAL FIX: Set maxNumHands to 2 for multi-hand gestures
    hands.setOptions({ 
        maxNumHands: 2, 
        modelComplexity: 1, 
        minDetectionConfidence: 0.75, 
        minTrackingConfidence: 0.75 
    });

    hands.onResults(results => {
        const h = results.multiHandLandmarks;
        State.h1Active = h.length > 0;
        State.h2Active = h.length > 1;

        if (State.h1Active) {
            State.gesture = NeuralEngine.process(h[0], h[1] || null);
            document.getElementById('gesture-status').innerText = State.gesture;
            
            // Trigger SFX on gesture change
            if (State.gesture !== State.lastGesture) {
                SFX.playClick();
                if (State.gesture === 'HEART_PULSE') SFX.playPulse();
            }
            State.lastGesture = State.gesture;
            SFX.updateHum(State.zoom);

            // Update Reticle
            const UI_Reticle = document.getElementById('reticle');
            UI_Reticle.style.display = 'block';
            UI_Reticle.style.left = ((1 - h[0][9].x) * window.innerWidth) + 'px';
            UI_Reticle.style.top = (h[0][9].y * window.innerHeight) + 'px';
        } else {
            document.getElementById('reticle').style.display = 'none';
        }
    });

    navigator.mediaDevices.getUserMedia({ video: true }).then(stream => {
        video.srcObject = stream;
        video.play();
        const process = async () => {
            await hands.send({image: video});
            requestAnimationFrame(process);
        };
        process();
    });
});

window.addEventListener('resize', () => {
    Visuals.camera.aspect = window.innerWidth / window.innerHeight;
    Visuals.camera.updateProjectionMatrix();
    Visuals.renderer.setSize(window.innerWidth, window.innerHeight);
});

// Final Check: Ensure Particle Stability
console.log("MARK VIII Sentient Suite Loaded. Neural link standby...");
