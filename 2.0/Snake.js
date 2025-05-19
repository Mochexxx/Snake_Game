import { getBoardCellCenter, generateBoardHitboxes } from './scene.js';

// Snake.js
// Responsável por criar e controlar a cobra

export function createSnake(scene) {
    const snake = [];
    const cubeSize = 2;
    const fullMaterial = new THREE.MeshStandardMaterial({ color: 0x00ff00 });
    const headMaterial = new THREE.MeshStandardMaterial({ color: 0xff0000 });
    const hitboxes = generateBoardHitboxes();

    // Começa no centro do tabuleiro (matriz 9,9) para 20x20
    const startX = 9;
    const startZ = 9;
    // Guarda as coordenadas do tabuleiro para cada segmento
    const snakeBoard = [];

    // Cabeça trapezoidal invertida
    const shape = new THREE.Shape();
    shape.moveTo(-1, -1);
    shape.lineTo(1, -1);
    shape.lineTo(0.5, 1);
    shape.lineTo(-0.5, 1);
    shape.lineTo(-1, -1);

    const extrudeSettings = { depth: 2, bevelEnabled: false };
    const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    geometry.rotateX(Math.PI / 2);
    geometry.center();

    const head = new THREE.Mesh(geometry, headMaterial);
    const { centerX: cx, centerZ: cz } = hitboxes[startX][startZ];
    head.position.set(cx, 1, cz);
    scene.add(head);
    snake.push(head);
    snakeBoard.push({ x: startX, z: startZ });

    // Corpo inicial para a esquerda
    for (let i = 1; i < 5; i++) {
        const segment = new THREE.Mesh(
            new THREE.BoxGeometry(cubeSize, cubeSize, cubeSize),
            fullMaterial
        );
        const { centerX: bx, centerZ: bz } = hitboxes[startX - i][startZ];
        segment.position.set(bx, 1, bz);
        scene.add(segment);
        snake.push(segment);
        snakeBoard.push({ x: startX - i, z: startZ });
    }

    // Direção inicial: direita (x: 1, z: 0)
    return { snake, snakeHead: head, snakeDirection: { x: 1, z: 0 }, snakeBoard, hitboxes };
}

export function moveSnake(snake, snakeHead, snakeDirection, apple, gameMode, endGame, addSegment, updateScore, snakeBoard, hitboxes, obstacles = []) {
    // Limites do tabuleiro 20x20
    const min = 0;
    const max = 19;
    // Pega a posição da cabeça na matriz
    let headX = snakeBoard[0].x;
    let headZ = snakeBoard[0].z;
    let newX = headX + snakeDirection.x;
    let newZ = headZ + snakeDirection.z;

    if (gameMode === 'classic') {
        if (newX < min) newX = max;
        else if (newX > max) newX = min;
        if (newZ < min) newZ = max;
        else if (newZ > max) newZ = min;
    } else if (gameMode === 'barriers' || gameMode === 'obstacles') {
        if (newX < min || newX > max || newZ < min || newZ > max) {
            endGame();
            return false;
        }
    }

    // Colisão com o corpo
    for (let i = 1; i < snakeBoard.length; i++) {
        if (snakeBoard[i].x === newX && snakeBoard[i].z === newZ) {
            endGame();
            return false;
        }
    }

    // Colisão com obstáculos (modo obstacles)
    if (gameMode === 'obstacles') {
        // Verifica se há colisão com obstáculos usando a posição na matriz do tabuleiro
        for (let i = 0; i < obstacles.length; i++) {
            if (obstacles[i].boardPosition.x === newX && obstacles[i].boardPosition.z === newZ) {
                endGame();
                return false;
            }
        }
    }

    // Colisão com maçã - usando as hitboxes para maior precisão
    // Calcula a posição da maçã na matriz do tabuleiro
    const appleX = Math.round((apple.position.x - 1) / 2);
    const appleZ = Math.round((apple.position.z - 1) / 2);
    let grow = false;
    
    // Verifica colisão baseada nas coordenadas da matriz
    if (newX === appleX && newZ === appleZ) {
        addSegment();
        updateScore();
        grow = true;
    }

    // Move a matriz do corpo
    snakeBoard.unshift({ x: newX, z: newZ });
    if (!grow) snakeBoard.pop();

    // Atualiza posições 3D usando hitboxes
    for (let i = 0; i < snake.length; i++) {
        const { centerX, centerZ } = hitboxes[snakeBoard[i].x][snakeBoard[i].z];
        snake[i].position.set(centerX, 1, centerZ);
    }    // Atualiza rotação visual da cabeça
    // Usando Math.atan2 para obter o ângulo correto baseado na direção atual
    const angle = Math.atan2(snakeDirection.x, snakeDirection.z);
    // Aplica a rotação suavemente para uma transição visual melhor
    snakeHead.rotation.y = angle;
    return true;
}

export function isAppleOnSnake(snake, x, z, snakeBoard) {
    return snakeBoard.some(seg => seg.x === x && seg.z === z);
}
