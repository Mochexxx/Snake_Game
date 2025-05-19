// campaign.js
// Responsável por gerenciar o modo campanha com níveis progressivos

import { getBoardCellCenter } from './scene.js';
import { createBarriers, removeBarriers } from './barriers.js';

// Estrutura para armazenar definições dos níveis
export const campaignLevels = [
    {
        level: 1,
        name: "Iniciante",
        description: "Sua jornada começa! Colete 10 maçãs.",
        barrierCount: 3,
        targetApples: 10
    },
    {
        level: 2,
        name: "Aprendiz",
        description: "Mais obstáculos para superar. Colete 10 maçãs.",
        barrierCount: 5,
        targetApples: 10
    },
    {
        level: 3,
        name: "Explorador",
        description: "O caminho fica mais estreito. Colete 10 maçãs.",
        barrierCount: 8,
        targetApples: 10
    },
    {
        level: 4,
        name: "Aventureiro",
        description: "Agora as coisas ficam mais desafiadoras. Colete 10 maçãs.",
        barrierCount: 10,
        targetApples: 10
    },
    {
        level: 5,
        name: "Caçador",
        description: "Metade do caminho. Continue focado! Colete 10 maçãs.",
        barrierCount: 12,
        targetApples: 10
    },
    {
        level: 6,
        name: "Guerreiro",
        description: "A serpente se torna um guerreiro. Colete 10 maçãs.",
        barrierCount: 15,
        targetApples: 10
    },
    {
        level: 7,
        name: "Mestre",
        description: "Habilidade e estratégia são essenciais agora. Colete 10 maçãs.",
        barrierCount: 18,
        targetApples: 10
    },
    {
        level: 8,
        name: "Estrategista",
        description: "Planeje seus movimentos com cuidado. Colete 10 maçãs.",
        barrierCount: 22,
        targetApples: 10
    },
    {
        level: 9,
        name: "Lendário",
        description: "Quase lá! O desafio é intenso. Colete 10 maçãs.",
        barrierCount: 25,
        targetApples: 10
    },
    {
        level: 10,
        name: "Desafiante Final",
        description: "O labirinto final! Supere este último desafio. Colete 10 maçãs.",
        barrierCount: 30,
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
    return campaignLevels[currentLevel - 1];
}

// Função para gerar barreiras baseadas no nível atual
export function createCampaignBarriers(scene, snakeBoard, hitboxes) {
    const levelInfo = getLevelInfo();
    return createCustomBarriers(scene, snakeBoard, hitboxes, levelInfo.barrierCount);
}

// Função para criar um número específico de barreiras complexas
function createCustomBarriers(scene, snakeBoard, hitboxes, count) {
    const barriers = [];
    
    // Criar barreiras em torno do tabuleiro (limites do jogo)
    createBoundaryBarriers(scene, barriers, hitboxes);
    
    // Criar obstáculos complexos dentro do tabuleiro
    createCampaignComplexBarriers(scene, barriers, snakeBoard, hitboxes, count);
    
    return barriers;
}

// Função para criar barreiras nos limites do tabuleiro
function createBoundaryBarriers(scene, barriers, hitboxes) {
    // Materiais para as barreiras
    const barrierMaterial = new THREE.MeshStandardMaterial({
        color: 0x444444,
        roughness: 0.7,
        metalness: 0.2,
        emissive: 0x222222
    });
    
    // Criar paredes nos limites do tabuleiro
    const wallHeight = 3;
    const wallThickness = 1;
    
    // Parede Norte (z = 0)
    const northWall = new THREE.Mesh(
        new THREE.BoxGeometry(40, wallHeight, wallThickness),
        barrierMaterial
    );
    northWall.position.set(20, wallHeight / 2, -wallThickness / 2);
    scene.add(northWall);
    barriers.push({ 
        mesh: northWall, 
        type: 'boundary', 
        position: 'north',
        boardPositions: Array.from({ length: 20 }, (_, i) => ({ x: i, z: -1 }))
    });
    
    // Parede Sul (z = 20)
    const southWall = new THREE.Mesh(
        new THREE.BoxGeometry(40, wallHeight, wallThickness),
        barrierMaterial
    );
    southWall.position.set(20, wallHeight / 2, 40 + wallThickness / 2);
    scene.add(southWall);
    barriers.push({ 
        mesh: southWall, 
        type: 'boundary', 
        position: 'south',
        boardPositions: Array.from({ length: 20 }, (_, i) => ({ x: i, z: 20 }))
    });
    
    // Parede Leste (x = 20)
    const eastWall = new THREE.Mesh(
        new THREE.BoxGeometry(wallThickness, wallHeight, 40),
        barrierMaterial
    );
    eastWall.position.set(40 + wallThickness / 2, wallHeight / 2, 20);
    scene.add(eastWall);
    barriers.push({ 
        mesh: eastWall, 
        type: 'boundary', 
        position: 'east',
        boardPositions: Array.from({ length: 20 }, (_, i) => ({ x: 20, z: i }))
    });
    
    // Parede Oeste (x = 0)
    const westWall = new THREE.Mesh(
        new THREE.BoxGeometry(wallThickness, wallHeight, 40),
        barrierMaterial
    );
    westWall.position.set(-wallThickness / 2, wallHeight / 2, 20);
    scene.add(westWall);
    barriers.push({ 
        mesh: westWall, 
        type: 'boundary', 
        position: 'west',
        boardPositions: Array.from({ length: 20 }, (_, i) => ({ x: -1, z: i }))
    });
}

// Função para criar barreiras complexas para o modo campanha
function createCampaignComplexBarriers(scene, barriers, snakeBoard, hitboxes, count) {
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
        if (barrierPositions.some(pos => pos.x === x && pos.z === z)) {
            continue;
        }
        
        // Verifica se a posição está ocupada pela cobra
        if (snakeBoard.some(segment => segment.x === x && segment.z === z)) {
            continue;
        }
        
        // Evita colocar barreiras muito próximas à cabeça da cobra
        if (isPositionNearSnakeHead(snakeBoard[0], x, z, 3)) {
            continue;
        }
        
        barrierPositions.push({ x, z });
    }
    
    // Cria as barreiras complexas nas posições geradas
    for (const position of barrierPositions) {
        const { x, z } = position;
        const { centerX, centerZ } = hitboxes[x][z];
        
        // Criar o conjunto de cubos empilhados com meia-laje no topo
        createComplexBarrierStack(scene, barriers, centerX, centerZ, x, z, barrierBaseMaterial, barrierSlabMaterial);
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
function createComplexBarrierStack(scene, barriers, centerX, centerZ, boardX, boardZ, baseMaterial, slabMaterial) {
    const baseSize = 1.8; // Tamanho um pouco menor que a célula (2) para dar espaço visual
    const stackHeight = 2; // Quantidade de cubos empilhados
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
        new THREE.BoxGeometry(baseSize + 0.3, baseSize/2, baseSize + 0.3), // Um pouco maior que a base para destaque visual
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
        boardPosition: { x: boardX, z: boardZ }
    });
}

// Exibir informações do nível atual
export function showLevelInfo(levelInfo) {
    // Implementar a exibição na interface (pode ser sobrescrito pelo código no main.js)
    console.log(`Nível ${levelInfo.level}: ${levelInfo.name}`);
    console.log(levelInfo.description);
    console.log(`Objetivo: Coletar ${levelInfo.targetApples} maçãs`);
}
