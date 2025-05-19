// Snake.js
// Responsável por criar e controlar a cobra

export function createSnake(scene) {
    const snake = [];
    const cubeSize = 1;
    const fullMaterial = new THREE.MeshStandardMaterial({ color: 0x00ff00 });
    const headMaterial = new THREE.MeshStandardMaterial({ color: 0xff0000 });

    // Cabeça trapezoidal invertida
    const shape = new THREE.Shape();
    shape.moveTo(-0.5, -0.5);
    shape.lineTo(0.5, -0.5);
    shape.lineTo(0.25, 0.5);
    shape.lineTo(-0.25, 0.5);
    shape.lineTo(-0.5, -0.5);

    const extrudeSettings = { depth: 1, bevelEnabled: false };
    const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    geometry.rotateX(Math.PI / 2);
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

    return { snake, snakeHead: head, snakeDirection: new THREE.Vector3(1, 0, 0) };
}

export function moveSnake(snake, snakeHead, snakeDirection, apple, gameMode, endGame, addSegment, updateScore) {
    const limit = 10;
    let newHeadPosition = snakeHead.position.clone().add(snakeDirection);

    if (gameMode === 'classic') {
        if (newHeadPosition.x > limit) newHeadPosition.x = -limit;
        else if (newHeadPosition.x < -limit) newHeadPosition.x = limit;
        if (newHeadPosition.z > limit) newHeadPosition.z = -limit;
        else if (newHeadPosition.z < -limit) newHeadPosition.z = limit;
    } else if (gameMode === 'barriers') {
        if (newHeadPosition.x > limit || newHeadPosition.x < -limit || newHeadPosition.z > limit || newHeadPosition.z < -limit) {
            endGame();
            return false;
        }
    }

    for (let i = 1; i < snake.length; i++) {
        if (snake[i].position.distanceTo(newHeadPosition) < 0.1) {
            endGame();
            return false;
        }
    }

    if (snakeHead.position.distanceTo(apple.position) < 1) {
        addSegment();
        updateScore();
    }

    for (let i = snake.length - 1; i > 0; i--) {
        snake[i].position.copy(snake[i - 1].position);
    }
    snakeHead.position.copy(newHeadPosition);
    const angle = Math.atan2(snakeDirection.x, snakeDirection.z);
    snakeHead.rotation.y = angle;
    return true;
}

export function isAppleOnSnake(snake, x, z) {
    return snake.some(segment => segment.position.x === x && segment.position.z === z);
}
