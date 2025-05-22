// theme-manager.js
// Handles theme changes in the game

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
    
    const theme = themes[themeName];
    currentTheme = themeName;
    
    // Save the selected theme to localStorage
    localStorage.setItem('selectedTheme', themeName);
    
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
    document.querySelector('#modeObstacles').style.backgroundImage = `url('${theme.gamemodes.obstacles}')`;
    
    // Update button colors
    const buttons = document.querySelectorAll('#gameModeBackButton, #startScreenBackButton, #endScreenBackButton, #optionsBackButton, #optionsMenuButton');
    buttons.forEach(button => {
        button.style.backgroundColor = theme.primary;
        button.style.borderColor = theme.secondary;
    });
    
    // Update hover effects in CSS
    const style = document.createElement('style');
    style.innerHTML = `
        #gameModeBackButton:hover, #startScreenBackButton:hover, #endScreenBackButton:hover, #optionsBackButton:hover, #optionsMenuButton:hover {
            background-color: ${theme.secondary} !important;
            transform: scale(1.05);
            box-shadow: 0 0 10px ${theme.shadow} !important;
        }
        
        #modeSelect button.active {
            background-color: ${theme.active} !important;
            border-color: ${theme.highlight} !important;
        }
        
        #modeSelect button:hover {
            border-color: ${theme.highlight} !important;
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