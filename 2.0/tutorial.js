// tutorial.js
// Responsável por exibir dicas e informações de tutorial durante o jogo

export function showTutorial(gameMode, onCloseTutorial) {
    console.log('showTutorial called with gameMode:', gameMode);
    
    // Aguarda um pequeno tempo para garantir que o DOM esteja estável
    setTimeout(() => {
        createTutorialElements(gameMode, onCloseTutorial);
    }, 100);
}

function createTutorialElements(gameMode, onCloseTutorial) {
    console.log('Creating tutorial elements for gameMode:', gameMode);
    
    // Adiciona CSS override direto no head do documento
    const cssOverride = document.createElement('style');
    cssOverride.id = 'tutorial-css-override';
    cssOverride.innerHTML = `
        body.tutorial-active {
            overflow: visible !important;
        }
        html.tutorial-active {
            overflow: visible !important;
        }
    `;
    document.head.appendChild(cssOverride);
    
    // Adiciona classes ao body e html
    document.body.classList.add('tutorial-active');
    document.documentElement.classList.add('tutorial-active');
    
    // Cria um overlay para bloquear interações com o jogo
    const overlay = document.createElement('div');
    overlay.id = 'tutorial-overlay';    overlay.style.position = 'fixed';
    overlay.style.top = '0';
    overlay.style.left = '0';
    overlay.style.width = '100%';
    overlay.style.height = '100%';
    overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
    overlay.style.zIndex = '9999'; // Z-index muito alto
    overlay.style.display = 'block';
    overlay.style.visibility = 'visible';
    document.body.appendChild(overlay);
      // Garante que todos os overlays de menus sejam ocultados ao mostrar o tutorial
    const menusToHide = [
        document.getElementById('mainMenu'),
        document.getElementById('gameModeMenu'),
        document.getElementById('startScreen'),
        document.getElementById('endScreen'),
        document.getElementById('optionsMenu')
    ];
    menusToHide.forEach(menu => {
        if (menu && menu.style.display !== 'none') {
            menu.dataset.prevDisplay = menu.style.display;
            menu.style.display = 'none';
        }
    });
      // Verifica se há canvas do Three.js e temporariamente reduz seu z-index
    const canvasElements = document.querySelectorAll('canvas');
    canvasElements.forEach(canvas => {
        canvas.dataset.prevZIndex = canvas.style.zIndex || '0';
        canvas.style.zIndex = '-1';
    });    // Temporariamente muda o overflow do body para garantir que o tutorial seja visível
    const originalBodyOverflow = document.body.style.overflow;
    const originalHtmlOverflow = document.documentElement.style.overflow;
    document.body.style.overflow = 'visible !important';
    document.documentElement.style.overflow = 'visible !important';
    
    // Força a aplicação dos estilos
    document.body.style.setProperty('overflow', 'visible', 'important');
    document.documentElement.style.setProperty('overflow', 'visible', 'important');

    // Cria um elemento de tutorial
    const tutorialDiv = document.createElement('div');
    tutorialDiv.id = 'tutorial';    tutorialDiv.style.position = 'fixed'; // Garante que o tutorial fique acima de tudo
    tutorialDiv.style.top = '50%';
    tutorialDiv.style.left = '50%';
    tutorialDiv.style.transform = 'translate(-50%, -50%)';
    tutorialDiv.style.backgroundColor = 'rgba(0, 0, 0, 0.9)';
    tutorialDiv.style.color = 'white';
    tutorialDiv.style.padding = '25px';
    tutorialDiv.style.borderRadius = '10px';
    tutorialDiv.style.maxWidth = '600px';
    tutorialDiv.style.zIndex = '10000'; // Z-index ainda mais alto
    tutorialDiv.style.textAlign = 'center';
    tutorialDiv.style.boxShadow = '0 0 20px rgba(255, 255, 255, 0.3)';
    tutorialDiv.style.display = 'block';
    tutorialDiv.style.visibility = 'visible';
    tutorialDiv.style.opacity = '1';// Verifica se é dispositivo touch
    const isTouchDevice = 'ontouchstart' in window;
      // Conteúdo específico para cada modo
    let tutorialContent = `
        <h2>Como Jogar</h2>
        <div style="text-align: left; max-width: 400px; margin: 0 auto;">            <p><strong>Controles de movimento (baseado na perspectiva da câmera):</strong></p>
            <ul>
                <li>Setas direcionais: ⬆️ ⬇️ ⬅️ ➡️ </li>
                <li>Teclas WASD: W (para cima), A (para esquerda), S (para baixo), D (para direita)</li>
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
            ">COMEÇAR A JOGAR</button>        </div>
        <p style="margin-top: 10px; font-size: 14px;">Ou pressione Enter para fechar</p>
    `;
    tutorialDiv.innerHTML = tutorialContent;
    document.body.appendChild(tutorialDiv);
      console.log('Tutorial div created and added to body');
    console.log('Overlay z-index:', overlay.style.zIndex);
    console.log('Tutorial div z-index:', tutorialDiv.style.zIndex);
    console.log('Tutorial div computed style:', window.getComputedStyle(tutorialDiv));
    console.log('Body children count:', document.body.children.length);
    console.log('Tutorial div in DOM:', document.body.contains(tutorialDiv));
    
    // Força o reflow para garantir que os estilos sejam aplicados
    tutorialDiv.offsetHeight;
    
    // Adiciona evento de clique ao botão específico
    const closeButton = document.getElementById('closeTutorialButton');
    if (closeButton) {
        closeButton.addEventListener('click', (e) => {
            e.stopPropagation();
            closeTutorial();
        });
    }    // Função para fechar o tutorial
    function closeTutorial() {
        // Remove classes do body e html
        document.body.classList.remove('tutorial-active');
        document.documentElement.classList.remove('tutorial-active');
        
        // Remove o CSS override
        const cssOverride = document.getElementById('tutorial-css-override');
        if (cssOverride) document.head.removeChild(cssOverride);
        
        // Remove o div do tutorial
        if (document.body.contains(tutorialDiv)) {
            document.body.removeChild(tutorialDiv);
        }
        
        // Remove o overlay
        const overlay = document.getElementById('tutorial-overlay');
        if (overlay) {
            document.body.removeChild(overlay);
        }
          // Restaura os menus que estavam visíveis
        menusToHide.forEach(menu => {
            if (menu && menu.dataset.prevDisplay) {
                menu.style.display = menu.dataset.prevDisplay;
                delete menu.dataset.prevDisplay;
            }
        });
          // Restaura o z-index dos canvas
        const canvasElements = document.querySelectorAll('canvas');
        canvasElements.forEach(canvas => {
            if (canvas.dataset.prevZIndex !== undefined) {
                canvas.style.zIndex = canvas.dataset.prevZIndex;
                delete canvas.dataset.prevZIndex;
            }
        });
          // Restaura o overflow do body
        document.body.style.overflow = originalBodyOverflow;
        document.documentElement.style.overflow = originalHtmlOverflow;
        
        // Remove os event listeners para evitar vazamento de memória
        document.removeEventListener('click', closeTutorial);
        document.removeEventListener('keydown', closeTutorial);
        
        // Chama o callback para iniciar o jogo
        if (typeof onCloseTutorial === 'function') {
            onCloseTutorial();
        }
    }    // Eventos para fechar o tutorial ao clicar ou pressionar a tecla Enter
    document.addEventListener('click', closeTutorial);
    document.addEventListener('keydown', (event) => {
        // Fecha o tutorial apenas com a tecla Enter (espaço e Escape removidos pois causam bugs)
        if (event.key === 'Enter') {
            closeTutorial();
            event.preventDefault();
        }
    });
      // Fechar automaticamente após 15 segundos
    setTimeout(closeTutorial, 15000);
}
