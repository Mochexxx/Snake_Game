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
    menuContainer.style.width = '80%';
    menuContainer.style.maxWidth = '800px';
    menuContainer.style.maxHeight = '80vh';
    menuContainer.style.overflowY = 'auto';
    menuContainer.style.boxShadow = '0 0 20px rgba(0, 0, 0, 0.7)';
    
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
    levelsGrid.style.gridTemplateColumns = 'repeat(auto-fill, minmax(200px, 1fr))';
    levelsGrid.style.gap = '15px';
    levelsGrid.style.padding = '10px';
    
    // Cria os cartões de nível
    campaignLevels.forEach((level, index) => {
        const levelNumber = index + 1;
        const isUnlocked = isLevelUnlocked(levelNumber);
        const isCompleted = isLevelCompleted(levelNumber);
          // Cria o cartão
        const card = document.createElement('div');
        card.className = 'level-card';
        
        // Se o modo debug estiver ativo, usa um estilo especial para níveis que normalmente estariam bloqueados
        const isDebugUnlocked = debugMode && !isUnlocked;
        
        card.style.backgroundColor = isDebugUnlocked 
            ? 'rgba(155, 89, 182, 0.3)' // Cor especial para níveis desbloqueados pelo debug
            : (isUnlocked 
                ? (isCompleted ? 'rgba(46, 204, 113, 0.3)' : 'rgba(52, 152, 219, 0.3)') 
                : 'rgba(50, 50, 50, 0.3)');
                
        card.style.borderRadius = '8px';
        card.style.padding = '15px';
        card.style.textAlign = 'center';
        
        card.style.border = isDebugUnlocked 
            ? '2px solid #9b59b6' // Borda roxa para níveis desbloqueados pelo debug
            : `2px solid ${isUnlocked ? (isCompleted ? '#2ecc71' : '#3498db') : '#555'}`;
            
        card.style.position = 'relative';
        card.style.transition = 'transform 0.2s, box-shadow 0.2s';
        
        // Em modo debug, todos os cartões são clicáveis
        card.style.cursor = (isUnlocked || debugMode) ? 'pointer' : 'not-allowed';
        
        // Adiciona número do nível
        const levelNumberEl = document.createElement('h2');
        levelNumberEl.textContent = `Nível ${levelNumber}`;
        levelNumberEl.style.color = isUnlocked ? '#fff' : '#888';
        levelNumberEl.style.marginBottom = '10px';
        card.appendChild(levelNumberEl);
        
        // Adiciona nome do nível
        const levelName = document.createElement('h3');
        levelName.textContent = level.name;
        levelName.style.color = isUnlocked ? '#f39c12' : '#666';
        levelName.style.marginBottom = '15px';
        card.appendChild(levelName);
          // Verifica se o nível está desbloqueado normalmente ou pelo modo debug
        const isVisible = isUnlocked || debugMode;
        
        // Adiciona descrição do nível
        const levelDesc = document.createElement('p');
        levelDesc.textContent = isVisible ? level.description : '???';
        levelDesc.style.color = isVisible ? '#ddd' : '#666';
        levelDesc.style.fontSize = '14px';
        levelDesc.style.height = '60px';
        levelDesc.style.overflow = 'hidden';
        card.appendChild(levelDesc);
        
        // Adiciona informações do nível
        if (isVisible) {
            const levelInfo = document.createElement('p');
            levelInfo.style.marginTop = '15px';
            levelInfo.style.fontSize = '13px';
            levelInfo.style.color = '#aaa';
            levelInfo.innerHTML = `Obstáculos: <span style="color: #e74c3c">${level.barrierCount}</span><br>Objetivo: <span style="color: #2ecc71">${level.targetApples} maçãs</span>`;
            card.appendChild(levelInfo);
            
            // Adiciona indicador de modo debug para níveis normalmente bloqueados
            if (debugMode && !isUnlocked) {
                const debugIndicator = document.createElement('p');
                debugIndicator.textContent = '🐞 Desbloqueado por Debug';
                debugIndicator.style.position = 'absolute';
                debugIndicator.style.bottom = '5px';
                debugIndicator.style.left = '0';
                debugIndicator.style.right = '0';
                debugIndicator.style.textAlign = 'center';
                debugIndicator.style.color = '#9b59b6';
                debugIndicator.style.fontSize = '11px';
                debugIndicator.style.fontWeight = 'bold';
                card.appendChild(debugIndicator);
            }
        }
        
        // Adiciona ícone de status
        if (isCompleted) {
            const completedBadge = document.createElement('div');
            completedBadge.style.position = 'absolute';
            completedBadge.style.top = '10px';
            completedBadge.style.right = '10px';
            completedBadge.style.backgroundColor = '#2ecc71';
            completedBadge.style.width = '20px';
            completedBadge.style.height = '20px';
            completedBadge.style.borderRadius = '50%';
            completedBadge.style.display = 'flex';
            completedBadge.style.alignItems = 'center';
            completedBadge.style.justifyContent = 'center';
            completedBadge.innerHTML = '✓';
            completedBadge.style.fontSize = '12px';
            completedBadge.style.color = '#fff';
            card.appendChild(completedBadge);        } else if (!isUnlocked) {
            // Apenas mostra o cadeado se não estiver em modo debug
            if (!debugMode) {
                const lockedBadge = document.createElement('div');
                lockedBadge.style.position = 'absolute';
                lockedBadge.style.top = '10px';
                lockedBadge.style.right = '10px';
                lockedBadge.style.backgroundColor = '#555';
                lockedBadge.style.width = '20px';
                lockedBadge.style.height = '20px';
                lockedBadge.style.borderRadius = '50%';
                lockedBadge.style.display = 'flex';
                lockedBadge.style.alignItems = 'center';
                lockedBadge.style.justifyContent = 'center';
                lockedBadge.innerHTML = '🔒';
                lockedBadge.style.fontSize = '10px';
                lockedBadge.style.color = '#ccc';
                card.appendChild(lockedBadge);
            } else {
                // Adiciona distintivo de debug para níveis desbloqueados pelo modo debug
                const debugBadge = document.createElement('div');
                debugBadge.style.position = 'absolute';
                debugBadge.style.top = '10px';
                debugBadge.style.right = '10px';
                debugBadge.style.backgroundColor = '#9b59b6';
                debugBadge.style.width = '20px';
                debugBadge.style.height = '20px';
                debugBadge.style.borderRadius = '50%';
                debugBadge.style.display = 'flex';
                debugBadge.style.alignItems = 'center';
                debugBadge.style.justifyContent = 'center';
                debugBadge.innerHTML = '🐞';
                debugBadge.style.fontSize = '10px';
                debugBadge.style.color = '#fff';
                card.appendChild(debugBadge);
            }
        }
        
        // Adiciona efeitos de hover para níveis desbloqueados (ou em modo debug)
        if (isUnlocked || debugMode) {
            card.addEventListener('mouseover', () => {
                card.style.transform = 'scale(1.05)';
                
                // Cor diferente para o brilho do hover em níveis de debug
                if (debugMode && !isUnlocked) {
                    card.style.boxShadow = '0 0 10px rgba(155, 89, 182, 0.5)';
                } else {
                    card.style.boxShadow = '0 0 10px rgba(52, 152, 219, 0.5)';
                }
            });
            
            card.addEventListener('mouseout', () => {
                card.style.transform = 'scale(1)';
                card.style.boxShadow = 'none';
            });
            
            // Adiciona evento de clique para iniciar o nível
            card.addEventListener('click', () => {
                // No modo debug, podemos forçar a seleção de qualquer nível
                if (debugMode || isUnlocked) {
                    // Define o nível atual forçadamente (no modo debug)
                    if (debugMode && !isUnlocked) {
                        // Em modo debug, podemos forçar qualquer nível
                        campaignProgress.currentLevel = levelNumber;
                        saveCampaignProgress();
                    } else {
                        // Em modo normal, usa a função padrão
                        setCurrentLevel(levelNumber);
                    }
                    
                    // Fecha o menu
                    document.body.removeChild(overlay);
                    
                    // Inicia o nível
                    if (typeof startLevelCallback === 'function') {
                        startLevelCallback(levelNumber);
                    }
                }
            });
        }
        
        levelsGrid.appendChild(card);
    });
    
    menuContainer.appendChild(levelsGrid);
      // Adiciona botões de navegação
    const buttonsContainer = document.createElement('div');
    buttonsContainer.style.display = 'flex';
    buttonsContainer.style.justifyContent = 'center';
    buttonsContainer.style.gap = '15px';
    buttonsContainer.style.marginTop = '30px';
      // Botão Voltar
    const backButton = document.createElement('button');
    backButton.textContent = 'Voltar';
    backButton.style.padding = '10px 20px';
    backButton.style.backgroundColor = '#4e8d77';
    backButton.style.color = '#fff';
    backButton.style.border = '2px solid #65b798';
    backButton.style.borderRadius = '10px';
    backButton.style.width = '120px';
    backButton.style.height = '40px';
    backButton.style.cursor = 'pointer';
    backButton.style.fontSize = '16px';
    backButton.style.fontWeight = 'bold';
    backButton.style.transition = 'all 0.2s';
    
    backButton.addEventListener('mouseover', () => {
        backButton.style.backgroundColor = '#65b798';
        backButton.style.transform = 'scale(1.05)';
        backButton.style.boxShadow = '0 0 10px rgba(101, 183, 152, 0.5)';
    });
    
    backButton.addEventListener('mouseout', () => {
        backButton.style.backgroundColor = '#4e8d77';
        backButton.style.transform = 'scale(1)';
        backButton.style.boxShadow = 'none';
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
    
    // Botão Debug (toggle)
    const debugButton = document.createElement('button');
    debugButton.textContent = debugMode ? '🐞 Desativar Modo Debug' : '🐞 Ativar Modo Debug';
    debugButton.style.padding = '10px 20px';
    debugButton.style.backgroundColor = debugMode ? '#9b59b6' : '#8e44ad';
    debugButton.style.color = '#fff';
    debugButton.style.border = 'none';
    debugButton.style.borderRadius = '5px';
    debugButton.style.cursor = 'pointer';
    debugButton.style.fontSize = '16px';
    debugButton.style.transition = 'background-color 0.2s';
    
    debugButton.addEventListener('mouseover', () => {
        debugButton.style.backgroundColor = debugMode ? '#8e44ad' : '#9b59b6';
    });
    
    debugButton.addEventListener('mouseout', () => {
        debugButton.style.backgroundColor = debugMode ? '#9b59b6' : '#8e44ad';
    });
      debugButton.addEventListener('click', () => {
        // Alterna o modo debug
        window.debugMode = !debugMode;
        
        // Atualiza o estado do debug usando a função do debug.js para garantir consistência
        if (typeof toggleDebugMode === 'function') {
            toggleDebugMode(window.debugMode);
        } else {
            // Fallback se a função não estiver disponível
            localStorage.setItem('debugMode', window.debugMode ? 'true' : 'false');
        }
        
        // Atualiza o menu para refletir as mudanças
        document.body.removeChild(overlay);
        showCampaignMenu(startLevelCallback);
    });
    buttonsContainer.appendChild(debugButton);
    
    menuContainer.appendChild(buttonsContainer);
    
    // Adiciona o contêiner do menu ao overlay
    overlay.appendChild(menuContainer);
    
    // Adiciona o overlay ao body
    document.body.appendChild(overlay);
}
