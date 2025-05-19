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
        // Adiciona notificação visual de debug ativo
        showDebugNotification(true);
        
        // Atualiza o checkbox do menu principal se existir
        const debugToggle = document.getElementById('debugModeToggle');
        if (debugToggle) {
            debugToggle.checked = true;
        }
        
        // Salva o estado no localStorage
        localStorage.setItem('debugMode', 'true');
    } else {
        console.log("Debug mode: OFF");
        // Remove notificação visual de debug ativo
        showDebugNotification(false);
        
        // Atualiza o checkbox do menu principal se existir
        const debugToggle = document.getElementById('debugModeToggle');
        if (debugToggle) {
            debugToggle.checked = false;
        }
        
        // Salva o estado no localStorage
        localStorage.setItem('debugMode', 'false');
    }
}

// Função para mostrar notificação visual do modo debug
function showDebugNotification(show) {
    // Remove notificação anterior se existir
    const existingNotification = document.getElementById('debug-mode-notification');
    if (existingNotification) {
        document.body.removeChild(existingNotification);
    }
    
    // Cria nova notificação se necessário
    if (show) {        const notification = document.createElement('div');
        notification.id = 'debug-mode-notification';
        notification.style.position = 'fixed';
        notification.style.top = '10px';
        notification.style.right = '10px';
        notification.style.backgroundColor = 'rgba(155, 89, 182, 0.9)';
        notification.style.color = 'white';
        notification.style.padding = '10px';
        notification.style.borderRadius = '5px';
        notification.style.fontWeight = 'bold';
        notification.style.fontSize = '12px';
        notification.style.zIndex = '1000';
        notification.style.boxShadow = '0 2px 5px rgba(0,0,0,0.3)';
        notification.style.display = 'flex';
        notification.style.flexDirection = 'column';
        notification.style.gap = '5px';
        notification.style.cursor = 'default';
        
        // Título da notificação
        const title = document.createElement('div');
        title.style.display = 'flex';
        title.style.justifyContent = 'space-between';
        title.style.alignItems = 'center';
        title.style.width = '100%';
        
        const titleText = document.createElement('span');
        titleText.textContent = '🐞 MODO DEBUG ATIVO';
        titleText.style.fontWeight = 'bold';
        
        // Adiciona um botão para fechar a notificação
        const closeButton = document.createElement('span');
        closeButton.textContent = '×';
        closeButton.style.marginLeft = '10px';
        closeButton.style.cursor = 'pointer';
        closeButton.style.fontWeight = 'bold';
        closeButton.style.fontSize = '16px';
        
        closeButton.addEventListener('click', (e) => {
            e.stopPropagation();
            document.body.removeChild(notification);
        });
        
        title.appendChild(titleText);
        title.appendChild(closeButton);
        
        // Informações sobre atalhos de debug
        const infoText = document.createElement('div');
        infoText.innerHTML = 'Teclas: <b>F3/B</b> para toggle<br>Todos os níveis da campanha desbloqueados';
        infoText.style.fontSize = '10px';
        infoText.style.marginTop = '5px';
        
        notification.appendChild(title);
        notification.appendChild(infoText);
        document.body.appendChild(notification);
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
