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
        const aspect = width / height;
        camera = new THREE.PerspectiveCamera(45, aspect, 0.1, 1000);
        camera.position.set(0, 10, 30);
        camera.lookAt(0, 0, 0);

        // 2. Renderer
        renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
        renderer.setSize(width, height);
        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.shadowMap.enabled = true;
        container.appendChild(renderer.domElement);

        // 3. Lighting
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        scene.add(ambientLight);

        const dirLight = new THREE.DirectionalLight(0xffd700, 1.5);
        dirLight.position.set(10, 20, 10);
        dirLight.castShadow = true;
        scene.add(dirLight);

        const pointLight = new THREE.PointLight(0xffaa00, 1, 50);
        pointLight.position.set(-5, 5, 5);
        scene.add(pointLight);

        // 4. Build Chest
        buildChest();

        // 5. Interaction
        // We handle click in main.js via DOM event on the container, which calls start3DSpin()

        // 6. Animation Loop
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

function buildChest() {
    chestGroup = new THREE.Group();
    scene.add(chestGroup);

    // Materials
    const woodMaterial = new THREE.MeshStandardMaterial({
        color: 0x5d4037,
        roughness: 0.7,
        metalness: 0.1
    });

    const goldMaterial = new THREE.MeshStandardMaterial({
        color: 0xffd700,
        roughness: 0.3,
        metalness: 0.8,
        emissive: 0x443300
    });

    const innerWoodMaterial = new THREE.MeshStandardMaterial({
        color: 0x3e2723,
        roughness: 0.9
    });

    // --- BASE ---
    // Dimensions: Width 8, Height 5, Depth 5
    const baseWidth = 8;
    const baseHeight = 5;
    const baseDepth = 5;
    const thickness = 0.5;

    chestBase = new THREE.Group();
    chestGroup.add(chestBase);

    // Floor
    const floorGeo = new THREE.BoxGeometry(baseWidth, thickness, baseDepth);
    const floor = new THREE.Mesh(floorGeo, innerWoodMaterial);
    floor.position.y = -baseHeight / 2 + thickness / 2;
    floor.castShadow = true;
    floor.receiveShadow = true;
    chestBase.add(floor);

    // Front Wall
    const frontGeo = new THREE.BoxGeometry(baseWidth, baseHeight, thickness);
    const front = new THREE.Mesh(frontGeo, woodMaterial);
    front.position.z = baseDepth / 2 - thickness / 2;
    front.castShadow = true;
    chestBase.add(front);

    // Back Wall
    const backGeo = frontGeo.clone();
    const back = new THREE.Mesh(backGeo, woodMaterial);
    back.position.z = -baseDepth / 2 + thickness / 2;
    back.castShadow = true;
    chestBase.add(back);

    // Left Wall
    const sideGeo = new THREE.BoxGeometry(thickness, baseHeight, baseDepth - thickness * 2);
    const left = new THREE.Mesh(sideGeo, woodMaterial);
    left.position.x = -baseWidth / 2 + thickness / 2;
    left.castShadow = true;
    chestBase.add(left);

    // Right Wall
    const right = new THREE.Mesh(sideGeo.clone(), woodMaterial);
    right.position.x = baseWidth / 2 - thickness / 2;
    right.castShadow = true;
    chestBase.add(right);


    // Gold Corners (Vertical)
    const cornerGeo = new THREE.BoxGeometry(1, baseHeight, 1);
    const positions = [
        { x: -baseWidth / 2, z: baseDepth / 2 }, { x: baseWidth / 2, z: baseDepth / 2 },
        { x: -baseWidth / 2, z: -baseDepth / 2 }, { x: baseWidth / 2, z: -baseDepth / 2 }
    ];

    positions.forEach(pos => {
        const corner = new THREE.Mesh(cornerGeo, goldMaterial);
        corner.position.set(pos.x, 0, pos.z);
        corner.scale.set(0.5, 1, 0.5);
        chestBase.add(corner);
    });

    // --- LID ---
    // Curved Top using Tube or Cylinder segment
    lidGroup = new THREE.Group();
    // Pivot should be at the top-back edge of the base
    lidGroup.position.set(0, baseHeight / 2, -baseDepth / 2);
    chestGroup.add(lidGroup);

    // Lid shape: Cylinder segment
    // Radius should cover half baseDepth (2.5) + some height
    const radius = baseDepth / 2;
    const segments = 32;

    // We need a hollow half-cylinder. 
    // Trick: shape with extrusion or carefully placed boxes, but for simplicity:
    // A thick half-cylinder mesh.

    const lidGeo = new THREE.CylinderGeometry(radius, radius, baseWidth, segments, 1, true, 0, Math.PI);
    // Rotate to align with chest
    lidGeo.rotateZ(Math.PI / 2); // Lay flat

    // The cylinder center is 0,0,0. We need it to be the "arch".
    // 0 to PI covers top half.

    // Create the visible Wood Arch
    const lidMesh = new THREE.Mesh(lidGeo, woodMaterial);
    // Adjust position relative to pivot
    // Cylinder by default is centered. We need the flat bottom of the semi-circle to be at local Y=0
    lidMesh.position.z = baseDepth / 2; // Shift forward to cover base
    lidMesh.position.y = 0; // Hinge level
    // Wait, cylinder orientation is tricky.
    // Let's retry: Cylinder along X axis.
    // Theta 0 to PI creates top half? No, depends on rotation.

    // Easier approach: Multiple wooden slats for the lid (like the CSS version)
    // Or just a primitive shape for now.

    const slatWidth = baseWidth;
    const slatDepth = 0.5; // thickness
    const slatCount = 10;
    const angleStep = Math.PI / slatCount;

    const lidArchGroup = new THREE.Group();
    lidArchGroup.position.z = baseDepth / 2; // Center arch over chest center relative to hinge

    // Create Arch slats
    for (let i = 0; i < slatCount; i++) {
        const angle = i * angleStep;
        const slatGeo = new THREE.BoxGeometry(slatWidth, 0.2, (Math.PI * radius) / slatCount + 0.1);
        const slat = new THREE.Mesh(slatGeo, woodMaterial);

        // Position on circle arc
        // Unrotated arch goes from 0 to PI in YZ plane?
        const y = Math.sin(angle) * radius;
        const z = Math.cos(angle) * radius;

        slat.position.set(0, y, z);
        slat.lookAt(0, 0, 0); // Point inward
        // slat.rotation.x -= Math.PI/2; 

        // Correct math: 
        // We want arch starting from z=radius (front) to z=-radius (back).
        // Angle 0 at top?

    }

    // Let's use a simple Box Lid for now, flattened top, or just a single Cylinder sector for reliability
    const lidShapeGeo = new THREE.CylinderGeometry(radius, radius, baseWidth, 32, 1, false, 0, Math.PI);
    lidShapeGeo.rotateZ(Math.PI / 2);
    const lidObj = new THREE.Mesh(lidShapeGeo, woodMaterial);
    lidObj.position.z = baseDepth / 2;

    // Inner side (darker)
    const lidInnerGeo = new THREE.CylinderGeometry(radius - 0.2, radius - 0.2, baseWidth - 0.1, 32, 1, false, 0, Math.PI);
    lidInnerGeo.rotateZ(Math.PI / 2);
    // Invert normal? Or just render both sides material
    const innerMat = innerWoodMaterial.clone();
    innerMat.side = THREE.BackSide;
    const lidInner = new THREE.Mesh(lidInnerGeo, innerMat);
    lidInner.position.z = baseDepth / 2;

    lidGroup.add(lidObj);
    lidGroup.add(lidInner);

    // Gold Bands on Lid
    const bandGeo = new THREE.CylinderGeometry(radius + 0.1, radius + 0.1, 1, 32, 1, false, 0, Math.PI);
    bandGeo.rotateZ(Math.PI / 2);

    const bandLeft = new THREE.Mesh(bandGeo, goldMaterial);
    bandLeft.position.set(-baseWidth / 2 + 1, 0, baseDepth / 2);
    lidGroup.add(bandLeft);

    const bandRight = new THREE.Mesh(bandGeo, goldMaterial);
    bandRight.position.set(baseWidth / 2 - 1, 0, baseDepth / 2);
    lidGroup.add(bandRight);

    // Latch
    const latchGeo = new THREE.BoxGeometry(1.5, 2, 0.5);
    const latch = new THREE.Mesh(latchGeo, goldMaterial);
    latch.position.set(0, 0, radius + baseDepth / 2); // Front of lid
    latch.rotation.x = -Math.PI / 4; // Approx angle
    lidGroup.add(latch);

    // Initial Rotation
    chestGroup.rotation.y = -0.5;
    chestGroup.rotation.x = 0.2;
}


// --- Logic Exposed to Main ---

function start3DSpin(callback) {
    if (isSpinning || isOpen) return;

    isSpinning = true;
    const duration = 1800; // ms
    const startTime = Date.now();
    const startRot = chestGroup.rotation.y;
    const totalSpin = Math.PI * 6; // 3 spins

    // Create sparkles
    create3DParticles();

    function spinLoop() {
        const now = Date.now();
        const progress = Math.min((now - startTime) / duration, 1);

        // Easing? Linear is better for spin
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
        // Ease Out Back
        const ease = 1 + 2.70158 * Math.pow(progress - 1, 3) + 1.70158 * Math.pow(progress - 1, 2);

        // Open Lid: Rotate X from 0 to -2 rad
        lidGroup.rotation.x = -2.5 * ease;

        if (progress < 1) {
            requestAnimationFrame(openLoop);
        } else {
            // Animation Done
            if (callback) callback();
        }
    }
    openLoop();
}

function create3DParticles() {
    // Add simple particles near chest
    const geo = new THREE.BufferGeometry();
    const count = 50;
    const posArray = new Float32Array(count * 3);

    for (let i = 0; i < count * 3; i++) {
        posArray[i] = (Math.random() - 0.5) * 15;
    }
    geo.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
    const mat = new THREE.PointsMaterial({ size: 0.5, color: 0xffd700 });
    const pts = new THREE.Points(geo, mat);
    scene.add(pts);
    particles.push({ mesh: pts, startTime: Date.now() });
}


// --- Main Loop ---
function animate() {
    requestAnimationFrame(animate);

    if (scene && camera && renderer) {
        // Idle Float
        if (!isSpinning && !isOpen) {
            floatFrame += 0.02;
            chestGroup.position.y = Math.sin(floatFrame) * 0.5;
        }

        // Update Particles
        particles.forEach((p, index) => {
            p.mesh.rotation.y += 0.01;
            // Fading logic could go here
        });

        renderer.render(scene, camera);
    }
}

// Global expose
window.init3DChest = init3DChest;
window.start3DSpin = start3DSpin;
