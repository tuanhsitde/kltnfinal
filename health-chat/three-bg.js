const canvas = document.querySelector('#bg-canvas');
const scene = new THREE.Scene();
// Không set màu nền cứng, để CSS background gradient xuyên qua
scene.fog = new THREE.FogExp2(0xfce4ec, 0.003);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ canvas: canvas, alpha: true, antialias: true });

renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
camera.position.z = 30;

// Tạo các hạt (particles) màu Xanh dương và Hồng
const geometry = new THREE.BufferGeometry();
const particlesCount = 1000;
const posArray = new Float32Array(particlesCount * 3);
const colorArray = new Float32Array(particlesCount * 3);

const color1 = new THREE.Color(0x4fc3f7); // blue
const color2 = new THREE.Color(0xf48fb1); // pink

for(let i = 0; i < particlesCount * 3; i+=3) {
    posArray[i] = (Math.random() - 0.5) * 100;
    posArray[i+1] = (Math.random() - 0.5) * 100;
    posArray[i+2] = (Math.random() - 0.5) * 100;
    
    // Mix màu xanh và hồng
    const mixedColor = color1.clone().lerp(color2, Math.random());
    colorArray[i] = mixedColor.r;
    colorArray[i+1] = mixedColor.g;
    colorArray[i+2] = mixedColor.b;
}

geometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
geometry.setAttribute('color', new THREE.BufferAttribute(colorArray, 3));

const material = new THREE.PointsMaterial({
    size: 0.4,
    vertexColors: true,
    transparent: true,
    opacity: 0.8
});

const particlesMesh = new THREE.Points(geometry, material);
scene.add(particlesMesh);

// Thêm một số khối cầu đại diện cho tế bào / phân tử nổi lơ lửng
const spheres = [];
const sphereGeo = new THREE.SphereGeometry(1, 16, 16);
const sphereMat1 = new THREE.MeshBasicMaterial({ color: 0x4fc3f7, wireframe: true, transparent: true, opacity: 0.2 });
const sphereMat2 = new THREE.MeshBasicMaterial({ color: 0xf48fb1, wireframe: true, transparent: true, opacity: 0.2 });

for(let i=0; i<15; i++) {
    const mesh = new THREE.Mesh(sphereGeo, i % 2 === 0 ? sphereMat1 : sphereMat2);
    mesh.position.set(
        (Math.random() - 0.5) * 60,
        (Math.random() - 0.5) * 60,
        (Math.random() - 0.5) * 30
    );
    mesh.scale.setScalar(Math.random() * 1.5 + 0.5);
    scene.add(mesh);
    spheres.push({
        mesh: mesh,
        speedX: (Math.random() - 0.5) * 0.02,
        speedY: (Math.random() - 0.5) * 0.02,
        rotSpeed: (Math.random() - 0.5) * 0.02
    });
}

window.addEventListener('resize', () => {
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
});

let mouseX = 0;
let mouseY = 0;
window.addEventListener('mousemove', (e) => {
    mouseX = (e.clientX / window.innerWidth) * 2 - 1;
    mouseY = -(e.clientY / window.innerHeight) * 2 + 1;
});

const clock = new THREE.Clock();

function animate() {
    requestAnimationFrame(animate);
    const elapsedTime = clock.getElapsedTime();

    // Xoay đám mây hạt
    particlesMesh.rotation.y = elapsedTime * 0.05;
    particlesMesh.rotation.x = elapsedTime * 0.02;
    
    // Di chuyển và xoay các khối cầu
    spheres.forEach((obj) => {
        obj.mesh.rotation.x += obj.rotSpeed;
        obj.mesh.rotation.y += obj.rotSpeed;
        obj.mesh.position.y += Math.sin(elapsedTime + obj.mesh.position.x) * 0.01;
    });

    // Camera di chuyển nhẹ theo hướng chuột
    camera.position.x += (mouseX * 5 - camera.position.x) * 0.05;
    camera.position.y += (mouseY * 5 - camera.position.y) * 0.05;
    camera.lookAt(scene.position);

    renderer.render(scene, camera);
}

animate();
