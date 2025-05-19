// integrity-checker.js
// Este arquivo adiciona funções para verificar a integridade do jogo e evitar bugs de colisão

// Função para verificar e corrigir a integridade da matriz da cobra
export function checkSnakeIntegrity(snake, snakeBoard, hitboxes, scene) {
    if (!snake || !snakeBoard || !hitboxes) {
        console.error("Dados inválidos para verificação de integridade");
        return false;
    }
    
    let hasCorrection = false;
    
    // Definição do limite máximo de segmentos
    const MAX_SEGMENTS = 100; // Mesmo valor definido no main.js
    
    // Verificação de limite máximo de segmentos - Evita que o jogo crashe com cobras muito grandes
    if (snake.length > MAX_SEGMENTS || snakeBoard.length > MAX_SEGMENTS) {
        console.warn(`Tamanho da cobra excede o limite máximo (${MAX_SEGMENTS}). Reduzindo tamanho...`);
        
        // Trunca ambos os arrays para o tamanho máximo
        if (snake.length > MAX_SEGMENTS) {
            // Remove segmentos visuais extras se a cena estiver disponível
            if (scene) {
                for (let i = MAX_SEGMENTS; i < snake.length; i++) {
                    scene.remove(snake[i]);
                }
            }
            snake.length = MAX_SEGMENTS;
            hasCorrection = true;
        }
        
        if (snakeBoard.length > MAX_SEGMENTS) {
            snakeBoard.length = MAX_SEGMENTS;
            hasCorrection = true;
        }
    }
    
    // Verificação 1: O tamanho da matriz deve corresponder ao número de segmentos
    if (snake.length !== snakeBoard.length) {
        console.warn(`Inconsistência detectada: snake.length (${snake.length}) ≠ snakeBoard.length (${snakeBoard.length})`);
        
        // Correção: Ajustar o tamanho da matriz para corresponder aos segmentos visuais
        if (snake.length < snakeBoard.length) {
            snakeBoard.length = snake.length;
            hasCorrection = true;
        }
    }
    
    // Verificação 2: Todas as posições na matriz devem ser válidas (0-19)
    for (let i = 0; i < snakeBoard.length; i++) {
        if (!snakeBoard[i] || 
            snakeBoard[i].x < 0 || snakeBoard[i].x > 19 || 
            snakeBoard[i].z < 0 || snakeBoard[i].z > 19) {
            
            console.warn(`Posição inválida detectada no segmento ${i}: ${JSON.stringify(snakeBoard[i])}`);
            
            // Correção: Se for o primeiro segmento (cabeça), usar posição central
            if (i === 0) {
                snakeBoard[i] = { x: 9, z: 9 };
                hasCorrection = true;
            } 
            // Para outros segmentos, usar a posição do segmento anterior
            else if (snakeBoard[i-1]) {
                snakeBoard[i] = { ...snakeBoard[i-1] };
                hasCorrection = true;
            }
        }
    }
    
    // Verificação 3: Não deve haver duplicatas de posição (exceto para cobra crescendo)
    const positions = new Set();
    const duplicates = [];
    
    for (let i = 0; i < snakeBoard.length; i++) {
        const posKey = `${snakeBoard[i].x},${snakeBoard[i].z}`;
        
        if (positions.has(posKey)) {
            duplicates.push({index: i, pos: {...snakeBoard[i]}});
        } else {
            positions.add(posKey);
        }
    }
    
    if (duplicates.length > 0) {
        console.warn(`Posições duplicadas detectadas: ${JSON.stringify(duplicates)}`);
        
        // Não corrigimos duplicatas automaticamente pois podem ser parte do crescimento da cobra
    }
    
    return hasCorrection;
}

// Função para verificar e corrigir a integridade dos obstáculos
export function checkObstaclesIntegrity(obstacles, hitboxes) {
    if (!obstacles || !hitboxes) {
        return false;
    }
    
    let hasCorrection = false;
    
    for (let i = 0; i < obstacles.length; i++) {
        const obstacle = obstacles[i];
        
        if (!obstacle || !obstacle.boardPosition) {
            console.warn(`Obstáculo inválido no índice ${i}`);
            continue;
        }
        
        const {x, z} = obstacle.boardPosition;
        
        // Verifica se a posição está nos limites do tabuleiro
        if (x < 0 || x > 19 || z < 0 || z > 19) {
            console.warn(`Obstáculo com posição inválida: ${x}, ${z}`);
            
            // Correção: Mover para uma posição válida
            obstacle.boardPosition.x = Math.max(0, Math.min(19, x));
            obstacle.boardPosition.z = Math.max(0, Math.min(19, z));
            
            // Atualiza a posição 3D
            const { centerX, centerZ } = hitboxes[obstacle.boardPosition.x][obstacle.boardPosition.z];
            if (obstacle.position) {
                obstacle.position.x = centerX;
                obstacle.position.z = centerZ;
            }
            
            hasCorrection = true;
        }
    }
    
    return hasCorrection;
}

// Função para verificar e corrigir a posição da maçã
export function checkAppleIntegrity(apple, snake, snakeBoard, hitboxes) {
    if (!apple || !apple.position || !hitboxes) {
        return false;
    }
    
    // Calcula a posição da maçã na matriz
    const appleX = Math.round((apple.position.x - 1) / 2);
    const appleZ = Math.round((apple.position.z - 1) / 2);
    
    // Verifica se a posição está nos limites do tabuleiro
    if (appleX < 0 || appleX > 19 || appleZ < 0 || appleZ > 19) {
        console.warn(`Maçã com posição inválida: ${appleX}, ${appleZ}`);
        
        // Correção: Mover para uma posição válida
        const newX = Math.max(0, Math.min(19, appleX));
        const newZ = Math.max(0, Math.min(19, appleZ));
        
        const { centerX, centerZ } = hitboxes[newX][newZ];
        apple.position.x = centerX;
        apple.position.z = centerZ;
        
        return true;
    }
    
    return false;
}

// Função principal para verificar a integridade do jogo
export function checkGameIntegrity(scene, snake, snakeHead, snakeBoard, apple, obstacles, hitboxes, barriers) {
    const snakeCorrected = checkSnakeIntegrity(snake, snakeBoard, hitboxes, scene);
    const obstaclesCorrected = obstacles ? checkObstaclesIntegrity(obstacles, hitboxes) : false;
    const appleCorrected = checkAppleIntegrity(apple, snake, snakeBoard, hitboxes);
    const barriersCorrected = barriers ? checkBarriersIntegrity(barriers, hitboxes) : false;
    
    return snakeCorrected || obstaclesCorrected || appleCorrected || barriersCorrected;
}

// Função para verificar a integridade das barreiras
function checkBarriersIntegrity(barriers, hitboxes) {
    if (!barriers || barriers.length === 0) {
        return false;
    }
    
    let hasCorrection = false;
    
    // Verifica as barreiras complexas
    barriers.forEach(barrier => {
        if (barrier.type === 'complex' && barrier.boardPosition) {
            const { x, z } = barrier.boardPosition;
            
            // Verifica se a posição está fora dos limites
            if (x < 0 || x > 19 || z < 0 || z > 19) {
                console.warn(`Barreira com posição inválida: ${x}, ${z}`);
                // Corrige para uma posição válida
                barrier.boardPosition.x = Math.max(0, Math.min(19, x));
                barrier.boardPosition.z = Math.max(0, Math.min(19, z));
                
                // Atualiza a posição visual se a barreira tiver um mesh
                if (barrier.mesh) {
                    const { centerX, centerZ } = hitboxes[barrier.boardPosition.x][barrier.boardPosition.z];
                    barrier.mesh.position.x = centerX;
                    barrier.mesh.position.z = centerZ;
                }
                
                hasCorrection = true;
            }
        }
    });
    
    return hasCorrection;
}
