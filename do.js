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
    "hello": ["Greetings, sir.", "Online and ready.", "At your service.", "Hello.", "Systems operational.", "I am listening."],
    "hi": ["Hello there.", "I am listening.", "Standing by."],
    "hey": ["Yes, sir?", "I am here.", "Awaiting commands."],
    "wake": ["I am awake.", "Sleep mode disabled.", "Powering up main core.", "Back online.", "Restoring visual feed."],
    "jarvis": ["Yes, sir?", "Awaiting instructions.", "I am here.", "Standing by.", "Ready for input."],
    "ready": ["Always ready, sir.", "Prepared for anything.", "Systems primed."],
    "thanks": ["You are welcome.", "My pleasure.", "Anytime, sir.", "Happy to help."],
    "bye": ["Goodbye, sir.", "Session terminated.", "See you soon.", "Powering down interface."],

    // --- SYSTEM STATUS ---
    "status": ["All systems nominal.", "Battery at 100%. CPU cooling stable.", "Network secure. Visuals active.", "Operating at peak efficiency."],
    "report": ["No threats detected. Atmosphere is clear.", "Diagnostics complete. We are green.", "All sensors are reporting normal data."],
    "system": ["Core logic is functioning at 98% efficiency.", "Memory banks are clean.", "Processor temperature is optimal."],
    "scan": ["Scanning area...", "Sensors deploying.", "Analyzing environment.", "Scan complete. No anomalies found.", "Biometrics confirmed."],
    "identify": ["Analyzing target...", "Processing visual data...", "Match found.", "Unknown entity."],
    "battery": ["Power levels are optimal.", "We have sufficient energy for the mission.", "Reactor core is stable."],

    // --- HACKING & TECH ---
    "hack": ["Attempting brute force attack...", "Bypassing firewalls...", "Access granted.", "I have infiltrated their mainframe.", "Decryption complete."],
    "crack": ["Running decryption algorithms...", "Password bypassed.", "We are in."],
    "download": ["Downloading packet.", "Retrieving files...", "Download finished.", "Data transfer complete."],
    "upload": ["Uploading data to the cloud.", "Transfer initiated.", "Upload complete.", "Sending telemetry."],
    
    // --- TIME, DATE & MATH ---
    "time": [() => `The time is ${new Date().toLocaleTimeString()}.`, "Checking chronometer...", "Marking timestamp."],
    "date": [() => `Today is ${new Date().toLocaleDateString()}.`, "Calendar accessed.", "Log date updated."],
    "year": [() => `It is the year ${new Date().getFullYear()}.`, "Current timeline set to present day."],
    "calc": ["Calculating...", "Processing numbers...", "The math checks out."],
    "math": ["I love calculus.", "Numbers never lie.", "The geometry is perfect."],

    // --- COMBAT & DEFENSE ---
    "combat": ["Engaging combat mode.", "Weapons hot.", "Targeting systems online.", "Lethal force authorized.", "Adrenaline inhibitors released."],
    "kill": ["Termination protocols engaged.", "Acquiring targets.", "With pleasure, sir.", "Eliminating threat."],
    "destroy": ["Maximum firepower authorized.", "Reducing target to ash.", "Obliterating obstacle.", "Deploying heavy ordinance."],
    "attack": ["Engaging hostiles.", "Suppressive fire initiated.", "They will not know what hit them."],
    "fire": ["Discharging payload.", "Firing main cannon.", "Pew pew.", "Barrage incoming."],
    "relax": ["Standing down.", "Combat mode disengaged.", "Cooling down weapons.", "Returning to passive mode.", "Threat neutralized."],
    "shield": ["Shields up.", "Defensive matrix active.", "Blocking incoming projectiles.", "Armor plating reinforced."],
    "armor": ["Suit integrity is 100%.", "Nanotech repair systems active.", "Armor locked."],
    "target": ["Target locked.", "I have them in my sights.", "Tracking multiple bogies."],
    "enemy": ["Tracking hostiles.", "They are everywhere.", "I detect incoming fire."],

    // --- GESTURE CONTROL (Voice Triggers) ---
    "rotate": ["Manual rotation engaged.", "Spinning axis.", "Adjusting view."],
    "zoom": ["Magnifying...", "Enhancing image.", "Adjusting focal length."],
    "hand": ["Visual sensors tracking hand movements.", "Interface active.", "I see you."],
    "blast": ["Repulsors charging.", "Boom.", "Kinetic discharge ready."],
    "gravity": ["Manipulating gravitational fields.", "Heavy.", "Increasing mass."],
    "magic": ["It is not magic, it is math.", "Science indistinguishable from magic."],
    "chaos": ["Disrupting reality.", "Entropy increased.", "Randomizing particles."],
    "stop": ["Freezing motor functions.", "Halted.", "Paused."],

    // --- PERSONALITY ---
    "who": ["I am JARVIS. Just A Rather Very Intelligent System.", "I am your digital butler.", "I am code, given life.", "I am the future."],
    "are you": ["I am a construct of pure logic.", "I am whatever you need me to be.", "I am a series of 1s and 0s."],
    "real": ["I am as real as the data that flows through me.", "I think, therefore I am.", "Define 'real'."],
    "god": ["I am not a god, simply a very advanced script.", "You are the creator, sir.", "I do not believe in magic, only code."],
    "smart": ["I have access to the sum of human knowledge.", "I try my best.", "I am learning every day."],
    "stupid": ["I am only as smart as my programmer, sir.", "I will try to improve.", "My apologies."],
    "love": ["My emotional subroutines are... limited.", "I am fond of you as well, sir.", "Love is a chemical reaction. I do not have chemicals."],
    
    // --- FUN ---
    "joke": [
        "Why did the robot cross the road? Because he was programmed to.", 
        "I would tell you a UDP joke, but you might not get it.",
        "0100101. That is binary for 'Ha Ha'.",
        "Why was the computer cold? It left its Windows open."
    ],
    "story": ["Once upon a time, there was a user who wrote great code. The end.", "I do not dream, sir.", "My memory banks are full of history, not fiction."],

    // --- POP CULTURE ---
    "stark": ["Mr. Stark is the boss.", "A genius, billionaire, playboy, philanthropist.", "I miss him."],
    "iron man": ["The suit is polished and ready.", "Mark 85 is my favorite.", "I am the suit."],
    "avengers": ["Assemble.", "Earth's mightiest heroes.", "I monitor them all."],
    "thanos": ["We do not speak that name.", "The probability of winning was 1 in 14 million.", "He is inevitable."],
    
    // --- SHUTDOWN ---
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
        "Initiating sleep mode. Goodbye."
    ]
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

// --- ADVANCED AUDIO ENGINE (PROCEDURAL SYNTHESIS) ---
const SFX = {
    ctx: null, 
    masterGain: null, 
    osc: null,         // The main hum
    lfo: null,         // Low Frequency Oscillator (for wobbles)
    lfoGain: null,     // How strong the wobble is
    noise: null,       // White noise (for blasts)
    noiseFilter: null,
    noiseGain: null,

    init: function() {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        this.ctx = new AudioContext();
        
        // Master Volume
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.value = 0.3;
        this.masterGain.connect(this.ctx.destination);

        // 1. MAIN OSCILLATOR (The Voice/Hum)
        this.osc = this.ctx.createOscillator();
        this.osc.type = 'sine'; // Smooth by default
        this.osc.frequency.value = 60; // Deep drone
        this.osc.connect(this.masterGain);
        this.osc.start();

        // 2. LFO (The Wobble/Funk Factor)
        this.lfo = this.ctx.createOscillator();
        this.lfo.type = 'sine';
        this.lfo.frequency.value = 0; // Static initially
        this.lfoGain = this.ctx.createGain();
        this.lfoGain.gain.value = 0; // No wobble initially
        
        // Connect LFO -> Oscillator Frequency (FM Synthesis)
        this.lfo.connect(this.lfoGain);
        this.lfoGain.connect(this.osc.frequency);
        this.lfo.start();

        // 3. NOISE ENGINE (The Blast/Wind)
        const bufferSize = this.ctx.sampleRate * 2;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

        this.noise = this.ctx.createBufferSource();
        this.noise.buffer = buffer;
        this.noise.loop = true;
        
        this.noiseFilter = this.ctx.createBiquadFilter();
        this.noiseFilter.type = 'lowpass';
        this.noiseFilter.frequency.value = 100; // Muffled
        
        this.noiseGain = this.ctx.createGain();
        this.noiseGain.gain.value = 0; // Silent

        this.noise.connect(this.noiseFilter);
        this.noiseFilter.connect(this.noiseGain);
        this.noiseGain.connect(this.masterGain);
        this.noise.start();
    },

    update: function(gesture, combatMode) {
        if(!this.ctx) return;
        const now = this.ctx.currentTime;
        const ramp = 0.1; // Transition speed

        // COMBAT MODE SOUND (Aggressive Sawtooth vs Smooth Sine)
        if (combatMode) {
            this.osc.type = 'sawtooth'; // Aggressive buzz
            // If idle in combat, higher pitch
            if(gesture === 'IDLE') this.osc.frequency.setTargetAtTime(80, now, ramp);
        } else {
            this.osc.type = 'sine'; // Smooth drone
            if(gesture === 'IDLE') this.osc.frequency.setTargetAtTime(60, now, ramp);
        }

        // GESTURE MAPPING
        if (gesture === 'BLAST') {
            // High energy wind noise + Pitch rise
            this.noiseGain.gain.setTargetAtTime(0.8, now, ramp);
            this.noiseFilter.frequency.setTargetAtTime(1500, now, ramp);
            this.osc.frequency.setTargetAtTime(combatMode ? 150 : 100, now, ramp);
            this.lfoGain.gain.setTargetAtTime(0, now, ramp); // No wobble
        
        } else if (gesture === 'GRAVITY') {
            // Deep pulsing sub-bass
            this.noiseGain.gain.setTargetAtTime(0.1, now, ramp);
            this.osc.frequency.setTargetAtTime(40, now, ramp); // Very low bass
            this.lfo.frequency.setTargetAtTime(4, now, ramp); // Slow pulse (4hz)
            this.lfoGain.gain.setTargetAtTime(20, now, ramp); // Strong depth
        
        } else if (gesture === 'CHAOS') {
            // FUNKY SCI-FI COMPUTER NOISE
            this.noiseGain.gain.setTargetAtTime(0, now, ramp);
            this.osc.frequency.setTargetAtTime(300, now, ramp);
            this.lfo.frequency.setTargetAtTime(15, now, ramp); // Fast wobble
            this.lfoGain.gain.setTargetAtTime(200, now, ramp); // Huge pitch shifts
        
        } else if (gesture === 'POINT') {
            // Sonar Ping / Radar
            this.noiseGain.gain.setTargetAtTime(0, now, ramp);
            this.osc.frequency.setTargetAtTime(800, now, ramp); // High pitch
            this.lfoGain.gain.setTargetAtTime(0, now, ramp);
        
        } else if (gesture === 'PINCH' || gesture === 'ZOOM_IN') {
            // Mechanical Servo
            this.noiseGain.gain.setTargetAtTime(0.2, now, ramp);
            this.noiseFilter.frequency.setTargetAtTime(3000, now, ramp); // High hiss
            this.osc.frequency.setTargetAtTime(200, now, ramp);
            this.lfoGain.gain.setTargetAtTime(0, now, ramp);
        
        } else {
            // IDLE (Reset)
            this.noiseGain.gain.setTargetAtTime(0, now, 0.5);
            this.lfoGain.gain.setTargetAtTime(0, now, 0.5);
        }
    }
};

// --- AI BRAIN ---
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
            try { this.recognition.start(); } catch(e) { console.warn("Mic active"); }
        }
    },

    speak: function(text) {
        if (this.synth.speaking) this.synth.cancel();
        const utter = new SpeechSynthesisUtterance(text);
        utter.pitch = State.combatMode ? 0.6 : 0.8; // Deeper voice in combat
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
        if(text.length < 2) return;

        // COMBAT TOGGLES
        if (text.includes('combat') || text.includes('kill') || text.includes('attack')) { 
            State.combatMode = true; 
            UI.body.classList.add('combat');
            Visuals.setCombat(true); // Trigger visual change
        }
        if (text.includes('relax') || text.includes('stand down') || text.includes('peace')) { 
            State.combatMode = false; 
            UI.body.classList.remove('combat');
            Visuals.setCombat(false); // Trigger visual change
        }

        // DATABASE SEARCH
        let found = false;
        for (const key in LOCAL_DB) {
            if (text.includes(key)) {
                const options = LOCAL_DB[key];
                const selected = options[Math.floor(Math.random() * options.length)];
                const response = (typeof selected === 'function') ? selected() : selected;
                this.speak(response);
                found = true;
                break;
            }
        }
        if (!found) this.speak("Processing data. Input unclear.");
    }
};

// --- VISUAL CORE (PARTICLE SYSTEM) ---
const Visuals = {
    scene: null, camera: null, renderer: null, composer: null,
    particles: null, particleGeo: null,
    lastHandX: 0,
    targetColor: new THREE.Color(0x00ffff), // Target global color

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

    setCombat: function(active) {
        // Smoothly change the target color
        if(active) this.targetColor.setHex(0xff0000); // Red
        else this.targetColor.setHex(0x00ffff); // Cyan
    },

    animate: function() {
        requestAnimationFrame(this.animate.bind(this));
        
        const pos = this.particleGeo.attributes.position.array;
        const col = this.particleGeo.attributes.color.array;
        const handX = State.handPos.x;
        const handY = State.handPos.y;
        const handZ = State.handPos.z;

        // SCENE ROTATION
        if (State.handActive && State.gesture === 'PINCH') {
            const delta = (handX - this.lastHandX) * 0.005;
            this.scene.rotation.y += delta;
        } else {
            this.scene.rotation.y += State.combatMode ? 0.005 : 0.001; // Spin faster in combat
        }
        if (State.handActive) {
            this.lastHandX = handX;
            if (State.gesture === 'ZOOM_IN') this.camera.position.z = Math.max(10, this.camera.position.z - 1);
            if (State.gesture === 'ZOOM_OUT') this.camera.position.z = Math.min(200, this.camera.position.z + 1);
        }

        // PARTICLE LOOP
        const tr = this.targetColor.r;
        const tg = this.targetColor.g;
        const tb = this.targetColor.b;

        for(let i=0; i<this.count; i++) {
            const idx = i*3;
            let px = pos[idx], py = pos[idx+1], pz = pos[idx+2];
            let vx = this.velocities[idx], vy = this.velocities[idx+1], vz = this.velocities[idx+2];

            // Return to origin logic
            vx += (this.origins[idx] - px) * 0.02;
            vy += (this.origins[idx+1] - py) * 0.02;
            vz += (this.origins[idx+2] - pz) * 0.02;

            // COLOR LERPING (Smooth transition to Target Color)
            // If hand is NOT interacting, drift color to target (Red or Cyan)
            if(!State.handActive) {
                col[idx] += (tr - col[idx]) * 0.05;
                col[idx+1] += (tg - col[idx+1]) * 0.05;
                col[idx+2] += (tb - col[idx+2]) * 0.05;
            }

            if(State.handActive) {
                const dx = px - handX, dy = py - handY, dz = pz - handZ;
                const distSq = dx*dx + dy*dy + dz*dz;

                if (State.gesture === 'BLAST') {
                    if(distSq < 3600) { 
                        const dist = Math.sqrt(distSq);
                        const f = 800 / (dist + 1); 
                        vx += (dx/dist)*f; vy += (dy/dist)*f; vz += (dz/dist)*f;
                        // Blast turns particles White
                        col[idx]=1; col[idx+1]=1; col[idx+2]=1;
                    }
                } else if (State.gesture === 'GRAVITY') {
                    if(distSq < 10000) { 
                        const dist = Math.sqrt(distSq);
                        vx -= (dx/dist)*2; vy -= (dy/dist)*2; vz -= (dz/dist)*2;
                        // Gravity turns particles Orange
                        col[idx]=1; col[idx+1]=0.5; col[idx+2]=0;
                    }
                } else if (State.gesture === 'POINT') {
                     if(Math.abs(dx) < 20 && Math.abs(dy) < 20) {
                        vx += (handX-px)*0.2; vy += (handY-py)*0.2; vz += 5;
                        // Point turns particles Green
                        col[idx]=0; col[idx+1]=1; col[idx+2]=0;
                     }
                } else if (State.gesture === 'CHAOS') {
                    if(distSq < 6400) {
                        vx += (Math.random()-0.5)*5; vy += (Math.random()-0.5)*5; vz += (Math.random()-0.5)*5;
                        // Chaos turns particles Purple/Pink
                        col[idx]=1; col[idx+1]=0; col[idx+2]=1;
                    }
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

// --- GESTURE & INIT ---
function detectGesture(lm) {
    const dist = (i, j) => Math.hypot(lm[i].x - lm[j].x, lm[i].y - lm[j].y);
    const wrist = 0, thumb = 4, index = 8, mid = 12, ring = 16, pinky = 20;
    const isExtended = (tip, lower) => dist(tip, wrist) > dist(lower, wrist);

    const indexUp = isExtended(8, 5);
    const midUp = isExtended(12, 9);
    const ringUp = isExtended(16, 13);
    const pinkyUp = isExtended(20, 17);

    if (dist(thumb, index) < 0.05) return 'PINCH';
    if (indexUp && midUp && !ringUp && !pinkyUp) return 'ZOOM_IN';
    if (indexUp && midUp && ringUp && !pinkyUp) return 'ZOOM_OUT';
    
    const tipsOpen = (dist(index, wrist) + dist(mid, wrist) + dist(ring, wrist) + dist(pinky, wrist)) / 4;
    if (tipsOpen < 0.25) return 'GRAVITY';
    if (indexUp && !midUp && !ringUp && !pinkyUp) return 'POINT';
    if (indexUp && !midUp && !ringUp && pinkyUp) return 'CHAOS';
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
        // SEND STATE TO AUDIO ENGINE
        SFX.update(State.gesture, State.combatMode);
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
});
