// board-theme-manager.js
// Manages board theme selection and 3D model integration

import * as THREE from 'three';
import { GLTFLoader } from 'https://unpkg.com/three@0.128.0/examples/jsm/loaders/GLTFLoader.js';
import { loadModel } from './model-loader.js';
import { setTheme, updateSceneTheme, getThemeColors } from './scene.js';

// Board theme configuration
const BOARD_THEMES = {
    classic: {
        name: 'Classic Farm',
        folder: 'quinta',
        colors: {
            floor: 0x90EE90,      // Light green
            background: 0x87CEEB,  // Sky blue
            border: 0x8B4513,     // Saddle brown
            gridLines: 0x228B22   // Forest green
        },
        models: {
            decoration: ['Big Barn.glb', 'Cow.glb', 'silo.glb'],
            landscape: ['barn_paisagem.glb', 'silo_paisagem.glb', 'paisagem.glb'],
            obstacle: ['Hay.glb', 'hay_obstaculo.glb'],
            barrier: 'barreira_madeira.glb'
        }
    },
    desert: {
        name: 'Desert Oasis',
        folder: 'desert',
        colors: {
            floor: 0xDEB887,      // Burlywood
            background: 0xFFD700,  // Gold
            border: 0x8B4513,     // Saddle brown
            gridLines: 0xCD853F   // Peru
        },
        models: {
            decoration: ['Camel.glb'],
            landscape: ['Camelo_paisagem.glb'],
            obstacle: ['Cactus.glb', 'cacto_obstaculo.glb'],
            barrier: 'barreira_deserto.glb'
        }
    },
    forest: {
        name: 'Enchanted Forest',
        folder: 'floresta',
        colors: {
            floor: 0x228B22,      // Forest green
            background: 0x90EE90,  // Light green
            border: 0x8B4513,     // Saddle brown
            gridLines: 0x006400   // Dark green
        },
        models: {
            decoration: [],
            landscape: [],
            obstacle: [],
            barrier: 'barreira_floresta.glb'
        }
    },
    snow: {
        name: 'Winter Wonderland',
        folder: 'neve',
        colors: {
            floor: 0xF0F8FF,      // Alice blue
            background: 0xE6E6FA,  // Lavender
            border: 0x4682B4,     // Steel blue
            gridLines: 0x191970   // Midnight blue
        },
        models: {
            decoration: ['Snowman.glb', 'Igloo.glb', 'Pine Tree with Snow.glb'],
            landscape: ['Snowman_paisagem.glb', 'Igloo_paisagem.glb'],
            obstacle: ['Bush Snow.glb', 'bush_obstaculo.glb', 'avore_neve_obstaculo.glb'],
            barrier: 'barreira_neve.glb'
        }
    }
};

// Current board theme
let currentBoardTheme = 'classic';
let loadedThemeModels = new Map();

// Initialize board theme manager
export function initBoardThemeManager() {
    // Load saved theme from localStorage
    const savedTheme = localStorage.getItem('selectedBoardTheme');
    if (savedTheme && BOARD_THEMES[savedTheme]) {
        currentBoardTheme = savedTheme;
    }
    
    console.log('Board theme manager initialized with theme:', currentBoardTheme);
}

// Get current board theme
export function getCurrentBoardTheme() {
    return currentBoardTheme;
}

// Set board theme
export function setBoardTheme(themeName) {
    if (BOARD_THEMES[themeName]) {
        currentBoardTheme = themeName;
        localStorage.setItem('selectedBoardTheme', themeName);
        console.log('Board theme set to:', themeName);
    } else {
        console.error('Invalid board theme:', themeName);
    }
}

// Get theme configuration
export function getThemeConfig(themeName) {
    return BOARD_THEMES[themeName] || BOARD_THEMES.classic;
}

// Get all available themes
export function getAvailableThemes() {
    return Object.keys(BOARD_THEMES);
}

// Clear previously loaded theme models from scene
function clearThemeModels(scene) {
    const modelsToRemove = [];
    
    scene.traverse((child) => {
        if (child.userData && child.userData.isThemeModel) {
            modelsToRemove.push(child);
        }
    });
    
    modelsToRemove.forEach(model => {
        scene.remove(model);
        if (model.geometry) model.geometry.dispose();
        if (model.material) {
            if (Array.isArray(model.material)) {
                model.material.forEach(mat => mat.dispose());
            } else {
                model.material.dispose();
            }
        }
    });
    
    console.log('Cleared', modelsToRemove.length, 'theme models from scene');
}

// Load theme decoration models
async function loadThemeDecorations(scene, themeConfig) {
    const decorations = [];
    const basePath = `assets/temas_models/${themeConfig.folder}/`;
    
    // Load decoration models
    for (const modelFile of themeConfig.models.decoration) {
        try {
            const model = await loadModel(basePath + modelFile);
            if (model) {
                // Mark as theme model for cleanup
                model.userData.isThemeModel = true;
                model.userData.themeType = 'decoration';
                
                // Position decorations around the board perimeter
                const angle = Math.random() * Math.PI * 2;
                const radius = 35 + Math.random() * 15; // Random distance from center
                model.position.set(
                    20 + Math.cos(angle) * radius,
                    0,
                    20 + Math.sin(angle) * radius
                );
                
                // Random rotation
                model.rotation.y = Math.random() * Math.PI * 2;
                
                // Appropriate scale
                const scale = 0.8 + Math.random() * 0.4; // Random scale between 0.8 and 1.2
                model.scale.set(scale, scale, scale);
                
                scene.add(model);
                decorations.push(model);
                console.log('Loaded decoration model:', modelFile);
            }
        } catch (error) {
            console.warn('Failed to load decoration model:', modelFile, error);
        }
    }
    
    return decorations;
}

// Load theme landscape models
async function loadThemeLandscape(scene, themeConfig) {
    const landscapes = [];
    const basePath = `assets/temas_models/${themeConfig.folder}/`;
    
    // Load landscape models
    for (const modelFile of themeConfig.models.landscape) {
        try {
            const model = await loadModel(basePath + modelFile);
            if (model) {
                // Mark as theme model for cleanup
                model.userData.isThemeModel = true;
                model.userData.themeType = 'landscape';
                
                // Position landscapes further from the board
                const angle = Math.random() * Math.PI * 2;
                const radius = 60 + Math.random() * 40; // Further distance from center
                model.position.set(
                    20 + Math.cos(angle) * radius,
                    0,
                    20 + Math.sin(angle) * radius
                );
                
                // Random rotation
                model.rotation.y = Math.random() * Math.PI * 2;
                
                // Larger scale for landscape elements
                const scale = 1.0 + Math.random() * 0.5; // Random scale between 1.0 and 1.5
                model.scale.set(scale, scale, scale);
                
                scene.add(model);
                landscapes.push(model);
                console.log('Loaded landscape model:', modelFile);
            }
        } catch (error) {
            console.warn('Failed to load landscape model:', modelFile, error);
        }
    }
    
    return landscapes;
}

// Apply board theme colors to scene
function applyThemeColors(scene, themeConfig) {
    // Update scene colors using the scene module's function
    setTheme('green'); // Use base green theme structure but override colors
    
    // Override colors with theme-specific colors
    scene.traverse((object) => {
        // Update floor/terrain colors
        if ((object.name === "floor" || object.name === "terrain") && object.material) {
            object.material.color.set(themeConfig.colors.floor);
        }
        
        // Update grid line colors
        if (object.name === "gridLines" && object.material) {
            object.material.color.set(themeConfig.colors.gridLines);
        }
        
        // Update border colors if they exist
        if (object.name === "borderGlow" && object.material && object.material.uniforms) {
            if (object.material.uniforms.color) {
                object.material.uniforms.color.value.set(themeConfig.colors.border);
            }
        }
        
        // Update fog color
        if (scene.fog) {
            scene.fog.color.set(themeConfig.colors.background);
        }
    });
    
    console.log('Applied theme colors for:', themeConfig.name);
}

// Apply complete board theme to scene
export async function applyBoardThemeToScene(scene) {
    console.log('Applying board theme to scene:', currentBoardTheme);
    
    const themeConfig = getThemeConfig(currentBoardTheme);
    
    // Clear any previously loaded theme models
    clearThemeModels(scene);
    
    // Apply theme colors
    applyThemeColors(scene, themeConfig);
    
    try {
        // Load theme decorations
        const decorations = await loadThemeDecorations(scene, themeConfig);
        
        // Load theme landscapes
        const landscapes = await loadThemeLandscape(scene, themeConfig);
        
        // Store loaded models for this theme
        loadedThemeModels.set(currentBoardTheme, {
            decorations,
            landscapes,
            config: themeConfig
        });
        
        console.log(`Successfully applied ${themeConfig.name} theme with ${decorations.length} decorations and ${landscapes.length} landscapes`);
        
        // Store the theme globally for other modules
        window.currentBoardTheme = currentBoardTheme;
        
        return true;
    } catch (error) {
        console.error('Error applying board theme:', error);
        return false;
    }
}

// Get barrier model for current theme (for game mode barriers)
export function getThemeBarrierModel() {
    return new Promise((resolve, reject) => {
        const gltfLoader = new GLTFLoader();
        const currentTheme = getCurrentBoardTheme();
        const themeConfig = getThemeConfig(currentTheme);
        const basePath = `assets/temas_models/${themeConfig.folder}/`;
        
        console.log(`Getting barrier model for theme: ${currentTheme}`);
        
        // Map themes to their specific barrier model files
        const themeBarrierFiles = {
            'forest': 'assets/barreira_floresta.glb',
            'farm': 'assets/barreira_madeira.glb',
            'desert': 'assets/barreira_deserto.glb',
            'snow': 'assets/barreira_neve.glb',
            'classic': 'assets/barreira_madeira.glb' // Default to wooden barrier
        };
        
        // Use the correct path based on theme configuration if available
        if (themeConfig.models.barrier) {
            try {
                console.log(`Loading theme barrier: ${basePath}${themeConfig.models.barrier} for theme ${currentTheme}`);
                
                // Try to load the theme-specific barrier from themes folder
                gltfLoader.load(
                    basePath + themeConfig.models.barrier,
                    (gltf) => {
                        const barrier = gltf.scene;
                        
                        // Configure the model
                        barrier.traverse(child => {
                            if (child.isMesh) {
                                child.castShadow = true;
                                child.receiveShadow = true;
                            }
                        });                        // Adjust scale based on barrier type (can be customized per theme)
                        let scaleMultiplier = 1.0;
                        if (themeConfig.models.barrier.includes('neve')) {
                            scaleMultiplier = 12.0; // Snow barriers much bigger
                        } else if (themeConfig.models.barrier.includes('deserto')) {
                            scaleMultiplier = 3.3; // Desert barriers 3x bigger
                        } else if (themeConfig.models.barrier.includes('floresta')) {
                            scaleMultiplier = 3.0; // Forest barriers 3x bigger
                        } else if (themeConfig.models.barrier.includes('madeira')) {
                            scaleMultiplier = 3.9; // Farm barriers 3x bigger
                        }
                        
                        // Apply the appropriate scale
                        barrier.scale.set(
                            barrier.scale.x * scaleMultiplier,
                            barrier.scale.y * scaleMultiplier,
                            barrier.scale.z * scaleMultiplier
                        );
                        
                        // Mark the model as a theme barrier
                        barrier.userData.isThemeModel = true;
                        barrier.userData.themeType = 'barrier';
                        barrier.userData.themeBarrier = true;
                        barrier.userData.themeName = currentTheme;
                        
                        resolve(barrier);
                    },
                    (xhr) => {
                        // Progress callback
                        console.log(`Loading barrier model (${currentTheme}): ${(xhr.loaded / xhr.total * 100).toFixed(2)}%`);
                    },
                    (error) => {
                        console.warn(`Could not load themed barrier from folder: ${error}. Trying fallback path.`);
                        
                        // Try the fallback path if folder-specific path fails
                        const barrierFile = themeBarrierFiles[currentTheme] || themeBarrierFiles['classic'];
                        gltfLoader.load(
                            barrierFile,
                            (gltf) => {
                                const barrier = gltf.scene;
                                
                                // Configure the model
                                barrier.traverse(child => {
                                    if (child.isMesh) {
                                        child.castShadow = true;
                                        child.receiveShadow = true;
                                    }
                                });
                                  // Appropriate scale for barrier models - much bigger
                                barrier.scale.set(1.95, 2.25, 1.95); // Much bigger default scaling
                                
                                // Mark the model as a theme barrier
                                barrier.userData.themeBarrier = true;
                                barrier.userData.themeName = currentTheme;
                                
                                resolve(barrier);
                            },
                            null,
                            (secondError) => {
                                // Both paths failed, use wooden fence fallback
                                console.warn('Could not load either barrier model, falling back to wooden fence:', secondError);
                                
                                // Import fallback model creation
                                import('./model-loader.js').then(module => {
                                    module.createWoodenFenceModel().then(fallbackModel => {
                                        console.log('Using fallback wooden fence barrier');
                                        
                                        // Apply theme-specific coloring to the fallback model
                                        applyThemeColorToFallbackBarrier(fallbackModel, currentTheme);
                                        
                                        resolve(fallbackModel);
                                    }).catch(reject);
                                }).catch(reject);                            }
                        );
                    }
                );
            } catch (error) {
                console.error('Error setting up barrier model load:', error);
                
                // Fallback to standard wooden fence
                import('./model-loader.js').then(module => {
                    module.createWoodenFenceModel().then(fallbackModel => {
                        console.log('Using fallback wooden fence barrier due to error');
                        
                        // Apply theme-specific coloring to the fallback model
                        applyThemeColorToFallbackBarrier(fallbackModel, currentTheme);
                        
                        resolve(fallbackModel);
                    }).catch(fallbackError => {
                        console.error('Failed to create fallback barrier model:', fallbackError);
                        reject(fallbackError);
                    });
                }).catch(importError => {
                    console.error('Failed to import model-loader module:', importError);
                    reject(importError);
                });
            }
        } else {
            // No barrier model configured, use default fallback
            import('./model-loader.js').then(module => {
                module.createWoodenFenceModel().then(fallbackModel => {
                    console.log('Using default wooden fence barrier');
                    
                    // Apply theme-specific coloring to the fallback model
                    applyThemeColorToFallbackBarrier(fallbackModel, currentTheme);
                    
                    resolve(fallbackModel);
                }).catch(reject);
            }).catch(reject);
        }
    });
}

// Helper function to apply theme-appropriate coloring to fallback barriers
function applyThemeColorToFallbackBarrier(model, theme) {
    const themeColors = {
        'forest': 0x2d4c1e, // Dark forest green
        'desert': 0xd2b48c, // Sandy color
        'snow': 0xf0f0ff,   // Snow white with slight blue tint
        'farm': 0x8b4513,   // Brown wooden color
        'classic': 0x8b4513 // Standard wooden color
    };
    
    const color = themeColors[theme] || themeColors['classic'];
    
    // Apply the color to all meshes in the model
    model.traverse(child => {
        if (child.isMesh && child.material) {
            child.material = child.material.clone(); // Clone to avoid affecting shared materials
            child.material.color.set(color);
        }
    });
    
    // Mark as fallback
    model.userData.fallback = true;
}

// Get obstacle model for current theme (for game modes with obstacles)
export async function getThemeObstacleModel() {
    const themeConfig = getThemeConfig(currentBoardTheme);
    const basePath = `assets/temas_models/${themeConfig.folder}/`;
    
    if (themeConfig.models.obstacle && themeConfig.models.obstacle.length > 0) {
        try {
            // Pick a random obstacle model from available ones
            const randomObstacle = themeConfig.models.obstacle[
                Math.floor(Math.random() * themeConfig.models.obstacle.length)
            ];
            
            const model = await loadModel(basePath + randomObstacle);
            if (model) {
                model.userData.isThemeModel = true;
                model.userData.themeType = 'obstacle';
                return model;
            }
        } catch (error) {
            console.warn('Failed to load obstacle model for theme:', currentBoardTheme, error);
        }
    }
    
    return null;
}

// Preview theme (for theme selection menu)
export async function previewTheme(scene, themeName) {
    if (!BOARD_THEMES[themeName]) {
        console.error('Invalid theme for preview:', themeName);
        return false;
    }
    
    const originalTheme = currentBoardTheme;
    currentBoardTheme = themeName;
    
    const success = await applyBoardThemeToScene(scene);
    
    // If this was just a preview, we could revert back
    // For now, we'll keep the selected theme
    
    return success;
}

// Get theme display information
export function getThemeDisplayInfo(themeName) {
    const config = getThemeConfig(themeName);
    return {
        name: config.name,
        description: `Experience the ${config.name} environment with unique models and atmosphere.`,
        colors: config.colors
    };
}

// Export theme configurations for other modules
export { BOARD_THEMES };
