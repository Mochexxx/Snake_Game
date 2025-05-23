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
            </ul>            <p><strong>Outros controles:</strong></p>
            <ul>
                <li>P ou Espaço: pausar/retomar o jogo</li>
                <li>B: ativar/desativar modo de debug</li>
    `;
      // Adiciona instruções específicas para o modo campanha
    if (gameMode === 'campaign') {
        tutorialContent += `
                <li>M: abrir menu de seleção de níveis</li>
                <li>F3: ativar/desativar modo de debug</li>
            </ul>
            <p><strong>Modo Campanha:</strong></p>
            <ul>
                <li>Colete 10 maçãs para completar cada nível</li>
                <li>Complete níveis para desbloquear novos desafios</li>
                <li>O número de obstáculos aumenta a cada nível</li>
                <li>Pressione M durante o jogo para acessar o menu de níveis</li>
            </ul>            <p><strong>🐞 Modo Debug:</strong></p>
            <ul>
                <li>Ative o modo debug pressionando F3 ou usando a tecla B</li>
                <li>Em modo debug, todos os níveis da campanha estão desbloqueados</li>
                <li>Os níveis desbloqueados por debug têm uma borda roxa</li>
                <li>Você também pode ativar/desativar o debug no menu de níveis</li>
            </ul>
        `;
    } else {
        tutorialContent += `
            </ul>
        `;
    }
    
    // Adicionando conteúdo específico para cada modo de jogo
    if (gameMode === 'classic') {
        tutorialContent += `
            <p><strong>Modo Casual:</strong></p>
            <ul>
                <li>O modo clássico do Snake.</li>
                <li>Ao atingir os limites do tabuleiro, você teleporta para o lado oposto.</li>
                <li>Cuidado para não colidir com seu próprio corpo!</li>
            </ul>
        `;
    } else if (gameMode === 'barriers') {
        tutorialContent += `
            <p><strong>Modo Barreiras:</strong></p>
            <ul>
                <li>Existem barreiras fixas nas bordas do tabuleiro.</li>
                <li>Colidir com uma barreira resulta em fim de jogo.</li>
                <li>Planeje seus movimentos para evitar as barreiras e seu próprio corpo.</li>
            </ul>
        `;
    } else if (gameMode === 'randomBarriers') {
        tutorialContent += `
            <p><strong>Modo Labirinto:</strong></p>
            <ul>
                <li>Barreiras aleatórias criam um labirinto diferente a cada partida.</li>
                <li>Colidir com uma barreira resulta em fim de jogo.</li>
                <li>Encontre o melhor caminho para coletar as maçãs!</li>
            </ul>
        `;
    } else if (gameMode === 'obstacles') {
        tutorialContent += `
            <p><strong>Modo Obstáculos:</strong></p>
            <ul>
                <li>Obstáculos móveis aparecem pelo tabuleiro.</li>
                <li>Os obstáculos se movem aleatoriamente.</li>
                <li>Colidir com um obstáculo resulta em fim de jogo.</li>
                <li>Fique atento ao movimento dos obstáculos!</li>
            </ul>
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
