// scene.js
// Responsável por criar e configurar a cena, câmera, luzes e chão

import * as THREE from 'three';
import { createTreeModel, createRockModel, getRandomTreePosition, getRandomRockPosition } from './models.js';
import { createSkyDomeWithBoardTheme, updateSkyDomeWithBoardTheme } from './board-theme-manager.js';

// Cores para cada tema
const THEME_COLORS = {
    green: {
        background: 0x7FDBCA,
        floor: 0x5cdb95,
        border: 0x00ffff,
        gridLines: 0xaaffcc,
        treeTop: 0x2e8b57,
        // Sky colors for gradient sky dome
        skyTop: 0x87CEEB,    // Bright sky blue
        skyBottom: 0xE0F6FF, // Light blue/white
        skyIntensity: 1.0
    },
    purple: {
        background: 0xd2c4e2,
        floor: 0x9b59b6,
        border: 0xbb8cce,
        gridLines: 0xd6b0fd,
        treeTop: 0x7d55a0,
        // Sky colors for gradient sky dome
        skyTop: 0x9B59B6,     // Purple theme sky
        skyBottom: 0xE8D5F2,  // Light purple
        skyIntensity: 0.9
    },
    orange: {
        background: 0xffeac9,
        floor: 0xff8c42,
        border: 0xffac42,
        gridLines: 0xffd1a3,
        treeTop: 0xd46100,
        // Sky colors for gradient sky dome
        skyTop: 0xFF8C00,     // Orange theme sky
        skyBottom: 0xFFE4B5,  // Light orange/peach
        skyIntensity: 0.95
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

// Referência para o domo do céu atual
let currentSkyDome = null;

export function createScene() {
    const scene = new THREE.Scene();
    // Create advanced sky dome with moving clouds instead of simple fog
    // The sky dome will be updated by the board theme manager when themes are applied
    createAdvancedSkyDome(scene);
    return scene;
}

// Create advanced sky dome with gradient colors and moving clouds
export function createAdvancedSkyDome(scene) {
    return createSkyDomeWithBoardTheme(scene);
}

// Update sky dome colors for theme changes using advanced sky system
export function updateSkyDome(scene) {
    updateSkyDomeWithBoardTheme(scene);
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
        // Create orthographic camera - properly centered and sized for the game board
    const aspect = window.innerWidth / window.innerHeight;
    const frustumSize = 70; // Optimal size for game board visibility
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
    orthographicCamera.position.set(boardCenterX, 45, boardCenterZ); // Position above board center
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
        color: 0x000000, // Black grid lines for all themes
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
    scene.add(gridMesh);    // Create 3D floating score display at the East barrier where snake initially faces
    createFloatingScoreDisplay(scene, GRID_SIZE);
}

// Function to create a 3D floating score display at the East barrier
function createFloatingScoreDisplay(scene, GRID_SIZE) {
    const group = new THREE.Group();
    
    // Position the score display at the East wall where snake initially faces
    const eastWallX = 41;
    const boardCenterZ = GRID_SIZE / 2; // Center of the board
    
    group.position.set(eastWallX - 3, 6, boardCenterZ); // Floating higher at y=6
      // Rotate the entire score display 180 degrees to face the camera better
    group.rotation.y = Math.PI; // 180 degrees rotation
    
    // Add some sparkle effect with small decorative elements
    for (let i = 0; i < 6; i++) {
        const sparkleGeometry = new THREE.SphereGeometry(0.08, 8, 8);
        const sparkleMaterial = new THREE.MeshStandardMaterial({
            color: 0xffffff,
            emissive: 0xffffff,
            emissiveIntensity: 0.4,
            transparent: true,
            opacity: 0.8
        });
        const sparkle = new THREE.Mesh(sparkleGeometry, sparkleMaterial);
        
        // Random position around the score display
        const angle = (i / 6) * Math.PI * 2;
        const radius = 2.5 + Math.random() * 1;
        sparkle.position.set(
            Math.cos(angle) * radius,
            0.5 + Math.random() * 3,
            Math.sin(angle) * radius
        );
        group.add(sparkle);
    }
    
    group.name = "floatingScoreDisplay";    // Store references for updating
    group.userData = {
        numbersGroup: new THREE.Group()
    };
      // Rotate the numbers to face the camera properly
    group.userData.numbersGroup.rotation.y = Math.PI / 2; // Rotate +90 degrees around Y-axis to face camera
    
    // Add the numbers group to the main group
    group.add(group.userData.numbersGroup);
    
    // Initial score render
    updateFloatingScoreDisplay(group, 0);
    
    scene.add(group);
}

// Function to create 3D geometry for a specific digit (0-9)
function create3DDigit(digit) {
    const group = new THREE.Group();
    const digitHeight = 2;
    const digitWidth = 1.2;
    const digitDepth = 0.3;
    
    // Material for the 3D numbers - gold with emission
    const numberMaterial = new THREE.MeshStandardMaterial({
        color: 0xFFD700, // Gold color
        emissive: 0x332200, // Slight glow
        emissiveIntensity: 0.2,
        metalness: 0.7,
        roughness: 0.2
    });
    
    // Create segments based on digit
    const segments = getDigitSegments(digit);
    
    // Segment dimensions
    const segmentLength = digitWidth * 0.8;
    const segmentThickness = 0.15;
    
    segments.forEach((segment, index) => {
        if (segment) {
            const geometry = getSegmentGeometry(index, segmentLength, segmentThickness, digitHeight, digitDepth);
            const mesh = new THREE.Mesh(geometry, numberMaterial);
            group.add(mesh);
        }
    });
    
    return group;
}

// Define which segments are active for each digit (7-segment display style)
function getDigitSegments(digit) {
    const segmentPatterns = {
        0: [true, true, true, true, true, true, false],    // Top, TopRight, BottomRight, Bottom, BottomLeft, TopLeft, Middle
        1: [false, true, true, false, false, false, false],
        2: [true, true, false, true, true, false, true],
        3: [true, true, true, true, false, false, true],
        4: [false, true, true, false, false, true, true],
        5: [true, false, true, true, false, true, true],
        6: [true, false, true, true, true, true, true],
        7: [true, true, true, false, false, false, false],
        8: [true, true, true, true, true, true, true],
        9: [true, true, true, true, false, true, true]
    };
    return segmentPatterns[digit] || segmentPatterns[0];
}

// Create geometry for each segment of the 7-segment display
function getSegmentGeometry(segmentIndex, length, thickness, height, depth) {
    const halfLength = length / 2;
    const halfHeight = height / 2;
    const halfThickness = thickness / 2;
    
    let geometry;
    
    switch (segmentIndex) {
        case 0: // Top horizontal
            geometry = new THREE.BoxGeometry(length, thickness, depth);
            geometry.translate(0, halfHeight - halfThickness, 0);
            break;
        case 1: // Top right vertical
            geometry = new THREE.BoxGeometry(thickness, halfHeight, depth);
            geometry.translate(halfLength - halfThickness, halfHeight / 2, 0);
            break;
        case 2: // Bottom right vertical
            geometry = new THREE.BoxGeometry(thickness, halfHeight, depth);
            geometry.translate(halfLength - halfThickness, -halfHeight / 2, 0);
            break;
        case 3: // Bottom horizontal
            geometry = new THREE.BoxGeometry(length, thickness, depth);
            geometry.translate(0, -halfHeight + halfThickness, 0);
            break;
        case 4: // Bottom left vertical
            geometry = new THREE.BoxGeometry(thickness, halfHeight, depth);
            geometry.translate(-halfLength + halfThickness, -halfHeight / 2, 0);
            break;
        case 5: // Top left vertical
            geometry = new THREE.BoxGeometry(thickness, halfHeight, depth);
            geometry.translate(-halfLength + halfThickness, halfHeight / 2, 0);
            break;
        case 6: // Middle horizontal
            geometry = new THREE.BoxGeometry(length, thickness, depth);
            geometry.translate(0, 0, 0);
            break;
        default:
            geometry = new THREE.BoxGeometry(0.1, 0.1, 0.1); // Fallback
    }
    
    return geometry;
}

// Function to update the floating score display
export function updateFloatingScoreDisplay(scoreGroup, score) {
    if (!scoreGroup || !scoreGroup.userData || !scoreGroup.userData.numbersGroup) return;
    
    const numbersGroup = scoreGroup.userData.numbersGroup;
    
    // Clear existing numbers
    while (numbersGroup.children.length > 0) {
        numbersGroup.remove(numbersGroup.children[0]);
    }
    
    // Convert score to string and create 3D digits
    const scoreString = score.toString();
    const digitSpacing = 1.5; // Space between digits
    const totalWidth = (scoreString.length - 1) * digitSpacing;
    
    // Create each digit
    scoreString.split('').forEach((digitChar, index) => {
        const digit = parseInt(digitChar);
        const digitMesh = create3DDigit(digit);
        
        // Position digit (center the whole number)
        const xOffset = (index * digitSpacing) - (totalWidth / 2);
        digitMesh.position.set(xOffset, 0, 0);
        
        numbersGroup.add(digitMesh);
    });
    
    // Add a subtle floating animation to the numbers group
    numbersGroup.userData = { 
        originalY: numbersGroup.position.y,
        time: 0
    };
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
    // Update sky dome instead of fog
    updateSkyDome(scene);
    
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

// Function to animate the floating 3D score display
export function animateFloatingScore(scene, time) {
    const scoreDisplay = scene.getObjectByName("floatingScoreDisplay");
    if (scoreDisplay && scoreDisplay.userData.numbersGroup) {
        const numbersGroup = scoreDisplay.userData.numbersGroup;
        if (numbersGroup.userData) {            // Gentle floating animation
            numbersGroup.userData.time += 0.01;
            const floatOffset = Math.sin(numbersGroup.userData.time) * 0.1;
            numbersGroup.position.y = numbersGroup.userData.originalY + floatOffset;
            
            // Keep numbers facing camera - no rotation animation
        }
    }
}


