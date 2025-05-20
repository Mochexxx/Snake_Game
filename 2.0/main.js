// main.js
import * as Scene from './scene.js';
import { createSnake, moveSnake, isAppleOnSnake, debugCollisions } from './Snake.js';
import { createApple } from './apple.js';
import { createObstacles, checkObstacleCollision, removeObstacles } from './obstacles.js';
import { createBarriers, checkBarrierCollision, removeBarriers, animateBarriers } from './barriers.js';
import { createHitboxVisualization, toggleHitboxVisualization, toggleDebugMode } from './debug.js';
import { showTutorial } from './tutorial.js';
import { addControlsHelpButton } from './game-controls.js';
import { setupTouchControls } from './touch-controls.js';
import { checkGameIntegrity } from './integrity-checker.js';
import { createPerspectiveCamera, createOrthographicCamera, createSideCamera,switchCamera, cameraMode } from './scene.js';

// Variáveis globais
let scene, camera, renderer;
let snake = [], snakeHead, snakeDirection, snakeBoard;
let apple = null;
let obstacles = [];
let barriers = [];
let hitboxVisuals = [];
let isPaused = true;
let gameRunning = false;
let lastMoveTime = 0, moveInterval = 250;
let score = 0;
let highscore = localStorage.getItem('highscore') ? parseInt(localStorage.getItem('highscore')) : 0;
let gameMode = 'classic'; // classic, barriers, obstacles
let hitboxes;
let debugMode = false; // Flag para ativar/desativar o modo de debug


// Rastreia quais tutoriais já foram exibidos nesta sessão
const tutorialsShown = {
    'classic': false,
    'barriers': false,
    'obstacles': false
};

// Mode selection logic
const playButton = document.getElementById('playButton');
const modeClassic = document.getElementById('modeClassic');
const modeBarriers = document.getElementById('modeBarriers');
const modeObstacles = document.getElementById('modeObstacles');
const startMenuButton = document.getElementById('startMenuButton');
const mainMenu = document.getElementById('mainMenu');
const startScreen = document.getElementById('startScreen');

// Mostra o menu de modos ao clicar em "Jogar" do menu principal
startMenuButton.addEventListener('click', () => {
    mainMenu.style.display = 'none';
    startScreen.style.display = '';
});

// Função para selecionar modo
function selectMode(mode) {
    // Verifica se houve mudança no modo
    const previousMode = gameMode;
    gameMode = mode;
    
    playButton.style.display = '';
    
    // Remove classe 'active' de todos os botões
    [modeClassic, modeBarriers, modeObstacles].forEach(btn => btn.classList.remove('active'));
    
    // Ajusta o texto do modo e destaque visual
    let modeText = '';
    if (mode === 'classic') {
        modeClassic.classList.add('active');
        modeText = 'Classic (Teleport)';
    } else if (mode === 'barriers') {
        modeBarriers.classList.add('active');
        modeText = 'Barriers';
    } else if (mode === 'obstacles') {
        modeObstacles.classList.add('active');
        modeText = 'Obstacles';
    }
    
    // Atualiza o texto do modo atual
    const currentModeElement = document.getElementById('currentMode');
    if (currentModeElement) {
        currentModeElement.textContent = 'Mode: ' + modeText;
    }

}

 // Liga os botões de modo à função selectMode
    modeClassic.addEventListener('click', () => selectMode('classic'));
    modeBarriers.addEventListener('click', () => selectMode('barriers'));
    modeObstacles.addEventListener('click', () => selectMode('obstacles'));

    // Botão "Jogar" inicia o jogo
    playButton.addEventListener('click', () => {
        // Esconde o menu de modos e mostra o placar
        startScreen.style.display = 'none';
        document.getElementById('scoreBoard').style.display = '';
        gameRunning = true;
        startGame();

        // Mostra tutorial se necessário
        isPaused = true;
        if (!tutorialsShown[gameMode]) {
            showTutorial(gameMode, () => {
                isPaused = false;
                tutorialsShown[gameMode] = true;
            });
        } else {
            isPaused = false;
        }
    
});


window.onload = function() {
    document.getElementById('mainMenu').style.display = 'flex';
    document.getElementById('startScreen').style.display = 'none';
};

document.getElementById('startMenuButton').addEventListener('click', function () {
    document.getElementById('mainMenu').style.display = 'none';
    document.getElementById('startScreen').style.display = 'flex';
});

//usar o event listener para alternar entre câmeras
document.addEventListener('keydown', (e) => {
    if (e.key.toLowerCase() === 'c') {
        camera = switchCamera(camera, renderer, snake);
    }
});

// Função para esconder a tela de início e iniciar o jogo
playButton.addEventListener('click', function () {
    document.getElementById('startScreen').style.display = 'none';
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

// Função para configurar os controles da cobra
function setupControls() {
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
                }
                break;
            case 'b': // Tecla B para ativar/desativar modo debug (não usa mais 'D' para evitar conflito com movimento)
                debugMode = !debugMode;
                toggleDebugMode(debugMode);
                break;
            case 'p': // Tecla P como alternativa para pausar
                if (gameRunning) {
                    isPaused = !isPaused;
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

    camera = createPerspectiveCamera();
    
    // Atualiza a interface
    document.getElementById('score').textContent = 'Score: 0';
    document.getElementById('highscore').textContent = 'Highscore: ' + highscore;
    
    // Atualiza o texto do modo
    let modeText = '';
    if (gameMode === 'classic') modeText = 'Classic (Teleport)';
    else if (gameMode === 'barriers') modeText = 'Barriers';
    else if (gameMode === 'obstacles') modeText = 'Obstacles';
    document.getElementById('currentMode').textContent = 'Mode: ' + modeText;
    
    // Remove o renderer antigo se existir
    if (renderer) {
        document.body.removeChild(renderer.domElement);
    }

    // Cria a nova cena
    scene = Scene.createScene();
    camera = createPerspectiveCamera();
    renderer = Scene.createRenderer();
    
    // Adiciona elementos na cena
    Scene.addLights(scene);
    Scene.addBoard(scene);
    
    // Gera a matriz de hitboxes para o tabuleiro
    hitboxes = Scene.generateBoardHitboxes();

    // Cria a cobra
    const snakeObj = createSnake(scene);
    snake = snakeObj.snake;
    snakeHead = snakeObj.snakeHead;
    snakeDirection = snakeObj.snakeDirection;
    snakeBoard = snakeObj.snakeBoard;

    // Criar maçã
    apple = createApple(scene, snake, (s, x, z) => isAppleOnSnake(s, x, z, snakeBoard), snakeBoard, hitboxes);
    
    // Criar barreiras se o modo for "barriers"
    if (gameMode === 'barriers') {
        barriers = createBarriers(scene, snakeBoard, hitboxes);
    }
    
    // Criar obstáculos se o modo for "obstacles"
    if (gameMode === 'obstacles') {
        obstacles = createObstacles(scene, snake, snakeBoard, hitboxes, 10); // 10 é o número de obstáculos
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
        });
    } else {
        isPaused = false;
    }
});

// Animação
function animate(time) {
    requestAnimationFrame(animate);

    // Renderiza a cena com a câmara atual
    renderer.render(scene, camera);

      // Anima os obstáculos mesmo se o jogo estiver pausado
    if (gameMode === 'obstacles' && obstacles.length > 0) {
        // Importa a função de animação dos obstáculos
        import('./obstacles.js').then(module => {
            module.animateObstacles(obstacles, time);
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
                    color: 0x00ff00, 
                    roughness: 0.5,
                    metalness: 0.2,
                    flatShading: false
                });
                
                // Cria um novo segmento visual com geometria e material consistentes
                const newSegment = new THREE.Mesh(
                    new THREE.BoxGeometry(2, 2, 2),  // Tamanho padrão de 2x2x2
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
                    console.log("PARABÉNS! Você preencheu o tabuleiro!");
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
                            obstacle.boardPosition.x === appleX && obstacle.boardPosition.z === appleZ)) {
                            validPosition = false;
                        }
                    }
                    
                    // Verifica se a maçã não está em uma barreira (modo barreiras)
                    if (gameMode === 'barriers') {
                        // Verifica colisão com barreiras complexas
                        const complexCollision = barriers.some(barrier => {
                            if (barrier.type === 'complex') {
                                return barrier.boardPosition.x === appleX && barrier.boardPosition.z === appleZ;
                            }
                            return false;
                        });
                        
                        // Verifica colisão com barreiras de limite (não deveria acontecer, mas por segurança)
                        const boundaryCollision = barriers.some(barrier => {
                            if (barrier.type === 'boundary') {
                                return barrier.boardPositions.some(pos => pos.x === appleX && pos.z === appleZ);
                            }
                            return false;
                        });
                        
                        if (complexCollision || boundaryCollision) {
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
            },
            () => {
                // Aumenta o score e atualiza o placar
                score += 10;
                document.getElementById('score').textContent = 'Score: ' + score;
                
                // Aumenta a velocidade do jogo ligeiramente a cada ponto
                if (moveInterval > 50) {
                    moveInterval = Math.max(50, moveInterval - 2);
                }
            },            snakeBoard,
            hitboxes,
            obstacles,
            barriers
        );
        lastMoveTime = time;
    }
    
    renderer.render(scene, camera);
}
