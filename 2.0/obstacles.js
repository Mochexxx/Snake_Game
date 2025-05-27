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
    const obstacles = [];    // Função para criar um novo obstáculo em posição válida
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
        }        // Adiciona propriedades para o sistema de vida
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

// Criar decorações ambientais ao redor do tabuleiro
export function createEnvironmentalDecorations(scene) {
    const decorations = [];
    
    // Configurações para as decorações
    const gridSize = 40; // Tamanho do tabuleiro em unidades 3D (20x20 células * 2 unidades cada)
    const gridCenter = { x: 20, z: 20 }; // Centro do tabuleiro
    const gridBounds = {
        minX: 0,  // Limite esquerdo do tabuleiro
        maxX: 40, // Limite direito do tabuleiro
        minZ: 0,  // Limite superior do tabuleiro
        maxZ: 40  // Limite inferior do tabuleiro
    };
    
    // Locais especialmente posicionados para câmeras
    const cameraFriendlyPositions = [
        // Os principais pontos cardeais (visíveis de todas as perspectivas)
        { angle: 0, distanceMultiplier: 1.2 },         // Leste
        { angle: Math.PI / 2, distanceMultiplier: 1.0 }, // Sul
        { angle: Math.PI, distanceMultiplier: 1.2 },     // Oeste
        { angle: Math.PI * 1.5, distanceMultiplier: 1.0 }, // Norte
        
        // Pontos intermediários espaçados de forma irregular
        { angle: Math.PI / 4, distanceMultiplier: 1.1 },     // Sudeste
        { angle: Math.PI * 0.75, distanceMultiplier: 1.3 },  // Sudoeste
        { angle: Math.PI * 1.25, distanceMultiplier: 1.1 },  // Noroeste
        { angle: Math.PI * 1.75, distanceMultiplier: 1.3 },  // Nordeste
        
        // Posições extras com distâncias variadas
        { angle: Math.PI / 6, distanceMultiplier: 1.4 },
        { angle: Math.PI / 3, distanceMultiplier: 1.2 },
        { angle: Math.PI * 0.6, distanceMultiplier: 1.5 },
        { angle: Math.PI * 0.9, distanceMultiplier: 1.3 },
        { angle: Math.PI * 1.1, distanceMultiplier: 1.4 },
        { angle: Math.PI * 1.4, distanceMultiplier: 1.2 },
        { angle: Math.PI * 1.6, distanceMultiplier: 1.5 },
        { angle: Math.PI * 1.9, distanceMultiplier: 1.3 }
    ];
    
    // Array para acompanhar todas as posições usadas
    const usedPositions = [];
    
    // Função para verificar se uma nova posição está longe o suficiente das usadas
    function isPositionValid(newPos, minDistance) {
        return !usedPositions.some(pos => {
            const dx = newPos.x - pos.x;
            const dz = newPos.z - pos.z;
            const distance = Math.sqrt(dx * dx + dz * dz);
            return distance < minDistance;
        });
    }
    
    // Função para encontrar uma posição válida
    function findValidPosition(baseAngle, distanceMultiplier) {
        // Adicionar uma pequena variação ao ângulo para criar mais diversidade
        const angleVariation = (Math.random() * 0.2 - 0.1); // ±0.1 radianos (~5.7°)
        const angle = baseAngle + angleVariation;
        
        // Base para distância
        const minDistance = 50; // Distância mínima do centro
        const maxDistance = 80; // Distância máxima
        
        // Aplicar multiplicador com pequena variação aleatória
        const variableFactor = 0.9 + Math.random() * 0.2; // 0.9 a 1.1
        const effectiveMultiplier = distanceMultiplier * variableFactor;
        
        // Calcular distância final
        const distance = (minDistance + Math.random() * (maxDistance - minDistance)) * effectiveMultiplier;
        
        // Calcular posição
        const x = gridCenter.x + Math.cos(angle) * distance;
        const z = gridCenter.z + Math.sin(angle) * distance;
        
        return { x, z, distance };
    }
    
    // Criar árvores usando posições estratégicas para visibilidade nas câmeras
    const treePositions = [];
    const numTrees = 8; // Aumentado de 6 para 8
    
    // Distribuir árvores nas posições principais e secundárias
    for (let i = 0; i < numTrees; i++) {
        // Escolher uma posição da lista ou criar uma nova se já usamos todas
        const posIndex = i % cameraFriendlyPositions.length;
        const { angle, distanceMultiplier } = cameraFriendlyPositions[posIndex];
        
        let position;
        let attempts = 0;
        const maxAttempts = 10;
        
        // Tentar encontrar uma posição válida
        do {
            position = findValidPosition(angle, distanceMultiplier);
            attempts++;
        } while (!isPositionValid(position, 15) && attempts < maxAttempts);
        
        // Se não encontrou posição válida após tentativas, pular esta árvore
        if (!isPositionValid(position, 15)) continue;
        
        // Marcar posição como usada
        usedPositions.push(position);
        treePositions.push(position);
        
        const tree = createTreeModel();
        
        // Escala variada para árvores ambientais - alguns gigantes, alguns médios
        const baseScale = i % 3 === 0 ? 2.0 : 1.5; // Algumas árvores maiores
        const scale = baseScale + Math.random() * 0.8;
        tree.scale.set(scale, scale, scale);
        
        // Posicionar na posição encontrada
        tree.position.set(position.x, 0, position.z);
        
        // Rotação aleatória
        tree.rotation.y = Math.random() * Math.PI * 2;
        
        // Inclinação sutil para quebrar a uniformidade
        const tiltAngle = Math.random() * 0.05; // Inclinação máxima de 0.05 radianos (~2.9°)
        const tiltDirection = Math.random() * Math.PI * 2;
        tree.rotation.x = Math.cos(tiltDirection) * tiltAngle;
        tree.rotation.z = Math.sin(tiltDirection) * tiltAngle;
        
        scene.add(tree);
        decorations.push({
            mesh: tree,
            type: 'environmental-tree',
            position: { x: position.x, z: position.z },
            scale: scale
        });
    }
    
    // Criar pedras em posições estratégicas
    const numRocks = 6; // Aumentado de 5 para 6
    
    for (let i = 0; i < numRocks; i++) {
        // Escolher posição, evitando as usadas pelas árvores
        const posIndex = (i + numTrees / 2) % cameraFriendlyPositions.length; // Deslocamento para distribuir diferente das árvores
        const { angle, distanceMultiplier } = cameraFriendlyPositions[posIndex];
        
        let position;
        let attempts = 0;
        const maxAttempts = 10;
        
        // Tentar encontrar uma posição válida
        do {
            position = findValidPosition(angle, distanceMultiplier * 0.9); // Pedras um pouco mais próximas que árvores
            attempts++;
        } while (!isPositionValid(position, 12) && attempts < maxAttempts);
        
        // Se não encontrou posição válida após tentativas, pular esta pedra
        if (!isPositionValid(position, 12)) continue;
        
        // Marcar posição como usada
        usedPositions.push(position);
        
        const rock = createRockModel();
        
        // Escala média para pedras ambientais
        const scale = 1.0 + Math.random() * 1.0; // Entre 1.0 e 2.0
        rock.scale.set(scale, scale * 0.8, scale);
        
        // Alguns blocos ficam em "mini-colinas" para variação de altura
        const useElevation = Math.random() > 0.5;
        const elevation = useElevation ? 1.5 + Math.random() * 1.0 : 0.8;
        
        // Posicionar na posição encontrada com altura variável
        rock.position.set(position.x, elevation, position.z);
        
        // Rotação aleatória mais pronunciada
        rock.rotation.set(
            Math.random() * 0.5,
            Math.random() * Math.PI * 2,
            Math.random() * 0.5
        );
        
        scene.add(rock);
        decorations.push({
            mesh: rock,
            type: 'environmental-rock',
            position: { x: position.x, z: position.z },
            elevation: elevation,
            scale: scale
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

// Animar decorações ambientais (rotação suave das pedras e leve ondulação das árvores)
export function animateEnvironmentalDecorations(decorations, time) {
    if (!decorations || decorations.length === 0) return;
    
    const now = time || performance.now() * 0.001; // Converter para segundos se for timestamp
    
    decorations.forEach(decoration => {
        if (!decoration || !decoration.mesh) return;
        
        // Aplicar animações diferentes para tipos diferentes
        if (decoration.type === 'environmental-rock') {
            // Rotação muito lenta para as pedras
            decoration.mesh.rotation.y += 0.0005;
        } 
        else if (decoration.type === 'environmental-tree') {
            // Movimento de ondulação leve para árvores baseado em seno
            // Isso simula uma brisa leve movendo as árvores
            const waveAmount = Math.sin(now * 0.5 + decoration.position.x * 0.1) * 0.005;
            
            // Aplicar ondulação na inclinação da árvore
            const rotationSpeed = 0.0005;
            decoration.mesh.rotation.x = Math.sin(now * 0.3) * 0.01;
            decoration.mesh.rotation.z = Math.cos(now * 0.4 + decoration.position.z * 0.1) * 0.01;
            
            // Cada árvore tem seu próprio padrão de movimento sutil
            if (!decoration.animOffset) {
                decoration.animOffset = Math.random() * Math.PI * 2;
            }
            
            // Movimento muito sutil para cima e para baixo
            const originalY = 0;
            const heightOffset = Math.sin(now * 0.2 + decoration.animOffset) * 0.1;
            decoration.mesh.position.y = originalY + heightOffset;
        }
    });
}
