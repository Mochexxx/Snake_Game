// debug.js
// Funções auxiliares para debugging e visualização das hitboxes

export function createHitboxVisualization(scene, hitboxes) {
    const visuals = [];
    const material = new THREE.MeshBasicMaterial({ 
        color: 0xffff00, 
        wireframe: true,
        transparent: true,
        opacity: 0.3
    });
    
    // Cria um cubo wireframe para cada célula do tabuleiro
    for (let x = 0; x < 20; x++) {
        for (let z = 0; z < 20; z++) {
            const box = hitboxes[x][z];
            const geometry = new THREE.BoxGeometry(2, 2, 2);
            const mesh = new THREE.Mesh(geometry, material);
            mesh.position.set(box.centerX, 1, box.centerZ);
            scene.add(mesh);
            visuals.push(mesh);
        }
    }
    
    return visuals;
}

export function toggleHitboxVisualization(scene, visuals, show) {
    if (show) {
        visuals.forEach(mesh => scene.add(mesh));
    } else {
        visuals.forEach(mesh => scene.remove(mesh));
    }
}

export function toggleDebugMode(debugEnabled) {
    // Habilita/desabilita os elementos de debug
    if (debugEnabled) {
        console.log("Debug mode: ON");
        // Adicionar mais elementos de debug conforme necessário
    } else {
        console.log("Debug mode: OFF");
    }
}
