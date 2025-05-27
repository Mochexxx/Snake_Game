// obstacles.js
// Responsável por criar e gerenciar obstáculos no jogo

import * as THREE from 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.module.js';

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

// Criar decorações ambientais ao redor do tabuleiro
export function createEnvironmentalDecorations(scene) {
    const decorations = [];
    
    // Configurações para as decorações
    const gridSize = 40; // Tamanho do tabuleiro em unidades 3D
    const gridCenter = { x: 20, z: 20 }; // Centro do tabuleiro
    
    // Criar 6 árvores grandes ao redor do tabuleiro
    for (let i = 0; i < 6; i++) {
        const tree = createTreeModel();
        
        // Escala maior para árvores ambientais
        const scale = 1.5 + Math.random() * 1.0; // Entre 1.5 e 2.5
        tree.scale.set(scale, scale, scale);
        
        // Posicionar ao redor do tabuleiro
        const angle = (i / 6) * Math.PI * 2;
        const distance = 25 + Math.random() * 15; // Entre 25 e 40 unidades do centro
        
        const x = gridCenter.x + Math.cos(angle) * distance;
        const z = gridCenter.z + Math.sin(angle) * distance;
        
        tree.position.set(x, 0, z);
        
        // Rotação aleatória
        tree.rotation.y = Math.random() * Math.PI * 2;
        
        scene.add(tree);
        decorations.push({
            mesh: tree,
            type: 'environmental-tree',
            position: { x, z }
        });
    }
    
    // Criar 5 pedras médias ao redor do tabuleiro
    for (let i = 0; i < 5; i++) {
        const rock = createRockModel();
        
        // Escala média para pedras ambientais
        const scale = 1.2 + Math.random() * 0.8; // Entre 1.2 e 2.0
        rock.scale.set(scale, scale * 0.8, scale);
        
        // Posicionar em locais diferentes das árvores
        const angle = (i / 5) * Math.PI * 2 + Math.PI / 5; // Offset para não coincidir com árvores
        const distance = 20 + Math.random() * 20; // Entre 20 e 40 unidades do centro
        
        const x = gridCenter.x + Math.cos(angle) * distance;
        const z = gridCenter.z + Math.sin(angle) * distance;
        
        rock.position.set(x, 0.8, z);
        
        // Rotação aleatória
        rock.rotation.set(
            Math.random() * 0.5,
            Math.random() * Math.PI * 2,
            Math.random() * 0.5
        );
        
        scene.add(rock);
        decorations.push({
            mesh: rock,
            type: 'environmental-rock',
            position: { x, z }
        });
    }
    
    return decorations;
}

// Remover decorações ambientais
export function removeEnvironmentalDecorations(scene, decorations) {
    if (!decorations || decorations.length === 0) return;
    
    decorations.forEach(decoration => {
        if (decoration && decoration.mesh) {
            scene.remove(decoration.mesh);
        }
    });
}

// Animar decorações ambientais (rotação suave das pedras)
export function animateEnvironmentalDecorations(decorations, time) {
    if (!decorations || decorations.length === 0) return;
    
    decorations.forEach(decoration => {
        if (!decoration || !decoration.mesh) return;
        
        // Apenas as pedras recebem rotação suave
        if (decoration.type === 'environmental-rock') {
            decoration.mesh.rotation.y += 0.001;
        }
    });
}
