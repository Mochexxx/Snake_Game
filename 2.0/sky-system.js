// sky-system.js
// Advanced sky system with moving clouds and procedural shaders

import * as THREE from 'three';

// Sky system state
let skyDome = null;
let cloudLayer = null;
let animationTime = 0;

// Cloud shader uniforms
const cloudUniforms = {
    time: { value: 0 },
    cloudSpeed: { value: 0.002 },
    cloudScale: { value: 8.0 },
    cloudCoverage: { value: 0.4 },
    cloudSharpness: { value: 0.1 },
    cloudOpacity: { value: 0.8 },
    skyColor: { value: new THREE.Color(0x87CEEB) },
    cloudColor: { value: new THREE.Color(0xFFFFFF) },
    sunDirection: { value: new THREE.Vector3(1, 0.5, 0.3).normalize() }
};

// Enhanced sky dome vertex shader
const skyVertexShader = `
    varying vec3 vWorldPosition;
    varying vec2 vUv;
    varying vec3 vNormal;
    
    void main() {
        vUv = uv;
        vNormal = normalize(normalMatrix * normal);
        
        vec4 worldPosition = modelMatrix * vec4(position, 1.0);
        vWorldPosition = worldPosition.xyz;
        
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
`;

// Enhanced sky dome fragment shader with atmospheric scattering
const skyFragmentShader = `
    uniform vec3 topColor;
    uniform vec3 bottomColor;
    uniform vec3 sunDirection;
    uniform float time;
    
    varying vec3 vWorldPosition;
    varying vec2 vUv;
    varying vec3 vNormal;
    
    // Simple noise function for atmospheric variation
    float noise(vec2 st) {
        return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
    }
    
    // Smooth noise
    float smoothNoise(vec2 st) {
        vec2 i = floor(st);
        vec2 f = fract(st);
        
        float a = noise(i);
        float b = noise(i + vec2(1.0, 0.0));
        float c = noise(i + vec2(0.0, 1.0));
        float d = noise(i + vec2(1.0, 1.0));
        
        vec2 u = f * f * (3.0 - 2.0 * f);
        
        return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
    }
    
    void main() {
        vec3 normalizedPos = normalize(vWorldPosition);
        float h = normalizedPos.y;
        
        // Base sky gradient
        vec3 skyColor = mix(bottomColor, topColor, max(h, 0.0));
        
        // Sun effect
        float sunDot = dot(normalizedPos, sunDirection);
        float sunEffect = pow(max(sunDot, 0.0), 32.0);
        vec3 sunColor = vec3(1.0, 0.9, 0.7) * sunEffect * 0.3;
        
        // Atmospheric scattering effect
        float horizon = 1.0 - abs(h);
        float scattering = pow(horizon, 2.0) * 0.1;
        vec3 scatterColor = mix(skyColor, vec3(1.0, 0.8, 0.6), scattering);
        
        // Add subtle noise for atmosphere variation
        vec2 noiseCoord = vUv * 10.0 + time * 0.01;
        float atmosphereNoise = smoothNoise(noiseCoord) * 0.02;
        
        vec3 finalColor = scatterColor + sunColor + atmosphereNoise;
        
        gl_FragColor = vec4(finalColor, 1.0);
    }
`;

// Cloud layer vertex shader
const cloudVertexShader = `
    varying vec3 vWorldPosition;
    varying vec2 vUv;
    varying vec3 vNormal;
    
    void main() {
        vUv = uv;
        vNormal = normalize(normalMatrix * normal);
        
        vec4 worldPosition = modelMatrix * vec4(position, 1.0);
        vWorldPosition = worldPosition.xyz;
        
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
`;

// Cloud layer fragment shader with procedural clouds
const cloudFragmentShader = `
    uniform float time;
    uniform float cloudSpeed;
    uniform float cloudScale;
    uniform float cloudCoverage;
    uniform float cloudSharpness;
    uniform float cloudOpacity;
    uniform vec3 skyColor;
    uniform vec3 cloudColor;
    uniform vec3 sunDirection;
    
    varying vec3 vWorldPosition;
    varying vec2 vUv;
    varying vec3 vNormal;
    
    // Improved noise function
    vec3 mod289(vec3 x) {
        return x - floor(x * (1.0 / 289.0)) * 289.0;
    }
    
    vec2 mod289(vec2 x) {
        return x - floor(x * (1.0 / 289.0)) * 289.0;
    }
    
    vec3 permute(vec3 x) {
        return mod289(((x * 34.0) + 1.0) * x);
    }
    
    float snoise(vec2 v) {
        const vec4 C = vec4(0.211324865405187,
                            0.366025403784439,
                           -0.577350269189626,
                            0.024390243902439);
        vec2 i  = floor(v + dot(v, C.yy));
        vec2 x0 = v -   i + dot(i, C.xx);
        
        vec2 i1;
        i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
        vec4 x12 = x0.xyxy + C.xxzz;
        x12.xy -= i1;
        
        i = mod289(i);
        vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0))
                + i.x + vec3(0.0, i1.x, 1.0));
        
        vec3 m = max(0.5 - vec3(dot(x0, x0), dot(x12.xy, x12.xy), dot(x12.zw, x12.zw)), 0.0);
        m = m * m;
        m = m * m;
        
        vec3 x = 2.0 * fract(p * C.www) - 1.0;
        vec3 h = abs(x) - 0.5;
        vec3 ox = floor(x + 0.5);
        vec3 a0 = x - ox;
        
        m *= 1.79284291400159 - 0.85373472095314 * (a0 * a0 + h * h);
        
        vec3 g;
        g.x  = a0.x  * x0.x  + h.x  * x0.y;
        g.yz = a0.yz * x12.xz + h.yz * x12.yw;
        return 130.0 * dot(m, g);
    }
    
    // Fractal Brownian Motion for clouds
    float fbm(vec2 st) {
        float value = 0.0;
        float amplitude = 0.5;
        float frequency = 1.0;
        
        for (int i = 0; i < 4; i++) {
            value += amplitude * snoise(st * frequency);
            st *= 2.0;
            amplitude *= 0.5;
            frequency *= 2.0;
        }
        return value;
    }
    
    void main() {
        vec3 normalizedPos = normalize(vWorldPosition);
        
        // Only render clouds in upper hemisphere
        if (normalizedPos.y < 0.1) {
            discard;
        }
        
        // Create moving cloud coordinates
        vec2 cloudCoord = vUv * cloudScale + vec2(time * cloudSpeed, time * cloudSpeed * 0.3);
        
        // Generate cloud density using fractal noise
        float cloudNoise = fbm(cloudCoord);
        float cloudDensity = smoothstep(cloudCoverage - cloudSharpness, cloudCoverage + cloudSharpness, cloudNoise);
        
        // Add cloud movement variation
        vec2 cloudCoord2 = vUv * cloudScale * 0.7 + vec2(time * cloudSpeed * 1.3, time * cloudSpeed * 0.8);
        float cloudNoise2 = fbm(cloudCoord2);
        cloudDensity *= smoothstep(0.3, 0.7, cloudNoise2);
        
        // Cloud lighting based on sun direction
        float sunDot = dot(normalizedPos, sunDirection);
        float lightingFactor = 0.7 + 0.3 * max(sunDot, 0.0);
        
        // Cloud color variation
        vec3 finalCloudColor = cloudColor * lightingFactor;
        
        // Add some blue tint to shadow areas
        finalCloudColor = mix(finalCloudColor, skyColor, (1.0 - lightingFactor) * 0.3);
        
        // Fade clouds at horizon
        float horizonFade = smoothstep(0.1, 0.3, normalizedPos.y);
        cloudDensity *= horizonFade;
        
        // Apply cloud opacity
        float finalOpacity = cloudDensity * cloudOpacity;
        
        if (finalOpacity < 0.01) {
            discard;
        }
        
        gl_FragColor = vec4(finalCloudColor, finalOpacity);
    }
`;

// Create enhanced sky dome with atmospheric effects
export function createAdvancedSkyDome(scene, themeConfig) {
    // Remove existing sky elements
    if (skyDome) {
        scene.remove(skyDome);
        skyDome.geometry.dispose();
        skyDome.material.dispose();
    }
    if (cloudLayer) {
        scene.remove(cloudLayer);
        cloudLayer.geometry.dispose();
        cloudLayer.material.dispose();
    }
    
    // Get theme colors with fallbacks
    const skyTop = themeConfig?.colors?.skyTop || 0x87CEEB;
    const skyBottom = themeConfig?.colors?.skyBottom || 0xE0F6FF;
    
    // Create sky dome geometry
    const skyGeometry = new THREE.SphereGeometry(490, 32, 32);
    
    // Create enhanced sky material
    const skyMaterial = new THREE.ShaderMaterial({
        uniforms: {
            topColor: { value: new THREE.Color(skyTop) },
            bottomColor: { value: new THREE.Color(skyBottom) },
            sunDirection: { value: new THREE.Vector3(1, 0.5, 0.3).normalize() },
            time: { value: 0 }
        },
        vertexShader: skyVertexShader,
        fragmentShader: skyFragmentShader,
        side: THREE.BackSide,
        transparent: false
    });
    
    skyDome = new THREE.Mesh(skyGeometry, skyMaterial);
    skyDome.name = "advancedSkyDome";
    scene.add(skyDome);
    
    // Create cloud layer geometry (slightly smaller radius to be inside sky dome)
    const cloudGeometry = new THREE.SphereGeometry(485, 32, 32);
    
    // Set cloud colors based on theme
    let cloudColorValue = new THREE.Color(0xFFFFFF);
    let skyColorValue = new THREE.Color(skyTop);
    
    if (themeConfig?.name === 'Desert Oasis') {
        cloudColorValue = new THREE.Color(0xFFF8DC); // Cream colored clouds for desert
    } else if (themeConfig?.name === 'Winter Wonderland') {
        cloudColorValue = new THREE.Color(0xF0F8FF); // Ice blue clouds for snow
    } else if (themeConfig?.name === 'Enchanted Forest') {
        cloudColorValue = new THREE.Color(0xF5F5F5); // Light gray clouds for forest
    }
    
    // Update cloud uniforms
    cloudUniforms.skyColor.value = skyColorValue;
    cloudUniforms.cloudColor.value = cloudColorValue;
    
    // Create cloud material
    const cloudMaterial = new THREE.ShaderMaterial({
        uniforms: cloudUniforms,
        vertexShader: cloudVertexShader,
        fragmentShader: cloudFragmentShader,
        side: THREE.BackSide,
        transparent: true,
        depthWrite: false,
        blending: THREE.NormalBlending
    });
    
    cloudLayer = new THREE.Mesh(cloudGeometry, cloudMaterial);
    cloudLayer.name = "cloudLayer";
    scene.add(cloudLayer);
    
    // Set scene background
    scene.background = skyColorValue;
    
    console.log(`Created advanced sky dome with moving clouds for ${themeConfig?.name || 'default theme'}`);
    
    return { skyDome, cloudLayer };
}

// Update sky colors for theme changes
export function updateAdvancedSkyColors(scene, themeConfig) {
    if (skyDome?.material?.uniforms) {
        const skyTop = themeConfig?.colors?.skyTop || 0x87CEEB;
        const skyBottom = themeConfig?.colors?.skyBottom || 0xE0F6FF;
        
        skyDome.material.uniforms.topColor.value.set(skyTop);
        skyDome.material.uniforms.bottomColor.value.set(skyBottom);
        
        scene.background = new THREE.Color(skyTop);
    }
    
    if (cloudLayer?.material?.uniforms) {
        const skyColorValue = new THREE.Color(themeConfig?.colors?.skyTop || 0x87CEEB);
        let cloudColorValue = new THREE.Color(0xFFFFFF);
        
        // Theme-specific cloud colors
        if (themeConfig?.name === 'Desert Oasis') {
            cloudColorValue = new THREE.Color(0xFFF8DC);
            cloudUniforms.cloudSpeed.value = 0.003; // Faster clouds for desert winds
        } else if (themeConfig?.name === 'Winter Wonderland') {
            cloudColorValue = new THREE.Color(0xF0F8FF);
            cloudUniforms.cloudSpeed.value = 0.001; // Slower clouds for calm winter
            cloudUniforms.cloudCoverage.value = 0.6; // More clouds for winter
        } else if (themeConfig?.name === 'Enchanted Forest') {
            cloudColorValue = new THREE.Color(0xF5F5F5);
            cloudUniforms.cloudSpeed.value = 0.0015; // Gentle breeze
            cloudUniforms.cloudCoverage.value = 0.3; // Sparse clouds for clear forest sky
        } else {
            // Classic farm theme
            cloudUniforms.cloudSpeed.value = 0.002; // Normal speed
            cloudUniforms.cloudCoverage.value = 0.4; // Normal coverage
        }
        
        cloudUniforms.skyColor.value = skyColorValue;
        cloudUniforms.cloudColor.value = cloudColorValue;
    }
}

// Animate the sky system
export function animateSky(deltaTime) {
    animationTime += deltaTime;
    
    // Update time uniforms for both sky and clouds
    if (skyDome?.material?.uniforms?.time) {
        skyDome.material.uniforms.time.value = animationTime;
    }
    
    if (cloudLayer?.material?.uniforms?.time) {
        cloudLayer.material.uniforms.time.value = animationTime;
    }
}

// Get current sky elements for external use
export function getSkyElements() {
    return { skyDome, cloudLayer };
}

// Dispose sky system resources
export function disposeSkySystem() {
    if (skyDome) {
        skyDome.geometry.dispose();
        skyDome.material.dispose();
        skyDome = null;
    }
    
    if (cloudLayer) {
        cloudLayer.geometry.dispose();
        cloudLayer.material.dispose();
        cloudLayer = null;
    }
    
    animationTime = 0;
}

// Export cloud uniforms for external configuration
export { cloudUniforms };
