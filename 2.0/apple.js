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

    // Verifica se ainda existem células livres no tabuleiro
    const totalCells = 20 * 20; // Tabuleiro 20x20
    const occupiedCells = snakeBoard.length;
    
    // Se a cobra ocupar quase todo o tabuleiro (mais de 90%), considere vitória
    if (occupiedCells > totalCells * 0.9) {
        console.log("Tabuleiro quase cheio! A cobra venceu o jogo!");
        // Coloca a maçã em uma posição padrão e marca como "vitória"
        x = 0;
        z = 0;
        apple.userData.gameCompleted = true;
        return apple;
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
            const availablePositions = findAvailablePositions(snakeBoard);
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

// Função para encontrar posições disponíveis no tabuleiro (que não colidem com a cobra)
function findAvailablePositions(snakeBoard) {
    const availablePositions = [];
    
    // Verifica cada posição do tabuleiro 20x20
    for (let x = 0; x < 20; x++) {
        for (let z = 0; z < 20; z++) {
            // Verifica se a posição atual está ocupada pela cobra
            const isOccupied = snakeBoard.some(segment => segment.x === x && segment.z === z);
            
            // Se não estiver ocupada, adiciona às posições disponíveis
            if (!isOccupied) {
                availablePositions.push({ x, z });
            }
        }
    }
    
    return availablePositions;
}
