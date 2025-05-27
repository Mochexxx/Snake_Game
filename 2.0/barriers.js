// barriers.js
// Responsável por criar e gerenciar barreiras no modo "barriers"

import { getBoardCellCenter } from './scene.js';
import { randomPatterns } from './barrier-shapes.js';
import * as THREE from 'three';
import { createWoodenFenceModel } from './model-loader.js';
import { getThemeBarrierModel } from './board-theme-manager.js';

// Criação das barreiras para o modo "barriers"
export function createBarriers(scene, snakeBoard, hitboxes) {
    return new Promise(async (resolve, reject) => {
        try {
            const barriers = [];
            
            // Criar barreiras em torno do tabuleiro (limites do jogo)
            await createBoundaryBarriers(scene, barriers, hitboxes);
            
            // Remover barreiras no meio para modo padrão
            // createComplexBarriers(scene, barriers, snakeBoard, hitboxes);
            
            resolve(barriers);
        } catch (error) {
            console.error('Error creating barriers:', error);
            resolve([]); // Return empty array on error to avoid breaking the game
        }
    });
}

// Criação das barreiras para o modo "barreiras aleatórias" (apenas peças únicas)
export function createRandomBarriers(scene, barriers, snakeBoard, hitboxes, count = 12) {
    const usedPositions = [];
    const allBlocks = [];
    let tentativas = 0;
    let criadas = 0;
    const maxPecas = count;
    // Embaralha a pool de padrões para cada partida
    const shuffledPatterns = randomPatterns.slice().sort(() => Math.random() - 0.5);
    let patternIndex = 0;
    
    // Divide o tabuleiro em quadrantes para garantir uma melhor distribuição
    const quadrants = [
        {minX: 0, maxX: 9, minZ: 0, maxZ: 9},     // Canto superior esquerdo
        {minX: 10, maxX: 19, minZ: 0, maxZ: 9},   // Canto superior direito
        {minX: 0, maxX: 9, minZ: 10, maxZ: 19},   // Canto inferior esquerdo
        {minX: 10, maxX: 19, minZ: 10, maxZ: 19}  // Canto inferior direito
    ];
    let quadrantIndex = 0;
    
    while (criadas < maxPecas && tentativas < maxPecas * 30) {
        tentativas++;
        // Seleciona padrão embaralhado
        const pattern = shuffledPatterns[patternIndex % shuffledPatterns.length];
        patternIndex++;
        
        // Tenta colocar barreiras em quadrantes diferentes para melhor distribuição
        const targetQuadrant = quadrants[quadrantIndex % quadrants.length];
        
        // Gera uma peça candidata
        const tempBarriers = [];
        const ok = createRandomBarrierPieceInQuadrant(scene, tempBarriers, usedPositions, hitboxes, snakeBoard, pattern, targetQuadrant);
        if (!ok) {
            // Se não conseguir colocar no quadrante alvo, tenta em qualquer lugar
            const fallbackOk = createRandomBarrierPiece(scene, tempBarriers, usedPositions, hitboxes, snakeBoard, pattern);
            if (!fallbackOk) continue;
        }
        
        // Checa se todos os blocos da peça estão a pelo menos 3 de distância de Manhattan de todos os blocos já aceitos
        const posicoes = tempBarriers[0].boardPositions;
        const isDistante = posicoes.every(pos =>
            allBlocks.every(b => Math.abs(b.x - pos.x) + Math.abs(b.z - pos.z) >= 3)
        );
        // Checa se todos os blocos da peça não estão colados (nem ortogonal nem diagonalmente) a nenhum bloco já aceito
        const isIsolada = posicoes.every(pos =>
            allBlocks.every(b =>
                Math.abs(b.x - pos.x) > 1 || Math.abs(b.z - pos.z) > 1 || (b.x === pos.x && b.z === pos.z)
            )
        );
        // Além disso, impede sobreposição direta
        const isSobreposta = posicoes.some(pos =>
            allBlocks.some(b => b.x === pos.x && b.z === pos.z)
        );
        if (isIsolada && !isSobreposta) {
            barriers.push(...tempBarriers);
            allBlocks.push(...posicoes);
            criadas++;
            quadrantIndex++; // Avança para o próximo quadrante para melhor distribuição
        } else {
            tempBarriers.forEach(b => scene.remove(b.mesh));
        }
    }
}

// Função auxiliar para criar barreiras em quadrantes específicos
function createRandomBarrierPieceInQuadrant(scene, barriers, usedPositions, hitboxes, snakeBoard, pattern, quadrant) {
    // Materiais
    const baseMaterial = new THREE.MeshStandardMaterial({
        color: 0x777777,
        roughness: 0.5,
        metalness: 0.5
    });
    const slabMaterial = new THREE.MeshStandardMaterial({
        color: 0xaaaaaa,
        roughness: 0.3,
        metalness: 0.7,
        emissive: 0x222222
    });

    // Usa pool centralizada de padrões
    if (!pattern) {
        pattern = randomPatterns[Math.floor(Math.random() * randomPatterns.length)];
    }

    // Tenta encontrar uma posição válida dentro do quadrante especificado
    let attempts = 0;
    let baseX, baseZ;
    let positions;
    // Calcula limites para baseX/baseZ para padrões com dx/dz negativos
    const minDx = Math.min(...pattern.map(p => p.dx));
    const maxDx = Math.max(...pattern.map(p => p.dx));
    const minDz = Math.min(...pattern.map(p => p.dz));
    const maxDz = Math.max(...pattern.map(p => p.dz));
    
    do {
        // Gera posição dentro do quadrante especificado
        const availableX = quadrant.maxX - quadrant.minX - (maxDx - minDx);
        const availableZ = quadrant.maxZ - quadrant.minZ - (maxDz - minDz);
        
        if (availableX < 0 || availableZ < 0) {
            return false; // O padrão não cabe neste quadrante
        }
        
        baseX = quadrant.minX + Math.floor(Math.random() * (availableX + 1)) - minDx;
        baseZ = quadrant.minZ + Math.floor(Math.random() * (availableZ + 1)) - minDz;
        positions = pattern.map(p => ({x: baseX + p.dx, z: baseZ + p.dz}));
        attempts++;
        
        // Verifica se todas as posições estão livres e dentro do quadrante
    } while (
        attempts < 50 && (
            positions.some(pos =>
                pos.x < quadrant.minX || pos.x > quadrant.maxX || 
                pos.z < quadrant.minZ || pos.z > quadrant.maxZ ||
                usedPositions.some(u => u.x === pos.x && u.z === pos.z) ||
                snakeBoard.some(seg => seg.x === pos.x && seg.z === pos.z)
            )
        )
    );
    
    if (attempts >= 50) return false; // Não conseguiu posicionar no quadrante

    // Marca posições como usadas
    positions.forEach(pos => usedPositions.push({x: pos.x, z: pos.z}));

    // Cria o grupo 3D
    const group = new THREE.Group();
    const hitboxMaterial = new THREE.MeshBasicMaterial({ visible: false });
    const hitboxMeshes = [];
    // Para cada bloco da peça, cria um cubo do tamanho de uma célula
    positions.forEach((pos, idx) => {
        const {centerX, centerZ} = hitboxes[pos.x][pos.z];        const cube = new THREE.Mesh(
            new THREE.BoxGeometry(3, 3, 3),
            baseMaterial
        );
        cube.position.set(centerX - hitboxes[baseX][baseZ].centerX, 1.5, centerZ - hitboxes[baseX][baseZ].centerZ);
        group.add(cube);
        // Adiciona hitbox invisível para cada célula
        const hitbox = new THREE.Mesh(
            new THREE.BoxGeometry(2, 2, 2),
            hitboxMaterial
        );
        hitbox.position.set(centerX - hitboxes[baseX][baseZ].centerX, 1, centerZ - hitboxes[baseX][baseZ].centerZ);
        group.add(hitbox);
        hitboxMeshes.push(hitbox);
    });
    // Opcional: adicionar uma slab no topo do primeiro bloco para variedade visual
    const {x: sx, z: sz} = positions[0];
    const {centerX: slabX, centerZ: slabZ} = hitboxes[sx][sz];    const slab = new THREE.Mesh(
        new THREE.BoxGeometry(3.15, 1.35, 3.15),
        slabMaterial
    );
    slab.position.set(slabX - hitboxes[baseX][baseZ].centerX, 2.93, slabZ - hitboxes[baseX][baseZ].centerZ);
    group.add(slab);
    // Posiciona o grupo no tabuleiro
    group.position.set(hitboxes[baseX][baseZ].centerX, 0, hitboxes[baseX][baseZ].centerZ);
    scene.add(group);
    barriers.push({
        mesh: group,
        type: 'random-piece',
        boardPositions: positions, // hitbox: cada célula ocupada
        hitboxes: hitboxMeshes
    });
    return true;
}

// Função para criar barreiras nos limites do tabuleiro
async function createBoundaryBarriers(scene, barriers, hitboxes) {    const FENCE_MODEL_LENGTH = 2; // Base fence model length
    const BOARD_CELLS_PER_SIDE = 20;
    const fenceScaleFactor = 3.9; // Much bigger scale factor for larger models
    const heightScale = 4.5; // Make fences much taller
    const thicknessScale = 3.9; // Make fences much thicker
    
    // Try to get theme-specific barrier model first
    let themeBarrier = null;
    try {
        themeBarrier = await getThemeBarrierModel();
    } catch (error) {
        console.warn('Could not load theme barrier for boundaries, will use default:', error);
    }

    // North Wall (top edge, z=-1, fences rotated 90° for horizontal unity)
    const northFences = [];
    for (let i = 0; i < BOARD_CELLS_PER_SIDE; i++) {
        try {
            // Use theme barrier if available, otherwise fallback to wooden fence
            const fence = themeBarrier ? themeBarrier.clone() : await createWoodenFenceModel();
            fence.position.set(i * FENCE_MODEL_LENGTH + FENCE_MODEL_LENGTH / 2, 0, -FENCE_MODEL_LENGTH / 2);
            fence.rotation.y = Math.PI / 2; // Rotate 90° for horizontal placement
            
            // If it's not a theme barrier already scaled, apply our custom scaling
            if (!fence.userData.themeBarrier) {
                fence.scale.x *= fenceScaleFactor; // Scale along length for unity
                fence.scale.y *= heightScale; // Make much taller
                fence.scale.z *= thicknessScale; // Make thicker
            }
            
            scene.add(fence);
            northFences.push(fence);
        } catch (error) {
            console.warn('Failed to create North fence segment:', error);
        }
    }
    barriers.push({ 
        meshes: northFences, 
        type: 'boundary', 
        position: 'north',
        boardPositions: Array.from({ length: BOARD_CELLS_PER_SIDE }, (_, i) => ({ x: i, z: -1 }))
    });    // South Wall (bottom edge, z=20, fences rotated 90° for horizontal unity)
    const southFences = [];
    for (let i = 0; i < BOARD_CELLS_PER_SIDE; i++) {
        try {
            // Use theme barrier if available, otherwise fallback to wooden fence
            const fence = themeBarrier ? themeBarrier.clone() : await createWoodenFenceModel();
            fence.position.set(i * FENCE_MODEL_LENGTH + FENCE_MODEL_LENGTH / 2, 0, BOARD_CELLS_PER_SIDE * FENCE_MODEL_LENGTH + FENCE_MODEL_LENGTH / 2);
            fence.rotation.y = Math.PI / 2; // Rotate 90° for horizontal placement
            // If it's not a theme barrier already scaled, apply our custom scaling
            if (!fence.userData.themeBarrier) {
                fence.scale.x *= fenceScaleFactor; // Scale along length for unity
                fence.scale.y *= heightScale; // Make much taller
                fence.scale.z *= thicknessScale; // Make thicker
            }
            scene.add(fence);
            southFences.push(fence);
        } catch (error) {
            console.warn('Failed to create South fence segment:', error);
        }
    }
    barriers.push({ 
        meshes: southFences, 
        type: 'boundary', 
        position: 'south',
        boardPositions: Array.from({ length: BOARD_CELLS_PER_SIDE }, (_, i) => ({ x: i, z: BOARD_CELLS_PER_SIDE }))
    });    // West Wall (left edge, x=-1, fences normal orientation for vertical unity)
    const westFences = [];
    for (let i = 0; i < BOARD_CELLS_PER_SIDE; i++) {
        try {
            // Use theme barrier if available, otherwise fallback to wooden fence
            const fence = themeBarrier ? themeBarrier.clone() : await createWoodenFenceModel();
            fence.position.set(-FENCE_MODEL_LENGTH / 2, 0, i * FENCE_MODEL_LENGTH + FENCE_MODEL_LENGTH / 2);
            fence.rotation.y = 0; // Keep normal orientation for vertical placement
            // If it's not a theme barrier already scaled, apply our custom scaling
            if (!fence.userData.themeBarrier) {
                fence.scale.x *= fenceScaleFactor; // Scale along length for unity
                fence.scale.y *= heightScale; // Make much taller
                fence.scale.z *= thicknessScale; // Make thicker
            }
            scene.add(fence);
            westFences.push(fence);
        } catch (error) {
            console.warn('Failed to create West fence segment:', error);
        }
    }
    barriers.push({ 
        meshes: westFences, 
        type: 'boundary', 
        position: 'west',
        boardPositions: Array.from({ length: BOARD_CELLS_PER_SIDE }, (_, i) => ({ x: -1, z: i }))
    });    // East Wall (right edge, x=20, fences normal orientation for vertical unity)
    const eastFences = [];
    for (let i = 0; i < BOARD_CELLS_PER_SIDE; i++) {
        try {
            // Use theme barrier if available, otherwise fallback to wooden fence
            const fence = themeBarrier ? themeBarrier.clone() : await createWoodenFenceModel();
            fence.position.set(BOARD_CELLS_PER_SIDE * FENCE_MODEL_LENGTH + FENCE_MODEL_LENGTH / 2, 0, i * FENCE_MODEL_LENGTH + FENCE_MODEL_LENGTH / 2);
            fence.rotation.y = 0; // Keep normal orientation for vertical placement
            // If it's not a theme barrier already scaled, apply our custom scaling
            if (!fence.userData.themeBarrier) {
                fence.scale.x *= fenceScaleFactor; // Scale along length for unity
                fence.scale.y *= heightScale; // Make much taller
                fence.scale.z *= thicknessScale; // Make thicker
            }
            scene.add(fence);
            eastFences.push(fence);
        } catch (error) {
            console.warn('Failed to create East fence segment:', error);
        }
    }
    barriers.push({ 
        meshes: eastFences, 
        type: 'boundary', 
        position: 'east',
        boardPositions: Array.from({ length: BOARD_CELLS_PER_SIDE }, (_, i) => ({ x: BOARD_CELLS_PER_SIDE, z: i }))
    });
}

// Função para criar barreiras complexas dentro do tabuleiro
async function createComplexBarriers(scene, barriers, snakeBoard, hitboxes) {
    // Materiais para barreiras complexas
    const barrierBaseMaterial = new THREE.MeshStandardMaterial({
        color: 0x777777,
        roughness: 0.5,
        metalness: 0.5
    });
    
    const barrierSlabMaterial = new THREE.MeshStandardMaterial({
        color: 0xaaaaaa,
        roughness: 0.3,
        metalness: 0.7,
        emissive: 0x222222
    });
    
    // Definir padrões para barreiras complexas
    const barrierPatterns = [
        // Linha diagonal
        [
            { x: 5, z: 5 },
            { x: 6, z: 6 },
            { x: 7, z: 7 },
            { x: 8, z: 8 }
        ],
        
        // Formato de L
        [
            { x: 15, z: 3 },
            { x: 15, z: 4 },
            { x: 15, z: 5 },
            { x: 16, z: 5 },
            { x: 17, z: 5 }
        ],
        
        // Formato de T
        [
            { x: 4, z: 15 },
            { x: 5, z: 15 },
            { x: 6, z: 15 },
            { x: 5, z: 16 },
            { x: 5, z: 17 }
        ],
        
        // Formato de Z
        [
            { x: 12, z: 12 },
            { x: 13, z: 12 },
            { x: 13, z: 13 },
            { x: 14, z: 13 }
        ],
        
        // Bloco isolado
        [
            { x: 9, z: 17 }
        ],
        
        // Pequena linha horizontal
        [
            { x: 2, z: 9 },
            { x: 3, z: 9 },
            { x: 4, z: 9 }
        ]
    ];
    
    // Para cada padrão, crie o conjunto de barreiras complexas usando fence models
    for (const pattern of barrierPatterns) {
        // Verifica se não colide com a cobra no início
        const isValidPattern = !pattern.some(pos => 
            snakeBoard.some(seg => seg.x === pos.x && seg.z === pos.z));
        
        if (isValidPattern) {
            for (const position of pattern) {
                const { x, z } = position;
                const { centerX, centerZ } = hitboxes[x][z];
                
                // Create wooden fence barrier instead of cubes
                await createWoodenFenceBarrier(scene, barriers, centerX, centerZ, x, z);
            }
        }
    }
}

// Função para criar uma barreira de cerca de madeira
async function createWoodenFenceBarrier(scene, barriers, centerX, centerZ, boardX, boardZ) {
    try {
        // Try to load theme-specific barrier model first
        let fence = await getThemeBarrierModel();
        let barrierType = 'theme-barrier';
        
        // If no themed model is available, fallback to the default wooden fence
        if (!fence) {
            fence = await createWoodenFenceModel();
            barrierType = 'wooden-fence';
        }
        
        // Position the fence at the center of the board cell
        fence.position.set(centerX, 0, centerZ);
        
        // Add random rotation for variety - less variation for more consistency
        fence.rotation.y = (Math.random() - 0.5) * Math.PI; // +/- 90 degrees
        
        // Apply shadow settings
        fence.traverse((child) => {
            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
            }
        });
        
        // Add to scene
        scene.add(fence);
        
        // Add to barriers array
        barriers.push({
            mesh: fence,
            type: 'complex',
            boardPosition: { x: boardX, z: boardZ },
            hitbox: { x: boardX, z: boardZ },
            centerX: centerX,
            centerZ: centerZ,
            model: barrierType,
            themeBarrier: fence.userData.themeBarrier || null
        });
        
    } catch (error) {
        console.warn('Failed to create themed barrier, using fallback:', error);
        // Fallback to original cube-based barrier
        createComplexBarrierStack(scene, barriers, centerX, centerZ, boardX, boardZ, 
            new THREE.MeshStandardMaterial({ color: 0x777777 }),
            new THREE.MeshStandardMaterial({ color: 0xaaaaaa })
        );
    }
}

// Função para verificar colisão entre a cobra e as barreiras
export function checkBarrierCollision(barriers, x, z) {
    // Verificar colisão com barreiras complexas
    const complexCollision = barriers.some(barrier => {
        if (barrier.type === 'complex') {
            return barrier.boardPosition.x === x && barrier.boardPosition.z === z;
        }
        return false;
    });
    
    if (complexCollision) return true;
    
    // Verificar colisão com barreiras de limite (fora do tabuleiro)
    const boundaryCollision = barriers.some(barrier => {
        if (barrier.type === 'boundary') {
            return barrier.boardPositions.some(pos => pos.x === x && pos.z === z);
        }
        return false;
    });
    
    return boundaryCollision;
}

// Função para remover as barreiras da cena
export function removeBarriers(scene, barriers) {
    barriers.forEach(barrier => {
        if (barrier.mesh) { // For single mesh barriers
            scene.remove(barrier.mesh);
        } else if (barrier.meshes) { // For multi-mesh barriers (like boundary fences)
            barrier.meshes.forEach(m => scene.remove(m));
        }
    });
}

// Função para adicionar pequenas animações às barreiras (opcional)
// Agora configurada para não ter animação (barreiras estáticas)
export function animateBarriers(barriers, time) {
    // Função mantida para compatibilidade, mas as barreiras agora são estáticas
    return;
}

// Cria uma peça única de barreira composta por 2 cubos e 1 slab, bem alinhada
export async function createRandomBarrierPiece(scene, barriers, usedPositions, hitboxes, pattern = null) {
    // Materiais
    const baseMaterial = new THREE.MeshStandardMaterial({
        color: 0x777777,
        roughness: 0.5,
        metalness: 0.5
    });
    const slabMaterial = new THREE.MeshStandardMaterial({
        color: 0xaaaaaa,
        roughness: 0.3,
        metalness: 0.7,
        emissive: 0x222222
    });

    // Usa pool centralizada de padrões
    if (!pattern) {
        pattern = randomPatterns[Math.floor(Math.random() * randomPatterns.length)];
    }

    // Tenta encontrar uma posição válida
    let attempts = 0;
    let baseX, baseZ;
    let positions;
    // Calcula limites para baseX/baseZ para padrões com dx/dz negativos
    const minDx = Math.min(...pattern.map(p => p.dx));
    const maxDx = Math.max(...pattern.map(p => p.dx));
    const minDz = Math.min(...pattern.map(p => p.dz));
    const maxDz = Math.max(...pattern.map(p => p.dz));
    do {
        baseX = Math.floor(Math.random() * (20 - (maxDx - minDx))) - minDx;
        baseZ = Math.floor(Math.random() * (20 - (maxDz - minDz))) - minDz;
        positions = pattern.map(p => ({x: baseX + p.dx, z: baseZ + p.dz})); // Fixed: use baseZ instead of baseX for z coordinate
        attempts++;
        // Verifica se todas as posições estão livres e dentro do tabuleiro
    } while (
        attempts < 100 && (
            positions.some(pos =>
                pos.x < 0 || pos.x > 19 || pos.z < 0 || pos.z > 19 ||
                usedPositions.some(u => u.x === pos.x && u.z === pos.z) ||
                snakeBoard.some(seg => seg.x === pos.x && seg.z === pos.z)
            )
        )
    );
    if (attempts >= 100) return false; // Não conseguiu posicionar

    // Marca posições como usadas
    positions.forEach(pos => usedPositions.push({x: pos.x, z: pos.z}));

    // Cria o grupo 3D
    const group = new THREE.Group();
    const hitboxMaterial = new THREE.MeshBasicMaterial({ visible: false });
    const hitboxMeshes = [];
    // For each block of the piece, create a themed barrier or wooden fence
    for (const pos of positions) {
        const {centerX, centerZ} = hitboxes[pos.x][pos.z];
          try {
            // Try to use theme-specific barrier first
            let fence = await getThemeBarrierModel();
            let barrierType = 'theme-barrier';
            
            // If no themed barrier available, use default wooden fence
            if (!fence) {
                fence = await createWoodenFenceModel();
                barrierType = 'wooden-fence';
            }
            
            // Position at cell center
            fence.position.set(centerX - hitboxes[baseX][baseZ].centerX, 0, centerZ - hitboxes[baseX][baseZ].centerZ);
            
            // Add controlled random rotation for more consistency
            fence.rotation.y = Math.PI * 0.5 * Math.floor(Math.random() * 4); // 0, 90, 180, or 270 degrees
              // Set appropriate scale based on barrier type
            if (!fence.userData.themeBarrier) {
                // For default barriers, use much bigger scaling
                fence.scale.multiplyScalar(1.95);
            }
            // Theme-specific barriers already have their scale set in getThemeBarrierModel
            
            // Apply shadow settings
            fence.traverse((child) => {
                if (child.isMesh) {
                    child.castShadow = true;
                    child.receiveShadow = true;
                }
            });
            
            group.add(fence);
        } catch (error) {
            // Fallback to cube if fence loading fails
            console.warn('Failed to create themed random barrier piece, using cube fallback:', error);            const cube = new THREE.Mesh(
                new THREE.BoxGeometry(4.2, 4.2, 4.2), // Much bigger cube size
                new THREE.MeshStandardMaterial({ color: 0x8B4513 }) // Brown color
            );
            cube.position.set(centerX - hitboxes[baseX][baseZ].centerX, 2.1, centerZ - hitboxes[baseX][baseZ].centerZ);
            cube.castShadow = true;
            cube.receiveShadow = true;
            group.add(cube);
        }
        
        // Add hitbox for collision detection
        const hitbox = new THREE.Mesh(
            new THREE.BoxGeometry(2, 2, 2),
            hitboxMaterial
        );
        hitbox.position.set(centerX - hitboxes[baseX][baseZ].centerX, 1, centerZ - hitboxes[baseX][baseZ].centerZ);
        group.add(hitbox);
        hitboxMeshes.push(hitbox);
    }
    // Opcional: adicionar uma slab no topo do primeiro bloco para variedade visual
    const {x: sx, z: sz} = positions[0];
    const {centerX: slabX, centerZ: slabZ} = hitboxes[sx][sz];    const slab = new THREE.Mesh(
        new THREE.BoxGeometry(3.9, 1.8, 3.9), // Much bigger slab size
        slabMaterial
    );
    slab.position.set(slabX - hitboxes[baseX][baseZ].centerX, 3.6, slabZ - hitboxes[baseX][baseZ].centerZ);
    group.add(slab);
    // Posiciona o grupo no tabuleiro
    group.position.set(hitboxes[baseX][baseZ].centerX, 0, hitboxes[baseX][baseZ].centerZ);
    scene.add(group);
    barriers.push({
        mesh: group,
        type: 'random-piece',
        boardPositions: positions, // hitbox: cada célula ocupada
        hitboxes: hitboxMeshes
    });
    return true;
}
