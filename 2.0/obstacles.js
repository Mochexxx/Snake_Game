// obstacles.js
// Responsável por criar e gerenciar obstáculos no jogo

import { getBoardCellCenter } from './scene.js';

// Criação dos obstáculos para o modo "obstacles"
export function createObstacles(scene, snake, snakeBoard, hitboxes, count = 10) {
    const obstacles = [];
    const obstacleGeometry = new THREE.BoxGeometry(2, 2, 2);
    const obstacleMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x8800ff,
        emissive: 0x440088,
        metalness: 0.7,
        roughness: 0.2
    });
    
    // Posições dos obstáculos na matriz
    const obstaclePositions = [];
    
    // Gera posições aleatórias que não colidem com a cobra
    for (let i = 0; i < count; i++) {
        let x, z;
        do {
            x = Math.floor(Math.random() * 20);
            z = Math.floor(Math.random() * 20);
            // Verifica se a posição já foi usada ou se está ocupada pela cobra
        } while (
            isObstacleAtPosition(obstaclePositions, x, z) || 
            isSnakeAtPosition(snakeBoard, x, z) ||
            // Evita colocar obstáculos muito próximos à cabeça da cobra
            isPositionNearSnakeHead(snakeBoard[0], x, z, 3)
        );
        
        obstaclePositions.push({ x, z });
          // Cria o objeto 3D para o obstáculo - versão melhorada
        const { centerX, centerZ } = hitboxes[x][z];
        
        // Alguns obstáculos terão formas diferentes para variedade visual
        let obstacle;
        
        if (i % 3 === 0) {
            // Pirâmide para alguns obstáculos
            const pyramidGeometry = new THREE.ConeGeometry(1.2, 2, 4);
            obstacle = new THREE.Mesh(pyramidGeometry, obstacleMaterial);
            obstacle.rotation.y = Math.PI / 4; // Rotaciona para alinhar com o tabuleiro
        } else if (i % 3 === 1) {
            // Esfera para alguns obstáculos
            const sphereGeometry = new THREE.SphereGeometry(1, 16, 16);
            obstacle = new THREE.Mesh(sphereGeometry, obstacleMaterial);
        } else {
            // Cubo para os demais
            obstacle = new THREE.Mesh(obstacleGeometry, obstacleMaterial);
        }
        
        obstacle.position.set(centerX, 1, centerZ);
        obstacle.boardPosition = { x, z };  // Armazena posição no tabuleiro para colisões
        
        // Adiciona animação sutíl de flutuação
        obstacle.initialY = 1;
        obstacle.animPhase = Math.random() * Math.PI * 2; // Fase aleatória
        
        scene.add(obstacle);
        obstacles.push(obstacle);
    }
    
    return obstacles;
}

// Verifica se já existe um obstáculo na posição
function isObstacleAtPosition(obstacles, x, z) {
    return obstacles.some(obs => obs.x === x && obs.z === z);
}

// Verifica se a cobra está na posição
function isSnakeAtPosition(snakeBoard, x, z) {
    return snakeBoard.some(segment => segment.x === x && segment.z === z);
}

// Verifica se a posição está muito próxima da cabeça da cobra
function isPositionNearSnakeHead(head, x, z, distance) {
    const dx = Math.abs(head.x - x);
    const dz = Math.abs(head.z - z);
    return dx <= distance && dz <= distance;
}

// Verifica colisão entre a cobra e os obstáculos
export function checkObstacleCollision(obstacles, x, z) {
    return obstacles.some(obstacle => obstacle.boardPosition.x === x && obstacle.boardPosition.z === z);
}

// Remove os obstáculos da cena
export function removeObstacles(scene, obstacles) {
    obstacles.forEach(obstacle => scene.remove(obstacle));
}

// Anima os obstáculos (pequena oscilação para cima e para baixo)
export function animateObstacles(obstacles, time) {
    if (!obstacles || obstacles.length === 0) return;
    
    obstacles.forEach(obstacle => {
        if (obstacle.initialY !== undefined) {
            const floatHeight = 0.2; // Altura da flutuação
            const floatSpeed = 0.001; // Velocidade da animação
            
            // Calcula a nova posição Y com oscilação senoidal
            const newY = obstacle.initialY + Math.sin(time * floatSpeed + obstacle.animPhase) * floatHeight;
            obstacle.position.y = newY;
            
            // Adiciona uma pequena rotação
            obstacle.rotation.y += 0.005;
        }
    });
}
