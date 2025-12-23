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
    "hello": ["Greetings.", "Online.", "System active.", "Listening."],
    "jarvis": ["Yes?", "Awaiting input.", "Standing by."],
    "bye": ["Goodbye.", "Powering down."],

    // --- SYSTEM STATUS ---
    "status": ["Systems nominal.", "Battery 100%.", "Network secure."],
    "system": ["Logic efficiency 99%.", "Memory clean."],

    // --- COMBAT & DEFENSE ---
    "combat": [() => toggleCombat(true), "Combat mode engaged.", "Weapons hot."],
    "kill": [() => toggleCombat(true), "Targeting engaged."],
    "relax": [() => toggleCombat(false), "Standing down.", "Mode passive."],
    
    // --- COMMANDS ---
    "upload": [() => KnowledgeBase.triggerUpload(), "Opening interface."],
    "time": [() => `Time is ${new Date().toLocaleTimeString()}.`],
    "date": [() => `Date is ${new Date().toLocaleDateString()}.`]
};

// --- GLOBAL STATE ---
const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
const State = {
    handActive: false,
    handPos: new THREE.Vector3(0,0,0),
    gesture: 'IDLE', 
    combatMode: false,
    lastGesture: 'IDLE'
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
    return isActive ? "Combat Mode." : "Normalizing.";
}

/* ================================================================
   AUDIO ENGINE (PROCEDURAL SOUNDS)
   ================================================================
*/
const SFX = {
    ctx: null, gain: null, humOsc: null, noiseNode: null, noiseGain: null,

    init: function() {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        this.ctx = new AudioContext();
        this.gain = this.ctx.createGain();
        this.gain.connect(this.ctx.destination);
        this.gain.gain.value = 0.3;

        // 1. Idle Hum
        this.humOsc = this.ctx.createOscillator();
        this.humOsc.type = 'sine';
        this.humOsc.frequency.value = 60;
        this.humOsc.connect(this.gain);
        this.humOsc.start();

        // 2. White Noise (for Blast)
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

    update: function(gesture) {
        if(!this.ctx) return;
        const t = this.ctx.currentTime;
        
        if (gesture === 'BLAST') {
            this.noiseGain.gain.setTargetAtTime(0.8, t, 0.1); // Woosh sound
            this.humOsc.frequency.setTargetAtTime(40, t, 0.1); // Drop bass
        } else if (gesture === 'GRAVITY') {
            this.humOsc.frequency.setTargetAtTime(200, t, 0.1); // High tension
            this.noiseGain.gain.setTargetAtTime(0, t, 0.1);
        } else if (gesture === 'CHAOS') {
            this.humOsc.frequency.setValueAtTime(100 + Math.random()*500, t); // Glitch sound
        } else {
            this.noiseGain.gain.setTargetAtTime(0, t, 0.2);
            this.humOsc.frequency.setTargetAtTime(60, t, 0.5);
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
                this.processInput(e.results[e.results.length-1][0].transcript);
            };
            try { this.recognition.start(); } catch(e) {}
        }
    },

    speak: function(text) {
        if (this.synth.speaking) this.synth.cancel();
        const utter = new SpeechSynthesisUtterance(text);
        utter.pitch = State.combatMode ? 0.6 : 1.0;
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
        
        if (text.match(/[0-9]/) && (text.includes("calculate") || text.includes("times") || text.includes("plus"))) {
             try {
                const mathStr = text.replace(/[^0-9\+\-\*\/\.]/g, ''); 
                if(mathStr.length > 2) { this.speak(`Result: ${eval(mathStr)}`); return; }
             } catch(e){}
        }

        let found = false;
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
            if(e.target.files[0]) {
                UI.subtitles.innerText = "ANALYZING...";
                await this.parsePDF(e.target.files[0]);
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
    count: isMobile ? 1500 : 5000, 
    knowledgeMap: {}, origins: null, velocities: null,

    init: function() {
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 1000);
        this.camera.position.z = isMobile ? 100 : 80;

        this.renderer = new THREE.WebGLRenderer({ antialias: false });
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
        const pos = new Float32Array(this.count * 3);
        const vel = new Float32Array(this.count * 3);
        const org = new Float32Array(this.count * 3);
        const col = new Float32Array(this.count * 3);
        const base = new THREE.Color(0x00ffff);

        for(let i=0; i<this.count; i++) {
            const r = 40 + Math.random() * 40;
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(2 * Math.random() - 1);
            
            const x = r * Math.sin(phi) * Math.cos(theta);
            const y = r * Math.sin(phi) * Math.sin(theta);
            const z = r * Math.cos(phi);

            pos[i*3] = x; pos[i*3+1] = y; pos[i*3+2] = z;
            org[i*3] = x; org[i*3+1] = y; org[i*3+2] = z;
            col[i*3] = base.r; col[i*3+1] = base.g; col[i*3+2] = base.b;
        }

        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
        geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
        const tex = new THREE.TextureLoader().load('https://threejs.org/examples/textures/sprites/spark1.png');
        const mat = new THREE.PointsMaterial({ size: isMobile?1.2:0.8, map: tex, vertexColors: true, transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending, depthWrite: false });

        this.particles = new THREE.Points(geo, mat);
        this.particleGeo = geo;
        this.scene.add(this.particles);
        this.origins = org;
        this.velocities = vel;
    },

    injectKnowledge: function(sentences) {
        this.knowledgeMap = {}; 
        const colors = this.particleGeo.attributes.color.array;
        const max = Math.min(sentences.length, this.count);
        for(let i=0; i<max; i++) {
            const idx = Math.floor(Math.random() * this.count);
            this.knowledgeMap[idx] = sentences[i];
            colors[idx*3] = 1.0; colors[idx*3+1] = 0.84; colors[idx*3+2] = 0.0; // Gold
        }
        this.particleGeo.attributes.color.needsUpdate = true;
    },

    animate: function() {
        requestAnimationFrame(this.animate.bind(this));
        
        const pos = this.particleGeo.attributes.position.array;
        const col = this.particleGeo.attributes.color.array;
        const hx = State.handPos.x;
        const hy = State.handPos.y;
        
        // Auto Rotation
        let rotSpeed = State.combatMode ? 0.02 : 0.002;
        this.scene.rotation.y += rotSpeed;

        // Colors
        let tr, tg, tb;
        if(State.combatMode) { tr=1; tg=0; tb=0; } else { tr=0; tg=1; tb=1; }

        for(let i=0; i<this.count; i++) {
            const idx = i*3;
            // 1. Color Lerp (if not gold)
            if(!this.knowledgeMap[i]) {
                col[idx]   += (tr - col[idx]) * 0.05;
                col[idx+1] += (tg - col[idx+1]) * 0.05;
                col[idx+2] += (tb - col[idx+2]) * 0.05;
            }

            let px = pos[idx], py = pos[idx+1], pz = pos[idx+2];
            let vx = this.velocities[idx], vy = this.velocities[idx+1], vz = this.velocities[idx+2];

            // 2. Return to Origin (Elasticity)
            vx += (this.origins[idx] - px) * 0.03;
            vy += (this.origins[idx+1] - py) * 0.03;
            vz += (this.origins[idx+2] - pz) * 0.03;

            // 3. Hand Physics
            if(State.handActive) {
                const dx = px - hx;
                const dy = py - hy;
                const distSq = dx*dx + dy*dy;
                const dist = Math.sqrt(distSq);

                if (State.gesture === 'BLAST') {
                    // SHOCKWAVE: Massive outward force from hand
                    if(dist < 100) {
                        const force = 1000 / (dist + 0.1);
                        vx += (dx/dist) * force * 0.05;
                        vy += (dy/dist) * force * 0.05;
                        vz += 5.0; // Blow forward
                        if(!this.knowledgeMap[i]) { col[idx]=1; col[idx+1]=1; col[idx+2]=1; } // White flash
                    }
                } 
                else if (State.gesture === 'GRAVITY') {
                    // BLACK HOLE: Massive inward force to hand
                    if(dist < 200) {
                        const force = 10.0; 
                        vx -= (dx/dist) * force * 0.05;
                        vy -= (dy/dist) * force * 0.05;
                        // Color purple/orange
                        if(!this.knowledgeMap[i]) { col[idx]=0.8; col[idx+1]=0.2; col[idx+2]=0; }
                    }
                }
                else if (State.gesture === 'CHAOS') {
                    // GLITCH: Random teleport
                    if(Math.random() > 0.95) {
                        px += (Math.random()-0.5)*20;
                        py += (Math.random()-0.5)*20;
                        if(!this.knowledgeMap[i]) { col[idx]=1; col[idx+1]=0; col[idx+2]=1; } // Pink
                    }
                }
                else if (State.gesture === 'PINCH') {
                    if(this.knowledgeMap[i] && dist < 30) {
                        UI.subtitles.innerText = `[DATA]: ${this.knowledgeMap[i]}`;
                        px += (Math.random()-0.5)*2; 
                    } else {
                        vx *= 0.05; vy *= 0.05; vz *= 0.05; // Freeze time
                    }
                }
            }

            // 4. Update Position & Damping
            vx *= 0.9; vy *= 0.9; vz *= 0.9;
            pos[idx] = px + vx;
            pos[idx+1] = py + vy;
            pos[idx+2] = pz + vz;
            
            this.velocities[idx] = vx; this.velocities[idx+1] = vy; this.velocities[idx+2] = vz;
        }

        this.particleGeo.attributes.position.needsUpdate = true;
        this.particleGeo.attributes.color.needsUpdate = true;
        this.composer.render();
    }
};

// --- STABLE GESTURE RECOGNITION ---
function detectGesture(lm) {
    const dist = (i, j) => Math.hypot(lm[i].x - lm[j].x, lm[i].y - lm[j].y);
    const wrist = 0, thumb = 4, index = 8, mid = 12, ring = 16, pinky = 20;

    const isExtended = (tip, base) => dist(tip, wrist) > dist(base, wrist) * 1.2;
    const isCurled = (tip, base) => dist(tip, wrist) < dist(base, wrist);

    // 1. PINCH (Thumb + Index touching)
    if (dist(thumb, index) < 0.05) return 'PINCH';

    // 2. FIST (Gravity) - All fingers curled tight
    // Check if Index, Mid, Ring, Pinky tips are close to wrist
    if (isCurled(index,5) && isCurled(mid,9) && isCurled(ring,13) && isCurled(pinky,17)) return 'GRAVITY';

    // 3. CHAOS (Rock) - Index & Pinky UP, Mid & Ring DOWN
    if (isExtended(index,5) && isCurled(mid,9) && isCurled(ring,13) && isExtended(pinky,17)) return 'CHAOS';

    // 4. POINT - Index UP, others DOWN
    if (isExtended(index,5) && isCurled(mid,9) && isCurled(ring,13) && isCurled(pinky,17)) return 'POINT';

    // 5. BLAST (Open Palm) - All Extended
    if (isExtended(index,5) && isExtended(mid,9) && isExtended(ring,13) && isExtended(pinky,17)) return 'BLAST';

    return 'IDLE';
}

function updateHUD(gesture) {
    document.querySelectorAll('.cmd-item').forEach(el => el.classList.remove('cmd-active'));
    if(gesture === 'BLAST') document.getElementById('cmd-palm').classList.add('cmd-active');
    if(gesture === 'GRAVITY') document.getElementById('cmd-fist').classList.add('cmd-active');
    if(gesture === 'POINT') document.getElementById('cmd-point').classList.add('cmd-active');
    if(gesture === 'PINCH') document.getElementById('cmd-pinch').classList.add('cmd-active');
    if(gesture === 'CHAOS') document.getElementById('cmd-rock').classList.add('cmd-active');
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
            // Center Coordinate Conversion
            const x = (0.5 - lm[9].x) * 160; 
            const y = (0.5 - lm[9].y) * 100;
            State.handPos.set(x, y, 0);
            
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
        video: { facingMode: isMobile ? "user" : "environment", width: { ideal: 640 }, height: { ideal: 480 } } 
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
