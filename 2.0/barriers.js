// barriers.js
// Responsável por criar e gerenciar barreiras no modo "barriers"
import * as THREE from 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.module.js';

// Criação das barreiras para o modo "barriers"
export function createBarriers(scene, snakeBoard, hitboxes) {
    const barriers = [];
    
    // Criar barreiras em torno do tabuleiro (limites do jogo)
    // Paredes norte, sul, leste e oeste
    createBoundaryBarriers(scene, barriers, hitboxes);
    
    // Criar alguns obstáculos complexos dentro do tabuleiro
    createComplexBarriers(scene, barriers, snakeBoard, hitboxes);
    
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
    
    // Posicionar o conjunto completo na célula correta do tabuleiro
    baseGroup.position.set(centerX, 0, centerZ);
    
    // Adicionar à cena e ao array de barreiras
    scene.add(baseGroup);
    barriers.push({
        mesh: baseGroup,
        type: 'complex',
        boardPosition: { x: boardX, z: boardZ }
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
export function animateBarriers(barriers, time) {
    if (!barriers || barriers.length === 0) return;
    
    // Anima apenas as barreiras complexas
    barriers.forEach(barrier => {
        if (barrier.type === 'complex' && barrier.mesh) {
            // Pulso sutil na altura
            const pulseFactor = Math.sin(time * 0.002) * 0.1;
            barrier.mesh.scale.y = 1 + pulseFactor;
            
            // Pequena rotação
            barrier.mesh.rotation.y += 0.001;
        }
    });
}
