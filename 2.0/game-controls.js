// Funções para visualização dos controles do jogo

// Função para mostrar um popup com os controles
export function showControlsHelp() {
    // Remove popup existente se houver
    const existingPopup = document.getElementById('controls-popup');
    if (existingPopup) {
        document.body.removeChild(existingPopup);
        return;
    }
    
    // Cria o popup
    const popup = document.createElement('div');
    popup.id = 'controls-popup';
    popup.style.position = 'absolute';
    popup.style.bottom = '60px';
    popup.style.right = '10px';
    popup.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
    popup.style.color = 'white';
    popup.style.padding = '15px';
    popup.style.borderRadius = '8px';
    popup.style.zIndex = '5';
    popup.style.maxWidth = '300px';
    popup.style.textAlign = 'left';
    popup.style.fontSize = '14px';
    popup.style.boxShadow = '0 0 10px rgba(255, 255, 255, 0.2)';
    
    // Conteúdo do popup
    popup.innerHTML = `
        <h3 style="margin-top: 0; color: #4CAF50;">Controles do Jogo</h3>
        <p><strong>Movimento:</strong></p>
        <ul style="padding-left: 20px; margin-top: 5px;">
            <li>Setas direcionais: ⬆️ ⬇️ ⬅️ ➡️</li>
            <li>WASD: W (cima), A (esquerda), S (baixo), D (direita)</li>
            <li>Teclado numérico: 8, 4, 2, 6</li>
        </ul>
        <p><strong>Jogo:</strong></p>        <ul style="padding-left: 20px; margin-top: 5px;">
            <li>Pausar/Continuar: ESPAÇO ou P</li>
            <li>Ativar/Desativar Modo Debug: B ou F3</li>
        </ul>
        <button id="close-controls" style="
            background-color: #4CAF50;
            border: none;
            color: white;
            padding: 5px 10px;
            text-align: center;
            display: block;
            margin: 10px auto 0;
            cursor: pointer;
            border-radius: 4px;">
            Fechar
        </button>
    `;
    
    // Adiciona o popup ao body
    document.body.appendChild(popup);
    
    // Adiciona evento de clique ao botão fechar
    document.getElementById('close-controls').addEventListener('click', function() {
        document.body.removeChild(popup);
    });
}

// Função para adicionar o botão de ajuda com controles
export function addControlsHelpButton() {
    const helpButton = document.createElement('div');
    helpButton.id = 'controls-help-button';
    helpButton.style.position = 'absolute';
    helpButton.style.bottom = '10px';
    helpButton.style.right = '10px';
    helpButton.style.width = '40px';
    helpButton.style.height = '40px';
    helpButton.style.backgroundColor = 'rgba(76, 175, 80, 0.7)';
    helpButton.style.borderRadius = '50%';
    helpButton.style.display = 'flex';
    helpButton.style.justifyContent = 'center';
    helpButton.style.alignItems = 'center';
    helpButton.style.color = 'white';
    helpButton.style.fontSize = '20px';
    helpButton.style.fontWeight = 'bold';
    helpButton.style.cursor = 'pointer';
    helpButton.style.boxShadow = '0 0 5px rgba(0, 0, 0, 0.3)';
    helpButton.style.zIndex = '5';
    helpButton.textContent = '?';
    helpButton.title = 'Mostrar controles do jogo';
    
    // Adiciona evento de clique para mostrar os controles
    helpButton.addEventListener('click', showControlsHelp);
    
    document.body.appendChild(helpButton);
    
    return helpButton;
}
