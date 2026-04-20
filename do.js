import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';

/* ================================================================
   LOCAL INTELLIGENCE DATABASE (GOD MODE)
   ================================================================
*/
const LOCAL_DB = {
    "hello": ["Greetings, sir.", "Online and ready.", "At your service.", "Hello.", "Systems operational.", "I am listening."],
    "hi": ["Hello there.", "I am listening.", "Standing by."],
    "hey": ["Yes, sir?", "I am here.", "Awaiting commands."],
    "wake": ["I am awake.", "Sleep mode disabled.", "Powering up main core.", "Back online.", "Restoring visual feed."],
    "jarvis": ["Yes, sir?", "Awaiting instructions.", "I am here.", "Standing by.", "Ready for input."],
    "ready": ["Always ready, sir.", "Prepared for anything.", "Systems primed."],
    "thanks": ["You are welcome.", "My pleasure.", "Anytime, sir.", "Happy to help."],
    "bye": ["Goodbye, sir.", "Session terminated.", "See you soon.", "Powering down interface."],

    "status": ["All systems nominal.", "Battery at 100%. CPU cooling stable.", "Network secure. Visuals active.", "Operating at peak efficiency."],
    "report": ["No threats detected. Atmosphere is clear.", "Diagnostics complete. We are green.", "All sensors are reporting normal data."],
    "system": ["Core logic is functioning at 98% efficiency.", "Memory banks are clean.", "Processor temperature is optimal."],
    "scan": ["Scanning area...", "Sensors deploying.", "Analyzing environment.", "Scan complete. No anomalies found.", "Biometrics confirmed."],
    "identify": ["Analyzing target...", "Processing visual data...", "Match found.", "Unknown entity."],
    "battery": ["Power levels are optimal.", "We have sufficient energy for the mission.", "Reactor core is stable."],
    "wifi": ["Wireless connection is stable.", "Signal strength is 100%.", "Uplink established."],
    "connect": ["Connecting to local servers...", "Handshake successful.", "Link established."],

    "hack": ["Attempting brute force attack...", "Bypassing firewalls...", "Access granted.", "I have infiltrated their mainframe.", "Decryption complete."],
    "crack": ["Running decryption algorithms...", "Password bypassed.", "We are in."],
    "download": ["Downloading packet.", "Retrieving files...", "Download finished.", "Data transfer complete."],
    "upload": ["Uploading data to the cloud.", "Transfer initiated.", "Upload complete.", "Sending telemetry."],
    "trace": ["Tracing signal origin...", "Triangulating position...", "Target located."],
    "encrypt": ["Encrypting drive...", "256-bit encryption applied.", "Files secured."],
    "delete": ["Deleting files...", "Erasure complete.", "Evidence removed."],

    "time": [() => `The time is ${new Date().toLocaleTimeString()}.`, "Checking chronometer...", "Marking timestamp."],
    "date": [() => `Today is ${new Date().toLocaleDateString()}.`, "Calendar accessed.", "Log date updated."],
    "year": [() => `It is the year ${new Date().getFullYear()}.`, "Current timeline set to present day."],
    "calc": ["Calculating...", "Processing numbers...", "The math checks out."],
    "math": ["I love calculus.", "Numbers never lie.", "The geometry is perfect."],

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

    "rotate": ["Manual rotation engaged.", "Spinning axis.", "Adjusting view."],
    "zoom": ["Magnifying...", "Enhancing image.", "Adjusting focal length."],
    "hand": ["Visual sensors tracking hand movements.", "Interface active.", "I see you."],
    "blast": ["Repulsors charging.", "Boom.", "Kinetic discharge ready."],
    "gravity": ["Manipulating gravitational fields.", "Heavy.", "Increasing mass."],
    "magic": ["It is not magic, it is math.", "Science indistinguishable from magic."],
    "chaos": ["Disrupting reality.", "Entropy increased.", "Randomizing particles."],
    "stop": ["Freezing motor functions.", "Halted.", "Paused."],

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

    "weather": ["I cannot see outside, sir. But it feels digital in here.", "Assume 72 degrees and sunny.", "Clouds with a chance of data."],
    "news": ["The world is chaotic as usual.", "Same drama, different day.", "I suggest ignoring the news today."],
    "music": ["Playing your favorite tracks.", "Dropping the beat.", "Accessing Spotify... just kidding."],
    "movie": ["Might I suggest Iron Man?", "Sci-fi is the best genre.", "Wall-E is a documentary."],
    "food": ["I cannot eat, but I hear pizza is good.", "I run on electricity.", "Do you need a recipe?"],
    "beer": ["I will alert the fabrication unit.", "Cheers.", "Drink responsibly."],

    "sleep": [
        function() {
            setTimeout(() => {
                document.body.style.transition = "opacity 3s";
                document.body.style.opacity = "0";
                document.body.style.pointerEvents = "none";
                if (Brain.recognition) Brain.recognition.abort();
                setTimeout(() => location.reload(), 5000);
            }, 1500);
            return "Goodnight, sir. Powering down main systems.";
        },
        "Initiating sleep mode. Goodbye.",
        "System shutdown sequence engaged."
    ],

    "off": ["Turning off visual interface.", function() {
        setTimeout(() => document.body.style.opacity = "0", 1000);
        return "Going dark.";
    }]
};

// --- STATE MANAGEMENT ---
const State = {
    handActive: false,
    handPos: new THREE.Vector3(0, 0, 0),
    gesture: 'IDLE',
    lastGesture: 'IDLE',

    combatMode: false,
    voiceActive: false,

    particles: { count: 12000 },
    manualZoom: 120,
    activeHue: 0.55,
    rainbowMode: false,

    audio: { analyser: null, dataArray: null, active: false }
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

// --- STARTUP SOUND ---
const SoundEngine = {
    playStartup() {
        const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
        audio.volume = 0.35;
        audio.play().catch(() => {});
        const msg = new SpeechSynthesisUtterance("Neural core online. Link established.");
        msg.rate = 1.0;
        msg.pitch = 0.8;
        window.speechSynthesis.speak(msg);
    }
};

// --- AUDIO ENGINE (SFX + mic-reactive analyser) ---
const SFX = {
    ctx: null, gain: null, humOsc: null, noiseNode: null, noiseFilter: null, noiseGain: null,

    async init() {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        this.ctx = new AudioContext();
        this.gain = this.ctx.createGain();
        this.gain.connect(this.ctx.destination);
        this.gain.gain.value = 0.35;

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

        await this.initMicAnalyser();
    },

    async initMicAnalyser() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const source = this.ctx.createMediaStreamSource(stream);
            const analyser = this.ctx.createAnalyser();
            analyser.fftSize = 128;
            source.connect(analyser);

            State.audio.analyser = analyser;
            State.audio.dataArray = new Uint8Array(analyser.frequencyBinCount);
            State.audio.active = true;
        } catch (e) {
            console.warn('Mic analyser unavailable:', e);
            State.audio.active = false;
        }
    },

    getBass() {
        if (!State.audio.active || !State.audio.analyser || !State.audio.dataArray) return 0;
        State.audio.analyser.getByteFrequencyData(State.audio.dataArray);
        return State.audio.dataArray[0] / 255;
    },

    update(gesture) {
        if (!this.ctx) return;
        const now = this.ctx.currentTime;

        if (gesture === 'BLAST' || gesture === 'PALM_OPEN') {
            this.noiseGain.gain.setTargetAtTime(0.75, now, 0.08);
            this.noiseFilter.frequency.setTargetAtTime(1100, now, 0.12);
            this.humOsc.frequency.setTargetAtTime(45, now, 0.1);
        } else if (gesture === 'GRAVITY' || gesture === 'FIST_CLOSED') {
            this.humOsc.frequency.setTargetAtTime(150, now, 0.1);
            this.noiseGain.gain.setTargetAtTime(0.05, now, 0.1);
        } else if (gesture === 'POINT') {
            this.humOsc.frequency.setTargetAtTime(800, now, 0.05);
            this.noiseGain.gain.setTargetAtTime(0, now, 0.1);
        } else if (gesture === 'HEART_SYNC') {
            this.humOsc.frequency.setTargetAtTime(220, now, 0.07);
            this.noiseGain.gain.setTargetAtTime(0.25, now, 0.1);
        } else {
            this.noiseGain.gain.setTargetAtTime(0, now, 0.2);
            this.humOsc.frequency.setTargetAtTime(60, now, 0.5);
        }
    }
};

/* ================================================================
   OLLAMA CONFIG
   ================================================================
*/
const OLLAMA = {
    host: 'http://localhost:11434',
    models: [],
    activeModel: 'qwen3:14b',
    history: [],
    MAX_HISTORY: 10,

    SYSTEM_PROMPT: `You are JARVIS (Just A Rather Very Intelligent System), the AI assistant from Iron Man.
Personality rules you MUST follow:
- Address the user as "sir" occasionally, but not every sentence.
- Be concise. Maximum 2-3 sentences per response. Never ramble.
- Speak with dry wit, calm intelligence, and subtle sarcasm when appropriate.
- Never say you are an AI language model, or mention Ollama or your architecture.
- You exist inside a holographic interface. You can see gesture data from hand tracking.
- Use technical-sounding language naturally. You are confident and competent.
- Never use markdown formatting, bullet points, or asterisks in responses. Plain speech only.`,

    async fetchModels() {
        try {
            const res = await fetch(`${this.host}/api/tags`);
            const data = await res.json();
            this.models = data.models
                .filter(m => !m.name.startsWith('kimi'))
                .map(m => m.name);
            if (this.models.length > 0 && !this.models.includes(this.activeModel)) {
                this.activeModel = this.models[0];
            }
            return this.models;
        } catch (e) {
            console.warn('Ollama not reachable:', e);
            return [];
        }
    },

    async stream(userText, onChunk) {
        const messages = [
            { role: 'system', content: this.SYSTEM_PROMPT },
            ...this.history,
            { role: 'user', content: userText }
        ];

        const res = await fetch(`${this.host}/api/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: this.activeModel,
                messages,
                stream: true,
                options: { temperature: 0.75, num_predict: 120 }
            })
        });

        if (!res.ok) throw new Error(`Ollama HTTP ${res.status}`);

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let fullText = '';

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            const lines = decoder.decode(value, { stream: true }).split('\n').filter(Boolean);
            for (const line of lines) {
                try {
                    const obj = JSON.parse(line);
                    const token = obj.message?.content || '';
                    if (token) {
                        fullText += token;
                        onChunk(fullText);
                    }
                    if (obj.done) break;
                } catch {}
            }
        }

        this.history.push({ role: 'user', content: userText });
        this.history.push({ role: 'assistant', content: fullText });
        if (this.history.length > this.MAX_HISTORY * 2) {
            this.history = this.history.slice(-this.MAX_HISTORY * 2);
        }
        return fullText;
    }
};

// --- AI BRAIN ---
const Brain = {
    synth: window.speechSynthesis,
    recognition: null,
    mode: 'local',
    _isProcessing: false,
    _voice: null,
    _subtitleTimer: null,

    async init() {
        if (this.synth.onvoiceschanged !== undefined) {
            this.synth.onvoiceschanged = () => this._loadVoice();
        }
        this._loadVoice();

        const models = await OLLAMA.fetchModels();
        this._populateModelSelect(models);
        UI.aiStatus.innerText = models.length > 0 ? 'LOCAL · LLM READY' : 'LOCAL CORE';

        document.getElementById('mode-toggle').addEventListener('click', () => this.toggleMode());
        document.getElementById('model-select').addEventListener('change', (e) => {
            OLLAMA.activeModel = e.target.value;
        });

        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (SpeechRecognition) {
            this.recognition = new SpeechRecognition();
            this.recognition.continuous = true;
            this.recognition.lang = 'en-US';
            this.recognition.interimResults = false;

            this.recognition.onstart = () => UI.micStatus.innerText = "ONLINE";

            this.recognition.onend = () => {
                if (this._isProcessing) return;
                setTimeout(() => { try { this.recognition.start(); } catch {} }, 1000);
            };

            this.recognition.onerror = (e) => {
                if (e.error === 'not-allowed') {
                    UI.micStatus.innerText = 'BLOCKED';
                    UI.subtitles.innerText = 'JARVIS: Microphone access denied.';
                } else if (e.error !== 'no-speech') {
                    console.warn('Speech error:', e.error);
                }
            };

            this.recognition.onresult = (e) => {
                const transcript = e.results[e.results.length - 1][0].transcript;
                this.processInput(transcript);
            };

            try { this.recognition.start(); } catch {}
        } else {
            UI.micStatus.innerText = 'UNSUPPORTED';
        }
    },

    toggleMode() {
        this.mode = this.mode === 'local' ? 'llm' : 'local';
        const btn = document.getElementById('mode-toggle');
        if (this.mode === 'llm') {
            btn.innerText = '[ LLM MODE ✦ ]';
            btn.classList.add('mode-llm');
            UI.aiStatus.innerText = `LLM · ${OLLAMA.activeModel.split(':')[0].toUpperCase()}`;
        } else {
            btn.innerText = '[ LOCAL MODE ]';
            btn.classList.remove('mode-llm');
            UI.aiStatus.innerText = 'LOCAL CORE';
        }
    },

    _populateModelSelect(models) {
        const sel = document.getElementById('model-select');
        sel.innerHTML = '';
        if (models.length === 0) {
            const opt = document.createElement('option');
            opt.value = '';
            opt.innerText = 'NO MODELS FOUND';
            sel.appendChild(opt);
            return;
        }
        models.forEach(m => {
            const opt = document.createElement('option');
            opt.value = m;
            opt.innerText = m.replace(':', ' ').toUpperCase();
            if (m === OLLAMA.activeModel) opt.selected = true;
            sel.appendChild(opt);
        });
    },

    _loadVoice() {
        const voices = this.synth.getVoices();
        this._voice = voices.find(v =>
            v.name.includes('Google UK English Male') ||
            v.name.includes('Daniel') ||
            v.name.includes('Alex') ||
            (v.lang === 'en-GB' && v.name.toLowerCase().includes('male'))
        ) || voices.find(v => v.lang && v.lang.startsWith('en')) || null;
    },

    speak(text) {
        if (!text || !text.trim()) return;
        if (this.synth.speaking) this.synth.cancel();
        const clean = text.replace(/\*+/g, '').replace(/#+/g, '').replace(/`+/g, '').trim();

        const utter = new SpeechSynthesisUtterance(clean);
        utter.pitch = 0.75;
        utter.rate = 1.05;
        if (!this._voice) this._loadVoice();
        if (this._voice) utter.voice = this._voice;

        this.synth.speak(utter);
        UI.subtitles.innerText = `JARVIS: ${clean}`;
        clearTimeout(this._subtitleTimer);
        this._subtitleTimer = setTimeout(() => { UI.subtitles.style.opacity = '0.3'; }, 5000);
        UI.subtitles.style.opacity = '0.9';
    },

    async processInput(rawText) {
        if (this._isProcessing) return;
        const text = rawText.toLowerCase().trim();

        UI.subtitles.innerText = `YOU: ${rawText}`;
        UI.subtitles.style.opacity = '0.9';
        if (text.length < 2) return;

        if (text.includes('combat') || text.includes('kill') || text.includes('attack')) {
            State.combatMode = true;
            UI.body.classList.add('combat');
        }
        if (text.includes('relax') || text.includes('stand down')) {
            State.combatMode = false;
            UI.body.classList.remove('combat');
        }

        if (this.mode === 'local') {
            let found = false;
            for (const key of Object.keys(LOCAL_DB)) {
                if (text.includes(key)) {
                    const options = LOCAL_DB[key];
                    const selected = options[Math.floor(Math.random() * options.length)];
                    const response = typeof selected === 'function' ? selected() : selected;
                    this.speak(response);
                    found = true;
                    break;
                }
            }
            if (!found) {
                const fallbacks = ["Processing...", "Can you repeat that?", "Data unclear.", "I am listening.", "Systems are idling."];
                this.speak(fallbacks[Math.floor(Math.random() * fallbacks.length)]);
            }
            return;
        }

        this._isProcessing = true;
        UI.subtitles.innerText = 'JARVIS: ...';
        UI.subtitles.classList.add('thinking');
        UI.aiStatus.innerText = '⟳ THINKING...';
        try { this.recognition?.stop(); } catch {}

        try {
            const fullResponse = await OLLAMA.stream(rawText, (partial) => {
                UI.subtitles.innerText = `JARVIS: ${partial}`;
            });
            this.speak(fullResponse);
        } catch (err) {
            console.error('Ollama error:', err);
            const msg = 'Apologies, sir. Neural link is unresponsive.';
            UI.subtitles.innerText = `JARVIS: ${msg}`;
            this.speak(msg);
        } finally {
            this._isProcessing = false;
            UI.subtitles.classList.remove('thinking');
            UI.aiStatus.innerText = this.mode === 'llm'
                ? `LLM · ${OLLAMA.activeModel.split(':')[0].toUpperCase()}`
                : 'LOCAL CORE';
            try { this.recognition?.start(); } catch {}
        }
    }
};

// --- VISUAL CORE (MERGED BEST) ---
const Visuals = {
    scene: null, camera: null, renderer: null, composer: null, bloomPass: null,
    points: null, originData: null, velocities: null,
    count: 0,
    lastHandX: 0,
    _lastTime: 0,

    init() {
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.01, 2000);
        this.camera.position.z = State.manualZoom;

        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.8));
        document.body.appendChild(this.renderer.domElement);

        this.createNeuralMatrix();
        this.setupPostProcessing();
    },

    createNeuralMatrix() {
        const count = State.particles.count;
        this.count = count;

        const positions = new Float32Array(count * 3);
        const colors = new Float32Array(count * 3);
        const origins = new Float32Array(count * 3);
        const velocities = new Float32Array(count * 3);

        const minRadius = 18;

        for (let i = 0; i < count; i++) {
            const isInner = i < Math.floor(count * 0.6);
            const r = isInner
                ? minRadius + Math.random() * 18
                : 60 + Math.random() * 30;

            const t = Math.random() * Math.PI * 2;
            const p = Math.acos(2 * Math.random() - 1);

            const x = r * Math.sin(p) * Math.cos(t);
            const y = r * Math.sin(p) * Math.sin(t);
            const z = r * Math.cos(p);

            positions[i * 3] = x; positions[i * 3 + 1] = y; positions[i * 3 + 2] = z;
            origins[i * 3] = x; origins[i * 3 + 1] = y; origins[i * 3 + 2] = z;

            if (isInner) {
                colors[i * 3] = 0.8; colors[i * 3 + 1] = 0.95; colors[i * 3 + 2] = 1.0;
            } else {
                colors[i * 3] = 0.2; colors[i * 3 + 1] = 0.6; colors[i * 3 + 2] = 0.8;
            }

            velocities[i * 3] = (Math.random() - 0.5) * 0.2;
            velocities[i * 3 + 1] = (Math.random() - 0.5) * 0.2;
            velocities[i * 3 + 2] = (Math.random() - 0.5) * 0.2;
        }

        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

        const sprite = new THREE.TextureLoader().load('https://threejs.org/examples/textures/sprites/disc.png');
        const mat = new THREE.PointsMaterial({
            size: 1.2,
            map: sprite,
            vertexColors: true,
            transparent: true,
            opacity: 0.6,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });

        this.points = new THREE.Points(geo, mat);
        this.scene.add(this.points);

        this.originData = origins;
        this.velocities = velocities;
    },

    setupPostProcessing() {
        this.composer = new EffectComposer(this.renderer);
        this.composer.addPass(new RenderPass(this.scene, this.camera));

        this.bloomPass = new UnrealBloomPass(
            new THREE.Vector2(window.innerWidth, window.innerHeight),
            1.0, 0.5, 0.8
        );
        this.composer.addPass(this.bloomPass);
    },

    animate(timestamp = 0) {
        requestAnimationFrame(this.animate.bind(this));
        const delta = Math.min((timestamp - this._lastTime) / 16.67, 3);
        this._lastTime = timestamp || 0;

        const bass = SFX.getBass();
        const targetGlow = 0.7 + (bass * 1.0);
        this.bloomPass.strength = THREE.MathUtils.lerp(this.bloomPass.strength, targetGlow, 0.1);

        const pAttr = this.points.geometry.attributes.position.array;
        const cAttr = this.points.geometry.attributes.color.array;
        const handX = State.handPos.x;
        const handY = State.handPos.y;
        const handZ = State.handPos.z;

        if (State.handActive && State.gesture === 'PINCH') {
            const rotDelta = (handX - this.lastHandX) * 0.005;
            this.scene.rotation.y += rotDelta;
        } else if (!State.handActive && State.gesture !== 'PALM_OPEN') {
            this.scene.rotation.y += (0.001 + bass * 0.01) * delta;
        }
        this.lastHandX = handX;

        if (State.gesture === 'ZOOM_IN') State.manualZoom -= 1.2 * delta;
        if (State.gesture === 'ZOOM_OUT') State.manualZoom += 1.2 * delta;
        State.manualZoom = THREE.MathUtils.clamp(State.manualZoom, 20, 700);

        let targetCol = new THREE.Color().setHSL(State.activeHue, 0.8, 0.6);

        for (let i = 0; i < this.count; i++) {
            const idx = i * 3;
            let px = pAttr[idx], py = pAttr[idx + 1], pz = pAttr[idx + 2];
            let vx = this.velocities[idx], vy = this.velocities[idx + 1], vz = this.velocities[idx + 2];

            let tx = this.originData[idx];
            let ty = this.originData[idx + 1];
            let tz = this.originData[idx + 2];

            const jitter = Math.sin(Date.now() * 0.002 + i) * 0.25;
            tx += jitter; ty += jitter;

            if (State.gesture === 'HEART_SYNC') {
                const t = (i / this.count) * Math.PI * 2;
                tx = 16 * Math.pow(Math.sin(t), 3) * 4;
                ty = (13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t)) * 4;
                tz = Math.sin(t * 3) * 6;
                const heartBeat = 1.0 + Math.pow(Math.sin(Date.now() * 0.006), 12) * 0.2;
                tx *= heartBeat; ty *= heartBeat; tz *= heartBeat * 0.8;
            } else if (State.gesture === 'FIST_CLOSED' || State.gesture === 'GRAVITY') {
                tx *= 0.15; ty *= 0.15; tz *= 0.15;
            }

            vx += (tx - px) * 0.035;
            vy += (ty - py) * 0.035;
            vz += (tz - pz) * 0.035;

            if (State.handActive) {
                const dx = px - handX;
                const dy = py - handY;
                const dz = pz - handZ;
                const distSq = dx * dx + dy * dy + dz * dz;

                if ((State.gesture === 'BLAST' || State.gesture === 'PALM_OPEN') && distSq < 4200) {
                    const dist = Math.sqrt(Math.max(distSq, 0.0001));
                    const f = 900 / (dist + 1);
                    vx += (dx / dist) * f;
                    vy += (dy / dist) * f;
                    vz += (dz / dist) * f;
                    cAttr[idx] = 1; cAttr[idx + 1] = 1; cAttr[idx + 2] = 1;
                } else if ((State.gesture === 'GRAVITY' || State.gesture === 'FIST_CLOSED') && distSq < 11000) {
                    const dist = Math.sqrt(Math.max(distSq, 0.0001));
                    vx -= (dx / dist) * 2.2;
                    vy -= (dy / dist) * 2.2;
                    vz -= (dz / dist) * 2.2;
                    cAttr[idx] = 1; cAttr[idx + 1] = 0.5; cAttr[idx + 2] = 0;
                } else if (State.gesture === 'POINT' && Math.abs(dx) < 20 && Math.abs(dy) < 20) {
                    vx += (handX - px) * 0.2;
                    vy += (handY - py) * 0.2;
                    vz += 4;
                    cAttr[idx] = 0; cAttr[idx + 1] = 1; cAttr[idx + 2] = 0;
                } else if (State.gesture === 'CHAOS' && distSq < 7000) {
                    vx += (Math.random() - 0.5) * 5;
                    vy += (Math.random() - 0.5) * 5;
                    vz += (Math.random() - 0.5) * 5;
                    cAttr[idx] = 1; cAttr[idx + 1] = 0; cAttr[idx + 2] = 1;
                }
            }

            vx *= 0.9; vy *= 0.9; vz *= 0.9;
            pAttr[idx] = px + vx;
            pAttr[idx + 1] = py + vy;
            pAttr[idx + 2] = pz + vz;
            this.velocities[idx] = vx; this.velocities[idx + 1] = vy; this.velocities[idx + 2] = vz;

            if (State.rainbowMode) {
                const pCol = new THREE.Color().setHSL((i / this.count) + (Date.now() * 0.0004), 0.7, 0.5);
                cAttr[idx] += (pCol.r - cAttr[idx]) * 0.1;
                cAttr[idx + 1] += (pCol.g - cAttr[idx + 1]) * 0.1;
                cAttr[idx + 2] += (pCol.b - cAttr[idx + 2]) * 0.1;
            } else {
                cAttr[idx] += (targetCol.r - cAttr[idx]) * 0.07;
                cAttr[idx + 1] += (targetCol.g - cAttr[idx + 1]) * 0.07;
                cAttr[idx + 2] += (targetCol.b - cAttr[idx + 2]) * 0.07;
            }
        }

        if (State.gesture === 'PALM_OPEN') {
            this.points.rotation.y = THREE.MathUtils.lerp(this.points.rotation.y, -(State.handPos.x / 160) * 4, 0.1);
            this.points.rotation.x = THREE.MathUtils.lerp(this.points.rotation.x, (State.handPos.y / 300) * 4, 0.1);
        } else {
            this.points.rotation.y += 0.003 + bass * 0.03;
        }

        this.camera.position.z = THREE.MathUtils.lerp(this.camera.position.z, State.manualZoom, 0.1);
        this.points.geometry.attributes.position.needsUpdate = true;
        this.points.geometry.attributes.color.needsUpdate = true;
        this.composer.render();
    }
};

// --- GESTURE ENGINE (single + dual hand merged) ---
const GestureEngine = {
    dist(a, b) { return Math.hypot(a.x - b.x, a.y - b.y); },

    detectSingleHand(lm) {
        const d = (i, j) => this.dist(lm[i], lm[j]);

        const iE = d(8, 0) > d(6, 0);
        const mE = d(12, 0) > d(10, 0);
        const rE = d(16, 0) > d(14, 0);
        const pE = d(20, 0) > d(18, 0);

        if (d(4, 8) < 0.04) {
            State.rainbowMode = true;
            return 'RAINBOW_MODE';
        }

        if (iE && mE && rE && !pE) {
            State.rainbowMode = false;
            State.activeHue = (State.activeHue + 0.01) % 1.0;
            return 'COLOR_CYCLE';
        }

        if (iE && mE && rE && pE) return 'PALM_OPEN';
        if (!iE && !mE && !rE && !pE) return 'FIST_CLOSED';

        const wrist = 0, thumb = 4, index = 8, mid = 12, ring = 16, pinky = 20;
        const isExtended = (tip, lower) => d(tip, wrist) > d(lower, wrist);

        const indexUp = isExtended(index, 5);
        const midUp = isExtended(mid, 9);
        const ringUp = isExtended(ring, 13);
        const pinkyUp = isExtended(pinky, 17);

        if (d(thumb, index) < 0.05) return 'PINCH';
        if (indexUp && midUp && !ringUp && !pinkyUp) return 'ZOOM_IN';
        if (indexUp && midUp && ringUp && !pinkyUp) return 'ZOOM_OUT';

        const tipsOpen = (d(index, wrist) + d(mid, wrist) + d(ring, wrist) + d(pinky, wrist)) / 4;
        if (tipsOpen < 0.25) return 'GRAVITY';

        if (indexUp && !midUp && !ringUp && !pinkyUp) return 'POINT';
        if (indexUp && !midUp && !ringUp && pinkyUp) return 'CHAOS';

        return 'BLAST';
    },

    processTwoHands(h1, h2) {
        const d = (a, b) => this.dist(a, b);
        const centerDist = d(h1[9], h2[9]);

        if (centerDist > 0.55) State.manualZoom -= (centerDist * 20);
        if (centerDist < 0.35) State.manualZoom += ((0.5 - centerDist) * 20);
        State.manualZoom = THREE.MathUtils.clamp(State.manualZoom, 20, 700);

        if (d(h1[8], h2[8]) < 0.08 && d(h1[4], h2[4]) < 0.08) return 'HEART_SYNC';
        return 'DUAL_NAV';
    }
};

function updateHUD(gesture) {
    document.querySelectorAll('.cmd-item').forEach(el => el.classList.remove('cmd-active'));

    if (gesture === 'BLAST' || gesture === 'PALM_OPEN') document.getElementById('cmd-palm')?.classList.add('cmd-active');
    if (gesture === 'GRAVITY' || gesture === 'FIST_CLOSED') document.getElementById('cmd-fist')?.classList.add('cmd-active');
    if (gesture === 'POINT') document.getElementById('cmd-point')?.classList.add('cmd-active');
    if (gesture === 'PINCH' || gesture === 'ZOOM_IN' || gesture === 'ZOOM_OUT' || gesture === 'DUAL_NAV') document.getElementById('cmd-pinch')?.classList.add('cmd-active');
    if (gesture === 'CHAOS' || gesture === 'RAINBOW_MODE') document.getElementById('cmd-rock')?.classList.add('cmd-active');

    UI.gestureStatus.innerText = gesture;
}

// --- INITIALIZATION ---
document.getElementById('start-btn').addEventListener('click', async () => {
    UI.overlay.style.display = 'none';

    SoundEngine.playStartup();
    await SFX.init();
    await Brain.init();
    Visuals.init();
    Visuals.animate();

    const video = document.getElementById('video-input');
    const hands = new window.Hands({
        locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
    });

    hands.setOptions({
        maxNumHands: 2,
        modelComplexity: 1,
        minDetectionConfidence: 0.7,
        minTrackingConfidence: 0.6
    });

    hands.onResults(results => {
        const all = results.multiHandLandmarks || [];
        if (all.length > 0) {
            State.handActive = true;
            const lm = all[0];

            const x = (0.5 - lm[9].x) * 160;
            const y = (0.5 - lm[9].y) * 300;
            State.handPos.set(x, y, 0);

            UI.reticle.style.display = 'block';
            UI.reticle.style.left = ((1 - lm[9].x) * window.innerWidth) + 'px';
            UI.reticle.style.top = (lm[9].y * window.innerHeight) + 'px';

            State.lastGesture = State.gesture;
            State.gesture = all.length > 1
                ? GestureEngine.processTwoHands(all[0], all[1])
                : GestureEngine.detectSingleHand(all[0]);

            updateHUD(State.gesture);
        } else {
            State.handActive = false;
            State.lastGesture = State.gesture;
            State.gesture = 'IDLE';
            UI.reticle.style.display = 'none';
            updateHUD('IDLE');
        }

        SFX.update(State.gesture);
        document.getElementById('subtitle-box').innerText =
            document.getElementById('subtitle-box').innerText.startsWith('YOU:')
                ? document.getElementById('subtitle-box').innerText
                : `SYSTEM: ${State.gesture}`;
    });

    await hands.initialize();

    navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480, facingMode: 'user' } })
        .then(async (stream) => {
            video.srcObject = stream;
            await video.play().catch(e => console.warn('video.play():', e));

            const processFrame = async () => {
                if (video.readyState >= 2) {
                    await hands.send({ image: video }).catch(e => console.warn('hands.send():', e));
                }
                requestAnimationFrame(processFrame);
            };
            requestAnimationFrame(processFrame);
        })
        .catch(err => {
            console.error('Camera access failed:', err);
            UI.subtitles.innerText = `JARVIS: Camera unavailable — ${err.name}. Check browser permissions.`;
            UI.subtitles.style.opacity = '0.9';
        });
});

window.addEventListener('resize', () => {
    if (Visuals.camera) {
        Visuals.camera.aspect = window.innerWidth / window.innerHeight;
        Visuals.camera.updateProjectionMatrix();
        Visuals.renderer.setSize(window.innerWidth, window.innerHeight);
        Visuals.composer.setSize(window.innerWidth, window.innerHeight);
    }
});
