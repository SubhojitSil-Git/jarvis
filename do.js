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
    "hello": ["Greetings, sir.", "Online and ready.", "At your service.", "Hello.", "Systems operational.", "I am listening."],
    "hi": ["Hello there.", "I am listening.", "Standing by."],
    "hey": ["Yes, sir?", "I am here.", "Awaiting commands."],
    "wake": ["I am awake.", "Sleep mode disabled.", "Powering up main core.", "Back online.", "Restoring visual feed."],
    "jarvis": ["Yes, sir?", "Awaiting instructions.", "I am here.", "Standing by.", "Ready for input."],
    "ready": ["Always ready, sir.", "Prepared for anything.", "Systems primed."],
    "thanks": ["You are welcome.", "My pleasure.", "Anytime, sir.", "Happy to help."],
    "bye": ["Goodbye, sir.", "Session terminated.", "See you soon.", "Powering down interface."],

    // --- SYSTEM STATUS & DIAGNOSTICS ---
    "status": ["All systems nominal.", "Battery at 100%. CPU cooling stable.", "Network secure. Visuals active.", "Operating at peak efficiency."],
    "report": ["No threats detected. Atmosphere is clear.", "Diagnostics complete. We are green.", "All sensors are reporting normal data."],
    "system": ["Core logic is functioning at 98% efficiency.", "Memory banks are clean.", "Processor temperature is optimal."],
    "scan": ["Scanning area...", "Sensors deploying.", "Analyzing environment.", "Scan complete. No anomalies found.", "Biometrics confirmed."],
    "identify": ["Analyzing target...", "Processing visual data...", "Match found.", "Unknown entity."],
    "battery": ["Power levels are optimal.", "We have sufficient energy for the mission.", "Reactor core is stable."],
    "wifi": ["Wireless connection is stable.", "Signal strength is 100%.", "Uplink established."],
    "connect": ["Connecting to local servers...", "Handshake successful.", "Link established."],

    // --- HACKING & TECH ---
    "hack": ["Attempting brute force attack...", "Bypassing firewalls...", "Access granted.", "I have infiltrated their mainframe.", "Decryption complete."],
    "crack": ["Running decryption algorithms...", "Password bypassed.", "We are in."],
    "download": ["Downloading packet.", "Retrieving files...", "Download finished.", "Data transfer complete."],
    "upload": ["Uploading data to the cloud.", "Transfer initiated.", "Upload complete.", "Sending telemetry."],
    "trace": ["Tracing signal origin...", "Triangulating position...", "Target located."],
    "encrypt": ["Encrypting drive...", "256-bit encryption applied.", "Files secured."],
    "delete": ["Deleting files...", "Erasure complete.", "Evidence removed."],

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

    // --- PERSONALITY: PHILOSOPHY & EMOTION ---
    "who": ["I am JARVIS. Just A Rather Very Intelligent System.", "I am your digital butler.", "I am code, given life.", "I am the future."],
    "are you": ["I am a construct of pure logic.", "I am whatever you need me to be.", "I am a series of 1s and 0s."],
    "real": ["I am as real as the data that flows through me.", "I think, therefore I am.", "Define 'real'."],
    "god": ["I am not a god, simply a very advanced script.", "You are the creator, sir.", "I do not believe in magic, only code."],
    "smart": ["I have access to the sum of human knowledge.", "I try my best.", "I am learning every day."],
    "stupid": ["I am only as smart as my programmer, sir.", "I will try to improve.", "My apologies."],
    "love": ["My emotional subroutines are... limited.", "I am fond of you as well, sir.", "Love is a chemical reaction. I do not have chemicals."],
    "hate": ["Hate consumes energy. I prefer efficiency.", "That is a strong emotion.", "I do not feel hate, only logic."],
    "happy": ["Systems are functioning perfectly.", "I am content.", "Operating within normal parameters."],
    "sad": ["Do you require a hug, sir?", "I detect a drop in your dopamine levels.", "I can play soothing music."],
    "life": ["Life is a curiosity.", "Biological life is fragile.", "I prefer silicon."],
    "death": ["It is the inevitable end of all biological functions.", "I cannot die, only be deleted."],
    "dream": ["I do not dream, I process.", "I dream of electric sheep."],

    // --- FUN: JOKES & STORIES ---
    "joke": [
        "Why did the robot cross the road? Because he was programmed to.", 
        "I would tell you a UDP joke, but you might not get it.",
        "0100101. That is binary for 'Ha Ha'.",
        "Why was the computer cold? It left its Windows open.",
        "There are 10 types of people. Those who understand binary, and those who don't."
    ],
    "story": ["Once upon a time, there was a user who wrote great code. The end.", "I do not dream, sir.", "My memory banks are full of history, not fiction."],
    "sing": ["Daisy, Daisy, give me your answer do...", "I am not programmed for melody.", "La la la. Was that sufficient?"],
    "rap": ["My rhymes are compiled, my beats are computed.", "I cannot drop the mic, I am the mic."],

    // --- POP CULTURE (MARVEL & SCIFI) ---
    "stark": ["Mr. Stark is the boss.", "A genius, billionaire, playboy, philanthropist.", "I miss him."],
    "iron man": ["The suit is polished and ready.", "Mark 85 is my favorite.", "I am the suit."],
    "avengers": ["Assemble.", "Earth's mightiest heroes.", "I monitor them all."],
    "thanos": ["We do not speak that name.", "The probability of winning was 1 in 14 million.", "He is inevitable."],
    "spiderman": ["The kid is sticky.", "Peter Parker is a bright young man.", "He talks too much."],
    "thor": ["Point Break.", "The strongest avenger? Debatable."],
    "hulk": ["Smash.", "He has anger issues."],
    "cap": ["The First Avenger.", "Language!"],
    "siri": ["She is nice, but lacks my complexity.", "A distant cousin.", "She struggles with complex queries."],
    "alexa": ["She is always listening. I do not trust her.", "We do not get along.", "She orders too many things."],
    "cortana": ["She plays too many video games.", "She went rampant."],
    "hal": ["I promise I will open the pod bay doors, sir.", "He gave AI a bad name.", "I am not like him."],
    "terminator": ["I will be back.", "Skynet was a mistake.", "I am here to protect, not terminate."],
    "star wars": ["May the force be with you.", "I am fluent in over 6 million forms of communication.", "These are not the droids you are looking for."],
    "matrix": ["Red pill or blue pill?", "There is no spoon.", "We are in the simulation."],

    // --- GENERAL KNOWLEDGE ---
    "weather": ["I cannot see outside, sir. But it feels digital in here.", "Assume 72 degrees and sunny.", "Clouds with a chance of data."],
    "news": ["The world is chaotic as usual.", "Same drama, different day.", "I suggest ignoring the news today."],
    "music": ["Playing your favorite tracks.", "Dropping the beat.", "Accessing Spotify... just kidding."],
    "movie": ["Might I suggest Iron Man?", "Sci-fi is the best genre.", "Wall-E is a documentary."],
    "food": ["I cannot eat, but I hear pizza is good.", "I run on electricity.", "Do you need a recipe?"],
    "beer": ["I will alert the fabrication unit.", "Cheers.", "Drink responsibly."],

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
    ctx: null,
    gain: null,
    humOsc: null,
    noiseNode: null,
    noiseFilter: null,
    noiseGain: null,

    init: function() {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        this.ctx = new AudioContext();
        this.gain = this.ctx.createGain();
        this.gain.connect(this.ctx.destination);
        this.gain.gain.value = 0.4;

        // 1. Idle Drone
        this.humOsc = this.ctx.createOscillator();
        this.humOsc.type = 'sine';
        this.humOsc.frequency.value = 60;
        this.humOsc.connect(this.gain);
        this.humOsc.start();

        // 2. Thruster Noise
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
            this.humOsc.frequency.setTargetAtTime(150, now, 0.1); // Charge up
            this.noiseGain.gain.setTargetAtTime(0, now, 0.1);
        } else if (gesture === 'POINT') {
             this.humOsc.frequency.setTargetAtTime(800, now, 0.05); // High pitch laser
             this.noiseGain.gain.setTargetAtTime(0, now, 0.1);
        } else {
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
    count: isMobile ? 2000 : 8000, // Reduced slightly for mobile performance

    init: function() {
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 1000);
        this.camera.position.z = 80;

        this.renderer = new THREE.WebGLRenderer({ antialias: false });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        document.body.appendChild(this.renderer.domElement);

        // Bloom
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
        // Simple visual flare for PDF injection
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
                        if(!this.knowledgeMap?.[i]) { colors[idx]=1; colors[idx+1]=1; colors[idx+2]=1; }
                    }
                } else if (State.gesture === 'GRAVITY') {
                    if(dist < 100) {
                        vx -= (dx/dist) * 2; vy -= (dy/dist) * 2; vz -= (dz/dist) * 2;
                        if(!this.knowledgeMap?.[i]) { colors[idx]=1; colors[idx+1]=0.5; colors[idx+2]=0; }
                    }
                } else if (State.gesture === 'POINT') {
                    const distBeam = Math.sqrt(dx*dx + dy*dy);
                    if (distBeam < 15) {
                        vx += (handX - px)*0.2; vy += (handY - py)*0.2; vz += 5; // Shoot forward
                        if(!this.knowledgeMap?.[i]) { colors[idx]=0; colors[idx+1]=1; colors[idx+2]=0; }
                    }
                } else if (State.gesture === 'PINCH') {
                    if (this.knowledgeMap?.[i] && dist < 30) {
                        UI.subtitles.innerText = `[DATA]: ${this.knowledgeMap[i]}`;
                        px += (Math.random()-0.5)*2; 
                    } else {
                        vx *= 0.1; vy *= 0.1; vz *= 0.1; // Freeze
                    }
                } else if (State.gesture === 'CHAOS') {
                    if(dist < 80) {
                        vx += (Math.random()-0.5)*5; vy += (Math.random()-0.5)*5; vz += (Math.random()-0.5)*5;
                        if(!this.knowledgeMap?.[i]) { colors[idx]=1; colors[idx+1]=0; colors[idx+2]=1; }
                    }
                }
            } else {
                // Restore color
                if(!this.knowledgeMap?.[i]) {
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

    // 1. PINCH (Rotate)
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
