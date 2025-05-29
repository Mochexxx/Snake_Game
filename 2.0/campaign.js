// campaign.js
// Responsável por gerenciar o modo campanha com níveis progressivos
import * as THREE from 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.module.js';
import { getBoardCellCenter } from './scene.js';
import { createBarriers, removeBarriers } from './barriers.js';
import { createWoodenFenceModel, createRockModel } from './model-loader.js';

// Estrutura para armazenar definições dos níveis
export const campaignLevels = [
    {
        level: 1,
        name: "Iniciante",
        description: "Sua jornada começa! Colete 10 maçãs.",
        barrierCount: 5,
        targetApples: 10
    },
    {
        level: 2,
        name: "Aprendiz",
        description: "Mais obstáculos para superar. Colete 10 maçãs.",
        barrierCount: 7,
        targetApples: 10
    },
    {
        level: 3,
        name: "Explorador",
        description: "O caminho fica mais estreito. Colete 10 maçãs.",
        barrierCount: 10,
        targetApples: 10
    },
    {
        level: 4,
        name: "Aventureiro",
        description: "Agora as coisas ficam mais desafiadoras. Colete 10 maçãs.",
        barrierCount: 12,
        targetApples: 10
    },
    {
        level: 5,
        name: "Caçador",
        description: "Metade do caminho. Continue focado! Colete 10 maçãs.",
        barrierCount: 14,
        targetApples: 10
    },
    {
        level: 6,
        name: "Guerreiro",
        description: "A serpente se torna um guerreiro. Colete 10 maçãs.",
        barrierCount: 17,
        targetApples: 10
    },
    {
        level: 7,
        name: "Mestre",
        description: "Habilidade e estratégia são essenciais agora. Colete 10 maçãs.",
        barrierCount: 20,
        targetApples: 10
    },
    {
        level: 8,
        name: "Estrategista",
        description: "Planeje seus movimentos com cuidado. Colete 10 maçãs.",
        barrierCount: 24,
        targetApples: 10
    },
    {
        level: 9,
        name: "Lendário",
        description: "Quase lá! O desafio é intenso. Colete 10 maçãs.",
        barrierCount: 27,
        targetApples: 10
    },
    {
        level: 10,
        name: "Desafiante Final",
        description: "O labirinto final! Supere este último desafio. Colete 10 maçãs.",
        barrierCount: 32,
        targetApples: 10
    }
];

// Importar todas as funções necessárias do campaign-menu
import { getCurrentLevel as getCampaignMenuLevel, setCurrentLevel, resetCampaignProgress } from './campaign-menu.js';

// Função para obter o nível atual
export function getCurrentLevel() {
    return getCampaignMenuLevel();
}

// Função para configurar o próximo nível
export function nextLevel() {
    const currentLevel = getCurrentLevel();
    if (currentLevel < campaignLevels.length) {
        // Use the imported setCurrentLevel function
        const nextLevelNum = currentLevel + 1;
        setCurrentLevel(nextLevelNum);
        return campaignLevels[nextLevelNum - 1];
    } else {
        // Completou todos os níveis
        return null;
    }
}

// Função para resetar o progresso da campanha
export function resetCampaign() {
    // Use the imported resetCampaignProgress function
    resetCampaignProgress();
    return campaignLevels[0];
}

// Função para obter informações do nível atual
export function getLevelInfo() {
    const currentLevel = getCurrentLevel();
    // Ensure currentLevel is within bounds
    if (currentLevel > 0 && currentLevel <= campaignLevels.length) {
        return campaignLevels[currentLevel - 1];
    }
    // Fallback to first level if currentLevel is invalid
    console.warn(`Invalid campaign level: ${currentLevel}. Defaulting to level 1.`);
    return campaignLevels[0];
}

// Função para gerar barreiras baseadas no nível atual
export async function createCampaignBarriers(scene, snakeBoard, hitboxes) {
    const levelInfo = getLevelInfo();
    return createCustomBarriers(scene, snakeBoard, hitboxes, levelInfo.barrierCount);
}

// Função para criar um número específico de barreiras complexas
async function createCustomBarriers(scene, snakeBoard, hitboxes, count) {
    const barriers = [];
    
    // Criar barreiras em torno do tabuleiro (limites do jogo)
    await createBoundaryBarriers(scene, barriers, hitboxes);
    
    // Criar obstáculos complexos dentro do tabuleiro
    await createCampaignComplexBarriers(scene, barriers, snakeBoard, hitboxes, count);
    
    return barriers;
}

// Função para criar barreiras nos limites do tabuleiro
async function createBoundaryBarriers(scene, barriers, hitboxes) {
    const FENCE_MODEL_LENGTH = 2; // Base fence model length
    const BOARD_CELLS_PER_SIDE = 20;
    const fenceScaleFactor = 1.95; // Much bigger scale factor for larger models
    const heightScale = 2.25; // Make fences much taller
    const thicknessScale = 1.95; // Make fences thicker

    // North Wall (top edge, z=-1, fences rotated 90° for horizontal unity)
    const northFences = [];
    for (let i = 0; i < BOARD_CELLS_PER_SIDE; i++) {
        try {
            const fence = await createWoodenFenceModel();
            fence.position.set(i * FENCE_MODEL_LENGTH + FENCE_MODEL_LENGTH / 2, 0, -FENCE_MODEL_LENGTH / 2);
            fence.rotation.y = Math.PI / 2; // Rotate 90° for horizontal placement
            fence.scale.x *= fenceScaleFactor; // Scale along length for unity
            fence.scale.y *= heightScale; // Make much taller
            fence.scale.z *= thicknessScale; // Make thicker
            scene.add(fence);
            northFences.push(fence);
        } catch (error) {
            console.warn('Failed to create North fence segment for campaign:', error);
        }
    }
    barriers.push({ 
        meshes: northFences, 
        type: 'boundary', 
        position: 'north',
        boardPositions: Array.from({ length: BOARD_CELLS_PER_SIDE }, (_, i) => ({ x: i, z: -1 })),
        hitboxes: Array.from({ length: BOARD_CELLS_PER_SIDE }, (_, i) => ({ x: i, z: -1 }))
    });

    // South Wall (bottom edge, z=20, fences rotated 90° for horizontal unity)
    const southFences = [];
    for (let i = 0; i < BOARD_CELLS_PER_SIDE; i++) {
        try {
            const fence = await createWoodenFenceModel();
            fence.position.set(i * FENCE_MODEL_LENGTH + FENCE_MODEL_LENGTH / 2, 0, BOARD_CELLS_PER_SIDE * FENCE_MODEL_LENGTH + FENCE_MODEL_LENGTH / 2);
            fence.rotation.y = Math.PI / 2; // Rotate 90° for horizontal placement
            fence.scale.x *= fenceScaleFactor; // Scale along length for unity
            fence.scale.y *= heightScale; // Make much taller
            fence.scale.z *= thicknessScale; // Make thicker
            scene.add(fence);
            southFences.push(fence);
        } catch (error) {
            console.warn('Failed to create South fence segment for campaign:', error);
        }
    }
    barriers.push({ 
        meshes: southFences, 
        type: 'boundary', 
        position: 'south',
        boardPositions: Array.from({ length: BOARD_CELLS_PER_SIDE }, (_, i) => ({ x: i, z: BOARD_CELLS_PER_SIDE })),
        hitboxes: Array.from({ length: BOARD_CELLS_PER_SIDE }, (_, i) => ({ x: i, z: BOARD_CELLS_PER_SIDE }))
    });

    // West Wall (left edge, x=-1, fences normal orientation for vertical unity)
    const westFences = [];
    for (let i = 0; i < BOARD_CELLS_PER_SIDE; i++) {
        try {
            const fence = await createWoodenFenceModel();
            fence.position.set(-FENCE_MODEL_LENGTH / 2, 0, i * FENCE_MODEL_LENGTH + FENCE_MODEL_LENGTH / 2);
            fence.rotation.y = 0; // Keep normal orientation for vertical placement
            fence.scale.x *= fenceScaleFactor; // Scale along length for unity
            fence.scale.y *= heightScale; // Make much taller
            fence.scale.z *= thicknessScale; // Make thicker
            scene.add(fence);
            westFences.push(fence);
        } catch (error) {
            console.warn('Failed to create West fence segment for campaign:', error);
        }
    }
    barriers.push({ 
        meshes: westFences, 
        type: 'boundary', 
        position: 'west',
        boardPositions: Array.from({ length: BOARD_CELLS_PER_SIDE }, (_, i) => ({ x: -1, z: i })),
        hitboxes: Array.from({ length: BOARD_CELLS_PER_SIDE }, (_, i) => ({ x: -1, z: i }))
    });
    
    // East Wall (right edge, x=20, fences normal orientation for vertical unity)
    const eastFences = [];
    for (let i = 0; i < BOARD_CELLS_PER_SIDE; i++) {
        try {
            const fence = await createWoodenFenceModel();
            fence.position.set(BOARD_CELLS_PER_SIDE * FENCE_MODEL_LENGTH + FENCE_MODEL_LENGTH / 2, 0, i * FENCE_MODEL_LENGTH + FENCE_MODEL_LENGTH / 2);
            fence.rotation.y = 0; // Keep normal orientation for vertical placement
            fence.scale.x *= fenceScaleFactor; // Scale along length for unity
            fence.scale.y *= heightScale; // Make much taller
            fence.scale.z *= thicknessScale; // Make thicker
            scene.add(fence);
            eastFences.push(fence);
        } catch (error) {
            console.warn('Failed to create East fence segment for campaign:', error);
        }
    }
    barriers.push({ 
        meshes: eastFences, 
        type: 'boundary', 
        position: 'east',
        boardPositions: Array.from({ length: BOARD_CELLS_PER_SIDE }, (_, i) => ({ x: BOARD_CELLS_PER_SIDE, z: i })),
        hitboxes: Array.from({ length: BOARD_CELLS_PER_SIDE }, (_, i) => ({ x: BOARD_CELLS_PER_SIDE, z: i }))
    });
}

// Função para criar barreiras complexas para o modo campanha
async function createCampaignComplexBarriers(scene, barriers, snakeBoard, hitboxes, count) {
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
    
    // Gera posições aleatórias para barreiras individuais com base no nível
    const barrierPositions = [];
    let attempts = 0;
    const maxAttempts = 1000; // Evitar loop infinito
    
    // Tenta gerar o número especificado de barreiras
    while (barrierPositions.length < count && attempts < maxAttempts) {
        attempts++;
        
        const x = Math.floor(Math.random() * 20);
        const z = Math.floor(Math.random() * 20);
        
        // Verifica se a posição já está ocupada por outra barreira
        const isOccupiedByBarrier = barrierPositions.some(pos => pos.x === x && pos.z === z);
        
        // Verifica se a posição está na cobra
        const isOnSnake = snakeBoard.some(seg => seg.x === x && seg.z === z);
        
        // Verifica se a posição está muito próxima da cabeça da cobra (para evitar barreiras iniciais impossíveis)
        const snakeHeadPos = snakeBoard.length > 0 ? snakeBoard[0] : null; // Assume snakeBoard[0] is the head
        const isNearHead = isPositionNearSnakeHead(snakeHeadPos, x, z, 3); // Check proximity (e.g., 3 cells)

        if (!isOccupiedByBarrier && !isOnSnake && !isNearHead) {
            // Posição válida, adiciona a barreira
            barrierPositions.push({ x, z });
            
            // Obtém o centro da célula para posicionar a barreira
            const { centerX, centerZ } = getBoardCellCenter(x, z, hitboxes);
            
            // Criar o conjunto de barreiras
            await createComplexBarrierStack(scene, barriers, centerX, centerZ, x, z, barrierBaseMaterial, barrierSlabMaterial);
        }
    }
}

// Verifica se a posição está próxima da cabeça da cobra
function isPositionNearSnakeHead(head, x, z, distance) {
    if (!head) return false;
    const dx = Math.abs(head.x - x);
    const dz = Math.abs(head.z - z);
    return dx <= distance && dz <= distance;
}

// Função para criar uma barreira complexa (cubos empilhados com meia-laje no topo)
async function createComplexBarrierStack(scene, barriers, centerX, centerZ, boardX, boardZ, baseMaterial, slabMaterial) {
    // recalculates center coordinates to ensure correct placement
    const CELL_SIZE = 2;
    centerX = boardX * CELL_SIZE + CELL_SIZE / 2;
    centerZ = boardZ * CELL_SIZE + CELL_SIZE / 2;
    // use farm model at board center
    try {
        // Try to use wooden fence model first
        const fence = await createRockModel();
        
        // Position the fence at the center of the board cell
        fence.position.set(centerX, 0, centerZ);
        
        // Add slight random rotation for variety
        fence.rotation.y = (Math.random() - 0.5) * 0.4;
          // Scale up the campaign barriers to match the enhanced barrier system
        fence.scale.multiplyScalar(2.1); // Much bigger to match new barriers.js scaling
        
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
            model: 'rock'
        });
        
    } catch (error) {
        console.warn('Failed to create wooden fence, using fallback cubes:', error);
          // Fallback to original cube-based implementation with larger sizes to match barriers.js
        const baseSize = 3.6; // Much bigger to match new barriers.js fallback sizing
        const stackHeight = 2;
        const baseGroup = new THREE.Group();
        
        // Criar cubos empilhados
        for (let i = 0; i < stackHeight; i++) {
            const cube = new THREE.Mesh(
                new THREE.BoxGeometry(baseSize, baseSize, baseSize),
                baseMaterial
            );
            cube.position.set(0, baseSize/2 + i*baseSize, 0);
            baseGroup.add(cube);
        }
        
        // Criar a meia-laje no topo
        const slab = new THREE.Mesh(
            new THREE.BoxGeometry(baseSize + 0.6, baseSize/2, baseSize + 0.6), // Increased slab size to match barriers.js
            slabMaterial
        );
        slab.position.set(0, stackHeight*baseSize + baseSize/4, 0);
        baseGroup.add(slab);
        
        // Posicionar o conjunto completo na célula correta do tabuleiro
        baseGroup.position.set(centerX, 0, centerZ);
        
        // Adicionar à cena e ao array de barreiras
        scene.add(baseGroup);
        barriers.push({
            mesh: baseGroup,
            type: 'complex',
            boardPosition: { x: boardX, z: boardZ },
            hitbox: { x: boardX, z: boardZ },
            centerX: centerX,
            centerZ: centerZ,
            model: 'fallback-cubes'
        });
    }
}

// Exibir informações do nível atual
export function showLevelInfo(levelInfo) {
    // Implementar a exibição na interface (pode ser sobrescrito pelo código no main.js)
    console.log(`Nível ${levelInfo.level}: ${levelInfo.name}`);
    console.log(levelInfo.description);
    console.log(`Objetivo: Coletar ${levelInfo.targetApples} maçãs`);
}

// Add new function to check campaign barrier collisions
export function checkCampaignBarrierCollision(newX, newZ, barriers) {
    if (!barriers || barriers.length === 0) {
        return false;
    }
    
    for (let i = 0; i < barriers.length; i++) {
        const barrier = barriers[i];
        
        // Check boundary barriers
        if (barrier.type === 'boundary') {
            if (barrier.boardPositions && barrier.boardPositions.some(pos => pos.x === newX && pos.z === newZ)) {
                return true;
            }
        }
        
        // Check complex barriers
        if (barrier.type === 'complex' && barrier.boardPosition) {
            if (barrier.boardPosition.x === newX && barrier.boardPosition.z === newZ) {
                return true;
            }
        }
    }
    
    return false;
}
