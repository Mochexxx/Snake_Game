// tutorial.js
// Responsável por exibir dicas e informações de tutorial durante o jogo

export function showTutorial(gameMode, onCloseTutorial) {
    // Cria um overlay para bloquear interações com o jogo
    const overlay = document.createElement('div');
    overlay.id = 'tutorial-overlay';
    overlay.style.position = 'fixed';
    overlay.style.top = '0';
    overlay.style.left = '0';
    overlay.style.width = '100%';
    overlay.style.height = '100%';
    overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
    overlay.style.zIndex = '9';
    document.body.appendChild(overlay);
    
    // Cria um elemento de tutorial
    const tutorialDiv = document.createElement('div');
    tutorialDiv.id = 'tutorial';
    tutorialDiv.style.position = 'absolute';
    tutorialDiv.style.top = '50%';
    tutorialDiv.style.left = '50%';
    tutorialDiv.style.transform = 'translate(-50%, -50%)';
    tutorialDiv.style.backgroundColor = 'rgba(0, 0, 0, 0.9)';
    tutorialDiv.style.color = 'white';
    tutorialDiv.style.padding = '25px';
    tutorialDiv.style.borderRadius = '10px';
    tutorialDiv.style.maxWidth = '600px';
    tutorialDiv.style.zIndex = '10';
    tutorialDiv.style.textAlign = 'center';
    tutorialDiv.style.boxShadow = '0 0 20px rgba(255, 255, 255, 0.3)';    // Verifica se é dispositivo touch
    const isTouchDevice = 'ontouchstart' in window;
    
    // Conteúdo específico para cada modo
    let tutorialContent = `
        <h2>Como Jogar</h2>
        <div style="text-align: left; max-width: 400px; margin: 0 auto;">
            <p><strong>Controles de movimento:</strong></p>
            <ul>
                <li>Setas direcionais: ⬆️ ⬇️ ⬅️ ➡️ </li>
                <li>Teclas WASD: W (cima), A (esquerda), S (baixo), D (direita)</li>
                <li>Teclado numérico: 8 (cima), 4 (esquerda), 2 (baixo), 6 (direita)</li>
    `;
    
    // Adiciona instruções de controle por toque se for dispositivo móvel
    if (isTouchDevice) {
        tutorialContent += `
                <li>Em dispositivos móveis: use os botões direcionais na tela ou deslize na direção desejada</li>
        `;
    }
    
    tutorialContent += `
            </ul>
            <p><strong>Outros comandos:</strong></p>
            <ul>
                <li>Pausar/Continuar: ESPAÇO ou P</li>
    `;
    
    if (isTouchDevice) {
        tutorialContent += `
                <li>Em dispositivos móveis: use o botão "Pause" na tela</li>
        `;
    }
    
    tutorialContent += `
            </ul>
        </div>
        <p>Coma as maçãs vermelhas para crescer e somar pontos.</p>
    `;
    
    // Adiciona informações específicas para cada modo
    if (gameMode === 'classic') {
        tutorialContent += `
            <h3>Modo Clássico (Teleporte)</h3>
            <p>Ao atingir as bordas do tabuleiro, a cobra teleporta para o lado oposto.</p>
        `;
    } else if (gameMode === 'barriers') {
        tutorialContent += `
            <h3>Modo Barreiras</h3>
            <p>Cuidado! As bordas do tabuleiro são barreiras sólidas.</p>
            <p>Colidir com as bordas resulta em Game Over.</p>
        `;
    } else if (gameMode === 'obstacles') {
        tutorialContent += `
            <h3>Modo Obstáculos</h3>
            <p>Além das bordas serem barreiras sólidas, existem obstáculos roxos espalhados pelo tabuleiro.</p>
            <p>Colidir com obstáculos ou bordas resulta em Game Over.</p>
        `;
    }
      tutorialContent += `
        <div style="margin-top: 30px;">
            <button id="closeTutorialButton" style="
                background-color: #4CAF50;
                border: none;
                color: white;
                padding: 10px 20px;
                text-align: center;
                text-decoration: none;
                display: inline-block;
                font-size: 16px;
                margin: 4px 2px;
                cursor: pointer;
                border-radius: 5px;
                font-weight: bold;
            ">COMEÇAR A JOGAR</button>
        </div>
        <p style="margin-top: 10px; font-size: 14px;">Ou pressione qualquer tecla para fechar</p>
    `;
    
    tutorialDiv.innerHTML = tutorialContent;
    document.body.appendChild(tutorialDiv);
    
    // Adiciona evento de clique ao botão específico
    const closeButton = document.getElementById('closeTutorialButton');
    if (closeButton) {
        closeButton.addEventListener('click', (e) => {
            e.stopPropagation();
            closeTutorial();
        });
    }
      // Função para fechar o tutorial
    function closeTutorial() {
        // Remove o div do tutorial
        if (document.body.contains(tutorialDiv)) {
            document.body.removeChild(tutorialDiv);
        }
        
        // Remove o overlay
        const overlay = document.getElementById('tutorial-overlay');
        if (overlay) {
            document.body.removeChild(overlay);
        }
        
        // Remove os event listeners para evitar vazamento de memória
        document.removeEventListener('click', closeTutorial);
        document.removeEventListener('keydown', closeTutorial);
        
        // Chama o callback para iniciar o jogo
        if (typeof onCloseTutorial === 'function') {
            onCloseTutorial();
        }
    }
      // Eventos para fechar o tutorial ao clicar ou pressionar teclas específicas
    document.addEventListener('click', closeTutorial);
    document.addEventListener('keydown', (event) => {
        // Fecha o tutorial com teclas específicas: Enter, Espaço, Escape
        if (event.key === 'Enter' || event.key === ' ' || event.key === 'Escape') {
            closeTutorial();
            event.preventDefault();
        }
    });
    
    // Fechar automaticamente após 15 segundos
    setTimeout(closeTutorial, 15000);
}
