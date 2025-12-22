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

        // Reset State (Fix for re-opening bug)
        isSpinning = false;
        isOpen = false;
        floatFrame = 0;
        particles = []; // Clear particles array logic

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
        renderer.toneMappingExposure = 1.3; // Increased exposure significantly
        container.appendChild(renderer.domElement);

        // Lighting - Brighter "Studio" Lighting for visibility
        const ambientLight = new THREE.AmbientLight(0xffffff, 1.5); // Boosted Ambient
        scene.add(ambientLight);

        // Strong Front Key Light
        const frontLight = new THREE.DirectionalLight(0xfffaed, 1.8); // Boosted Front Light
        frontLight.position.set(5, 10, 20); // Front-Right-Top
        frontLight.castShadow = true;
        scene.add(frontLight);

        // Fill Light from left
        const fillLight = new THREE.PointLight(0xffd700, 0.8, 50);
        fillLight.position.set(-15, 5, 10);
        scene.add(fillLight);

        // Rim Light for edge definition (Back)
        const rimLight = new THREE.SpotLight(0x4a90e2, 2);
        rimLight.position.set(0, 15, -20);
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

    // Inner Lid (Fix: Use smaller geometry instead of scaling to avoid distortion)
    const innerLidGeo = new THREE.CylinderGeometry(lidRadius - 0.1, lidRadius - 0.1, W - 0.1, 32, 1, true, 0, Math.PI);
    innerLidGeo.rotateZ(Math.PI / 2);
    const innerLid = new THREE.Mesh(innerLidGeo, innerMat);
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

    // --- DETAILED LOCK MECHANISM (Skeleton Key Ready) ---

    // 1. Lock Body (Attached to Base)
    // A thick, iron housing for the mechanism
    const lockWidth = 2.0;
    const lockHeight = 2.2;
    const lockDepth = 0.8;
    const lockBodyGeo = new THREE.BoxGeometry(lockWidth, lockHeight, lockDepth);
    const lockBody = new THREE.Mesh(lockBodyGeo, ironMat);
    // Position on front wall (D/2), centered
    lockBody.position.set(0, 0, D / 2 + lockDepth / 2);
    chestBase.add(lockBody);

    // Decorative Plate (Bronze/Gold border on lock)
    const plateGeo = new THREE.BoxGeometry(lockWidth + 0.2, lockHeight + 0.2, 0.2);
    const lockPlateDeco = new THREE.Mesh(plateGeo, wornMetalMat);
    lockPlateDeco.position.set(0, 0, -0.4); // slightly behind front face of lockBody
    lockBody.add(lockPlateDeco);

    // 2. The Keyhole (Functional looking black void)
    // Cylinder for the round part
    const keyHoleRoundGeo = new THREE.CylinderGeometry(0.25, 0.25, 0.5, 16);
    keyHoleRoundGeo.rotateX(Math.PI / 2);
    const keyHoleRound = new THREE.Mesh(keyHoleRoundGeo, new THREE.MeshBasicMaterial({ color: 0x000000 }));
    keyHoleRound.position.set(0, 0.2, lockDepth / 2 + 0.01);
    lockBody.add(keyHoleRound);

    // Box for the slit part
    const keyHoleSlitGeo = new THREE.BoxGeometry(0.15, 0.6, 0.5);
    const keyHoleSlit = new THREE.Mesh(keyHoleSlitGeo, new THREE.MeshBasicMaterial({ color: 0x000000 }));
    keyHoleSlit.position.set(0, 0, lockDepth / 2 + 0.01);
    lockBody.add(keyHoleSlit);

    // 3. The Hasp (Hinged part from Lid)
    // Must look like it goes OVER the lock loop (implied loop)
    const haspWidth = 1.0;
    const haspheight = 2.5;
    const haspThick = 0.3;

    // Main vertical strip
    const haspGeo = new THREE.BoxGeometry(haspWidth, haspheight, haspThick);
    const hasp = new THREE.Mesh(haspGeo, ironMat);
    // Hasp pivot point is at the top edge of the base usually, or attached to lid.
    // If attached to lid, it rotates with lid.
    // Position relative to Lid Group: 
    // It should hang down from front center.
    hasp.position.set(0, -1.0, D + 0.4); // Hanging down
    hasp.rotation.x = Math.PI / 12; // Slight angle out
    lidGroup.add(hasp);

    // The "Loop" or "staple" on the hasp that goes over the lock? 
    // Usually the hasp has a slot, and a loop comes from the lock. 
    // Let's create the visible "Slot" on the hasp
    const haspSlot = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.8, 0.1), new THREE.MeshBasicMaterial({ color: 0x111111 }));
    haspSlot.position.set(0, -0.8, 0.16); // Surface of hasp
    hasp.add(haspSlot);

    // Padlock Ring/Loop (Optional, but user asked for "key" lock, usually integral)
    // We'll assume it's an integral lock (chest lock), so the Hasp just clicks in.
    // The keyhole is ON the chest body (lockBody).
    // The hasp latches INTO the lock body. This is consistent with "Skeleton Key" chests.

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
