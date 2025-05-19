// Implementação de controles por toque para dispositivos móveis

export function setupTouchControls(setDirectionCallback) {
    // Variáveis para armazenar as coordenadas iniciais e finais do toque
    let startX = 0;
    let startY = 0;
    let lastTouchTime = 0;
    const touchDebounceTime = 150; // ms
    // Função para determinar a direção do swipe
    function handleSwipe(endX, endY) {
        const dx = endX - startX;
        const dy = endY - startY;
        
        // Só reconhece como swipe se houver movimento suficiente
        const minSwipeDistance = 30; // pixels
        
        if (Math.abs(dx) < minSwipeDistance && Math.abs(dy) < minSwipeDistance) {
            return; // Movimento muito pequeno para ser considerado swipe
        }
        
        // Determina a direção predominante (horizontal ou vertical)
        if (Math.abs(dx) > Math.abs(dy)) {
            // Movimento horizontal predominante
            if (dx > 0) {
                // Swipe para direita
                setDirectionCallback(1, 0);
            } else {
                // Swipe para esquerda
                setDirectionCallback(-1, 0);
            }
        } else {
            // Movimento vertical predominante
            if (dy > 0) {
                // Swipe para baixo
                setDirectionCallback(0, 1);
            } else {
                // Swipe para cima
                setDirectionCallback(0, -1);
            }
        }
    }
    
    // Evento de início do toque
    document.addEventListener('touchstart', function(e) {
        const touch = e.touches[0];
        startX = touch.clientX;
        startY = touch.clientY;
        
        // Previne o comportamento padrão como scroll
        e.preventDefault();
    }, { passive: false });
      // Evento de fim do toque
    document.addEventListener('touchend', function(e) {
        if (e.changedTouches.length > 0) {
            const touch = e.changedTouches[0];
            const endX = touch.clientX;
            const endY = touch.clientY;
            
            const now = Date.now();
            // Aplica o debounce para evitar múltiplos swipes rápidos demais
            if (now - lastTouchTime > touchDebounceTime) {
                handleSwipe(endX, endY);
                lastTouchTime = now;
            }
        }
        
        // Previne o comportamento padrão
        e.preventDefault();
    }, { passive: false });
    
    // Adiciona botões virtuais para controles de direção em dispositivos móveis
    addTouchButtons(setDirectionCallback);
}

// Função para adicionar botões virtuais de direção
function addTouchButtons(setDirectionCallback) {
    // Verifica se é um dispositivo de toque
    if (!('ontouchstart' in window)) {
        return; // Não é um dispositivo de toque, não adiciona os botões
    }
    
    // Container para os botões
    const touchControlsContainer = document.createElement('div');
    touchControlsContainer.id = 'touch-controls';
    touchControlsContainer.style.position = 'absolute';
    touchControlsContainer.style.left = '10px';
    touchControlsContainer.style.bottom = '10px';
    touchControlsContainer.style.display = 'grid';
    touchControlsContainer.style.gridTemplateColumns = '50px 50px 50px';
    touchControlsContainer.style.gridTemplateRows = '50px 50px 50px';
    touchControlsContainer.style.gap = '5px';
    touchControlsContainer.style.zIndex = '5';
    
    // Estilos comuns para os botões
    const buttonStyle = `
        width: 100%;
        height: 100%;
        background-color: rgba(255, 255, 255, 0.3);
        border-radius: 5px;
        display: flex;
        justify-content: center;
        align-items: center;
        font-size: 24px;
        color: white;
        user-select: none;
        cursor: pointer;
    `;
      // Variáveis para controle de debounce dos botões
    let lastButtonTime = 0;
    const buttonDebounceTime = 150; // ms
    
    // Função para criar evento de clique com debounce
    function createButtonClickHandler(x, z) {
        return function() {
            const now = Date.now();
            if (now - lastButtonTime > buttonDebounceTime) {
                setDirectionCallback(x, z);
                lastButtonTime = now;
            }
        };
    }
    
    // Cria os botões
    const upButton = document.createElement('button');
    upButton.style.cssText = buttonStyle + 'grid-column: 2; grid-row: 1;';
    upButton.textContent = '⬆️';
    upButton.addEventListener('click', createButtonClickHandler(0, -1));
    
    const leftButton = document.createElement('button');
    leftButton.style.cssText = buttonStyle + 'grid-column: 1; grid-row: 2;';
    leftButton.textContent = '⬅️';
    leftButton.addEventListener('click', createButtonClickHandler(-1, 0));
    
    const rightButton = document.createElement('button');
    rightButton.style.cssText = buttonStyle + 'grid-column: 3; grid-row: 2;';
    rightButton.textContent = '➡️';
    rightButton.addEventListener('click', createButtonClickHandler(1, 0));
    
    const downButton = document.createElement('button');
    downButton.style.cssText = buttonStyle + 'grid-column: 2; grid-row: 3;';
    downButton.textContent = '⬇️';
    downButton.addEventListener('click', createButtonClickHandler(0, 1));
    
    // Adiciona os botões ao container
    touchControlsContainer.appendChild(upButton);
    touchControlsContainer.appendChild(leftButton);
    touchControlsContainer.appendChild(rightButton);
    touchControlsContainer.appendChild(downButton);
    
    // Adiciona o container ao body
    document.body.appendChild(touchControlsContainer);
    
    // Adiciona botão de pausa
    const pauseButton = document.createElement('button');
    pauseButton.style.cssText = `
        position: absolute;
        right: 70px;
        bottom: 10px;
        width: 60px;
        height: 40px;
        background-color: rgba(76, 175, 80, 0.7);
        border: none;
        color: white;
        font-size: 16px;
        border-radius: 5px;
        cursor: pointer;
        z-index: 5;
    `;
    pauseButton.textContent = 'Pause';
    pauseButton.addEventListener('click', () => {
        // Emite evento de tecla espaço para pausar
        const event = new KeyboardEvent('keydown', { key: ' ' });
        document.dispatchEvent(event);
    });
    
    document.body.appendChild(pauseButton);
}
