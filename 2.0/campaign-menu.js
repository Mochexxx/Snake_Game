// campaign-menu.js
// Responsável por criar e gerenciar a interface do menu do modo campanha

import { campaignLevels, resetCampaign, getLevelInfo } from './campaign.js';
import { debugMode } from './main.js';
import { toggleDebugMode } from './debug.js';

// Estrutura para armazenar o progresso do jogador
let campaignProgress = {
    currentLevel: 1,
    unlockedLevels: 1,
    levelsCompleted: []
};

// Carrega o progresso salvo do localStorage
export function loadCampaignProgress() {
    const savedProgress = localStorage.getItem('snakeCampaignProgress');
    if (savedProgress) {
        try {
            campaignProgress = JSON.parse(savedProgress);
        } catch (e) {
            console.error("Erro ao carregar o progresso da campanha:", e);
            resetCampaignProgress();
        }
    }
    return campaignProgress;
}

// Salva o progresso no localStorage
export function saveCampaignProgress() {
    localStorage.setItem('snakeCampaignProgress', JSON.stringify(campaignProgress));
}

// Reseta o progresso da campanha
export function resetCampaignProgress() {
    campaignProgress = {
        currentLevel: 1,
        unlockedLevels: 1,
        levelsCompleted: []
    };
    saveCampaignProgress();
    return campaignProgress;
}

// Desbloqueia um novo nível
export function unlockNextLevel() {
    if (campaignProgress.unlockedLevels < campaignLevels.length) {
        campaignProgress.unlockedLevels++;
        saveCampaignProgress();
    }
}

// Marca um nível como completado
export function markLevelCompleted(levelNumber) {
    if (!campaignProgress.levelsCompleted.includes(levelNumber)) {
        campaignProgress.levelsCompleted.push(levelNumber);
        unlockNextLevel();
        saveCampaignProgress();
    }
}

// Define o nível atual
export function setCurrentLevel(levelNumber) {
    // Em modo debug, qualquer nível pode ser definido como atual
    if (debugMode || levelNumber <= campaignProgress.unlockedLevels) {
        campaignProgress.currentLevel = levelNumber;
        saveCampaignProgress();
        return true;
    }
    return false;
}

// Obtém o nível atual
export function getCurrentLevel() {
    return campaignProgress.currentLevel;
}

// Verifica se um nível está desbloqueado
export function isLevelUnlocked(levelNumber) {
    // Em modo debug, todos os níveis estão desbloqueados
    if (debugMode) {
        return true;
    }
    // Caso contrário, segue a lógica normal de desbloqueio
    return levelNumber <= campaignProgress.unlockedLevels;
}

// Verifica se um nível foi completado
export function isLevelCompleted(levelNumber) {
    return campaignProgress.levelsCompleted.includes(levelNumber);
}

// Mostra o menu de seleção de níveis
export function showCampaignMenu(startLevelCallback) {
    // Carrega o progresso salvo
    loadCampaignProgress();
    
    // Cria o overlay do menu
    const overlay = document.createElement('div');
    overlay.id = 'campaign-menu-overlay';
    overlay.style.position = 'fixed';
    overlay.style.top = '0';
    overlay.style.left = '0';
    overlay.style.width = '100%';
    overlay.style.height = '100%';
    overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.85)';
    overlay.style.zIndex = '900';
    overlay.style.display = 'flex';
    overlay.style.flexDirection = 'column';
    overlay.style.alignItems = 'center';
    overlay.style.justifyContent = 'center';
    
    // Cria o contêiner do menu
    const menuContainer = document.createElement('div');
    menuContainer.style.backgroundColor = 'rgba(20, 20, 20, 0.95)';
    menuContainer.style.borderRadius = '10px';
    menuContainer.style.padding = '20px';
    menuContainer.style.width = '90%'; // Increased width
    menuContainer.style.maxWidth = '1000px'; // Increased max-width
    menuContainer.style.maxHeight = '80vh';
    menuContainer.style.overflowY = 'auto';
    
    // Adiciona o título
    const title = document.createElement('h1');
    title.textContent = 'Modo Campanha - Níveis';
    title.style.color = '#3498db';
    title.style.textAlign = 'center';
    title.style.marginBottom = '20px';
    menuContainer.appendChild(title);
      // Adiciona a descrição
    const description = document.createElement('p');
    
    // Altera a descrição se estiver em modo debug
    if (debugMode) {
        description.textContent = '🐞 MODO DEBUG ATIVO: Todos os níveis estão disponíveis.';
        description.style.color = '#9b59b6';
        description.style.fontWeight = 'bold';
    } else {
        description.textContent = 'Complete cada nível coletando 10 maçãs para desbloquear o próximo.';
        description.style.color = '#ddd';
    }
    
    description.style.textAlign = 'center';
    description.style.marginBottom = '30px';
    menuContainer.appendChild(description);
    
    // Cria o grid de níveis
    const levelsGrid = document.createElement('div');
    levelsGrid.style.display = 'grid';
    levelsGrid.style.gridTemplateColumns = 'repeat(auto-fill, minmax(200px, 1fr))'; // Adjusted for wider icons
    levelsGrid.style.gap = '25px'; // Slightly increased gap
    levelsGrid.style.padding = '15px'; // Slightly increased padding
    
    // Cria os cartões de nível com ícones
    for (let i = 1; i <= 10; i++) {
        const levelNumber = i;
        const isUnlocked = isLevelUnlocked(levelNumber);
        const isCompleted = isLevelCompleted(levelNumber);
        
        // Cria o cartão
        const card = document.createElement('div');
        card.className = 'level-card';
        // Remove background and border for a cleaner look with icons
        card.style.backgroundColor = 'transparent'; 
        card.style.border = 'none'; // Remove border
        card.style.borderRadius = '8px';
        card.style.padding = '5px'; // Adjust padding
        card.style.textAlign = 'center';
        card.style.position = 'relative';
        card.style.transition = 'transform 0.2s, box-shadow 0.2s';
        card.style.cursor = isUnlocked ? 'pointer' : 'not-allowed';

        // Adiciona o ícone do nível
        const levelIcon = document.createElement('img');
        levelIcon.src = `./assets/Levels/${levelNumber}_verde.png`; // Path to level icons
        levelIcon.alt = `Nível ${levelNumber}`;
        levelIcon.style.width = '150px'; // Increased icon width
        levelIcon.style.height = '120px'; // Kept icon height
        levelIcon.style.marginBottom = '8px'; // Adjust margin
        levelIcon.style.opacity = isUnlocked ? '1' : '0.5'; 
        card.appendChild(levelIcon);

        // Adiciona número do nível abaixo do ícone (opcional, make it subtle)
        const levelNumberEl = document.createElement('p');
        levelNumberEl.textContent = `Nível ${levelNumber}`;
        levelNumberEl.style.color = isUnlocked ? '#bbb' : '#777'; // Adjusted for better visibility with larger icons
        levelNumberEl.style.fontSize = '14px'; // Slightly larger font for balance
        levelNumberEl.style.marginTop = '0'; // Remove top margin
        card.appendChild(levelNumberEl);

        if (isCompleted) {
            const completedBadge = document.createElement('div');
            completedBadge.style.position = 'absolute';
            completedBadge.style.top = '10px'; // Adjusted for potentially larger icon area
            completedBadge.style.right = '10px';// Adjusted for potentially larger icon area
            completedBadge.style.backgroundColor = '#2ecc71';
            completedBadge.style.width = '15px';
            completedBadge.style.height = '15px';
            completedBadge.style.borderRadius = '50%';
            completedBadge.style.display = 'flex';
            completedBadge.style.alignItems = 'center';
            completedBadge.style.justifyContent = 'center';
            completedBadge.innerHTML = '✓';
            completedBadge.style.fontSize = '10px';
            completedBadge.style.color = '#fff';
            card.appendChild(completedBadge);
        } else if (!isUnlocked) {
            if (!debugMode) {
                const lockedBadge = document.createElement('div');
                lockedBadge.style.position = 'absolute';
                lockedBadge.style.top = '10px'; // Adjusted
                lockedBadge.style.right = '10px'; // Adjusted
                lockedBadge.style.backgroundColor = '#555';
                lockedBadge.style.width = '15px';
                lockedBadge.style.height = '15px';
                lockedBadge.style.borderRadius = '50%';
                lockedBadge.style.display = 'flex';
                lockedBadge.style.alignItems = 'center';
                lockedBadge.style.justifyContent = 'center';
                lockedBadge.innerHTML = '🔒';
                lockedBadge.style.fontSize = '8px';
                lockedBadge.style.color = '#ccc';
                card.appendChild(lockedBadge);
            }
        }

        if (isUnlocked || debugMode) {
            card.addEventListener('mouseover', () => {
                card.style.transform = 'scale(1.1)'; // Slightly larger scale effect
                // Optional: add a subtle shadow or glow effect if desired, even without a background
                // card.style.boxShadow = '0 0 15px rgba(52, 152, 219, 0.7)'; 
            });
            
            card.addEventListener('mouseout', () => {
                card.style.transform = 'scale(1)';
                // card.style.boxShadow = 'none';
            });
            
            card.addEventListener('click', () => {
                if (debugMode || isUnlocked) {
                    setCurrentLevel(levelNumber);
                    document.body.removeChild(overlay);
                    if (typeof startLevelCallback === 'function') {
                        startLevelCallback(levelNumber);
                    }
                }
            });
        }
        
        levelsGrid.appendChild(card);
    }
    
    menuContainer.appendChild(levelsGrid);
      // Adiciona botões de navegação
    const buttonsContainer = document.createElement('div');
    buttonsContainer.style.display = 'flex';
    buttonsContainer.style.justifyContent = 'center';
    buttonsContainer.style.gap = '15px';
    buttonsContainer.style.marginTop = '30px';
      // Botão Voltar
    const backButton = document.createElement('button');
    // backButton.textContent = 'Voltar'; // Remove text content
    backButton.style.padding = '5px'; // Adjust padding for image
    backButton.style.backgroundColor = 'transparent'; // Make background transparent
    backButton.style.color = '#fff';
    backButton.style.border = 'none'; // Remove border
    backButton.style.borderRadius = '10px';
    backButton.style.width = 'auto'; // Adjust width to content
    backButton.style.height = 'auto'; // Adjust height to content
    backButton.style.cursor = 'pointer';
    // backButton.style.fontSize = '16px'; // Not needed for image
    // backButton.style.fontWeight = 'bold'; // Not needed for image
    backButton.style.transition = 'all 0.2s';

    const backButtonIcon = document.createElement('img');
    backButtonIcon.src = './assets/Buttons/back_verde.png';
    backButtonIcon.alt = 'Voltar';
    backButtonIcon.style.width = '120px'; // Set image width (adjust as needed)
    backButtonIcon.style.height = '40px'; // Set image height (adjust as needed)
    backButton.appendChild(backButtonIcon);
    
    backButton.addEventListener('mouseover', () => {
        // backButton.style.backgroundColor = '#65b798'; // Remove background change on hover
        backButton.style.transform = 'scale(1.05)';
        // backButton.style.boxShadow = '0 0 10px rgba(101, 183, 152, 0.5)'; // Optional: adjust shadow for transparent bg
    });
    
    backButton.addEventListener('mouseout', () => {
        // backButton.style.backgroundColor = '#4e8d77'; // Remove background change on hover
        backButton.style.transform = 'scale(1)';
        // backButton.style.boxShadow = 'none'; // Optional: adjust shadow for transparent bg
    });backButton.addEventListener('click', () => {
        // Fecha o menu e volta para a tela de seleção de modo
        document.body.removeChild(overlay);
        // Mostra o menu de modos de jogo
        if (!window.gameRunning) {
            document.getElementById('gameModeMenu').style.display = 'flex';
        }
    });
    buttonsContainer.appendChild(backButton);
    
    // Botão Resetar Progresso
    const resetButton = document.createElement('button');
    resetButton.textContent = 'Resetar Progresso';
    resetButton.style.padding = '10px 20px';
    resetButton.style.backgroundColor = '#7f8c8d';
    resetButton.style.color = '#fff';
    resetButton.style.border = 'none';
    resetButton.style.borderRadius = '5px';
    resetButton.style.cursor = 'pointer';
    resetButton.style.fontSize = '16px';
    resetButton.style.transition = 'background-color 0.2s';
    
    resetButton.addEventListener('mouseover', () => {
        resetButton.style.backgroundColor = '#636e72';
    });
    
    resetButton.addEventListener('mouseout', () => {
        resetButton.style.backgroundColor = '#7f8c8d';
    });
    
    resetButton.addEventListener('click', () => {
        if (confirm('Tem certeza de que deseja resetar todo o seu progresso na campanha?')) {
            resetCampaignProgress();
            // Recarrega o menu para refletir as mudanças
            document.body.removeChild(overlay);
            showCampaignMenu(startLevelCallback);
        }
    });
    buttonsContainer.appendChild(resetButton);
    
    menuContainer.appendChild(buttonsContainer);
    
    // Adiciona o contêiner do menu ao overlay
    overlay.appendChild(menuContainer);
    
    // Adiciona o overlay ao body
    document.body.appendChild(overlay);
}
