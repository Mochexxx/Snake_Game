import * as THREE from 'three';
import { getBoardCellCenter, generateBoardHitboxes } from './scene.js';
import { BoxGeometry, MeshStandardMaterial } from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { SphereGeometry } from 'three';
import { TextureLoader } from 'three';
import { createPlaydohMaterial, getThemeColors } from './scene.js';
import { createApple } from './apple.js';
import { getCurrentBoardTheme, getThemeConfig } from './board-theme-manager.js';

// Snake.js
// Responsável por criar e controlar a cobra

// Enhanced snake texture system
const textureLoader = new TextureLoader();
let snakeHeadTexture = null;

// Create procedural snake texture for entire body
function createSnakeTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const context = canvas.getContext('2d');
    
    // Create gradient background
    const gradient = context.createRadialGradient(256, 256, 0, 256, 256, 256);
    gradient.addColorStop(0, '#4a7c59'); // Darker green center
    gradient.addColorStop(0.7, '#2d5016'); // Medium green
    gradient.addColorStop(1, '#1a3009'); // Dark green edges
    
    context.fillStyle = gradient;
    context.fillRect(0, 0, 512, 512);
    
    // Add scale pattern
    context.strokeStyle = '#1a3009';
    context.lineWidth = 2;
    
    for (let i = 0; i < 512; i += 32) {
        for (let j = 0; j < 512; j += 32) {
            context.beginPath();
            context.arc(i + 16, j + 16, 12, 0, Math.PI * 2);
            context.stroke();
        }
    }
    
    // Add subtle highlights
    context.strokeStyle = '#7fb069';
    context.lineWidth = 1;
    
    for (let i = 16; i < 512; i += 64) {
        for (let j = 16; j < 512; j += 64) {
            context.beginPath();
            context.arc(i, j, 6, 0, Math.PI * 2);
            context.stroke();
        }
    }
    
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.generateMipmaps = true;
    return texture;
}

// Create the texture for entire snake body
snakeHeadTexture = createSnakeTexture();

// Expose to global scope for main.js
window.snakeTexture = snakeHeadTexture;

// Enhanced materials with better properties
let HEAD_MATERIAL = new MeshStandardMaterial({ 
    map: snakeHeadTexture,
    roughness: 0.3,
    metalness: 0.1,
    bumpMap: snakeHeadTexture,
    bumpScale: 0.1,
    normalScale: new THREE.Vector2(0.5, 0.5)
});

let SEGMENT_MATERIAL = new MeshStandardMaterial({ 
    map: snakeHeadTexture,
    roughness: 0.4,
    metalness: 0.05,
    envMapIntensity: 0.3
});

// Function to update materials when theme changes
function updateSnakeMaterials(themeColors) {
    if (themeColors && snakeHeadTexture) {
        const themeColor = new THREE.Color(themeColors.floor);
        
        // Update head material
        HEAD_MATERIAL.color.copy(themeColor);
        HEAD_MATERIAL.needsUpdate = true;
        
        // Update segment material (slightly darker)
        SEGMENT_MATERIAL.color.copy(themeColor.clone().multiplyScalar(0.9));
        SEGMENT_MATERIAL.needsUpdate = true;
    }
}

// Enhanced material creation with theme support
function createSnakeMaterial(isHead = false, themeColors = null) {
    // Use the same procedural head texture for both head and body
    // but apply theme color tinting based on selected theme
    const baseTexture = snakeHeadTexture;
    
    // Get theme color for tinting
    const themeColor = themeColors ? new THREE.Color(themeColors.floor) : new THREE.Color(0x32cd32);
    
    if (isHead) {
        return new THREE.MeshStandardMaterial({
            map: baseTexture,
            color: themeColor, // Apply theme color as tint
            roughness: 0.3,
            metalness: 0.1,
            bumpMap: baseTexture,
            bumpScale: 0.1,
            normalScale: new THREE.Vector2(0.5, 0.5),
            envMapIntensity: 0.5
        });
    } else {
        // Body segments use same texture but slightly different properties
        return new THREE.MeshStandardMaterial({
            map: baseTexture,
            color: themeColor.clone().multiplyScalar(0.9), // Slightly darker for body
            roughness: 0.4,
            metalness: 0.05,
            bumpMap: baseTexture,
            bumpScale: 0.05,
            envMapIntensity: 0.3
        });
    }
}

// Function to create a new snake segment with enhanced styling
function createSnakeSegment(scene, x, z, hitboxes, isHead = false) {
    const cubeSize = 1.8; // Same size as initial snake segments
    
    // Enhanced geometry with more rounded edges for smoother appearance
    const segmentGeom = new RoundedBoxGeometry(
        cubeSize, 
        cubeSize, 
        cubeSize, 
        12, // More segments for smoother curves
        0.4  // More pronounced rounding
    );
    
    // Get theme colors for material creation
    const themeColors = getThemeColors();
    const segmentMaterial = createSnakeMaterial(isHead, themeColors);
    
    const segment = new THREE.Mesh(segmentGeom, segmentMaterial);
    
    const { centerX, centerZ } = hitboxes[x][z];
    segment.position.set(centerX, 1, centerZ);
    
    // Enhanced shadow properties
    segment.castShadow = true;
    segment.receiveShadow = true;
    
    // Add subtle scale variation for organic feel
    if (!isHead) {
        const scaleVariation = 0.95 + Math.random() * 0.1; // 95% to 105%
        segment.scale.setScalar(scaleVariation);
    }
    
    scene.add(segment);
    return segment;
}

// Function to check if apple would spawn on snake
export function isAppleOnSnake(snake, x, z, snakeBoard) {
    // Verifica se as coordenadas da maçã coincidem com qualquer segmento da cobra
    if (!snakeBoard || !Array.isArray(snakeBoard)) {
        return false;
    }
    
    return snakeBoard.some(seg => seg && seg.x === x && seg.z === z);
}

// Function to add a new segment when apple is eaten
export async function addSegment(scene, snake, snakeBoard, hitboxes, apple, gameMode, updateScore, endGame, obstacles = [], barriers = []) {
    // Get the tail position for the new segment
    const tailPosition = snakeBoard[snakeBoard.length - 1];
    
    if (!tailPosition) {
        console.error("No tail position found for new segment");
        return;
    }
    
    // Create new segment at tail position with consistent material
    const newSegment = createSnakeSegment(scene, tailPosition.x, tailPosition.z, hitboxes, false);
    
    // Add to arrays
    snake.push(newSegment);
    snakeBoard.push({ x: tailPosition.x, z: tailPosition.z });
    
    // Update score
    updateScore();
    
    // Remove current apple
    if (apple && apple.parent) {
        scene.remove(apple);
    }
    
    // Create new apple with proper barrier collision checking
    const newApple = await createApple(
        scene, 
        snake, 
        isAppleOnSnake, 
        snakeBoard, 
        hitboxes, 
        obstacles, 
        barriers
    );
    
    return newApple;
}

export function createSnake(scene) {
    const snake = [];
    const cubeSize = 1.8; // Slightly smaller to create visual separation between segments
    
    const hitboxes = generateBoardHitboxes();
    // Começa no centro do tabuleiro (matriz 9,9) para 20x20
    const startX = 9;
    const startZ = 9;
    // Guarda as coordenadas do tabuleiro para cada segmento
    const snakeBoard = [];
    
    // Enhanced snake head creation with better geometry and materials
    const headGeometry = new RoundedBoxGeometry(
        cubeSize, 
        cubeSize, 
        cubeSize, 
        12, // More segments for smoother appearance
        0.4  // More pronounced rounding
    );
    
    // Get theme colors and create enhanced head material
    const themeColors = getThemeColors();
    const headMaterial = createSnakeMaterial(true, themeColors);
    const head = new THREE.Mesh(headGeometry, headMaterial);
    
    // Enhanced shadow properties
    head.castShadow = true;
    head.receiveShadow = true;
    
    // Posicionar a cabeça no tabuleiro
    const { centerX: cx, centerZ: cz } = hitboxes[startX][startZ];
    head.position.set(cx, 1, cz);
    scene.add(head);

    // Enhanced eyes with better materials and positioning
    const eyeGeometry = new SphereGeometry(0.15, 12, 12);
    const eyeMaterial = new THREE.MeshStandardMaterial({ 
        color: 0xffffff,
        roughness: 0.1,
        metalness: 0.1,
        envMapIntensity: 1.0
    });
    
    const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    leftEye.position.set(cubeSize * 0.2, cubeSize * 0.3, cubeSize * 0.45);
    
    // Enhanced pupil
    const pupilGeometry = new SphereGeometry(0.08, 8, 8);
    const pupilMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x111111,
        roughness: 0.0,
        metalness: 0.0
    });
    const leftPupil = new THREE.Mesh(pupilGeometry, pupilMaterial);
    leftPupil.position.set(0, 0, 0.05);
    leftEye.add(leftPupil);
    
    // Enhanced eye highlight
    const highlightGeometry = new SphereGeometry(0.03, 6, 6);
    const highlightMaterial = new THREE.MeshStandardMaterial({ 
        color: 0xffffff,
        emissive: 0xffffff,
        emissiveIntensity: 0.3
    });
    const leftHighlight = new THREE.Mesh(highlightGeometry, highlightMaterial);
    leftHighlight.position.set(0.02, 0.02, 0.08);
    leftEye.add(leftHighlight);
    
    const rightEye = leftEye.clone();
    rightEye.position.x = -leftEye.position.x;
    
    // Enhanced mouth/snout
    const mouthGeometry = new RoundedBoxGeometry(
        cubeSize * 0.6, 
        cubeSize * 0.15, 
        cubeSize * 0.3, 
        8, 
        0.05
    );
    const mouthMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x2d1b14,
        roughness: 0.6,
        metalness: 0.0
    });
    const mouth = new THREE.Mesh(mouthGeometry, mouthMaterial);
    mouth.rotation.x = -Math.PI * 0.05;
    mouth.position.set(0, -cubeSize * 0.15, cubeSize * 0.5);
    
    // Add nostril details
    const nostrilGeometry = new SphereGeometry(0.03, 6, 6);
    const nostrilMaterial = new THREE.MeshStandardMaterial({ color: 0x111111 });
    
    const leftNostril = new THREE.Mesh(nostrilGeometry, nostrilMaterial);
    leftNostril.position.set(0.1, 0.05, 0.08);
    mouth.add(leftNostril);
    
    const rightNostril = leftNostril.clone();
    rightNostril.position.x = -leftNostril.position.x;
    mouth.add(rightNostril);
    
    head.add(leftEye, rightEye, mouth);

    snake.push(head);
    snakeBoard.push({ x: startX, z: startZ });
    
    // Enhanced body segments with new material system
    for (let i = 1; i < 5; i++) {
        const segmentGeom = new RoundedBoxGeometry(
            cubeSize, 
            cubeSize, 
            cubeSize, 
            12, // More segments for smoother curves
            0.4  // More pronounced rounding
        );
        const segmentMaterial = createSnakeMaterial(false, themeColors);
        const segment = new THREE.Mesh(segmentGeom, segmentMaterial);
        
        // Enhanced shadow properties
        segment.castShadow = true;
        segment.receiveShadow = true;
        
        // Add subtle scale variation for organic feel
        const scaleVariation = 0.95 + Math.random() * 0.1; // 95% to 105%
        segment.scale.setScalar(scaleVariation);
        
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
    } else if (gameMode === 'barriers' || gameMode === 'randomBarriers' || gameMode === 'obstacles' || gameMode === 'campaign') {
        if (newX < min || newX > max || newZ < min || newZ > max) {
            // Check if it's campaign mode and handle boundary collisions
            if (gameMode === 'campaign') {
                console.log("Campaign boundary collision at:", newX, newZ);
                endGame();
                return false;
            }
            // Nos modos barreiras, obstáculos ou campanha, colisão com a borda termina o jogo
            if (newX < min || newX > max || newZ < min || newZ > max) {
                console.log(`Colisão com barreira detectada em posição inválida: ${newX}, ${newZ}`);
                endGame();
                return false;
            }
        }
        
        // Enhanced barrier collision detection for campaign mode
        if (gameMode === 'campaign' && barriers && barriers.length > 0) {
            // Import and use campaign-specific collision checking
            import('./campaign.js').then(module => {
                const campaignCollision = module.checkCampaignBarrierCollision(newX, newZ, barriers);
                if (campaignCollision) {
                    console.log("Campaign barrier collision detected at:", newX, newZ);
                    endGame();
                    return false;
                }
            }).catch(err => {
                // Fallback to standard barrier collision check
                console.warn("Could not load campaign collision checker, using fallback");
                const fallbackCollision = barriers.some(barrier => {
                    if (barrier.type === 'complex' && barrier.boardPosition) {
                        return barrier.boardPosition.x === newX && barrier.boardPosition.z === newZ;
                    }
                    if (barrier.type === 'boundary' && barrier.boardPositions) {
                        return barrier.boardPositions.some(pos => pos.x === newX && pos.z === newZ);
                    }
                    // Add check for random-piece barriers (maze mode)
                    if (barrier.type === 'random-piece' && barrier.boardPositions) {
                        return barrier.boardPositions.some(pos => pos.x === newX && pos.z === newZ);
                    }
                    return false;
                });
                
                if (fallbackCollision) {
                    console.log("Campaign barrier collision detected (fallback) at:", newX, newZ);
                    endGame();
                    return false;
                }
            });
        }
        
        // Verificação adicional para colisões com barreiras no modo barriers
        if ((gameMode === 'barriers' || gameMode === 'randomBarriers') && barriers && barriers.length > 0) {
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
            // Verificar colisão com barreiras random-piece (aleatórias)
            const randomPieceCollision = barriers.some(barrier => {
                if (barrier.type === 'random-piece' && barrier.boardPositions) {
                    return barrier.boardPositions.some(pos => pos.x === newX && pos.z === newZ);
                }
                return false;
            });
            if (complexCollision || boundaryCollision || randomPieceCollision) {
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
        // Aunque sean visualmente mais pequenos, se mantienen centrados en las celdas
        snake[i].position.set(centerX, 1, centerZ);
    }    // Atualiza rotação visual da cabeça com base na direção do movimento
    // Usando Math.atan2 para obter o ângulo correto baseado na direção atual
    const angle = Math.atan2(snakeDirection.x, snakeDirection.z);
    
    // Aplica a rotação suavemente para uma transição visual melhor
    snakeHead.rotation.y = angle;
    
    return true;
}

// Snake animation system for subtle breathing effect
export function animateSnake(snake, time) {
    if (!snake || !Array.isArray(snake) || snake.length === 0) return;
    
    // Subtle breathing effect - only apply to head
    const head = snake[0];
    if (head) {
        const breathingScale = 1 + Math.sin(time * 0.003) * 0.02; // Very subtle scaling
        head.scale.setScalar(breathingScale);
        
        // Subtle head bob
        const originalY = 1;
        const bobAmount = 0.05;
        head.position.y = originalY + Math.sin(time * 0.004) * bobAmount;
    }
    
    // Subtle segment animation - wave effect through body
    for (let i = 1; i < snake.length; i++) {
        const segment = snake[i];
        if (segment) {
            const waveOffset = i * 0.5; // Offset for wave propagation
            const waveIntensity = 0.02; // Very subtle
            const originalY = 1;
            
            segment.position.y = originalY + Math.sin(time * 0.002 + waveOffset) * waveIntensity;
            
            // Subtle rotation for more organic feel
            const rotationIntensity = 0.01;
            segment.rotation.y = Math.sin(time * 0.001 + waveOffset) * rotationIntensity;
        }
    }
}

// Export function to get current snake materials for theme updates
export function updateSnakeTheme(snake, themeColors) {
    if (!snake || !Array.isArray(snake) || snake.length === 0 || !themeColors) return;
    
    const themeColor = new THREE.Color(themeColors.floor);
    
    // Update head material
    const head = snake[0];
    if (head && head.material) {
        head.material.color.copy(themeColor);
        head.material.needsUpdate = true;
    }
    
    // Update body segment materials
    const bodyColor = themeColor.clone().multiplyScalar(0.9); // Slightly darker for body
    for (let i = 1; i < snake.length; i++) {
        const segment = snake[i];
        if (segment && segment.material) {
            segment.material.color.copy(bodyColor);
            segment.material.needsUpdate = true;
        }
    }
    
    // Update global materials for new segments
    updateSnakeMaterials(themeColors);
}

// Export function to apply theme to newly created snake
export function applyThemeToSnake(snake, themeColors) {
    updateSnakeTheme(snake, themeColors);
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
