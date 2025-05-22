// scene.js
// Responsável por criar e configurar a cena, câmera, luzes e chão

import { createTreeModel, createRockModel, getRandomTreePosition, getRandomRockPosition } from './models.js';

// Cores fixas para a cena
const COLORS = {
    background: 0x7FDBCA,
    floor: 0x5cdb95,
    border: 0x00ffff,
    treeTop: 0x2e8b57
};

export function createScene() {
    const scene = new THREE.Scene();
    // Blue-greenish background
    scene.background = new THREE.Color(COLORS.background);
    return scene;
}

export function createCamera() {
    const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
    // Position for isometric-like view
    camera.position.set(15, 13, 15);
    camera.lookAt(3, 0, 3);
    return camera;
}

export function createRenderer() {
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);
    return renderer;
}

export function addLights(scene) {
    scene.add(new THREE.AmbientLight(0xffffff, 0.5));
    const dirLight = new THREE.DirectionalLight(0xffffff, 1);
    dirLight.position.set(10, 20, 10);
    scene.add(dirLight);
}

export function addFloor(scene) {
    const floor = new THREE.Mesh(
        new THREE.PlaneGeometry(21, 21, 20, 20),
        new THREE.MeshStandardMaterial({ 
            color: COLORS.floor,
            roughness: 0.7,
            flatShading: true
        })
    );
    floor.rotation.x = -Math.PI / 2;
    scene.add(floor);
}

export function addBoard(scene) {
    // Remove gridHelper antigo se existir
    for (let i = scene.children.length - 1; i >= 0; i--) {
        if (scene.children[i].isGridHelper) scene.remove(scene.children[i]);
    }
    
    // Adiciona o chão (plano base do tabuleiro)
    const floor = new THREE.Mesh(
        new THREE.PlaneGeometry(40, 40),
        new THREE.MeshStandardMaterial({ 
            color: COLORS.floor, // Cor fixa verde
            roughness: 0.7,
            flatShading: true
        })
    );
    floor.rotation.x = -Math.PI / 2;
    floor.position.set(20, 0, 20);
    scene.add(floor);
    
    // Adiciona o grid (linhas do tabuleiro)
    // Cada quadrado terá tamanho 2 (tabuleiro 20x20, ocupa 40x40 unidades)
    const gridColor = 0xffffff;
    const gridSize = 40;
    const gridDivisions = 20;
    
    // Cria um grid helper mais visível
    const gridHelper = new THREE.GridHelper(gridSize, gridDivisions, gridColor, gridColor);
    gridHelper.position.set(gridSize / 2, 0.01, gridSize / 2); // 0.01 para ficar levemente acima do chão
    gridHelper.material.opacity = 0.7; // Aumenta a opacidade
    gridHelper.material.transparent = true;
    gridHelper.material.depthWrite = false; // Evita problemas de renderização
    scene.add(gridHelper);
      // Linhas adicionais para destacar melhor as bordas do tabuleiro
    const borderMaterial = new THREE.LineBasicMaterial({ color: COLORS.border, linewidth: 2 });
    const borderGeometry = new THREE.BufferGeometry();
    const borderVertices = new Float32Array([
        0, 0.02, 0,  40, 0.02, 0,  // Linha inferior
        40, 0.02, 0,  40, 0.02, 40, // Linha direita
        40, 0.02, 40, 0, 0.02, 40,  // Linha superior
        0, 0.02, 40,  0, 0.02, 0    // Linha esquerda
    ]);
    borderGeometry.setAttribute('position', new THREE.BufferAttribute(borderVertices, 3));
    const borderLine = new THREE.Line(borderGeometry, borderMaterial);
    scene.add(borderLine);
    
    return { floor, gridHelper, borderLine };
}

export function getBoardCellCenter(x, z) {
    // Garantir que x e z estão nos limites válidos (0-19)
    const validX = Math.max(0, Math.min(19, x));
    const validZ = Math.max(0, Math.min(19, z));
    
    // x, z de 0 a 19 => centro do quadrado
    // Cada célula tem tamanho 2x2, portanto o centro é calculado como posição*2 + 1
    return { 
        x: validX * 2 + 1, 
        z: validZ * 2 + 1 
    };
}

// Gera uma matriz de hitboxes para o tabuleiro 20x20
export function generateBoardHitboxes() {
    const hitboxes = [];
    for (let x = 0; x < 20; x++) {
        hitboxes[x] = [];
        for (let z = 0; z < 20; z++) {
            const { x: cx, z: cz } = getBoardCellCenter(x, z);
            // Cada hitbox é um quadrado de 2x2 centrado em (cx, cz)
            hitboxes[x][z] = {
                minX: cx - 1,
                maxX: cx + 1,
                minZ: cz - 1,
                maxZ: cz + 1,
                centerX: cx,
                centerZ: cz,
                x,
                z
            };
        }
    }
    return hitboxes;
}

// Adiciona elementos decorativos low poly ao redor do tabuleiro
export function addLowPolyDecorations(scene) {
    // Temporariamente desabilitado o spawn de árvores e pedras
    console.log("Decorações low poly temporariamente desabilitadas");
    
    // Código para adicionar árvores e pedras está comentado por enquanto
    
    /*
    // Adicionar árvores low poly
    const treeCount = 30;
    const gridSize = 40;
    
    for (let i = 0; i < treeCount; i++) {
        // Criar modelo da árvore
        const tree = createTreeModel();
        
        // Obter posição aleatória para a árvore
        const position = getRandomTreePosition(gridSize);
        tree.position.set(position.x, 0, position.z);
        
        // Variação aleatória de escala para interesse visual
        const scale = 0.5 + Math.random() * 0.7;
        tree.scale.set(scale, scale, scale);
        
        scene.add(tree);
    }
    
    // Adicionar algumas pedras low poly
    const rockCount = 15;
    for (let i = 0; i < rockCount; i++) {
        // Criar modelo da pedra
        const rock = createRockModel();
        
        // Obter posição aleatória para a pedra
        const position = getRandomRockPosition(gridSize);
        rock.position.set(position.x, 0, position.z);
        
        // Escala e rotação aleatórias para interesse visual
        const scale = 0.3 + Math.random() * 0.7;
        rock.scale.set(scale, scale * 0.7, scale);
        rock.rotation.set(
            Math.random() * 0.3,
            Math.random() * Math.PI * 2,
            Math.random() * 0.3
        );
        
        scene.add(rock);
    }
    */
}


