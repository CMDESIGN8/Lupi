// --- CONFIGURACIÓN INICIAL ---
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Ajustar el tamaño del canvas
canvas.width = 800;
canvas.height = 500;

let score = 0;
let gameOver = false;

// --- JUGADOR ---
const player = {
    x: canvas.width / 2 - 25,
    y: canvas.height - 60,
    width: 50,
    height: 50,
    speed: 15, // Velocidad de movimiento
    dx: 0 // Dirección de movimiento inicial
};

function drawPlayer() {
    ctx.fillStyle = 'blue';
    ctx.fillRect(player.x, player.y, player.width, player.height);
}

function movePlayer() {
    player.x += player.dx;

    // Mantener al jugador dentro de los límites del canvas
    if (player.x < 0) {
        player.x = 0;
    }
    if (player.x + player.width > canvas.width) {
        player.x = canvas.width - player.width;
    }
}

// --- OBJETOS A RECOLECTAR ---
const collectibles = [];
const collectibleSize = 30;

function addCollectible() {
    const x = Math.random() * (canvas.width - collectibleSize);
    const y = -collectibleSize; // Aparece justo arriba del canvas
    collectibles.push({ x, y, width: collectibleSize, height: collectibleSize, speed: 2 + Math.random() * 3 });
}

function updateCollectibles() {
    for (let i = collectibles.length - 1; i >= 0; i--) {
        const item = collectibles[i];
        item.y += item.speed;

        // Eliminar si sale de la pantalla
        if (item.y > canvas.height) {
            collectibles.splice(i, 1);
        }
    }
}

function drawCollectibles() {
    ctx.fillStyle = 'red';
    for (const item of collectibles) {
        ctx.fillRect(item.x, item.y, item.width, item.height);
    }
}

// --- COLISIONES Y PUNTUACIÓN ---
function checkCollisions() {
    for (let i = collectibles.length - 1; i >= 0; i--) {
        const item = collectibles[i];
        // Comprobar si el jugador y el objeto se superponen
        if (
            player.x < item.x + item.width &&
            player.x + player.width > item.x &&
            player.y < item.y + item.height &&
            player.y + player.height > item.y
        ) {
            score++; // Aumentar puntuación
            collectibles.splice(i, 1); // Eliminar objeto
        }
    }
}

function drawScore() {
    ctx.fillStyle = 'black';
    ctx.font = '24px Arial';
    ctx.fillText(`Puntuación: ${score}`, 10, 30);
}


// --- BUCLE PRINCIPAL DEL JUEGO ---
function gameLoop() {
    if (gameOver) {
        // Podrías agregar una pantalla de "Game Over" aquí
        return;
    }

    // 1. Actualizar estado del juego
    movePlayer();
    updateCollectibles();
    checkCollisions();

    // 2. Limpiar el canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 3. Dibujar todo
    drawPlayer();
    drawCollectibles();
    drawScore();

    // 4. Repetir
    requestAnimationFrame(gameLoop);
}

// --- MANEJO DE TECLADO ---
function keyDown(e) {
    if (e.key === 'ArrowRight' || e.key === 'd') {
        player.dx = player.speed;
    } else if (e.key === 'ArrowLeft' || e.key === 'a') {
        player.dx = -player.speed;
    }
}

function keyUp(e) {
    if (
        e.key === 'ArrowRight' ||
        e.key === 'd' ||
        e.key === 'ArrowLeft' ||
        e.key === 'a'
    ) {
        player.dx = 0;
    }
}

document.addEventListener('keydown', keyDown);
document.addEventListener('keyup', keyUp);

// --- INICIAR JUEGO ---
// Añadir un nuevo objeto coleccionable cada segundo
setInterval(addCollectible, 1000);

// Iniciar el bucle del juego
gameLoop();