// theme.js - Handles theme switching functionality

import { setTheme, updateSceneTheme } from './scene.js';

// DOM Elements
const greenThemeBtn = document.getElementById('greenThemeBtn');
const purpleThemeBtn = document.getElementById('purpleThemeBtn');
const orangeThemeBtn = document.getElementById('orangeThemeBtn');
const themeButtons = [greenThemeBtn, purpleThemeBtn, orangeThemeBtn];

// Initialize theme system
export function initThemeSystem(scene) {
    // Set up event listeners for theme buttons
    greenThemeBtn.addEventListener('click', () => {
        changeTheme('green', scene);
    });
    
    purpleThemeBtn.addEventListener('click', () => {
        changeTheme('purple', scene);
    });
    
    orangeThemeBtn.addEventListener('click', () => {
        changeTheme('orange', scene);
    });
    
    // Set default active theme
    setActiveThemeButton('green');
}

// Change theme function
function changeTheme(themeName, scene) {
    // Update the active theme
    setTheme(themeName);
    
    // Update scene colors
    updateSceneTheme(scene);
    
    // Update UI
    setActiveThemeButton(themeName);
    
    // Save preference to localStorage
    localStorage.setItem('snakeGameTheme', themeName);
}

// Set active theme button in UI
function setActiveThemeButton(themeName) {
    // Remove active class from all buttons
    themeButtons.forEach(btn => {
        btn.classList.remove('active-theme');
    });
    
    // Add active class to selected theme button
    switch(themeName) {
        case 'green':
            greenThemeBtn.classList.add('active-theme');
            break;
        case 'purple':
            purpleThemeBtn.classList.add('active-theme');
            break;
        case 'orange':
            orangeThemeBtn.classList.add('active-theme');
            break;
    }
}

// Load saved theme preference
export function loadSavedTheme(scene) {
    const savedTheme = localStorage.getItem('snakeGameTheme');
    if (savedTheme) {
        changeTheme(savedTheme, scene);
    }
}

// Theme management utilities
// This file provides additional theme-related functionality

// Placeholder for future theme functionality
export function getThemeColors(themeName) {
    const themes = {
        green: { primary: '#4e8d77', secondary: '#65b798', highlight: '#8ee4af' },
        purple: { primary: '#7d55a0', secondary: '#9b59b6', highlight: '#bb8cce' },
        orange: { primary: '#d35400', secondary: '#e67e22', highlight: '#f39c12' }
    };
    
    return themes[themeName] || themes.green;
}