// scene.js
// Responsável por criar e configurar a cena, câmera, luzes e chão
import * as THREE from 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.module.js';
// ...existing code...
export function createScene() {
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x202020);
    return scene;
}

export function createCamera() {
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(12, 12.5, 12);
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
        new THREE.MeshStandardMaterial({ color: 0x333333 })
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
            color: 0x222222,
            roughness: 0.8
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
    const borderMaterial = new THREE.LineBasicMaterial({ color: 0x00ffff, linewidth: 2 });
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

// Variável para guardar o modo de câmara
export let cameraMode = 0; // 0: perspetiva, 1: ortográfica, 2: primeira pessoa

export function createPerspectiveCamera() {
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(50, 30, 35);
    camera.lookAt(20, 0, 20);
    return camera;
}

export function createOrthographicCamera() {
    const aspect = window.innerWidth / window.innerHeight;
    const d = 22;
    const camera = new THREE.OrthographicCamera(
        -d * aspect, d * aspect, d, -d, 0.1, 1000
    );
    camera.position.set(20, 50, 20); // Vista de cima
    camera.lookAt(20, 0, 20);
    return camera;
}

// Cria uma câmara lateral (side view)
export function createSideCamera() {
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    // Posição lateral afastada e um pouco acima
    camera.position.set(20, 20, 60);
    camera.lookAt(20, 0, 20); // Centro do tabuleiro
    return camera;
}

// Alterna entre as câmaras disponíveis
export function switchCamera(currentCamera, renderer) {
    cameraMode = (cameraMode + 1) % 4; // Agora são 4 modos
    let newCamera;
    if (cameraMode === 0) {
        // Câmara perspetiva tradicional
        newCamera = createPerspectiveCamera();
    } else if (cameraMode === 1) {
        // Câmara ortográfica (vista de cima)
        newCamera = createOrthographicCamera();
    } else {
        // Câmara lateral (side view)
        newCamera = createSideCamera();
    }
    // Atualiza parâmetros da câmara para corresponder ao tamanho da janela
    newCamera.aspect = window.innerWidth / window.innerHeight;
    newCamera.updateProjectionMatrix();
    renderer.renderLists.dispose();
    return newCamera;
}
