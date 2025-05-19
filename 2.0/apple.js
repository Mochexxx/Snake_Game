import * as THREE from 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.module.js';
import { getBoardCellCenter, generateBoardHitboxes } from './scene.js';

// apple.js
// Responsável por criar e posicionar a maçã

export function createApple(scene, snake, isAppleOnSnake, snakeBoard, hitboxes) {
    const appleGeometry = new THREE.SphereGeometry(1, 16, 16);
    const appleMaterial = new THREE.MeshStandardMaterial({ color: 0xff0000 });
    const apple = new THREE.Mesh(appleGeometry, appleMaterial);

    let x, z;
    do {
        x = Math.floor(Math.random() * 20);
        z = Math.floor(Math.random() * 20);
    } while (isAppleOnSnake(snake, x, z, snakeBoard));

    const { centerX: ax, centerZ: az } = hitboxes[x][z];
    apple.position.set(ax, 1, az);
    scene.add(apple);
    return apple;
}
