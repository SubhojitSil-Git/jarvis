import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';

/* ================================================================
   LOCAL INTELLIGENCE DATABASE (GOD MODE)
   ================================================================
*/
const LOCAL_DB = {
    // --- CORE INTERACTIONS ---
    "hello": ["Greetings, sir.", "Online.", "System active.", "I am listening."],
    "jarvis": ["Yes, sir?", "Awaiting instructions.", "Standing by."],
    "bye": ["Goodbye, sir.", "Powering down."],

    // --- SYSTEM STATUS ---
    "status": ["All systems nominal.", "Battery 100%.", "Network secure.", "Visuals active."],
    "system": ["Logic efficiency 98%.", "Memory clean."],
    
    // --- COMBAT & DEFENSE ---
    "combat": [() => toggleCombat(true), "Engaging combat mode.", "Weapons hot."],
    "kill": [() => toggleCombat(true), "Termination engaged.", "Acquiring targets."],
    "attack": [() => toggleCombat(true), "Engaging hostiles."],
    
    "relax": [() => toggleCombat(false), "Standing down.", "Mode passive."],
    "stop": [() => toggleCombat(false), "Freezing.", "Halted."],

    // --- POP CULTURE ---
    "stark": ["Mr. Stark is the boss.", "Genius, billionaire."],
    "iron man": ["Mark 85 is ready.", "I am the suit."],
    "avengers": ["Assemble."],
    
    // --- PDF / STUDY ---
    "upload": [() => KnowledgeBase.triggerUpload(), "Opening interface."],
    "read": [() => KnowledgeBase.triggerUpload(), "Select document."],

    // --- TIME & MATH ---
    "time": [() => `The time is ${new Date().toLocaleTimeString()}.`, "Checking chronometer."],
    "date": [() => `Today is ${new Date().toLocaleDateString()}.`, "Calendar accessed."],
};

// --- GLOBAL STATE ---
const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
const State = {
    handActive: false,
    handPos: new THREE.Vector3(0,0,0),
    gesture: 'IDLE', 
    combatMode: false,
    voiceActive: false
};

// --- DOM ELEMENTS ---
const UI = {
    micStatus: document.getElementById('voice-status'),
    gestureStatus: document.getElementById('gesture-status'),
    subtitles: document.getElementById('subtitle-box'),
    reticle: document.getElementById('reticle'),
    overlay: document.getElementById('start-overlay'),
    body: document.body
};

// --- HELPER: COMBAT TOGGLE ---
function toggleCombat(isActive) {
    State.combatMode = isActive;
    if (isActive) {
        UI.body.classList.add('combat');
        UI.subtitles.style.color = "#ff0000";
        UI.reticle.style.borderColor = "#ff0000";
    } else {
        UI.body.classList.remove('combat');
        UI.subtitles.style.color = "#00ffff";
        UI.reticle.style.borderColor = "#00ffff";
    }
    return isActive ? "Combat Mode." : "Systems Normalized.";
}

/* ================================================================
   AUDIO ENGINE (PROCEDURAL SOUNDS)
   ================================================================
*/
const SFX = {
    ctx: null, gain: null, humOsc: null, noiseNode: null, noiseFilter: null, noiseGain: null,

    init: function() {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        this.ctx = new AudioContext();
        this.gain = this.ctx.createGain();
        this.gain.connect(this.ctx.destination);
        this.gain.gain.value = 0.4;

        // 1. Idle Drone (Sine Wave)
        this.humOsc = this.ctx.createOscillator();
        this.humOsc.type = 'sine';
        this.humOsc.frequency.value = 60;
        this.humOsc.connect(this.gain);
        this.humOsc.start();

        // 2. Thruster Noise (White Noise Buffer)
        const bufferSize = this.ctx.sampleRate * 2;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

        this.noiseNode = this.ctx.createBufferSource();
        this.noiseNode.buffer = buffer;
        this.noiseNode.loop = true;
        this.noiseFilter = this.ctx.createBiquadFilter();
        this.noiseFilter.type = 'lowpass';
        this.noiseFilter.frequency.value = 400;
        this.noiseGain = this.ctx.createGain();
        this.noiseGain.gain.value = 0;

        this.noiseNode.connect(this.noiseFilter);
        this.noiseFilter.connect(this.noiseGain);
        this.noiseGain.connect(this.gain);
        this.noiseNode.start();
    },

    update: function(gesture) {
        if(!this.ctx) return;
        const now = this.ctx.currentTime;
        
        if (gesture === 'BLAST') {
            this.noiseGain.gain.setTargetAtTime(0.8, now, 0.1);
            this.noiseFilter.frequency.setTargetAtTime(1000, now, 0.2);
            this.humOsc.frequency.setTargetAtTime(40, now, 0.1);
        } else if (gesture === 'GRAVITY') {
            this.humOsc.frequency.setTargetAtTime(150, now, 0.1); // Charge up sound
            this.noiseGain.gain.setTargetAtTime(0, now, 0.1);
        } else if (gesture === 'POINT') {
             this.humOsc.frequency.setTargetAtTime(800, now, 0.05); // High pitch laser sound
             this.noiseGain.gain.setTargetAtTime(0, now, 0.1);
        } else {
            // Idle state
            this.noiseGain.gain.setTargetAtTime(0, now, 0.2);
            this.humOsc.frequency.setTargetAtTime(60, now, 0.5);
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
        
        // Math Calculation Check
        if (text.match(/[0-9]/) && (text.includes("calculate") || text.includes("times") || text.includes("plus"))) {
             try {
                const mathStr = text.replace(/[^0-9\+\-\*\/\.]/g, ''); 
                if(mathStr.length > 2) { this.speak(`Result: ${eval(mathStr)}`); return; }
             } catch(e){}
        }

        let found = false;
        // Search Database
        for (const key in LOCAL_DB) {
            if (text.includes(key)) {
                const options = LOCAL_DB[key];
                const selected = options[Math.floor(Math.random() * options.length)];
                if (typeof selected === 'function') this.speak(selected());
                else this.speak(selected);
                found = true;
                break;
            }
        }
        if (!found) this.speak("Processing.");
    }
};

/* ================================================================
   KNOWLEDGE BASE (PDF)
   ================================================================
*/
const KnowledgeBase = {
    data: [], 
    init: function() {
        const input = document.getElementById('pdf-upload');
        input.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if(file && file.type === 'application/pdf') {
                UI.subtitles.innerText = "ANALYZING...";
                await this.parsePDF(file);
            }
        });
    },
    triggerUpload: function() { document.getElementById('pdf-upload').click(); },
    parsePDF: async function(file) {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
        let fullText = "";
        for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const content = await page.getTextContent();
            const strings = content.items.map(item => item.str);
            fullText += strings.join(" ") + " ";
        }
        this.data = fullText.split(/[.!?]/).map(s => s.trim()).filter(s => s.length > 20 && s.length < 150);
        UI.subtitles.innerText = `${this.data.length} NODES CREATED.`;
        Visuals.injectKnowledge(this.data);
    }
};

/* ================================================================
   VISUAL CORE (THREE.JS)
   ================================================================
*/
const Visuals = {
    scene: null, camera: null, renderer: null, composer: null,
    particles: null, particleGeo: null, 
    count: isMobile ? 2000 : 8000, 
    knowledgeMap: {}, origins: null, velocities: null,

    init: function() {
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 1000);
        this.camera.position.z = 80;

        this.renderer = new THREE.WebGLRenderer({ antialias: false });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        document.body.appendChild(this.renderer.domElement);

        const renderScene = new RenderPass(this.scene, this.camera);
        const bloom = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 1.5, 0.4, 0.85);
        bloom.strength = 2.0; bloom.radius = 0.5;
        
        this.composer = new EffectComposer(this.renderer);
        this.composer.addPass(renderScene);
        this.composer.addPass(bloom);

        this.createParticles();
    },

    createParticles: function() {
        const positions = new Float32Array(this.count * 3);
        const velocities = new Float32Array(this.count * 3);
        const origins = new Float32Array(this.count * 3);
        const colors = new Float32Array(this.count * 3);
        const colorBase = new THREE.Color(0x00ffff);

        for(let i=0; i<this.count; i++) {
            const r = 30 + Math.random() * 60; // Sphere cloud
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
        const mat = new THREE.PointsMaterial({
            size: 0.8, map: tex, vertexColors: true, 
            transparent: true, opacity: 0.8, blending: THREE.AdditiveBlending, depthWrite: false
        });

        this.particles = new THREE.Points(geometry, mat);
        this.particleGeo = geometry;
        this.scene.add(this.particles);
        
        // Store for physics
        this.origins = origins;
        this.velocities = velocities;
    },

    injectKnowledge: function(sentences) {
        this.knowledgeMap = {}; 
        const colors = this.particleGeo.attributes.color.array;
        const max = Math.min(sentences.length, this.count);
        for(let i=0; i<max; i++) {
            const idx = Math.floor(Math.random() * this.count);
            this.knowledgeMap[idx] = sentences[i];
            colors[idx*3] = 1.0; colors[idx*3+1] = 0.84; colors[idx*3+2] = 0.0; // GOLD
        }
        this.particleGeo.attributes.color.needsUpdate = true;
    },

    animate: function() {
        requestAnimationFrame(this.animate.bind(this));
        this.updatePhysics();
        this.composer.render();
    },
    
    updatePhysics: function() {
        if(!this.particles) return;
        const positions = this.particles.geometry.attributes.position.array;
        const colors = this.particles.geometry.attributes.color.array;

        const handX = State.handPos.x;
        const handY = State.handPos.y;
        const handZ = State.handPos.z || 0;

        const targetColor = State.combatMode ? {r:1, g:0, b:0} : {r:0, g:1, b:1};

        for(let i=0; i<this.count; i++) {
            const idx = i*3;
            let px = positions[idx];
            let py = positions[idx+1];
            let pz = positions[idx+2];
            let vx = this.velocities[idx];
            let vy = this.velocities[idx+1];
            let vz = this.velocities[idx+2];

            // Return force
            vx += (this.origins[idx] - px) * 0.015;
            vy += (this.origins[idx+1] - py) * 0.015;
            vz += (this.origins[idx+2] - pz) * 0.015;

            // Interaction
            if(State.handActive) {
                const dx = px - handX;
                const dy = py - handY;
                const dz = pz - handZ;
                const dist = Math.sqrt(dx*dx + dy*dy + dz*dz);

                if (State.gesture === 'BLAST') {
                    if(dist < 60) {
                        const f = 1000 / (dist + 1);
                        vx += (dx/dist) * f; vy += (dy/dist) * f; vz += (dz/dist) * f;
                        if(!this.knowledgeMap[i]) { colors[idx]=1; colors[idx+1]=1; colors[idx+2]=1; }
                    }
                } else if (State.gesture === 'GRAVITY') {
                    if(dist < 100) {
                        vx -= (dx/dist) * 2; vy -= (dy/dist) * 2; vz -= (dz/dist) * 2;
                        if(!this.knowledgeMap[i]) { colors[idx]=1; colors[idx+1]=0.5; colors[idx+2]=0; }
                    }
                } else if (State.gesture === 'POINT') {
                    const distBeam = Math.sqrt(dx*dx + dy*dy);
                    if (distBeam < 15) {
                        vx += (handX - px)*0.2; vy += (handY - py)*0.2; vz += 5; // Shoot forward
                        if(!this.knowledgeMap[i]) { colors[idx]=0; colors[idx+1]=1; colors[idx+2]=0; }
                    }
                } else if (State.gesture === 'PINCH') {
                    if (this.knowledgeMap[i] && dist < 30) {
                        UI.subtitles.innerText = `[DATA]: ${this.knowledgeMap[i]}`;
                        px += (Math.random()-0.5)*2; 
                    } else {
                        vx *= 0.1; vy *= 0.1; vz *= 0.1; // Freeze
                    }
                } else if (State.gesture === 'CHAOS') {
                    if(dist < 80) {
                        vx += (Math.random()-0.5)*5; vy += (Math.random()-0.5)*5; vz += (Math.random()-0.5)*5;
                        if(!this.knowledgeMap[i]) { colors[idx]=1; colors[idx+1]=0; colors[idx+2]=1; }
                    }
                }
            } else {
                // Restore color
                if(!this.knowledgeMap[i]) {
                    colors[idx] = colors[idx]*0.95 + targetColor.r*0.05;
                    colors[idx+1] = colors[idx+1]*0.95 + targetColor.g*0.05;
                    colors[idx+2] = colors[idx+2]*0.95 + targetColor.b*0.05;
                }
            }

            // Friction & Apply
            vx *= 0.9; vy *= 0.9; vz *= 0.9;
            positions[idx] = px + vx;
            positions[idx+1] = py + vy;
            positions[idx+2] = pz + vz;
            
            this.velocities[idx] = vx; this.velocities[idx+1] = vy; this.velocities[idx+2] = vz;
        }

        this.particles.geometry.attributes.position.needsUpdate = true;
        this.particles.geometry.attributes.color.needsUpdate = true;
    }
};

// --- GESTURE & INIT ---
function detectGesture(lm) {
    const dist = (i, j) => Math.hypot(lm[i].x - lm[j].x, lm[i].y - lm[j].y);
    const wrist = 0, thumb = 4, index = 8, mid = 12, ring = 16, pinky = 20;

    // 1. PINCH
    if (dist(thumb, index) < 0.05) return 'PINCH';

    // 2. FIST (Gravity) - All fingertips close to wrist
    const avgTip = (dist(index, wrist) + dist(mid, wrist) + dist(ring, wrist) + dist(pinky, wrist)) / 4;
    if (avgTip < 0.25) return 'GRAVITY';

    // 3. POINT (Tractor) - Index Up, others Down
    if (dist(index, wrist) > dist(mid, wrist) && dist(mid, wrist) < 0.3) return 'POINT';

    // 4. CHAOS (Rock) - Index & Pinky Up
    if (dist(index, wrist) > 0.4 && dist(pinky, wrist) > 0.4 && dist(mid, wrist) < 0.3) return 'CHAOS';

    return 'BLAST';
}

function updateHUD(gesture) {
    document.querySelectorAll('.cmd-item').forEach(el => el.classList.remove('cmd-active'));
    if(gesture === 'BLAST') document.getElementById('cmd-palm').classList.add('cmd-active');
    if(gesture === 'GRAVITY') document.getElementById('cmd-fist').classList.add('cmd-active');
    if(gesture === 'POINT') document.getElementById('cmd-point').classList.add('cmd-active');
    if(gesture === 'PINCH') document.getElementById('cmd-pinch').classList.add('cmd-active');
    UI.gestureStatus.innerText = gesture;
}

document.getElementById('start-btn').addEventListener('click', () => {
    UI.overlay.style.display = 'none';
    SFX.init();
    Brain.init();
    KnowledgeBase.init();
    Visuals.init();
    Visuals.animate();

    const video = document.getElementById('video-input');
    const hands = new window.Hands({locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`});
    hands.setOptions({ maxNumHands: 1, modelComplexity: isMobile ? 0 : 1 }); 
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
            UI.reticle.style.display = 'none';
            UI.gestureStatus.innerText = "IDLE";
        }
        SFX.update(State.gesture);
    });

    navigator.mediaDevices.getUserMedia({ 
        video: { 
            facingMode: isMobile ? "user" : "environment", 
            width: { ideal: 640 }, 
            height: { ideal: 480 } 
        } 
    }).then(stream => {
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
