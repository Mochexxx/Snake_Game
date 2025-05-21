// random-barriers.js
// Responsável por criar barreiras aleatórias usando a pool de formas

import { barrierShapes, getRandomShape, placeShapeAt, checkCollision } from './barrier-shapes.js';
import { getBoardCellCenter } from './scene.js';

// Configuração global
const GRID_SIZE = 20; // Tamanho do grid 20x20
const TARGET_CELL_COUNT = 70; // Número de células que queremos ocupar (reduzido para evitar saturação do mapa)

// Cria aproximadamente 70 células de barreiras com formas aleatórias
export function createRandomBarriers(scene, snakeBoard, hitboxes) {
    const barriers = [];
    const occupiedPositions = [];
    
    // Incluir posição inicial da cobra para evitar obstáculos ali
    // Assumindo que a cobra começa no centro (10,10) e adjacentes
    const initialSnakePositions = [
        [10, 10], [9, 10], [8, 10]
    ];
    occupiedPositions.push(...initialSnakePositions);
    
    // Contagem de células ocupadas
    let cellCount = 0;
    
    // Materiais para as barreiras (similar ao estilo das barreiras normais)
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

    // Continuar adicionando formas até atingir aproximadamente o número desejado de células
    while (cellCount < TARGET_CELL_COUNT) {
        // Obter uma forma aleatória da pool
        const shape = getRandomShape();
        
        // Determinar o tamanho máximo da forma
        const maxX = Math.max(...shape.map(point => point[0]));
        const maxY = Math.max(...shape.map(point => point[1]));
        
        // Gerar uma posição aleatória dentro dos limites do tabuleiro
        const baseX = Math.floor(Math.random() * (GRID_SIZE - maxX - 1));
        const baseZ = Math.floor(Math.random() * (GRID_SIZE - maxY - 1));
        
        // Colocar a forma na posição
        const placedShape = placeShapeAt(shape, baseX, baseZ);
        
        // Verificar se a forma colide com posições ocupadas
        if (!checkCollision(placedShape, occupiedPositions)) {
            // Adicionar cada célula da forma como uma barreira
            const shapeBoardPositions = [];
            const shapeMeshes = [];
            
            placedShape.forEach(point => {
                const [x, z] = point;
                
                // Obter o centro da célula no tabuleiro
                const cellCenter = getBoardCellCenter(x, z);
                
                // Criar barreira com o estilo de cubos empilhados com slab
                const baseSize = 1.8; // Tamanho um pouco menor que a célula (2) para dar espaço visual
                const stackHeight = 2; // Quantidade de cubos empilhados
                const baseGroup = new THREE.Group();
                
                // Criar cubos empilhados
                for (let i = 0; i < stackHeight; i++) {
                    const cube = new THREE.Mesh(
                        new THREE.BoxGeometry(baseSize, baseSize, baseSize),
                        barrierBaseMaterial
                    );
                    cube.position.set(0, baseSize/2 + i*baseSize, 0);
                    baseGroup.add(cube);
                }
                
                // Criar a meia-laje no topo
                const slab = new THREE.Mesh(
                    new THREE.BoxGeometry(baseSize + 0.3, baseSize/2, baseSize + 0.3), // Um pouco maior que a base para destaque visual
                    barrierSlabMaterial
                );
                slab.position.set(0, stackHeight*baseSize + baseSize/4, 0);
                baseGroup.add(slab);
                
                // Posicionar o grupo na célula do tabuleiro
                baseGroup.position.set(cellCenter.x, 0, cellCenter.z);
                
                // Adicionar pequena rotação aleatória para variedade visual
                baseGroup.rotation.y = (Math.random() - 0.5) * 0.2;
                
                // Adicionar à cena
                scene.add(baseGroup);
                shapeMeshes.push(baseGroup);
                
                // Adicionar à lista de posições ocupadas e rastrear para a barreira
                occupiedPositions.push([x, z]);
                shapeBoardPositions.push({ x, z });
                
                // Atualizar contagem
                cellCount++;
            });
            
            // Adicionar a barreira completa ao array de barreiras
            barriers.push({
                meshes: shapeMeshes,
                type: 'random',
                boardPositions: shapeBoardPositions,
                basePosition: { x: baseX, z: baseZ },
                originalShape: shape
            });
            
            // Adicionar hitboxes para esta barreira se necessário
            if (hitboxes) {
                placedShape.forEach(point => {
                    const [x, z] = point;
                    const cellCenter = getBoardCellCenter(x, z);
                    if (!hitboxes.find(h => h.x === x && h.z === z)) {
                        hitboxes.push({ x, z, position: new THREE.Vector3(cellCenter.x, 0, cellCenter.z) });
                    }
                });
            }
        }
        
        // Se já tivermos o suficiente de células, sair do loop
        if (cellCount >= TARGET_CELL_COUNT) {
            break;
        }
    }
    
    // Registrar quantas células foram criadas
    console.log(`Criadas ${cellCount} células de barreiras aleatórias`);
    
    return barriers;
}

// Limpar barreiras aleatórias da cena
export function removeRandomBarriers(scene, barriers) {
    // Remover apenas barreiras do tipo 'random'
    const randomBarriers = barriers.filter(barrier => barrier.type === 'random');
    
    randomBarriers.forEach(barrier => {
        // Remover todos os meshes desta barreira
        if (barrier.meshes) {
            barrier.meshes.forEach(mesh => {
                if (mesh && scene.children.includes(mesh)) {
                    scene.remove(mesh);
                    if (mesh.geometry) mesh.geometry.dispose();
                    if (mesh.material) mesh.material.dispose();
                }
            });
        }
    });
    
    // Retornar apenas as barreiras que não são do tipo 'random'
    return barriers.filter(barrier => barrier.type !== 'random');
}

// Verificar colisão com as barreiras aleatórias
export function checkRandomBarrierCollision(headPosition, barriers) {
    // Verificamos apenas para barreiras do tipo 'random'
    const randomBarriers = barriers.filter(barrier => barrier.type === 'random');
    
    for (const barrier of randomBarriers) {
        for (const pos of barrier.boardPositions) {
            if (headPosition.x === pos.x && headPosition.z === pos.z) {
                return true; // Houve colisão
            }
        }
    }
    
    return false; // Não houve colisão
}

// Animar barreiras aleatórias (opcional)
export function animateRandomBarriers(barriers, time) {
    const randomBarriers = barriers.filter(barrier => barrier.type === 'random');
    
    randomBarriers.forEach(barrier => {
        if (barrier.meshes) {
            barrier.meshes.forEach(mesh => {
                if (mesh) {
                    // Animação simples - leve rotação
                    mesh.rotation.y = (mesh.rotation.y % (Math.PI * 2)) + 0.003;
                }
            });
        }
    });
}
