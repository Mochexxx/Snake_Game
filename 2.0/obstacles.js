// obstacles.js
// Responsável por criar e gerenciar obstáculos no jogo

import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.128.0/build/three.module.js';
import { getBoardCellCenter } from './scene.js';
import { createTreeModel, createRockModel } from './models.js';

// Configurações dos obstáculos
const OBSTACLE_LIFETIME = 10000; // 10 segundos em milissegundos
const OBSTACLE_FADE_TIME = 1000; // 1 segundo para desaparecer

// Criação dos obstáculos para o modo "obstacles"
export function createObstacles(scene, snake, snakeBoard, hitboxes, count = 10) {
    const obstacles = [];
    
    // Função para criar um novo obstáculo em posição válida
    function createNewObstacle() {
        // Posições dos obstáculos na matriz
        const obstaclePositions = obstacles.map(obs => obs.boardPosition);
        
        // Encontra uma posição válida
        let x, z;
        let validPosition = false;
        let attempts = 0;
        const maxAttempts = 50;
        
        while (!validPosition && attempts < maxAttempts) {
            x = Math.floor(Math.random() * 20);
            z = Math.floor(Math.random() * 20);
            
            // Verifica se a posição já foi usada ou se está ocupada pela cobra
            const isObstaclePos = obstaclePositions.some(pos => pos.x === x && pos.z === z);
            const isSnakePos = snakeBoard.some(segment => segment.x === x && segment.z === z);
            const isNearHead = isPositionNearSnakeHead(snakeBoard[0], x, z, 3);
            
            validPosition = !isObstaclePos && !isSnakePos && !isNearHead;
            attempts++;
        }
        
        if (!validPosition) {
            console.warn("Não foi possível encontrar posição válida para o obstáculo");
            return null;
        }
        
        // Obtém as coordenadas 3D para a posição do tabuleiro
        const { centerX, centerZ } = hitboxes[x][z];
        
        // Escolhe aleatoriamente entre árvore ou pedra
        let obstacle;
        const isTree = Math.random() > 0.5;
        
        if (isTree) {
            // Cria uma árvore como obstáculo
            obstacle = createTreeModel();
         
            // Ajusta a escala para ficar maior
            const scale = 0.7 + Math.random() * 0.3;
            obstacle.scale.set(scale, scale, scale);
            
            // Posiciona a árvore no chão
            obstacle.position.set(centerX, 0, centerZ);
        } else {
            // Cria uma pedra como obstáculo
            obstacle = createRockModel();
            
            // Ajusta a escala da pedra
            const scale = 0.8 + Math.random() * 0.4;
            obstacle.scale.set(scale, scale * 0.7, scale);
            
            // Rotação aleatória para as pedras
            obstacle.rotation.set(
                Math.random() * 0.3,
                Math.random() * Math.PI * 2,
                Math.random() * 0.3
            );
            
            // Posiciona a pedra um pouco acima do chão
            obstacle.position.set(centerX, 0.5, centerZ);
        }
        
        // Adiciona propriedades para o sistema de vida
        obstacle.boardPosition = { x, z };
        obstacle.creationTime = Date.now();
        obstacle.isTree = isTree;
        obstacle.isFading = false;
        
        // Adiciona à cena
        scene.add(obstacle);
        
        // Retorna o obstáculo
        return obstacle;
    }
    
    // Cria os obstáculos iniciais
    for (let i = 0; i < count; i++) {
        const obstacle = createNewObstacle();
        if (obstacle) {
            obstacles.push(obstacle);
        }
    }
    
    // Adiciona a função para regenerar obstáculos ao array
    obstacles.createNewObstacle = createNewObstacle;
    
    return obstacles;
}

// Verifica se a posição está muito próxima da cabeça da cobra
function isPositionNearSnakeHead(head, x, z, distance) {
    const dx = Math.abs(head.x - x);
    const dz = Math.abs(head.z - z);
    return dx <= distance && dz <= distance;
}

// Verifica colisão entre a cobra e os obstáculos
export function checkObstacleCollision(obstacles, x, z) {
    return obstacles.some(obstacle => {
        if (obstacle.boardPosition && !obstacle.isFading) {
            return obstacle.boardPosition.x === x && obstacle.boardPosition.z === z;
        }
        return false;
    });
}

// Remove os obstáculos da cena
export function removeObstacles(scene, obstacles) {
    obstacles.forEach(obstacle => {
        if (obstacle && typeof obstacle === 'object') {
            scene.remove(obstacle);
        }
    });
}

// Gerencia o tempo de vida dos obstáculos e regenera quando necessário
export function updateObstacles(scene, obstacles, snake, snakeBoard, hitboxes) {
    if (!obstacles || obstacles.length === 0 || !obstacles.createNewObstacle) return;
    
    const currentTime = Date.now();
    let obstaclesRemoved = 0;
    
    // Atualiza cada obstáculo
    for (let i = obstacles.length - 1; i >= 0; i--) {
        const obstacle = obstacles[i];
        if (!obstacle || !obstacle.creationTime) continue;
        
        const age = currentTime - obstacle.creationTime;
        
        // Se o obstáculo está pronto para desaparecer
        if (age >= OBSTACLE_LIFETIME && !obstacle.isFading) {
            obstacle.isFading = true;
            obstacle.fadeStartTime = currentTime;
        }
        
        // Se o obstáculo está desaparecendo
        if (obstacle.isFading) {
            const fadeAge = currentTime - obstacle.fadeStartTime;
            const fadeProgress = Math.min(fadeAge / OBSTACLE_FADE_TIME, 1);
            
            // Aplica efeito de transparência
            setObstacleOpacity(obstacle, 1 - fadeProgress);
            
            // Remove o obstáculo quando terminar de desaparecer
            if (fadeProgress >= 1) {
                scene.remove(obstacle);
                obstacles.splice(i, 1);
                obstaclesRemoved++;
            }
        }
    }
    
    // Cria novos obstáculos para substituir os removidos
    for (let i = 0; i < obstaclesRemoved; i++) {
        const newObstacle = obstacles.createNewObstacle();
        if (newObstacle) {
            obstacles.push(newObstacle);
        }
    }
}

// Define a opacidade de um obstáculo (árvore ou pedra)
function setObstacleOpacity(obstacle, opacity) {
    if (obstacle.isTree) {
        // Para árvores (grupos com dois objetos: tronco e topo)
        obstacle.children.forEach(child => {
            if (child.material) {
                child.material.transparent = opacity < 1;
                child.material.opacity = opacity;
            }
        });
    } else {
        // Para pedras (mesh único)
        if (obstacle.material) {
            obstacle.material.transparent = opacity < 1;
            obstacle.material.opacity = opacity;
        }
    }
}

// Anima os obstáculos - apenas rotação mínima nas pedras
export function animateObstacles(obstacles, time) {
    if (!obstacles || obstacles.length === 0) return;
    
    obstacles.forEach(obstacle => {
        // Ignora objetos sem propriedades específicas (como a função createNewObstacle)
        if (!obstacle || typeof obstacle !== 'object' || !obstacle.boardPosition) return;
        
        // Apenas as pedras (não grupos/árvores) recebem rotação mínima
        if (!obstacle.isTree) {
            obstacle.rotation.y += 0.002;
        }
    });
}
