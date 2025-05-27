import * as THREE from 'three'; // Importa o módulo three
// main.js
import * as Scene from './scene.js';
import { createSnake, moveSnake, isAppleOnSnake, debugCollisions } from './Snake.js';
import { createApple } from './apple.js';
import { createObstacles, checkObstacleCollision, removeObstacles, animateEnvironmentalDecorations } from './obstacles.js';
import { createBarriers, createRandomBarriers, checkBarrierCollision, removeBarriers, animateBarriers } from './barriers.js';
import { createHitboxVisualization, toggleHitboxVisualization, toggleDebugMode } from './debug.js';
import { showTutorial } from './tutorial.js';
import { addControlsHelpButton } from './game-controls.js';
import { setupTouchControls } from './touch-controls.js';
import { initializeCameraIndicator, updateCameraIndicator } from './camera-indicator.js';
import { checkGameIntegrity } from './integrity-checker.js';
import { 
    campaignLevels,  
    nextLevel, 
    resetCampaign,
    getLevelInfo, 
    createCampaignBarriers, 
    showLevelInfo 
} from './campaign.js';
import {
    showCampaignMenu,
    loadCampaignProgress,
    markLevelCompleted,
    setCurrentLevel,
    getCurrentLevel
} from './campaign-menu.js';
import { initTheme, setupThemeButtons } from './theme-manager.js';
import { 
    initBoardThemeManager, 
    setBoardTheme, 
    getCurrentBoardTheme, 
    applyBoardThemeToScene,
    getThemeBarrierModel,
    getThemeObstacleModel 
} from './board-theme-manager.js';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { TextureLoader } from 'three';
import { 
    createLightingDebugMenu, 
    toggleLightingDebugMenu, 
    isLightingDebugMenuVisible,
    createLights 
} from './lighting-system.js';

// Variáveis globais
let scene, camera, renderer;
let snake = [], snakeHead, snakeDirection, snakeBoard;
let apple = null;
let obstacles = [];
let barriers = [];
let hitboxVisuals = [];
let environmentalDecorations = []; // Add environmental decorations array
let isPaused = true;
let gameRunning = false;
let lightingSystemAvailable = false; // Track if lighting system is available
let lastMoveTime = 0, moveInterval = 200;
let score = 0;
let highscore = localStorage.getItem('highscore') ? parseInt(localStorage.getItem('highscore')) : 0;
let gameMode = 'classic'; // classic, barriers, obstacles, campaign
let hitboxes;

// Smooth animation variables
let snakeTargetPositions = []; // Target positions for each snake segment
let snakeStartPositions = []; // Starting positions for interpolation
let animationProgress = 0; // Progress of current animation (0 to 1)
// Carrega o estado do modo debug do localStorage
export let debugMode = localStorage.getItem('debugMode') === 'true'; // Flag para ativar/desativar o modo de debug
let applesCollected = 0; // Contador de maçãs para o modo campanha
// Rastreia quais tutoriais já foram exibidos nesta sessão
const tutorialsShown = {
    'classic': false,
    'barriers': false,
    'obstacles': false,
    'campaign': false
};
let currentCampaignLevelInfoShown = false; // ADDED: Tracks if level info overlay shown for current attempt

// Camera animation variables
let cameraAnimationProgress = 0;
let cameraStartPosition = null;
let cameraTargetPosition = null;
let cameraStartLookAt = null;
let cameraTargetLookAt = null;
let cameraAnimationDuration = 3000; // 3 seconds
let cameraAnimationComplete = false;
let initialCameraAnimationShown = false; // Flag to track if initial camera animation has been shown for current session

// Mode selection logic
const playButton = document.getElementById('playButton');
const modeClassic = document.getElementById('modeClassic');
const modeBarriers = document.getElementById('modeBarriers');
const modeRandomBarriers = document.getElementById('modeRandomBarriers');
const modeObstacles = document.getElementById('modeObstacles');

function selectMode(mode) {    // Verifica se houve mudança no modo
    const previousMode = gameMode;    gameMode = mode;
    // Garantir que o botão de jogar esteja visível
    playButton.style.display = 'block';
    // Remove classe 'active' de todos os botões
    [modeClassic, modeBarriers, modeRandomBarriers, modeObstacles].forEach(btn => {
        if (btn) btn.classList.remove('active');
    });    // Ajusta o texto do modo e destaque visual
    let modeText = '';
    if (mode === 'classic') {
        modeClassic.classList.add('active');
        modeText = 'Teleporte';
    } else if (mode === 'barriers') {
        modeBarriers.classList.add('active');
        modeText = 'Barreiras';
    } else if (mode === 'randomBarriers') {
        if (modeRandomBarriers) modeRandomBarriers.classList.add('active');
        modeText = 'Labirinto';    } else if (mode === 'obstacles') {
        modeObstacles.classList.add('active');
        modeText = 'Obstáculos';
    } else if (mode === 'campaign') {
        const levelInfo = getLevelInfo();
        modeText = `Campaign - Level ${levelInfo.level}: ${levelInfo.name}`;
    }
    // Atualiza o texto do modo atual
    const currentModeElement = document.getElementById('currentMode');
    if (currentModeElement) {
        currentModeElement.textContent = 'Mode: ' + modeText;
    }
    // Reset do contador de maçãs ao mudar de modo
    applesCollected = 0;
    // Reset da campanha se estiver entrando no modo campanha
    if (mode === 'campaign') {
        resetCampaign();
    }
    // Resetar todos os tutoriais ao trocar de modo (exceto campanha)
    if (mode !== 'campaign') {
        Object.keys(tutorialsShown).forEach(key => {
            if (key !== 'campaign') tutorialsShown[key] = false;
        });
    }
}

modeClassic.addEventListener('click', () => {
    if (gameMode !== 'classic') {
        selectMode('classic');
    }
});
modeBarriers.addEventListener('click', () => {
    if (gameMode !== 'barriers') {
        selectMode('barriers');
    }
});
if (modeRandomBarriers) {
    modeRandomBarriers.addEventListener('click', () => {
        if (gameMode !== 'randomBarriers') {
            selectMode('randomBarriers');
        }
    });
}
modeObstacles.addEventListener('click', () => {
    if (gameMode !== 'obstacles') {
        selectMode('obstacles');
    }
});

window.onload = function() {
    // document.getElementById('mainMenu').style.display = 'flex'; // This will be handled by premenu.js
    document.getElementById('startScreen').style.display = 'none';
    document.getElementById('gameModeMenu').style.display = 'none';
    document.getElementById('optionsMenu').style.display = 'none';
    
    // Initialize camera indicator
    initializeCameraIndicator();
    
    // Handle preMainMenu to mainMenu transition
    const enterMainMenuButton = document.getElementById('enterMainMenuButton');
    if (enterMainMenuButton) {
        enterMainMenuButton.addEventListener('click', function() {
            document.getElementById('preMainMenu').style.display = 'none';
            document.getElementById('mainMenu').style.display = 'flex';
        });
    }
      // Inicializa o modo debug se necessário
    initDebugMode();
    
    // Carrega as configurações de opções
    loadOptionsSettings();
    
    // Initialize board theme manager
    initBoardThemeManager();
    
    // Initialize board theme UI
    initBoardTheme();
};

document.getElementById('startMenuButton').addEventListener('click', function () {
    document.getElementById('mainMenu').style.display = 'none';
    document.getElementById('gameModeMenu').style.display = 'flex';
});

// Game Mode Menu buttons - redirect to board theme menu instead of directly to game
document.getElementById('infinityButton').addEventListener('click', function () {
    document.getElementById('gameModeMenu').style.display = 'none';
    document.getElementById('boardThemeMenu').style.display = 'flex';
    // Store the selected game mode for later use
    window.selectedGameMode = 'infinity';
});

document.getElementById('campaignButton').addEventListener('click', function () {
    document.getElementById('gameModeMenu').style.display = 'none';
    
    // Carrega o progresso da campanha
    loadCampaignProgress();
    
    // Mostra o menu de campanha diretamente
    showCampaignMenu(levelNumber => {
        gameMode = 'campaign';
        const success = setCurrentLevel(levelNumber);
        tutorialsShown['campaign'] = false; // Reset tutorial flag for new level selection
        currentCampaignLevelInfoShown = false; // ADDED: Reset level info flag
        gameRunning = true;
        startGame();
        // startGame will now handle showing popups and pausing
    });
});

// Back buttons
document.getElementById('gameModeBackButton').addEventListener('click', function () {
    document.getElementById('gameModeMenu').style.display = 'none';
    document.getElementById('mainMenu').style.display = 'flex';
});

document.getElementById('startScreenBackButton').addEventListener('click', function () {
    document.getElementById('startScreen').style.display = 'none';
    document.getElementById('gameModeMenu').style.display = 'flex';
});

// Evento para alternar o modo debug a partir do checkbox
// Removido - agora só funciona com a tecla B

// Inicializa o modo debug com base nas configurações salvas
function initDebugMode() {
    // Se o modo debug estiver ativo, mostrar a notificação
    if (debugMode) {
        toggleDebugMode(true);
        // Create lighting menu if game is running and lighting system is available
        if (gameRunning && lightingSystemAvailable) {
            import('./lighting-system.js').then(lightingModule => {
                lightingModule.createLightingDebugMenu();
            }).catch(error => {
                console.warn('Could not create lighting debug menu:', error);
            });
        }
    }
}

// Função para esconder a tela de início e iniciar o jogo
playButton.addEventListener('click', function () {
    console.log("Play button clicked");
    document.getElementById('startScreen').style.display = 'none';
    document.getElementById('scoreBoard').style.display = 'block'; // Make sure the scoreboard is visible
    gameRunning = true;

    // For non-campaign modes, show tutorial if needed BEFORE starting the game
    if (gameMode !== 'campaign' && !tutorialsShown[gameMode]) {
        console.log('Showing tutorial for mode:', gameMode);
        console.log('tutorialsShown state:', tutorialsShown);
        isPaused = true; // Pause for non-campaign tutorial
        
        // Aguarda um frame antes de mostrar o tutorial para garantir que o DOM esteja atualizado
        requestAnimationFrame(() => {
            showTutorial(gameMode, () => {
                console.log('Tutorial closed, resuming game');
                isPaused = false;
                tutorialsShown[gameMode] = true;
                startGame(); // Inicia o jogo apenas após o tutorial ser fechado
            });
        });
    } else {
        // Only start the game if no tutorial is needed
        startGame(); // startGame will set isPaused correctly based on popups shown
    }
});

// Variável para armazenar a próxima direção (para melhorar responsividade)
let nextDirection = null;

// Flag para verificar se os controles já foram configurados
let controlsSetup = false;

// Função para configurar os controles da cobra
function setupControls() {
    // Evita configurar os controles mais de uma vez
    if (controlsSetup) {
        console.log("Controles já configurados, ignorando nova configuração");
        return;
    }
    
    controlsSetup = true;    // Função auxiliar para definir a direção garantindo que não vá na direção oposta
    function setDirection(newX, newZ) {
        const dir = snakeDirection;
        
        // Ignore os controles se estiver pausado com tutorial
        if (document.getElementById('tutorial-overlay')) {
            return false;
        }
        
        // Ajusta a direção com base no tipo de câmera atual
        let adjustedX = newX;
        let adjustedZ = newZ;        if (Scene.getCameraType() === 'perspective') {
            // Para a câmera perspectiva (vista lateral/inclinada desde a esquerda)
            // A câmera está posicionada à esquerda (-25, 30, 20) olhando para (20, 0, 20)
            // Controles baseados na perspectiva visual do jogador:
            
            // W (para cima no teclado) = movimento para longe da câmera (X positivo)
            // S (para baixo no teclado) = movimento em direção à câmera (X negativo)  
            // A (esquerda no teclado) = movimento para a esquerda na tela (Z negativo)
            // D (direita no teclado) = movimento para a direita na tela (Z positivo)
            
            // Os controles estão ajustados para esta perspectiva de câmera
        }
        // Para câmera ortográfica, mantemos os controles originais
        
        // Impede movimento na direção oposta (que causaria colisão imediata)
        if ((dir.x !== 0 && adjustedX === -dir.x) || (dir.z !== 0 && adjustedZ === -dir.z)) {
            return false; // Ignora movimento na direção oposta
        }
        
        // Verifica se a nova direção é diferente da atual e se está mudando de vertical para horizontal ou vice-versa
        // Só permite mudanças perpendiculares à direção atual (de X para Z ou de Z para X)
        if ((dir.x !== 0 && adjustedZ !== 0) || (dir.z !== 0 && adjustedX !== 0)) {
            // Armazena a próxima direção para ser aplicada no próximo ciclo de jogo
            nextDirection = { x: adjustedX, z: adjustedZ };
            return true;
        } else if (dir.x === adjustedX && dir.z === adjustedZ) {
            return false; // É a mesma direção, não faz nada
        }
        
        return false;
    }
    
    // Configura os controles de teclado
    window.addEventListener('keydown', (event) => {
        // Ignore os controles se estiver pausado com tutorial
        if (document.getElementById('tutorial-overlay')) {
            return;
        }        switch(event.key.toLowerCase()) {
            // Controles de movimento da cobra - Camera perspective based
            case 'arrowup':
            case 'w':
            case '8':
                setDirection(1, 0); // W moves snake further from camera (right on world X-axis)
                break;
            case 'arrowdown':
            case 's':
            case '2':
                setDirection(-1, 0); // S moves snake closer to camera (left on world X-axis)
                break;
            case 'arrowleft':
            case 'a':
            case '4':
                setDirection(0, -1); // A moves snake left on screen (negative Z-axis)
                break;
            case 'arrowright':
            case 'd':
            case '6':
                setDirection(0, 1); // D moves snake right on screen (positive Z-axis)
                break;
                  // Controles adicionais
            case ' ': // Espaço para pausar o jogo
                if (gameRunning) {
                    togglePause();
                }
                break;                
            case 'escape': // ESC para exibir o menu de pause
                if (gameRunning) {
                    showEscMenu();
                }
                break;case 'h': // Tecla H para mostrar/esconder hitboxes (modo debug)
                if (debugMode) {
                    toggleHitboxVisualization(scene, hitboxVisuals, hitboxVisuals.length === 0);
                    if (hitboxVisuals.length === 0) {
                        hitboxVisuals = createHitboxVisualization(scene, hitboxes);
                    } else {
                        hitboxVisuals = [];
                    }
                }
                break;
            case 'c': // Tecla C para visualizar colisões (debug)
                if (debugMode) {
                    // Visualiza as posições da cobra por alguns segundos
                    debugCollisions(scene, snakeBoard, hitboxes);
                    console.log("Matriz da cobra:", JSON.stringify(snakeBoard));
                    console.log("Posição da cabeça:", snakeHead.position);
                }                break;            case 'b': // Tecla B para ativar/desativar modo debug
            case 'f3': // Tecla F3 como alternativa para ativar/desativar modo debug (mais comum em jogos)
                // Impede comportamento padrão e execução duplicada
                event.preventDefault();
                event.stopPropagation();
                
                // Evita toggle quando a tecla é mantida pressionada
                if (event.repeat) {
                    break;
                }
                
                // Altera o modo debug instantaneamente
                debugMode = !debugMode;
                toggleDebugMode(debugMode);
                console.log(`Debug mode toggled to: ${debugMode}`);
                break;            case 'p': // Tecla P como alternativa para pausar
                if (gameRunning) {
                    togglePause();
                }
                break;            case 'm': // Tecla M para abrir o menu de campanha (apenas no modo campanha)
                if (gameMode === 'campaign' && gameRunning) {
                    isPaused = true; // Pausa o jogo
                    showCampaignMenu(levelNumber => {
                        // Callback chamado quando um nível é selecionado
                        setCurrentLevel(levelNumber);
                        tutorialsShown['campaign'] = false; // Reset tutorial flag for new level selection
                        currentCampaignLevelInfoShown = false; // ADDED: Reset level info flag
                        // Reinicia o jogo para o nível selecionado
                        startNextCampaignLevel(); // This should call startGame or similar logic
                        // startGame (or equivalent in startNextCampaignLevel) will handle popups and pausing
                    });
                }
                break;            case 'v': // Tecla V para alternar entre câmeras perspectiva e ortográfica
                if (gameRunning) {
                    const newCameraType = Scene.getCameraType() === 'perspective' ? 'orthographic' : 'perspective';
                    camera = Scene.switchCameraType(newCameraType);
                    console.log(`Camera switched to: ${newCameraType}`);
                    
                    // Show visual feedback using camera indicator
                    updateCameraIndicator(newCameraType);
                }
                break;
            case 'l': // Tecla L para abrir/fechar menu de luzes (apenas no modo debug)
                if (debugMode && gameRunning) {
                    event.preventDefault();
                    event.stopPropagation();
                    
                    // Use dynamic import to avoid loading issues
                    import('./lighting-system.js').then(lightingModule => {
                        lightingModule.toggleLightingDebugMenu();
                    }).catch(error => {
                        console.warn('Lighting system not available:', error);
                    });
                }
                break;
        }
    });
    
    // Configura controles de toque (apenas se o dispositivo suportar touch)
    if ('ontouchstart' in window) {
        setupTouchControls(setDirection);
    }
}

// Função para criar a maçã inicial com verificação adequada de barreiras
function createInitialApple() {
    return createApple(
        scene, 
        snake, 
        isAppleOnSnake, 
        snakeBoard, 
        hitboxes, 
        obstacles, 
        barriers // Garantir que as barreiras sejam passadas para verificação de colisão
    );
}

// Função para iniciar o jogo
function startGame() {
    score = 0;
    snake = [];
    snakeBoard = [];
    obstacles = [];
    barriers = [];
    hitboxVisuals = [];
    environmentalDecorations = []; // Reset environmental decorations
    isPaused = false; // Default to not paused; camera animation will set it true
    
    // Reset camera animation state
    cameraAnimationComplete = false;
    
    // Atualiza a interface
    document.getElementById('score').textContent = 'Score: 0';
    document.getElementById('highscore').textContent = 'Highscore: ' + highscore;
    
    // Atualiza o texto do modo
    let modeText = '';
    if (gameMode === 'classic') modeText = 'Teleporte';
    else if (gameMode === 'barriers') modeText = 'Barreiras';
    else if (gameMode === 'randomBarriers') modeText = 'Labirinto';
    else if (gameMode === 'obstacles') modeText = 'Obstáculos';
    document.getElementById('currentMode').textContent = 'Mode: ' + modeText;
    
    // Remove o renderer antigo se existir
    if (renderer) {
        if (renderer.domElement && renderer.domElement.parentNode === document.body) {
            document.body.removeChild(renderer.domElement);
        }
    }

    // Cria a nova cena
    scene = Scene.createScene();
    camera = Scene.createCamera();
    renderer = Scene.createRenderer();
    
    // Start camera animation to move from snake position to final position
    animateCameraToPosition();
    
    // Use new lighting system with async handling
    Scene.addLights(scene).then(lights => {
        lightingSystemAvailable = true;
        console.log('Lighting system loaded successfully');
        
        // Create lighting debug menu if in debug mode
        if (debugMode) {
            import('./lighting-system.js').then(lightingModule => {
                lightingModule.createLightingDebugMenu();
            }).catch(error => {
                console.warn('Could not create lighting debug menu:', error);
            });
        }
    }).catch(error => {
        console.warn('Lighting system failed, using fallback:', error);
        lightingSystemAvailable = false;
    });
    
    Scene.addBoard(scene);
    Scene.addLowPolyDecorations(scene);
    
    // Initialize board theme manager and apply board theme to the scene
    try {
        console.log('Initializing board theme manager...');
        initBoardThemeManager();
        
        console.log('Applying board theme to scene...');
        const selectedBoardTheme = getCurrentBoardTheme();
        
        // Replace await with Promise handling
        applyBoardThemeToSceneLocal(selectedBoardTheme).then(success => {
            // Store the theme globally so other modules can access it
            window.currentBoardTheme = selectedBoardTheme;
        }).catch(error => {
            console.warn('Failed to apply board theme:', error);
        });
    } catch (error) {
        console.warn('Failed to initialize board theme manager:', error);
    }
      // Criar decorações ambientais para todos os modos de jogo
    import('./obstacles.js').then(async module => {
        try {
            environmentalDecorations = await module.createEnvironmentalDecorations(scene);
            console.log('Environmental decorations created successfully');
        } catch (error) {
            console.warn('Failed to create environmental decorations:', error);
        }
    });
    
    // Gera a matriz de hitboxes para o tabuleiro
    hitboxes = Scene.generateBoardHitboxes();

    // Cria a cobra
    const snakeObj = createSnake(scene);
    snake = snakeObj.snake;
    snakeHead = snakeObj.snakeHead;
    snakeDirection = snakeObj.snakeDirection;
    snakeBoard = snakeObj.snakeBoard;
    
    // Initialize smooth animation positions
    initializeSnakeAnimationPositions();

    // Criar maçã - use promise-based approach
    createInitialApple().then(newApple => {
        apple = newApple;
    });
    
    // Criar barreiras se o modo for "barriers" - Replace await with Promise
    if (gameMode === 'barriers') {
        createBarriers(scene, snakeBoard, hitboxes)
        .then(newBarriers => {
            barriers = newBarriers;
        })
        .catch(error => {
            console.error("Error creating barriers:", error);
            barriers = []; // Set empty barriers array on error
        });
    }
    
    // Criar barreiras aleatórias se o modo for "randomBarriers" - Replace await with Promise
    if (gameMode === 'randomBarriers') {
        barriers = [];
        // Import the enhanced barrier system
        import('./barriers.js').then(module => {
            module.createRandomBarriers(scene, barriers, snakeBoard, hitboxes, 8);
        });
    }
    
    // Criar obstáculos se o modo for "obstacles"
    if (gameMode === 'obstacles') {
        obstacles = createObstacles(scene, snake, snakeBoard, hitboxes, 18); // Aumentado para 18 obstáculos
        
        // Menu de obstáculos só aparece no modo debug
        const existingButtons = document.getElementById('obstacle-buttons');
        if (debugMode) {
            import('./buttons.js').then(module => {
                // Remove botões existentes se houver (garantia extra)
                if (existingButtons) {
                    document.body.removeChild(existingButtons);
                }
                // Configura os callbacks para os botões
                const buttonCallbacks = {
                    onTreeAdd: () => addCustomObstacle('tree'),
                    onRockAdd: () => addCustomObstacle('rock'),
                    onRandomAdd: () => addCustomObstacle('random'),
                    onClear: clearAllObstacles
                };
                // Adiciona os botões à interface
                module.setupObstacleButtons(document.body, buttonCallbacks);
            });
        } else if (existingButtons) {
            // Se não estiver em debug, remove o menu se existir
            document.body.removeChild(existingButtons);
        }
    }
    
    // Configurar modo campanha
    if (gameMode === 'campaign') {
        // Obter informações do nível atual
        const levelInfo = getLevelInfo();
        
        // Criar barreiras baseadas no nível atual - Replace await with Promise
        createCampaignBarriers(scene, snakeBoard, hitboxes).then(newBarriers => {
            barriers = newBarriers;
            
            // Expose barriers globally for testing
            window.barriers = barriers;
        });
        
        // Expose collision checking function for testing
        import('./campaign.js').then(module => {
            window.checkCampaignBarrierCollision = module.checkCampaignBarrierCollision;
        });
        
        // Reset do contador de maçãs para o nível
        applesCollected = 0;
        
        // Atualizar o texto do modo para incluir informações do nível
        document.getElementById('currentMode').textContent = `Campaign - Level ${levelInfo.level}: ${levelInfo.name}`;
        
        // Mostrar objetivo na pontuação e manter o highscore
        document.getElementById('score').textContent = `Maçãs: 0/${levelInfo.targetApples}`;
        document.getElementById('highscore').textContent = `Highscore: ${highscore}`;
        
        // Adiciona informação sobre o menu de campanha
        const campaignInfoDiv = document.getElementById('campaign-info') || document.createElement('div');
        campaignInfoDiv.id = 'campaign-info';
        campaignInfoDiv.textContent = 'Pressione M para acessar o menu de níveis';
        if (!document.getElementById('campaign-info')) { // Append only if not already there
            campaignInfoDiv.style.position = 'absolute';
            campaignInfoDiv.style.bottom = '10px';
            campaignInfoDiv.style.left = '10px';
            campaignInfoDiv.style.color = 'white';
            campaignInfoDiv.style.fontSize = '14px';
            campaignInfoDiv.style.opacity = '0.7';
            document.body.appendChild(campaignInfoDiv);
        }
        
        // Mostrar informações do nível na overlay (Level Info) and then Tutorial
        if (!currentCampaignLevelInfoShown) {
            isPaused = true; // Pause for Level Info
            showCampaignLevelInfo(levelInfo, () => { // Callback when "Começar Nível" is clicked
                currentCampaignLevelInfoShown = true;
                if (!tutorialsShown['campaign']) {
                    // isPaused is still true
                    showTutorial('campaign', () => { // Callback when tutorial is closed
                        tutorialsShown['campaign'] = true;
                        // Only unpause if camera animation is complete
                        if (cameraAnimationComplete) {
                            isPaused = false;
                        }
                    });
                } else {
                    // Tutorial already shown - only unpause if camera animation is complete
                    if (cameraAnimationComplete) {
                        isPaused = false;
                    }
                }
            });
        } else {
            // Level info already shown (restart), tutorial should also be shown. Game runs.
            // isPaused remains false (from start of startGame)
        }
    }
    
    // Configura controles e inicia a animação
    setupControls();
    animate();
    
    // Adiciona o botão de ajuda com os controles
    addControlsHelpButton();
    
    // Ativa visualização de hitboxes se estiver em modo debug
    if (debugMode) {
        hitboxVisuals = createHitboxVisualization(scene, hitboxes);
    }
}

// Fim de jogo
function endGame(gameCompleted = false) {
    // Evita múltiplas chamadas (pode acontecer devido a bugs de colisão)
    if (!gameRunning || isPaused) {
        return;
    }
    
    // Remove a informação de campanha se existir
    const campaignInfo = document.getElementById('campaign-info');
    if (campaignInfo) {
        document.body.removeChild(campaignInfo);
    }
    
    // Verifica se é uma colisão válida
    if (debugMode) {
        console.log("Jogo finalizado - Score:", score);
        console.log("Posições finais da cobra:", JSON.stringify(snakeBoard));
    }
    
    if (score > highscore) {
        highscore = score;
        localStorage.setItem('highscore', highscore);
    }

    document.getElementById('finalScore').textContent = 'Score: ' + score;
    document.getElementById('highscoreEnd').textContent = 'Highscore: ' + highscore;
    
    // Muda a mensagem se o jogo foi completado (tabuleiro preenchido)
    if (gameCompleted) {
        document.getElementById('finalScore').textContent = 'PARABÉNS! Você venceu o jogo!';
        document.getElementById('highscoreEnd').textContent = 'Score Final: ' + score;
    }
    
    document.getElementById('endScreen').style.display = 'flex';
    document.getElementById('scoreBoard').style.display = 'none';

    // Limpar obstáculos
    if (obstacles && obstacles.length > 0) {
        removeObstacles(scene, obstacles);
        obstacles = [];
    }
    
    // Limpar barreiras
    if (barriers && barriers.length > 0) {
        removeBarriers(scene, barriers);
        barriers = [];
    }

    isPaused = true;
    gameRunning = false;
}

// Botão de reinício
document.getElementById('playAgainButton').addEventListener('click', function () {
    document.getElementById('endScreen').style.display = 'none';
    document.getElementById('scoreBoard').style.display = 'block';
    gameRunning = true;

    // For non-campaign modes, show tutorial if needed
    if (gameMode !== 'campaign' && !tutorialsShown[gameMode]) {
        isPaused = true; // Pause for non-campaign tutorial
        showTutorial(gameMode, () => {
            isPaused = false;
            tutorialsShown[gameMode] = true;
            startGame(); // Start game after tutorial
        });
    } else {
        // Start game directly if no tutorial needed or campaign mode
        startGame(); // startGame will handle campaign popups correctly (skip them) and set isPaused.
    }
});

// Botão para voltar ao menu principal da tela de fim de jogo
document.getElementById('endScreenBackButton').addEventListener('click', function () {
    document.getElementById('endScreen').style.display = 'none';
    document.getElementById('mainMenu').style.display = 'flex';
    resetGame();
});

// Função para resetar o jogo completamente
function resetGame() {
    score = 0;
    gameRunning = false;
    isPaused = true;
    snake = [];
    obstacles = [];
    barriers = [];
    hitboxVisuals = [];
    applesCollected = 0;
    moveInterval = 200; // Reset da velocidade do jogo
      // Limpar decorações ambientais
    if (environmentalDecorations && environmentalDecorations.length > 0) {
        import('./obstacles.js').then(module => {
            module.removeEnvironmentalDecorations(scene, environmentalDecorations);
            environmentalDecorations = [];
            console.log('Decorações ambientais removidas');
        }).catch(error => {
            console.warn('Erro ao remover decorações ambientais:', error);
        });
    }
    
    // Se existir uma campanha em andamento, resetá-la
    if (gameMode === 'campaign') {
        resetCampaign();
    }
    
    // Remove o renderer antigo se existir
    if (renderer) {
        document.body.removeChild(renderer.domElement);
    }
    
    // Remove a informação de campanha se existir
    const campaignInfo = document.getElementById('campaign-info');
    if (campaignInfo) {
        document.body.removeChild(campaignInfo);
    }
}

// Load snake texture
const textureLoader = new TextureLoader();
const snakeTexture = textureLoader.load('assets/textures/snake_texture.png');

// Initialize smooth animation positions
function initializeSnakeAnimationPositions() {
    snakeTargetPositions = [];
    snakeStartPositions = [];
    
    for (let i = 0; i < snake.length; i++) {
        const currentPos = snake[i].position.clone();
        snakeTargetPositions.push(currentPos.clone());
        snakeStartPositions.push(currentPos.clone());
    }
    animationProgress = 1; // Start with no animation needed
}

// Update target positions when snake moves
function updateSnakeTargetPositions() {
    // Ensure animation arrays match snake length
    while (snakeTargetPositions.length < snake.length) {
        const lastPos = snake[snakeTargetPositions.length].position.clone();
        snakeTargetPositions.push(lastPos.clone());
        snakeStartPositions.push(lastPos.clone());
    }
    
    // Store current positions as start positions for interpolation
    for (let i = 0; i < snake.length && i < snakeBoard.length; i++) {
        if (snake[i] && snakeTargetPositions[i]) {
            snakeStartPositions[i] = snake[i].position.clone();
            
            // Set new target position based on snakeBoard
            const { x, z } = snakeBoard[i];
            const { centerX, centerZ } = hitboxes[x][z];
            snakeTargetPositions[i].set(centerX, 1, centerZ);
        }
    }
    animationProgress = 0; // Reset animation progress
}

// Smooth interpolation function with easing
function easeInOutQuad(t) {
    return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
}

// Update snake visual positions with smooth interpolation
function updateSnakeVisualPositions(time) {
    if (animationProgress >= 1) return; // No animation needed
    
    // Calculate animation progress based on time and moveInterval
    const timeSinceLastMove = time - lastMoveTime;
    const rawProgress = Math.min(timeSinceLastMove / moveInterval, 1);
    
    // Apply easing for smoother movement
    const easedProgress = easeInOutQuad(rawProgress);
    
    // Interpolate positions for all snake segments
    for (let i = 0; i < snake.length && i < snakeTargetPositions.length; i++) {
        if (snake[i] && snakeStartPositions[i] && snakeTargetPositions[i]) {
            const startPos = snakeStartPositions[i];
            const targetPos = snakeTargetPositions[i];
            
            // Interpolate between start and target positions
            snake[i].position.lerpVectors(startPos, targetPos, easedProgress);
        }
    }
    
    animationProgress = rawProgress;
}

// Animate camera from snake position to final viewing position
function animateCameraToPosition() {
    // Ensure a game mode is selected before animating
    if (!gameMode) {
        console.warn("No game mode selected. Camera animation skipped.");
        return;
    }    // Snake starts at (9,9) in matrix, each cell is 2 units, so position is (19,0,19)
    const snakeX = 19;
    const snakeZ = 19;    // Start position: at snake head level
    cameraStartPosition = new THREE.Vector3(snakeX, 3, snakeZ);
    cameraStartLookAt = new THREE.Vector3(snakeX, 0, snakeZ);
      // Target position: centered at middle of left edge of board at higher elevation, moved more behind
    cameraTargetPosition = new THREE.Vector3(-25, 30, 20);
    cameraTargetLookAt = new THREE.Vector3(20, 0, 20);
    
    // Get current active camera from Scene
    camera = Scene.getCurrentCamera();
    
    // Set initial camera position
    camera.position.copy(cameraStartPosition);
    camera.lookAt(cameraStartLookAt.x, cameraStartLookAt.y, cameraStartLookAt.z);
    
    cameraAnimationProgress = 0;
    cameraAnimationComplete = false;
    
    // Ensure game is paused during camera animation
    isPaused = true;
    
    // Start the animation
    const startTime = Date.now();
    
    function updateCameraAnimation() {
        const elapsed = Date.now() - startTime;
        cameraAnimationProgress = Math.min(elapsed / cameraAnimationDuration, 1);
        
        // Use easing function for smooth animation
        const easedProgress = easeInOutQuad(cameraAnimationProgress);
        
        // Interpolate camera position
        const currentPos = new THREE.Vector3().lerpVectors(cameraStartPosition, cameraTargetPosition, easedProgress);
        const currentLookAt = new THREE.Vector3().lerpVectors(cameraStartLookAt, cameraTargetLookAt, easedProgress);
        
        // Get current active camera in case it was switched during animation
        camera = Scene.getCurrentCamera();
        camera.position.copy(currentPos);
        camera.lookAt(currentLookAt.x, currentLookAt.y, currentLookAt.z);
        
        // Continue animation if not complete
        if (cameraAnimationProgress < 1) {
            requestAnimationFrame(updateCameraAnimation);
        } else {
            // Animation complete - mark as finished and unpause game
            cameraAnimationComplete = true;
            
            // Only unpause if no other overlays are showing
            if (!document.getElementById('tutorial-overlay') && 
                !document.getElementById('level-overlay') && 
                !document.getElementById('level-complete-overlay') && 
                !document.getElementById('campaign-complete-overlay')) {
                isPaused = false;
            }
        }
    }
    
    updateCameraAnimation();
}

// Animação
function animate(time) {
    requestAnimationFrame(animate);

    // Anima os obstáculos mesmo se o jogo estiver pausado
    if (gameMode === 'obstacles' && obstacles.length > 0) {
        // Importa e executa as funções de animação e atualização dos obstáculos
        import('./obstacles.js').then(module => {
            module.animateObstacles(obstacles, time);
            module.updateObstacles(scene, obstacles, snake, snakeBoard, hitboxes);
        });
    }
    
    // Anima as barreiras no modo barriers
    if (gameMode === 'barriers' && barriers.length > 0) {
        // Anima as barreiras complexas
        animateBarriers(barriers, time);
    }
    
    // Animate the apple if it exists
    if (apple) {
        if (apple.userData && typeof apple.userData.animate === 'function') {
            apple.userData.animate(time);
        }
    }
    
    if (isPaused || !gameRunning) {
        // Continua renderizando mesmo se pausado para que efeitos visuais funcionem
        renderer.render(scene, camera);
        return;
    }      // Verificação periódica de integridade do jogo (a cada 2 segundos)
    if (time % 2000 < 20) { // Verificamos sempre, não apenas em modo debug
        const integrityCheckPerformed = true; // Flag to indicate check was done
        const needsCorrection = checkGameIntegrity(scene, snake, snakeHead, snakeBoard, apple, obstacles, hitboxes, barriers);
        if (needsCorrection) {
            console.log("Integrity check found issues and applied corrections. State after correction:", {
                snakeBoard: JSON.parse(JSON.stringify(snakeBoard)), // Deep copy for logging
                // Add other relevant game state variables if needed for debugging
            });
            if (debugMode) {
                console.log("Correções de integridade aplicadas");
            }
        }
    }
        
    // Guard: Only move snake if snake, snakeHead, and snakeBoard are valid
    if (!snake || !Array.isArray(snake) || snake.length === 0 || !snakeHead || !snakeBoard || !Array.isArray(snakeBoard) || snakeBoard.length === 0) {
        renderer.render(scene, camera);
        return;
    }
    
    if (time - lastMoveTime > moveInterval) {
        // Aplica a próxima direção, se existir, antes de mover a cobra
        if (nextDirection) {
            // Verifica se a direção ainda é válida (não oposta à direção atual)
            const oppositeX = snakeDirection.x !== 0 && nextDirection.x === -snakeDirection.x;
            const oppositeZ = snakeDirection.z !== 0 && nextDirection.z === -snakeDirection.z;
            
            if (!oppositeX && !oppositeZ) {
                snakeDirection = nextDirection;
            }
            nextDirection = null;
        }        moveSnake(
            snake,
            snakeHead,
            snakeDirection,
            apple,
            gameMode,
            endGame,            () => {
                // Verifica se existe limite máximo de segmentos
                const MAX_SEGMENTS = 100; // Defina um limite razoável para sua cobra (ajuste conforme necessário)
                
                // Se a cobra atingir o limite máximo, não adiciona mais segmentos e apenas pontua
                if (snake.length >= MAX_SEGMENTS) {
                    console.log(`Limite máximo de segmentos (${MAX_SEGMENTS}) atingido!`);
                    // Mesmo sem adicionar segmento, ainda incrementa o score e remove a maçã
                    scene.remove(apple);
                    return;
                }
                
                // addSegment - Adiciona um novo segmento na posição do último segmento
                const tail = snakeBoard[snakeBoard.length - 1];
                // Cria uma cópia das coordenadas para não modificar o original
                const { x, z } = {...tail};
                
                // Verifica se as coordenadas estão nos limites do tabuleiro
                const validX = Math.max(0, Math.min(19, x));
                const validZ = Math.max(0, Math.min(19, z));
                
                // Primeiro cria o segmento visual 3D
                // Obtém as coordenadas 3D corretas para o novo segmento
                const { centerX, centerZ } = hitboxes[validX][validZ];
                  // Materiais e geometria consistentes para todos os segmentos
                const segmentMaterial = new THREE.MeshStandardMaterial({
                    map: snakeTexture,
                    roughness: 0.5,
                    metalness: 0.2
                });
                  // Cria um novo segmento visual com geometria e material consistentes
                const segmentSize = 1.8; // Igual ao valor usado em Snake.js
                const newSegment = new THREE.Mesh(
                    new RoundedBoxGeometry(segmentSize, segmentSize, segmentSize, 8, 0.3),
                    segmentMaterial
                );
                
                // Define a posição correta no espaço 3D
                newSegment.position.set(centerX, 1, centerZ);
                  // Adiciona o segmento à cena e ao array de segmentos
                snake.push(newSegment);
                scene.add(newSegment);
                
                // Add animation positions for the new segment
                const newSegmentPos = newSegment.position.clone();
                snakeTargetPositions.push(newSegmentPos.clone());
                snakeStartPositions.push(newSegmentPos.clone());
                
                // Só depois que garantimos que o objeto visual foi criado, atualizamos a matriz
                // Adiciona a posição à matriz do tabuleiro com coordenadas validadas
                snakeBoard.push({ x: validX, z: validZ });
                
                // Garante sincronização entre matriz e objetos visuais
                if (snake.length !== snakeBoard.length) {
                    console.warn(`Corrigindo discrepância: snake (${snake.length}) vs snakeBoard (${snakeBoard.length})`);
                    // Sincroniza os tamanhos
                    while (snakeBoard.length > snake.length) {
                        snakeBoard.pop();
                    }
                }
                  // Remove a maçã existente
                scene.remove(apple);
                
                // Create new apple with proper barrier collision checking
                createApple(
                    scene, 
                    snake, 
                    isAppleOnSnake, 
                    snakeBoard, 
                    hitboxes, 
                    obstacles, 
                    barriers // Ensure barriers are passed for collision checking
                ).then(newApple => {
                    apple = newApple;
                });
                
                return apple;
            },            () => {
                // Aumenta o score e atualiza o placar
                score += 10;
                
                // Tratamento especial para o modo campanha
                if (gameMode === 'campaign') {
                    // Incrementa o contador de maçãs coletadas
                    applesCollected++;
                    
                    // Obtém informações do nível atual
                    const levelInfo = getLevelInfo();
                      // Atualiza o placar mostrando progresso
                    document.getElementById('score').textContent = `Maçãs: ${applesCollected}/${levelInfo.targetApples}`;
                    
                    // Ainda atualiza o score interno para highscore
                    if (score > highscore) {
                        highscore = score;
                        localStorage.setItem('highscore', highscore);
                        document.getElementById('highscore').textContent = `Highscore: ${highscore}`;
                    }
                    
                    // Verifica se completou o objetivo do nível
                    if (applesCollected >= levelInfo.targetApples) {
                        // Avança para o próximo nível
                        handleLevelCompletion();
                    }
                } else {
                    // Modo normal - apenas atualiza o placar
                    document.getElementById('score').textContent = 'Score: ' + score;
                }
                
                // Aumenta a velocidade do jogo ligeiramente a cada ponto
                if (moveInterval > 50) {
                    moveInterval = Math.max(50, moveInterval - 2);
                }
            },snakeBoard,
            hitboxes,
            obstacles,
            barriers        );
        
        // Update animation target positions after snake movement
        updateSnakeTargetPositions();
          lastMoveTime = time;
    }    // Update smooth snake animation
    updateSnakeVisualPositions(time);
      // Animate terrain shader
    Scene.animateTerrain(scene, time);
      // Animate environmental decorations if they exist
    if (environmentalDecorations && environmentalDecorations.length > 0) {
        animateEnvironmentalDecorations(environmentalDecorations, time);
    }
    
    // Get current camera in case it was switched
    camera = Scene.getCurrentCamera();
    
    renderer.render(scene, camera);
}

// Função para mostrar informações do nível na overlay
function showCampaignLevelInfo(levelInfo, callback) {
    // Verifica se já existe uma overlay de nível e remove
    const existingOverlay = document.getElementById('level-overlay');
    if (existingOverlay && existingOverlay.parentNode) {
        existingOverlay.parentNode.removeChild(existingOverlay);
    }
    
    // Cria o elemento de overlay
    const overlay = document.createElement('div');
    overlay.id = 'level-overlay';
    overlay.style.position = 'fixed';
    overlay.style.top = '50%';
    overlay.style.left = '50%';
    overlay.style.transform = 'translate(-50%, -50%)';
    overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.85)';
    overlay.style.color = 'white';
    overlay.style.padding = '30px';
    overlay.style.borderRadius = '10px';
    overlay.style.textAlign = 'center';
    overlay.style.zIndex = '1000';
    overlay.style.width = '80%';
    overlay.style.maxWidth = '600px';
    
    // Adiciona o conteúdo
    overlay.innerHTML = `
        <h2 style="color:#3498db">Nível ${levelInfo.level}: ${levelInfo.name}</h2>
        <p style="font-size:18px;margin:20px 0">${levelInfo.description}</p>
        <p style="color:#2ecc71;font-weight:bold;font-size:20px">Objetivo: Coletar ${levelInfo.targetApples} maçãs</p>
        <p style="color:#e74c3c;font-size:16px">Obstáculos: ${levelInfo.barrierCount}</p>
        <button id="start-level-button" style="background-color:#3498db;color:white;border:none;padding:10px 20px;border-radius:5px;cursor:pointer;font-size:16px;margin-top:20px">Começar Nível</button>
    `;
    
    // Adiciona o overlay ao corpo do documento
    document.body.appendChild(overlay);
    
    // Pausa o jogo enquanto mostra o overlay
    isPaused = true;
      // Configura o evento de clique para o botão de início
    document.getElementById('start-level-button').addEventListener('click', function() {
        // Remove a overlay
        const overlayToRemove = document.getElementById('level-overlay');
        if (overlayToRemove && overlayToRemove.parentNode) {
            overlayToRemove.parentNode.removeChild(overlayToRemove);
        }
        // Only unpause if camera animation is complete
        if (cameraAnimationComplete) {
            isPaused = false;
        }
        if (callback) callback();
    });
}

// Função para lidar com a conclusão de um nível na campanha
function handleLevelCompletion() {
    // Pausa o jogo
    isPaused = true;
    
    // Marca o nível atual como completado
    markLevelCompleted(getCurrentLevel());
    
    // Avança para o próximo nível
    const nextLevelInfo = nextLevel();
    
    // Verifica se ainda há níveis disponíveis
    if (nextLevelInfo) {
        // Criar overlay de conclusão de nível
        const overlay = document.createElement('div');
        overlay.id = 'level-complete-overlay';
        overlay.style.position = 'fixed';
        overlay.style.top = '50%';
        overlay.style.left = '50%';
        overlay.style.transform = 'translate(-50%, -50%)';
        overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.9)';
        overlay.style.color = 'white';
        overlay.style.padding = '40px';
        overlay.style.borderRadius = '10px';
        overlay.style.textAlign = 'center';
        overlay.style.zIndex = '1000';
        overlay.style.width = '80%';
        overlay.style.maxWidth = '600px';
        
        // Adiciona o conteúdo de conclusão
        overlay.innerHTML = `
            <h1 style="color:#2ecc71;margin-bottom:30px">Nível Concluído!</h1>
            <h3 style="margin:20px 0">Você coletou todas as ${applesCollected} maçãs!</h3>
            <p style="font-size:18px;margin:20px 0">Próximo Nível: ${nextLevelInfo.level} - ${nextLevelInfo.name}</p>
            <p style="color:#f39c12;font-size:16px;margin-bottom:30px">${nextLevelInfo.description}</p>
            <button id="next-level-button" style="background-color:#2ecc71;color:white;border:none;padding:15px 30px;border-radius:5px;cursor:pointer;font-size:18px">Continuar para Próximo Nível</button>
        `;
        
        // Adiciona o overlay ao corpo do documento
        document.body.appendChild(overlay);
        
        // Configura o evento de clique para o botão de próximo nível
        document.getElementById('next-level-button').addEventListener('click', function() {
            // Remove a overlay
            document.body.removeChild(overlay);
            
            // Reinicia o jogo com o novo nível
            startNextCampaignLevel();
        });
    } else {
        // Campanha completa - mostrar tela final
        showCampaignComplete();
    }
}

// Função para iniciar o próximo nível da campanha
function startNextCampaignLevel() {
    // Remove todos os elementos existentes
    if (barriers && barriers.length > 0) {
        removeBarriers(scene, barriers);
        barriers = [];
    }
    
    if (obstacles && obstacles.length > 0) {
        removeObstacles(scene, obstacles);
        obstacles = [];
    }
    
    // Reset do contador de maçãs
    applesCollected = 0;
    
    // Reinicia o jogo mantendo o modo campanha
    // Note: Caller should handle startGame() to avoid double initialization
    startGame();
}

// Função para exibir tela de finalização da campanha
function showCampaignComplete() {
    // Pausa o jogo
    isPaused = true;
    
    // Criar overlay de conclusão da campanha
    const overlay = document.createElement('div');
    overlay.id = 'campaign-complete-overlay';
    overlay.style.position = 'fixed';
    overlay.style.top = '50%';
    overlay.style.left = '50%';
    overlay.style.transform = 'translate(-50%, -50%)';
    overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.95)';
    overlay.style.color = 'white';
    overlay.style.padding = '40px';
    overlay.style.borderRadius = '10px';
    overlay.style.textAlign = 'center';
    overlay.style.zIndex = '1000';
    overlay.style.width = '80%';
    overlay.style.maxWidth = '700px';
    
    // Adiciona o conteúdo de conclusão da campanha
    overlay.innerHTML = `
        <h1 style="color:gold;margin-bottom:30px;font-size:36px">PARABÉNS!</h1>
        <h2 style="color:#2ecc71;margin:20px 0;font-size:28px">Você Completou Todos os Níveis da Campanha!</h2>
        <p style="font-size:20px;margin:30px 0">Uma jornada incrível de 10 níveis chegou ao fim. Você é um verdadeiro mestre da Serpente!</p>
        <p style="color:#3498db;font-size:18px;margin-bottom:40px">Score Total: ${score}</p>
        <button id="return-menu-button" style="background-color:#e74c3c;color:white;border:none;padding:15px 30px;margin-right:20px;border-radius:5px;cursor:pointer;font-size:18px">Voltar ao Menu</button>
        <button id="play-again-campaign-button" style="background-color:#3498db;color:white;border:none;padding:15px 30px;border-radius:5px;cursor:pointer;font-size:18px">Jogar Novamente</button>
    `;
    
    // Adiciona o overlay ao corpo do documento
    document.body.appendChild(overlay);
    
    // Configura o evento de clique para o botão de voltar ao menu
    document.getElementById('return-menu-button').addEventListener('click', function() {
        // Remove a overlay
        document.body.removeChild(overlay);
        
        // Volta para o menu principal
        document.getElementById('endScreen').style.display = 'none';
        document.getElementById('mainMenu').style.display = 'flex';
        document.getElementById('scoreBoard').style.display = 'none';
        
        // Reset da campanha para o próximo jogo
        resetCampaign();
    });
    
    // Configura o evento de clique para o botão de jogar novamente
    document.getElementById('play-again-campaign-button').addEventListener('click', function() {
        // Remove a overlay
        document.body.removeChild(overlay);
        
        // Reset da campanha
        resetCampaign();
        
        // Reinicia o jogo no modo campanha
        document.getElementById('endScreen').style.display = 'none';
        document.getElementById('scoreBoard').style.display = 'block';
        gameRunning = true;
        startGame();
    });
}

// Função para adicionar um obstáculo personalizado (árvore ou pedra)
function addCustomObstacle(type) {
    // Verifica se estamos no modo obstáculos e se o jogo está rodando
    if (gameMode !== 'obstacles' || !gameRunning) {
        console.log("Não é possível adicionar obstáculos neste momento");
        return;
    }
    
    // Verifica se temos as dependências necessárias
    if (!scene || !snakeBoard || !hitboxes) {
        console.error("Dependências ausentes para adicionar obstáculos");
        return;
    }
    
    // Importa as funções necessárias
    import('./models.js').then(modelsModule => {
        import('./obstacles.js').then(obstaclesModule => {
            // Encontra uma posição válida para o novo obstáculo
            let x, z;
            let validPosition = false;
            let attempts = 0;
            const maxAttempts = 50;
            
            while (!validPosition && attempts < maxAttempts) {
                x = Math.floor(Math.random() * 20);
                z = Math.floor(Math.random() * 20);
                
                // Verifica se a posição está livre
                validPosition = !isPositionOccupied(x, z);
                attempts++;
            }
            
            if (!validPosition) {
                console.warn("Não foi possível encontrar uma posição válida após", maxAttempts, "tentativas");
                return;
            }
            
            // Cria o obstáculo conforme o tipo
            let obstacle;
            const { centerX, centerZ } = hitboxes[x][z];
            
            if (type === 'tree' || (type === 'random' && Math.random() > 0.5)) {
                // Cria uma árvore
                obstacle = modelsModule.createTreeModel();
                
                // Escala e posição
                const scale = 0.7 + Math.random() * 0.3;
                obstacle.scale.set(scale, scale, scale);
                obstacle.position.set(centerX, 0, centerZ);
                
                // Propriedades adicionais
                obstacle.isTree = true;
            } else {
                // Cria uma pedra
                obstacle = modelsModule.createRockModel();
                
                // Escala e posição
                const scale = 0.8 + Math.random() * 0.4;
                obstacle.scale.set(scale, scale * 0.7, scale);
                
                // Rotação aleatória
                obstacle.rotation.set(
                    Math.random() * 0.3,
                    Math.random() * Math.PI * 2,
                    Math.random() * 0.3
                );
                
                obstacle.position.set(centerX, 0.5, centerZ);
                obstacle.isTree = false;
            }
            
            // Configura propriedades para o sistema de vida
            obstacle.boardPosition = { x, z };
            obstacle.creationTime = Date.now();
            obstacle.isFading = false;
            
            // Adiciona o obstáculo à cena e ao array
            scene.add(obstacle);
            obstacles.push(obstacle);
            
            console.log(`Novo obstáculo (${type}) adicionado em [${x}, ${z}]`);
        });
    });
}

// Função para verificar se uma posição está ocupada (pela cobra ou obstáculos)
function isPositionOccupied(x, z) {
    // Verifica se a cobra está nesta posição
    const isSnakePos = snakeBoard.some(segment => segment.x === x && segment.z === z);
    if (isSnakePos) return true;
    
    // Verifica se já existe um obstáculo nesta posição
    const isObstaclePos = obstacles.some(obstacle => 
        obstacle.boardPosition && obstacle.boardPosition.x === x && obstacle.boardPosition.z === z
    );
    
    return isObstaclePos;
}

// Função para limpar todos os obstáculos
function clearAllObstacles() {
    if (!scene || !obstacles || obstacles.length === 0) return;
    
    console.log(`Removendo ${obstacles.length} obstáculos do jogo`);
    
    // Remove cada obstáculo da cena
    obstacles.forEach(obstacle => {
        if (obstacle && typeof obstacle === 'object') {
            scene.remove(obstacle);
        }
    });
    
    // Limpa o array de obstáculos
    obstacles = [];
    
    // Regenera obstáculos básicos
    import('./obstacles.js').then(module => {
        obstacles = module.createObstacles(scene, snake, snakeBoard, hitboxes, 18);
    });
}

// Add event listeners for options menu
document.getElementById('optionsMenuButton').addEventListener('click', function() {
    document.getElementById('mainMenu').style.display = 'none';
    document.getElementById('optionsMenu').style.display = 'flex';
});

document.getElementById('optionsBackButton').addEventListener('click', function() {
    document.getElementById('optionsMenu').style.display = 'none';
    document.getElementById('mainMenu').style.display = 'flex';
});

// Save options settings to localStorage
document.getElementById('musicVolume').addEventListener('change', function() {
    localStorage.setItem('musicVolume', this.value);
});

document.getElementById('sfxVolume').addEventListener('change', function() {
    localStorage.setItem('sfxVolume', this.value);
});

document.getElementById('muteToggle').addEventListener('change', function() {
    localStorage.setItem('muted', this.checked);
});

document.getElementById('graphicsQuality').addEventListener('change', function() {
    localStorage.setItem('graphicsQuality', this.value);
});

document.getElementById('showFPSToggle').addEventListener('change', function() {
    localStorage.setItem('showFPS', this.checked);
});

// Load options settings from localStorage
function loadOptionsSettings() {
    const musicVolume = localStorage.getItem('musicVolume');
    if (musicVolume !== null) {
        document.getElementById('musicVolume').value = musicVolume;
    }
    
    const sfxVolume = localStorage.getItem('sfxVolume');
    if (sfxVolume !== null) {
        document.getElementById('sfxVolume').value = sfxVolume;
    }
    
    const muted = localStorage.getItem('muted') === 'true';
    document.getElementById('muteToggle').checked = muted;
    
    const graphicsQuality = localStorage.getItem('graphicsQuality');
    if (graphicsQuality !== null) {
        document.getElementById('graphicsQuality').value = graphicsQuality;
    }
    
    const showFPS = localStorage.getItem('showFPS') === 'true';
    document.getElementById('showFPSToggle').checked = showFPS;
}

// Chama a função para carregar as configurações ao iniciar o jogo
loadOptionsSettings();

// Configuração inicial do tema
initTheme();


// Configura os botões de tema
setupThemeButtons();

// Funções para gerenciar o menu ESC
function togglePause() {
    isPaused = !isPaused;
    
    // Se pausou o jogo, mostra um indicador visual (opcional)
    if (isPaused) {
        console.log("Jogo pausado");
    } else {
        console.log("Jogo resumido");
    }
}

function showEscMenu() {
    // Pausa o jogo
    isPaused = true;
    
    // Mostra o menu ESC
    document.getElementById('escMenu').style.display = 'flex';
}

function hideEscMenu() {
    // Esconde o menu ESC
    document.getElementById('escMenu').style.display = 'none';
}

// Configurar os botões do menu ESC
document.getElementById('resumeButton').addEventListener('click', function() {
    hideEscMenu();
    isPaused = false;
});

document.getElementById('resetButton').addEventListener('click', function() {
    hideEscMenu();
    // Reseta o jogo mantendo o mesmo modo
    document.getElementById('endScreen').style.display = 'none';
    document.getElementById('scoreBoard').style.display = 'block';
    gameRunning = true;
    startGame();
});

document.getElementById('mainMenuButton').addEventListener('click', function() {
    hideEscMenu();
    // Volta para o menu principal
    resetGame();
    document.getElementById('endScreen').style.display = 'none';
    document.getElementById('mainMenu').style.display = 'flex';
    document.getElementById('scoreBoard').style.display = 'none';
});

// Handle window resize for both camera types
window.addEventListener('resize', function() {
    if (camera && renderer) {
        // Update camera aspect ratio and renderer size
        Scene.updateCameraAspect();
        camera = Scene.getCurrentCamera(); // Get the updated current camera
        renderer.setSize(window.innerWidth, window.innerHeight);
    }
});

// Board Theme Menu functionality
let selectedBoardTheme = 'classic'; // Default board theme

// Board theme selection buttons
document.getElementById('classicThemeBtn').addEventListener('click', function() {
    selectBoardTheme('classic');
});

document.getElementById('desertThemeBtn').addEventListener('click', function() {
    selectBoardTheme('desert');
});

document.getElementById('forestThemeBtn').addEventListener('click', function() {
    selectBoardTheme('forest');
});

document.getElementById('snowThemeBtn').addEventListener('click', function() {
    selectBoardTheme('snow');
});

// Function to handle board theme selection
function selectBoardTheme(theme) {
    selectedBoardTheme = theme;
    
    // Update the board theme manager
    const themeResult = setBoardTheme(theme);
    
    // Remove active class from all theme buttons
    document.querySelectorAll('.board-theme-btn').forEach(btn => {
        btn.classList.remove('active-board-theme');
    });
    
    // Add active class to selected theme button
    document.getElementById(theme + 'ThemeBtn').classList.add('active-board-theme');
    
    // Store selected theme in localStorage
    localStorage.setItem('selectedBoardTheme', theme);
    
    // If theme changed and we have a scene, update the visual elements
    if (themeResult.changed && scene) {
        // Apply the new theme to the scene
        applyBoardThemeToSceneLocal(theme)
            .then(() => {
                // Recreate environmental decorations if they exist
                if (environmentalDecorations && environmentalDecorations.length > 0) {
                    import('./board-theme-manager.js')
                        .then(module => {
                            module.recreateEnvironmentalDecorations(scene, environmentalDecorations)
                                .then(newDecorations => {
                                    environmentalDecorations = newDecorations;
                                    console.log('Decorações ambientais recriadas após mudança de tema');
                                })
                                .catch(error => console.warn('Erro ao recriar decorações ambientais:', error));
                        });
                }
            })
            .catch(error => console.warn('Erro ao aplicar tema à cena:', error));
    }
}

// Board theme menu navigation buttons
document.getElementById('boardThemeBackButton').addEventListener('click', function() {
    document.getElementById('boardThemeMenu').style.display = 'none';
    document.getElementById('gameModeMenu').style.display = 'flex';
});

document.getElementById('boardThemeConfirmButton').addEventListener('click', function() {
    document.getElementById('boardThemeMenu').style.display = 'none';
    
    // Set the game mode that was selected before coming to board theme menu
    if (window.selectedGameMode === 'infinity') {
        gameMode = 'classic'; // Infinity mode is classic mode
        selectMode('classic');
    }
    
    document.getElementById('startScreen').style.display = 'flex';
});

// Initialize board theme on page load
function initBoardTheme() {
    const savedTheme = localStorage.getItem('selectedBoardTheme');
    if (savedTheme && ['classic', 'desert', 'forest', 'snow'].includes(savedTheme)) {
        selectBoardTheme(savedTheme);
    } else {
        selectBoardTheme('classic');
    }
}

// Function to get the current board theme (now uses board theme manager)
function getCurrentBoardThemeLocal() {
    return getCurrentBoardTheme();
}

// Function to apply board theme to the 3D scene (now uses board theme manager)
function applyBoardThemeToSceneLocal(themeName) {
    if (scene) {
        try {
            // If a specific theme is provided, set it first
            let themeChanged = false;
            if (themeName) {
                const themeResult = setBoardTheme(themeName);
                themeChanged = themeResult.changed;
            }
            
            // Apply the theme to the scene
            return applyBoardThemeToScene(scene).then(result => {
                // If theme changed and we have environmental decorations, update them
                // Note: This is now handled by the selectBoardTheme function to avoid duplication
                return result;
            });
        } catch (error) {
            console.error('Error applying board theme:', error);
            return Promise.reject(error);
        }
    } else {
        console.warn('Scene not initialized when trying to apply board theme');
        return Promise.resolve(false);
    }
}
