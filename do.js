import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';

/* ==========================================================================
   1. LOCAL INTELLIGENCE DATABASE
   ========================================================================== */
const LOCAL_DB = {
    "hello": ["Greetings, sir.", "Online.", "System active.", "I am listening."],
    "jarvis": ["Yes, sir?", "Awaiting instructions.", "Standing by."],
    "bye": ["Goodbye, sir.", "Powering down."],
    "status": ["All systems nominal.", "Battery 100%.", "Network secure.", "Visuals active."],
    "system": ["Logic efficiency 98%.", "Memory clean."],
    "combat": [() => toggleCombat(true), "Engaging combat mode.", "Weapons hot."],
    "kill": [() => toggleCombat(true), "Termination engaged.", "Acquiring targets."],
    "relax": [() => toggleCombat(false), "Standing down.", "Mode passive."],
    "stop": [() => toggleCombat(false), "Freezing.", "Halted."],
    "upload": [() => KnowledgeBase.triggerUpload(), "Opening interface."],
    "read": [() => KnowledgeBase.triggerUpload(), "Select document."],
    "time": [() => `The time is ${new Date().toLocaleTimeString()}.`],
    "date": [() => `Today is ${new Date().toLocaleDateString()}.`]
};

/* ==========================================================================
   2. GLOBAL STATE
   ========================================================================== */
const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
const State = {
    handActive: false,
    handPos: new THREE.Vector3(0, 0, 0),
    gesture: 'IDLE', 
    combatMode: false
};

const UI = {
    micStatus: document.getElementById('voice-status'),
    gestureStatus: document.getElementById('gesture-status'),
    subtitles: document.getElementById('subtitle-box'),
    reticle: document.getElementById('reticle'),
    overlay: document.getElementById('start-overlay'),
    body: document.body
};

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
   3. AUDIO ENGINE
   ========================================================================== */
const SFX = {
    ctx: null, gain: null, humOsc: null, noiseNode: null, noiseGain: null,

    init: function() {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        this.ctx = new AudioContext();
        this.gain = this.ctx.createGain();
        this.gain.connect(this.ctx.destination);
        this.gain.gain.value = 0.3;

        // Idle Hum
        this.humOsc = this.ctx.createOscillator();
        this.humOsc.type = 'sawtooth';
        this.humOsc.frequency.value = 60;
        const humFilter = this.ctx.createBiquadFilter();
        humFilter.type = 'lowpass';
        humFilter.frequency.value = 120;
        this.humOsc.connect(humFilter);
        humFilter.connect(this.gain);
        this.humOsc.start();

        // Noise (Blast)
        const bSize = this.ctx.sampleRate * 2;
        const b = this.ctx.createBuffer(1, bSize, this.ctx.sampleRate);
        const d = b.getChannelData(0);
        for(let i=0; i<bSize; i++) d[i] = Math.random() * 2 - 1;

        this.noiseNode = this.ctx.createBufferSource();
        this.noiseNode.buffer = b;
        this.noiseNode.loop = true;
        this.noiseGain = this.ctx.createGain();
        this.noiseGain.gain.value = 0;
        
        this.noiseNode.connect(this.noiseGain);
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
        } else if (type === 'relax') {
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
            this.noiseGain.gain.setTargetAtTime(0.8, t, 0.1);
            this.humOsc.frequency.setTargetAtTime(40, t, 0.2);
        } else if (gesture === 'GRAVITY') {
            this.humOsc.frequency.setTargetAtTime(200, t, 0.1);
            this.noiseGain.gain.setTargetAtTime(0, t, 0.1);
        } else if (gesture === 'CHAOS') {
            this.humOsc.frequency.setValueAtTime(50 + Math.random()*200, t);
        } else {
            this.noiseGain.gain.setTargetAtTime(0, t, 0.2);
            this.humOsc.frequency.setTargetAtTime(60, t, 0.5);
        }
    }
};

/* ==========================================================================
   4. VISUAL CORE (PARTICLES & PHYSICS)
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

        const renderScene = new RenderPass(this.scene, this.camera);
        const bloom = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 1.5, 0.4, 0.85);
        bloom.strength = 1.8; bloom.radius = 0.5;

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
            const r = 40 + Math.random() * 40;
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(2 * Math.random() - 1);
            
            const x = r * Math.sin(phi) * Math.cos(theta);
            const y = r * Math.sin(phi) * Math.sin(theta);
            const z = r * Math.cos(phi);

            pos[i*3] = x; pos[i*3+1] = y; pos[i*3+2] = z;
            org[i*3] = x; org[i*3+1] = y; org[i*3+2] = z;
            col[i*3] = baseColor.r; col[i*3+1] = baseColor.g; col[i*3+2] = baseColor.b;
        }

        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
        geo.setAttribute('color', new THREE.BufferAttribute(col, 3));

        const tex = new THREE.TextureLoader().load('https://threejs.org/examples/textures/sprites/spark1.png');
        const mat = new THREE.PointsMaterial({ size: isMobile ? 1.5 : 0.8, map: tex, vertexColors: true, transparent: true, opacity: 0.8, blending: THREE.AdditiveBlending, depthWrite: false });

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
            const idx = Math.floor(Math.random() * this.count);
            this.knowledgeMap[idx] = sentences[i];
            colors[idx*3] = 1.0; colors[idx*3+1] = 0.8; colors[idx*3+2] = 0.0;
        }
        this.particleGeo.attributes.color.needsUpdate = true;
    },

    animate: function() {
        requestAnimationFrame(this.animate.bind(this));
        this.updatePhysics(); // THIS WAS MISSING IN YOUR CODE
        this.composer.render();
    },

    updatePhysics: function() {
        if(!this.particleGeo) return;
        
        const positions = this.particleGeo.attributes.position.array;
        const colors = this.particleGeo.attributes.color.array;
        const hx = State.handPos.x;
        const hx_y = State.handPos.y;
        
        const rotSpeed = State.combatMode ? 0.015 : 0.002;
        this.scene.rotation.y += rotSpeed;

        let tr = 0, tg = 1, tb = 1;
        if(State.combatMode) { tr=1; tg=0; tb=0; }

        for(let i=0; i<this.count; i++) {
            const idx = i*3;
            let px = positions[idx], py = positions[idx+1], pz = positions[idx+2];
            let vx = this.velocities[idx], vy = this.velocities[idx+1], vz = this.velocities[idx+2];

            if(!this.knowledgeMap[i]) {
                colors[idx] += (tr - colors[idx]) * 0.05;
                colors[idx+1] += (tg - colors[idx+1]) * 0.05;
                colors[idx+2] += (tb - colors[idx+2]) * 0.05;
            }

            // Return to Origin
            vx += (this.origins[idx] - px) * 0.02;
            vy += (this.origins[idx+1] - py) * 0.02;
            vz += (this.origins[idx+2] - pz) * 0.02;

            // Hand Physics
            if(State.handActive) {
                const dx = px - hx;
                const dy = py - hx_y;
                const distSq = dx*dx + dy*dy;
                const dist = Math.sqrt(distSq);

                if (State.gesture === 'BLAST') { // Shockwave
                    if(dist < 100) {
                        const force = 1500 / (dist + 5);
                        const angle = Math.atan2(dy, dx);
                        vx += Math.cos(angle) * force * 0.1;
                        vy += Math.sin(angle) * force * 0.1;
                        vz += 5;
                        if(!this.knowledgeMap[i]) { colors[idx]=1; colors[idx+1]=1; colors[idx+2]=1; }
                    }
                }
                else if (State.gesture === 'GRAVITY') { // Black Hole
                    if(dist < 250) {
                        const force = 5.0;
                        vx -= (dx / dist) * force;
                        vy -= (dy / dist) * force;
                        if(!this.knowledgeMap[i]) { colors[idx]=0.2; colors[idx+1]=0; colors[idx+2]=0.5; }
                    }
                }
                else if (State.gesture === 'CHAOS') { // Glitch
                    if(Math.random() > 0.98) {
                        positions[idx] += (Math.random()-0.5) * 50;
                        positions[idx+1] += (Math.random()-0.5) * 50;
                        if(!this.knowledgeMap[i]) { colors[idx]=1; colors[idx+1]=0; colors[idx+2]=1; }
                    }
                }
                else if (State.gesture === 'PINCH') { // Read
                    if(this.knowledgeMap[i] && dist < 30) {
                        UI.subtitles.innerText = `[DATA]: ${this.knowledgeMap[i]}`;
                        UI.subtitles.style.color = "#FFD700";
                        positions[idx] += (Math.random()-0.5); 
                    } else {
                        vx *= 0.5; vy *= 0.5; vz *= 0.5;
                    }
                }
            }

            vx *= 0.92; vy *= 0.92; vz *= 0.92;
            positions[idx] += vx; positions[idx+1] += vy; positions[idx+2] += vz;
            this.velocities[idx] = vx; this.velocities[idx+1] = vy; this.velocities[idx+2] = vz;
        }

        this.particleGeo.attributes.position.needsUpdate = true;
        this.particleGeo.attributes.color.needsUpdate = true;
    }
};

/* ==========================================================================
   5. AI & UTILS
   ========================================================================== */
function detectGesture(lm) {
    const dist = (a, b) => Math.hypot(lm[a].x - lm[b].x, lm[a].y - lm[b].y);
    const isFingerOpen = (tip, pip) => dist(tip, 0) > dist(pip, 0); 

    const iO = isFingerOpen(8, 6), mO = isFingerOpen(12, 10), rO = isFingerOpen(16, 14), pO = isFingerOpen(20, 18);
    const thumbOpen = dist(4, 9) > 0.05;

    if (!iO && !mO && !rO && !pO) return 'GRAVITY';
    if (iO && mO && rO && pO && thumbOpen) return 'BLAST';
    if (iO && !mO && !rO && pO) return 'CHAOS';
    if (iO && !mO && !rO && !pO) return 'POINT';
    if (dist(4, 8) < 0.05) return 'PINCH';
    if (iO && mO && !rO && !pO) return 'ZOOM_IN';
    if (iO && mO && rO && !pO) return 'ZOOM_OUT';

    return 'IDLE';
}

function updateHUD(gesture) {
    document.querySelectorAll('.cmd-item').forEach(el => el.classList.remove('cmd-active'));
    const map = { 'BLAST': 'cmd-palm', 'GRAVITY': 'cmd-fist', 'CHAOS': 'cmd-rock', 'PINCH': 'cmd-pinch', 'POINT': 'cmd-point' };
    if(map[gesture]) document.getElementById(map[gesture]).classList.add('cmd-active');
    UI.gestureStatus.innerText = gesture;
}

const Brain = {
    synth: window.speechSynthesis,
    recognition: null,
    init: function() {
        const Speech = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (Speech) {
            this.recognition = new Speech();
            this.recognition.continuous = true;
            this.recognition.lang = 'en-US';
            this.recognition.onstart = () => UI.micStatus.innerText = "ONLINE";
            this.recognition.onend = () => { setTimeout(()=> { try{this.recognition.start()}catch(e){} }, 1000) };
            this.recognition.onresult = (e) => this.process(e.results[e.results.length-1][0].transcript);
            try { this.recognition.start(); } catch(e) {}
        }
    },
    process: function(text) {
        text = text.toLowerCase().trim();
        UI.subtitles.innerText = `YOU: ${text}`;
        UI.subtitles.style.color = "#fff";
        let found = false;
        for(let key in LOCAL_DB) {
            if(text.includes(key)) {
                const opts = LOCAL_DB[key];
                const reply = opts[Math.floor(Math.random()*opts.length)];
                if(typeof reply === 'function') this.speak(reply()); else this.speak(reply);
                found = true; break;
            }
        }
        if(!found) this.speak("Processing.");
    },
    speak: function(msg) {
        if(this.synth.speaking) this.synth.cancel();
        const u = new SpeechSynthesisUtterance(msg);
        u.pitch = State.combatMode ? 0.6 : 1.0; u.rate = 1.1;
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
                Visuals.injectKnowledge(txt.split(/[.!?]/).filter(s=>s.length>20 && s.length<150));
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

    const video = document.getElementById('video-input');
    const hands = new window.Hands({locateFile: (f) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${f}`});
    hands.setOptions({maxNumHands: 1, modelComplexity: isMobile?0:1, minDetectionConfidence: 0.7});
    
    hands.onResults(res => {
        if(res.multiHandLandmarks.length > 0) {
            State.handActive = true;
            const lm = res.multiHandLandmarks[0];
            const x = (0.5 - lm[9].x) * 150;
            const y = (0.5 - lm[9].y) * 100;
            State.handPos.set(x, y, 0);

            UI.reticle.style.display = 'block';
            UI.reticle.style.left = ((1-lm[9].x)*100)+'%';
            UI.reticle.style.top = (lm[9].y*100)+'%';

            const g = detectGesture(lm);
            if(g !== State.gesture) { State.gesture = g; updateHUD(g); SFX.update(g); }
        } else {
            State.handActive = false;
            UI.reticle.style.display = 'none';
        }
    });

    navigator.mediaDevices.getUserMedia({ video: { facingMode: isMobile?"user":"environment", width: {ideal: 640}, height: {ideal: 480} } }).then(s => {
        video.srcObject = s; video.play();
        const loop = async () => { if(video.readyState >= 2) await hands.send({image: video}); requestAnimationFrame(loop); };
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
