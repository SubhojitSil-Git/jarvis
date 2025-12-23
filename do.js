import * as THREE from 'three';

// --- NEW CYBER-SYNTH AUDIO ---
const AudioEngine = {
    ctx: null,
    init() { this.ctx = new (window.AudioContext || window.webkitAudioContext)(); },
    
    // High-end mechanical click
    click() {
        if(!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(1200, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(40, this.ctx.currentTime + 0.05);
        gain.gain.setValueAtTime(0.1, this.ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 0.05);
        osc.connect(gain); gain.connect(this.ctx.destination);
        osc.start(); osc.stop(this.ctx.currentTime + 0.05);
    },

    // Futuristic hum for zoom/rotation
    hum(freq = 200) {
        if(!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
        gain.gain.setValueAtTime(0.02, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 0.1);
        osc.connect(gain); gain.connect(this.ctx.destination);
        osc.start(); osc.stop(this.ctx.currentTime + 0.1);
    }
};

const State = {
    zoom: 1.0,
    isPinching: false,
    isPointing: false,
    isFreezed: false,
    rotationSpeed: { x: 0, y: 0.005 },
    activeColor: new THREE.Color(0x00ffff),
    targetColor: new THREE.Color(0xff8800)
};

const Visuals = {
    scene: null, camera: null, renderer: null, points: null,
    
    init() {
        this.scene = new THREE.Scene();
        const aspect = window.innerWidth / window.innerHeight;
        this.camera = new THREE.PerspectiveCamera(75, aspect, 0.1, 1000);
        this.camera.position.z = 150;

        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        document.body.appendChild(this.renderer.domElement);

        this.createHologram();
    },

    createHologram() {
        // PC vs Mobile Adaptive Size
        const isSmallScreen = window.innerWidth < 768;
        const radius = isSmallScreen ? 45 : 85; 
        const count = isSmallScreen ? 4000 : 10000;

        const geo = new THREE.BufferGeometry();
        const pos = new Float32Array(count * 3);
        const cols = new Float32Array(count * 3);

        for(let i=0; i<count; i++) {
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(2 * Math.random() - 1);
            pos[i*3] = radius * Math.sin(phi) * Math.cos(theta);
            pos[i*3+1] = radius * Math.sin(phi) * Math.sin(theta);
            pos[i*3+2] = radius * Math.cos(phi);
            cols[i*3] = 0; cols[i*3+1] = 1; cols[i*3+2] = 1;
        }

        geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
        geo.setAttribute('color', new THREE.BufferAttribute(cols, 3));
        this.points = new THREE.Points(geo, new THREE.PointsMaterial({
            size: 0.7, vertexColors: true, transparent: true, opacity: 0.8, blending: THREE.AdditiveBlending
        }));
        this.scene.add(this.points);
        this.origPos = new Float32Array(pos);
    },

    animate() {
        requestAnimationFrame(() => this.animate());
        
        // Handle Zoom
        this.camera.position.z = THREE.MathUtils.lerp(this.camera.position.z, 150/State.zoom, 0.1);
        
        // Handle Rotation
        if (!State.isFreezed) {
            this.points.rotation.y += State.rotationSpeed.y;
            this.points.rotation.x += State.rotationSpeed.x;
        }

        // Handle Color Smoothing
        const colAttr = this.points.geometry.attributes.color;
        const currentTarget = State.isPinching ? State.targetColor : State.activeColor;
        
        for (let i = 0; i < colAttr.count; i++) {
            colAttr.array[i*3] += (currentTarget.r - colAttr.array[i*3]) * 0.1;
            colAttr.array[i*3+1] += (currentTarget.g - colAttr.array[i*3+1]) * 0.1;
            colAttr.array[i*3+2] += (currentTarget.b - colAttr.array[i*3+2]) * 0.1;
        }
        colAttr.needsUpdate = true;
        
        this.renderer.render(this.scene, this.camera);
    }
};

// --- GESTURE RECOGNITION (12+ States) ---
function processGestures(landmarks, handIndex) {
    const lm = landmarks;
    const dist = (a, b) => Math.hypot(lm[a].x - lm[b].x, lm[a].y - lm[b].y);

    // 1. Pinch (Thumb + Index)
    if (dist(4, 8) < 0.04) return 'PINCH';
    // 2. Pointing (Index up)
    if (lm[8].y < lm[6].y && lm[12].y > lm[10].y) return 'POINT';
    // 3. Peace (Index + Middle)
    if (lm[8].y < lm[6].y && lm[12].y < lm[10].y && lm[16].y > lm[14].y) return 'PEACE';
    // 4. Fist
    if (dist(8, 0) < 0.15 && dist(12, 0) < 0.15) return 'FIST';
    // 5. Rock (Pinky + Index)
    if (lm[8].y < lm[6].y && lm[20].y < lm[18].y && lm[12].y > lm[10].y) return 'ROCK';
    // 6. Thumb Up
    if (lm[4].y < lm[3].y && lm[8].x > lm[6].x) return 'THUMB';
    // 7. Open Palm
    if (lm[8].y < lm[6].y && lm[12].y < lm[10].y && lm[16].y < lm[14].y && lm[20].y < lm[18].y) return 'PALM';
    
    return 'IDLE';
}

// --- INITIALIZE ---
document.getElementById('start-btn').addEventListener('click', async () => {
    AudioEngine.init();
    document.getElementById('start-overlay').style.display = 'none';
    Visuals.init();
    Visuals.animate();

    const hands = new Hands({locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`});
    hands.setOptions({ maxNumHands: 2, modelComplexity: 1, minDetectionConfidence: 0.7 });

    hands.onResults(res => {
        const handData = res.multiHandLandmarks || [];
        
        // Reset per-frame states
        State.isPinching = false;
        State.isPointing = false;

        handData.forEach((lm, i) => {
            const gesture = processGestures(lm, i);
            document.getElementById(`h${i+1}-gesture`).innerText = gesture;

            if (gesture === 'PINCH') {
                State.isPinching = true;
                AudioEngine.hum(400); 
            }
            if (gesture === 'POINT') {
                State.isPointing = true;
                State.rotationSpeed.y = (lm[8].x - 0.5) * 0.1;
                State.rotationSpeed.x = (lm[8].y - 0.5) * 0.1;
                AudioEngine.hum(100);
            }
            if (gesture === 'PEACE') State.isFreezed = true;
            else State.isFreezed = false;
        });

        // 2-Hand Zoom Logic
        if (handData.length === 2) {
            const d = Math.hypot(handData[0][9].x - handData[1][9].x, handData[0][9].y - handData[1][9].y);
            State.zoom = THREE.MathUtils.clamp(d * 3, 0.5, 4.0);
            document.getElementById('zoom-val').innerText = State.zoom.toFixed(1) + "x";
        }
    });

    const video = document.getElementById('video-input');
    const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } });
    video.srcObject = stream;
    video.play();

    const loop = async () => {
        await hands.send({image: video});
        requestAnimationFrame(loop);
    };
    loop();
});
