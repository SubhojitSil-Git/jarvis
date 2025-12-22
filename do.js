import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';

/* ================================================================
   CONFIGURATION
   ================================================================
   To enable "God Mode" (Real AI), get a key from aistudio.google.com
   and paste it inside the quotes below.
*/
const GEMINI_API_KEY = ""; 

// --- STATE MANAGEMENT ---
const State = {
    handActive: false,
    handPos: new THREE.Vector3(0,0,0),
    gesture: 'IDLE', // BLAST, GRAVITY, POINT, PINCH, CHAOS
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

// --- AI BRAIN (VOICE & LLM) ---
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
            this.recognition.onend = () => this.recognition.start(); 
            this.recognition.onresult = (e) => this.processInput(e.results[e.results.length-1][0].transcript);
            this.recognition.start();
        }
        
        if(GEMINI_API_KEY) UI.aiStatus.innerText = "GEMINI CLOUD";
    },

    speak: function(text) {
        if (this.synth.speaking) this.synth.cancel();
        const utter = new SpeechSynthesisUtterance(text);
        utter.pitch = 0.8; utter.rate = 1.1; 
        
        // Try to find a male/robotic voice
        const voices = this.synth.getVoices();
        const v = voices.find(v => v.name.includes('Google UK English Male') || v.name.includes('Daniel'));
        if(v) utter.voice = v;
        
        this.synth.speak(utter);
        UI.subtitles.innerText = `JARVIS: ${text}`;
    },

    processInput: async function(rawText) {
        const text = rawText.toLowerCase().trim();
        UI.subtitles.innerText = `YOU: ${text}`;

        // 1. Check for Hardcoded Commands first (Faster)
        if (text.includes('combat') || text.includes('kill mode')) {
            State.combatMode = true;
            UI.body.classList.add('combat');
            this.speak("Combat protocols engaged.");
            return;
        }
        if (text.includes('relax') || text.includes('stand down')) {
            State.combatMode = false;
            UI.body.classList.remove('combat');
            this.speak("Systems returning to standard configuration.");
            return;
        }

        // 2. Intelligent Response (Gemini or Fallback)
        if (GEMINI_API_KEY) {
            // Context injection: Tell the AI what the hand is doing
            const contextPrompt = `You are JARVIS. User is performing gesture: ${State.gesture}. Hand visible: ${State.handActive}. User says: "${text}". Keep reply short and tactical.`;
            
            try {
                const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ contents: [{ parts: [{ text: contextPrompt }] }] })
                });
                const data = await response.json();
                const aiReply = data.candidates[0].content.parts[0].text;
                this.speak(aiReply);
            } catch(e) {
                console.error(e);
                this.speak("Unable to reach cloud servers, sir.");
            }
        } else {
            // Offline Fallback Logic
            if (text.includes('status')) {
                if(State.gesture === 'BLAST') this.speak("Repulsor systems charged and active.");
                else if(State.gesture === 'GRAVITY') this.speak("Gravity well generators at maximum.");
                else this.speak("Systems nominal. Waiting for gesture input.");
            } 
            else if (text.includes('hello') || text.includes('jarvis')) {
                this.speak("Online. Ready for instructions.");
            }
            else {
                this.speak("Command not recognized in offline mode.");
            }
        }
    }
};

// --- VISUAL CORE (THREE.JS) ---
const Visuals = {
    scene: null, camera: null, renderer: null, composer: null,
    particles: null, particleGeo: null,
    
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
        const count = 8000;
        const positions = new Float32Array(count * 3);
        const velocities = new Float32Array(count * 3);
        const origins = new Float32Array(count * 3);
        const colors = new Float32Array(count * 3);

        const colorBase = new THREE.Color(0x00ffff);

        for(let i=0; i<count; i++) {
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
    },

    animate: function() {
        requestAnimationFrame(this.animate.bind(this));
        
        const pos = this.particleGeo.attributes.position.array;
        const col = this.particleGeo.attributes.color.array;
        
        // Physics Loop
        for(let i=0; i<8000; i++) {
            const idx = i*3;
            let px = pos[idx], py = pos[idx+1], pz = pos[idx+2];
            
            // 1. Elastic Return to Origin
            // If combat mode, explode outward slightly
            const ox = State.combatMode ? this.particleGeo.attributes.position.array[idx] * 1.5 : 0; // Simplified for stability
            
            // Using a simpler return logic for stability
            // Note: In real app, we need the stored 'origins' array accessible here. 
            // For brevity in module scope, we cheat slightly or access via visual object if stored correctly.
            // Let's rely on visual chaos for now.
        }
        
        // NOTE: For performance in this modular format, I'm using a simplified physics shader logic
        // re-implemented fully below to ensure it matches the "Heavy Artillery" feel.
        
        this.updatePhysics(); // Call the detailed physics
        this.composer.render();
    },
    
    // Re-injecting the detailed physics engine here
    updatePhysics: function() {
        const positions = this.particles.geometry.attributes.position.array;
        const colors = this.particles.geometry.attributes.color.array;
        // We need to access origins which we created in createParticles. 
        // In a strict module, we'd store them in `this`. 
        // For this single-file module logic, we'll reconstruct the flow.
        
        // *Re-initializing origins for the loop scope*
        if(!this.origins) {
             this.origins = new Float32Array(positions.length);
             this.velocities = new Float32Array(positions.length);
             for(let k=0; k<positions.length; k++) this.origins[k] = positions[k];
        }

        const handX = State.handPos.x;
        const handY = State.handPos.y;
        const handZ = State.handPos.z;

        const targetColor = State.combatMode ? {r:1, g:0, b:0} : {r:0, g:1, b:1};

        for(let i=0; i<8000; i++) {
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
                        colors[idx]=1; colors[idx+1]=1; colors[idx+2]=1; // White hot
                    }
                } else if (State.gesture === 'GRAVITY') {
                    if(dist < 100) {
                        vx -= (dx/dist) * 2; vy -= (dy/dist) * 2; vz -= (dz/dist) * 2;
                        colors[idx]=1; colors[idx+1]=0.5; colors[idx+2]=0; // Orange
                    }
                } else if (State.gesture === 'POINT') {
                    const distBeam = Math.sqrt(dx*dx + dy*dy);
                    if (distBeam < 15) {
                        vx += (handX - px)*0.2; vy += (handY - py)*0.2; vz += 5; // Shoot forward
                        colors[idx]=0; colors[idx+1]=1; colors[idx+2]=0; // Green
                    }
                } else if (State.gesture === 'PINCH') {
                    vx *= 0.1; vy *= 0.1; vz *= 0.1; // Freeze
                } else if (State.gesture === 'CHAOS') {
                    if(dist < 80) {
                        vx += (Math.random()-0.5)*5; vy += (Math.random()-0.5)*5; vz += (Math.random()-0.5)*5;
                        colors[idx]=1; colors[idx+1]=0; colors[idx+2]=1; // Purple
                    }
                }
            } else {
                // Restore color
                colors[idx] = colors[idx]*0.95 + targetColor.r*0.05;
                colors[idx+1] = colors[idx+1]*0.95 + targetColor.g*0.05;
                colors[idx+2] = colors[idx+2]*0.95 + targetColor.b*0.05;
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

// --- GESTURE RECOGNITION ---
function detectGesture(lm) {
    const dist = (i, j) => Math.hypot(lm[i].x - lm[j].x, lm[i].y - lm[j].y);
    const wrist = 0, thumb = 4, index = 8, mid = 12, ring = 16, pinky = 20;

    // 1. PINCH (Index touches Thumb)
    if (dist(thumb, index) < 0.04) return 'PINCH';

    // 2. FIST (Fingertips close to wrist)
    const avgTip = (dist(index, wrist) + dist(mid, wrist) + dist(ring, wrist) + dist(pinky, wrist)) / 4;
    if (avgTip < 0.25) return 'GRAVITY';

    // 3. POINT (Index extended, others curled)
    if (dist(index, wrist) > 0.4 && dist(mid, wrist) < 0.25 && dist(ring, wrist) < 0.25) return 'POINT';

    // 4. CHAOS (Rock sign: Index + Pinky up)
    if (dist(index, wrist) > 0.3 && dist(pinky, wrist) > 0.3 && dist(mid, wrist) < 0.25) return 'CHAOS';

    // 5. Default
    return 'BLAST';
}

function updateHUD(gesture) {
    // Reset all
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
    
    hands.setOptions({
        maxNumHands: 1,
        modelComplexity: 1,
        minDetectionConfidence: 0.6,
        minTrackingConfidence: 0.5
    });

    hands.onResults(results => {
        if (results.multiHandLandmarks.length > 0) {
            State.handActive = true;
            const lm = results.multiHandLandmarks[0];
            
            // Map to 3D space
            const x = (0.5 - lm[9].x) * 160;
            const y = (0.5 - lm[9].y) * 100;
            State.handPos.set(x, y, 0);

            // Reticle UI
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
        Visuals.composer.setSize(window.innerWidth, window.innerHeight);
    }
});
