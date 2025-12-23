import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';

/* ================================================================
   LOCAL INTELLIGENCE DATABASE
   ================================================================
*/
const LOCAL_DB = {
    // --- CORE INTERACTIONS ---
    "hello": ["Greetings, sir.", "Online and ready.", "At your service.", "System active."],
    "jarvis": ["Yes, sir?", "Awaiting instructions.", "I am here.", "Standing by."],
    "bye": ["Goodbye, sir.", "Session terminated.", "Powering down."],

    // --- SYSTEM STATUS ---
    "status": ["All systems nominal.", "Battery at 100%.", "Network secure. Visuals active."],
    "system": ["Core logic at 98% efficiency.", "Memory banks clean.", "Processor optimal."],

    // --- COMBAT & DEFENSE (TRIGGERS) ---
    "combat": [() => toggleCombat(true), "Engaging combat mode.", "Weapons hot.", "Lethal force authorized."],
    "kill": [() => toggleCombat(true), "Termination protocols engaged.", "Acquiring targets."],
    "attack": [() => toggleCombat(true), "Engaging hostiles.", "Suppressive fire initiated."],
    
    "relax": [() => toggleCombat(false), "Standing down.", "Combat mode disengaged.", "Returning to passive mode."],
    "stop": [() => toggleCombat(false), "Freezing motor functions.", "Halted.", "Paused."],

    // --- POP CULTURE ---
    "stark": ["Mr. Stark is the boss.", "Genius, billionaire, playboy, philanthropist."],
    "iron man": ["The suit is polished and ready.", "Mark 85 is my favorite."],
    "avengers": ["Assemble.", "Earth's mightiest heroes."]
};

// --- GLOBAL STATE ---
const State = {
    handActive: false,
    handPos: new THREE.Vector3(0,0,0),
    gesture: 'IDLE', 
    combatMode: false, // The Master Switch
    voiceActive: false
};

// --- DOM ELEMENTS ---
const UI = {
    micStatus: document.getElementById('voice-status'),
    gestureStatus: document.getElementById('gesture-status'),
    aiStatus: document.getElementById('ai-status'),
    subtitles: document.getElementById('subtitle-box'),
    reticle: document.getElementById('reticle'),
    overlay: document.getElementById('start-overlay'),
    body: document.body
};

// --- HELPER: TOGGLE COMBAT ---
function toggleCombat(isActive) {
    State.combatMode = isActive;
    if (isActive) {
        SFX.trigger('combat'); // Play Siren
        UI.body.classList.add('combat');
        UI.subtitles.style.color = "#ff0000";
        UI.reticle.style.borderColor = "#ff0000";
    } else {
        SFX.trigger('relax'); // Play Power Down
        UI.body.classList.remove('combat');
        UI.subtitles.style.color = "#00ffff";
        UI.reticle.style.borderColor = "#00ffff";
    }
    return isActive ? "Combat Mode Engaged." : "Systems Normalized.";
}

/* ================================================================
   ADVANCED AUDIO ENGINE (PROCEDURAL SCIFI SOUNDS)
   ================================================================
*/
const SFX = {
    ctx: null, gain: null,

    init: function() {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        this.ctx = new AudioContext();
        this.gain = this.ctx.createGain();
        this.gain.connect(this.ctx.destination);
        this.gain.gain.value = 0.3;
    },

    // Generates specific sounds based on type
    trigger: function(type) {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        osc.connect(g);
        g.connect(this.ctx.destination);
        
        const now = this.ctx.currentTime;

        if (type === 'combat') {
            // RED ALERT SIREN
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(200, now);
            osc.frequency.linearRampToValueAtTime(800, now + 0.5);
            osc.frequency.linearRampToValueAtTime(200, now + 1.0);
            g.gain.setValueAtTime(0.5, now);
            g.gain.exponentialRampToValueAtTime(0.01, now + 1.0);
            osc.start(now);
            osc.stop(now + 1.0);
        } 
        else if (type === 'relax') {
            // POWER DOWN
            osc.type = 'sine';
            osc.frequency.setValueAtTime(800, now);
            osc.frequency.exponentialRampToValueAtTime(50, now + 1.5);
            g.gain.setValueAtTime(0.5, now);
            g.gain.linearRampToValueAtTime(0, now + 1.5);
            osc.start(now);
            osc.stop(now + 1.5);
        }
        else if (type === 'blast') {
            // LASER SHOT
            osc.type = 'square';
            osc.frequency.setValueAtTime(800, now);
            osc.frequency.exponentialRampToValueAtTime(100, now + 0.2);
            g.gain.setValueAtTime(0.3, now);
            g.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
            osc.start(now);
            osc.stop(now + 0.2);
        }
        else if (type === 'gravity') {
            // LOW HUM
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(60, now);
            g.gain.setValueAtTime(0.5, now);
            g.gain.linearRampToValueAtTime(0, now + 0.5);
            osc.start(now);
            osc.stop(now + 0.5);
        }
        else if (type === 'scan') {
            // COMPUTING BLEEPS
            osc.type = 'sine';
            osc.frequency.setValueAtTime(1200, now);
            osc.frequency.setValueAtTime(1500, now + 0.05);
            g.gain.setValueAtTime(0.1, now);
            g.gain.linearRampToValueAtTime(0, now + 0.1);
            osc.start(now);
            osc.stop(now + 0.1);
        }
    },

    // Continuous loop handler (replaces old update)
    currentGesture: 'IDLE',
    update: function(gesture) {
        if (gesture !== this.currentGesture) {
            this.currentGesture = gesture;
            // Trigger One-Shot sounds on gesture change
            if (gesture === 'BLAST') this.trigger('blast');
            if (gesture === 'GRAVITY') this.trigger('gravity');
            if (gesture === 'POINT') this.trigger('scan');
            if (gesture === 'PINCH') this.trigger('scan');
        }
    }
};

/* ================================================================
   AI BRAIN
   ================================================================
*/
const Brain = {
    synth: window.speechSynthesis,
    recognition: null,

    init: function() {
        UI.aiStatus.innerText = "BRAIN: LOCAL CORE";
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (SpeechRecognition) {
            this.recognition = new SpeechRecognition();
            this.recognition.continuous = true;
            this.recognition.lang = 'en-US';
            this.recognition.interimResults = false;

            this.recognition.onstart = () => UI.micStatus.innerText = "ONLINE";
            this.recognition.onend = () => { setTimeout(() => { try{this.recognition.start();}catch(e){} }, 1000); };
            this.recognition.onresult = (e) => {
                const transcript = e.results[e.results.length-1][0].transcript;
                this.processInput(transcript);
            };
            try { this.recognition.start(); } catch(e) {}
        }
    },

    speak: function(text) {
        if (this.synth.speaking) this.synth.cancel();
        const utter = new SpeechSynthesisUtterance(text);
        utter.pitch = State.combatMode ? 0.6 : 1.0; // Deeper voice in combat
        utter.rate = 1.1; 
        const voices = this.synth.getVoices();
        const v = voices.find(v => v.name.includes('Google UK English Male') || v.name.includes('Daniel'));
        if(v) utter.voice = v;
        this.synth.speak(utter);
        UI.subtitles.innerText = `JARVIS: ${text}`;
    },

    processInput: function(rawText) {
        const text = rawText.toLowerCase().trim();
        UI.subtitles.innerText = `YOU: ${text}`;
        
        let found = false;
        const keys = Object.keys(LOCAL_DB);
        
        for (let i = 0; i < keys.length; i++) {
            const key = keys[i];
            if (text.includes(key)) {
                const options = LOCAL_DB[key];
                const selected = options[Math.floor(Math.random() * options.length)];
                
                if (typeof selected === 'function') {
                    this.speak(selected()); // Execute function (like toggleCombat)
                } else {
                    this.speak(selected);
                }
                found = true;
                break;
            }
        }
        if (!found) this.speak("Processing data.");
    }
};

/* ================================================================
   VISUAL CORE (THREE.JS)
   ================================================================
*/
const Visuals = {
    scene: null, camera: null, renderer: null, composer: null,
    particles: null, particleGeo: null,
    lastHandX: 0,
    
    init: function() {
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 1000);
        this.camera.position.z = 80;

        this.renderer = new THREE.WebGLRenderer({ antialias: false, powerPreference: "high-performance" });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        document.body.appendChild(this.renderer.domElement);

        const renderScene = new RenderPass(this.scene, this.camera);
        const bloom = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 1.5, 0.4, 0.85);
        this.composer = new EffectComposer(this.renderer);
        this.composer.addPass(renderScene);
        this.composer.addPass(bloom);

        this.createParticles();
    },

    createParticles: function() {
        this.count = 4000; 
        const positions = new Float32Array(this.count * 3);
        const velocities = new Float32Array(this.count * 3);
        const origins = new Float32Array(this.count * 3);
        const colors = new Float32Array(this.count * 3);
        const colorBase = new THREE.Color(0x00ffff);

        for(let i=0; i<this.count; i++) {
            const r = 30 + Math.random() * 60;
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(2 * Math.random() - 1);
            const x = r * Math.sin(phi) * Math.cos(theta);
            const y = r * Math.sin(phi) * Math.sin(theta);
            const z = r * Math.cos(phi);

            positions[i*3] = x; positions[i*3+1] = y; positions[i*3+2] = z;
            origins[i*3] = x; origins[i*3+1] = y; origins[i*3+2] = z;
            colors[i*3] = colorBase.r; colors[i*3+1] = colorBase.g; colors[i*3+2] = colorBase.b;
        }

        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        const tex = new THREE.TextureLoader().load('https://threejs.org/examples/textures/sprites/spark1.png');
        const mat = new THREE.PointsMaterial({ size: 0.8, map: tex, vertexColors: true, transparent: true, opacity: 0.8, blending: THREE.AdditiveBlending, depthWrite: false });

        this.particles = new THREE.Points(geometry, mat);
        this.particleGeo = geometry;
        this.scene.add(this.particles);
        this.origins = origins;
        this.velocities = velocities;
    },

    animate: function() {
        requestAnimationFrame(this.animate.bind(this));
        
        const pos = this.particleGeo.attributes.position.array;
        const col = this.particleGeo.attributes.color.array;
        const handX = State.handPos.x;
        const handY = State.handPos.y;
        
        // --- COLOR MANAGEMENT (COMBAT vs PEACE) ---
        // Smoothly lerp colors based on State.combatMode
        let tr, tg, tb;
        if (State.combatMode) {
             tr = 1.0; tg = 0.0; tb = 0.0; // RED
             this.scene.rotation.y += 0.02; // Spin Fast
        } else {
             tr = 0.0; tg = 1.0; tb = 1.0; // CYAN
             this.scene.rotation.y += 0.002; // Spin Slow
        }

        for(let i=0; i<this.count; i++) {
            const idx = i*3;
            // Smooth Color Transition
            col[idx]   += (tr - col[idx]) * 0.05;
            col[idx+1] += (tg - col[idx+1]) * 0.05;
            col[idx+2] += (tb - col[idx+2]) * 0.05;

            // Physics & Gestures
            let px = pos[idx], py = pos[idx+1], pz = pos[idx+2];
            let vx = this.velocities[idx], vy = this.velocities[idx+1], vz = this.velocities[idx+2];

            vx += (this.origins[idx] - px) * 0.02;
            vy += (this.origins[idx+1] - py) * 0.02;
            vz += (this.origins[idx+2] - pz) * 0.02;

            if(State.handActive) {
                const dx = px - handX, dy = py - handY;
                const distSq = dx*dx + dy*dy;

                if (State.gesture === 'BLAST' && distSq < 3600) {
                     const f = 800 / (Math.sqrt(distSq) + 1);
                     vx += (dx)*f*0.01; vy += (dy)*f*0.01;
                     col[idx]=1; col[idx+1]=1; col[idx+2]=1; // Flash White
                } 
                else if (State.gesture === 'GRAVITY' && distSq < 10000) {
                     vx -= (dx)*0.01; vy -= (dy)*0.01;
                }
            }

            vx *= 0.9; vy *= 0.9; vz *= 0.9;
            pos[idx] = px + vx; pos[idx+1] = py + vy; pos[idx+2] = pz + vz;
            this.velocities[idx] = vx; this.velocities[idx+1] = vy; this.velocities[idx+2] = vz;
        }

        this.particleGeo.attributes.position.needsUpdate = true;
        this.particleGeo.attributes.color.needsUpdate = true;
        this.composer.render();
    }
};

// --- GESTURES & INIT ---
function detectGesture(lm) {
    const dist = (i, j) => Math.hypot(lm[i].x - lm[j].x, lm[i].y - lm[j].y);
    if (dist(4, 8) < 0.05) return 'PINCH';
    const tipsOpen = (dist(8,0)+dist(12,0)+dist(16,0)+dist(20,0))/4;
    if (tipsOpen < 0.25) return 'GRAVITY';
    if (dist(8,0) > dist(5,0) && dist(12,0) < dist(9,0)) return 'POINT';
    return 'BLAST';
}

function updateHUD(gesture) {
    document.querySelectorAll('.cmd-item').forEach(el => el.classList.remove('cmd-active'));
    if(gesture === 'BLAST') document.getElementById('cmd-palm').classList.add('cmd-active');
    if(gesture === 'GRAVITY') document.getElementById('cmd-fist').classList.add('cmd-active');
    UI.gestureStatus.innerText = gesture;
}

document.getElementById('start-btn').addEventListener('click', () => {
    UI.overlay.style.display = 'none';
    SFX.init();
    Brain.init();
    Visuals.init();
    Visuals.animate();

    const video = document.getElementById('video-input');
    const hands = new window.Hands({locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`});
    hands.setOptions({ maxNumHands: 1, modelComplexity: 1 });
    hands.onResults(results => {
        if (results.multiHandLandmarks.length > 0) {
            State.handActive = true;
            const lm = results.multiHandLandmarks[0];
            State.handPos.set((0.5 - lm[9].x) * 160, (0.5 - lm[9].y) * 100, 0);
            
            UI.reticle.style.display = 'block';
            UI.reticle.style.left = ((1 - lm[9].x) * window.innerWidth) + 'px';
            UI.reticle.style.top = (lm[9].y * window.innerHeight) + 'px';

            State.gesture = detectGesture(lm);
            updateHUD(State.gesture);
        } else {
            State.handActive = false;
            State.gesture = 'IDLE';
            UI.reticle.style.display = 'none';
        }
        SFX.update(State.gesture);
    });

    navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480 } }).then(stream => {
        video.srcObject = stream;
        video.play();
        const process = async () => { if (video.readyState >= 2) await hands.send({image: video}); requestAnimationFrame(process); };
        process();
    });
});

window.addEventListener('resize', () => {
    if(Visuals.camera) {
        Visuals.camera.aspect = window.innerWidth / window.innerHeight;
        Visuals.camera.updateProjectionMatrix();
        Visuals.renderer.setSize(window.innerWidth, window.innerHeight);
    }
});
