// human-model.js
// Cria um ser humano feito de formas geométricas simples como easter egg

import * as THREE from 'three';

/**
 * Cria um modelo de ser humano usando formas geométricas básicas
 * @returns {THREE.Group} Grupo contendo todas as partes do corpo
 */
export function createHumanModel() {
    const human = new THREE.Group();    // Cores para o ser humano (mais naturais para objeto ambiental)
    const skinColor = 0xFFDBB0; // Cor de pele
    const clothesColor = 0x8B4513; // Marrom terra para roupas (mais natural)
    const hairColor = 0x654321; // Marrom para cabelo
    const shoesColor = 0x2F4F4F; // Cinza escuro para sapatos
    
    // Material base para pele
    const skinMaterial = new THREE.MeshStandardMaterial({ 
        color: skinColor,
        roughness: 0.8,
        metalness: 0.0
    });
    
    // Material para roupas
    const clothesMaterial = new THREE.MeshStandardMaterial({ 
        color: clothesColor,
        roughness: 0.9,
        metalness: 0.0
    });
    
    // Material para cabelo
    const hairMaterial = new THREE.MeshStandardMaterial({ 
        color: hairColor,
        roughness: 0.8,
        metalness: 0.0
    });
    
    // Material para sapatos
    const shoesMaterial = new THREE.MeshStandardMaterial({ 
        color: shoesColor,
        roughness: 0.7,
        metalness: 0.1
    });
      // CABEÇA (esfera)
    const headGeometry = new THREE.SphereGeometry(0.6, 16, 16);
    const head = new THREE.Mesh(headGeometry, skinMaterial);
    head.position.set(0, 7.6, 0);
    head.castShadow = true;
    head.receiveShadow = true;
    human.add(head);
    head.receiveShadow = true;
    human.add(head);
    
    // CABELO (cone achatado)
    const hairGeometry = new THREE.ConeGeometry(0.6, 0.3, 8);
    const hair = new THREE.Mesh(hairGeometry, hairMaterial);
    hair.position.set(0, 8, 0);
    hair.castShadow = true;
    human.add(hair);
    
    // OLHOS (esferas pequenas)
    const eyeGeometry = new THREE.SphereGeometry(0.08, 8, 8);
    const eyeMaterial = new THREE.MeshStandardMaterial({ color: 0xFFFFFF });
    
    const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    leftEye.position.set(0.2, 7.6, 0.4);
    human.add(leftEye);
    
    const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    rightEye.position.set(-0.2, 7.6, 0.4);
    human.add(rightEye);
    
    // PUPILAS (esferas ainda menores)
    const pupilGeometry = new THREE.SphereGeometry(0.04, 6, 6);
    const pupilMaterial = new THREE.MeshStandardMaterial({ color: 0x000000 });
    
    const leftPupil = new THREE.Mesh(pupilGeometry, pupilMaterial);
    leftPupil.position.set(0.2, 7.6, 0.45);
    human.add(leftPupil);
    
    const rightPupil = new THREE.Mesh(pupilGeometry, pupilMaterial);
    rightPupil.position.set(-0.2, 7.6, 0.45);
    human.add(rightPupil);
    
    // NARIZ (cone pequeno)
    const noseGeometry = new THREE.ConeGeometry(0.06, 0.2, 6);
    const nose = new THREE.Mesh(noseGeometry, skinMaterial);
    nose.position.set(0, 7.4, 0.45);
    nose.rotation.x = Math.PI / 2;
    human.add(nose);
    
    // TORSO (caixa)
    const torsoGeometry = new THREE.BoxGeometry(1.2, 2.5, 0.8);
    const torso = new THREE.Mesh(torsoGeometry, clothesMaterial);
    torso.position.set(0, 5.5, 0);
    torso.castShadow = true;
    torso.receiveShadow = true;
    human.add(torso);
    
    // BRAÇOS (cilindros)
    const armGeometry = new THREE.CylinderGeometry(0.15, 0.15, 2, 8);
    
    const leftArm = new THREE.Mesh(armGeometry, clothesMaterial);
    leftArm.position.set(0.8, 5.5, 0);
    leftArm.rotation.z = Math.PI / 6; // Ligeiramente inclinado
    leftArm.castShadow = true;
    human.add(leftArm);
    
    const rightArm = new THREE.Mesh(armGeometry, clothesMaterial);
    rightArm.position.set(-0.8, 5.5, 0);
    rightArm.rotation.z = -Math.PI / 6; // Ligeiramente inclinado
    rightArm.castShadow = true;
    human.add(rightArm);
    
    // MÃOS (esferas pequenas)
    const handGeometry = new THREE.SphereGeometry(0.2, 8, 8);
    
    const leftHand = new THREE.Mesh(handGeometry, skinMaterial);
    leftHand.position.set(1.1, 4.3, 0);
    leftHand.castShadow = true;
    human.add(leftHand);
    
    const rightHand = new THREE.Mesh(handGeometry, skinMaterial);
    rightHand.position.set(-1.1, 4.3, 0);
    rightHand.castShadow = true;
    human.add(rightHand);
    
    // PERNAS (cilindros)
    const legGeometry = new THREE.CylinderGeometry(0.2, 0.2, 2.5, 8);
    
    const leftLeg = new THREE.Mesh(legGeometry, clothesMaterial);
    leftLeg.position.set(0.3, 2.8, 0);
    leftLeg.castShadow = true;
    human.add(leftLeg);
    
    const rightLeg = new THREE.Mesh(legGeometry, clothesMaterial);
    rightLeg.position.set(-0.3, 2.8, 0);
    rightLeg.castShadow = true;
    human.add(rightLeg);
    
    // PÉS/SAPATOS (caixas achatadas)
    const shoeGeometry = new THREE.BoxGeometry(0.6, 0.3, 0.8);
    
    const leftShoe = new THREE.Mesh(shoeGeometry, shoesMaterial);
    leftShoe.position.set(0.3, 1.4, 0.2);
    leftShoe.castShadow = true;
    human.add(leftShoe);
    
    const rightShoe = new THREE.Mesh(shoeGeometry, shoesMaterial);
    rightShoe.position.set(-0.3, 1.4, 0.2);
    rightShoe.castShadow = true;
    human.add(rightShoe);
      // Marca como objeto ambiental para facilitar remoção se necessário
    human.userData.isThemeModel = true;
    human.userData.themeType = 'ambient-human';
    
    return human;
}

/**
 * Adiciona o ser humano à cena como objeto ambiental raro (1 em 10 jogos) ou sempre em debug mode
 * @param {THREE.Scene} scene - A cena do jogo
 * @param {boolean} forceShow - Se true, força a aparição (modo debug)
 * @returns {THREE.Group|null} O modelo do ser humano adicionado ou null se não aparecer
 */
export function addHumanToScene(scene, forceShow = false) {
    // Debug mode: always show human at board center for testing
    if (forceShow) {
        const human = createHumanModel();
        human.position.set(20, 0, 20);
        human.scale.set(2, 2, 2);
        scene.add(human);
        console.log('🔧 DEBUG MODE: Human ambient object forced at center (20, 0, 20)');
        return human;
    }
    // Easter egg raro: 1 em 10 jogos (10% de chance) em modo normal
    const shouldShow = Math.random() < 0.1;
    if (!shouldShow) {
        console.log('Human ambient object: Not appearing this game (1/10 chance)');
        return null;
    }

    const human = createHumanModel();
    // Posições possíveis como objeto ambiental (fora do tabuleiro, mas no ambiente)
    const ambientPositions = [
        // Posições mais distantes, como objetos ambientais
        { x: -8, z: 15, rotation: Math.PI / 3 },     // Longe à esquerda
        { x: -6, z: 25, rotation: Math.PI / 4 },     // Esquerda mais ao fundo
        { x: 48, z: 12, rotation: -Math.PI / 3 },    // Longe à direita
        { x: 45, z: 28, rotation: -Math.PI / 4 },    // Direita mais ao fundo
        { x: 12, z: -8, rotation: Math.PI / 6 },     // Frente esquerda
        { x: 28, z: -6, rotation: -Math.PI / 6 },    // Frente direita
        { x: 15, z: 48, rotation: Math.PI },         // Fundo centro
        { x: 8, z: 45, rotation: 3 * Math.PI / 4 },  // Fundo esquerda
        { x: 32, z: 47, rotation: -3 * Math.PI / 4 }, // Fundo direita
        // Posições mais próximas mas ainda fora da área de jogo
        { x: -4, z: 35, rotation: Math.PI / 8 },     // Lateral esquerda longe
        { x: 44, z: 5, rotation: -Math.PI / 8 },     // Lateral direita próxima
        { x: 35, z: -4, rotation: Math.PI / 12 }     // Frente lateral
    ];
    const randomPosition = ambientPositions[Math.floor(Math.random() * ambientPositions.length)];

    human.position.set(randomPosition.x, 0, randomPosition.z);
    human.rotation.y = randomPosition.rotation;
    human.scale.set(1.2, 1.2, 1.2);
    scene.add(human);
    console.log(`🎉 RARE EASTER EGG: Human ambient object appeared at position (${randomPosition.x}, 0, ${randomPosition.z})! (1/10 chance)`);
    return human;
}

/**
 * Remove o ser humano da cena
 * @param {THREE.Scene} scene - A cena do jogo
 */
export function removeHumanFromScene(scene) {
    const humanToRemove = [];
      scene.traverse((child) => {
        if (child.userData && child.userData.themeType === 'ambient-human') {
            humanToRemove.push(child);
        }
    });
    
    humanToRemove.forEach(human => {
        scene.remove(human);
        // Limpar geometrias e materiais
        human.traverse((child) => {
            if (child.isMesh) {
                if (child.geometry) child.geometry.dispose();
                if (child.material) {
                    if (Array.isArray(child.material)) {
                        child.material.forEach(mat => mat.dispose());
                    } else {
                        child.material.dispose();
                    }
                }
            }
        });
    });
    
    console.log('Easter egg human removed from scene');
}

/**
 * Função de debug para testar o modelo humano em posição visível
 * @param {THREE.Scene} scene - A cena do jogo
 * @returns {THREE.Group} O modelo do ser humano adicionado para teste
 */
export function addTestHumanToScene(scene) {
    // Sempre mostra o humano em modo debug
    return addHumanToScene(scene, true);
}
