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
    // Ambient light for general illumination
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);
    
    // Main directional light with shadows
    const dirLight = new THREE.DirectionalLight(0xffffff, 1);
    dirLight.position.set(40, 40, 40);
    dirLight.castShadow = true;
    
    // Optimize shadow map settings for performance and quality
    dirLight.shadow.mapSize.width = 1024;
    dirLight.shadow.mapSize.height = 1024;
    dirLight.shadow.camera.near = 0.5;
    dirLight.shadow.camera.far = 100;
    
    // Configure shadow camera frustum to cover the game area
    dirLight.shadow.camera.left = -40;
    dirLight.shadow.camera.right = 40;
    dirLight.shadow.camera.top = 40;
    dirLight.shadow.camera.bottom = -40;
    
    // Add a target for the directional light to aim at the center of the board
    dirLight.target.position.set(20, 0, 20);
    scene.add(dirLight.target);
    scene.add(dirLight);
    
    // Add a fill light from the opposite side (softer)
    const fillLight = new THREE.DirectionalLight(0xffffff, 0.3);
    fillLight.position.set(-20, 30, -20);
    scene.add(fillLight);
    
    // Return lights for potential later reference
    return { ambientLight, dirLight, fillLight };
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

export function addBoard(scene) {    // Remove any existing floor, grid, or terrain elements
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
    const TERRAIN_EXTEND = 160; // Maior terreno ao redor para efeito mais expansivo
      // First create an extended terrain that goes beyond the game area
    const terrainGeometry = new THREE.PlaneGeometry(
        GRID_SIZE + TERRAIN_EXTEND, 
        GRID_SIZE + TERRAIN_EXTEND, 
        120, // Mais subdivisões para maior detalhe
        120
    );
      // Create a more detailed terrain with playdoh-style colors and gradients
    const terrainMaterial = new THREE.ShaderMaterial({
        uniforms: {
            baseColor: { value: new THREE.Color(COLORS.background) },
            floorColor: { value: new THREE.Color(COLORS.floor) },
            accentColor: { value: new THREE.Color(COLORS.border) },
            noiseScale: { value: 0.15 },
            heightScale: { value: 1.2 },
            time: { value: 0.0 },
            colorVariation: { value: 0.3 }
        },
        vertexShader: `
            uniform float noiseScale;
            uniform float heightScale;
            uniform float time;
            
            varying vec2 vUv;
            varying float vHeight;
            varying vec3 vPosition;
            
            // Função de ruído melhorada
            float noise(vec2 p) {
                return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
            }
            
            // Ruído Perlin simplificado
            float perlinNoise(vec2 p) {
                vec2 i = floor(p);
                vec2 f = fract(p);
                
                float a = noise(i);
                float b = noise(i + vec2(1.0, 0.0));
                float c = noise(i + vec2(0.0, 1.0));
                float d = noise(i + vec2(1.0, 1.0));
                
                vec2 u = f * f * (3.0 - 2.0 * f);
                
                return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
            }
            
            // Fractional Brownian Motion para terreno mais natural
            float fbm(vec2 p) {
                float value = 0.0;
                float amplitude = 0.5;
                float frequency = 1.0;
                
                for (int i = 0; i < 6; i++) {
                    value += amplitude * perlinNoise(p * frequency);
                    amplitude *= 0.6;
                    frequency *= 2.1;
                }
                
                return value;
            }
            
            void main() {
                vUv = uv;
                vPosition = position;
                
                // Calcular distância do centro (0.5, 0.5)
                float dist = length(uv - 0.5);
                
                // Criar altura baseada em ruído, com transição suave
                float height = 0.0;
                
                // Aplicar altura apenas fora da área do jogo, com transição suave
                if (dist > 0.22) {
                    float noiseValue = fbm(position.xz * noiseScale + time * 0.1);
                    height = noiseValue * heightScale;
                    
                    // Suavizar transição da área do jogo para o terreno
                    float transition = smoothstep(0.22, 0.35, dist);
                    height *= transition;
                    
                    // Mais variação conforme se afasta do centro
                    height *= (1.0 + dist * 0.8);
                }
                
                vHeight = height;
                
                // Aplicar altura ao vértice
                vec3 newPosition = position;
                newPosition.y += height;
                
                gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
            }
        `,
        fragmentShader: `
            uniform vec3 baseColor;
            uniform vec3 floorColor;
            uniform vec3 accentColor;
            uniform float colorVariation;
            uniform float time;
            
            varying vec2 vUv;
            varying float vHeight;
            varying vec3 vPosition;
            
            // Função de ruído para variação de cor
            float noise(vec2 p) {
                return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
            }
            
            // Mistura de cores estilo playdoh
            vec3 playdohMix(vec3 color1, vec3 color2, vec3 color3, float factor, vec2 pos) {
                // Criar padrões orgânicos de mistura
                float noise1 = noise(pos * 20.0 + time * 0.5);
                float noise2 = noise(pos * 35.0 - time * 0.3);
                float noise3 = noise(pos * 50.0 + time * 0.2);
                
                // Combinear ruídos para criar padrões complexos
                float blend1 = sin(noise1 * 6.28) * 0.5 + 0.5;
                float blend2 = sin(noise2 * 6.28) * 0.5 + 0.5;
                float blend3 = sin(noise3 * 6.28) * 0.5 + 0.5;
                
                // Misturar cores de forma orgânica
                vec3 mix1 = mix(color1, color2, blend1 * factor);
                vec3 mix2 = mix(mix1, color3, blend2 * factor * 0.7);
                
                // Adicionar variação sutil
                return mix2 + (blend3 - 0.5) * colorVariation * 0.1;
            }
            
            void main() {
                float distFromCenter = length(vUv - 0.5);
                
                // Cores base mais suaves estilo playdoh
                vec3 centerColor = floorColor;
                vec3 midColor = mix(floorColor, baseColor, 0.6);
                vec3 outerColor = mix(baseColor, accentColor, 0.4);
                
                // Transições suaves entre áreas
                vec3 color;
                if (distFromCenter < 0.25) {
                    // Área central do jogo - cor limpa
                    color = centerColor;
                } else if (distFromCenter < 0.4) {
                    // Transição para terreno
                    float factor = smoothstep(0.25, 0.4, distFromCenter);
                    color = playdohMix(centerColor, midColor, outerColor, factor, vPosition.xz);
                } else {
                    // Terreno externo
                    float heightFactor = clamp(vHeight * 2.0, 0.0, 1.0);
                    color = playdohMix(midColor, outerColor, baseColor, heightFactor, vPosition.xz);
                }
                
                // Adicionar variação de textura sutil estilo playdoh
                float surfaceNoise = noise(vPosition.xz * 80.0);
                color = mix(color, color * 0.95, surfaceNoise * 0.2);
                
                // Pequeno highlight nas elevações
                if (vHeight > 0.3) {
                    color = mix(color, color * 1.1, (vHeight - 0.3) * 0.3);
                }
                
                // Efeito vinheta suave
                color = mix(color, color * 0.85, smoothstep(0.45, 0.5, distFromCenter));
                
                gl_FragColor = vec4(color, 1.0);
            }
        `,
        side: THREE.DoubleSide
    });
    
    const terrain = new THREE.Mesh(terrainGeometry, terrainMaterial);
    terrain.rotation.x = -Math.PI / 2;
    terrain.position.set(GRID_SIZE / 2, -0.1, GRID_SIZE / 2); // Slightly below game board
    terrain.receiveShadow = true;
    terrain.name = "terrain";
    scene.add(terrain);    // Now create the actual game board with simple geometry
    const planeGeometry = new THREE.PlaneGeometry(GRID_SIZE, GRID_SIZE);
    planeGeometry.rotateX(-Math.PI * 0.5);
    
    const planeMaterial = new THREE.MeshStandardMaterial({
        color: COLORS.floor,
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
    scene.traverse(object => {        // Atualiza o material padrão do chão se ele existir
        if (object.name === "floor" && object.material) {
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
          // Atualiza o shader do terreno circundante
        if (object.name === "terrain" && object.material && object.material.uniforms) {
            object.material.uniforms.baseColor.value.set(COLORS.background);
            object.material.uniforms.floorColor.value.set(COLORS.floor);
            object.material.uniforms.accentColor.value.set(COLORS.border);
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

// Função para animar o terrain (atualiza o tempo do shader)
export function animateTerrain(scene, time) {
    scene.traverse(object => {
        if (object.name === "terrain" && object.material && object.material.uniforms) {
            if (object.material.uniforms.time) {
                object.material.uniforms.time.value = time * 0.001; // Animação lenta
            }
        }
    });
}


