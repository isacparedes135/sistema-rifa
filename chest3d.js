// Chest 3D Logic using Three.js

let scene, camera, renderer, chestGroup, lidGroup, chestBase;
let isSpinning = false;
let isOpen = false;
let floatFrame = 0;
let animationId;
let particles = [];

// Cache textures to avoid stutter on reload
let cachedWoodTexture = null;

// Initialize 3D Scene
function init3DChest() {
    const container = document.getElementById('chest-container');
    if (!container) return;

    if (typeof THREE === 'undefined') {
        alert('Error: Three.js no ha cargado. Verifica tu conexión a internet.');
        return;
    }

    try {
        if (animationId) cancelAnimationFrame(animationId);
        container.innerHTML = '';

        // Instruction text
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

        scene = new THREE.Scene();

        let width = container.clientWidth;
        let height = container.clientHeight;
        if (width === 0 || height === 0) {
            width = 300; height = 400;
            container.style.width = '100%'; container.style.height = '400px';
        }

        const aspect = width / height;
        camera = new THREE.PerspectiveCamera(40, aspect, 0.1, 1000); // Lower FOV for more cinematic look
        camera.position.set(0, 8, 40);
        camera.lookAt(0, -2, 0);

        renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: "high-performance" });
        renderer.setSize(width, height);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // Cap pixel ratio for performance
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap; // Softer shadows
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.0;
        container.appendChild(renderer.domElement);

        // Lighting - Dramatic Pirate Lighting
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.2); // Darker ambient
        scene.add(ambientLight);

        const keyLight = new THREE.SpotLight(0xffeeb1, 2);
        keyLight.position.set(15, 25, 20);
        keyLight.castShadow = true;
        keyLight.penumbra = 0.5;
        scene.add(keyLight);

        const fillLight = new THREE.PointLight(0xc49a6c, 1, 50); // Warm fill
        fillLight.position.set(-10, 5, 10);
        scene.add(fillLight);

        const rimLight = new THREE.SpotLight(0x4a90e2, 3); // Cool rim light (moonlight vibe)
        rimLight.position.set(0, 10, -20);
        rimLight.lookAt(0, 0, 0);
        scene.add(rimLight);

        buildChest();
        animate();

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

// Optimized Procedural Wood
function getWoodTexture() {
    if (cachedWoodTexture) return cachedWoodTexture;

    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    // Dark, aged wood base
    ctx.fillStyle = '#21130d';
    ctx.fillRect(0, 0, 512, 512);

    // Weathered grain
    for (let i = 0; i < 150; i++) {
        const x = Math.random() * 512;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.bezierCurveTo(x + (Math.random() - 0.5) * 100, 200, x + (Math.random() - 0.5) * 100, 400, x, 512);
        // Varying thickness and opacity for depth
        ctx.strokeStyle = Math.random() > 0.5 ? '#1a0f0a' : '#2e1c12';
        ctx.lineWidth = Math.random() * 4 + 1;
        ctx.stroke();
    }

    // Scratches/Noise
    const imageData = ctx.getImageData(0, 0, 512, 512);
    const data = imageData.data;
    for (let i = 0; i < data.length; i += 4) {
        if (Math.random() > 0.95) {
            const val = data[i] + (Math.random() - 0.5) * 40;
            data[i] = data[i + 1] = data[i + 2] = val; // Grayscale scratches
        }
    }
    ctx.putImageData(imageData, 0, 0);

    const texture = new THREE.CanvasTexture(canvas);
    cachedWoodTexture = texture;
    return texture;
}

function buildChest() {
    chestGroup = new THREE.Group();
    scene.add(chestGroup);

    // --- MATERIALS (Aged Pirate Look) ---
    const woodMap = getWoodTexture();

    const agedWoodMat = new THREE.MeshStandardMaterial({
        map: woodMap,
        color: 0x5d4037,
        roughness: 0.8,
        metalness: 0.1,
        // bumpMap: woodMap, // Bump map can be expensive on low-end, keeping map is enough usually
    });

    // Worn Iron/Bronze
    const wornMetalMat = new THREE.MeshStandardMaterial({
        color: 0x6d5635, // Dull Bronze
        roughness: 0.4,
        metalness: 0.6,
    });

    // Black Iron (for structural bands)
    const ironMat = new THREE.MeshStandardMaterial({
        color: 0x222222,
        roughness: 0.7,
        metalness: 0.5
    });

    const innerMat = new THREE.MeshStandardMaterial({
        color: 0x1a0f0a,
        roughness: 1.0,
        side: THREE.BackSide
    });

    // --- GEOMETRY ---
    // Make it "fat" and heavy
    const W = 11;
    const H = 6;
    const D = 7;
    const thickness = 0.8;

    chestBase = new THREE.Group();
    chestGroup.add(chestBase);

    // Box Walls (Tapered effect manually?) 
    // Just standard thick walls for solidity

    const floor = new THREE.Mesh(new THREE.BoxGeometry(W, thickness, D), agedWoodMat);
    floor.position.y = -H / 2 + thickness / 2;
    floor.receiveShadow = true;
    chestBase.add(floor);

    const front = new THREE.Mesh(new THREE.BoxGeometry(W, H, thickness), agedWoodMat);
    front.position.z = D / 2 - thickness / 2;
    front.receiveShadow = true;
    chestBase.add(front);

    const back = new THREE.Mesh(new THREE.BoxGeometry(W, H, thickness), agedWoodMat);
    back.position.z = -D / 2 + thickness / 2;
    back.receiveShadow = true;
    chestBase.add(back);

    const left = new THREE.Mesh(new THREE.BoxGeometry(thickness, H, D - thickness * 2), agedWoodMat);
    left.position.x = -W / 2 + thickness / 2;
    left.receiveShadow = true;
    chestBase.add(left);

    const right = new THREE.Mesh(new THREE.BoxGeometry(thickness, H, D - thickness * 2), agedWoodMat);
    right.position.x = W / 2 - thickness / 2;
    right.receiveShadow = true;
    chestBase.add(right);

    // --- HEAVY IRON BANDS ---
    // Vertical bands interacting with lid
    const bandGeo = new THREE.BoxGeometry(1.2, H, 1.2 * 1.5); // Thicker corners
    const corners = [
        { x: -W / 2, z: D / 2 }, { x: W / 2, z: D / 2 },
        { x: -W / 2, z: -D / 2 }, { x: W / 2, z: -D / 2 }
    ];
    corners.forEach(pos => {
        // Main Corner Post
        const post = new THREE.Mesh(bandGeo, ironMat);
        post.position.set(pos.x, 0, pos.z);
        chestBase.add(post);

        // Rivets
        const rivGeo = new THREE.SphereGeometry(0.25, 8, 8);
        const r1 = new THREE.Mesh(rivGeo, wornMetalMat);
        r1.position.set(pos.x, H / 3, pos.z + (pos.z > 0 ? 0.6 : -0.6));
        chestBase.add(r1);

        const r2 = new THREE.Mesh(rivGeo, wornMetalMat);
        r2.position.set(pos.x + (pos.x > 0 ? 0.6 : -0.6), H / 3, pos.z);
        chestBase.add(r2);
    });

    // --- LID (Curved Pirate Style) ---
    lidGroup = new THREE.Group();
    lidGroup.position.set(0, H / 2, -D / 2);
    chestGroup.add(lidGroup);

    // Main Arch
    const lidRadius = D / 2;
    // slightly larger radius so it overhangs
    const lidArchGeo = new THREE.CylinderGeometry(lidRadius, lidRadius, W, 32, 1, false, 0, Math.PI);
    lidArchGeo.rotateZ(Math.PI / 2);
    const lidMesh = new THREE.Mesh(lidArchGeo, agedWoodMat);
    lidMesh.position.z = D / 2;
    lidGroup.add(lidMesh);

    // Lid Sides
    const lidSideGeo = new THREE.CircleGeometry(lidRadius, 32, 0, Math.PI);
    const lSide = new THREE.Mesh(lidSideGeo, agedWoodMat);
    lSide.rotation.y = -Math.PI / 2;
    lSide.position.set(-W / 2, 0, D / 2);
    lidGroup.add(lSide);

    const rSide = new THREE.Mesh(lidSideGeo, agedWoodMat);
    rSide.rotation.y = Math.PI / 2;
    rSide.position.set(W / 2, 0, D / 2);
    lidGroup.add(rSide);

    // Inner Lid
    const innerLid = new THREE.Mesh(lidArchGeo, innerMat);
    innerLid.scale.set(0.95, 0.95, 0.98); // Slightly smaller
    innerLid.position.z = D / 2;
    lidGroup.add(innerLid);

    // --- LID DETAILS (Iron Bands) ---
    const archBandGeo = new THREE.CylinderGeometry(lidRadius + 0.1, lidRadius + 0.1, 1.2, 32, 1, false, 0, Math.PI);
    archBandGeo.rotateZ(Math.PI / 2);

    // 3 Bands: Left, Center, Right
    const bandPos = [-W / 2 + 0.6, 0, W / 2 - 0.6];
    bandPos.forEach(x => {
        const b = new THREE.Mesh(archBandGeo, ironMat);
        b.position.set(x, 0, D / 2);
        lidGroup.add(b);
    });

    // Big Heavy Latch
    const lockPlate = new THREE.Mesh(new THREE.BoxGeometry(2.5, 3, 0.5), ironMat);
    lockPlate.position.set(0, 0, D + 0.2);
    chestBase.add(lockPlate);

    const lidHasp = new THREE.Mesh(new THREE.BoxGeometry(2, 2.5, 0.6), ironMat);
    lidHasp.position.set(0, -0.5, D + 0.3); // Hangs down from lid
    lidHasp.rotation.x = Math.PI / 12;
    lidGroup.add(lidHasp);

    // Padlock Ring
    const ringGeo = new THREE.TorusGeometry(0.6, 0.15, 8, 16);
    const ring = new THREE.Mesh(ringGeo, wornMetalMat);
    ring.position.set(0, -1.8, D + 0.6);
    ring.rotation.y = Math.PI / 2;
    lidGroup.add(ring);

    // Side Handles (Heavy Rings)
    const handleGeo = new THREE.TorusGeometry(1.2, 0.25, 8, 16);
    const hL = new THREE.Mesh(handleGeo, ironMat);
    hL.position.set(-W / 2 - 0.3, 0, 0);
    hL.rotation.y = Math.PI / 2;
    chestBase.add(hL);

    const hR = new THREE.Mesh(handleGeo, ironMat);
    hR.position.set(W / 2 + 0.3, 0, 0);
    hR.rotation.y = Math.PI / 2;
    chestBase.add(hR);

    // Initial setup
    chestGroup.rotation.y = -0.5;
    chestGroup.rotation.x = 0.1;
}

function start3DSpin(callback) {
    if (isSpinning || isOpen) return;
    isSpinning = true;
    const duration = 2000; // Slower, heavier spin
    const startTime = Date.now();
    const startRot = chestGroup.rotation.y;
    const totalSpin = Math.PI * 4;

    create3DParticles();

    function spinLoop() {
        const now = Date.now();
        const progress = Math.min((now - startTime) / duration, 1);
        // Ease In Out for heavy feel
        const ease = progress < 0.5 ? 2 * progress * progress : -1 + (4 - 2 * progress) * progress;

        chestGroup.rotation.y = startRot + (totalSpin * ease);

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
    const duration = 1200; // Slower open (heavy lid)
    const startTime = Date.now();

    function openLoop() {
        const now = Date.now();
        const progress = Math.min((now - startTime) / duration, 1);
        // Bounce at end (heavy impact)
        // const ease = 1 + 2.70158 * Math.pow(progress - 1, 3) + 1.70158 * Math.pow(progress - 1, 2);
        const ease = 1 - Math.pow(1 - progress, 3); // Cubic out (simple soft open)

        lidGroup.rotation.x = -2.2 * ease;

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
    const count = 60;
    const posArray = new Float32Array(count * 3);
    for (let i = 0; i < count * 3; i++) {
        posArray[i] = (Math.random() - 0.5) * 25;
    }
    geo.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
    const mat = new THREE.PointsMaterial({ size: 0.8, color: 0xffaa00, transparent: true, opacity: 0.8 });
    const pts = new THREE.Points(geo, mat);
    scene.add(pts);
    particles.push({ mesh: pts });
}

function animate() {
    requestAnimationFrame(animate);
    if (scene && camera && renderer) {
        if (!isSpinning && !isOpen) {
            floatFrame += 0.015;
            // Heavier float
            chestGroup.position.y = Math.sin(floatFrame) * 0.3;
        }
        particles.forEach(p => {
            p.mesh.rotation.y += 0.005;
            p.mesh.position.y += 0.02;
        });
        renderer.render(scene, camera);
    }
}

window.init3DChest = init3DChest;
window.start3DSpin = start3DSpin;
