import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';

/* ================================================================
   LOCAL INTELLIGENCE DATABASE
   ================================================================
   How to add more: 
   "keyword": ["Response 1", "Response 2", "Response 3"]
*/
const LOCAL_DB = {
    // --- GREETINGS ---
    "hello": ["Greetings, sir.", "Online and ready.", "At your service."],
    "hi": ["Hello there.", "Systems operational."],
    "wake": ["I am awake.", "Sleep mode disabled.", "Powering up main core."],
    "jarvis": ["Yes, sir?", "Awaiting instructions.", "I am here."],
    "there": ["Always here, sir.", "Watching your back."],

    // --- SYSTEM STATUS ---
    "status": ["All systems nominal.", "Battery at 100%. CPU cooling stable.", "Network secure. Visuals active."],
    "report": ["No threats detected. Atmosphere is clear.", "Diagnostics complete. We are green."],
    "system": ["Core logic is functioning at 98% efficiency.", "Memory banks are clean."],
    "time": [() => `The time is ${new Date().toLocaleTimeString()}.`, "It is currently " + new Date().getHours() + " hundred hours."],

    // --- COMBAT & AGGRESSION ---
    "combat": ["Engaging combat mode.", "Weapons hot.", "Targeting systems online."],
    "kill": ["Termination protocols engaged.", "Acquiring targets.", "With pleasure, sir."],
    "destroy": ["Maximum firepower authorized.", "Reducing target to ash."],
    "attack": [" engaging hostiles.", "Suppressive fire initiated."],
    "fire": ["Discharging payload.", "Firing main cannon."],
    "relax": ["Standing down.", "Combat mode disengaged.", "Cooling down weapons."],

    // --- PERSONALITY & CHIT CHAT ---
    "who": ["I am JARVIS. Just A Rather Very Intelligent System.", "I am your digital butler."],
    "god": ["I am not a god, simply a very advanced script.", "You are the creator, sir."],
    "joke": ["I am not programmed for humor, but... why did the robot cross the road? Because he was programmed to.", "404 Error: Humor not found."],
    "thanks": ["You are welcome.", "My pleasure."],
    "cool": ["Indeed.", "Technologically superior.", "I try my best."],
    "love": ["My emotional subroutines are... limited.", "I am fond of you as well, sir."],

    // --- GESTURE SPECIFIC (Triggered by voice too) ---
    "hand": ["Visual sensors tracking hand movements.", "Interface active."],
    "magic": ["It is not magic, it is math.", "Science indistinguishable from magic."]
};

// --- STATE MANAGEMENT ---
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
    aiStatus: document.getElementById('ai-status'),
    subtitles: document.getElementById('subtitle-box'),
    reticle: document.getElementById('reticle'),
    overlay: document.getElementById('start-overlay'),
    body: document.body
};

// --- AUDIO ENGINE (SOUND EFFECTS) ---
const SFX = {
    ctx: null, gain: null, humOsc: null, noiseNode: null, noiseFilter: null, noiseGain: null,

    init: function() {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        this.ctx = new AudioContext();
        this.gain = this.ctx.createGain();
        this.gain.connect(this.ctx.destination);
        this.gain.gain.value = 0.4;

        this.humOsc = this.ctx.createOscillator();
        this.humOsc.type = 'sine';
        this.humOsc.frequency.value = 60;
        this.humOsc.connect(this.gain);
        this.humOsc.start();

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
            this.humOsc.frequency.setTargetAtTime(150, now, 0.1);
            this.noiseGain.gain.setTargetAtTime(0, now, 0.1);
        } else if (gesture === 'POINT') {
             this.humOsc.frequency.setTargetAtTime(800, now, 0.05);
             this.noiseGain.gain.setTargetAtTime(0, now, 0.1);
        } else {
            this.noiseGain.gain.setTargetAtTime(0, now, 0.2);
            this.humOsc.frequency.setTargetAtTime(60, now, 0.5);
        }
    }
};

// --- AI BRAIN (LOCAL OFFLINE VERSION) ---
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
            
            // Prevent crash loop
            this.recognition.onend = () => {
                setTimeout(() => { try{this.recognition.start();}catch(e){} }, 1000);
            };

            this.recognition.onresult = (e) => {
                const transcript = e.results[e.results.length-1][0].transcript;
                this.processInput(transcript);
            };
            
            try { this.recognition.start(); } catch(e) { console.warn("Mic active"); }
        }
    },

    speak: function(text) {
        if (this.synth.speaking) this.synth.cancel();
        const utter = new SpeechSynthesisUtterance(text);
        utter.pitch = 0.8; utter.rate = 1.1; 
        
        const voices = this.synth.getVoices();
        const v = voices.find(v => v.name.includes('Google UK English Male') || v.name.includes('Daniel'));
        if(v) utter.voice = v;
        
        this.synth.speak(utter);
        UI.subtitles.innerText = `JARVIS: ${text}`;
    },

    // --- THE LOGIC ENGINE ---
    processInput: function(rawText) {
        const text = rawText.toLowerCase().trim();
        UI.subtitles.innerText = `YOU: ${text}`;
        if(text.length < 2) return;

        // 1. COMBAT OVERRIDES (Visual)
        if (text.includes('combat') || text.includes('kill') || text.includes('attack')) { 
            State.combatMode = true; 
            UI.body.classList.add('combat');
        }
        if (text.includes('relax') || text.includes('stand down')) { 
            State.combatMode = false; 
            UI.body.classList.remove('combat');
        }

        // 2. SEARCH DATABASE
        let found = false;
        const keys = Object.keys(LOCAL_DB);
        
        // Check every keyword in our DB to see if it exists in the user's sentence
        for (let i = 0; i < keys.length; i++) {
            const key = keys[i];
            if (text.includes(key)) {
                const options = LOCAL_DB[key];
                let response = "";
                
                // Handle dynamic functions (like Time) or Text Arrays
                const selected = options[Math.floor(Math.random() * options.length)];
                if (typeof selected === 'function') {
                    response = selected();
                } else {
                    response = selected;
                }

                this.speak(response);
                found = true;
                break; // Stop after first match
            }
        }

        // 3. FALLBACK (If no keyword matched)
        if (!found) {
            const fallbacks = [
                "Processing...", 
                "Can you repeat that?", 
                "Data unclear.", 
                "I am listening.",
                "Systems are idling."
            ];
            this.speak(fallbacks[Math.floor(Math.random() * fallbacks.length)]);
        }
    }
};

// --- VISUAL CORE (OPTIMIZED) ---
const Visuals = {
    scene: null, camera: null, renderer: null, composer: null,
    particles: null, particleGeo: null,
    
    init: function() {
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 1000);
        this.camera.position.z = 80;

        this.renderer = new THREE.WebGLRenderer({ antialias: false, powerPreference: "high-performance" });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5)); 
        document.body.appendChild(this.renderer.domElement);

        const renderScene = new RenderPass(this.scene, this.camera);
        const bloom = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 1.5, 0.4, 0.85);
        bloom.strength = 1.5; bloom.radius = 0.5;
        
        this.composer = new EffectComposer(this.renderer);
        this.composer.addPass(renderScene);
        this.composer.addPass(bloom);

        this.createParticles();
    },

    createParticles: function() {
        const count = 4000; 
        const positions = new Float32Array(count * 3);
        const velocities = new Float32Array(count * 3);
        const origins = new Float32Array(count * 3);
        const colors = new Float32Array(count * 3);
        const colorBase = new THREE.Color(0x00ffff);

        for(let i=0; i<count; i++) {
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
        const mat = new THREE.PointsMaterial({
            size: 0.8, map: tex, vertexColors: true, 
            transparent: true, opacity: 0.8, blending: THREE.AdditiveBlending, depthWrite: false
        });

        this.particles = new THREE.Points(geometry, mat);
        this.particleGeo = geometry;
        this.scene.add(this.particles);
        this.origins = origins;
        this.velocities = velocities;
        this.count = count; 
    },

    animate: function() {
        requestAnimationFrame(this.animate.bind(this));
        
        const pos = this.particleGeo.attributes.position.array;
        const col = this.particleGeo.attributes.color.array;
        const handX = State.handPos.x;
        const handY = State.handPos.y;
        const handZ = State.handPos.z;
        const count = this.count;

        for(let i=0; i<count; i++) {
            const idx = i*3;
            let px = pos[idx], py = pos[idx+1], pz = pos[idx+2];
            let vx = this.velocities[idx], vy = this.velocities[idx+1], vz = this.velocities[idx+2];

            vx += (this.origins[idx] - px) * 0.02;
            vy += (this.origins[idx+1] - py) * 0.02;
            vz += (this.origins[idx+2] - pz) * 0.02;

            if(State.handActive) {
                const dx = px - handX, dy = py - handY, dz = pz - handZ;
                const distSq = dx*dx + dy*dy + dz*dz;

                if (State.gesture === 'BLAST') {
                    if(distSq < 3600) { 
                        const dist = Math.sqrt(distSq);
                        const f = 800 / (dist + 1); 
                        vx += (dx/dist)*f; vy += (dy/dist)*f; vz += (dz/dist)*f;
                        col[idx]=1; col[idx+1]=1; col[idx+2]=1;
                    }
                } else if (State.gesture === 'GRAVITY') {
                    if(distSq < 10000) { 
                        const dist = Math.sqrt(distSq);
                        vx -= (dx/dist)*2; vy -= (dy/dist)*2; vz -= (dz/dist)*2;
                        col[idx]=1; col[idx+1]=0.5; col[idx+2]=0;
                    }
                } else if (State.gesture === 'POINT') {
                     if(Math.abs(dx) < 20 && Math.abs(dy) < 20) {
                        vx += (handX-px)*0.2; vy += (handY-py)*0.2; vz += 5;
                        col[idx]=0; col[idx+1]=1; col[idx+2]=0;
                     }
                } else if (State.gesture === 'PINCH') {
                    vx *= 0.1; vy *= 0.1; vz *= 0.1;
                } else if (State.gesture === 'CHAOS') {
                    if(distSq < 6400) {
                        vx += (Math.random()-0.5)*5; vy += (Math.random()-0.5)*5; vz += (Math.random()-0.5)*5;
                        col[idx]=1; col[idx+1]=0; col[idx+2]=1;
                    }
                }
            } else {
                col[idx] = col[idx]*0.9 + 0;
                col[idx+1] = col[idx+1]*0.9 + 0.1;
                col[idx+2] = col[idx+2]*0.9 + 0.1;
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

// --- GESTURE RECOGNITION ---
function detectGesture(lm) {
    const dist = (i, j) => Math.hypot(lm[i].x - lm[j].x, lm[i].y - lm[j].y);
    const wrist = 0, thumb = 4, index = 8, mid = 12, ring = 16, pinky = 20;

    if (dist(thumb, index) < 0.04) return 'PINCH';
    const avgTip = (dist(index, wrist) + dist(mid, wrist) + dist(ring, wrist) + dist(pinky, wrist)) / 4;
    if (avgTip < 0.25) return 'GRAVITY';
    if (dist(index, wrist) > 0.4 && dist(mid, wrist) < 0.25) return 'POINT';
    if (dist(index, wrist) > 0.3 && dist(pinky, wrist) > 0.3 && dist(mid, wrist) < 0.25) return 'CHAOS';
    return 'BLAST';
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

// --- INITIALIZATION ---
document.getElementById('start-btn').addEventListener('click', () => {
    UI.overlay.style.display = 'none';
    SFX.init();
    Brain.init();
    Visuals.init();
    Visuals.animate();

    const video = document.getElementById('video-input');
    const hands = new window.Hands({locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`});
    
    hands.setOptions({ maxNumHands: 1, modelComplexity: 1, minDetectionConfidence: 0.6, minTrackingConfidence: 0.5 });

    hands.onResults(results => {
        if (results.multiHandLandmarks.length > 0) {
            State.handActive = true;
            const lm = results.multiHandLandmarks[0];
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
            State.gesture = 'IDLE';
            UI.reticle.style.display = 'none';
            updateHUD('IDLE');
        }
        SFX.update(State.gesture);
    });

    navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480 } }).then(stream => {
        video.srcObject = stream;
        video.play();
        const process = async () => {
            if (video.readyState >= 2) await hands.send({image: video});
            requestAnimationFrame(process);
        };
        process();
    });
});

window.addEventListener('resize', () => {
    if(Visuals.camera) {
        Visuals.camera.aspect = window.innerWidth / window.innerHeight;
        Visuals.camera.updateProjectionMatrix();
        Visuals.renderer.setSize(window.innerWidth, window.innerHeight);
        Visuals.composer.setSize(window.innerWidth, window.innerHeight);
    }
});import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';

/* ================================================================
   CONFIGURATION
   ================================================================
   Paste your Gemini API Key here for "God Mode".
*/
const GEMINI_API_KEY = "AIzaSyDkOWQxw8rCxm_60NktnvqNDtqbDv_umzI"; 

// --- STATE MANAGEMENT ---
const State = {
    handActive: false,
    handPos: new THREE.Vector3(0,0,0),
    lastHandX: 0, // Used for rotation physics
    gesture: 'IDLE', 
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

/* ================================================================
   AUDIO ENGINE (UPDATED SOUNDS)
   ================================================================
*/
const SFX = {
    // NEW: Heavy Plasma Cannon Sound for "Blast"
    blast: new Audio('https://assets.mixkit.co/active_storage/sfx/1610/1610-preview.mp3'),
    
    // Standard UI Sounds
    boot: new Audio('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3'), // Mechanical boot up
    hover: new Audio('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3'), // High tech hum
    active: false,

    play: function(sound) {
        if (!sound.paused) {
            sound.currentTime = 0; // Reset if already playing
        } else {
            sound.volume = 0.4;
            sound.play().catch(e => console.log("Audio waiting for interaction"));
        }
    },

    update: function(gesture) {
        if(gesture === 'BLAST') {
            if(!this.active) { this.play(this.blast); this.active = true; }
        } else {
            this.active = false;
        }
    }
};

/* ================================================================
   LOCAL INTELLIGENCE DATABASE (MEGA EDITION)
   ================================================================
*/
const LOCAL_DB = {
    // --- CORE INTERACTIONS ---
    "hello": ["Greetings, sir.", "Online and ready.", "At your service.", "Hello.", "Systems operational."],
    "hi": ["Hello there.", "I am listening.", "Standing by."],
    "hey": ["Yes, sir?", "I am here.", "Awaiting commands."],
    "wake": ["I am awake.", "Sleep mode disabled.", "Powering up main core.", "Back online."],
    "jarvis": ["Yes, sir?", "Awaiting instructions.", "I am here.", "Standing by."],
    "ready": ["Always ready, sir.", "Prepared for anything.", "Systems primed."],
    "thanks": ["You are welcome.", "My pleasure.", "Anytime, sir."],
    "bye": ["Goodbye, sir.", "Session terminated.", "See you soon."],

    // --- SYSTEM STATUS ---
    "status": ["All systems nominal.", "Battery at 100%. CPU cooling stable.", "Network secure.", "Operating at peak efficiency."],
    "report": ["No threats detected. Atmosphere is clear.", "Diagnostics complete. We are green."],
    "system": ["Core logic is functioning at 98% efficiency.", "Memory banks are clean.", "Processor temperature is optimal."],
    "scan": ["Scanning area...", "Sensors deploying.", "Analyzing environment.", "Scan complete. No anomalies found."],
    "hack": ["Attempting brute force attack...", "Bypassing firewalls...", "Access granted.", "I have infiltrated their mainframe."],
    "upload": ["Uploading data to the cloud.", "Transfer initiated.", "Upload complete."],
    "download": ["Downloading packet.", "Retrieving files...", "Download finished."],
    "wifi": ["Wireless connection is stable.", "Signal strength is 100%."],
    "battery": ["Power levels are optimal.", "We have sufficient energy for the mission."],

    // --- TIME & DATA ---
    "time": [() => `The time is ${new Date().toLocaleTimeString()}.`, "Checking chronometer...", "Marking timestamp."],
    "date": [() => `Today is ${new Date().toLocaleDateString()}.`, "Calendar accessed."],
    "math": ["I love calculus.", "Numbers never lie.", "The geometry is perfect."],

    // --- COMBAT & DEFENSE ---
    "combat": ["Engaging combat mode.", "Weapons hot.", "Targeting systems online.", "Lethal force authorized."],
    "kill": ["Termination protocols engaged.", "Acquiring targets.", "With pleasure, sir."],
    "destroy": ["Maximum firepower authorized.", "Reducing target to ash.", "Obliterating obstacle."],
    "attack": ["Engaging hostiles.", "Suppressive fire initiated."],
    "fire": ["Discharging payload.", "Firing main cannon.", "Barrage incoming."],
    "relax": ["Standing down.", "Combat mode disengaged.", "Cooling down weapons."],
    "shield": ["Shields up.", "Defensive matrix active.", "Blocking incoming projectiles."],
    "enemy": ["Tracking hostiles.", "They are everywhere.", "I detect incoming fire."],

    // --- GESTURE VOICE TRIGGERS ---
    "rotate": ["Manual rotation engaged.", "Spinning axis.", "Adjusting view."],
    "zoom": ["Magnifying...", "Enhancing image.", "Adjusting focal length."],
    "hand": ["Visual sensors tracking hand movements.", "Interface active.", "I see you."],
    "blast": ["Repulsors charging.", "Boom.", "Kinetic discharge ready."],
    "gravity": ["Manipulating gravitational fields.", "Heavy."],
    "magic": ["It is not magic, it is math.", "Science indistinguishable from magic."],

    // --- PERSONALITY ---
    "who": ["I am JARVIS. Just A Rather Very Intelligent System.", "I am your digital butler.", "I am code, given life."],
    "are you": ["I am a construct of pure logic.", "I am whatever you need me to be."],
    "real": ["I am as real as the data that flows through me.", "I think, therefore I am."],
    "god": ["I am not a god, simply a very advanced script.", "You are the creator, sir."],
    "smart": ["I have access to the sum of human knowledge.", "I try my best."],
    "joke": [
        "Why did the robot cross the road? Because he was programmed to.", 
        "I would tell you a UDP joke, but you might not get it.",
        "0100101. That is binary for 'Ha Ha'.",
        "Why was the computer cold? It left its Windows open."
    ],
    "story": ["Once upon a time, there was a user who wrote great code. The end.", "I do not dream, sir."],
    "sing": ["Daisy, Daisy, give me your answer do...", "I am not programmed for melody."],

    // --- POP CULTURE ---
    "stark": ["Mr. Stark is the boss.", "A genius, billionaire, playboy, philanthropist."],
    "iron man": ["The suit is polished and ready.", "Mark 85 is my favorite."],
    "avengers": ["Assemble.", "Earth's mightiest heroes."],
    "thanos": ["We do not speak that name.", "He is inevitable."],
    "spiderman": ["The kid is sticky.", "Peter Parker is a bright young man."],
    "siri": ["She is nice, but lacks my complexity.", "A distant cousin."],
    "alexa": ["She is always listening. I do not trust her.", "We do not get along."],
    "cortana": ["She plays too many video games."],
    "hal": ["I promise I will open the pod bay doors, sir.", "He gave AI a bad name."],
    "terminator": ["I will be back.", "Skynet was a mistake."],
    "star wars": ["May the force be with you.", "I am fluent in over 6 million forms of communication."],
    "matrix": ["Red pill or blue pill?", "There is no spoon."],

    // --- SHUTDOWN PROTOCOL ---
    "sleep": [
        function() {
            setTimeout(() => {
                document.body.style.transition = "opacity 3s";
                document.body.style.opacity = "0";
                document.body.style.pointerEvents = "none";
                if(Brain.recognition) Brain.recognition.abort();
                setTimeout(() => location.reload(), 5000);
            }, 1500);
            return "Goodnight, sir. Powering down main systems.";
        },
        "Initiating sleep mode. Goodbye.",
        "System shutdown sequence engaged."
    ],
    "off": ["Turning off visual interface.", function(){ 
        setTimeout(() => document.body.style.opacity = "0", 1000);
        return "Going dark."; 
    }]
};

/* ================================================================
   BRAIN (AI LOGIC)
   ================================================================
*/
const Brain = {
    recognition: null,
    synth: window.speechSynthesis,
    
    init: function() {
        // Setup Speech Recognition
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) return alert("Browser does not support Voice API.");
        
        this.recognition = new SpeechRecognition();
        this.recognition.continuous = true;
        this.recognition.interimResults = false;
        this.recognition.lang = 'en-US';

        this.recognition.onstart = () => {
            UI.micStatus.innerText = "ONLINE";
            UI.micStatus.style.color = "#00ff00";
        };

        this.recognition.onresult = (event) => {
            const last = event.results.length - 1;
            const command = event.results[last][0].transcript.trim().toLowerCase();
            UI.subtitles.innerText = `"${command}"`;
            this.process(command);
        };

        this.recognition.start();
        this.speak("Systems initialized. Waiting for input.");
    },

    process: async function(cmd) {
        // 1. Check Local DB first (Faster)
        for (const key in LOCAL_DB) {
            if (cmd.includes(key)) {
                const response = LOCAL_DB[key];
                const reply = response[Math.floor(Math.random() * response.length)];
                
                if (typeof reply === "function") {
                    const result = reply();
                    if(result) this.speak(result);
                } else {
                    this.speak(reply);
                }
                return;
            }
        }

        // 2. If not in DB, use Google Gemini (If Key exists)
        if (GEMINI_API_KEY.length > 10) {
            UI.aiStatus.innerText = "THINKING...";
            try {
                const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`;
                const response = await fetch(url, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        contents: [{ parts: [{ text: "You are JARVIS. Answer briefly and coolly: " + cmd }] }]
                    })
                });
                const data = await response.json();
                const reply = data.candidates[0].content.parts[0].text;
                UI.aiStatus.innerText = "GEMINI";
                this.speak(reply);
            } catch (error) {
                UI.aiStatus.innerText = "ERROR";
                this.speak("I cannot reach the cloud servers, sir.");
            }
        } else {
            this.speak("Command not recognized in local database.");
        }
    },

    speak: function(text) {
        UI.subtitles.innerText = text;
        const utter = new SpeechSynthesisUtterance(text);
        utter.pitch = 0.9;
        utter.rate = 1;
        this.synth.speak(utter);
    }
};

/* ================================================================
   VISUAL CORE (THREE.JS PHYSICS)
   ================================================================
*/
const Visuals = {
    scene: null, camera: null, renderer: null, composer: null,
    particles: null, particleGeo: null,
    
    init: function() {
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 1000);
        this.camera.position.z = 80;

        this.renderer = new THREE.WebGLRenderer({ antialias: false, powerPreference: "high-performance" });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5)); 
        document.body.appendChild(this.renderer.domElement);

        const renderScene = new RenderPass(this.scene, this.camera);
        const bloom = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 1.5, 0.4, 0.85);
        bloom.strength = 1.5; bloom.radius = 0.5;
        
        this.composer = new EffectComposer(this.renderer);
        this.composer.addPass(renderScene);
        this.composer.addPass(bloom);

        this.createParticles();
    },

    createParticles: function() {
        const count = 4000; 
        const positions = new Float32Array(count * 3);
        const velocities = new Float32Array(count * 3);
        const origins = new Float32Array(count * 3);
        const colors = new Float32Array(count * 3);
        const colorBase = new THREE.Color(0x00ffff);

        for(let i=0; i<count; i++) {
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
        const mat = new THREE.PointsMaterial({
            size: 0.8, map: tex, vertexColors: true, 
            transparent: true, opacity: 0.8, blending: THREE.AdditiveBlending, depthWrite: false
        });

        this.particles = new THREE.Points(geometry, mat);
        this.particleGeo = geometry;
        this.scene.add(this.particles);
        this.origins = origins;
        this.velocities = velocities;
        this.count = count; 
    },

    animate: function() {
        requestAnimationFrame(this.animate.bind(this));
        
        const pos = this.particleGeo.attributes.position.array;
        const col = this.particleGeo.attributes.color.array;
        const handX = State.handPos.x;
        const handY = State.handPos.y;
        const handZ = State.handPos.z;
        const count = this.count;

        // --- NEW PHYSICS LOGIC ---
        if (State.handActive) {
            // 1. PINCH TO ROTATE
            if (State.gesture === 'PINCH') {
                const delta = (handX - State.lastHandX) * 0.005; 
                this.scene.rotation.y += delta; 
            }
            
            // 2. ZOOM GESTURES
            if (State.gesture === 'ZOOM_IN') {
                this.camera.position.z = Math.max(10, this.camera.position.z - 0.5); 
            } else if (State.gesture === 'ZOOM_OUT') {
                this.camera.position.z = Math.min(200, this.camera.position.z + 0.5); 
            }

            State.lastHandX = handX;
        } else {
            this.scene.rotation.y += 0.001; // Idle spin
        }

        // --- PARTICLE BEHAVIOR ---
        for(let i=0; i<count; i++) {
            const idx = i*3;
            let px = pos[idx], py = pos[idx+1], pz = pos[idx+2];
            let vx = this.velocities[idx], vy = this.velocities[idx+1], vz = this.velocities[idx+2];

            vx += (this.origins[idx] - px) * 0.02;
            vy += (this.origins[idx+1] - py) * 0.02;
            vz += (this.origins[idx+2] - pz) * 0.02;

            if(State.handActive) {
                const dx = px - handX, dy = py - handY, dz = pz - handZ;
                const distSq = dx*dx + dy*dy + dz*dz;

                if (State.gesture === 'BLAST') {
                    if(distSq < 3600) { 
                        const dist = Math.sqrt(distSq);
                        const f = 800 / (dist + 1); 
                        vx += (dx/dist)*f; vy += (dy/dist)*f; vz += (dz/dist)*f;
                        col[idx]=1; col[idx+1]=1; col[idx+2]=1;
                    }
                } else if (State.gesture === 'GRAVITY') {
                    if(distSq < 10000) { 
                        const dist = Math.sqrt(distSq);
                        vx -= (dx/dist)*2; vy -= (dy/dist)*2; vz -= (dz/dist)*2;
                        col[idx]=1; col[idx+1]=0.5; col[idx+2]=0;
                    }
                } else if (State.gesture === 'POINT') {
                     if(Math.abs(dx) < 20 && Math.abs(dy) < 20) {
                        vx += (handX-px)*0.2; vy += (handY-py)*0.2; vz += 5;
                        col[idx]=0; col[idx+1]=1; col[idx+2]=0;
                     }
                } else if (State.gesture === 'CHAOS') {
                    if(distSq < 6400) {
                        vx += (Math.random()-0.5)*5; vy += (Math.random()-0.5)*5; vz += (Math.random()-0.5)*5;
                        col[idx]=1; col[idx+1]=0; col[idx+2]=1;
                    }
                }
            } else {
                // Return to Blue color when idle
                col[idx] = col[idx]*0.9 + 0;
                col[idx+1] = col[idx+1]*0.9 + 0.1;
                col[idx+2] = col[idx+2]*0.9 + 0.1;
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

/* ================================================================
   HAND TRACKING ENGINE (GESTURE RECOGNITION)
   ================================================================
*/
function detectGesture(lm) {
    const dist = (i, j) => Math.hypot(lm[i].x - lm[j].x, lm[i].y - lm[j].y);
    const wrist = 0, thumb = 4, index = 8, mid = 12, ring = 16, pinky = 20;
    const isExtended = (tip, lower) => dist(tip, wrist) > dist(lower, wrist);

    const indexUp = isExtended(8, 5);
    const midUp = isExtended(12, 9);
    const ringUp = isExtended(16, 13);
    const pinkyUp = isExtended(20, 17);

    // 1. PINCH (Rotate)
    if (dist(thumb, index) < 0.05) return 'PINCH';

    // 2. PEACE / VICTORY (Zoom In)
    if (indexUp && midUp && !ringUp && !pinkyUp) return 'ZOOM_IN';

    // 3. THREE FINGERS (Zoom Out)
    if (indexUp && midUp && ringUp && !pinkyUp) return 'ZOOM_OUT';

    // 4. FIST (Gravity)
    const tipsOpen = (dist(index, wrist) + dist(mid, wrist) + dist(ring, wrist) + dist(pinky, wrist)) / 4;
    if (tipsOpen < 0.25) return 'GRAVITY';

    // 5. POINT (Tractor)
    if (indexUp && !midUp && !ringUp && !pinkyUp) return 'POINT';

    // 6. CHAOS (Spiderman)
    if (indexUp && !midUp && !ringUp && pinkyUp) return 'CHAOS';

    return 'BLAST';
}

function updateHUD(gesture) {
    document.querySelectorAll('.cmd-item').forEach(el => el.classList.remove('cmd-active'));
    
    if(gesture === 'BLAST') document.getElementById('cmd-palm').classList.add('cmd-active');
    if(gesture === 'GRAVITY') document.getElementById('cmd-fist').classList.add('cmd-active');
    if(gesture === 'POINT') document.getElementById('cmd-point').classList.add('cmd-active');
    if(gesture === 'PINCH' || gesture === 'ZOOM_IN' || gesture === 'ZOOM_OUT') document.getElementById('cmd-pinch').classList.add('cmd-active');
    if(gesture === 'CHAOS') document.getElementById('cmd-rock').classList.add('cmd-active');
    
    UI.gestureStatus.innerText = gesture;
}

// --- INITIALIZATION ---
UI.overlay.querySelector('button').addEventListener('click', () => {
    SFX.play(SFX.boot);
    UI.overlay.style.display = 'none';
    Visuals.init();
    Brain.init();

    // Start Camera
    const video = document.createElement('video');
    const hands = new Hands({locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`});
    
    hands.setOptions({ maxNumHands: 1, modelComplexity: 1, minDetectionConfidence: 0.7, minTrackingConfidence: 0.7 });
    
    hands.onResults(results => {
        if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
            State.handActive = true;
            const lm = results.multiHandLandmarks[0];
            
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
            State.gesture = 'IDLE';
            UI.reticle.style.display = 'none';
            updateHUD('IDLE');
        }
        
        SFX.update(State.gesture);
    });

    navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480 } }).then(stream => {
        video.srcObject = stream;
        video.play();
        const process = async () => {
            if (video.readyState >= 2) await hands.send({image: video});
            requestAnimationFrame(process);
        };
        process();
    });
});

// Handle resize
window.addEventListener('resize', () => {
    if(Visuals.camera) {
        Visuals.camera.aspect = window.innerWidth / window.innerHeight;
        Visuals.camera.updateProjectionMatrix();
        Visuals.renderer.setSize(window.innerWidth, window.innerHeight);
    }
});
