import * as THREE from 'three'; // Importa o módulo three
// main.js
import * as Scene from './scene.js';
import { createSnake, moveSnake, isAppleOnSnake, debugCollisions } from './Snake.js';
import { createApple } from './apple.js';
import { createObstacles, checkObstacleCollision, removeObstacles } from './obstacles.js';
import { createBarriers, createRandomBarriers, checkBarrierCollision, removeBarriers, animateBarriers } from './barriers.js';
import { createHitboxVisualization, toggleHitboxVisualization, toggleDebugMode } from './debug.js';
import { showTutorial } from './tutorial.js';
import { addControlsHelpButton } from './game-controls.js';
import { setupTouchControls } from './touch-controls.js';
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
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { TextureLoader } from 'three';

// Variáveis globais
let scene, camera, renderer;
let snake = [], snakeHead, snakeDirection, snakeBoard;
let apple = null;
let obstacles = [];
let barriers = [];
let hitboxVisuals = [];
let isPaused = true;
let gameRunning = false;
let lastMoveTime = 0, moveInterval = 200;
let score = 0;
let highscore = localStorage.getItem('highscore') ? parseInt(localStorage.getItem('highscore')) : 0;
let gameMode = 'classic'; // classic, barriers, obstacles, campaign
let hitboxes;
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
};

document.getElementById('startMenuButton').addEventListener('click', function () {
    document.getElementById('mainMenu').style.display = 'none';
    document.getElementById('gameModeMenu').style.display = 'flex';
});

// Game Mode Menu buttons
document.getElementById('infinityButton').addEventListener('click', function () {
    document.getElementById('gameModeMenu').style.display = 'none';
    document.getElementById('startScreen').style.display = 'flex';
});

document.getElementById('campaignButton').addEventListener('click', function () {
    document.getElementById('gameModeMenu').style.display = 'none';
    
    // Carrega o progresso da campanha
    loadCampaignProgress();
    
    // Mostra o menu de campanha diretamente
    showCampaignMenu(levelNumber => {
        gameMode = 'campaign';
        const success = setCurrentLevel(levelNumber);
        gameRunning = true;
        startGame();
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
    }
}

// Função para esconder a tela de início e iniciar o jogo
playButton.addEventListener('click', function () {
    console.log("Play button clicked");
    document.getElementById('startScreen').style.display = 'none';
    document.getElementById('scoreBoard').style.display = 'block'; // Make sure the scoreboard is visible
    gameRunning = true;
    startGame();
    
    // Mantém o jogo pausado enquanto o tutorial é exibido
    isPaused = true;
    
    // Exibe o tutorial apenas se ainda não foi mostrado nesta sessão para este modo
    if (!tutorialsShown[gameMode]) {
        showTutorial(gameMode, () => {
            // Callback chamado quando o tutorial é fechado
            isPaused = false;
            tutorialsShown[gameMode] = true;
        });
    } else {
        // Se o tutorial já foi exibido, inicie o jogo imediatamente
        isPaused = false;
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
    
    controlsSetup = true;
    // Função auxiliar para definir a direção garantindo que não vá na direção oposta
    function setDirection(newX, newZ) {
        const dir = snakeDirection;
        
        // Ignore os controles se estiver pausado com tutorial
        if (document.getElementById('tutorial-overlay')) {
            return false;
        }
        
        // Impede movimento na direção oposta (que causaria colisão imediata)
        if ((dir.x !== 0 && newX === -dir.x) || (dir.z !== 0 && newZ === -dir.z)) {
            return false; // Ignora movimento na direção oposta
        }
        
        // Verifica se a nova direção é diferente da atual e se está mudando de vertical para horizontal ou vice-versa
        // Só permite mudanças perpendiculares à direção atual (de X para Z ou de Z para X)
        if ((dir.x !== 0 && newZ !== 0) || (dir.z !== 0 && newX !== 0)) {
            // Armazena a próxima direção para ser aplicada no próximo ciclo de jogo
            nextDirection = { x: newX, z: newZ };
            return true;
        } else if (dir.x === newX && dir.z === newZ) {
            return false; // É a mesma direção, não faz nada
        }
        
        return false;
    }
    
    // Configura os controles de teclado
    window.addEventListener('keydown', (event) => {
        // Ignore os controles se estiver pausado com tutorial
        if (document.getElementById('tutorial-overlay')) {
            return;
        }
        
        switch(event.key.toLowerCase()) {
            // Controles de movimento da cobra - Setas
            case 'arrowup':
            case 'w':
            case '8':
                setDirection(0, -1); // Cima
                break;
            case 'arrowdown':
            case 's':
            case '2':
                setDirection(0, 1); // Baixo
                break;
            case 'arrowleft':
            case 'a':
            case '4':
                setDirection(-1, 0); // Esquerda
                break;
            case 'arrowright':
            case 'd':
            case '6':
                setDirection(1, 0); // Direita
                break;
                
            // Controles adicionais
            case ' ': // Espaço para pausar o jogo
                if (gameRunning) {
                    isPaused = !isPaused;
                }
                break;            case 'h': // Tecla H para mostrar/esconder hitboxes (modo debug)
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
                break;
            case 'p': // Tecla P como alternativa para pausar
                if (gameRunning) {
                    isPaused = !isPaused;
                }
                break;
            case 'm': // Tecla M para abrir o menu de campanha (apenas no modo campanha)
                if (gameMode === 'campaign' && gameRunning) {
                    isPaused = true; // Pausa o jogo
                    showCampaignMenu(levelNumber => {
                        // Callback chamado quando um nível é selecionado
                        setCurrentLevel(levelNumber);
                        // Reinicia o jogo para o nível selecionado
                        startNextCampaignLevel();
                        isPaused = false; // Retoma o jogo
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

// Função para iniciar o jogo
function startGame() {
    score = 0;
    snake = [];
    obstacles = [];
    barriers = [];
    hitboxVisuals = [];
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
        document.body.removeChild(renderer.domElement);
    }

    // Cria a nova cena
    scene = Scene.createScene();
    camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(40, 38, 40); // Vista isométrica, acima e para o lado
    camera.lookAt(20, 0, 20); // Centro do tabuleiro
    renderer = Scene.createRenderer();
    
    // Adiciona elementos na cena
    Scene.addLights(scene);
    Scene.addBoard(scene);
    Scene.addLowPolyDecorations(scene);
    
    // Gera a matriz de hitboxes para o tabuleiro
    hitboxes = Scene.generateBoardHitboxes();

    // Cria a cobra
    const snakeObj = createSnake(scene);
    snake = snakeObj.snake;
    snakeHead = snakeObj.snakeHead;
    snakeDirection = snakeObj.snakeDirection;
    snakeBoard = snakeObj.snakeBoard;    // Criar maçã
    apple = createApple(scene, snake, (s, x, z) => isAppleOnSnake(s, x, z, snakeBoard), snakeBoard, hitboxes);
    
    // Criar barreiras se o modo for "barriers"
    if (gameMode === 'barriers') {
        barriers = createBarriers(scene, snakeBoard, hitboxes);
    }
    // Criar barreiras aleatórias se o modo for "randomBarriers"
    if (gameMode === 'randomBarriers') {
        barriers = [];
        if (typeof createRandomBarriers === 'function') {
            createRandomBarriers(scene, barriers, snakeBoard, hitboxes, 8);
        }
    }        // Criar obstáculos se o modo for "obstacles"
        if (gameMode === 'obstacles') {
            obstacles = createObstacles(scene, snake, snakeBoard, hitboxes, 18); // Aumentado para 18 obstáculos
            
            // Importa e configura os botões para controle dos obstáculos
            import('./buttons.js').then(module => {
                // Remove botões existentes se houver
                const existingButtons = document.getElementById('obstacle-buttons');
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
        }
    
    // Configurar modo campanha
    if (gameMode === 'campaign') {
        // Obter informações do nível atual
        const levelInfo = getLevelInfo();
        
        // Criar barreiras baseadas no nível atual
        barriers = createCampaignBarriers(scene, snakeBoard, hitboxes);
        
        // Reset do contador de maçãs para o nível
        applesCollected = 0;
          // Atualizar o texto do modo para incluir informações do nível
        document.getElementById('currentMode').textContent = `Campaign - Level ${levelInfo.level}: ${levelInfo.name}`;
        
        // Mostrar objetivo na pontuação e manter o highscore
        document.getElementById('score').textContent = `Maçãs: 0/${levelInfo.targetApples}`;
        document.getElementById('highscore').textContent = `Highscore: ${highscore}`;
        
        // Adiciona informação sobre o menu de campanha
        const campaignInfo = document.createElement('div');
        campaignInfo.id = 'campaign-info';
        campaignInfo.textContent = 'Pressione M para acessar o menu de níveis';
        campaignInfo.style.position = 'absolute';
        campaignInfo.style.bottom = '10px';
        campaignInfo.style.left = '10px';
        campaignInfo.style.color = 'white';
        campaignInfo.style.fontSize = '14px';
        campaignInfo.style.opacity = '0.7';
        document.body.appendChild(campaignInfo);
        
        // Mostrar informações do nível na overlay
        showCampaignLevelInfo(levelInfo);
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
    startGame();
    
    // Se o tutorial para este modo ainda não foi mostrado, exibe-o
    if (!tutorialsShown[gameMode]) {
        isPaused = true;
        showTutorial(gameMode, () => {
            isPaused = false;
            tutorialsShown[gameMode] = true;
        });    } else {
        isPaused = false;
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

// Animação
function animate(time) {
    requestAnimationFrame(animate);    // Anima os obstáculos mesmo se o jogo estiver pausado
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
    
    // Anima a maçã se existir (rotação e flutuação)
    if (apple && apple.userData && apple.userData.animate) {
        apple.userData.animate(time);
    }
      if (isPaused || !gameRunning) {
        // Continua renderizando mesmo se pausado para que efeitos visuais funcionem
        renderer.render(scene, camera);
        return;
    }      // Verificação periódica de integridade do jogo (a cada 2 segundos)
    if (time % 2000 < 20) { // Verificamos sempre, não apenas em modo debug
        const needsCorrection = checkGameIntegrity(scene, snake, snakeHead, snakeBoard, apple, obstacles, hitboxes, barriers);
        if (needsCorrection && debugMode) {
            console.log("Correções de integridade aplicadas");
        }
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
                  // Cria uma nova maçã em uma posição que não está em um obstáculo ou na cobra
                let appleX, appleZ;
                let validPosition = false;
                let maxAttempts = 100; // Aumenta o limite de tentativas
                let attempts = 0;
                let spawnFailed = false;
                
                // Cria uma nova maçã usando a função createApple
                apple = createApple(scene, snake, (s, x, z) => isAppleOnSnake(s, x, z, snakeBoard), snakeBoard, hitboxes);
                  // Verifica se o jogo foi completado (tabuleiro quase cheio)
                if (apple.userData && apple.userData.gameCompleted) {
                    // Mostra uma mensagem de vitória
                    console.log("PARABÉNS! Você preencheu quase todo o tabuleiro!");
                    alert("PARABÉNS! Você preencheu quase todo o tabuleiro e venceu o jogo!");
                    endGame(true); // Encerra o jogo com vitória
                    return;
                }
                
                // Calcula a posição da maçã na matriz do tabuleiro
                appleX = Math.round((apple.position.x - 1) / 2);
                appleZ = Math.round((apple.position.z - 1) / 2);
                
                do {
                    // Por padrão, a posição é válida
                    validPosition = true;
                    
                    // Verifica se a maçã não está em um obstáculo (modo obstáculos)
                    if (gameMode === 'obstacles') {
                        if (obstacles.some(obstacle => 
                            obstacle.boardPosition && obstacle.boardPosition.x === appleX && obstacle.boardPosition.z === appleZ)) {
                            validPosition = false;
                        }
                    }
                    // Verifica se a maçã não está em uma barreira (qualquer modo com barreiras)
                    if (barriers && barriers.length > 0) {
                        // Barreiras complexas (campanha)
                        const complexCollision = barriers.some(barrier => {
                            if (barrier.type === 'complex' && barrier.boardPosition) {
                                return barrier.boardPosition.x === appleX && barrier.boardPosition.z === appleZ;
                            }
                            return false;
                        });
                        // Barreiras de limite
                        const boundaryCollision = barriers.some(barrier => {
                            if (barrier.type === 'boundary' && barrier.boardPositions) {
                                return barrier.boardPositions.some(pos => pos.x === appleX && pos.z === appleZ);
                            }
                            return false;
                        });
                        // Barreiras random-piece (aleatórias)
                        const randomPieceCollision = barriers.some(barrier => {
                            if (barrier.type === 'random-piece' && barrier.boardPositions) {
                                return barrier.boardPositions.some(pos => pos.x === appleX && pos.z === appleZ);
                            }
                            return false;
                        });
                        if (complexCollision || boundaryCollision || randomPieceCollision) {
                            validPosition = false;
                        }
                    }
                    
                    // Se a posição não for válida, remove a maçã e tenta criar uma nova
                    if (!validPosition) {
                        scene.remove(apple);
                        attempts++;
                        
                        // Se exceder o número máximo de tentativas, busca uma posição manualmente
                        if (attempts >= maxAttempts) {
                            console.warn("Máximo de tentativas atingido para posicionar a maçã. Buscando posição alternativa.");
                            
                            // Encontra todas as posições livres, considerando obstáculos e barreiras
                            const availablePositions = findAvailableSpot();
                            
                            if (availablePositions && availablePositions.x !== undefined) {
                                // Usa a posição encontrada
                                appleX = availablePositions.x;
                                appleZ = availablePositions.z;
                                const { centerX, centerZ } = hitboxes[appleX][appleZ];
                                
                                // Cria uma nova maçã na posição encontrada
                                const appleGeometry = new THREE.SphereGeometry(1, 16, 16);
                                const appleMaterial = new THREE.MeshStandardMaterial({ 
                                    color: 0xff0000,
                                    roughness: 0.5,
                                    metalness: 0.2
                                });
                                apple = new THREE.Mesh(appleGeometry, appleMaterial);
                                apple.position.set(centerX, 1, centerZ);
                                scene.add(apple);
                                

                                // Anima a maçã
                                const originalY = apple.position.y;
                                apple.userData.animationStartTime = Date.now();
                                apple.userData.animate = function(time) {
                                    apple.rotation.y += 0.005;
                                    apple.position.y = originalY + Math.sin(time * 0.002) * 0.2;
                                };
                                
                                validPosition = true;
                                console.log("Maçã posicionada manualmente em:", appleX, appleZ);
                            } else {
                                console.error("ERRO: Impossível encontrar posição para a maçã!");
                                spawnFailed = true;
                            }
                            break;
                        }
                        
                        // Tenta uma nova posição aleatória
                        apple = createApple(scene, snake, (s, x, z) => isAppleOnSnake(s, x, z, snakeBoard), snakeBoard, hitboxes);
                        appleX = Math.round((apple.position.x - 1) / 2);
                        appleZ = Math.round((apple.position.z - 1) / 2);
                    }
                } while (!validPosition && (gameMode === 'obstacles' || gameMode === 'barriers'));
                
                // Função para encontrar um espaço disponível manualmente
                function findAvailableSpot() {
                    // Percorre todo o tabuleiro em busca de uma posição livre
                    for (let x = 0; x < 20; x++) {
                        for (let z = 0; z < 20; z++) {
                            // Verifica se a posição está ocupada pela cobra
                            const isOnSnake = snakeBoard.some(seg => seg.x === x && seg.z === z);
                            if (isOnSnake) continue;
                            
                            // Verifica se a posição está em algum obstáculo
                            let isOnObstacle = false;
                            if (gameMode === 'obstacles') {
                                isOnObstacle = obstacles.some(obs => obs.boardPosition.x === x && obs.boardPosition.z === z);
                            }
                            if (isOnObstacle) continue;
                            
                            // Verifica se a posição está em alguma barreira
                            let isOnBarrier = false;
                            if (gameMode === 'barriers') {
                                // Verifica barreiras complexas
                                isOnBarrier = barriers.some(barrier => {
                                    if (barrier.type === 'complex') {
                                        return barrier.boardPosition.x === x && barrier.boardPosition.z === z;
                                    }
                                    return false;
                                });
                                
                                // Verifica barreiras de limite
                                if (!isOnBarrier) {
                                    isOnBarrier = barriers.some(barrier => {
                                        if (barrier.type === 'boundary') {
                                            return barrier.boardPositions.some(pos => pos.x === x && pos.z === z);
                                        }
                                        return false;
                                    });
                                }
                            }
                            if (isOnBarrier) continue;
                            
                            // Se chegou até aqui, a posição está livre
                            return { x, z };
                        }
                    }
                    
                    // Se não encontrar nenhuma posição, retorna null
                    return null;
                }
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
            barriers
        );
        lastMoveTime = time;
    }
    
    renderer.render(scene, camera);
}

// Função para mostrar informações do nível na overlay
function showCampaignLevelInfo(levelInfo) {
    // Verifica se já existe uma overlay de nível e remove
    const existingOverlay = document.getElementById('level-overlay');
    if (existingOverlay) {
        document.body.removeChild(existingOverlay);
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
        document.body.removeChild(overlay);
        
        // Inicia o jogo
        isPaused = false;
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
