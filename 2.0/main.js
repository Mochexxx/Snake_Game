// Variáveis globais
let scene, camera, renderer;
let snake = [], snakeHead, snakeDirection;
let apple = null;
let isPaused = true;
let gameRunning = false;
let lastMoveTime = 0, moveInterval = 200;
let score = 0;
let highscore = localStorage.getItem('highscore') ? parseInt(localStorage.getItem('highscore')) : 0;

// Função para esconder a tela de início e iniciar o jogo
document.getElementById('playButton').addEventListener('click', function () {
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

    initScene();
    createSnake();
    createApple();
    setupControls();
    animate();
}

// Inicializar a cena
function initScene() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x202020);

    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    scene.add(new THREE.AmbientLight(0xffffff, 0.5));
    const dirLight = new THREE.DirectionalLight(0xffffff, 1);
    dirLight.position.set(10, 20, 10);
    scene.add(dirLight);

    const floor = new THREE.Mesh(
        new THREE.PlaneGeometry(21, 21, 20, 20),
        new THREE.MeshStandardMaterial({ color: 0x333333 })
    );
    floor.rotation.x = -Math.PI / 2;
    scene.add(floor);

    camera.position.set(12, 12.5, 12);
    camera.lookAt(3, 0, 3);
}

// Criar cobra
function createSnake() {
    const cubeSize = 1;
    const fullMaterial = new THREE.MeshStandardMaterial({ color: 0x00ff00 });
    const headMaterial = new THREE.MeshStandardMaterial({ color: 0xff0000 });

    // Cabeça trapezoidal invertida
    const shape = new THREE.Shape();
    shape.moveTo(-0.5, -0.5);  // base maior (frente)
    shape.lineTo(0.5, -0.5);
    shape.lineTo(0.25, 0.5);     // base menor (parte conectada ao corpo)
    shape.lineTo(-0.25, 0.5);
    shape.lineTo(-0.5, -0.5);

    const extrudeSettings = {
        depth: 1,
        bevelEnabled: false
    };

    const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    geometry.rotateX(Math.PI / 2); // Deita no plano horizontal
    geometry.center();

    const head = new THREE.Mesh(geometry, headMaterial);
    head.position.set(0, 0.5, 0);
    scene.add(head);
    snake.push(head);

    for (let i = 1; i < 5; i++) {
        const segment = new THREE.Mesh(
            new THREE.BoxGeometry(cubeSize, cubeSize, cubeSize),
            fullMaterial
        );
        segment.position.set(-i, 0.5, 0);
        scene.add(segment);
        snake.push(segment);
    }

    snakeDirection = new THREE.Vector3(1, 0, 0);
    snakeHead = snake[0];
}

// Criar maçã
function createApple() {
    const appleGeometry = new THREE.SphereGeometry(0.5, 16, 16);
    const appleMaterial = new THREE.MeshStandardMaterial({ color: 0xff0000 });
    apple = new THREE.Mesh(appleGeometry, appleMaterial);

    let x, z;
    do {
        x = Math.floor(Math.random() * 21) - 10;
        z = Math.floor(Math.random() * 21) - 10;
    } while (isAppleOnSnake(x, z));

    apple.position.set(x, 0.5, z);
    scene.add(apple);
}

// Verificar se a maçã está na cobra
function isAppleOnSnake(x, z) {
    return snake.some(segment => segment.position.x === x && segment.position.z === z);
}

// Mover cobra com teletransporte
function moveSnake() {
    const limit = 10;
    let newHeadPosition = snakeHead.position.clone().add(snakeDirection);

    // Teletransporte
    if (newHeadPosition.x > limit) newHeadPosition.x = -limit;
    else if (newHeadPosition.x < -limit) newHeadPosition.x = limit;
    if (newHeadPosition.z > limit) newHeadPosition.z = -limit;
    else if (newHeadPosition.z < -limit) newHeadPosition.z = limit;

    for (let i = 1; i < snake.length; i++) {
        if (snake[i].position.distanceTo(newHeadPosition) < 0.1) {
            endGame();
            return;
        }
    }

    if (snakeHead.position.distanceTo(apple.position) < 1) {
        score += 10;
        document.getElementById('score').textContent = 'Score: ' + score;

        const tail = snake[snake.length - 1];
        const newSegment = new THREE.Mesh(tail.geometry, tail.material);
        newSegment.position.copy(tail.position);
        snake.push(newSegment);
        scene.add(newSegment);
        scene.remove(apple);
        createApple();
    }

    for (let i = snake.length - 1; i > 0; i--) {
        snake[i].position.copy(snake[i - 1].position);
    }

    snakeHead.position.copy(newHeadPosition);

    // Atualizar rotação da cabeça para seguir o movimento
    const angle = Math.atan2(snakeDirection.x, snakeDirection.z);
    snakeHead.rotation.y = angle;
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
        moveSnake();
        lastMoveTime = time;
    }

    renderer.render(scene, camera);
}
