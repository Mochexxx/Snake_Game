// Add 3D hover effect to the main menu title
document.addEventListener('DOMContentLoaded', () => {
    const title3d = document.getElementById('title3d');
    if (!title3d) return;
    
    // Store original transform for resetting
    const originalTransform = title3d.style.transform;
    
    // 3D effect parameters
    const max3dRotation = 15; // maximum rotation in degrees
    
    // Add hover effect to the 3D text
    title3d.addEventListener('mousemove', (e) => {
        // Calculate rotation based on cursor position relative to the element
        const rect = title3d.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        
        // Calculate distance from center (normalized -1 to 1)
        const rotateX = -((e.clientY - centerY) / (rect.height / 2)) * max3dRotation;
        const rotateY = ((e.clientX - centerX) / (rect.width / 2)) * max3dRotation;
        
        // Apply 3D rotation
        title3d.style.transform = `perspective(500px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.1)`;
        title3d.style.textShadow = `
            ${rotateY/5}px ${rotateX/5}px 5px rgba(0, 0, 0, 0.5),
            ${rotateY/-10}px ${rotateX/-10}px 10px rgba(255, 255, 255, 0.2)
        `;
        title3d.style.transition = 'none'; // Remove transition for smooth tracking
    });
    
    // Reset transform when not hovering
    title3d.addEventListener('mouseleave', () => {
        title3d.style.transform = originalTransform;
        title3d.style.textShadow = '2px 2px 4px #000';
        title3d.style.transition = 'all 0.5s ease-out'; // Smooth transition back to original state
    });
});
