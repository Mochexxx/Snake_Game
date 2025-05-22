// models.js
// Armazena modelos 3D reutilizáveis para o jogo

// Importa a biblioteca Three.js
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.128.0/build/three.module.js';

// Cores fixas para os modelos
const COLORS = {
    trunk: 0x8B4513,
    treeTop: 0x2e8b57,
    rock: 0xd3d3d3
};

/**
 * Cria um modelo de árvore low poly
 * @returns {THREE.Group} Grupo contendo o modelo da árvore
 */
export function createTreeModel() {
    // Criar tronco da árvore
    const trunkGeometry = new THREE.CylinderGeometry(0.2, 0.3, 1.5, 5);
    const trunkMaterial = new THREE.MeshStandardMaterial({ 
        color: COLORS.trunk,
        flatShading: true
    });
    const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
    
    // Criar topo da árvore (cone)
    const topGeometry = new THREE.ConeGeometry(0.8, 2, 6);
    const topMaterial = new THREE.MeshStandardMaterial({ 
        color: COLORS.treeTop,
        flatShading: true
    });
    const top = new THREE.Mesh(topGeometry, topMaterial);
    top.position.y = 1.75;
    
    // Agrupar tronco e topo
    const tree = new THREE.Group();
    tree.add(trunk);
    tree.add(top);
    
    return tree;
}

/**
 * Cria um modelo de pedra low poly
 * @returns {THREE.Mesh} Mesh contendo o modelo da pedra
 */
export function createRockModel() {
    // Criar pedra
    const rockGeometry = new THREE.DodecahedronGeometry(1, 0);
    const rockMaterial = new THREE.MeshStandardMaterial({ 
        color: COLORS.rock,
        flatShading: true
    });
    const rock = new THREE.Mesh(rockGeometry, rockMaterial);
    
    return rock;
}

/**
 * Define a posição aleatória para uma árvore no mapa
 * @param {number} gridSize Tamanho do grid onde o jogo acontece
 * @returns {Object} Coordenadas {x, z} para posicionar a árvore
 */
export function getRandomTreePosition(gridSize) {
    let x, z;
    
    // Decidir se coloca árvore dentro ou fora do grid
    if (Math.random() > 0.3) {
        // Colocar fora do grid
        if (Math.random() > 0.5) {
            // Colocar ao longo do eixo X
            x = (Math.random() > 0.5 ? -5 : gridSize + 5) + (Math.random() * 10 - 5);
            z = Math.random() * (gridSize + 10) - 5;
        } else {
            // Colocar ao longo do eixo Z
            x = Math.random() * (gridSize + 10) - 5;
            z = (Math.random() > 0.5 ? -5 : gridSize + 5) + (Math.random() * 10 - 5);
        }
    } else {
        // Colocar algumas árvores nas bordas do grid
        const distanciaBorda = Math.random() * 3;
        if (Math.random() > 0.5) {
            // Colocar próximo às bordas X
            x = (Math.random() > 0.5 ? distanciaBorda : gridSize - distanciaBorda);
            z = Math.random() * gridSize;
        } else {
            // Colocar próximo às bordas Z
            x = Math.random() * gridSize;
            z = (Math.random() > 0.5 ? distanciaBorda : gridSize - distanciaBorda);
        }
    }
    
    return { x, z };
}

/**
 * Define a posição aleatória para uma pedra no mapa
 * @param {number} gridSize Tamanho do grid onde o jogo acontece
 * @returns {Object} Coordenadas {x, z} para posicionar a pedra
 */
export function getRandomRockPosition(gridSize) {
    let x, z;
    
    if (Math.random() > 0.6) {
        // Fora do grid
        if (Math.random() > 0.5) {
            x = (Math.random() > 0.5 ? -3 : gridSize + 3) + (Math.random() * 6 - 3);
            z = Math.random() * (gridSize + 6) - 3;
        } else {
            x = Math.random() * (gridSize + 6) - 3;
            z = (Math.random() > 0.5 ? -3 : gridSize + 3) + (Math.random() * 6 - 3);
        }
    } else {
        // Nas bordas do grid
        const distanciaBorda = Math.random() * 2;
        if (Math.random() > 0.5) {
            x = (Math.random() > 0.5 ? distanciaBorda : gridSize - distanciaBorda);
            z = Math.random() * gridSize;
        } else {
            x = Math.random() * gridSize;
            z = (Math.random() > 0.5 ? distanciaBorda : gridSize - distanciaBorda);
        }
    }
    
    return { x, z };
}