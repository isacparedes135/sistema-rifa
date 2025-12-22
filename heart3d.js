// Heart 3D Logic using Three.js - Premium Version
let scene, camera, renderer, heartGroup, leftHalf, rightHalf, crackLine;
let isAnimating = false;
let isBroken = false;
let floatFrame = 0;
let animationId;
let flyingTickets = [];
let fragments = []; // Small pieces that break off

function init3DHeart() {
    const container = document.getElementById('chest-container');
    if (!container) return;

    if (typeof THREE === 'undefined') {
        console.error('Three.js not loaded');
        return;
    }

    try {
        if (animationId) cancelAnimationFrame(animationId);

        // Reset State
        isAnimating = false;
        isBroken = false;
        floatFrame = 0;
        flyingTickets = [];
        fragments = [];

        container.innerHTML = '';

        scene = new THREE.Scene();

        let width = container.clientWidth || 300;
        let height = container.clientHeight || 450;

        const aspect = width / height;
        camera = new THREE.PerspectiveCamera(40, aspect, 0.1, 1000);
        camera.position.set(0, 0, 18);

        renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
        renderer.setSize(width, height);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        // High quality settings
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.2;
        container.appendChild(renderer.domElement);

        // Lighting System
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
        scene.add(ambientLight);

        const mainLight = new THREE.DirectionalLight(0xffffff, 3);
        mainLight.position.set(5, 10, 7.5);
        scene.add(mainLight);

        const rimLight = new THREE.PointLight(0xffb6c1, 10, 50);
        rimLight.position.set(-10, 5, -5);
        scene.add(rimLight);

        const frontFill = new THREE.PointLight(0xffffff, 5, 30);
        frontFill.position.set(0, 0, 10);
        scene.add(frontFill);

        buildHeart();
        animate();

        window.addEventListener('resize', () => {
            const w = container.clientWidth;
            const h = container.clientHeight;
            camera.aspect = w / h;
            camera.updateProjectionMatrix();
            renderer.setSize(w, h);
        });

    } catch (e) {
        console.error("Error initializing 3D Heart:", e);
    }
}

function buildHeart() {
    heartGroup = new THREE.Group();
    scene.add(heartGroup);

    const extrudeSettings = {
        depth: 1.5, // Deeper for more relief
        bevelEnabled: true,
        bevelSegments: 20,
        steps: 2,
        bevelSize: 0.6, // Larger bevel for smoother rounds
        bevelThickness: 0.6 // Thicker relief
    };

    // Premium Material: Glass/Gem Look
    const heartMat = new THREE.MeshPhysicalMaterial({
        color: 0xff0044,
        metalness: 0.1,
        roughness: 0.1,
        transmission: 0.5, // See-through jewel effect
        thickness: 2.0,
        ior: 1.5,
        clearcoat: 1.0,
        clearcoatRoughness: 0.05,
        emissive: 0xff0044,
        emissiveIntensity: 0.1
    });


    // --- Left Half (Jagged Edge) ---
    const leftShape = new THREE.Shape();
    leftShape.moveTo(0, 1.4);
    leftShape.lineTo(-0.2, 0.8);
    leftShape.lineTo(0.3, 0.2);
    leftShape.lineTo(-0.1, -0.5);
    leftShape.lineTo(0.2, -1.2);
    leftShape.lineTo(-0.3, -2.0);
    leftShape.lineTo(0, -3.5);

    leftShape.bezierCurveTo(-1.5, -2, -3, -0.5, -3, 1);
    leftShape.bezierCurveTo(-3, 1, -3, 2.5, -1.5, 2.5);
    leftShape.bezierCurveTo(-0.2, 2.5, 0, 1.4, 0, 1.4);

    const leftGeo = new THREE.ExtrudeGeometry(leftShape, extrudeSettings);
    leftHalf = new THREE.Mesh(leftGeo, heartMat);
    heartGroup.add(leftHalf);


    // --- Right Half (Jagged Edge) ---
    const rightShape = new THREE.Shape();
    rightShape.moveTo(0, 1.4);
    rightShape.lineTo(-0.2, 0.8);
    rightShape.lineTo(0.3, 0.2);
    rightShape.lineTo(-0.1, -0.5);
    rightShape.lineTo(0.2, -1.2);
    rightShape.lineTo(-0.3, -2.0);
    rightShape.lineTo(0, -3.5);

    rightShape.bezierCurveTo(1.5, -2, 3, -0.5, 3, 1);
    rightShape.bezierCurveTo(3, 1, 3, 2.5, 1.5, 2.5);
    rightShape.bezierCurveTo(0.2, 2.5, 0, 1.4, 0, 1.4);

    const rightGeo = new THREE.ExtrudeGeometry(rightShape, extrudeSettings);
    rightHalf = new THREE.Mesh(rightGeo, heartMat);
    heartGroup.add(rightHalf);


    // --- Rupture Line (The Crack) ---
    // A jagged glowing line in the center
    const crackPoints = [
        new THREE.Vector3(0, 1.4, 1.5),
        new THREE.Vector3(-0.2, 0.8, 1.5),
        new THREE.Vector3(0.3, 0.2, 1.5),
        new THREE.Vector3(-0.1, -0.5, 1.5),
        new THREE.Vector3(0.2, -1.2, 1.5),
        new THREE.Vector3(-0.3, -2.0, 1.5),
        new THREE.Vector3(0, -3.4, 1.5)
    ];
    const crackGeo = new THREE.BufferGeometry().setFromPoints(crackPoints);
    const crackMat = new THREE.LineBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0
    });
    crackLine = new THREE.Line(crackGeo, crackMat);
    heartGroup.add(crackLine);

    // Create a thicker "inner" jagged crack for physical feel
    const thickCrackGeo = new THREE.BufferGeometry().setFromPoints(crackPoints);
    const thickCrackMat = new THREE.LineBasicMaterial({ color: 0x000000, transparent: true, opacity: 0 });
    const innerCrack = new THREE.Line(thickCrackGeo, thickCrackMat);
    innerCrack.scale.set(1, 1, 0.9);
    heartGroup.add(innerCrack);

    // Add a glowing core to the crack
    const crackGlow = new THREE.PointLight(0xffffff, 0, 10);
    crackGlow.position.set(0, 0, 1.5);
    crackLine.add(crackGlow);

    heartGroup.scale.set(1.3, 1.3, 1.3);
    heartGroup.rotation.y = -0.2;
}

function startHeartBreak(callback) {
    if (isAnimating || isBroken) return;
    isAnimating = true;

    // Phase 1: Heavy Jitter + Crack Appearance
    const startTime = Date.now();
    const phase1Duration = 1000;

    function phase1() {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / phase1Duration, 1);
        const ease = 1 - Math.pow(1 - progress, 2);

        // Shake Intensity increases
        const shake = progress * 1.2;
        heartGroup.position.x = (Math.random() - 0.5) * shake;
        heartGroup.position.y = (Math.random() - 0.5) * shake;

        // Rotate towards the front
        heartGroup.rotation.y = -0.2 + (0.5 * ease);

        // Progressive splitting (The "Egg" effect)
        // Widening the gap slightly before the final break
        leftHalf.position.x = -progress * 0.4;
        rightHalf.position.x = progress * 0.4;

        // Form the crack
        crackLine.material.opacity = progress;
        crackLine.children[0].intensity = progress * 60;

        // Spawn occasional small fragments during the shake
        if (Math.random() < 0.2 && progress > 0.3) {
            createFragment(0.1 + (progress * 0.2));
        }

        if (progress < 1) {
            requestAnimationFrame(phase1);
        } else {
            // Phase 2: The actual break
            breakHeart(callback);
        }
    }
    phase1();
}

function breakHeart(callback) {
    isBroken = true;
    const duration = 1800;
    const startTime = Date.now();

    // Hide crack light, it's about to explode
    crackLine.children[0].intensity = 50;

    function breakLoop() {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const ease = 1 - Math.pow(1 - progress, 4);

        // Final explosion of fragments
        if (progress < 0.1 && !this.fragmentsCreated) {
            for (let i = 0; i < 30; i++) createFragment(0.5);
            this.fragmentsCreated = true;
        }

        // Explode halves - Limited distance so it doesn't go off screen
        leftHalf.position.x = -6 * ease;
        leftHalf.position.y = 1 * ease;
        leftHalf.rotation.z = -0.8 * ease;
        leftHalf.rotation.y = -0.5 * ease;

        rightHalf.position.x = 6 * ease;
        rightHalf.position.y = 1 * ease;
        rightHalf.rotation.z = 0.8 * ease;
        rightHalf.rotation.y = 0.5 * ease;

        crackLine.visible = false;

        // Glow peak
        const glow = 0.2 + (Math.sin(progress * Math.PI) * 5);
        leftHalf.material.emissiveIntensity = glow;
        rightHalf.material.emissiveIntensity = glow;

        // Fade out
        const op = Math.max(0, 1 - progress * 1.5);
        leftHalf.material.opacity = op;
        rightHalf.material.opacity = op;
        leftHalf.material.transparent = true;
        rightHalf.material.transparent = true;

        if (progress > 0.05 && !this.exploded) {
            createTicketExplosion(150);
            this.exploded = true;
        }

        if (progress < 1) {
            requestAnimationFrame(breakLoop);
        } else {
            if (callback) callback();
        }
    }
    breakLoop.bind({ exploded: false, fragmentsCreated: false })();
}

function createFragment(scale = 1) {
    const geo = new THREE.TetrahedronGeometry(0.2 * scale);
    const mat = new THREE.MeshStandardMaterial({
        color: 0xff4d6d,
        roughness: 0.2,
        metalness: 0.1,
        transparent: true
    });
    const frag = new THREE.Mesh(geo, mat);

    // Position along the crack
    frag.position.set(
        (Math.random() - 0.5) * 0.5,
        (Math.random() * 5) - 2.5,
        (Math.random() - 0.5) * 0.5 + 1.2
    );

    scene.add(frag);

    fragments.push({
        mesh: frag,
        velocity: new THREE.Vector3(
            (Math.random() - 0.5) * 0.5,
            (Math.random() - 0.5) * 0.5,
            (Math.random() * 0.5)
        ),
        rot: new THREE.Vector3(Math.random() * 0.1, Math.random() * 0.1, Math.random() * 0.1),
        gravity: -0.005,
        life: 1.0
    });
}

function createTicketExplosion(count) {
    // Ticket Mass
    const ticketGeo = new THREE.PlaneGeometry(0.7, 0.35);
    const ticketMat = new THREE.MeshStandardMaterial({
        color: 0xffd700,
        metalness: 0.9,
        roughness: 0.1,
        side: THREE.DoubleSide,
        emissive: 0xffd700,
        emissiveIntensity: 0.5
    });

    for (let i = 0; i < count; i++) {
        const ticket = new THREE.Mesh(ticketGeo, ticketMat);
        ticket.position.set(0, 0, 0);
        scene.add(ticket);

        flyingTickets.push({
            mesh: ticket,
            velocity: new THREE.Vector3(
                (Math.random() - 0.5) * 1.2,
                (Math.random()) * 0.8 + 0.2,
                (Math.random() - 0.5) * 1.2
            ),
            rotationSpeed: new THREE.Vector3(
                Math.random() * 0.3,
                Math.random() * 0.3,
                Math.random() * 0.3
            ),
            gravity: -0.008
        });
    }
}

function animate() {
    animationId = requestAnimationFrame(animate);

    if (!isAnimating && !isBroken) {
        floatFrame += 0.025;
        heartGroup.position.y = Math.sin(floatFrame) * 0.6;
        heartGroup.rotation.y += 0.015;
    }

    flyingTickets.forEach((t, index) => {
        t.mesh.position.add(t.velocity);
        t.mesh.rotation.x += t.rotationSpeed.x;
        t.mesh.rotation.y += t.rotationSpeed.y;
        t.mesh.rotation.z += t.rotationSpeed.z;
        t.velocity.y += t.gravity;

        if (t.mesh.position.y < -30) {
            scene.remove(t.mesh);
            flyingTickets.splice(index, 1);
        }
    });

    fragments.forEach((f, index) => {
        f.mesh.position.add(f.velocity);
        f.mesh.rotation.x += f.rot.x;
        f.mesh.rotation.y += f.rot.y;
        f.velocity.y += f.gravity;
        f.life -= 0.015;
        f.mesh.material.opacity = f.life;

        if (f.life <= 0) {
            scene.remove(f.mesh);
            fragments.splice(index, 1);
        }
    });

    renderer.render(scene, camera);
}

function updateChestInstruction(text) {
    let instruction = document.getElementById('chest-tap-instruction');
    if (instruction) instruction.innerText = text;
}

window.init3DHeart = init3DHeart;
window.startHeartBreak = startHeartBreak;
window.updateChestInstruction = updateChestInstruction;
window.init3DChest = init3DHeart;
window.start3DSpin = startHeartBreak;
