/**
 * Barrier Shapes Pool para o Jogo da Cobra
 * Cada forma é definida como um array de coordenadas relativas a uma posição base (0,0)
 * Este arquivo fornece uma variedade de formas que podem ser usadas como barreiras no jogo
 */

// Pool de formas para barreiras
const barrierShapes = {
    // Ponto único
    dot: [
        [0, 0]
    ],
    
    // Linha horizontal de tamanho 3
    horizontalLine: [
        [0, 0], [1, 0], [2, 0]
    ],
    
    // Linha vertical de tamanho 3
    verticalLine: [
        [0, 0], [0, 1], [0, 2]
    ],
    
    // Forma de L
    lShape: [
        [0, 0], [0, 1], [1, 1]
    ],
    
    // Forma de L invertido
    invertedL: [
        [0, 0], [1, 0], [0, 1]
    ],
    
    // Forma de T
    tShape: [
        [0, 0], [1, 0], [2, 0], [1, 1]
    ],
    
    // Forma de + (cruz)
    crossShape: [
        [1, 0], [0, 1], [1, 1], [2, 1], [1, 2]
    ],
    
    // Quadrado 2x2
    square: [
        [0, 0], [0, 1], [1, 0], [1, 1]
    ],
    
    // Formato de Z
    zShape: [
        [0, 0], [1, 0], [1, 1], [2, 1]
    ],
    
    // Formato de Z invertido
    invertedZ: [
        [0, 1], [1, 1], [1, 0], [2, 0]
    ],
    
    // Forma de U
    uShape: [
        [0, 0], [0, 1], [0, 2], [1, 2], [2, 2], [2, 1], [2, 0]
    ],
    
    // Padrão 2x3
    rectangle: [
        [0, 0], [1, 0], [0, 1], [1, 1], [0, 2], [1, 2]
    ]
};

/**
 * Retorna uma forma aleatória da pool de formas
 * @returns {Array} Array de coordenadas representando a forma
 */
function getRandomShape() {
    const shapes = Object.values(barrierShapes);
    const randomIndex = Math.floor(Math.random() * shapes.length);
    return shapes[randomIndex];
}

/**
 * Desloca uma forma para uma posição específica no tabuleiro
 * @param {Array} shape - A forma a ser deslocada
 * @param {number} x - Coordenada X da posição base
 * @param {number} y - Coordenada Y da posição base
 * @returns {Array} A forma deslocada
 */
function placeShapeAt(shape, x, y) {
    return shape.map(point => [point[0] + x, point[1] + y]);
}

/**
 * Verifica se uma forma colide com outras posições ocupadas
 * @param {Array} shape - A forma a ser verificada
 * @param {Array} occupiedPositions - Array de posições ocupadas no tabuleiro
 * @returns {boolean} true se houver colisão, false caso contrário
 */
function checkCollision(shape, occupiedPositions) {
    return shape.some(point => 
        occupiedPositions.some(pos => 
            pos[0] === point[0] && pos[1] === point[1]
        )
    );
}

/**
 * Gera uma barreira aleatória dentro dos limites do tabuleiro
 * @param {number} gridSize - Tamanho do tabuleiro (assumindo matriz quadrada)
 * @param {Array} occupiedPositions - Posições já ocupadas no tabuleiro
 * @returns {Array} Uma forma posicionada aleatoriamente sem colisões
 */
function generateRandomBarrier(gridSize, occupiedPositions) {
    const shape = getRandomShape();
    
    // Encontra o tamanho máximo da forma
    const maxX = Math.max(...shape.map(point => point[0]));
    const maxY = Math.max(...shape.map(point => point[1]));
    
    // Tenta várias posições até encontrar uma sem colisão
    let attempts = 0;
    const maxAttempts = 50;
    
    while (attempts < maxAttempts) {
        // Gera posição aleatória dentro dos limites do tabuleiro
        const x = Math.floor(Math.random() * (gridSize - maxX));
        const y = Math.floor(Math.random() * (gridSize - maxY));
        
        const placedShape = placeShapeAt(shape, x, y);
        
        // Verifica se a forma colocada colide com alguma posição ocupada
        if (!checkCollision(placedShape, occupiedPositions)) {
            return placedShape;
        }
        
        attempts++;
    }
    
    // Se todas as tentativas falharem, retorna null
    return null;
}

export { 
    barrierShapes, 
    getRandomShape, 
    placeShapeAt, 
    checkCollision, 
    generateRandomBarrier 
};
