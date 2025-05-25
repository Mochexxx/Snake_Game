// test-campaign.js
// Este arquivo pode ser incluído para testar a funcionalidade da campanha.
// Para usar, abra o console do navegador e execute:
// loadScript('test-campaign.js')
//
// NOVO: Este arquivo agora também inclui testes para o modo debug da campanha.
// Para testar o modo debug, execute:
// testDebugMode();

// Função auxiliar para carregar o script
function loadScript(url) {
    const script = document.createElement('script');
    script.src = url;
    document.head.appendChild(script);
    return new Promise((resolve, reject) => {
        script.onload = resolve;
        script.onerror = reject;
    });
}

// Testes para a funcionalidade da campanha
(function() {
    console.log("===== TESTE DO MODO CAMPANHA =====");
    
    // Verifica se o módulo campaign-menu está disponível
    if (typeof showCampaignMenu !== 'function') {
        console.error("❌ Erro: O módulo campaign-menu.js não está carregado corretamente");
    } else {
        console.log("✅ Módulo campaign-menu.js carregado");
    }
    
    // Verifica a disponibilidade de funções da campanha
    if (typeof loadCampaignProgress !== 'function') {
        console.error("❌ Erro: função loadCampaignProgress não encontrada");
    } else {
        console.log("✅ Função loadCampaignProgress disponível");
    }

    if (typeof markLevelCompleted !== 'function') {
        console.error("❌ Erro: função markLevelCompleted não encontrada");
    } else {
        console.log("✅ Função markLevelCompleted disponível");
    }

    if (typeof setCurrentLevel !== 'function') {
        console.error("❌ Erro: função setCurrentLevel não encontrada");
    } else {
        console.log("✅ Função setCurrentLevel disponível");
    }
    
    // Teste básico de localStorage
    try {
        localStorage.setItem('testCampaign', 'test');
        localStorage.removeItem('testCampaign');
        console.log("✅ LocalStorage funcionando corretamente");
    } catch (e) {
        console.error("❌ Erro ao acessar localStorage:", e);
    }
    
    // Teste de funções da campanha
    console.log("\n===== TESTES DE CAMPANHA =====");
    console.log("Progresso atual:", loadCampaignProgress());
    console.log("Nível 1 desbloqueado?", isLevelUnlocked(1));
    console.log("Nível 2 desbloqueado?", isLevelUnlocked(2));
    console.log("Nível 1 completado?", isLevelCompleted(1));
    
    // Botão para abrir o menu da campanha
    const testButton = document.createElement('button');
    testButton.textContent = "Testar Menu Campanha";
    testButton.style.position = "fixed";
    testButton.style.top = "10px";
    testButton.style.right = "10px";
    testButton.style.zIndex = "1000";
    testButton.style.padding = "10px";
    testButton.style.backgroundColor = "#3498db";
    testButton.style.color = "#fff";
    testButton.style.border = "none";
    testButton.style.borderRadius = "5px";
    testButton.style.cursor = "pointer";
    
    testButton.onclick = function() {
        showCampaignMenu(levelNumber => {
            console.log("Nível selecionado:", levelNumber);
            // Apenas para teste, marca o nível como completado
            markLevelCompleted(levelNumber);
            console.log("Progresso após completar:", loadCampaignProgress());
        });
    };
    
    document.body.appendChild(testButton);
    
    // Adiciona função para testar o modo debug
    window.testDebugMode = function() {
        console.log("===== TESTE DO MODO DEBUG NA CAMPANHA =====");
        
        // Verifica se o debugMode existe
        console.log("Estado atual do modo debug:", window.debugMode ? "ATIVADO" : "DESATIVADO");
        
        // Teste 1: Ativar modo debug
        window.debugMode = true;
        console.log("✅ Modo debug ativado manualmente");
        
        // Teste 2: Verificar se todos os níveis estão desbloqueados com debug
        const progress = loadCampaignProgress();
        console.log("Progresso atual:", progress);
        
        // Testar a função isLevelUnlocked com debugMode ativado
        const testLevel = progress.unlockedLevels + 2; // Um nível que normalmente estaria bloqueado
        console.log(`Testando acesso ao Nível ${testLevel} (normalmente bloqueado):`);
        const isUnlocked = isLevelUnlocked(testLevel);
        console.log(isUnlocked ? "✅ Nível desbloqueado pelo modo debug!" : "❌ Nível não desbloqueado (erro no modo debug)");
        
        // Teste 3: Testar se podemos definir um nível normalmente bloqueado como atual
        console.log(`Tentando definir o Nível ${testLevel} como atual:`);
        const setResult = setCurrentLevel(testLevel);
        console.log(setResult ? "✅ Nível definido com sucesso pelo modo debug!" : "❌ Falha ao definir o nível (erro no modo debug)");
        
        // Teste 4: Abrir o menu de campanha com debug ativado
        console.log("Abrindo menu de campanha com modo debug ativado...");
        showCampaignMenu(levelNumber => {
            console.log("Nível selecionado no modo debug:", levelNumber);
        });
        
        console.log("Verifique visualmente se os níveis bloqueados estão sendo exibidos com estilo de debug (borda roxa)");
        console.log("===== FIM DO TESTE DO MODO DEBUG =====");
    };
    
    // Add hitbox testing function for campaign mode
    window.testCampaignHitboxes = function() {
        console.log("===== TESTE DE HITBOXES DA CAMPANHA =====");
        
        // Check if campaign barriers exist
        if (typeof window.barriers === 'undefined' || !window.barriers) {
            console.error("❌ Barreiras da campanha não encontradas");
            return;
        }
        
        console.log("✅ Barreiras da campanha encontradas:", window.barriers.length);
        
        // Test boundary barrier hitboxes
        const boundaryBarriers = window.barriers.filter(b => b.type === 'boundary');
        console.log("Barreiras de limite encontradas:", boundaryBarriers.length);
        
        boundaryBarriers.forEach((barrier, index) => {
            console.log(`Barreira de limite ${index + 1}:`, {
                position: barrier.position,
                boardPositions: barrier.boardPositions ? barrier.boardPositions.length : 0,
                hitboxes: barrier.hitboxes ? barrier.hitboxes.length : 0
            });
        });
        
        // Test complex barrier hitboxes
        const complexBarriers = window.barriers.filter(b => b.type === 'complex');
        console.log("Barreiras complexas encontradas:", complexBarriers.length);
        
        complexBarriers.forEach((barrier, index) => {
            console.log(`Barreira complexa ${index + 1}:`, {
                boardPosition: barrier.boardPosition,
                hitbox: barrier.hitbox,
                centerX: barrier.centerX,
                centerZ: barrier.centerZ
            });
        });
        
        // Test collision detection
        if (typeof window.checkCampaignBarrierCollision === 'function') {
            console.log("✅ Função de detecção de colisão encontrada");
            
            // Test some collision points
            const testPoints = [
                { x: -1, z: 10 }, // Should hit west wall
                { x: 20, z: 10 }, // Should hit east wall
                { x: 10, z: -1 }, // Should hit north wall
                { x: 10, z: 20 }  // Should hit south wall
            ];
            
            testPoints.forEach(point => {
                const collision = window.checkCampaignBarrierCollision(point.x, point.z, window.barriers);
                console.log(`Teste de colisão em (${point.x}, ${point.z}):`, collision ? "COLISÃO" : "LIVRE");
            });
        } else {
            console.error("❌ Função de detecção de colisão não encontrada");
        }
        
        console.log("===== FIM DO TESTE DE HITBOXES =====");
    };
    
    console.log("✅ Botão de teste adicionado - Clique para testar o menu da campanha");
})();
