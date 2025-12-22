// Chest 3D Logic using Three.js

let scene, camera, renderer, chestGroup, lidGroup, chestBase, ticketPile;
let isSpinning = false;
let isOpen = false;
let floatFrame = 0;
let animationId;
let particles = [];
let flyingTickets = [];

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
        isSpinning = false;
        isOpen = false;
        floatFrame = 0;
        particles = [];
        flyingTickets = [];

        container.innerHTML = '';

        scene = new THREE.Scene();

        let width = container.clientWidth;
        let height = container.clientHeight;
        if (width === 0 || height === 0) {
            width = 300; height = 400;
            container.style.width = '100%'; container.style.height = '400px';
        }

        const aspect = width / height;
        camera = new THREE.PerspectiveCamera(40, aspect, 0.1, 1000);
        camera.position.set(0, 10, 38); // Further back and higher for headroom
        camera.lookAt(0, -3.5, 0); // Aim lower to see more top space

        renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: "high-performance" });
        renderer.setSize(width, height);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 3.0; // MAXIMUM BRIGHTNESS (was 2.5)
        container.appendChild(renderer.domElement);

        // Lighting
        const ambientLight = new THREE.AmbientLight(0xffffff, 3.0); // Maximum brightness
        ambientLight.name = "ambient";
        scene.add(ambientLight);

        const frontLight = new THREE.DirectionalLight(0xfffaed, 2.5); // Boosted
        frontLight.position.set(5, 10, 20);
        frontLight.castShadow = true;
        scene.add(frontLight);

        // EXTRA FRONT LIGHTS for maximum pop
        const leftFill = new THREE.PointLight(0xffffff, 2.0, 60);
        leftFill.position.set(20, 10, 20);
        scene.add(leftFill);

        const rightFill = new THREE.PointLight(0xffffff, 2.0, 60);
        rightFill.position.set(-20, 10, 20);
        scene.add(rightFill);

        const topHighlight = new THREE.PointLight(0xffffff, 2.0, 50);
        topHighlight.position.set(0, 30, 10);
        scene.add(topHighlight);

        const fillLight = new THREE.PointLight(0xffd700, 2.0, 50); // Boosted
        fillLight.position.set(-15, 5, 10);
        scene.add(fillLight);

        const rimLight = new THREE.SpotLight(0x4a90e2, 3.0);
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
        color: 0x5d4037, // Original dark wood
        roughness: 0.8,
        metalness: 0.1,
        side: THREE.DoubleSide
    });

    // Worn Gold/Bronze (Pop look)
    const wornMetalMat = new THREE.MeshStandardMaterial({
        color: 0xffd700, // Gold
        roughness: 0.2,
        metalness: 0.9,
    });

    // Metallic trim
    const ironMat = new THREE.MeshStandardMaterial({
        color: 0xdaa520, // Goldenrod / Bronze
        roughness: 0.3,
        metalness: 0.8,
        emissive: 0xdaa520,
        emissiveIntensity: 0.05
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

    // Detailed Inner Lid
    const innerLidGeo = new THREE.CylinderGeometry(lidRadius - 0.05, lidRadius - 0.05, W - 0.1, 32, 1, true, 0, Math.PI);
    innerLidGeo.rotateZ(Math.PI / 2);
    const innerLid = new THREE.Mesh(innerLidGeo, agedWoodMat);
    innerLid.position.z = D / 2;
    lidGroup.add(innerLid);

    // Inner Bands (Detailed structure)
    const innerBandGeo = new THREE.CylinderGeometry(lidRadius - 0.1, lidRadius - 0.1, 1.2, 32, 1, true, 0, Math.PI);
    innerBandGeo.rotateZ(Math.PI / 2);
    const innerBand = new THREE.Mesh(innerBandGeo, ironMat);
    innerBand.position.z = D / 2;
    lidGroup.add(innerBand);

    // Vertical internal band
    const innerBandV = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.1, D - 0.2), ironMat);
    innerBandV.position.set(0, lidRadius - 0.1, D / 2);
    lidGroup.add(innerBandV);

    // --- LID DETAILS (Iron/Gold Bands) ---
    // Increase offset to 0.2 to avoid Z-fighting/Texture flickering
    const archBandGeo = new THREE.CylinderGeometry(lidRadius + 0.2, lidRadius + 0.2, 1.2, 32, 1, false, 0, Math.PI);
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
    lockBody.position.set(0, 0, D / 2 + 0.4);
    chestBase.add(lockBody);

    // 2. The Keyhole (Functional looking black void)
    // Cylinder for the round part
    const keyHoleRoundGeo = new THREE.CylinderGeometry(0.25, 0.25, 0.5, 16);
    keyHoleRoundGeo.rotateX(Math.PI / 2);
    const keyHoleRound = new THREE.Mesh(keyHoleRoundGeo, new THREE.MeshBasicMaterial({ color: 0x000000 }));
    keyHoleRound.position.set(0, 0.2, 0.41);
    lockBody.add(keyHoleRound);

    // Box for the slit part
    const keyHoleSlitGeo = new THREE.BoxGeometry(0.15, 0.6, 0.5);
    const keyHoleSlit = new THREE.Mesh(keyHoleSlitGeo, new THREE.MeshBasicMaterial({ color: 0x000000 }));
    keyHoleSlit.position.set(0, 0, 0.41);
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

    buildTicketPile();

    chestGroup.scale.set(0.9, 0.9, 0.9); // Smaller than v16's 1.0x
    chestGroup.position.y = -3; // Lowered from -2 to give more ceiling space
    chestGroup.rotation.x = 0.1;
}

function buildTicketPile() {
    // 1. Base mass (Bottom filling - raised)
    const baseGeo = new THREE.BoxGeometry(9, 3.5, 5); // Thicker mass
    const goldMat = new THREE.MeshStandardMaterial({
        color: 0xffd700,
        metalness: 0.9,
        roughness: 0.1,
        emissive: 0xffaa00,
        emissiveIntensity: 0.4 // Extra shimmer for tickets
    });
    const baseMass = new THREE.Mesh(baseGeo, goldMat);
    baseMass.position.y = -0.5;
    chestBase.add(baseMass);

    // Interior focus light
    const interiorLight = new THREE.PointLight(0xffd700, 3, 10); // Brighter interior
    interiorLight.position.set(0, 1.5, 0);
    chestBase.add(interiorLight);

    // 2. Individual tickets (Messy top layer - more count)
    const ticketGeo = new THREE.PlaneGeometry(0.8, 0.4);
    for (let i = 0; i < 40; i++) {
        const t = new THREE.Mesh(ticketGeo, goldMat);
        t.position.set(
            (Math.random() - 0.5) * 8.5,
            1.2 + (Math.random() * 0.5), // High enough to be seen
            (Math.random() - 0.5) * 4.5
        );
        t.rotation.set(
            Math.PI / 2 + (Math.random() - 0.5) * 0.5,
            (Math.random() * Math.PI),
            (Math.random() - 0.5) * 0.5
        );
        chestBase.add(t);
    }
}

function start3DSpin(callback) {
    if (isSpinning || isOpen) return;
    open3DChest(callback);
}

function open3DChest(callback) {
    isOpen = true;
    const duration = 1800; // Slower open for drama
    const startTime = Date.now();

    // Wave triggers
    const waves = [0.1, 0.25, 0.45, 0.65, 0.85];
    let waveIdx = 0;

    function openLoop() {
        const now = Date.now();
        const progress = Math.min((now - startTime) / duration, 1);
        const ease = 1 - Math.pow(1 - progress, 3);
        lidGroup.rotation.x = -2.2 * ease;

        // Continuous waves
        if (waveIdx < waves.length && progress > waves[waveIdx]) {
            createTicketExplosion(35); // Multiple waves
            waveIdx++;
        }

        if (progress < 1) {
            requestAnimationFrame(openLoop);
        } else {
            if (callback) callback();
        }
    }
    openLoop();
}

function createTicketExplosion(count = 150) {
    const ticketGeo = new THREE.PlaneGeometry(0.8, 0.4);
    const ticketMat = new THREE.MeshStandardMaterial({
        color: 0xffd700,
        metalness: 0.6,
        roughness: 0.3,
        side: THREE.DoubleSide
    });

    for (let i = 0; i < count; i++) {
        const ticket = new THREE.Mesh(ticketGeo, ticketMat);
        ticket.position.set(0, 0, 0);
        scene.add(ticket);

        flyingTickets.push({
            mesh: ticket,
            velocity: new THREE.Vector3(
                (Math.random() - 0.5) * 1.0,
                Math.random() * 0.5 + 0.3,
                (Math.random() - 0.5) * 0.7 + 0.3
            ),
            rotationSpeed: new THREE.Vector3(
                Math.random() * 0.2 - 0.1,
                Math.random() * 0.2 - 0.1,
                Math.random() * 0.2 - 0.1
            ),
            gravity: -0.008 - (Math.random() * 0.003) // Slower fall
        });
    }
}

function create3DParticles() {
    const geo = new THREE.BufferGeometry();
    const count = 100;
    const posArray = new Float32Array(count * 3);
    for (let i = 0; i < count * 3; i++) {
        posArray[i] = (Math.random() - 0.5) * 25;
    }
    geo.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
    const mat = new THREE.PointsMaterial({ size: 0.8, color: 0xffffff, transparent: true, opacity: 0.8 });
    const pts = new THREE.Points(geo, mat);
    scene.add(pts);
    particles.push({ mesh: pts });
}

function animate() {
    requestAnimationFrame(animate);
    if (scene && camera && renderer) {
        if (!isSpinning && !isOpen) {
            floatFrame += 0.015;
            chestGroup.position.y = Math.sin(floatFrame) * 0.3;
        }

        // Particle logic (keep system for potential future use or clean if needed)
        particles.forEach(p => {
            p.mesh.rotation.y += 0.005;
            p.mesh.position.y += 0.1;
        });

        // Flying Tickets Logic
        flyingTickets.forEach(t => {
            t.mesh.position.add(t.velocity);
            t.mesh.rotation.x += t.rotationSpeed.x;
            t.mesh.rotation.y += t.rotationSpeed.y;
            t.mesh.rotation.z += t.rotationSpeed.z;
            t.velocity.y += t.gravity; // Gravity pull
        });

        renderer.render(scene, camera);
    }
}

function shakeChest(intensity = 0.5) {
    const startTime = Date.now();
    const duration = 500; // Slightly longer for more noticeability
    const actualIntensity = intensity * 2.5; // MORE THAN DOUBLE (was 1.0, now much stronger)
    const startPos = { x: chestGroup.position.x, z: chestGroup.position.z };

    function shakeLoop() {
        const now = Date.now();
        const progress = (now - startTime) / duration;

        if (progress < 1) {
            const currentIntensity = actualIntensity * (1 - Math.pow(progress, 2)); // Smoother decay
            chestGroup.position.x = startPos.x + (Math.random() - 0.5) * currentIntensity;
            chestGroup.position.y = (Math.random() - 0.5) * (currentIntensity * 0.3); // Slight vertical jitter
            chestGroup.position.z = startPos.z + (Math.random() - 0.5) * currentIntensity;
            requestAnimationFrame(shakeLoop);
        } else {
            chestGroup.position.x = startPos.x;
            chestGroup.position.y = 0;
            chestGroup.position.z = startPos.z;
        }
    }
    shakeLoop();
}

function updateChestInstruction(text) {
    const container = document.getElementById('chest-container');
    if (!container) return;

    let instruction = document.getElementById('chest-tap-instruction');
    if (!instruction) {
        instruction = document.createElement('p');
        instruction.id = 'chest-tap-instruction';
        container.appendChild(instruction);
    }
    instruction.innerText = text;
}

window.init3DChest = init3DChest;
window.start3DSpin = start3DSpin;
window.shakeChest = shakeChest;
window.updateChestInstruction = updateChestInstruction;
