import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';

/* ==========================================================================
   1. LOCAL INTELLIGENCE DATABASE (EXPANDED)
   ========================================================================== */
const LOCAL_DB = {
    // --- CORE ---
    "hello": ["Greetings, sir.", "Online and ready.", "Systems operational.", "I am listening."],
    "jarvis": ["Yes, sir?", "Awaiting instructions.", "Standing by.", "Ready for input."],
    "bye": ["Goodbye, sir.", "Session terminated.", "Powering down."],
    
    // --- STATUS ---
    "status": ["All systems nominal.", "Battery at 100%.", "Network secure.", "Visuals active."],
    "report": ["Atmosphere clear.", "Diagnostics green.", "No threats detected."],
    "system": ["Core logic efficient.", "Memory banks clean.", "Processor optimal."],

    // --- COMBAT MODES ---
    "combat": [() => toggleCombat(true), "Engaging combat mode.", "Weapons hot.", "Targeting systems online."],
    "kill": [() => toggleCombat(true), "Lethal force authorized.", "Acquiring targets."],
    "attack": [() => toggleCombat(true), "Engaging hostiles.", "Suppressive fire initiated."],
    "relax": [() => toggleCombat(false), "Standing down.", "Combat mode disengaged.", "Returning to passive."],
    "stop": [() => toggleCombat(false), "Freezing motor functions.", "Halted.", "Paused."],

    // --- UTILITIES ---
    "time": [() => `The time is ${new Date().toLocaleTimeString()}.`, "Checking chronometer."],
    "date": [() => `Today is ${new Date().toLocaleDateString()}.`, "Calendar accessed."],
    "upload": [() => KnowledgeBase.triggerUpload(), "Opening secure interface.", "Ready for data injection."],
    "read": [() => KnowledgeBase.triggerUpload(), "Select document for analysis."],

    // --- PERSONALITY ---
    "who": ["I am JARVIS. Just A Rather Very Intelligent System.", "I am your digital butler."],
    "stark": ["Mr. Stark is the boss.", "Genius, billionaire, playboy, philanthropist."],
    "iron man": ["The suit is polished and ready.", "Mark 85 is my favorite."],
    "avengers": ["Assemble.", "Earth's mightiest heroes."]
};

/* ==========================================================================
   2. GLOBAL STATE MANAGEMENT
   ========================================================================== */
const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

const State = {
    handActive: false,
    handPos: new THREE.Vector3(0, 0, 0),
    gesture: 'IDLE',
    combatMode: false,
    lastVoiceTime: 0,
    frameCount: 0
};

const UI = {
    micStatus: document.getElementById('voice-status'),
    gestureStatus: document.getElementById('gesture-status'),
    subtitles: document.getElementById('subtitle-box'),
    reticle: document.getElementById('reticle'),
    overlay: document.getElementById('start-overlay'),
    body: document.body
};

// Toggle Visual Mode
function toggleCombat(isActive) {
    State.combatMode = isActive;
    if (isActive) {
        UI.body.classList.add('combat');
        UI.subtitles.style.color = "#ff0000";
        UI.reticle.style.borderColor = "#ff0000";
        UI.reticle.style.boxShadow = "0 0 15px #ff0000";
        SFX.trigger('combat');
    } else {
        UI.body.classList.remove('combat');
        UI.subtitles.style.color = "#00ffff";
        UI.reticle.style.borderColor = "#00ffff";
        UI.reticle.style.boxShadow = "0 0 10px #00ffff";
        SFX.trigger('relax');
    }
    return isActive ? "Combat Mode Engaged." : "Systems Normalized.";
}

/* ==========================================================================
   3. PROCEDURAL AUDIO ENGINE (MATH-BASED SOUNDS)
   ========================================================================== */
const SFX = {
    ctx: null, gain: null, humOsc: null, 
    noiseNode: null, noiseGain: null,

    init: function() {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        this.ctx = new AudioContext();
        this.gain = this.ctx.createGain();
        this.gain.connect(this.ctx.destination);
        this.gain.gain.value = 0.3;

        // 1. Background Drone (Sci-Fi Hum)
        this.humOsc = this.ctx.createOscillator();
        this.humOsc.type = 'sawtooth';
        this.humOsc.frequency.value = 60;
        
        // Lowpass filter to make it hummy, not buzzy
        const humFilter = this.ctx.createBiquadFilter();
        humFilter.type = 'lowpass';
        humFilter.frequency.value = 120;
        
        this.humOsc.connect(humFilter);
        humFilter.connect(this.gain);
        this.humOsc.start();

        // 2. White Noise Engine (For blasts/wind)
        const bSize = this.ctx.sampleRate * 2;
        const b = this.ctx.createBuffer(1, bSize, this.ctx.sampleRate);
        const d = b.getChannelData(0);
        for(let i=0; i<bSize; i++) d[i] = Math.random() * 2 - 1;

        this.noiseNode = this.ctx.createBufferSource();
        this.noiseNode.buffer = b;
        this.noiseNode.loop = true;
        this.noiseGain = this.ctx.createGain();
        this.noiseGain.gain.value = 0; // Silent by default
        
        const noiseFilter = this.ctx.createBiquadFilter();
        noiseFilter.type = 'bandpass';
        noiseFilter.frequency.value = 1000;

        this.noiseNode.connect(noiseFilter);
        noiseFilter.connect(this.noiseGain);
        this.noiseGain.connect(this.gain);
        this.noiseNode.start();
    },

    trigger: function(type) {
        if(!this.ctx) return;
        const t = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        osc.connect(g);
        g.connect(this.ctx.destination);

        if(type === 'combat') {
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(100, t);
            osc.frequency.linearRampToValueAtTime(600, t+0.5);
            g.gain.setValueAtTime(0.5, t);
            g.gain.exponentialRampToValueAtTime(0.01, t+1.0);
            osc.start(t); osc.stop(t+1);
        } 
        else if (type === 'relax') {
            osc.type = 'sine';
            osc.frequency.setValueAtTime(600, t);
            osc.frequency.exponentialRampToValueAtTime(100, t+1.0);
            g.gain.linearRampToValueAtTime(0, t+1.0);
            osc.start(t); osc.stop(t+1);
        }
    },

    update: function(gesture) {
        if(!this.ctx) return;
        const t = this.ctx.currentTime;
        
        if (gesture === 'BLAST') {
            this.noiseGain.gain.setTargetAtTime(0.8, t, 0.1); // Wind noise up
            this.humOsc.frequency.setTargetAtTime(40, t, 0.2); // Hum drops
        } 
        else if (gesture === 'GRAVITY') {
            this.humOsc.frequency.setTargetAtTime(200, t, 0.1); // Hum rises (charging)
            this.noiseGain.gain.setTargetAtTime(0, t, 0.1);
        } 
        else if (gesture === 'CHAOS') {
            this.humOsc.frequency.setValueAtTime(50 + Math.random()*200, t); // Glitchy
        } 
        else {
            // Idle
            this.noiseGain.gain.setTargetAtTime(0, t, 0.2);
            this.humOsc.frequency.setTargetAtTime(60, t, 0.5);
        }
    }
};

/* ==========================================================================
   4. ADVANCED GESTURE RECOGNITION (VECTOR MATH)
   ========================================================================== */
function detectGesture(lm) {
    // Helper: Distance between two landmarks
    const dist = (a, b) => Math.hypot(lm[a].x - lm[b].x, lm[a].y - lm[b].y);
    
    // Finger States (Open vs Closed)
    // We check if the tip is higher/further than the middle joint relative to wrist
    const isFingerOpen = (tip, pip) => dist(tip, 0) > dist(pip, 0); 

    const indexOpen = isFingerOpen(8, 6);
    const middleOpen = isFingerOpen(12, 10);
    const ringOpen = isFingerOpen(16, 14);
    const pinkyOpen = isFingerOpen(20, 18);
    const thumbOpen = dist(4, 9) > 0.05; // Thumb is tricky, check dist to pinky base

    // 1. GRAVITY (FIST) -> All fingers closed
    if (!indexOpen && !middleOpen && !ringOpen && !pinkyOpen) return 'GRAVITY';

    // 2. BLAST (OPEN PALM) -> All fingers open
    if (indexOpen && middleOpen && ringOpen && pinkyOpen && thumbOpen) return 'BLAST';

    // 3. CHAOS (ROCK/DEVIL) -> Index & Pinky Open, Middle & Ring Closed
    if (indexOpen && !middleOpen && !ringOpen && pinkyOpen) return 'CHAOS';

    // 4. POINT (Index Only)
    if (indexOpen && !middleOpen && !ringOpen && !pinkyOpen) return 'POINT';

    // 5. PINCH (Index + Thumb close)
    if (dist(4, 8) < 0.05) return 'PINCH';

    // 6. VICTORY (Zoom In) -> Index & Middle Open
    if (indexOpen && middleOpen && !ringOpen && !pinkyOpen) return 'ZOOM_IN';

    // 7. THREE (Zoom Out) -> Index, Middle, Ring Open
    if (indexOpen && middleOpen && ringOpen && !pinkyOpen) return 'ZOOM_OUT';

    return 'IDLE';
}

function updateHUD(gesture) {
    // Reset all
    document.querySelectorAll('.cmd-item').forEach(el => el.classList.remove('cmd-active'));
    
    // Highlight active
    const map = {
        'BLAST': 'cmd-palm',
        'GRAVITY': 'cmd-fist',
        'CHAOS': 'cmd-rock',
        'PINCH': 'cmd-pinch',
        'POINT': 'cmd-point',
        'ZOOM_IN': 'cmd-victory',
        'ZOOM_OUT': 'cmd-three'
    };

    if(map[gesture]) document.getElementById(map[gesture]).classList.add('cmd-active');
    UI.gestureStatus.innerText = gesture;
}

/* ==========================================================================
   5. VISUAL CORE (HIGH FIDELITY PARTICLES)
   ========================================================================== */
const Visuals = {
    scene: null, camera: null, renderer: null, composer: null,
    particles: null, particleGeo: null, 
    count: isMobile ? 2500 : 6000, 
    knowledgeMap: {}, origins: null, velocities: null,

    init: function() {
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 1000);
        this.camera.position.z = 80;

        this.renderer = new THREE.WebGLRenderer({ antialias: false, powerPreference: "high-performance" });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        document.body.appendChild(this.renderer.domElement);

        // Post-Processing (Bloom)
        const renderScene = new RenderPass(this.scene, this.camera);
        const bloom = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 1.5, 0.4, 0.85);
        bloom.strength = 1.8;
        bloom.radius = 0.5;
        bloom.threshold = 0;

        this.composer = new EffectComposer(this.renderer);
        this.composer.addPass(renderScene);
        this.composer.addPass(bloom);

        this.createParticles();
    },

    createParticles: function() {
        const pos = new Float32Array(this.count * 3);
        const vel = new Float32Array(this.count * 3);
        const org = new Float32Array(this.count * 3);
        const col = new Float32Array(this.count * 3);
        
        const baseColor = new THREE.Color(0x00ffff);

        for(let i=0; i<this.count; i++) {
            // Create a spherical cloud distribution
            const r = 40 + Math.random() * 40;
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(2 * Math.random() - 1);
            
            const x = r * Math.sin(phi) * Math.cos(theta);
            const y = r * Math.sin(phi) * Math.sin(theta);
            const z = r * Math.cos(phi);

            pos[i*3] = x; pos[i*3+1] = y; pos[i*3+2] = z;
            org[i*3] = x; org[i*3+1] = y; org[i*3+2] = z;
            
            col[i*3] = baseColor.r; 
            col[i*3+1] = baseColor.g; 
            col[i*3+2] = baseColor.b;
        }

        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
        geo.setAttribute('color', new THREE.BufferAttribute(col, 3));

        // Create texture
        const tex = new THREE.TextureLoader().load('https://threejs.org/examples/textures/sprites/spark1.png');
        const mat = new THREE.PointsMaterial({ 
            size: isMobile ? 1.5 : 0.8, 
            map: tex, 
            vertexColors: true, 
            transparent: true, 
            opacity: 0.8, 
            blending: THREE.AdditiveBlending, 
            depthWrite: false 
        });

        this.particles = new THREE.Points(geo, mat);
        this.scene.add(this.particles);
        
        this.origins = org;
        this.velocities = vel;
        this.particleGeo = geo;
    },

    injectKnowledge: function(sentences) {
        this.knowledgeMap = {}; 
        const colors = this.particleGeo.attributes.color.array;
        const max = Math.min(sentences.length, this.count);
        for(let i=0; i<max; i++) {
            // Pick random particles to hold data
            const idx = Math.floor(Math.random() * this.count);
            this.knowledgeMap[idx] = sentences[i];
            
            // Turn them Gold
            colors[idx*3] = 1.0; 
            colors[idx*3+1] = 0.8; 
            colors[idx*3+2] = 0.0;
        }
        this.particleGeo.attributes.color.needsUpdate = true;
    },

    animate: function() {
        requestAnimationFrame(this.animate.bind(this));
        
        const positions = this.particleGeo.attributes.position.array;
        const colors = this.particleGeo.attributes.color.array;
        const hx = State.handPos.x;
        const hx_y = State.handPos.y;
        
        // --- 1. GLOBAL ROTATION ---
        // Spin faster in Combat Mode
        const rotSpeed = State.combatMode ? 0.015 : 0.002;
        this.scene.rotation.y += rotSpeed;

        // --- 2. DETERMINE TARGET COLOR ---
        // Combat = Red, Peace = Cyan
        let tr = 0, tg = 1, tb = 1;
        if(State.combatMode) { tr=1; tg=0; tb=0; }

        // --- 3. PHYSICS LOOP ---
        for(let i=0; i<this.count; i++) {
            const idx = i*3;
            let px = positions[idx];
            let py = positions[idx+1];
            let pz = positions[idx+2];
            
            // Current Velocity
            let vx = this.velocities[idx];
            let vy = this.velocities[idx+1];
            let vz = this.velocities[idx+2];

            // --- A. COLOR INTERPOLATION ---
            // Slowly morph color if not a knowledge node
            if(!this.knowledgeMap[i]) {
                colors[idx]   += (tr - colors[idx]) * 0.05;
                colors[idx+1] += (tg - colors[idx+1]) * 0.05;
                colors[idx+2] += (tb - colors[idx+2]) * 0.05;
            }

            // --- B. RETURN TO ORIGIN (Spring Force) ---
            const homeX = this.origins[idx];
            const homeY = this.origins[idx+1];
            const homeZ = this.origins[idx+2];

            vx += (homeX - px) * 0.02;
            vy += (homeY - py) * 0.02;
            vz += (homeZ - pz) * 0.02;

            // --- C. HAND INTERACTION ---
            if(State.handActive) {
                // Calculate distance to hand
                const dx = px - hx;
                const dy = py - hx_y;
                const distSq = dx*dx + dy*dy;
                const dist = Math.sqrt(distSq);

                // GESTURE 1: BLAST (Shockwave)
                if (State.gesture === 'BLAST') {
                    if(dist < 100) {
                        const force = 1500 / (dist + 5); // Explosive force
                        const angle = Math.atan2(dy, dx);
                        vx += Math.cos(angle) * force * 0.1;
                        vy += Math.sin(angle) * force * 0.1;
                        vz += 5; // Blow them towards camera
                        
                        // Flash White
                        if(!this.knowledgeMap[i]) { 
                            colors[idx]=1; colors[idx+1]=1; colors[idx+2]=1; 
                        }
                    }
                }
                
                // GESTURE 2: GRAVITY (Black Hole)
                else if (State.gesture === 'GRAVITY') {
                    if(dist < 250) {
                        const force = 5.0;
                        vx -= (dx / dist) * force;
                        vy -= (dy / dist) * force;
                        // Darken particles near center
                        if(!this.knowledgeMap[i]) { 
                            colors[idx]=0.2; colors[idx+1]=0; colors[idx+2]=0.5; 
                        }
                    }
                }

                // GESTURE 3: CHAOS (Glitch/Teleport)
                else if (State.gesture === 'CHAOS') {
                    // 2% chance per frame to teleport
                    if(Math.random() > 0.98) {
                        positions[idx]   += (Math.random()-0.5) * 50;
                        positions[idx+1] += (Math.random()-0.5) * 50;
                        // Turn Purple
                        if(!this.knowledgeMap[i]) { 
                            colors[idx]=1; colors[idx+1]=0; colors[idx+2]=1; 
                        }
                    }
                }

                // GESTURE 4: PINCH (Read Data)
                else if (State.gesture === 'PINCH') {
                    if(this.knowledgeMap[i] && dist < 30) {
                        UI.subtitles.innerText = `[DATA]: ${this.knowledgeMap[i]}`;
                        UI.subtitles.style.color = "#FFD700"; // Gold Text
                        // Vibrate Node
                        positions[idx] += (Math.random()-0.5); 
                    } else {
                        // Slow down everything else (Time Freeze)
                        vx *= 0.5; vy *= 0.5; vz *= 0.5;
                    }
                }
            }

            // --- D. INTEGRATION (Move Particle) ---
            // Damping (Air Resistance)
            vx *= 0.92;
            vy *= 0.92;
            vz *= 0.92;

            positions[idx] += vx;
            positions[idx+1] += vy;
            positions[idx+2] += vz;

            // Save velocity for next frame
            this.velocities[idx] = vx;
            this.velocities[idx+1] = vy;
            this.velocities[idx+2] = vz;
        }

        this.particleGeo.attributes.position.needsUpdate = true;
        this.particleGeo.attributes.color.needsUpdate = true;
        this.composer.render();
    }
};

/* ==========================================================================
   6. AI BRAIN & INIT
   ========================================================================== */
const Brain = {
    synth: window.speechSynthesis,
    recognition: null,

    init: function() {
        const Speech = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (Speech) {
            this.recognition = new Speech();
            this.recognition.continuous = true;
            this.recognition.lang = 'en-US';
            this.recognition.interimResults = false;
            
            this.recognition.onstart = () => UI.micStatus.innerText = "ONLINE";
            this.recognition.onend = () => { setTimeout(()=> { try{this.recognition.start()}catch(e){} }, 1000) };
            
            this.recognition.onresult = (e) => {
                const text = e.results[e.results.length-1][0].transcript;
                this.process(text);
            };
            try { this.recognition.start(); } catch(e) {}
        }
    },

    process: function(text) {
        text = text.toLowerCase().trim();
        UI.subtitles.innerText = `YOU: ${text}`;
        UI.subtitles.style.color = "#fff";

        // Math Logic
        if(text.match(/[0-9]/) && (text.includes("times") || text.includes("plus") || text.includes("-"))) {
            try {
                const clean = text.replace(/[^0-9\+\-\*\/\.]/g, '');
                if(clean.length > 2) { this.speak(`Result is ${eval(clean)}`); return; }
            } catch(e) {}
        }

        // DB Search
        let found = false;
        for(let key in LOCAL_DB) {
            if(text.includes(key)) {
                const opts = LOCAL_DB[key];
                const reply = opts[Math.floor(Math.random()*opts.length)];
                if(typeof reply === 'function') this.speak(reply());
                else this.speak(reply);
                found = true; 
                break;
            }
        }
        if(!found) this.speak("Processing input.");
    },

    speak: function(msg) {
        if(this.synth.speaking) this.synth.cancel();
        const u = new SpeechSynthesisUtterance(msg);
        u.pitch = State.combatMode ? 0.6 : 1.0;
        u.rate = 1.1;
        const v = this.synth.getVoices().find(v => v.name.includes('Google UK English Male') || v.name.includes('Daniel'));
        if(v) u.voice = v;
        this.synth.speak(u);
        UI.subtitles.innerText = `JARVIS: ${msg}`;
    }
};

const KnowledgeBase = {
    init: function() {
        const input = document.getElementById('pdf-upload');
        input.addEventListener('change', async (e) => {
            if(e.target.files[0]) {
                UI.subtitles.innerText = "READING...";
                const buf = await e.target.files[0].arrayBuffer();
                const pdf = await pdfjsLib.getDocument(buf).promise;
                let txt = "";
                for(let i=1; i<=pdf.numPages; i++) {
                    const p = await pdf.getPage(i);
                    const c = await p.getTextContent();
                    txt += c.items.map(s=>s.str).join(" ");
                }
                const sentences = txt.split(/[.!?]/).filter(s=>s.length>20 && s.length<150);
                Visuals.injectKnowledge(sentences);
                UI.subtitles.innerText = `DATA INJECTED: ${sentences.length} NODES`;
            }
        });
    },
    triggerUpload: () => document.getElementById('pdf-upload').click()
};

// --- BOOTSTRAP ---
document.getElementById('start-btn').addEventListener('click', () => {
    UI.overlay.style.display = 'none';
    SFX.init();
    Brain.init();
    KnowledgeBase.init();
    Visuals.init();
    Visuals.animate();

    // Camera & Hand Tracking
    const video = document.getElementById('video-input');
    const hands = new window.Hands({locateFile: (f) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${f}`});
    hands.setOptions({maxNumHands: 1, modelComplexity: isMobile?0:1, minDetectionConfidence: 0.7});
    
    hands.onResults(res => {
        if(res.multiHandLandmarks.length > 0) {
            State.handActive = true;
            const lm = res.multiHandLandmarks[0];
            
            // Map Hand Coordinates (0-1) to Screen Physics (Approx -50 to 50)
            const x = (0.5 - lm[9].x) * 150;
            const y = (0.5 - lm[9].y) * 100;
            State.handPos.set(x, y, 0);

            // Update Reticle
            UI.reticle.style.display = 'block';
            UI.reticle.style.left = ((1-lm[9].x)*100)+'%';
            UI.reticle.style.top = (lm[9].y*100)+'%';

            // Detect & Update
            const g = detectGesture(lm);
            if(g !== State.gesture) {
                State.gesture = g;
                updateHUD(g);
                SFX.update(g);
            }
        } else {
            State.handActive = false;
            UI.reticle.style.display = 'none';
        }
    });

    navigator.mediaDevices.getUserMedia({
        video: { facingMode: isMobile?"user":"environment", width: {ideal: 640}, height: {ideal: 480} }
    }).then(s => {
        video.srcObject = s;
        video.play();
        const loop = async () => {
            if(video.readyState >= 2) await hands.send({image: video});
            requestAnimationFrame(loop);
        };
        loop();
    });
});

window.addEventListener('resize', () => {
    if(Visuals.camera) {
        Visuals.camera.aspect = window.innerWidth/window.innerHeight;
        Visuals.camera.updateProjectionMatrix();
        Visuals.renderer.setSize(window.innerWidth, window.innerHeight);
    }
});
