# Sistema de Câmeras - Snake Game

## Implementação de Câmeras Perspectiva e Ortográfica

Este documento descreve a implementação do sistema de câmeras duplo no jogo Snake, que permite alternar entre câmera perspectiva e ortográfica durante o jogo.

## Características do Sistema

### 1. Câmera Perspectiva (Padrão)
- **Tipo**: THREE.PerspectiveCamera
- **Campo de Visão**: 45 graus
- **Características**: Visão realista com perspectiva, objetos distantes aparecem menores
- **Uso**: Ideal para uma experiência de jogo mais imersiva

### 2. Câmera Ortográfica
- **Tipo**: THREE.OrthographicCamera
- **Tamanho do Frustum**: 50 unidades
- **Características**: Visão sem perspectiva, todos os objetos mantêm o mesmo tamanho independente da distância
- **Uso**: Ideal para uma visão mais estratégica e técnica do jogo

## Controles

### Alternância entre Câmeras
- **Tecla**: `V` (durante o jogo)
- **Funcionalidade**: Alterna instantaneamente entre câmera perspectiva e ortográfica
- **Feedback Visual**: Exibe uma notificação temporária indicando o tipo de câmera ativo

## Funcionalidades

### 1. Animação Inicial
- Ambas as câmeras começam na posição da cobra (centro do tabuleiro)
- Animação suave de 3 segundos para a posição final de visualização
- Posição final: lado esquerdo do tabuleiro, altura elevada, olhando para o centro

### 2. Sincronização
- Ao alternar entre câmeras, a posição e rotação são preservadas
- A animação inicial funciona com ambos os tipos de câmera
- Sistema automático de atualização do aspect ratio no redimensionamento da janela

### 3. Integração com o Jogo
- O sistema funciona com todos os modos de jogo (Classic, Barriers, Obstacles, Campaign)
- Compatível com o sistema de pausa e overlays
- Mantém a funcionalidade de debug e controles existentes

## Arquivos Modificados

### scene.js
- Adicionadas funções para criação e gerenciamento de ambas as câmeras
- `createBothCameras()`: Cria ambas as câmeras inicialmente
- `getCurrentCamera()`: Retorna a câmera atualmente ativa
- `switchCameraType()`: Alterna entre tipos de câmera
- `updateCameraAspect()`: Atualiza aspect ratio para ambas as câmeras

### main.js
- Adicionado controle de tecla `V` para alternância
- Modificação na animação da câmera para suportar ambos os tipos
- Event listener para redimensionamento da janela
- Feedback visual ao alternar câmeras

## Benefícios

### Câmera Perspectiva
- ✅ Experiência mais imersiva
- ✅ Sensação de profundidade
- ✅ Visão mais realista do jogo

### Câmera Ortográfica
- ✅ Visão estratégica clara
- ✅ Distâncias precisas
- ✅ Melhor para jogadores que preferem visão "top-down" clássica
- ✅ Ideal para análise de padrões e planejamento

## Uso Recomendado

1. **Iniciantes**: Começar com câmera perspectiva para uma experiência mais familiar
2. **Jogadores Avançados**: Alternar para câmera ortográfica para jogabilidade mais estratégica
3. **Modo Campaign**: Usar câmera ortográfica para melhor visualização dos obstáculos
4. **Modo Classic**: Ambas funcionam bem, questão de preferência pessoal

## Código de Exemplo

```javascript
// Alternar programaticamente (se necessário)
camera = Scene.switchCameraType('orthographic');
// ou
camera = Scene.switchCameraType('perspective');

// Verificar tipo atual
const currentType = Scene.getCameraType();
console.log('Câmera atual:', currentType);
```

## Compatibilidade

- ✅ Todos os modos de jogo
- ✅ Sistema de animação da cobra
- ✅ Modo debug
- ✅ Overlays e tutoriais
- ✅ Controles touch e teclado
- ✅ Redimensionamento de janela
- ✅ Sistema de pausa

---

**Nota**: A implementação mantém total compatibilidade com o sistema existente, adicionando apenas funcionalidades sem quebrar código anterior.
