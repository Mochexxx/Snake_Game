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

// Função para visualizar as colisões (para depuração)
export function debugCollisions(scene, snakeBoard, hitboxes) {
    // Verificar se há inconsistência entre matriz e objetos visuais
    console.log("Verificando colisões e integridade da cobra:");
    console.log("Tamanho da matriz da cobra (snakeBoard):", snakeBoard.length);
    
    // Criar visualizações temporárias das posições da cobra na matriz
    const debugMaterial = new THREE.MeshBasicMaterial({ 
        color: 0xff0000, 
        wireframe: true,
        transparent: true,
        opacity: 0.7
    });
    
    // Criar esferas para marcar cada posição na matriz do tabuleiro
    const markers = [];
    for (let i = 0; i < snakeBoard.length; i++) {
        const { x, z } = snakeBoard[i];
        // Pular coordenadas inválidas
        if (x < 0 || x > 19 || z < 0 || z > 19) {
            console.warn(`Coordenada inválida na matriz: índice ${i}, valor: ${x}, ${z}`);
            continue;
        }
        const { centerX, centerZ } = hitboxes[x][z];
        
        const geometry = new THREE.SphereGeometry(0.5, 8, 8);
        const marker = new THREE.Mesh(geometry, debugMaterial);
        marker.position.set(centerX, 2, centerZ);
        scene.add(marker);
        markers.push(marker);
        
        // Adiciona texto com o índice
        const canvas = document.createElement('canvas');
        canvas.width = 64;
        canvas.height = 64;
        const context = canvas.getContext('2d');
        context.fillStyle = 'white';
        context.font = '48px Arial';
        context.textAlign = 'center';
        context.fillText(i.toString(), 32, 48);
        
        const texture = new THREE.Texture(canvas);
        texture.needsUpdate = true;
        
        const spriteMaterial = new THREE.SpriteMaterial({ map: texture });
        const sprite = new THREE.Sprite(spriteMaterial);
        sprite.position.set(centerX, 3, centerZ);
        sprite.scale.set(1, 1, 1);
        scene.add(sprite);
        markers.push(sprite);
    }
    
    // Remove os marcadores após 3 segundos
    setTimeout(() => {
        markers.forEach(marker => scene.remove(marker));
    }, 3000);
    
    return markers;
}
