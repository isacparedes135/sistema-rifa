// Chest 3D Logic using Three.js

let scene, camera, renderer, chestGroup, lidGroup, chestBase;
let isSpinning = false;
let isOpen = false;
let floatFrame = 0;
let animationId;
let particles = [];

// Initialize 3D Scene
function init3DChest() {
    const container = document.getElementById('chest-container');
    if (!container) return;

    // Check if Three.js is loaded
    if (typeof THREE === 'undefined') {
        alert('Error: Three.js no ha cargado. Verifica tu conexión a internet.');
        console.error('Three.js not found');
        return;
    }

    try {
        // Stop previous animation if running
        if (animationId) cancelAnimationFrame(animationId);

        // Clear container (removes old canvas and loading text)
        container.innerHTML = '';

        // Re-add instruction text overlay
        const instruction = document.createElement('p');
        instruction.className = 'chest-instruction';
        instruction.innerText = 'Haz clic para abrir';
        instruction.style.position = 'absolute';
        instruction.style.bottom = '20px';
        instruction.style.color = '#ffd700';
        instruction.style.textShadow = '0 0 5px #000';
        instruction.style.zIndex = '10';
        instruction.style.pointerEvents = 'none';
        container.appendChild(instruction);

        // 1. Scene & Camera
        scene = new THREE.Scene();

        // Debug: Check dimensions
        let width = container.clientWidth;
        let height = container.clientHeight;

        if (width === 0 || height === 0) {
            console.warn('Chest3D: Container has 0 dimensions. Using fallback 300x400.');
            width = 300;
            height = 400;
            // Verify style
            container.style.width = '100%';
            container.style.height = '400px';
        }
        console.log(`Chest3D: Initializing with ${width}x${height}`);

        // Perspective Camera: FOV, Aspect, Near, Far
        // Moved camera further back slightly to accommodate larger chest
        const aspect = width / height;
        camera = new THREE.PerspectiveCamera(45, aspect, 0.1, 1000);
        camera.position.set(0, 12, 35);
        camera.lookAt(0, 0, 0);

        // 2. Renderer
        renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
        renderer.setSize(width, height);
        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.shadowMap.enabled = true;
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.2;
        container.appendChild(renderer.domElement);

        // 3. Lighting - Enhanced for realism
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
        scene.add(ambientLight);

        const dirLight = new THREE.DirectionalLight(0xfffaed, 2);
        dirLight.position.set(10, 20, 15);
        dirLight.castShadow = true;
        dirLight.shadow.mapSize.width = 1024;
        dirLight.shadow.mapSize.height = 1024;
        scene.add(dirLight);

        const rimLight = new THREE.SpotLight(0xffd700, 5);
        rimLight.position.set(-15, 10, -10);
        rimLight.lookAt(0, 0, 0);
        scene.add(rimLight);

        // 4. Build Chest
        buildChest();

        // 5. Animation Loop
        animate();

        // Resize Handler
        window.addEventListener('resize', () => {
            if (!container) return;
            const newAspect = container.clientWidth / container.clientHeight;
            camera.aspect = newAspect;
            camera.updateProjectionMatrix();
            renderer.setSize(container.clientWidth, container.clientHeight);
        });
    } catch (e) {
        console.error("Critical Error initializing 3D Chest:", e);
        alert("Error crítico iniciando gráficos 3D: " + e.message);
    }
}

// Procedural Wood Texture Generator
function createWoodTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    // Base background
    ctx.fillStyle = '#3e2723';
    ctx.fillRect(0, 0, 512, 512);

    // Grain lines
    for (let i = 0; i < 200; i++) {
        const x = Math.random() * 512;
        const thickness = Math.random() * 2 + 0.5;
        const opacity = Math.random() * 0.3 + 0.1;

        ctx.beginPath();
        // Wavy line
        ctx.moveTo(x, 0);
        ctx.bezierCurveTo(x + (Math.random() - 0.5) * 50, 170, x + (Math.random() - 0.5) * 50, 340, x, 512);

        ctx.strokeStyle = `rgba(0, 0, 0, ${opacity})`;
        ctx.lineWidth = thickness;
        ctx.stroke();
    }

    // Noise
    const imageData = ctx.getImageData(0, 0, 512, 512);
    const data = imageData.data;
    for (let i = 0; i < data.length; i += 4) {
        const noise = (Math.random() - 0.5) * 20;
        data[i] = Math.max(0, Math.min(255, data[i] + noise));
        data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + noise));
        data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + noise));
    }
    ctx.putImageData(imageData, 0, 0);

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    return texture;
}

function buildChest() {
    chestGroup = new THREE.Group();
    scene.add(chestGroup);

    // --- MATERIALS ---
    const woodMap = createWoodTexture();

    // Main Wood (Outer)
    const woodMaterial = new THREE.MeshStandardMaterial({
        map: woodMap,
        color: 0x8d6e63, // Tint the texture slightly lighter
        roughness: 0.6,
        metalness: 0.1,
        bumpMap: woodMap,
        bumpScale: 0.05
    });

    // Darker Inner Wood
    const innerWoodMaterial = new THREE.MeshStandardMaterial({
        color: 0x2d1b16,
        roughness: 0.9,
        map: woodMap
    });

    // Gold Metal
    const goldMaterial = new THREE.MeshStandardMaterial({
        color: 0xffd700,
        roughness: 0.2, // Shinier
        metalness: 0.9, // Very metallic
        emissive: 0x443300,
        emissiveIntensity: 0.2
    });

    // Black Metal (Bands alternative or details)
    const darkMetalMaterial = new THREE.MeshStandardMaterial({
        color: 0x333333,
        roughness: 0.5,
        metalness: 0.8
    });

    // --- GEOMETRY CONSTANTS ---
    // Increased size by 25% (Original: 8 x 5 x 5)
    // New: 10 x 6.25 x 6.25
    const W = 10;
    const H = 6.25;
    const D = 6.25;
    const thickness = 0.6; // Slightly thicker

    chestBase = new THREE.Group();
    chestGroup.add(chestBase);

    // --- BASE ---

    // Floor
    const floor = new THREE.Mesh(new THREE.BoxGeometry(W, thickness, D), innerWoodMaterial);
    floor.position.y = -H / 2 + thickness / 2;
    floor.castShadow = true;
    floor.receiveShadow = true;
    chestBase.add(floor);

    // Walls
    const front = new THREE.Mesh(new THREE.BoxGeometry(W, H, thickness), woodMaterial);
    front.position.z = D / 2 - thickness / 2;
    front.castShadow = true;
    chestBase.add(front);

    const back = new THREE.Mesh(new THREE.BoxGeometry(W, H, thickness), woodMaterial);
    back.position.z = -D / 2 + thickness / 2;
    back.castShadow = true;
    chestBase.add(back);

    const left = new THREE.Mesh(new THREE.BoxGeometry(thickness, H, D - thickness * 2), woodMaterial);
    left.position.x = -W / 2 + thickness / 2;
    left.castShadow = true;
    chestBase.add(left);

    const right = new THREE.Mesh(new THREE.BoxGeometry(thickness, H, D - thickness * 2), woodMaterial);
    right.position.x = W / 2 - thickness / 2;
    right.castShadow = true;
    chestBase.add(right);

    // --- BASE DETAILS ---

    // Gold Corners (Vertical pillars)
    const cornerSize = 1.2;
    const positions = [
        { x: -W / 2, z: D / 2 }, { x: W / 2, z: D / 2 },
        { x: -W / 2, z: -D / 2 }, { x: W / 2, z: -D / 2 }
    ];
    positions.forEach(pos => {
        const corner = new THREE.Mesh(new THREE.BoxGeometry(cornerSize, H, cornerSize), goldMaterial);
        corner.position.set(pos.x, 0, pos.z);
        // Offset slightly to wrap corner
        // Actually, let's just place them at corners.
        // Adjust scale to not z-fight too much, simple wrap.
        // Better: 4 small L-shapes? No, box is fine for "Low poly" style.
        // Let's bevel them slightly? No, box is robust.
        chestBase.add(corner);

        // Add Rivets on corners
        for (let y = -H / 2 + 1; y < H / 2; y += 2) {
            const rivet = new THREE.Mesh(new THREE.SphereGeometry(0.15, 8, 8), goldMaterial);
            rivet.position.set(pos.x > 0 ? pos.x + cornerSize / 2 : pos.x - cornerSize / 2, y, pos.z);
            chestBase.add(rivet);

            const rivetZ = new THREE.Mesh(new THREE.SphereGeometry(0.15, 8, 8), goldMaterial);
            rivetZ.position.set(pos.x, y, pos.z > 0 ? pos.z + cornerSize / 2 : pos.z - cornerSize / 2);
            chestBase.add(rivetZ);
        }
    });

    // Side Handles (Torii/Rings)
    const handleGeo = new THREE.TorusGeometry(1, 0.2, 8, 16);
    const handleLeft = new THREE.Mesh(handleGeo, darkMetalMaterial);
    handleLeft.position.set(-W / 2 - 0.2, 0, 0);
    handleLeft.rotation.y = Math.PI / 2;
    chestBase.add(handleLeft);

    const handleRight = new THREE.Mesh(handleGeo, darkMetalMaterial);
    handleRight.position.set(W / 2 + 0.2, 0, 0);
    handleRight.rotation.y = Math.PI / 2;
    chestBase.add(handleRight);


    // --- LID ---
    lidGroup = new THREE.Group();
    // Pivot at top-back
    lidGroup.position.set(0, H / 2, -D / 2);
    chestGroup.add(lidGroup);

    // Lid Geometry: Top Arch
    const radius = D / 2;
    const segments = 32;
    const lidArchGeo = new THREE.CylinderGeometry(radius, radius, W, segments, 1, false, 0, Math.PI);
    lidArchGeo.rotateZ(Math.PI / 2); // Cylinder along X

    const lidMesh = new THREE.Mesh(lidArchGeo, woodMaterial);
    // Cylinder center is at (0,0,0). We need arch to start at Z=radius (front) and end at Z=-radius (back)
    // and flat bottom at Y=0.
    // Cylinder(radius) height goes from +Y to -Y (in its local frame, which we rotated to X).
    lidMesh.position.z = D / 2; // Move forward so axis is at back edge
    lidGroup.add(lidMesh);

    // Lid Ends (Semicircles)
    const endGeo = new THREE.CircleGeometry(radius, segments, 0, Math.PI);
    const endLeft = new THREE.Mesh(endGeo, woodMaterial);
    endLeft.position.set(-W / 2, 0, D / 2);
    endLeft.rotation.y = -Math.PI / 2;
    lidGroup.add(endLeft);

    const endRight = new THREE.Mesh(endGeo, woodMaterial);
    endRight.position.set(W / 2, 0, D / 2);
    endRight.rotation.y = Math.PI / 2;
    lidGroup.add(endRight);

    // Inner Lid (Darker to hide backface culling issues if any, and look deep)
    const innerRadius = radius - thickness;
    const lidInnerGeo = new THREE.CylinderGeometry(innerRadius, innerRadius, W - 0.1, segments, 1, true, 0, Math.PI);
    lidInnerGeo.rotateZ(Math.PI / 2);
    // We need to invert this mesh or use BackSide
    const innerMat = innerWoodMaterial.clone();
    innerMat.side = THREE.BackSide;
    const lidInner = new THREE.Mesh(lidInnerGeo, innerMat);
    lidInner.position.z = D / 2;
    lidGroup.add(lidInner);


    // --- LID DETAILS ---

    // Gold Bands (2 vertical loops over the arch)
    const bandRadius = radius + 0.05;
    const bandWidth = 0.8;
    const bandGeo = new THREE.CylinderGeometry(bandRadius, bandRadius, bandWidth, segments, 1, false, 0, Math.PI);
    bandGeo.rotateZ(Math.PI / 2);

    const bandLLocation = -W / 4;
    const bandRLocation = W / 4;

    const bandL = new THREE.Mesh(bandGeo, goldMaterial);
    bandL.position.set(bandLLocation, 0, D / 2);
    lidGroup.add(bandL);

    const bandR = new THREE.Mesh(bandGeo, goldMaterial);
    bandR.position.set(bandRLocation, 0, D / 2);
    lidGroup.add(bandR);

    // Front/Back rim of lid
    const rimGeo = new THREE.BoxGeometry(W, 0.4, D);
    const lidRim = new THREE.Mesh(rimGeo, goldMaterial);
    lidRim.position.set(0, 0, D / 2); // At the flat bottom of lid
    // This covers the seam
    lidGroup.add(lidRim);

    // Latch System
    const latchHeight = 2.5;
    const latchW = 1.5;
    const latchD = 0.5;

    // Top part attached to lid
    const latchTop = new THREE.Mesh(new THREE.BoxGeometry(latchW, latchHeight, latchD), goldMaterial);
    latchTop.position.set(0, -0.5, D + radius - 1); // Sticks out front
    // Angle it?
    latchTop.rotation.x = Math.PI / 8;
    latchTop.position.z = D + 0.1;
    latchTop.position.y = 0.5;

    // Better Latch: A distinct lock body on the base, and a hasp on the lid
    // Hasp on Lid
    const haspGeo = new THREE.BoxGeometry(1.5, 2, 0.4);
    const hasp = new THREE.Mesh(haspGeo, goldMaterial);
    hasp.position.set(0, 0, D + 0.2); // Front face of lid
    lidGroup.add(hasp);

    // Lock Body on Base
    const lockBodyGeo = new THREE.BoxGeometry(2, 2.5, 0.8);
    const lockBody = new THREE.Mesh(lockBodyGeo, goldMaterial);
    lockBody.position.set(0, 0, D / 2 + 0.4); // Front of base
    chestBase.add(lockBody);

    // Keyhole
    const keyhole = new THREE.Mesh(new THREE.CircleGeometry(0.4, 16), new THREE.MeshBasicMaterial({ color: 0x000000 }));
    keyhole.position.set(0, 0.2, 0.41); // Roughly front of lockBody
    lockBody.add(keyhole);


    // Initial Rotation
    chestGroup.rotation.y = -0.5;
    chestGroup.rotation.x = 0.2;
}


// --- Animation Logic ---

function start3DSpin(callback) {
    if (isSpinning || isOpen) return;

    isSpinning = true;
    const duration = 1800;
    const startTime = Date.now();
    const startRot = chestGroup.rotation.y;
    const totalSpin = Math.PI * 6; // 3 spins

    create3DParticles();

    function spinLoop() {
        const now = Date.now();
        const progress = Math.min((now - startTime) / duration, 1);
        chestGroup.rotation.y = startRot + (totalSpin * progress);

        if (progress < 1) {
            animationId = requestAnimationFrame(spinLoop);
        } else {
            isSpinning = false;
            open3DChest(callback);
        }
    }
    spinLoop();
}

function open3DChest(callback) {
    isOpen = true;
    const duration = 1000;
    const startTime = Date.now();

    function openLoop() {
        const now = Date.now();
        const progress = Math.min((now - startTime) / duration, 1);
        const ease = 1 + 2.70158 * Math.pow(progress - 1, 3) + 1.70158 * Math.pow(progress - 1, 2);

        lidGroup.rotation.x = -2.5 * ease;

        if (progress < 1) {
            requestAnimationFrame(openLoop);
        } else {
            if (callback) callback();
        }
    }
    openLoop();
}

function create3DParticles() {
    const geo = new THREE.BufferGeometry();
    const count = 50;
    const posArray = new Float32Array(count * 3);

    for (let i = 0; i < count * 3; i++) {
        posArray[i] = (Math.random() - 0.5) * 20; // Spread out more
    }
    geo.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
    const mat = new THREE.PointsMaterial({ size: 0.6, color: 0xffd700 });
    const pts = new THREE.Points(geo, mat);
    scene.add(pts);
    particles.push({ mesh: pts, startTime: Date.now() });
}

function animate() {
    requestAnimationFrame(animate);

    if (scene && camera && renderer) {
        if (!isSpinning && !isOpen) {
            floatFrame += 0.02;
            chestGroup.position.y = Math.sin(floatFrame) * 0.5;
        }

        particles.forEach((p, index) => {
            p.mesh.rotation.y += 0.02;
            p.mesh.position.y += 0.05;
        });

        renderer.render(scene, camera);
    }
}

window.init3DChest = init3DChest;
window.start3DSpin = start3DSpin;
