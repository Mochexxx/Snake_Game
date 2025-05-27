// scene.js
// Responsável por criar e configurar a cena, câmera, luzes e chão

import * as THREE from 'three';
import { createTreeModel, createRockModel, getRandomTreePosition, getRandomRockPosition } from './models.js';

// Cores para cada tema
const THEME_COLORS = {
    green: {
        background: 0x7FDBCA,
        floor: 0x5cdb95,
        border: 0x00ffff,
        gridLines: 0xaaffcc,
        treeTop: 0x2e8b57
    },
    purple: {
        background: 0xd2c4e2,
        floor: 0x9b59b6,
        border: 0xbb8cce,
        gridLines: 0xd6b0fd,
        treeTop: 0x7d55a0
    },
    orange: {
        background: 0xffeac9,
        floor: 0xff8c42,
        border: 0xffac42,
        gridLines: 0xffd1a3,
        treeTop: 0xd46100
    }
};

// Tema atual (padrão: verde)
let currentTheme = 'green';

// Cores em uso atualmente
let COLORS = THEME_COLORS[currentTheme];

// Variáveis para o sistema de câmeras
let currentCameraType = 'perspective'; // 'perspective' ou 'orthographic'
let perspectiveCamera = null;
let orthographicCamera = null;

export function createScene() {
    const scene = new THREE.Scene();
    // Use fog to create depth and distance effect
    scene.fog = new THREE.FogExp2(COLORS.background, 0.01);
    return scene;
}

export function createCamera() {
    // Create both perspective and orthographic cameras
    createBothCameras();
    
    // Return the currently active camera
    return getCurrentCamera();
}

function createBothCameras() {
    // Snake starts at (9,9) in matrix, each cell is 2 units, so position is (19,0,19)
    const snakeX = 19; // 9 * 2 + 1 (center of cell)
    const snakeZ = 19; // 9 * 2 + 1 (center of cell)
    
    // Create perspective camera
    perspectiveCamera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
    perspectiveCamera.position.set(snakeX, 3, snakeZ);
    perspectiveCamera.lookAt(snakeX, 0, snakeZ);
      
    // Create orthographic camera - centered on board
    const aspect = window.innerWidth / window.innerHeight;
    const frustumSize = 80; // Increased size to see more of the board
    const boardCenterX = 20; // Center of 40x40 board (0 to 40)
    const boardCenterZ = 20; // Center of 40x40 board (0 to 40)
    
    orthographicCamera = new THREE.OrthographicCamera(
        frustumSize * aspect / -2, // left
        frustumSize * aspect / 2,  // right
        frustumSize / 2,           // top
        frustumSize / -2,          // bottom
        0.1,                       // near
        1000                       // far
    );
    orthographicCamera.position.set(boardCenterX, 50, boardCenterZ); // Position directly above board center
    orthographicCamera.lookAt(boardCenterX, 0, boardCenterZ); // Look down at board center
}

export function getCurrentCamera() {
    return currentCameraType === 'perspective' ? perspectiveCamera : orthographicCamera;
}

export function switchCameraType(type) {
    if (type === 'perspective' || type === 'orthographic') {
        const oldCamera = getCurrentCamera();
        currentCameraType = type;
        const newCamera = getCurrentCamera();
        
        // Copy position and rotation from old camera to new camera
        if (oldCamera && newCamera) {
            newCamera.position.copy(oldCamera.position);
            newCamera.rotation.copy(oldCamera.rotation);
        }
        
        return newCamera;
    }
    return getCurrentCamera();
}

export function getCameraType() {
    return currentCameraType;
}

// Update camera aspect ratio on window resize
export function updateCameraAspect() {
    const aspect = window.innerWidth / window.innerHeight;
    
    if (perspectiveCamera) {
        perspectiveCamera.aspect = aspect;
        perspectiveCamera.updateProjectionMatrix();
    }
    
    if (orthographicCamera) {
        const frustumSize = 80; // Same size as creation
        orthographicCamera.left = frustumSize * aspect / -2;
        orthographicCamera.right = frustumSize * aspect / 2;
        orthographicCamera.top = frustumSize / 2;
        orthographicCamera.bottom = frustumSize / -2;
        orthographicCamera.updateProjectionMatrix();
    }
}

export function createRenderer() {
    const renderer = new THREE.WebGLRenderer({ 
        antialias: true,
        powerPreference: "high-performance"
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.physicallyCorrectLights = true;
    document.body.appendChild(renderer.domElement);
    return renderer;
}

export function addLights(scene) {
    // Use dynamic import to avoid multiple THREE.js instances
    return import('./lighting-system.js').then(lightingModule => {
        return lightingModule.createLights(scene);
    }).catch(error => {
        console.warn('Lighting system not available, using fallback lights:', error);
        
        // Fallback lighting implementation
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        scene.add(ambientLight);
        
        const dirLight = new THREE.DirectionalLight(0xffffff, 1);
        dirLight.position.set(40, 40, 40);
        dirLight.castShadow = true;
        
        dirLight.shadow.mapSize.width = 1024;
        dirLight.shadow.mapSize.height = 1024;
        dirLight.shadow.camera.near = 0.5;
        dirLight.shadow.camera.far = 100;
        dirLight.shadow.camera.left = -40;
        dirLight.shadow.camera.right = 40;
        dirLight.shadow.camera.top = 40;
        dirLight.shadow.camera.bottom = -40;
        
        dirLight.target.position.set(20, 0, 20);
        scene.add(dirLight.target);
        scene.add(dirLight);
        
        const fillLight = new THREE.DirectionalLight(0xffffff, 0.3);
        fillLight.position.set(-20, 30, -20);
        scene.add(fillLight);
        
        return { ambientLight, dirLight, fillLight };
    });
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
    // Remove any existing floor, grid, or terrain elements
    for (let i = scene.children.length - 1; i >= 0; i--) {
        if (scene.children[i].isGridHelper || 
            (scene.children[i].isMesh && 
             (scene.children[i].name === "floor" || 
              scene.children[i].name === "terrain" || 
              scene.children[i].name === "gridIntersections")) ||
            (scene.children[i].isLineSegments && scene.children[i].name === "gridLines")) {
            scene.remove(scene.children[i]);
        }
    }
    
    // Constants for game board and extended terrain
    const GRID_DIVISIONS = 20; // Exactly 20x20 grid
    const CELL_SIZE = 2; // Each cell is 2x2 units
    const GRID_SIZE = GRID_DIVISIONS * CELL_SIZE; // 40x40 units for game board
    const TERRAIN_EXTEND = 160; // Extended terrain around the game area
    
    // Create an extended terrain with playdoh-style material
    const terrainGeometry = new THREE.PlaneGeometry(
        GRID_SIZE + TERRAIN_EXTEND, 
        GRID_SIZE + TERRAIN_EXTEND, 
        32, // Reduced subdivisions for uniform appearance
        32
    );
    
    // Create simple playdoh-style material that responds to lighting
    const terrainMaterial = new THREE.MeshStandardMaterial({
        color: COLORS.floor,
        roughness: 0.8, // High roughness for playdoh-like appearance
        metalness: 0.0, // No metallic properties
        flatShading: false, // Smooth shading for uniform appearance
        transparent: false
    });
    
    const terrain = new THREE.Mesh(terrainGeometry, terrainMaterial);
    terrain.rotation.x = -Math.PI / 2;
    terrain.position.set(GRID_SIZE / 2, -0.1, GRID_SIZE / 2); // Slightly below game board
    terrain.receiveShadow = true;
    terrain.castShadow = false;
    terrain.name = "terrain";
    scene.add(terrain);
    
    // Create the game board with the same playdoh material
    const planeGeometry = new THREE.PlaneGeometry(GRID_SIZE, GRID_SIZE);
    planeGeometry.rotateX(-Math.PI * 0.5);
    
    const planeMaterial = new THREE.MeshStandardMaterial({
        color: COLORS.floor,
        roughness: 0.8, // Match terrain material
        metalness: 0.0,
        flatShading: false
    });
    
    // Create grid lines using LineSegments for the 20x20 grid
    const gridLines = [];
    const cellSize = GRID_SIZE / GRID_DIVISIONS; // Size of each cell (2 units)
    
    // Create horizontal lines
    for (let i = 0; i <= GRID_DIVISIONS; i++) {
        const y = i * cellSize;
        gridLines.push(0, 0.01, y);     // Start point
        gridLines.push(GRID_SIZE, 0.01, y); // End point
    }
    
    // Create vertical lines  
    for (let i = 0; i <= GRID_DIVISIONS; i++) {
        const x = i * cellSize;
        gridLines.push(x, 0.01, 0);         // Start point
        gridLines.push(x, 0.01, GRID_SIZE); // End point
    }
    
    const gridGeometry = new THREE.BufferGeometry();
    gridGeometry.setAttribute('position', new THREE.Float32BufferAttribute(gridLines, 3));
    
    const gridMaterial = new THREE.LineBasicMaterial({ 
        color: 0x000000, // Black grid lines
        transparent: true,
        opacity: 0.8
    });
    
    const gridMesh = new THREE.LineSegments(gridGeometry, gridMaterial);
    gridMesh.name = "gridLines";    
    // Create floor mesh
    const floor = new THREE.Mesh(planeGeometry, planeMaterial);
    floor.position.set(GRID_SIZE / 2, 0, GRID_SIZE / 2);
    floor.name = "floor";
    floor.receiveShadow = true;
    scene.add(floor);
    
    // Add the grid lines on top
    scene.add(gridMesh);
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

// Define o tema atual
export function setTheme(themeName) {
    if (THEME_COLORS[themeName]) {
        currentTheme = themeName;
        COLORS = THEME_COLORS[themeName];
    }
}

// Atualiza as cores da cena conforme o tema
export function updateSceneTheme(scene) {
    // Atualiza a cor de fundo e fog
    if (scene.fog) {
        scene.fog.color.set(COLORS.background);
    }
    
    // Procura e atualiza as cores de todos os elementos temáticos
    scene.traverse(object => {        
        // Atualiza o material padrão do chão se ele existir
        if (object.name === "floor" && object.material) {
            object.material.color.set(COLORS.floor);
        }
        
        // Update terrain material to match theme
        if (object.name === "terrain" && object.material) {
            object.material.color.set(COLORS.floor);
        }
        
        // Manter as linhas da grade sempre pretas
        if (object.name === "gridLines" && object.material) {
            object.material.color.set(0x000000);
        }
        
        // Update border glow
        if (object.name === "borderGlow" && object.material && object.material.uniforms) {
            if (object.material.uniforms.color) {
                object.material.uniforms.color.value.set(COLORS.border);
            }
        }
        
        // Atualiza as bordas do tabuleiro
        if (object.isLine && object.material) {
            object.material.color.set(COLORS.border);
        }
    });
}

// Obtém o tema atual
export function getCurrentTheme() {
    return currentTheme;
}

// Create consistent playdoh-style material for game objects
export function createPlaydohMaterial(color, options = {}) {
    return new THREE.MeshStandardMaterial({
        color: color || COLORS.floor,
        roughness: options.roughness || 0.8, // High roughness for playdoh-like appearance
        metalness: options.metalness || 0.0, // No metallic properties
        flatShading: options.flatShading || false, // Smooth shading for uniform appearance
        transparent: options.transparent || false,
        opacity: options.opacity || 1.0
    });
}

// Get current theme colors for consistent styling
export function getThemeColors() {
    return { ...COLORS };
}

// Placeholder function for animateTerrain (no longer needed with simple materials)
export function animateTerrain(scene, time) {
    // No animation needed for simple playdoh materials
    // This function is kept for compatibility with main.js
}


