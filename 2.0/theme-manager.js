// theme-manager.js
// Handles theme changes in the game

import { addTransitionClass } from './transition-helper.js';

// Theme color definitions
const themes = {
    green: {
        primary: '#4e8d77',
        secondary: '#65b798',
        highlight: '#8ee4af',
        shadow: 'rgba(101, 183, 152, 0.5)',
        active: 'rgba(55, 150, 131, 0.6)',
        titlecards: {
            mainmenu: 'assets/Titlecards/mainmenu_verde.png',
            gamemodes: 'assets/Titlecards/gamemodes_verde.png',
            options: 'assets/Titlecards/options_verde.png'
        },        gamemodes: {
            casual: 'assets/Gamemodes/casual_verde.png',
            infinity: 'assets/Gamemodes/infinity_verde.png',
            barrier: 'assets/Gamemodes/barrier_verde.png',
            middlebarrier: 'assets/Gamemodes/middlebarrier_verde.png',
            obstacles: 'assets/Gamemodes/obstacles_verde.png',
            campaign: 'assets/Gamemodes/campaign_verde.png'
        },
        buttons: {
            play: 'assets/Buttons/play_verde.png',
            restart: 'assets/Buttons/restart_verde.png',
            resume: 'assets/Buttons/resume_verde.png',
            back: 'assets/Buttons/back_verde.png',
            home: 'assets/Buttons/home_verde.png',
            settings: 'assets/Buttons/settings_verde.png'
        }
    },
    purple: {
        primary: '#7d55a0',
        secondary: '#9b59b6',
        highlight: '#bb8cce',
        shadow: 'rgba(155, 89, 182, 0.5)',
        active: 'rgba(125, 85, 160, 0.6)',
        titlecards: {
            mainmenu: 'assets/Titlecards/mainmenu_roxo.png',
            gamemodes: 'assets/Titlecards/gamemodes_roxo.png',
            options: 'assets/Titlecards/options_roxo.png'
        },        gamemodes: {
            casual: 'assets/Gamemodes/casual_roxo.png',
            infinity: 'assets/Gamemodes/infinity_roxo.png',
            barrier: 'assets/Gamemodes/barrier_roxo.png',
            middlebarrier: 'assets/Gamemodes/middlebarrier_roxo.png',
            obstacles: 'assets/Gamemodes/obstacles_roxo.png',
            campaign: 'assets/Gamemodes/campaign_roxo.png'
        },
        buttons: {
            play: 'assets/Buttons/play_roxo.png',
            restart: 'assets/Buttons/restart_roxo.png',
            resume: 'assets/Buttons/resume_roxo.png',
            back: 'assets/Buttons/back_roxo.png',
            home: 'assets/Buttons/home_roxo.png',
            settings: 'assets/Buttons/settings_roxo.png'
        }
    },
    orange: {
        primary: '#d35400',
        secondary: '#e67e22',
        highlight: '#f39c12',
        shadow: 'rgba(230, 126, 34, 0.5)',
        active: 'rgba(211, 84, 0, 0.6)',
        titlecards: {
            mainmenu: 'assets/Titlecards/mainmenu_laranja.png',
            gamemodes: 'assets/Titlecards/gamemodes_laranja.png',
            options: 'assets/Titlecards/options_laranja.png'
        },        gamemodes: {
            casual: 'assets/Gamemodes/casual_laranja.png',
            infinity: 'assets/Gamemodes/infinity_laranja.png',
            barrier: 'assets/Gamemodes/barrier_laranja.png',
            middlebarrier: 'assets/Gamemodes/middlebarrier_laranja.png',
            obstacles: 'assets/Gamemodes/obstacles_laranja.png',
            campaign: 'assets/Gamemodes/campaign_laranja.png'
        },
        buttons: {
            play: 'assets/Buttons/play_laranja.png',
            restart: 'assets/Buttons/restart_laranja.png',
            resume: 'assets/Buttons/resume_laranja.png',
            back: 'assets/Buttons/back_laranja.png',
            home: 'assets/Buttons/home_laranja.png',
            settings: 'assets/Buttons/settings_laranja.png'
        }
    }
};

// Current theme (default: green)
let currentTheme = 'green';

// Initialize theme from localStorage on page load
export function initTheme() {
    const savedTheme = localStorage.getItem('selectedTheme');
    if (savedTheme && themes[savedTheme]) {
        currentTheme = savedTheme;
    }
    applyTheme(currentTheme);
    updateThemeButtonsState();
}

// Apply the selected theme
export function applyTheme(themeName) {
    if (!themes[themeName]) {
        console.error(`Theme '${themeName}' not found.`);
        return;
    }
    
    // Start transition effect
    addTransitionClass('theme-transitioning');
    
    const theme = themes[themeName];
    currentTheme = themeName;
    
    // Save the selected theme to localStorage
    localStorage.setItem('selectedTheme', themeName);
    
    // Attempt to update campaign theme if the module is loaded
    try {
        import('./campaign-menu.js').then(campaignModule => {
            if (campaignModule.updateCampaignTheme) {
                campaignModule.updateCampaignTheme();
            }
        }).catch(err => console.log('Campaign module not loaded yet'));
    } catch (error) {
        console.log('Could not update campaign theme, continuing with theme update');
    }
    
    // Update title card images
    document.querySelector('#title[style*="mainmenu_"]').style.backgroundImage = `url('${theme.titlecards.mainmenu}')`;
    document.querySelector('#gameModeTitle').style.backgroundImage = `url('${theme.titlecards.gamemodes}')`;
    document.querySelector('#optionsTitle').style.backgroundImage = `url('${theme.titlecards.options}')`;
      // Update game mode buttons
    document.querySelector('#infinityButton').style.backgroundImage = `url('${theme.gamemodes.infinity}')`;
    document.querySelector('#campaignButton').style.backgroundImage = `url('${theme.gamemodes.campaign}')`;
      // Update mode selection buttons
    document.querySelector('#modeClassic').style.backgroundImage = `url('${theme.gamemodes.casual}')`;
    document.querySelector('#modeBarriers').style.backgroundImage = `url('${theme.gamemodes.barrier}')`;
    document.querySelector('#modeRandomBarriers').style.backgroundImage = `url('${theme.gamemodes.middlebarrier}')`;
    document.querySelector('#modeObstacles').style.backgroundImage = `url('${theme.gamemodes.obstacles}')`;    // Update action buttons with themed images
    const buttonSelectors = {
        '#playButton': theme.buttons.play,
        '#startMenuButton': theme.buttons.play,
        '#playAgainButton': theme.buttons.restart,
        '#gameModeBackButton': theme.buttons.back,
        '#startScreenBackButton': theme.buttons.back,
        '#endScreenBackButton': theme.buttons.home,
        '#optionsBackButton': theme.buttons.back,
        '#optionsMenuButton': theme.buttons.settings,
        '#campaignNextLevelBtn': theme.buttons.play,
        '#campaignMenuBtn': theme.buttons.home,
        '#pauseResumeButton': theme.buttons.resume,
        '#pauseMenuButton': theme.buttons.home,
        '#pauseRestartButton': theme.buttons.restart,
        // Botões do menu ESC
        '#resumeButton': theme.buttons.resume,
        '#resetButton': theme.buttons.restart,
        '#mainMenuButton': theme.buttons.home
    };
    
    // Update all buttons with themed images
    for (const [selector, imagePath] of Object.entries(buttonSelectors)) {
        const element = document.querySelector(selector);
        if (element) {
            element.style.backgroundImage = `url('${imagePath}')`;
        }
    }
    
    // Não precisamos mais atualizar cores de fundo, já que os botões são imagens    // Update hover effects in CSS for buttons and modes
    const style = document.createElement('style');
    style.innerHTML = `
        .btn-image:hover, #playButton:hover, #playAgainButton:hover, #startMenuButton:hover, 
        #optionsMenuButton:hover, #infinityButton:hover, #campaignButton:hover, 
        #gameModeBackButton:hover, #startScreenBackButton:hover, 
        #endScreenBackButton:hover, #optionsBackButton:hover {
            transform: scale(1.05);
            filter: brightness(1.1);
            box-shadow: 0 0 10px ${theme.shadow};
        }
        
        #modeSelect button {
            border: 2px solid ${theme.primary};
        }
        
        #modeSelect button.active {
            background-color: ${theme.active} !important;
            border-color: ${theme.highlight} !important;
            box-shadow: 0 0 10px ${theme.shadow};
        }
        
        #modeSelect button:hover {
            border-color: ${theme.highlight} !important;
            box-shadow: 0 0 10px ${theme.shadow};
            transform: scale(1.05);
        }
        
        .theme-btn.active-theme {
            border: 3px solid white !important;
            box-shadow: 0 0 15px ${theme.highlight};
        }
        
        .theme-btn:hover {
            box-shadow: 0 0 12px ${theme.highlight};
        }
        
        .switch input:checked + span {
            background-color: ${theme.primary};
        }
          .switch input:focus + span {
            box-shadow: 0 0 1px ${theme.primary};
        }
        
        #scoreBoard {
            border: 1px solid ${theme.primary};
            box-shadow: 0 0 10px ${theme.shadow};
        }
        
        #score {
            color: ${theme.highlight};
        }
    `;
    
    // Remove any previously added theme styles
    const oldStyle = document.getElementById('theme-style');
    if (oldStyle) {
        oldStyle.remove();
    }
      // Add the new styles
    style.id = 'theme-style';
    document.head.appendChild(style);
    
    // Update theme buttons state
    updateThemeButtonsState();
}

// Helper function to convert hex to rgb
function hexToRgb(hex) {
    // Remove the # if present
    hex = hex.replace('#', '');
    
    // Parse the hex values
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    
    return `${r}, ${g}, ${b}`;
}

// Set up theme button event listeners
export function setupThemeButtons() {
    const greenBtn = document.getElementById('greenThemeBtn');
    const purpleBtn = document.getElementById('purpleThemeBtn');
    const orangeBtn = document.getElementById('orangeThemeBtn');
    
    greenBtn.addEventListener('click', () => {
        applyTheme('green');
    });
    
    purpleBtn.addEventListener('click', () => {
        applyTheme('purple');
    });
    
    orangeBtn.addEventListener('click', () => {
        applyTheme('orange');
    });
}

// Update theme buttons to show current selection
function updateThemeButtonsState() {
    const themeButtons = document.querySelectorAll('.theme-btn');
    themeButtons.forEach(button => {
        button.classList.remove('active-theme');
    });
    
    const activeButton = document.getElementById(`${currentTheme}ThemeBtn`);
    if (activeButton) {
        activeButton.classList.add('active-theme');
    }
}

// Get current theme buttons for use in other modules
export function getCurrentThemeButtons() {
    return themes[currentTheme].buttons;
}

// Get current theme gamemodes for use in other modules
export function getCurrentThemeGamemodes() {
    return themes[currentTheme].gamemodes;
}

// Get current theme levels for use in other modules
export function getCurrentTheme() {
    return currentTheme;
}