// main.js
import * as Scene from './scene.js';
import { createSnake, moveSnake, isAppleOnSnake } from './Snake.js';
import { createApple } from './apple.js';

// Variáveis globais
let scene, camera, renderer;
let snake = [], snakeHead, snakeDirection;
let apple = null;
let isPaused = true;
let gameRunning = false;
let lastMoveTime = 0, moveInterval = 200;
let score = 0;
let highscore = localStorage.getItem('highscore') ? parseInt(localStorage.getItem('highscore')) : 0;
let gameMode = 'classic'; // classic, barriers, obstacles

// Mode selection logic
const playButton = document.getElementById('playButton');
const modeClassic = document.getElementById('modeClassic');
const modeBarriers = document.getElementById('modeBarriers');
const modeObstacles = document.getElementById('modeObstacles');

function selectMode(mode) {
    gameMode = mode;
    playButton.style.display = '';
    // Highlight selected mode
    [modeClassic, modeBarriers, modeObstacles].forEach(btn => btn.style.background = '');
    if (mode === 'classic') modeClassic.style.background = '#444';
    if (mode === 'barriers') modeBarriers.style.background = '#444';
    if (mode === 'obstacles') modeObstacles.style.background = '#444';
}

modeClassic.addEventListener('click', () => selectMode('classic'));
modeBarriers.addEventListener('click', () => selectMode('barriers'));
modeObstacles.addEventListener('click', () => selectMode('obstacles'));

window.onload = function() {
    document.getElementById('mainMenu').style.display = 'flex';
    document.getElementById('startScreen').style.display = 'none';
};

document.getElementById('startMenuButton').addEventListener('click', function () {
    document.getElementById('mainMenu').style.display = 'none';
    document.getElementById('startScreen').style.display = 'flex';
});

// Função para esconder a tela de início e iniciar o jogo
playButton.addEventListener('click', function () {
    document.getElementById('startScreen').style.display = 'none';
    isPaused = false;
    gameRunning = true;
    startGame();
});

// Função para configurar os controles da cobra
function setupControls() {
    window.addEventListener('keydown', (event) => {
        const dir = snakeDirection;
        if (event.key === 'ArrowRight') {
            if (dir.x !== 0) snakeDirection.set(0, 0, dir.x);
            else if (dir.z !== 0) snakeDirection.set(-dir.z, 0, 0);
        } else if (event.key === 'ArrowLeft') {
            if (dir.x !== 0) snakeDirection.set(0, 0, -dir.x);
            else if (dir.z !== 0) snakeDirection.set(dir.z, 0, 0);
        }
    });
}

// Função para iniciar o jogo
function startGame() {
    score = 0;
    snake = [];
    document.getElementById('score').textContent = 'Score: 0';
    document.getElementById('highscore').textContent = 'Highscore: ' + highscore;
    if (renderer) {
        document.body.removeChild(renderer.domElement);
    }

    scene = Scene.createScene();
    camera = Scene.createCamera();
    renderer = Scene.createRenderer();
    Scene.addLights(scene);
    Scene.addFloor(scene);

    const snakeObj = createSnake(scene);
    snake = snakeObj.snake;
    snakeHead = snakeObj.snakeHead;
    snakeDirection = snakeObj.snakeDirection;

    apple = createApple(scene, snake, isAppleOnSnake);
    setupControls();
    animate();
}

// Fim de jogo
function endGame() {
    if (score > highscore) {
        highscore = score;
        localStorage.setItem('highscore', highscore);
    }

    document.getElementById('finalScore').textContent = 'Score: ' + score;
    document.getElementById('highscoreEnd').textContent = 'Highscore: ' + highscore;
    document.getElementById('endScreen').style.display = 'flex';
    document.getElementById('scoreBoard').style.display = 'none';

    isPaused = true;
    gameRunning = false;
}

// Botão de reinício
document.getElementById('playAgainButton').addEventListener('click', function () {
    document.getElementById('endScreen').style.display = 'none';
    document.getElementById('scoreBoard').style.display = 'block';
    isPaused = false;
    gameRunning = true;
    startGame();
});

// Animação
function animate(time) {
    requestAnimationFrame(animate);
    if (isPaused || !gameRunning) return;
    if (time - lastMoveTime > moveInterval) {
        moveSnake(
            snake,
            snakeHead,
            snakeDirection,
            apple,
            gameMode,
            endGame,
            () => {
                // addSegment
                const tail = snake[snake.length - 1];
                const newSegment = new THREE.Mesh(tail.geometry, tail.material);
                newSegment.position.copy(tail.position);
                snake.push(newSegment);
                scene.add(newSegment);
                scene.remove(apple);
                apple = createApple(scene, snake, isAppleOnSnake);
            },
            () => {
                // updateScore
                score += 10;
                document.getElementById('score').textContent = 'Score: ' + score;
            }
        );
        lastMoveTime = time;
    }
    renderer.render(scene, camera);
}
