import * as THREE from 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.module.js';
import { getBoardCellCenter, generateBoardHitboxes } from './scene.js';

// apple.js
// Responsável por criar e posicionar a maçã

export function createApple(scene, snake, isAppleOnSnake, snakeBoard, hitboxes) {
    // Geometria e material para a maçã
    const appleGeometry = new THREE.SphereGeometry(1, 16, 16);
    const appleMaterial = new THREE.MeshStandardMaterial({ 
        color: 0xff0000,
        roughness: 0.5,
        metalness: 0.2
    });
    const apple = new THREE.Mesh(appleGeometry, appleMaterial);

    // Gera posições aleatórias até encontrar uma que não colida com a cobra
    let x, z;
    let maxAttempts = 100; // Evita loop infinito
    let attempts = 0;
    
    do {
        x = Math.floor(Math.random() * 20);
        z = Math.floor(Math.random() * 20);
        attempts++;
        
        // Sai do loop se atingir o máximo de tentativas
        if (attempts >= maxAttempts) {
            console.warn("Máximo de tentativas atingido para posicionar a maçã. Aceitando posição atual.");
            break;
        }
    } while (isAppleOnSnake(snake, x, z, snakeBoard));

    // Garante que as coordenadas estejam dentro dos limites do tabuleiro
    x = Math.max(0, Math.min(19, x));
    z = Math.max(0, Math.min(19, z));

    // Posiciona a maçã no centro da célula do tabuleiro
    const { centerX: ax, centerZ: az } = hitboxes[x][z];
    apple.position.set(ax, 1, az);
    
    // Adiciona à cena
    scene.add(apple);
    
    // Anima a maçã girando e flutuando
    animateApple(apple);
    
    return apple;
}

// Função para animar a maçã (girar e flutuar)
function animateApple(apple) {
    const originalY = apple.position.y;
    const animationSpeed = 0.001;
    const floatHeight = 0.2;
    
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
    
    // Anima a maçã em cada frame
    apple.userData.animate = function(time) {
        // Gira a maçã
        apple.rotation.y += animationSpeed * 5;
        
        // Faz a maçã flutuar para cima e para baixo
        const elapsed = Date.now() - apple.userData.animationStartTime;
        apple.position.y = originalY + Math.sin(elapsed * 0.002) * floatHeight;
    };
}
