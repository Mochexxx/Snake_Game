// apple.js
// Responsável por criar e posicionar a maçã

export function createApple(scene, snake, isAppleOnSnake) {
    const appleGeometry = new THREE.SphereGeometry(0.5, 16, 16);
    const appleMaterial = new THREE.MeshStandardMaterial({ color: 0xff0000 });
    const apple = new THREE.Mesh(appleGeometry, appleMaterial);

    let x, z;
    do {
        x = Math.floor(Math.random() * 21) - 10;
        z = Math.floor(Math.random() * 21) - 10;
    } while (isAppleOnSnake(snake, x, z));

    apple.position.set(x, 0.5, z);
    scene.add(apple);
    return apple;
}
