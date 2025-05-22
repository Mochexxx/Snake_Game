// barriers.js
// Responsável por criar e gerenciar barreiras no modo "barriers"

import { getBoardCellCenter } from './scene.js';
import { randomPatterns } from './barrier-shapes.js';

// Criação das barreiras para o modo "barriers"
export function createBarriers(scene, snakeBoard, hitboxes) {
    const barriers = [];
    
    // Criar barreiras em torno do tabuleiro (limites do jogo)
    createBoundaryBarriers(scene, barriers, hitboxes);
    
    // Remover barreiras no meio para modo padrão
    // createComplexBarriers(scene, barriers, snakeBoard, hitboxes);
    
    return barriers;
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
    while (criadas < maxPecas && tentativas < maxPecas * 30) {
        tentativas++;
        // Seleciona padrão embaralhado
        const pattern = shuffledPatterns[patternIndex % shuffledPatterns.length];
        patternIndex++;
        // Gera uma peça candidata
        const tempBarriers = [];
        const ok = createRandomBarrierPiece(scene, tempBarriers, usedPositions, hitboxes, snakeBoard, pattern);
        if (!ok) continue;
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
        } else {
            tempBarriers.forEach(b => scene.remove(b.mesh));
        }
    }
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

// Função para criar barreiras complexas dentro do tabuleiro
function createComplexBarriers(scene, barriers, snakeBoard, hitboxes) {
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
    
    // Para cada padrão, crie o conjunto de barreiras complexas
    for (const pattern of barrierPatterns) {
        // Verifica se não colide com a cobra no início
        const isValidPattern = !pattern.some(pos => 
            snakeBoard.some(seg => seg.x === pos.x && seg.z === pos.z));
        
        if (isValidPattern) {
            for (const position of pattern) {
                const { x, z } = position;
                const { centerX, centerZ } = hitboxes[x][z];
                
                // Criar o conjunto de cubos empilhados com meia-laje no topo
                createComplexBarrierStack(scene, barriers, centerX, centerZ, x, z, barrierBaseMaterial, barrierSlabMaterial);
            }
        }
    }
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
    // Adiciona hitbox invisível para a célula ocupada
    const hitboxMaterial = new THREE.MeshBasicMaterial({ visible: false });
    const hitboxMesh = new THREE.Mesh(
        new THREE.BoxGeometry(2, 2, 2),
        hitboxMaterial
    );
    hitboxMesh.position.set(0, 1, 0); // Centralizado na célula
    baseGroup.add(hitboxMesh);
    // Posicionar o conjunto completo na célula correta do tabuleiro
    baseGroup.position.set(centerX, 0, centerZ);
    // Adicionar à cena e ao array de barreiras
    scene.add(baseGroup);
    barriers.push({
        mesh: baseGroup,
        type: 'complex',
        boardPosition: { x: boardX, z: boardZ },
        hitboxes: [hitboxMesh]
    });
    // Adicionar pequena rotação aleatória para variedade visual
    baseGroup.rotation.y = (Math.random() - 0.5) * 0.2;
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
        scene.remove(barrier.mesh);
    });
}

// Função para adicionar pequenas animações às barreiras (opcional)
// Agora configurada para não ter animação (barreiras estáticas)
export function animateBarriers(barriers, time) {
    // Função mantida para compatibilidade, mas as barreiras agora são estáticas
    return;
}

// Cria uma peça única de barreira composta por 2 cubos e 1 slab, bem alinhada
export function createRandomBarrierPiece(scene, barriers, usedPositions, hitboxes, snakeBoard, pattern = null) {
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
        positions = pattern.map(p => ({x: baseX + p.dx, z: baseX + p.dz}));
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
    // Para cada bloco da peça, cria um cubo do tamanho de uma célula
    positions.forEach((pos, idx) => {
        const {centerX, centerZ} = hitboxes[pos.x][pos.z];
        const cube = new THREE.Mesh(
            new THREE.BoxGeometry(2, 2, 2),
            baseMaterial
        );
        cube.position.set(centerX - hitboxes[baseX][baseZ].centerX, 1, centerZ - hitboxes[baseX][baseZ].centerZ);
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
    const {centerX: slabX, centerZ: slabZ} = hitboxes[sx][sz];
    const slab = new THREE.Mesh(
        new THREE.BoxGeometry(2.1, 0.9, 2.1),
        slabMaterial
    );
    slab.position.set(slabX - hitboxes[baseX][baseZ].centerX, 1.95, slabZ - hitboxes[baseX][baseZ].centerZ);
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
