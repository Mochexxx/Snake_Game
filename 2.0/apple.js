import * as THREE from 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.module.js';
import { getBoardCellCenter, generateBoardHitboxes } from './scene.js';
import { GLTFLoader } from 'https://unpkg.com/three@0.128.0/examples/jsm/loaders/GLTFLoader.js';

// apple.js
// Responsável por criar e posicionar a maçã

// Create a loader and cache for the apple model
const gltfLoader = new GLTFLoader();
let appleModelCache = null; // Cache the loaded model
let modelLoadingAttempted = false; // Track if we already tried loading the model

// Load the apple model once and cache it
function loadAppleModel() {
    return new Promise((resolve, reject) => {
        // If model is already cached, return it
        if (appleModelCache) {
            console.log('Using cached apple model');
            resolve(appleModelCache.clone());
            return;
        }
        
        // If we already tried and failed to load the model, don't try again
        if (modelLoadingAttempted) {
            console.warn('Already failed to load apple model, using fallback');
            reject(new Error('Previous loading attempt failed'));
            return;
        }
        
        console.log('Attempting to load apple model...');
        modelLoadingAttempted = true;
        
        // Try multiple paths for the model in case the path is incorrect
        const possiblePaths = [
            'assets/apple.glb',
            'assets/models/apple.glb',
            './assets/apple.glb',
            './assets/models/apple.glb',
            '../assets/apple.glb',
            '../assets/models/apple.glb'
        ];
        
        // Try each path until one works
        tryNextPath(0);
        
        function tryNextPath(index) {
            if (index >= possiblePaths.length) {
                console.error('Could not find apple model in any of the searched paths');
                reject(new Error('Could not find apple model'));
                return;
            }
            
            const path = possiblePaths[index];
            console.log(`Trying path: ${path}`);
            
            gltfLoader.load(
                path,
                (gltf) => {
                    console.log('Apple model loaded successfully from:', path);
                    appleModelCache = gltf.scene;
                    
                    // Compute the bounding box to center the model
                    const boundingBox = new THREE.Box3().setFromObject(appleModelCache);
                    const center = boundingBox.getCenter(new THREE.Vector3());
                      // Adjust the model position to center it
                    appleModelCache.children.forEach(child => {
                        child.position.x -= center.x;
                        child.position.z -= center.z;
                        // Keep y position as is to maintain proper height
                    });
                      // Apply scaling after centering (5x bigger than previous small size)
                    appleModelCache.scale.set(0.009, 0.009, 0.009);
                    
                    // Set a fixed rotation
                    appleModelCache.rotation.set(0, Math.PI * 0.25, 0); // Fixed 45-degree rotation for visual appeal
                    
                    // Make model cast shadows
                    appleModelCache.traverse(child => {
                        if (child.isMesh) {
                            child.castShadow = true;
                            child.receiveShadow = true;
                            
                            // Improve material appearance
                            if (child.material) {
                                child.material.roughness = 0.5;
                                child.material.metalness = 0.2;
                            }
                        }
                    });
                    
                    // Return a clone of the cached model
                    resolve(appleModelCache.clone());
                },
                (xhr) => {
                    console.log(`Apple model loading (${path}): ${(xhr.loaded / xhr.total * 100).toFixed(2)}%`);
                },
                (error) => {
                    console.warn(`Error loading model from ${path}:`, error);
                    // Try next path
                    tryNextPath(index + 1);
                }
            );
        }
    });
}

// Function to create a fallback sphere apple (in case model loading fails)
function createFallbackApple() {
    console.log('Creating fallback apple (red sphere)');
      // More detailed apple using multiple geometries
    const appleGroup = new THREE.Group();
      // Main apple body (sphere) - 5x bigger than previous small size
    const appleGeometry = new THREE.SphereGeometry(0.5, 24, 24);
    const appleMaterial = new THREE.MeshStandardMaterial({ 
        color: 0xff0000,
        roughness: 0.6,
        metalness: 0.1
    });
    const appleBody = new THREE.Mesh(appleGeometry, appleMaterial);
    appleGroup.add(appleBody);    
    // Apple stem - 5x bigger than previous small size
    const stemGeometry = new THREE.CylinderGeometry(0.05, 0.05, 0.25, 8);
    const stemMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x8B4513, // Brown
        roughness: 0.8,
        metalness: 0.1
    });    const stem = new THREE.Mesh(stemGeometry, stemMaterial);
    stem.position.y = 0.5;
    appleGroup.add(stem);    
    // Small leaf - 5x bigger than previous small size
    const leafGeometry = new THREE.BoxGeometry(0.15, 0.05, 0.15);
    const leafMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x228B22, // Forest green
        roughness: 0.7,
        metalness: 0.1
    });    const leaf = new THREE.Mesh(leafGeometry, leafMaterial);
    leaf.position.set(0.1, 0.5, 0.1);
    leaf.rotation.set(0.3, 0.5, 0.2);
    appleGroup.add(leaf);
    
    // Set up for shadow casting
    appleGroup.traverse(child => {
        if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
        }
    });
    
    return appleGroup;
}

// Helper function to generate a valid apple position
function generateApplePosition(snakeBoard, obstacles = [], barriers = [], isAppleOnSnake, snake) {
    return new Promise((resolve) => {
        // Verifica se ainda existem células livres no tabuleiro
        const totalCells = 20 * 20; // Tabuleiro 20x20
        const occupiedCells = snakeBoard.length;
        
        // Se a cobra ocupar quase todo o tabuleiro (mais de 90%), considere vitória
        if (occupiedCells > totalCells * 0.9) {
            console.log("Tabuleiro quase cheio! A cobra venceu o jogo!");
            // Coloca a maçã em uma posição padrão e marca como "vitória"
            resolve({ x: 0, z: 0, gameCompleted: true });
            return;
        }

        // Gera posições aleatórias até encontrar uma que não colida com a cobra
        let x, z;
        let maxAttempts = 200; // Aumenta o número de tentativas para lidar com tabuleiros mais cheios
        let attempts = 0;
        
        do {
            x = Math.floor(Math.random() * 20);
            z = Math.floor(Math.random() * 20);
            attempts++;
            
            // Sai do loop se atingir o máximo de tentativas
            if (attempts >= maxAttempts) {
                console.warn("Máximo de tentativas atingido para posicionar a maçã. Usando método alternativo.");
                // Método alternativo: verifica o tabuleiro de forma sistemática
                const availablePositions = findAvailablePositions(snakeBoard, obstacles, barriers); // Passa barriers
                if (availablePositions.length > 0) {
                    // Escolhe uma posição aleatória entre as disponíveis
                    const randomIndex = Math.floor(Math.random() * availablePositions.length);
                    x = availablePositions[randomIndex].x;
                    z = availablePositions[randomIndex].z;
                    console.log("Posição alternativa encontrada:", x, z);
                } else {
                    console.error("Nenhuma posição disponível para a maçã!");
                    // Coloca em uma posição padrão
                    x = 0;
                    z = 0;
                }
                break;
            }
        } while (isAppleOnSnake(snake, x, z, snakeBoard) || 
                (obstacles && obstacles.length > 0 ? obstacles.some(obs => obs && obs.boardPosition && obs.boardPosition.x === x && obs.boardPosition.z === z) : false) || 
                (barriers && barriers.length > 0 ? barriers.some(barrier => { // Adiciona verificação de colisão com barreiras
                    if (!barrier) return false;
                    
                    if (barrier.type === 'complex' && barrier.boardPosition) {
                        return barrier.boardPosition.x === x && barrier.boardPosition.z === z;
                    }
                    if (barrier.type === 'boundary' && barrier.boardPositions) {
                        return barrier.boardPositions.some(pos => pos && pos.x === x && pos.z === z);
                    }
                    if (barrier.type === 'random-piece' && barrier.boardPositions) {
                        return barrier.boardPositions.some(pos => pos && pos.x === x && pos.z === z);
                    }
                    return false;
                }) : false));

        // Garante que as coordenadas estejam dentro dos limites do tabuleiro
        x = Math.max(0, Math.min(19, x));
        z = Math.max(0, Math.min(19, z));

        resolve({ x, z, gameCompleted: false });
    });
}

// Função para criar uma nova maçã
export function createApple(scene, snake, isAppleOnSnake, snakeBoard, hitboxes, obstacles = [], barriers = []) {
    return new Promise((resolve, reject) => {
        // Generate position for the apple
        generateApplePosition(snakeBoard, obstacles, barriers, isAppleOnSnake, snake)
            .then(position => {
                const x = position.x;
                const z = position.z;
                
                // Check if this is a "game completed" scenario
                if (position.gameCompleted) {
                    const fallbackApple = createFallbackApple();
                    fallbackApple.userData.gameCompleted = true;
                    resolve(fallbackApple);
                    return;
                }
                
                // First try to load the 3D model apple
                loadAppleModel()
                    .then(apple => {
                        console.log('Successfully loaded 3D apple model');
                        
                        // Position the apple exactly at the center of the cell
                        const { centerX: ax, centerZ: az } = hitboxes[x][z];
                        apple.position.set(ax, 1, az);
                        
                        // Make sure the model is centered on this position
                        apple.userData.cellCenter = { x: ax, z: az };
                        
                        // Store the grid position for collision detection
                        apple.userData.boardPosition = { x, z };
                        
                        // Add the apple to the scene
                        scene.add(apple);
                        
                        // Set up animation for the apple
                        animateApple(apple);
                        
                        resolve(apple);
                    })
                    .catch(error => {
                        console.warn('Failed to load 3D apple model, using fallback:', error);
                        const apple = createFallbackApple();
                        
                        // Position the fallback apple exatamente at the center
                        const { centerX: ax, centerZ: az } = hitboxes[x][z];
                        apple.position.set(ax, 1, az);
                        
                        // Store the grid position for collision detection
                        apple.userData.boardPosition = { x, z };
                        
                        // Add to scene and animate
                        scene.add(apple);
                        animateApple(apple);
                        
                        resolve(apple);
                    });
            })
            .catch(error => {
                console.error('Error generating apple position:', error);
                
                // Create a fallback apple at a default position
                const fallbackApple = createFallbackApple();
                const { centerX, centerZ } = hitboxes[0][0];
                fallbackApple.position.set(centerX, 1, centerZ);
                fallbackApple.userData.boardPosition = { x: 0, z: 0 };
                scene.add(fallbackApple);
                animateApple(fallbackApple);
                
                resolve(fallbackApple);
            });
    });
}

// Função para animar a maçã (apenas flutuação vertical, sem rotação)
function animateApple(apple) {
    const originalY = apple.position.y;
    const floatHeight = 0.1; // Reduced float height
    
    // Guarda o timestamp para a animação
    apple.userData.animationStartTime = Date.now();
    
    // Guarda a posição original da maçã para depuração
    apple.userData.originalPosition = {
        x: apple.position.x,
        y: apple.position.y,
        z: apple.position.z,
        gridX: Math.round((apple.position.x - 1) / 2),
        gridZ: Math.round((apple.position.z - 1) / 2)
    };
    
    // Anima a maçã em cada frame - only up and down movement, no rotation
    apple.userData.animate = function(time) {
        // No rotation anymore
        
        // Only up and down floating movement
        const elapsed = Date.now() - apple.userData.animationStartTime;
        apple.position.y = originalY + Math.sin(elapsed * 0.002) * floatHeight;
    };
}

// Função para encontrar posições disponíveis no tabuleiro
// Modificado para aceitar 'barriers' e evitar colisões
function findAvailablePositions(snakeBoard, obstacles = [], barriers = []) {
    const available = [];
    for (let i = 0; i < 20; i++) {
        for (let j = 0; j < 20; j++) {            const isOnSnake = snakeBoard.some(seg => seg && seg.x === i && seg.z === j);
            const isOnObstacle = obstacles && obstacles.length > 0 ? obstacles.some(obs => obs && obs.boardPosition && obs.boardPosition.x === i && obs.boardPosition.z === j) : false;const isOnBarrier = barriers && barriers.length > 0 ? barriers.some(barrier => { // Adiciona verificação de colisão com barreiras
                if (!barrier) return false;
                
                if (barrier.type === 'complex' && barrier.boardPosition) {
                    return barrier.boardPosition.x === i && barrier.boardPosition.z === j;
                }
                if (barrier.type === 'boundary' && barrier.boardPositions) {
                    return barrier.boardPositions.some(pos => pos && pos.x === i && pos.z === j);
                }
                if (barrier.type === 'random-piece' && barrier.boardPositions) {
                    return barrier.boardPositions.some(pos => pos && pos.x === i && pos.z === j);
                }
                return false;
            }) : false;

            if (!isOnSnake && !isOnObstacle && !isOnBarrier) {
                available.push({ x: i, z: j });
            }
        }
    }
    return available;
}
