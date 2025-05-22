// buttons.js
// Implementa os botões da interface do jogo

/**
 * Cria um botão para a árvore
 * @param {HTMLElement} container - O elemento onde o botão será adicionado
 * @param {Function} onClick - Função de callback quando o botão for clicado
 */
export function createTreeButton(container, onClick) {
    const button = document.createElement('button');
    button.id = 'treeButton';
    button.className = 'game-button';
    button.innerHTML = '<i class="fas fa-tree"></i> Árvore';
    button.addEventListener('click', onClick);
    
    // Estilo do botão
    button.style.backgroundColor = '#2ecc71';
    button.style.color = 'white';
    button.style.border = 'none';
    button.style.padding = '10px 15px';
    button.style.margin = '5px';
    button.style.borderRadius = '5px';
    button.style.cursor = 'pointer';
    button.style.fontSize = '16px';
    button.style.fontWeight = 'bold';
    
    // Hover effect
    button.onmouseover = () => {
        button.style.backgroundColor = '#27ae60';
    };
    button.onmouseout = () => {
        button.style.backgroundColor = '#2ecc71';
    };
    
    container.appendChild(button);
    return button;
}

/**
 * Cria um botão para a pedra
 * @param {HTMLElement} container - O elemento onde o botão será adicionado
 * @param {Function} onClick - Função de callback quando o botão for clicado
 */
export function createRockButton(container, onClick) {
    const button = document.createElement('button');
    button.id = 'rockButton';
    button.className = 'game-button';
    button.innerHTML = '<i class="fas fa-mountain"></i> Pedra';
    button.addEventListener('click', onClick);
    
    // Estilo do botão
    button.style.backgroundColor = '#95a5a6';
    button.style.color = 'white';
    button.style.border = 'none';
    button.style.padding = '10px 15px';
    button.style.margin = '5px';
    button.style.borderRadius = '5px';
    button.style.cursor = 'pointer';
    button.style.fontSize = '16px';
    button.style.fontWeight = 'bold';
    
    // Hover effect
    button.onmouseover = () => {
        button.style.backgroundColor = '#7f8c8d';
    };
    button.onmouseout = () => {
        button.style.backgroundColor = '#95a5a6';
    };
    
    container.appendChild(button);
    return button;
}

/**
 * Cria um botão para obstáculos aleatórios
 * @param {HTMLElement} container - O elemento onde o botão será adicionado
 * @param {Function} onClick - Função de callback quando o botão for clicado
 */
export function createRandomObstacleButton(container, onClick) {
    const button = document.createElement('button');
    button.id = 'randomObstacleButton';
    button.className = 'game-button';
    button.innerHTML = '<i class="fas fa-random"></i> Aleatório';
    button.addEventListener('click', onClick);
    
    // Estilo do botão
    button.style.backgroundColor = '#9b59b6';
    button.style.color = 'white';
    button.style.border = 'none';
    button.style.padding = '10px 15px';
    button.style.margin = '5px';
    button.style.borderRadius = '5px';
    button.style.cursor = 'pointer';
    button.style.fontSize = '16px';
    button.style.fontWeight = 'bold';
    
    // Hover effect
    button.onmouseover = () => {
        button.style.backgroundColor = '#8e44ad';
    };
    button.onmouseout = () => {
        button.style.backgroundColor = '#9b59b6';
    };
    
    container.appendChild(button);
    return button;
}

/**
 * Cria um botão para limpar obstáculos
 * @param {HTMLElement} container - O elemento onde o botão será adicionado
 * @param {Function} onClick - Função de callback quando o botão for clicado
 */
export function createClearObstaclesButton(container, onClick) {
    const button = document.createElement('button');
    button.id = 'clearObstaclesButton';
    button.className = 'game-button';
    button.innerHTML = '<i class="fas fa-trash"></i> Limpar';
    button.addEventListener('click', onClick);
    
    // Estilo do botão
    button.style.backgroundColor = '#e74c3c';
    button.style.color = 'white';
    button.style.border = 'none';
    button.style.padding = '10px 15px';
    button.style.margin = '5px';
    button.style.borderRadius = '5px';
    button.style.cursor = 'pointer';
    button.style.fontSize = '16px';
    button.style.fontWeight = 'bold';
    
    // Hover effect
    button.onmouseover = () => {
        button.style.backgroundColor = '#c0392b';
    };
    button.onmouseout = () => {
        button.style.backgroundColor = '#e74c3c';
    };
    
    container.appendChild(button);
    return button;
}

/**
 * Adiciona os botões de controle dos obstáculos à interface
 * @param {HTMLElement} container - O elemento onde os botões serão adicionados
 * @param {Object} callbacks - Objeto com as funções de callback para cada botão
 */
export function setupObstacleButtons(container, callbacks) {
    // Cria um container para os botões
    const buttonContainer = document.createElement('div');
    buttonContainer.id = 'obstacle-buttons';
    buttonContainer.style.position = 'fixed';
    buttonContainer.style.bottom = '20px';
    buttonContainer.style.right = '20px';
    buttonContainer.style.display = 'flex';
    buttonContainer.style.flexDirection = 'column';
    buttonContainer.style.zIndex = '100';
    
    // Título do painel
    const title = document.createElement('div');
    title.textContent = 'Obstáculos:';
    title.style.color = 'white';
    title.style.marginBottom = '5px';
    title.style.fontWeight = 'bold';
    title.style.textAlign = 'center';
    title.style.backgroundColor = 'rgba(0,0,0,0.5)';
    title.style.padding = '5px';
    title.style.borderRadius = '5px';
    buttonContainer.appendChild(title);
    
    // Adiciona os botões
    createTreeButton(buttonContainer, callbacks.onTreeAdd);
    createRockButton(buttonContainer, callbacks.onRockAdd);
    createRandomObstacleButton(buttonContainer, callbacks.onRandomAdd);
    createClearObstaclesButton(buttonContainer, callbacks.onClear);
    
    // Adiciona o container à interface
    container.appendChild(buttonContainer);
    
    return buttonContainer;
}