// --- IMPORTAR THREE.JS ---
import * as THREE from 'three';

// --- CONFIGURACIÓN BÁSICA DE LA ESCENA ---
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb); // Color cielo

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 4, 10); // Posición de la cámara (x, y, z)
camera.lookAt(0, 0, 0);

const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// --- LUCES ---
const ambientLight = new THREE.AmbientLight(0xffffff, 0.6); // Luz ambiental suave
scene.add(ambientLight);
const directionalLight = new THREE.DirectionalLight(0xffffff, 1); // Luz tipo sol
directionalLight.position.set(5, 10, 7.5);
scene.add(directionalLight);

// --- JUGADOR ---
const playerGeometry = new THREE.BoxGeometry(1, 1, 1); // Un cubo como jugador
const playerMaterial = new THREE.MeshStandardMaterial({ color: 0x0000ff }); // Material azul
const player = new THREE.Mesh(playerGeometry, playerMaterial);
player.position.y = 0.5; // Levantar el cubo para que esté sobre el suelo
scene.add(player);

// --- SUELO ---
const groundGeometry = new THREE.PlaneGeometry(30, 200); // Un plano largo
const groundMaterial = new THREE.MeshStandardMaterial({ color: 0x00ff00 });
const ground = new THREE.Mesh(groundGeometry, groundMaterial);
ground.rotation.x = -Math.PI / 2; // Rotar el plano para que sea el suelo
ground.position.y = 0;
scene.add(ground);

// --- OBJETOS A RECOLECTAR ---
const collectibles = [];
const collectibleGeometry = new THREE.SphereGeometry(0.5, 16, 16);
const collectibleMaterial = new THREE.MeshStandardMaterial({ color: 0xff0000 });

function addCollectible() {
    const item = new THREE.Mesh(collectibleGeometry, collectibleMaterial);
    
    // Posición aleatoria en el carril izquierdo, centro o derecho
    const lane = (Math.floor(Math.random() * 3) - 1) * 4; // -4, 0, o 4
    item.position.set(lane, 0.5, -50); // Aparece lejos y viene hacia acá
    
    collectibles.push(item);
    scene.add(item);
}

// --- MOVIMIENTO ---
let playerSpeed = 0;
const laneWidth = 4; // Ancho del carril
let targetLane = 0; // Carril objetivo (-1, 0, 1)

document.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowLeft' && targetLane > -1) {
        targetLane--;
    }
    if (event.key === 'ArrowRight' && targetLane < 1) {
        targetLane++;
    }
});

// --- PUNTUACIÓN ---
let score = 0;
const scoreElement = document.getElementById('score');

// --- BUCLE DEL JUEGO (ANIMATION LOOP) ---
const gameSpeed = 0.5;

function animate() {
    requestAnimationFrame(animate);

    // Mover el suelo para simular que se corre
    ground.position.z += gameSpeed;
    if(ground.position.z > 50) {
        ground.position.z = 0;
    }

    // Mover al jugador suavemente hacia el carril objetivo
    const targetX = targetLane * laneWidth;
    // LÍNEA CORREGIDA: Se quitó el ".player" extra
    player.position.x += (targetX - player.position.x) * 0.1;

    // Mover y verificar colisiones de los objetos
    for (let i = collectibles.length - 1; i >= 0; i--) {
        const item = collectibles[i];
        item.position.z += gameSpeed;

        // Si el objeto pasa al jugador
        if (item.position.z > camera.position.z) {
            scene.remove(item);
            collectibles.splice(i, 1);
        }

        // Detección de colisión (simple, basada en distancia)
        if (item.position.distanceTo(player.position) < 1) {
            score++;
            scoreElement.innerText = `Puntuación: ${score}`;
            scene.remove(item);
            collectibles.splice(i, 1);
        }
    }
    
    // Renderizar la escena desde la perspectiva de la cámara
    renderer.render(scene, camera);
}


// --- INICIAR EL JUEGO ---
setInterval(addCollectible, 1500); // Añadir un nuevo objeto cada 1.5 segundos
animate(); // Iniciar el bucle de animación

// Ajustar la ventana si cambia de tamaño
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});