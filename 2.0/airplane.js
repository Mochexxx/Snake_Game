import * as THREE from 'three';

export class GameAirplane {
    constructor(scene) {
        this.scene = scene;
        this.airplaneGroup = new THREE.Group();
        this.position = {
            x: -90,    // Começa mais à esquerda
            y: 25,     // Altura
            z: -5      // Posição frontal
        };
        this.createAirplane();
        this.addToScene();
    }

    createAirplaneTextures() {
        // Textura para o corpo do avião (padrão metálico vermelho)
        const bodyCanvas = document.createElement('canvas');
        const bodyCtx = bodyCanvas.getContext('2d');
        bodyCanvas.width = 256;
        bodyCanvas.height = 256;
        
        // Gradiente vermelho metálico
        const bodyGradient = bodyCtx.createLinearGradient(0, 0, 256, 256);
        bodyGradient.addColorStop(0, '#ff0000');
        bodyGradient.addColorStop(0.5, '#cc0000');
        bodyGradient.addColorStop(1, '#ff0000');
        bodyCtx.fillStyle = bodyGradient;
        bodyCtx.fillRect(0, 0, 256, 256);
        
        // Adicionar detalhes metálicos
        bodyCtx.strokeStyle = '#ffffff';
        bodyCtx.globalAlpha = 0.1;
        for(let i = 0; i < 256; i += 16) {
            bodyCtx.beginPath();
            bodyCtx.moveTo(0, i);
            bodyCtx.lineTo(256, i);
            bodyCtx.stroke();
        }

        // Textura para as asas (padrão amarelo com listras)
        const wingCanvas = document.createElement('canvas');
        const wingCtx = wingCanvas.getContext('2d');
        wingCanvas.width = 256;
        wingCanvas.height = 256;
        
        wingCtx.fillStyle = '#ffcc00';
        wingCtx.fillRect(0, 0, 256, 256);
        
        wingCtx.fillStyle = '#ffd700';
        for(let i = 0; i < 256; i += 32) {
            wingCtx.fillRect(0, i, 256, 8);
        }

        return {
            bodyTexture: new THREE.CanvasTexture(bodyCanvas),
            wingTexture: new THREE.CanvasTexture(wingCanvas)
        };
    }

    createAirplane() {
        const textures = this.createAirplaneTextures();

        // Airplane body with texture
        const bodyGeometry = new THREE.BoxGeometry(2, 0.7, 0.7);
        const bodyMaterial = new THREE.MeshStandardMaterial({ 
            map: textures.bodyTexture,
            metalness: 0.7,
            roughness: 0.3
        });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);

        // Wings with texture
        const wingGeometry = new THREE.BoxGeometry(1.5, 0.1, 3);
        const wingMaterial = new THREE.MeshStandardMaterial({ 
            map: textures.wingTexture,
            metalness: 0.3,
            roughness: 0.7
        });
        
        const upperWing = new THREE.Mesh(wingGeometry, wingMaterial);
        upperWing.position.y = 0.4;
        
        const lowerWing = new THREE.Mesh(wingGeometry, wingMaterial);
        lowerWing.position.y = -0.2;

        // Banner
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.width = 512;
        canvas.height = 128;

        context.fillStyle = '#ffffff';
        context.fillRect(0, 0, canvas.width, canvas.height);

        context.font = 'bold 60px Arial';
        context.textAlign = 'center';
        context.fillStyle = '#000000';
        context.fillText('Snake 3D', canvas.width/2, canvas.height/2 + 20);

        const bannerTexture = new THREE.CanvasTexture(canvas);
        const bannerMaterial = new THREE.MeshStandardMaterial({ 
            map: bannerTexture,
            side: THREE.DoubleSide
        });
        const bannerGeometry = new THREE.PlaneGeometry(4, 1);
        const banner = new THREE.Mesh(bannerGeometry, bannerMaterial);
        banner.position.x = -3;
        banner.position.y = -0.5;

        // Rotações para colocar o avião na horizontal
        //this.airplaneGroup.rotation.y = Math.PI / 3;  // Vira para a direita
        this.airplaneGroup.rotation.x = Math.PI / 3;  // Nivela horizontalmente
        
        // Add all parts to the airplane group
        this.airplaneGroup.add(body);
        this.airplaneGroup.add(upperWing);
        this.airplaneGroup.add(lowerWing);
        this.airplaneGroup.add(banner);

        // Ajustar a posição e rotação do banner
        banner.rotation.x = -Math.PI / 2;  // Rotação para manter o banner na vertical
        banner.position.set(0, -3, 0);     // Posiciona o banner abaixo do avião
    }

    addToScene() {
        // Posicionar o avião na frente da grid
        this.airplaneGroup.position.set(
            this.position.x,
            this.position.y,
            this.position.z
        );
        this.scene.add(this.airplaneGroup);
    }

    update() {
        // Mover o avião da esquerda para a direita
        this.airplaneGroup.position.x += 0.2;
        
        // Resetar posição quando chegar bem à direita
        if (this.airplaneGroup.position.x > 60) {
            this.airplaneGroup.position.x = -60;
        }

        // Pequenas variações para movimento mais natural
        const time = Date.now() * 0.001;
        this.airplaneGroup.position.y = 25 + Math.sin(time) * 0.5;
        this.airplaneGroup.position.z = -5 + Math.sin(time * 0.5) * 2;

        // Wave effect no banner
        const banner = this.airplaneGroup.children[3];
        if (banner) {
            banner.position.z = Math.sin(time * 2) * 0.1; // Movimento ondulante vertical do banner
        }
    }
}
