// Heart 3D Logic using Three.js
let scene, camera, renderer, heartGroup, leftHalf, rightHalf;
let isAnimating = false;
let isBroken = false;
let floatFrame = 0;
let animationId;
let flyingTickets = [];

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

        container.innerHTML = '';

        scene = new THREE.Scene();

        let width = container.clientWidth || 300;
        let height = container.clientHeight || 450;

        const aspect = width / height;
        camera = new THREE.PerspectiveCamera(45, aspect, 0.1, 1000);
        camera.position.set(0, 0, 15);

        renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
        renderer.setSize(width, height);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        container.appendChild(renderer.domElement);

        // Lighting
        const ambientLight = new THREE.AmbientLight(0xffffff, 1.5);
        scene.add(ambientLight);

        const pointLight = new THREE.PointLight(0xffffff, 2);
        pointLight.position.set(5, 5, 10);
        scene.add(pointLight);

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
        depth: 0.8,
        bevelEnabled: true,
        bevelSegments: 10,
        steps: 2,
        bevelSize: 0.3,
        bevelThickness: 0.3
    };

    const heartMat = new THREE.MeshStandardMaterial({
        color: 0xff4d6d, // Vibrant Pastel Red/Pink
        roughness: 0.3,
        metalness: 0.6,
        emissive: 0xff0044,
        emissiveIntensity: 0.2
    });

    // Left Half
    const leftShape = new THREE.Shape();
    leftShape.moveTo(0, 1.2);
    leftShape.bezierCurveTo(0, 1.2, -0.2, 2.5, -1.5, 2.5);
    leftShape.bezierCurveTo(-3, 2.5, -3, 1, -3, 1);
    leftShape.bezierCurveTo(-3, -0.5, -1.5, -2, 0, -3.5);
    leftShape.lineTo(0, 1.2);

    const leftGeo = new THREE.ExtrudeGeometry(leftShape, extrudeSettings);
    leftHalf = new THREE.Mesh(leftGeo, heartMat);
    heartGroup.add(leftHalf);

    // Right Half
    const rightShape = new THREE.Shape();
    rightShape.moveTo(0, 1.2);
    rightShape.bezierCurveTo(0, 1.2, 0.2, 2.5, 1.5, 2.5);
    rightShape.bezierCurveTo(3, 2.5, 3, 1, 3, 1);
    rightShape.bezierCurveTo(3, -0.5, 1.5, -2, 0, -3.5);
    rightShape.lineTo(0, 1.2);

    const rightGeo = new THREE.ExtrudeGeometry(rightShape, extrudeSettings);
    rightHalf = new THREE.Mesh(rightGeo, heartMat);
    heartGroup.add(rightHalf);

    heartGroup.scale.set(1.5, 1.5, 1.5);
    heartGroup.rotation.y = -0.2;
}

function startHeartBreak(callback) {
    if (isAnimating || isBroken) return;
    isAnimating = true;

    // Shake first
    const startTime = Date.now();
    const shakeDuration = 600;

    function shake() {
        const elapsed = Date.now() - startTime;
        const progress = elapsed / shakeDuration;

        if (progress < 1) {
            heartGroup.position.x = (Math.random() - 0.5) * 0.5;
            heartGroup.position.y = (Math.random() - 0.5) * 0.5;
            requestAnimationFrame(shake);
        } else {
            heartGroup.position.set(0, 0, 0);
            breakHeart(callback);
        }
    }
    shake();
}

function breakHeart(callback) {
    isBroken = true;
    const duration = 1500;
    const startTime = Date.now();

    function breakLoop() {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const ease = 1 - Math.pow(1 - progress, 3);

        // Move halves apart and rotate
        leftHalf.position.x = -8 * ease;
        leftHalf.position.y = 2 * ease;
        leftHalf.rotation.z = -1.2 * ease;
        leftHalf.rotation.y = -0.8 * ease;

        rightHalf.position.x = 8 * ease;
        rightHalf.position.y = 2 * ease;
        rightHalf.rotation.z = 1.2 * ease;
        rightHalf.rotation.y = 0.8 * ease;

        // Increase emission for a "glow" effect as it breaks
        const glow = 0.2 + (progress * 2);
        leftHalf.material.emissiveIntensity = glow;
        rightHalf.material.emissiveIntensity = glow;

        // Fade out heart
        leftHalf.material.opacity = Math.max(0, 1 - progress * 1.5);
        rightHalf.material.opacity = Math.max(0, 1 - progress * 1.5);
        leftHalf.material.transparent = true;
        rightHalf.material.transparent = true;

        if (progress < 0.2 && !this.exploded) {
            createTicketExplosion(100);
            this.exploded = true;
        }

        if (progress < 1) {
            requestAnimationFrame(breakLoop);
        } else {
            if (callback) callback();
        }
    }
    breakLoop.bind({ exploded: false })();
}

function createTicketExplosion(count) {
    const ticketGeo = new THREE.PlaneGeometry(0.6, 0.3);
    const ticketMat = new THREE.MeshStandardMaterial({
        color: 0xffd700,
        metalness: 0.7,
        roughness: 0.2,
        side: THREE.DoubleSide
    });

    for (let i = 0; i < count; i++) {
        const ticket = new THREE.Mesh(ticketGeo, ticketMat);
        ticket.position.set(0, 0, 0);
        scene.add(ticket);

        flyingTickets.push({
            mesh: ticket,
            velocity: new THREE.Vector3(
                (Math.random() - 0.5) * 0.8,
                (Math.random()) * 0.6,
                (Math.random() - 0.5) * 0.8
            ),
            rotationSpeed: new THREE.Vector3(
                Math.random() * 0.2,
                Math.random() * 0.2,
                Math.random() * 0.2
            ),
            gravity: -0.01
        });
    }
}

function animate() {
    animationId = requestAnimationFrame(animate);

    if (!isAnimating && !isBroken) {
        floatFrame += 0.02;
        heartGroup.position.y = Math.sin(floatFrame) * 0.5;
        heartGroup.rotation.y += 0.01;
    }

    flyingTickets.forEach((t, index) => {
        t.mesh.position.add(t.velocity);
        t.mesh.rotation.x += t.rotationSpeed.x;
        t.mesh.rotation.y += t.rotationSpeed.y;
        t.mesh.rotation.z += t.rotationSpeed.z;
        t.velocity.y += t.gravity;

        if (t.mesh.position.y < -20) {
            scene.remove(t.mesh);
            flyingTickets.splice(index, 1);
        }
    });

    renderer.render(scene, camera);
}

function updateChestInstruction(text) {
    let instruction = document.getElementById('chest-tap-instruction');
    if (instruction) instruction.innerText = text;
}

// Map to window for global access (keeping same names as chest for easier integration)
window.init3DHeart = init3DHeart;
window.startHeartBreak = startHeartBreak;
window.updateChestInstruction = updateChestInstruction;

// Compatibility aliases if needed
window.init3DChest = init3DHeart;
window.start3DSpin = startHeartBreak;
