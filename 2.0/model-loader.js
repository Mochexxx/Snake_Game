import * as THREE from 'three';
import { GLTFLoader } from 'https://unpkg.com/three@0.128.0/examples/jsm/loaders/GLTFLoader.js';

// Cache for loaded models to avoid reloading
const modelCache = new Map();
const loader = new GLTFLoader();

// Load and cache a GLB model
export async function loadModel(path) {
    if (modelCache.has(path)) {
        return modelCache.get(path).clone();
    }
    
    return new Promise((resolve, reject) => {
        loader.load(
            path,
            (gltf) => {
                // Store the original model in cache
                modelCache.set(path, gltf.scene);
                // Return a clone for use
                resolve(gltf.scene.clone());
            },
            (progress) => {
                console.log('Loading progress:', (progress.loaded / progress.total * 100) + '%');
            },
            (error) => {
                console.error('Error loading model:', error);
                reject(error);
            }
        );
    });
}

// Create a wooden fence model instance
export async function createWoodenFenceModel() {
    try {
        const model = await loadModel('assets/models/Wooden fence.glb');
        
        // Configure the model
        model.traverse((child) => {
            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
                
                // Ensure proper material setup
                if (child.material) {
                    child.material.needsUpdate = true;
                }
            }
        });
        
        // Scale the fence much larger for better coverage and visual impact
        model.scale.set(1.5, 1.4, 1.5); // Significantly increased scale
        
        return model;
    } catch (error) {
        console.warn('Could not load wooden fence model, using fallback:', error);
        return createFallbackFence();
    }
}

// Fallback fence model if GLB loading fails
function createFallbackFence() {
    const group = new THREE.Group();
    
    // Create a simple wooden-looking fence with much bigger dimensions
    const fenceMaterial = new THREE.MeshStandardMaterial({
        color: 0x8B4513, // Saddle brown
        roughness: 0.8,
        metalness: 0.1
    });
    
    // Main fence panel - made much bigger
    const panel = new THREE.Mesh(
        new THREE.BoxGeometry(3.0, 2.8, 0.5), // Much larger size
        fenceMaterial
    );
    panel.position.set(0, 1.4, 0);
    group.add(panel);
    
    // Fence posts - made much bigger
    const postMaterial = new THREE.MeshStandardMaterial({
        color: 0x654321,
        roughness: 0.9,
        metalness: 0.05
    });
    
    const leftPost = new THREE.Mesh(
        new THREE.BoxGeometry(0.4, 3.2, 0.4), // Much larger size
        postMaterial
    );
    leftPost.position.set(-1.4, 1.6, 0);
    group.add(leftPost);
    
    const rightPost = new THREE.Mesh(
        new THREE.BoxGeometry(0.4, 3.2, 0.4), // Much larger size
        postMaterial
    );
    rightPost.position.set(1.4, 1.6, 0);
    group.add(rightPost);
    
    return group;
}

// Create a rock model instance
export async function createRockModel() {
    const { scene } = await loader.loadAsync('./assets/models/Rock.glb');
    return scene.clone(true);
}
