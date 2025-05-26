// transition-helper.js
// Helper functions for smooth theme transitions

/**
 * Adds a transition class to the document body and removes it after a delay
 * @param {string} className - CSS class name to add temporarily
 * @param {number} delay - Time in milliseconds to wait before removing the class
 */
export function addTransitionClass(className, delay = 500) {
    document.body.classList.add(className);
    
    setTimeout(() => {
        document.body.classList.remove(className);
    }, delay);
}

/**
 * Creates a smooth transition effect when changing themes
 * Call this function before changing theme colors or styles
 */
export function startThemeTransition() {
    addTransitionClass('theme-transitioning');
}
