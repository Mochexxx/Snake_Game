import * as THREE from 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.module.js';

import { getBoardCellCenter, generateBoardHitboxes } from './scene.js';

// Snake.js
// Responsável por criar e controlar a cobra

export function createSnake(scene) {
    const snake = [];
    const cubeSize = 1.8; // Slightly smaller to create visual separation between segments
    // Material para os segmentos da cobra (verde)
    const segmentMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x00ff00,
        roughness: 0.5,
        metalness: 0.2,
        flatShading: false
    });
    
    // Material para a cabeça da cobra (vermelho)
    const headMaterial = new THREE.MeshStandardMaterial({ 
        color: 0xff0000, // Red color for head
        roughness: 0.5,
        metalness: 0.2,
        flatShading: false
    });
    const hitboxes = generateBoardHitboxes();    // Começa no centro do tabuleiro (matriz 9,9) para 20x20
    const startX = 9;
    const startZ = 9;
    // Guarda as coordenadas do tabuleiro para cada segmento
    const snakeBoard = [];    // Criação da cabeça da cobra (cubo vermelho)
    // Primeiro criamos o cubo principal da cabeça
    const headGeometry = new THREE.BoxGeometry(cubeSize, cubeSize, cubeSize);
    const head = new THREE.Mesh(headGeometry, headMaterial);
    
    // Posicionar a cabeça no tabuleiro
    const { centerX: cx, centerZ: cz } = hitboxes[startX][startZ];
    head.position.set(cx, 1, cz);
    scene.add(head);
    snake.push(head);
    snakeBoard.push({ x: startX, z: startZ });    // Corpo inicial para a esquerda
    for (let i = 1; i < 5; i++) {
        const segment = new THREE.Mesh(
            new THREE.BoxGeometry(cubeSize, cubeSize, cubeSize),
            segmentMaterial
        );
        const { centerX: bx, centerZ: bz } = hitboxes[startX - i][startZ];
        segment.position.set(bx, 1, bz);
        scene.add(segment);
        snake.push(segment);
        snakeBoard.push({ x: startX - i, z: startZ });
    }

    // Direção inicial: direita (x: 1, z: 0)
    return { snake, snakeHead: head, snakeDirection: { x: 1, z: 0 }, snakeBoard, hitboxes };
}

export function moveSnake(snake, snakeHead, snakeDirection, apple, gameMode, endGame, addSegment, updateScore, snakeBoard, hitboxes, obstacles = [], barriers = []) {
    // Verificação e validação de parâmetros
    if (!snake || snake.length === 0 || !snakeHead || !snakeDirection || !snakeBoard || snakeBoard.length === 0) {
        console.error("Parâmetros inválidos para moveSnake:", { snake, snakeHead, snakeDirection, snakeBoard });
        return false;
    }
    
    // Limites do tabuleiro 20x20
    const min = 0;
    const max = 19;
    
    // Pega a posição da cabeça na matriz, com validação
    let headX = Math.max(min, Math.min(max, snakeBoard[0].x));
    let headZ = Math.max(min, Math.min(max, snakeBoard[0].z));
    
    // Calcula a nova posição da cabeça
    let newX = headX + snakeDirection.x;
    let newZ = headZ + snakeDirection.z;
    
    // Inicializa a flag de crescimento logo no início
    let grow = false;    // Tratamento da posição da cabeça conforme o modo de jogo
    if (gameMode === 'classic') {
        // No modo clássico/teleporte, a cobra passa pelo lado oposto do tabuleiro
        if (newX < min) newX = max;
        else if (newX > max) newX = min;
        if (newZ < min) newZ = max;
        else if (newZ > max) newZ = min;
    } else if (gameMode === 'barriers' || gameMode === 'obstacles') {
        // Nos modos barreiras ou obstáculos, colisão com a borda termina o jogo
        if (newX < min || newX > max || newZ < min || newZ > max) {
            console.log(`Colisão com barreira detectada em posição inválida: ${newX}, ${newZ}`);
            endGame();
            return false;
        }
          // Verificação adicional para colisões com barreiras no modo barriers
        if (gameMode === 'barriers' && barriers && barriers.length > 0) {
            // Verificar colisão com barreiras complexas
            const complexCollision = barriers.some(barrier => {
                if (barrier.type === 'complex') {
                    return barrier.boardPosition.x === newX && barrier.boardPosition.z === newZ;
                }
                return false;
            });
            
            // Verificar colisão com barreiras de limite
            const boundaryCollision = barriers.some(barrier => {
                if (barrier.type === 'boundary') {
                    return barrier.boardPositions.some(pos => pos.x === newX && pos.z === newZ);
                }
                return false;
            });
            
            if (complexCollision || boundaryCollision) {
                console.log(`Colisão com barreira detectada em: ${newX}, ${newZ}`);
                endGame();
                return false;
            }
        }
    }// Colisão com o corpo - verificação mais precisa e com tolerância para evitar falsos positivos
    for (let i = 1; i < snakeBoard.length; i++) {
        // Verifica se as coordenadas da nova posição da cabeça colidem com algum segmento do corpo
        if (snakeBoard[i].x === newX && snakeBoard[i].z === newZ) {
            // Sempre ignoramos os dois últimos segmentos para evitar falsos positivos
            // Isso resolve o problema de detecção incorreta quando a cauda "parece" estar no caminho
            if (i >= snakeBoard.length - 2) {
                continue;
            }
            
            // Detecção mais precisa usando distância entre objetos 3D
            const headNextPos = { x: hitboxes[newX][newZ].centerX, z: hitboxes[newX][newZ].centerZ };
            const segmentPos = { x: snake[i].position.x, z: snake[i].position.z };
            
            // Distância para confirmar uma colisão real
            const distance = Math.sqrt(
                Math.pow(headNextPos.x - segmentPos.x, 2) + 
                Math.pow(headNextPos.z - segmentPos.z, 2)
            );
            
            // Se a distância for maior que 0.1, consideramos como falso positivo
            if (distance > 0.1) {
                continue;
            }
            
            // Detectou colisão real - fim de jogo
            console.log("Colisão com o corpo detectada na posição:", newX, newZ, "segmento:", i);
            endGame();
            return false;
        }
    }    // Colisão com obstáculos (modo obstacles) - lógica aprimorada
    if (gameMode === 'obstacles' && obstacles && obstacles.length > 0) {
        // Verifica se há colisão com obstáculos usando a posição na matriz do tabuleiro
        for (let i = 0; i < obstacles.length; i++) {
            // Validação para garantir que o obstáculo tem uma posição válida
            if (!obstacles[i] || !obstacles[i].boardPosition) continue;
            
            if (obstacles[i].boardPosition.x === newX && obstacles[i].boardPosition.z === newZ) {
                // Confirmação adicional usando distância real entre objetos 3D
                const headNextPos = { x: hitboxes[newX][newZ].centerX, z: hitboxes[newX][newZ].centerZ };
                const obstaclePos = { 
                    x: obstacles[i].position ? obstacles[i].position.x : 0, 
                    z: obstacles[i].position ? obstacles[i].position.z : 0 
                };
                
                const distance = Math.sqrt(
                    Math.pow(headNextPos.x - obstaclePos.x, 2) + 
                    Math.pow(headNextPos.z - obstaclePos.z, 2)
                );
                
                // Se a distância for muito grande, pode ser um falso positivo
                if (distance > 2.5) {
                    continue;
                }
                
                console.log("Colisão com obstáculo detectada na posição:", newX, newZ);
                endGame();
                return false;
            }
        }
    }    // Colisão com maçã - usando as hitboxes para maior precisão
    // Validação para garantir que temos uma maçã válida
    if (!apple || !apple.position) {
        console.warn("Maçã inválida detectada");
        return true; // Continua o jogo sem crescer
    }
    
    // Calcula a posição da maçã na matriz do tabuleiro com maior precisão
    const appleX = Math.round((apple.position.x - 1) / 2);
    const appleZ = Math.round((apple.position.z - 1) / 2);
    
    // Validação adicional para garantir que a posição da maçã está nos limites do tabuleiro
    const validAppleX = Math.max(0, Math.min(19, appleX));
    const validAppleZ = Math.max(0, Math.min(19, appleZ));
    
    // Verifica colisão baseada nas coordenadas da matriz
    if (newX === validAppleX && newZ === validAppleZ) {
        console.log(`Cobra comeu a maçã na posição: ${validAppleX}, ${validAppleZ}`);
        addSegment();
        updateScore();
        grow = true;
    }

    // Move a matriz do corpo
    snakeBoard.unshift({ x: newX, z: newZ });
    if (!grow) snakeBoard.pop();    // Verifica se há discrepância entre o número de segmentos visuais e a matriz de posição
    if (snake.length < snakeBoard.length) {
        console.warn(`Discrepância detectada: snake.length (${snake.length}) < snakeBoard.length (${snakeBoard.length})`);
        // Trunca a matriz de posições para corresponder ao número de segmentos visuais
        // Isso evita "quadrados invisíveis" que causam colisões inesperadas
        snakeBoard.length = snake.length;
    }

    // Atualiza posições 3D usando hitboxes - com validação de posição e sincronização rigorosa
    for (let i = 0; i < snake.length && i < snakeBoard.length; i++) {
        // Validar se as coordenadas estão dentro dos limites
        const x = Math.max(0, Math.min(19, snakeBoard[i].x));
        const z = Math.max(0, Math.min(19, snakeBoard[i].z));
        
        // Atualiza a matriz para garantir que não haja posições inválidas
        snakeBoard[i].x = x;
        snakeBoard[i].z = z;
        
    // Obtém as coordenadas 3D precisas do centro da célula
        const { centerX, centerZ } = hitboxes[x][z];
        
        // Posiciona o segmento da cobra exatamente no centro da célula
        // Aunque sean visualmente más pequeños, se mantienen centrados en las celdas
        snake[i].position.set(centerX, 1, centerZ);
    }    // Atualiza rotação visual da cabeça com base na direção do movimento
    // Usando Math.atan2 para obter o ângulo correto baseado na direção atual
    const angle = Math.atan2(snakeDirection.x, snakeDirection.z);
    
    // Aplica a rotação suavemente para uma transição visual melhor
    snakeHead.rotation.y = angle;
    
    return true;
}

export function isAppleOnSnake(snake, x, z, snakeBoard) {
    // Verifica se as coordenadas da maçã coincidem com qualquer segmento da cobra
    if (!snakeBoard || !Array.isArray(snakeBoard)) {
        return false;
    }
    
    return snakeBoard.some(seg => seg && seg.x === x && seg.z === z);
}

// Função para depuração das colisões
export function debugCollisions(scene, snakeBoard, hitboxes, duration = 3000) {
    // Cria esferas para visualizar as hitboxes
    const markers = [];
    const markerGeometry = new THREE.SphereGeometry(0.5, 8, 8);
    const markerMaterial = new THREE.MeshBasicMaterial({color: 0xff00ff, transparent: true, opacity: 0.5});
    
    if (!snakeBoard || !hitboxes) return [];
    
    // Adiciona marcadores visuais em cada posição da cobra
    for (let i = 0; i < snakeBoard.length; i++) {
        const {x, z} = snakeBoard[i];
        if (hitboxes[x] && hitboxes[x][z]) {
            const {centerX, centerZ} = hitboxes[x][z];
            const marker = new THREE.Mesh(markerGeometry, markerMaterial);
            marker.position.set(centerX, 1.5, centerZ);
            scene.add(marker);
            markers.push(marker);
        }
    }
    
    // Remove os marcadores após um certo tempo
    setTimeout(() => {
        markers.forEach(marker => scene.remove(marker));
    }, duration);
    
    return markers;
}
