// Chest 3D Logic using Three.js

let scene, camera, renderer, chestGroup, lidGroup, chestBase, keyGroup;
let isAnimating = false;
let isOpen = false;
let floatFrame = 0;
let animationId;

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

        // Reset State
        isAnimating = false;
        isOpen = false;
        floatFrame = 0;

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
        camera = new THREE.PerspectiveCamera(40, aspect, 0.1, 1000);
        camera.position.set(0, 8, 40);
        camera.lookAt(0, -2, 0);

        renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: "high-performance" });
        renderer.setSize(width, height);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.3;
        container.appendChild(renderer.domElement);

        // Lighting 
        const ambientLight = new THREE.AmbientLight(0xffffff, 1.5);
        scene.add(ambientLight);

        const frontLight = new THREE.DirectionalLight(0xfffaed, 1.8);
        frontLight.position.set(5, 10, 20);
        frontLight.castShadow = true;
        scene.add(frontLight);

        const fillLight = new THREE.PointLight(0xffd700, 0.8, 50);
        fillLight.position.set(-15, 5, 10);
        scene.add(fillLight);

        const rimLight = new THREE.SpotLight(0x4a90e2, 2);
        rimLight.position.set(0, 15, -20);
        rimLight.lookAt(0, 0, 0);
        scene.add(rimLight);

        buildChest();
        buildKey(); // Prepare the key (hidden initially)

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
    ctx.fillStyle = '#21130d';
    ctx.fillRect(0, 0, 512, 512);

    for (let i = 0; i < 150; i++) {
        const x = Math.random() * 512;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.bezierCurveTo(x + (Math.random() - 0.5) * 100, 200, x + (Math.random() - 0.5) * 100, 400, x, 512);
        ctx.strokeStyle = Math.random() > 0.5 ? '#1a0f0a' : '#2e1c12';
        ctx.lineWidth = Math.random() * 4 + 1;
        ctx.stroke();
    }

    const imageData = ctx.getImageData(0, 0, 512, 512);
    const data = imageData.data;
    for (let i = 0; i < data.length; i += 4) {
        if (Math.random() > 0.95) {
            const val = data[i] + (Math.random() - 0.5) * 40;
            data[i] = data[i + 1] = data[i + 2] = val;
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

    // Materials
    const woodMap = getWoodTexture();
    const agedWoodMat = new THREE.MeshStandardMaterial({
        map: woodMap, color: 0x5d4037, roughness: 0.8, metalness: 0.1
    });
    const wornMetalMat = new THREE.MeshStandardMaterial({
        color: 0x6d5635, roughness: 0.4, metalness: 0.6
    });
    const ironMat = new THREE.MeshStandardMaterial({
        color: 0x222222, roughness: 0.7, metalness: 0.5
    });
    const innerMat = new THREE.MeshStandardMaterial({
        color: 0x1a0f0a, roughness: 1.0, side: THREE.BackSide
    });

    // Geometry
    const W = 11; const H = 6; const D = 7; const thickness = 0.8;
    chestBase = new THREE.Group();
    chestGroup.add(chestBase);

    // Box
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
    left.position.x = -W / 2 + thickness / 2; left.receiveShadow = true;
    chestBase.add(left);
    const right = new THREE.Mesh(new THREE.BoxGeometry(thickness, H, D - thickness * 2), agedWoodMat);
    right.position.x = W / 2 - thickness / 2; right.receiveShadow = true;
    chestBase.add(right);

    // Bands & Details
    const bandGeo = new THREE.BoxGeometry(1.2, H, 1.2 * 1.5);
    const corners = [{ x: -W / 2, z: D / 2 }, { x: W / 2, z: D / 2 }, { x: -W / 2, z: -D / 2 }, { x: W / 2, z: -D / 2 }];
    corners.forEach(pos => {
        const post = new THREE.Mesh(bandGeo, ironMat);
        post.position.set(pos.x, 0, pos.z);
        chestBase.add(post);
        const r1 = new THREE.Mesh(new THREE.SphereGeometry(0.25, 8, 8), wornMetalMat);
        r1.position.set(pos.x, H / 3, pos.z + (pos.z > 0 ? 0.6 : -0.6));
        chestBase.add(r1);
        const r2 = new THREE.Mesh(new THREE.SphereGeometry(0.25, 8, 8), wornMetalMat);
        r2.position.set(pos.x + (pos.x > 0 ? 0.6 : -0.6), H / 3, pos.z);
        chestBase.add(r2);
    });

    // Lid
    lidGroup = new THREE.Group();
    lidGroup.position.set(0, H / 2, -D / 2);
    chestGroup.add(lidGroup);

    const lidRadius = D / 2;
    const lidArchGeo = new THREE.CylinderGeometry(lidRadius, lidRadius, W, 32, 1, false, 0, Math.PI);
    lidArchGeo.rotateZ(Math.PI / 2);
    const lidMesh = new THREE.Mesh(lidArchGeo, agedWoodMat);
    lidMesh.position.z = D / 2;
    lidGroup.add(lidMesh);

    const lidSideGeo = new THREE.CircleGeometry(lidRadius, 32, 0, Math.PI);
    const lSide = new THREE.Mesh(lidSideGeo, agedWoodMat);
    lSide.rotation.y = -Math.PI / 2; lSide.position.set(-W / 2, 0, D / 2);
    lidGroup.add(lSide);
    const rSide = new THREE.Mesh(lidSideGeo, agedWoodMat);
    rSide.rotation.y = Math.PI / 2; rSide.position.set(W / 2, 0, D / 2);
    lidGroup.add(rSide);

    const innerLidGeo = new THREE.CylinderGeometry(lidRadius - 0.1, lidRadius - 0.1, W - 0.1, 32, 1, true, 0, Math.PI);
    innerLidGeo.rotateZ(Math.PI / 2);
    const innerLid = new THREE.Mesh(innerLidGeo, innerMat);
    innerLid.position.z = D / 2;
    lidGroup.add(innerLid);

    // Lid Bands
    const archBandGeo = new THREE.CylinderGeometry(lidRadius + 0.1, lidRadius + 0.1, 1.2, 32, 1, false, 0, Math.PI);
    archBandGeo.rotateZ(Math.PI / 2);
    const bandPos = [-W / 2 + 0.6, 0, W / 2 - 0.6];
    bandPos.forEach(x => {
        const b = new THREE.Mesh(archBandGeo, ironMat);
        b.position.set(x, 0, D / 2);
        lidGroup.add(b);
    });

    // --- LOCK MECHANISM ---
    const lockWidth = 2.0; const lockHeight = 2.2; const lockDepth = 0.8;
    const lockBody = new THREE.Mesh(new THREE.BoxGeometry(lockWidth, lockHeight, lockDepth), ironMat);
    lockBody.position.set(0, 0, D / 2 + lockDepth / 2);
    chestBase.add(lockBody);

    const lockPlateDeco = new THREE.Mesh(new THREE.BoxGeometry(lockWidth + 0.2, lockHeight + 0.2, 0.2), wornMetalMat);
    lockPlateDeco.position.set(0, 0, -0.4);
    lockBody.add(lockPlateDeco);

    const keyHoleRound = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.25, 0.5, 16), new THREE.MeshBasicMaterial({ color: 0x000000 }));
    keyHoleRound.rotateX(Math.PI / 2); keyHoleRound.position.set(0, 0.2, lockDepth / 2 + 0.01);
    lockBody.add(keyHoleRound);
    const keyHoleSlit = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.6, 0.5), new THREE.MeshBasicMaterial({ color: 0x000000 }));
    keyHoleSlit.position.set(0, 0, lockDepth / 2 + 0.01);
    lockBody.add(keyHoleSlit);

    const hasp = new THREE.Mesh(new THREE.BoxGeometry(1.0, 2.5, 0.3), ironMat);
    hasp.position.set(0, -1.0, D + 0.4); hasp.rotation.x = Math.PI / 12;
    lidGroup.add(hasp);

    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.6, 0.15, 8, 16), wornMetalMat);
    ring.position.set(0, -1.8, D + 0.6); ring.rotation.y = Math.PI / 2;
    lidGroup.add(ring);

    const handleGeo = new THREE.TorusGeometry(1.2, 0.25, 8, 16);
    const hL = new THREE.Mesh(handleGeo, ironMat);
    hL.position.set(-W / 2 - 0.3, 0, 0); hL.rotation.y = Math.PI / 2;
    chestBase.add(hL);
    const hR = new THREE.Mesh(handleGeo, ironMat);
    hR.position.set(W / 2 + 0.3, 0, 0); hR.rotation.y = Math.PI / 2;
    chestBase.add(hR);

    chestGroup.rotation.y = -0.5;
    chestGroup.rotation.x = 0.1;
}

function buildKey() {
    keyGroup = new THREE.Group();
    // Start Key Hidden and far away
    keyGroup.visible = false;
    scene.add(keyGroup);

    const keyMat = new THREE.MeshStandardMaterial({
        color: 0xfffaed, // Antique Bone/Bright Brass
        roughness: 0.3,
        metalness: 0.8
    });

    // Shaft
    const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 4, 8), keyMat);
    shaft.rotation.x = Math.PI / 2; // Point z-axis
    keyGroup.add(shaft);

    // Bow (Ring handle)
    const bow = new THREE.Mesh(new THREE.TorusGeometry(0.6, 0.15, 8, 16), keyMat);
    bow.position.set(0, 0, 2);
    keyGroup.add(bow);

    // Bit (Teeth)
    const bit = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.8, 0.15), keyMat);
    bit.position.set(0, 0.5, -1.8);
    keyGroup.add(bit);
}

// --- NEW ANIMATION SEQUENCE ---

function start3DSpin(callback) {
    // Alias to keep main.js compatible, but now triggers Key Sequence
    startKeySequence(callback);
}

function startKeySequence(callback) {
    if (isAnimating || isOpen) return;
    isAnimating = true;

    // Reset Key Position
    keyGroup.visible = true;
    keyGroup.position.set(0, 0.3, 10); // Start far front
    keyGroup.rotation.z = 0;

    // Animate Key Insertion
    const duration = 2500;
    const startTime = Date.now();

    function keyLoop() {
        const now = Date.now();
        const t = (now - startTime) / duration;

        if (t < 0.4) {
            // Phase 1: Approach (0 - 0.4)
            const p = t / 0.4;
            const ease = p * (2 - p); // Quad out
            // Move from Z=10 to Z=4.2 (Just in front of lock)
            keyGroup.position.z = 10 - (5.8 * ease);
        } else if (t < 0.6) {
            // Phase 2: Insert (0.4 - 0.6)
            const p = (t - 0.4) / 0.2;
            // Move from Z=4.2 to Z=3.5 (Inside lock)
            keyGroup.position.z = 4.2 - (0.7 * p);
        } else if (t < 0.9) {
            // Phase 3: Turn (0.6 - 0.9)
            const p = (t - 0.6) / 0.3;
            const ease = p < 0.5 ? 2 * p * p : -1 + (4 - 2 * p) * p; // Ease in out
            keyGroup.rotation.z = -Math.PI / 2 * ease;
        } else {
            // Phase 4: Wait/Finish
        }

        if (t < 1) {
            animationId = requestAnimationFrame(keyLoop);
        } else {
            // Unlock!
            keyGroup.visible = false; // Hide key
            open3DChest(callback);
        }
    }
    keyLoop();
}

function open3DChest(callback) {
    isOpen = true;
    const duration = 1000;
    const startTime = Date.now();

    function openLoop() {
        const now = Date.now();
        const progress = Math.min((now - startTime) / duration, 1);
        const ease = 1 - Math.pow(1 - progress, 3); // Cubic out

        lidGroup.rotation.x = -2.2 * ease;

        if (progress < 1) {
            requestAnimationFrame(openLoop);
        } else {
            isAnimating = false;
            if (callback) callback();
        }
    }
    openLoop();
}

function animate() {
    requestAnimationFrame(animate);
    if (scene && camera && renderer) {
        if (!isAnimating && !isOpen) {
            floatFrame += 0.015;
            chestGroup.position.y = Math.sin(floatFrame) * 0.3;
            // Key floats with chest if visible? No, handled by sequence
        }
        renderer.render(scene, camera);
    }
}

window.init3DChest = init3DChest;
window.start3DSpin = start3DSpin; // Maintained for main.js compatibility
