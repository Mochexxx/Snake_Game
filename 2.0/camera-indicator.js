// This module provides visual feedback for the current camera mode

let indicatorElement = null;

// Initialize the camera indicator
export function initializeCameraIndicator() {
    indicatorElement = document.createElement('div');
    indicatorElement.id = 'camera-indicator';
    indicatorElement.style.position = 'absolute';
    indicatorElement.style.top = '10px';
    indicatorElement.style.right = '10px';
    indicatorElement.style.padding = '5px 10px';
    indicatorElement.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
    indicatorElement.style.color = 'white';
    indicatorElement.style.fontFamily = 'Arial, sans-serif';
    indicatorElement.style.fontSize = '14px';
    indicatorElement.style.borderRadius = '5px';
    indicatorElement.style.zIndex = '1000';
    indicatorElement.style.display = 'none';
    document.body.appendChild(indicatorElement);
}

// Update the camera indicator with the current camera mode
export function updateCameraIndicator(cameraType) {
    if (!indicatorElement) return;
    indicatorElement.textContent = `Camera: ${cameraType}`;
    indicatorElement.style.display = 'block';

    // Hide the indicator after 2 seconds
    setTimeout(() => {
        indicatorElement.style.display = 'none';
    }, 2000);
}