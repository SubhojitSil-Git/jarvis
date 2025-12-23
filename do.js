import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';

// --- STARK AUDIO ENGINE ---
const SFX = {
    ctx: null,
    osc: null,
    gain: null,
    init() {
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    },
    // High-pitched data beep
    ping() {
        if(!this.ctx) return;
        const o = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        o.type = 'sine'; o.frequency.setValueAtTime(880, this.ctx.currentTime);
        g.gain.setValueAtTime(0.1, this.ctx.currentTime);
        g.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 0.1);
        o.connect(g); g.connect(this.ctx.destination);
        o.start(); o.stop(this.ctx.currentTime + 0.1);
    },
    // Deep humming sound for zoom
    zoomVrm(factor) {
        if(!this.ctx) return;
        const freq = 100 + (factor * 200);
        const o = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        o.frequency.setValueAtTime(freq, this.ctx.currentTime);
        g.gain.setValueAtTime(0.05, this.ctx.currentTime);
        g.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 0.2);
        o.connect(g); g.connect(this.ctx.destination);
        o.start(); o.stop(this.ctx.currentTime + 0.2);
    }
};

const State = {
    hands: [],
    zoom: 1.0,
    baseDist: null,
    isPinching: false,
    colorTarget: new THREE.Color(0x00ffff), // Idle Blue
    activeColor: new THREE.Color(0xffaa00)  // Active Gold
};

const Visuals = {
    scene: null, camera: null, renderer: null, points: null,
    
    init() {
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 2000);
        this.camera.position.z = 150;

        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        document.body.appendChild(this.renderer.domElement);

        this.createHologram();
    },

    createHologram() {
        // --- ADAPTIVE SCALING ---
        const isMobile = window.innerWidth < 768;
        const sphereRadius = isMobile ? 40 : 75; // Bigger for PC/Tablet

        const count = isMobile ? 3000 : 8000;
        const geo = new THREE.BufferGeometry();
        const pos = new Float32Array(count * 3);
        const colors = new Float32Array(count * 3);
        
        for(let i=0; i<count; i++) {
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(2 * Math.random() - 1);
            pos[i*3] = sphereRadius * Math.sin(phi) * Math.cos(theta);
            pos[i*3+1] = sphereRadius * Math.sin(phi) * Math.sin(theta);
            pos[i*3+2] = sphereRadius * Math.cos(phi);
            colors[i*3] = 0; colors[i*3+1] = 1; colors[i*3+2] = 1;
        }
        
        geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
        geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        
        const mat = new THREE.PointsMaterial({
            size: 0.8, vertexColors: true, transparent: true, opacity: 0.8, blending: THREE.AdditiveBlending
        });
        
        this.points = new THREE.Points(geo, mat);
        this.scene.add(this.points);
        this.origPos = new Float32Array(pos);
    },

    animate() {
        requestAnimationFrame(() => this.animate());
        
        const posAttr = this.points.geometry.attributes.position;
        const colAttr = this.points.geometry.attributes.color;

        // Apply Zoom to Camera
        this.camera.position.z = THREE.MathUtils.lerp(this.camera.position.z, 150 / State.zoom, 0.1);
        document.getElementById('zoom-level').innerText = State.zoom.toFixed(1) + "x";

        // Global Color Shift
        const target = State.isPinching ? State.activeColor : State.colorTarget;
        
        for (let i = 0; i < colAttr.count; i++) {
            colAttr.array[i*3] += (target.r - colAttr.array[i*3]) * 0.1;
            colAttr.array[i*3+1] += (target.g - colAttr.array[i*3+1]) * 0.1;
            colAttr.array[i*3+2] += (target.b - colAttr.array[i*3+2]) * 0.1;
            
            // Subtle pulse
            const x = this.origPos[i*3];
            const y = this.origPos[i*3+1];
            const z = this.origPos[i*3+2];
            posAttr.array[i*3] = x + Math.sin(Date.now()*0.002 + i)*0.5;
        }

        this.points.rotation.y += 0.003;
        posAttr.needsUpdate = true;
        colAttr.needsUpdate = true;
        this.renderer.render(this.scene, this.camera);
    }
};

// --- START APP ---
document.getElementById('start-btn').addEventListener('click', async () => {
    SFX.init();
    document.getElementById('start-overlay').style.display = 'none';
    Visuals.init();
    Visuals.animate();

    const hands = new Hands({locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`});
    hands.setOptions({ maxNumHands: 2, modelComplexity: 1, minDetectionConfidence: 0.6 });

    hands.onResults(res => {
        State.hands = res.multiHandLandmarks || [];
        
        // --- TWO HAND ZOOM LOGIC ---
        if (State.hands.length === 2) {
            const h1 = State.hands[0][9];
            const h2 = State.hands[1][9];
            const currentDist = Math.hypot(h1.x - h2.x, h1.y - h2.y);

            if (!State.baseDist) {
                State.baseDist = currentDist;
            } else {
                const diff = (currentDist / State.baseDist);
                const oldZoom = State.zoom;
                State.zoom = THREE.MathUtils.clamp(diff, 0.5, 3.0);
                
                // Play zoom sound if significant change
                if (Math.abs(oldZoom - State.zoom) > 0.05) SFX.zoomVrm(State.zoom);
            }
            document.getElementById('hand1-status').innerText = "TRACKING";
            document.getElementById('hand2-status').innerText = "TRACKING";
        } else {
            State.baseDist = null;
            document.getElementById('hand2-status').innerText = "OFFLINE";
        }

        // --- SINGLE HAND PINCH COLOR LOGIC ---
        if (State.hands.length > 0) {
            const h = State.hands[0];
            const pinchDist = Math.hypot(h[4].x - h[8].x, h[4].y - h[8].y);
            
            if (pinchDist < 0.04) {
                if (!State.isPinching) SFX.ping();
                State.isPinching = true;
            } else {
                State.isPinching = false;
            }
            document.getElementById('hand1-status').innerText = "TRACKING";
        }
    });

    const video = document.getElementById('video-input');
    const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: "user", width: 640, height: 480 } 
    });
    video.srcObject = stream;
    video.play();

    const cameraControl = async () => {
        await hands.send({image: video});
        requestAnimationFrame(cameraControl);
    };
    cameraControl();
});
