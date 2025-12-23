import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';

const State = {
    handActive: false,
    handPos: new THREE.Vector3(),
    gesture: 'IDLE',
    combatMode: false,
    isSpeaking: false,
    lastPinchX: 0
};

// --- LOCAL INTELLIGENCE ---
const LOCAL_DB = {
    "hello": ["Greetings, sir. Systems nominal.", "Ready for work."],
    "status": ["All systems green. Reactor at 100%.", "Core temperature stable."],
    "combat": ["Engaging combat protocols.", "Weapons hot. Stay focused."],
    "relax": ["Standing down. Powering down weapons."],
    "who": ["I am JARVIS. Your digital shadow."],
    "joke": ["I'd tell a joke, but my humor subroutines are being used for math."],
    "sleep": [() => { setTimeout(() => location.reload(), 2000); return "Going offline. Goodbye, sir."; }]
};

// --- VISUAL ENGINE ---
const Visuals = {
    scene: null, camera: null, renderer: null, composer: null,
    points: null,
    
    init() {
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 1000);
        this.camera.position.set(0, 20, 100);

        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        document.body.appendChild(this.renderer.domElement);

        // Post Processing (Glow)
        const renderPass = new RenderPass(this.scene, this.camera);
        const bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 1.5, 0.4, 0.85);
        this.composer = new EffectComposer(this.renderer);
        this.composer.addPass(renderPass);
        this.composer.addPass(bloomPass);

        this.createHologram();
        this.addEnvironment();
    },

    addEnvironment() {
        const grid = new THREE.GridHelper(200, 20, 0x00ffff, 0x002222);
        grid.position.y = -50;
        this.scene.add(grid);
    },

    createHologram() {
        const count = 5000;
        const geo = new THREE.BufferGeometry();
        const pos = new Float32Array(count * 3);
        const colors = new Float32Array(count * 3);
        
        for(let i=0; i<count; i++) {
            const r = 40;
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(2 * Math.random() - 1);
            pos[i*3] = r * Math.sin(phi) * Math.cos(theta);
            pos[i*3+1] = r * Math.sin(phi) * Math.sin(theta);
            pos[i*3+2] = r * Math.cos(phi);
            
            colors[i*3] = 0; colors[i*3+1] = 1; colors[i*3+2] = 1;
        }
        
        geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
        geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        
        const mat = new THREE.PointsMaterial({
            size: 0.7, 
            vertexColors: true, 
            transparent: true, 
            opacity: 0.8,
            blending: THREE.AdditiveBlending
        });
        
        this.points = new THREE.Points(geo, mat);
        this.scene.add(this.points);
        this.origPos = new Float32Array(pos);
    },

    animate() {
        requestAnimationFrame(() => this.animate());
        
        const posAttr = this.points.geometry.attributes.position;
        const time = Date.now() * 0.001;

        // Auto-rotation
        if (State.gesture !== 'PINCH') {
            this.points.rotation.y += 0.005;
        }

        // Voice Reactivity (Pulse)
        const scale = State.isSpeaking ? 1.2 + Math.sin(time*10)*0.1 : 1.0;
        this.points.scale.set(scale, scale, scale);

        for (let i = 0; i < posAttr.count; i++) {
            let x = this.origPos[i*3];
            let y = this.origPos[i*3+1];
            let z = this.origPos[i*3+2];

            // Hand Interaction
            if (State.handActive) {
                const dx = x - State.handPos.x;
                const dy = y - State.handPos.y;
                const dist = Math.sqrt(dx*dx + dy*dy);

                if (State.gesture === 'BLAST' && dist < 30) {
                    x += dx * 2; y += dy * 2;
                } else if (State.gesture === 'GRAVITY' && dist < 60) {
                    x -= dx * 0.5; y -= dy * 0.5;
                }
            }

            posAttr.array[i*3] += (x - posAttr.array[i*3]) * 0.1;
            posAttr.array[i*3+1] += (y - posAttr.array[i*3+1]) * 0.1;
        }

        posAttr.needsUpdate = true;
        this.composer.render();
    }
};

// --- GESTURE ENGINE ---
function detectGesture(lm) {
    const dist = (a, b) => Math.hypot(lm[a].x - lm[b].x, lm[a].y - lm[b].y);
    
    const isPinch = dist(4, 8) < 0.04;
    const isFist = dist(8, 0) < 0.1;
    const isRock = dist(8, 0) > 0.2 && dist(20, 0) > 0.2 && dist(12, 0) < 0.15;

    if (isPinch) return 'PINCH';
    if (isFist) return 'GRAVITY';
    if (isRock) return 'CHAOS';
    return 'BLAST';
}

// --- VOICE ENGINE ---
const Brain = {
    synth: window.speechSynthesis,
    
    speak(text) {
        if (this.synth.speaking) this.synth.cancel();
        const utter = new SpeechSynthesisUtterance(text);
        utter.pitch = 0.9;
        utter.rate = 1.0;
        utter.onstart = () => State.isSpeaking = true;
        utter.onend = () => State.isSpeaking = false;
        this.synth.speak(utter);
        document.getElementById('subtitle-box').innerText = `JARVIS: ${text}`;
    },

    process(input) {
        const text = input.toLowerCase();
        if (text.includes("combat")) { document.body.classList.add('combat'); }
        if (text.includes("relax")) { document.body.classList.remove('combat'); }

        for (let key in LOCAL_DB) {
            if (text.includes(key)) {
                const res = LOCAL_DB[key];
                const final = typeof res[0] === 'function' ? res[0]() : res[Math.floor(Math.random()*res.length)];
                this.speak(final);
                return;
            }
        }
    }
};

// --- INITIALIZATION ---
document.getElementById('start-btn').addEventListener('click', async () => {
    document.getElementById('start-overlay').style.display = 'none';
    
    Visuals.init();
    Visuals.animate();

    const video = document.getElementById('video-input');
    const hands = new Hands({locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`});
    
    hands.setOptions({ maxNumHands: 1, modelComplexity: 1, minDetectionConfidence: 0.7 });
    
    hands.onResults(res => {
        if (res.multiHandLandmarks && res.multiHandLandmarks.length > 0) {
            State.handActive = true;
            const lm = res.multiHandLandmarks[0];
            
            // Map 0-1 coords to Three.js Space
            const x = (0.5 - lm[9].x) * 150;
            const y = (0.5 - lm[9].y) * 100;
            State.handPos.set(x, y, 0);

            // UI Reticle
            const ret = document.getElementById('reticle');
            ret.style.display = 'block';
            ret.style.left = `${(1 - lm[9].x) * 100}%`;
            ret.style.top = `${lm[9].y * 100}%`;

            State.gesture = detectGesture(lm);
            
            // Pinch to Rotate Logic
            if (State.gesture === 'PINCH') {
                const delta = (lm[9].x - State.lastPinchX) * 10;
                Visuals.points.rotation.y += delta;
            }
            State.lastPinchX = lm[9].x;

            document.getElementById('gesture-status').innerText = State.gesture;
        } else {
            State.handActive = false;
            document.getElementById('reticle').style.display = 'none';
        }
    });

    const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 } } 
    });
    video.srcObject = stream;
    video.play();

    const processVideo = async () => {
        await hands.send({image: video});
        requestAnimationFrame(processVideo);
    };
    processVideo();

    // Voice Setup
    const Speech = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (Speech) {
        const rec = new Speech();
        rec.continuous = true;
        rec.onresult = (e) => Brain.process(e.results[e.results.length-1][0].transcript);
        rec.start();
        document.getElementById('voice-status').innerText = "ONLINE";
    }
});

window.addEventListener('resize', () => {
    Visuals.camera.aspect = window.innerWidth / window.innerHeight;
    Visuals.camera.updateProjectionMatrix();
    Visuals.renderer.setSize(window.innerWidth, window.innerHeight);
});
