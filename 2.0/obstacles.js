// obstacles.js
// Responsável por criar e gerenciar obstáculos no jogo

import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.128.0/build/three.module.js';
import { getBoardCellCenter } from './scene.js';
import { createTreeModel, createRockModel } from './models.js';
import { getCurrentBoardTheme, getThemeConfig } from './board-theme-manager.js';
import { loadModel } from './model-loader.js';

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
export async function createEnvironmentalDecorations(scene) {
    console.log('Creating environmental decorations...');
    const decorations = [];
      // Performance settings - can be adjusted based on device performance
    const PERFORMANCE_SETTINGS = {
        maxComplexObjects: 4,
        maxSimpleObjectsPerComplex: 6,
        minSimpleObjectsPerComplex: 3,
        enableAnimations: true,
        minDistanceBetweenObjects: 15 // Distância mínima aumentada para acomodar os objetos maiores
    };
      // Fixed positions for complex objects (matching your X marks in the screenshot)
    // These are positioned further outside the 40x40 grid in the corners to acomodate bigger objects
    const complexPositions = [
        { x: -20, z: -20 },  // Top-left X
        { x: 60, z: -20 },   // Top-right X  
        { x: -20, z: 60 },   // Bottom-left X
        { x: 60, z: 60 }     // Bottom-right X
    ];
    
    // Get current theme
    const theme = getCurrentBoardTheme();
    let themeConfig;
    
    try {
        themeConfig = getThemeConfig(theme);
        console.log('Current theme:', theme, 'Config:', themeConfig);
    } catch (error) {
        console.warn('Failed to get theme config, using fallback:', error);
        themeConfig = { folder: 'quinta' }; // Fallback to classic theme
    }
    
    // Enhanced theme object mapping with correct file names matching available models
    const themeObjects = {
        desert: {
            complex: ['Camelo_paisagem.glb'],
            simple: ['cacto_obstaculo.glb']
        },
        snow: {
            complex: ['Igloo_paisagem.glb'],
            simple: ['Snowman_paisagem.glb', 'bush_obstaculo.glb', 'avore_neve_obstaculo.glb']
        },
        classic: {
            complex: ['barn_paisagem.glb'],
            simple: ['Cow.glb', 'silo_paisagem.glb', 'hay_obstaculo.glb']
        },
        farm: {
            complex: ['barn_paisagem.glb'],
            simple: ['Cow.glb', 'silo_paisagem.glb', 'hay_obstaculo.glb']
        },
        forest: {
            complex: [], // Will use trees at fixed positions
            simple: []
        }    };
      // Get objects for current theme
    const objects = themeObjects[theme] || themeObjects['classic'];
    console.log('Theme objects for', theme, ':', objects);
    
    // Lista para rastrear posições de todos os objetos (tanto complexos quanto simples)
    const allObjectPositions = [];
    
    // Place complex objects at the X positions
    for (let i = 0; i < complexPositions.length; i++) {
        const pos = complexPositions[i];
        console.log('Processing position', i, ':', pos);
        
        // Verifica se essa posição está muito próxima de outros objetos complexos já adicionados
        if (isPositionTooClose(pos, allObjectPositions, PERFORMANCE_SETTINGS.minDistanceBetweenObjects * 3)) {
            console.warn(`Posição ${i} (${pos.x}, ${pos.z}) está muito próxima de outros objetos. Ajustando posição.`);
            // Ajusta levemente a posição para evitar sobreposição com outros objetos complexos
            pos.x += (Math.random() * 6) - 3;
            pos.z += (Math.random() * 6) - 3;
        }
        
        // Adiciona à lista de posições usadas
        allObjectPositions.push(pos);
        
        if (objects.complex && objects.complex.length > 0) {
            // Use different complex objects or repeat if not enough
            const modelFile = objects.complex[i % objects.complex.length];
            const basePath = `assets/temas_models/${themeConfig.folder}/`;
            
            try {
                const model = await loadModel(basePath + modelFile);
                console.log('Successfully loaded complex model:', modelFile, 'at position:', pos);
                model.position.set(pos.x, 0, pos.z);
                  // Theme-specific scaling
                if (theme === 'snow') {
                    model.scale.set(30, 30, 30); // Igloos 10x bigger
                } else if (theme === 'desert') {
                    model.scale.set(2.5, 2.5, 2.5); // Camels medium
                } else {
                    model.scale.set(2, 2, 2); // Barns standard
                }
                
                model.rotation.y = Math.random() * Math.PI * 2; // Random rotation
                model.userData.isThemeModel = true;
                scene.add(model);
                decorations.push({ 
                    mesh: model, 
                    type: 'complex', 
                    position: { x: pos.x, z: pos.z } 
                });                // Place 4-6 simple objects around each complex object
                if (objects.simple && objects.simple.length > 0) {
                    const numSimple = 4 + Math.floor(Math.random() * 3); // 4-6 objects
                    
                    // Lista para rastrear posições já ocupadas
                    const usedPositions = [
                        { x: pos.x, z: pos.z } // Adiciona a posição do objeto complexo
                    ];
                    
                    for (let j = 0; j < numSimple; j++) {
                        // Encontra uma posição válida para o objeto simples
                        const { x: sx, z: sz } = findValidPosition(
                            pos.x, 
                            pos.z, 
                            usedPositions, 
                            PERFORMANCE_SETTINGS.minDistanceBetweenObjects,
                            6,  // min radius
                            10  // max radius
                        );
                        
                        // Adiciona à lista de posições usadas
                        usedPositions.push({ x: sx, z: sz });
                        
                        const simpleFile = objects.simple[j % objects.simple.length];
                        console.log('Loading simple model:', simpleFile, 'at position:', {x: sx, z: sz});
                        const simpleModel = await loadModel(basePath + simpleFile);
                        
                        // Theme-specific scaling for simple objects
                        if (simpleFile.toLowerCase().includes('cow')) {
                            simpleModel.scale.set(0.6, 0.6, 0.6); // Small cows                        } else if (simpleFile.toLowerCase().includes('snowman')) {
                            simpleModel.scale.set(15, 15, 15); // Snowmen 10x bigger
                        } else if (simpleFile.toLowerCase().includes('cactus')) {
                            simpleModel.scale.set(1.0, 1.0, 1.0); // Medium cacti
                        } else {
                            simpleModel.scale.set(1.2, 1.2, 1.2); // Default medium
                        }
                        
                        simpleModel.position.set(sx, 0, sz);
                        simpleModel.rotation.y = Math.random() * Math.PI * 2;
                        simpleModel.userData.isThemeModel = true;
                        scene.add(simpleModel);
                        decorations.push({ 
                            mesh: simpleModel, 
                            type: 'simple', 
                            position: { x: sx, z: sz } 
                        });
                    }
                }
            } catch (e) {
                console.warn('Failed to load theme model', modelFile, ':', e);
            }
        } else if (theme === 'forest') {
            // For forest theme, place large trees at the X positions
            const tree = createTreeModel();
            tree.scale.set(3, 3, 3); // Large trees for forest theme
            tree.position.set(pos.x, 0, pos.z);
            tree.rotation.y = Math.random() * Math.PI * 2;
            scene.add(tree);
            decorations.push({
                mesh: tree,
                type: 'environmental-tree',
                position: { x: pos.x, z: pos.z },
                scale: 3
            });
              // Add some rocks around each tree
            // Lista para rastrear posições já ocupadas
            const usedPositions = [
                { x: pos.x, z: pos.z } // Adiciona a posição da árvore
            ];
            
            for (let j = 0; j < 3; j++) {
                // Encontra uma posição válida para a pedra
                const { x: sx, z: sz } = findValidPosition(
                    pos.x, 
                    pos.z, 
                    usedPositions, 
                    PERFORMANCE_SETTINGS.minDistanceBetweenObjects,
                    5,  // min radius
                    8   // max radius
                );
                
                // Adiciona à lista de posições usadas
                usedPositions.push({ x: sx, z: sz });
                
                const rock = createRockModel();
                rock.scale.set(1.5, 1.2, 1.5);
                rock.position.set(sx, 0, sz);
                rock.rotation.set(
                    Math.random() * 0.3,
                    Math.random() * Math.PI * 2,
                    Math.random() * 0.3
                );
                scene.add(rock);
                decorations.push({
                    mesh: rock,
                    type: 'environmental-rock',
                    position: { x: sx, z: sz }                });
            }
        }
    }
      // Registra informações sobre os objetos criados
    const complexCount = decorations.filter(d => d.type === 'complex').length;
    const simpleCount = decorations.filter(d => d.type === 'simple').length;
    const treeCount = decorations.filter(d => d.type === 'environmental-tree').length;
    const rockCount = decorations.filter(d => d.type === 'environmental-rock').length;
    
    console.log('Environmental decorations created successfully.', {
        total: decorations.length,
        complex: complexCount,
        simple: simpleCount,
        trees: treeCount,
        rocks: rockCount
    });
    
    // Verificação final de sobreposições e ajustes se necessário
    console.log('Realizando verificação final de sobreposições entre modelos...');
    let overlapsFound = 0;
    
    // Obtém todos os meshes de decoração
    const allMeshes = decorations.map(d => d.mesh).filter(Boolean);
    
    // Verifica e corrige sobreposições para cada modelo
    for (let i = 0; i < allMeshes.length; i++) {
        const model = allMeshes[i];
        
        // Cria uma lista de todos os outros modelos para comparação
        const otherModels = allMeshes.filter((_, index) => index !== i);
        
        // Verifica e ajusta posição se houver sobreposição visual
        const hadOverlap = adjustPositionToAvoidOverlap(model, otherModels, scene);
        
        // Atualiza a posição no objeto de decoração após possível ajuste
        if (hadOverlap) {
            overlapsFound++;
            const decorationObj = decorations[i];
            if (decorationObj) {
                decorationObj.position.x = model.position.x;
                decorationObj.position.z = model.position.z;
            }
        }
    }
    
    if (overlapsFound > 0) {
        console.log(`Foram encontradas e corrigidas ${overlapsFound} sobreposições entre modelos.`);
    } else {
        console.log('Nenhuma sobreposição visual encontrada entre os modelos.');
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

// Função auxiliar para verificar se uma posição está muito próxima de outros objetos
function isPositionTooClose(position, existingPositions, minDistance) {
    for (let existing of existingPositions) {
        const dx = Math.abs(position.x - existing.x);
        const dz = Math.abs(position.z - existing.z);
        const distance = Math.sqrt(dx * dx + dz * dz);
        if (distance < minDistance) {
            return true; // Posição está muito próxima de outro objeto
        }
    }
    return false; // Posição está OK
}

// Função para encontrar uma posição válida para um objeto simples
function findValidPosition(centerX, centerZ, existingPositions, minDistance, minRadius = 6, maxRadius = 10) {
    const maxAttempts = 30; // Aumentado para mais tentativas
    
    // Estratégia de distribuição em setores para melhor ocupação do espaço
    const sectors = 8; // Divide o círculo em 8 setores
    const sectorAngle = (Math.PI * 2) / sectors;
    const useSectors = existingPositions.length <= sectors;
    
    // Se tivermos menos posições que setores, tentamos distribuir melhor
    if (useSectors) {
        // Para cada setor, tentamos encontrar uma posição válida
        for (let sector = 0; sector < sectors; sector++) {
            // Calcula o ângulo base para este setor
            const baseAngle = sector * sectorAngle;
            
            // Tenta algumas posições dentro deste setor
            for (let attempt = 0; attempt < Math.floor(maxAttempts / sectors); attempt++) {
                // Gera uma variação no ângulo dentro do setor
                const angleVariation = (Math.random() * 0.8 + 0.1) * sectorAngle; // 10% a 90% do ângulo do setor
                const angle = baseAngle + angleVariation;
                
                // Gera um raio aleatório entre minRadius e maxRadius
                const radius = minRadius + Math.random() * (maxRadius - minRadius);
                
                // Calcula a posição
                const x = centerX + Math.cos(angle) * radius;
                const z = centerZ + Math.sin(angle) * radius;
                
                // Verifica se essa posição está longe o suficiente de outros objetos
                if (!isPositionTooClose({x, z}, existingPositions, minDistance)) {
                    console.log(`Posição válida encontrada no setor ${sector} após ${attempt + 1} tentativas`);
                    return {x, z};
                }
            }
        }
    }
    
    // Abordagem mais aleatória se a abordagem por setores falhar ou não for usada
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
        // Gera um ângulo completamente aleatório
        const angle = Math.random() * Math.PI * 2;
        // Aumenta o raio com base no número de tentativas para se distanciar mais
        const adjustedMaxRadius = maxRadius + (attempt / maxAttempts) * 5;
        const radius = minRadius + Math.random() * (adjustedMaxRadius - minRadius);
        
        // Calcula a posição
        const x = centerX + Math.cos(angle) * radius;
        const z = centerZ + Math.sin(angle) * radius;
        
        // Verifica se essa posição está longe o suficiente de outros objetos
        if (!isPositionTooClose({x, z}, existingPositions, minDistance)) {
            console.log(`Posição válida encontrada após ${attempt + 1} tentativas aleatórias`);
            return {x, z};
        }
    }
    
    // Se não encontrou uma posição válida, aumenta o raio e tenta novamente
    if (maxRadius < 25) {
        console.log('Aumentando raio de busca...');
        return findValidPosition(centerX, centerZ, existingPositions, minDistance, maxRadius, maxRadius + 8);
    }
    
    // Se ainda não conseguiu, retorna uma posição com distância mínima reduzida
    console.warn('Não foi possível encontrar uma posição ideal, usando posição sub-ótima');
    return findValidPosition(centerX, centerZ, existingPositions, minDistance * 0.6, minRadius, maxRadius);
}

// Verifica se dois modelos 3D estão visualmente sobrepostos, considerando suas dimensões
function areModelsOverlapping(model1, model2, tolerance = 0.5) {
    // Se algum dos modelos não existir, não há sobreposição
    if (!model1 || !model2) return false;
    
    // Calcula a caixa delimitadora (bounding box) de cada modelo
    const box1 = new THREE.Box3().setFromObject(model1);
    const box2 = new THREE.Box3().setFromObject(model2);
    
    // Expande ligeiramente as caixas com base na tolerância
    box1.expandByScalar(tolerance);
    box2.expandByScalar(tolerance);
    
    // Verifica se as caixas se sobrepõem
    return box1.intersectsBox(box2);
}

// Função para ajustar a posição de um objeto para evitar sobreposições
function adjustPositionToAvoidOverlap(model, otherModels, scene, maxAttempts = 5, moveDistance = 1.5) {
    if (!model || otherModels.length === 0) return false;
    
    let attempts = 0;
    let hasOverlap = false;
    let overlapFound = false;
    
    do {
        hasOverlap = false;
        
        // Verifica se há sobreposição com qualquer outro modelo
        for (const otherModel of otherModels) {
            if (model === otherModel) continue; // Ignora o próprio modelo
            
            if (areModelsOverlapping(model, otherModel)) {
                hasOverlap = true;
                overlapFound = true; // Registra que pelo menos uma sobreposição foi encontrada
                
                // Calcula direção de afastamento (para longe do outro modelo)
                const direction = new THREE.Vector3(
                    model.position.x - otherModel.position.x,
                    0, // Mantém a mesma altura
                    model.position.z - otherModel.position.z
                ).normalize();
                
                // Aumenta a distância de movimento com base no número de tentativas
                const adjustedMoveDistance = moveDistance * (1 + attempts * 0.3);
                
                // Move na direção calculada
                model.position.x += direction.x * adjustedMoveDistance;
                model.position.z += direction.z * adjustedMoveDistance;
                
                break; // Sai do loop para verificar novamente com a nova posição
            }
        }
        
        attempts++;
    } while (hasOverlap && attempts < maxAttempts);
    
    // Se ainda tem sobreposição após várias tentativas, tenta uma posição mais distante
    if (hasOverlap && attempts >= maxAttempts) {
        // Move para uma posição mais afastada em direção aleatória
        const randomAngle = Math.random() * Math.PI * 2;
        model.position.x += Math.cos(randomAngle) * moveDistance * 3;
        model.position.z += Math.sin(randomAngle) * moveDistance * 3;
        
        console.warn('Não foi possível eliminar completamente a sobreposição após várias tentativas');
    }
    
    // Retorna true se encontrou sobreposição e teve que ajustar
    return overlapFound;
}
