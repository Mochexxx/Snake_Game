import * as THREE from 'three';

// Lighting configuration
let lightingConfig = {
    ambient: {
        color: 0xffffff,
        intensity: 0.5,
        enabled: true
    },
    directional: {
        color: 0xffffff,
        intensity: 1.0,
        position: { x: 40, y: 40, z: 40 },
        castShadow: true,
        enabled: true
    },
    fill: {
        color: 0xffffff,
        intensity: 0.3,
        position: { x: -20, y: 30, z: -20 },
        enabled: true
    },
    point: {
        color: 0xffffff,
        intensity: 0.8,
        position: { x: 0, y: 50, z: 0 },
        distance: 100,
        decay: 2,
        castShadow: false,
        enabled: false
    },
    spotlight: {
        color: 0xffffff,
        intensity: 1.0,
        position: { x: 30, y: 60, z: 30 },
        target: { x: 20, y: 0, z: 20 },
        angle: Math.PI / 6,
        penumbra: 0.3,
        distance: 200,
        decay: 2,
        castShadow: false,
        enabled: false
    }
};

// Light objects
let lights = {
    ambient: null,
    directional: null,
    fill: null,
    point: null,
    spotlight: null
};

let scene = null;
let debugMenuVisible = false;

// Create and configure all lights
export function createLights(gameScene) {
    scene = gameScene;
    
    // Ambient light
    lights.ambient = new THREE.AmbientLight(
        lightingConfig.ambient.color,
        lightingConfig.ambient.intensity
    );
    if (lightingConfig.ambient.enabled) scene.add(lights.ambient);
    
    // Main directional light
    lights.directional = new THREE.DirectionalLight(
        lightingConfig.directional.color,
        lightingConfig.directional.intensity
    );
    lights.directional.position.set(
        lightingConfig.directional.position.x,
        lightingConfig.directional.position.y,
        lightingConfig.directional.position.z
    );
    lights.directional.castShadow = lightingConfig.directional.castShadow;
    
    // Configure shadow settings
    lights.directional.shadow.mapSize.width = 1024;
    lights.directional.shadow.mapSize.height = 1024;
    lights.directional.shadow.camera.near = 0.5;
    lights.directional.shadow.camera.far = 100;
    lights.directional.shadow.camera.left = -40;
    lights.directional.shadow.camera.right = 40;
    lights.directional.shadow.camera.top = 40;
    lights.directional.shadow.camera.bottom = -40;
    
    // Add target for directional light
    lights.directional.target.position.set(20, 0, 20);
    scene.add(lights.directional.target);
    if (lightingConfig.directional.enabled) scene.add(lights.directional);
    
    // Fill light
    lights.fill = new THREE.DirectionalLight(
        lightingConfig.fill.color,
        lightingConfig.fill.intensity
    );
    lights.fill.position.set(
        lightingConfig.fill.position.x,
        lightingConfig.fill.position.y,
        lightingConfig.fill.position.z
    );
    if (lightingConfig.fill.enabled) scene.add(lights.fill);
    
    // Point light
    lights.point = new THREE.PointLight(
        lightingConfig.point.color,
        lightingConfig.point.intensity,
        lightingConfig.point.distance,
        lightingConfig.point.decay
    );
    lights.point.position.set(
        lightingConfig.point.position.x,
        lightingConfig.point.position.y,
        lightingConfig.point.position.z
    );
    lights.point.castShadow = lightingConfig.point.castShadow;
    if (lightingConfig.point.enabled) scene.add(lights.point);
    
    // Spotlight
    lights.spotlight = new THREE.SpotLight(
        lightingConfig.spotlight.color,
        lightingConfig.spotlight.intensity,
        lightingConfig.spotlight.distance,
        lightingConfig.spotlight.angle,
        lightingConfig.spotlight.penumbra,
        lightingConfig.spotlight.decay
    );
    lights.spotlight.position.set(
        lightingConfig.spotlight.position.x,
        lightingConfig.spotlight.position.y,
        lightingConfig.spotlight.position.z
    );
    lights.spotlight.target.position.set(
        lightingConfig.spotlight.target.x,
        lightingConfig.spotlight.target.y,
        lightingConfig.spotlight.target.z
    );
    lights.spotlight.castShadow = lightingConfig.spotlight.castShadow;
    scene.add(lights.spotlight.target);
    if (lightingConfig.spotlight.enabled) scene.add(lights.spotlight);
    
    return lights;
}

// Update light properties
function updateLight(lightType, property, value) {
    const light = lights[lightType];
    const config = lightingConfig[lightType];
    
    if (!light || !config) return;
    
    switch (property) {
        case 'enabled':
            config.enabled = value;
            if (value && !scene.children.includes(light)) {
                scene.add(light);
            } else if (!value && scene.children.includes(light)) {
                scene.remove(light);
            }
            break;
            
        case 'intensity':
            config.intensity = value;
            light.intensity = value;
            break;
            
        case 'color':
            config.color = value;
            light.color.setHex(value);
            break;
            
        case 'positionX':
            config.position.x = value;
            light.position.x = value;
            break;
            
        case 'positionY':
            config.position.y = value;
            light.position.y = value;
            break;
            
        case 'positionZ':
            config.position.z = value;
            light.position.z = value;
            break;
            
        case 'distance':
            if (lightType === 'point' || lightType === 'spotlight') {
                config.distance = value;
                light.distance = value;
            }
            break;
            
        case 'decay':
            if (lightType === 'point' || lightType === 'spotlight') {
                config.decay = value;
                light.decay = value;
            }
            break;
            
        case 'angle':
            if (lightType === 'spotlight') {
                config.angle = value;
                light.angle = value;
            }
            break;
            
        case 'penumbra':
            if (lightType === 'spotlight') {
                config.penumbra = value;
                light.penumbra = value;
            }
            break;
            
        case 'castShadow':
            if (lightType === 'directional' || lightType === 'point' || lightType === 'spotlight') {
                config.castShadow = value;
                light.castShadow = value;
            }
            break;
    }
}

// Create debug menu
export function createLightingDebugMenu() {
    if (document.getElementById('lighting-debug-menu')) return;
    
    const menu = document.createElement('div');
    menu.id = 'lighting-debug-menu';
    menu.style.position = 'fixed';
    menu.style.top = '10px';
    menu.style.left = '10px';
    menu.style.backgroundColor = 'rgba(0, 0, 0, 0.9)';
    menu.style.color = 'white';
    menu.style.padding = '20px';
    menu.style.borderRadius = '10px';
    menu.style.zIndex = '2000';
    menu.style.fontSize = '14px';
    menu.style.fontFamily = 'Arial, sans-serif';
    menu.style.width = '300px';
    menu.style.maxHeight = '80vh';
    menu.style.overflowY = 'auto';
    menu.style.display = 'none';
    
    menu.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
            <h3 style="margin: 0; color: #4CAF50;">💡 Lighting Debug</h3>
            <button id="close-lighting-menu" style="background: #f44336; color: white; border: none; border-radius: 3px; padding: 5px 10px; cursor: pointer;">✕</button>
        </div>
        <div id="lighting-controls"></div>
    `;
    
    document.body.appendChild(menu);
    
    // Close button functionality
    document.getElementById('close-lighting-menu').addEventListener('click', hideLightingDebugMenu);
    
    // Create controls for each light type
    createLightControls();
}

// Create individual light controls
function createLightControls() {
    const container = document.getElementById('lighting-controls');
    
    Object.keys(lightingConfig).forEach(lightType => {
        const config = lightingConfig[lightType];
        const lightSection = document.createElement('div');
        lightSection.style.marginBottom = '20px';
        lightSection.style.padding = '10px';
        lightSection.style.border = '1px solid #555';
        lightSection.style.borderRadius = '5px';
        
        let controlsHTML = `
            <h4 style="margin: 0 0 10px 0; color: #81C784; text-transform: capitalize;">${lightType} Light</h4>
            <label style="display: flex; align-items: center; margin-bottom: 8px;">
                <input type="checkbox" id="${lightType}-enabled" ${config.enabled ? 'checked' : ''} style="margin-right: 8px;">
                Enabled
            </label>
            <label style="display: block; margin-bottom: 8px;">
                Intensity: <span id="${lightType}-intensity-value">${config.intensity}</span>
                <input type="range" id="${lightType}-intensity" min="0" max="3" step="0.1" value="${config.intensity}" style="width: 100%; margin-top: 2px;">
            </label>
            <label style="display: block; margin-bottom: 8px;">
                Color:
                <input type="color" id="${lightType}-color" value="#${config.color.toString(16).padStart(6, '0')}" style="margin-left: 10px;">
            </label>
        `;
        
        // Position controls for lights that have position
        if (config.position) {
            controlsHTML += `
                <label style="display: block; margin-bottom: 8px;">
                    Position X: <span id="${lightType}-posX-value">${config.position.x}</span>
                    <input type="range" id="${lightType}-posX" min="-100" max="100" step="1" value="${config.position.x}" style="width: 100%; margin-top: 2px;">
                </label>
                <label style="display: block; margin-bottom: 8px;">
                    Position Y: <span id="${lightType}-posY-value">${config.position.y}</span>
                    <input type="range" id="${lightType}-posY" min="0" max="100" step="1" value="${config.position.y}" style="width: 100%; margin-top: 2px;">
                </label>
                <label style="display: block; margin-bottom: 8px;">
                    Position Z: <span id="${lightType}-posZ-value">${config.position.z}</span>
                    <input type="range" id="${lightType}-posZ" min="-100" max="100" step="1" value="${config.position.z}" style="width: 100%; margin-top: 2px;">
                </label>
            `;
        }
        
        // Special controls for point lights
        if (lightType === 'point') {
            controlsHTML += `
                <label style="display: block; margin-bottom: 8px;">
                    Distance: <span id="${lightType}-distance-value">${config.distance}</span>
                    <input type="range" id="${lightType}-distance" min="0" max="200" step="5" value="${config.distance}" style="width: 100%; margin-top: 2px;">
                </label>
                <label style="display: block; margin-bottom: 8px;">
                    Decay: <span id="${lightType}-decay-value">${config.decay}</span>
                    <input type="range" id="${lightType}-decay" min="0" max="5" step="0.1" value="${config.decay}" style="width: 100%; margin-top: 2px;">
                </label>
            `;
        }
        
        // Special controls for spotlight
        if (lightType === 'spotlight') {
            controlsHTML += `
                <label style="display: block; margin-bottom: 8px;">
                    Angle: <span id="${lightType}-angle-value">${(config.angle * 180 / Math.PI).toFixed(1)}°</span>
                    <input type="range" id="${lightType}-angle" min="0" max="90" step="1" value="${config.angle * 180 / Math.PI}" style="width: 100%; margin-top: 2px;">
                </label>
                <label style="display: block; margin-bottom: 8px;">
                    Penumbra: <span id="${lightType}-penumbra-value">${config.penumbra}</span>
                    <input type="range" id="${lightType}-penumbra" min="0" max="1" step="0.05" value="${config.penumbra}" style="width: 100%; margin-top: 2px;">
                </label>
                <label style="display: block; margin-bottom: 8px;">
                    Distance: <span id="${lightType}-distance-value">${config.distance}</span>
                    <input type="range" id="${lightType}-distance" min="0" max="300" step="10" value="${config.distance}" style="width: 100%; margin-top: 2px;">
                </label>
            `;
        }
        
        // Shadow controls for lights that support shadows
        if (lightType === 'directional' || lightType === 'point' || lightType === 'spotlight') {
            controlsHTML += `
                <label style="display: flex; align-items: center; margin-bottom: 8px;">
                    <input type="checkbox" id="${lightType}-shadow" ${config.castShadow ? 'checked' : ''} style="margin-right: 8px;">
                    Cast Shadows
                </label>
            `;
        }
        
        lightSection.innerHTML = controlsHTML;
        container.appendChild(lightSection);
        
        // Add event listeners
        setupLightEventListeners(lightType, config);
    });
}

// Setup event listeners for light controls
function setupLightEventListeners(lightType, config) {
    // Enabled checkbox
    const enabledCheckbox = document.getElementById(`${lightType}-enabled`);
    enabledCheckbox.addEventListener('change', (e) => {
        updateLight(lightType, 'enabled', e.target.checked);
    });
    
    // Intensity slider
    const intensitySlider = document.getElementById(`${lightType}-intensity`);
    const intensityValue = document.getElementById(`${lightType}-intensity-value`);
    intensitySlider.addEventListener('input', (e) => {
        const value = parseFloat(e.target.value);
        intensityValue.textContent = value;
        updateLight(lightType, 'intensity', value);
    });
    
    // Color picker
    const colorPicker = document.getElementById(`${lightType}-color`);
    colorPicker.addEventListener('change', (e) => {
        const color = parseInt(e.target.value.replace('#', ''), 16);
        updateLight(lightType, 'color', color);
    });
    
    // Position controls
    if (config.position) {
        ['X', 'Y', 'Z'].forEach(axis => {
            const slider = document.getElementById(`${lightType}-pos${axis}`);
            const valueSpan = document.getElementById(`${lightType}-pos${axis}-value`);
            if (slider && valueSpan) {
                slider.addEventListener('input', (e) => {
                    const value = parseFloat(e.target.value);
                    valueSpan.textContent = value;
                    updateLight(lightType, `position${axis}`, value);
                });
            }
        });
    }
    
    // Special controls
    if (lightType === 'point' || lightType === 'spotlight') {
        const distanceSlider = document.getElementById(`${lightType}-distance`);
        const distanceValue = document.getElementById(`${lightType}-distance-value`);
        if (distanceSlider && distanceValue) {
            distanceSlider.addEventListener('input', (e) => {
                const value = parseFloat(e.target.value);
                distanceValue.textContent = value;
                updateLight(lightType, 'distance', value);
            });
        }
    }
    
    if (lightType === 'point') {
        const decaySlider = document.getElementById(`${lightType}-decay`);
        const decayValue = document.getElementById(`${lightType}-decay-value`);
        if (decaySlider && decayValue) {
            decaySlider.addEventListener('input', (e) => {
                const value = parseFloat(e.target.value);
                decayValue.textContent = value;
                updateLight(lightType, 'decay', value);
            });
        }
    }
    
    if (lightType === 'spotlight') {
        const angleSlider = document.getElementById(`${lightType}-angle`);
        const angleValue = document.getElementById(`${lightType}-angle-value`);
        if (angleSlider && angleValue) {
            angleSlider.addEventListener('input', (e) => {
                const value = parseFloat(e.target.value) * Math.PI / 180; // Convert to radians
                angleValue.textContent = e.target.value + '°';
                updateLight(lightType, 'angle', value);
            });
        }
        
        const penumbraSlider = document.getElementById(`${lightType}-penumbra`);
        const penumbraValue = document.getElementById(`${lightType}-penumbra-value`);
        if (penumbraSlider && penumbraValue) {
            penumbraSlider.addEventListener('input', (e) => {
                const value = parseFloat(e.target.value);
                penumbraValue.textContent = value;
                updateLight(lightType, 'penumbra', value);
            });
        }
    }
    
    // Shadow checkbox
    const shadowCheckbox = document.getElementById(`${lightType}-shadow`);
    if (shadowCheckbox) {
        shadowCheckbox.addEventListener('change', (e) => {
            updateLight(lightType, 'castShadow', e.target.checked);
        });
    }
}

// Show lighting debug menu
export function showLightingDebugMenu() {
    const menu = document.getElementById('lighting-debug-menu');
    if (menu) {
        menu.style.display = 'block';
        debugMenuVisible = true;
    }
}

// Hide lighting debug menu
export function hideLightingDebugMenu() {
    const menu = document.getElementById('lighting-debug-menu');
    if (menu) {
        menu.style.display = 'none';
        debugMenuVisible = false;
    }
}

// Toggle lighting debug menu
export function toggleLightingDebugMenu() {
    if (debugMenuVisible) {
        hideLightingDebugMenu();
    } else {
        showLightingDebugMenu();
    }
}

// Check if menu is visible
export function isLightingDebugMenuVisible() {
    return debugMenuVisible;
}

// Get current lighting configuration
export function getLightingConfig() {
    return lightingConfig;
}

// Set lighting configuration
export function setLightingConfig(newConfig) {
    lightingConfig = { ...lightingConfig, ...newConfig };
    // Update existing lights if they exist
    Object.keys(lights).forEach(lightType => {
        if (lights[lightType] && lightingConfig[lightType]) {
            const config = lightingConfig[lightType];
            updateLight(lightType, 'enabled', config.enabled);
            updateLight(lightType, 'intensity', config.intensity);
            updateLight(lightType, 'color', config.color);
            // Update other properties as needed
        }
    });
}
