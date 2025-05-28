// audio-system.js
// Audio system for the Snake Game

export class AudioSystem {
    constructor() {
        // Audio elements
        this.backgroundMusic = null;
        this.sounds = {};
        
        // Audio settings (initialized from localStorage)
        this.musicVolume = this.loadSetting('musicVolume', 70) / 100;
        this.sfxVolume = this.loadSetting('sfxVolume', 80) / 100;
        this.isMuted = this.loadSetting('muted', false);
        
        this.initialized = false;
        this.isPlaying = false;
        
        console.log('AudioSystem initialized with volumes:', {
            music: this.musicVolume,
            sfx: this.sfxVolume,
            muted: this.isMuted
        });
    }
    
    loadSetting(key, defaultValue) {
        const saved = localStorage.getItem(key);
        if (saved !== null) {
            return key === 'muted' ? saved === 'true' : parseInt(saved);
        }
        return defaultValue;
    }
    
    async initialize() {
        if (this.initialized) return;
        
        try {
            // Load background music
            this.backgroundMusic = new Audio('assets/audios/The Snake Game (original GB music).mp3');
            this.backgroundMusic.loop = true;
            this.backgroundMusic.volume = this.musicVolume * (this.isMuted ? 0 : 1);
            
            // Preload the audio to avoid delays
            await new Promise((resolve, reject) => {
                this.backgroundMusic.addEventListener('canplaythrough', resolve, { once: true });
                this.backgroundMusic.addEventListener('error', reject, { once: true });
                this.backgroundMusic.load();
            });
            
            // Create sound effects using Web Audio API for better control
            await this.createSoundEffects();
            
            this.initialized = true;
            console.log('Audio system initialized successfully');
            
        } catch (error) {
            console.warn('Failed to initialize audio system:', error);
            this.initialized = false;
        }
    }
    
    async createSoundEffects() {
        // Create audio context for sound effects
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        
        // Create sound effects using oscillators and filters
        this.sounds = {
            buttonClick: () => this.createTone(800, 0.1, 'sine'),
            buttonHover: () => this.createTone(600, 0.05, 'sine'),
            appleEat: () => this.createAppleEatSound(),
            gameOver: () => this.createGameOverSound(),
            levelComplete: () => this.createLevelCompleteSound(),
            snakeMove: () => this.createTone(200, 0.02, 'square', 0.1),
            menuOpen: () => this.createMenuSound(),
            menuClose: () => this.createMenuSound(true)
        };
    }
    
    createTone(frequency, duration, type = 'sine', volume = 0.3) {
        if (this.isMuted || !this.audioContext) return;
        
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
        oscillator.type = type;
        
        const finalVolume = volume * this.sfxVolume;
        gainNode.gain.setValueAtTime(finalVolume, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + duration);
        
        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + duration);
    }
    
    createAppleEatSound() {
        if (this.isMuted || !this.audioContext) return;
        
        // Create a pleasant "pop" sound for eating apples
        const oscillator1 = this.audioContext.createOscillator();
        const oscillator2 = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator1.connect(gainNode);
        oscillator2.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        oscillator1.frequency.setValueAtTime(523, this.audioContext.currentTime); // C5
        oscillator1.frequency.exponentialRampToValueAtTime(784, this.audioContext.currentTime + 0.1); // G5
        
        oscillator2.frequency.setValueAtTime(659, this.audioContext.currentTime); // E5
        oscillator2.frequency.exponentialRampToValueAtTime(1047, this.audioContext.currentTime + 0.1); // C6
        
        oscillator1.type = 'sine';
        oscillator2.type = 'sine';
        
        const finalVolume = 0.3 * this.sfxVolume;
        gainNode.gain.setValueAtTime(finalVolume, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 0.2);
        
        oscillator1.start(this.audioContext.currentTime);
        oscillator1.stop(this.audioContext.currentTime + 0.2);
        oscillator2.start(this.audioContext.currentTime);
        oscillator2.stop(this.audioContext.currentTime + 0.2);
    }
    
    createGameOverSound() {
        if (this.isMuted || !this.audioContext) return;
        
        // Create a descending sequence for game over
        const frequencies = [523, 466, 415, 370, 330]; // Descending notes
        frequencies.forEach((freq, index) => {
            setTimeout(() => {
                this.createTone(freq, 0.3, 'sawtooth', 0.4);
            }, index * 150);
        });
    }
    
    createLevelCompleteSound() {
        if (this.isMuted || !this.audioContext) return;
        
        // Create an ascending victory sound
        const frequencies = [523, 659, 784, 1047]; // C5, E5, G5, C6
        frequencies.forEach((freq, index) => {
            setTimeout(() => {
                this.createTone(freq, 0.2, 'sine', 0.5);
            }, index * 100);
        });
    }
    
    createMenuSound(isClosing = false) {
        if (this.isMuted || !this.audioContext) return;
        
        if (isClosing) {
            this.createTone(400, 0.1, 'triangle', 0.2);
        } else {
            this.createTone(600, 0.1, 'triangle', 0.2);
        }
    }
    
    // Public methods
    async startBackgroundMusic() {
        if (!this.initialized) {
            await this.initialize();
        }
        
        if (this.backgroundMusic && !this.isPlaying && !this.isMuted) {
            try {
                await this.backgroundMusic.play();
                this.isPlaying = true;
                console.log('Background music started');
            } catch (error) {
                console.warn('Failed to start background music:', error);
            }
        }
    }
    
    stopBackgroundMusic() {
        if (this.backgroundMusic && this.isPlaying) {
            this.backgroundMusic.pause();
            this.backgroundMusic.currentTime = 0;
            this.isPlaying = false;
            console.log('Background music stopped');
        }
    }
    
    pauseBackgroundMusic() {
        if (this.backgroundMusic && this.isPlaying) {
            this.backgroundMusic.pause();
            console.log('Background music paused');
        }
    }
    
    resumeBackgroundMusic() {
        if (this.backgroundMusic && this.isPlaying && !this.isMuted) {
            this.backgroundMusic.play().catch(error => {
                console.warn('Failed to resume background music:', error);
            });
        }
    }
    
    playSound(soundName) {
        if (!this.initialized || this.isMuted) return;
        
        if (this.sounds[soundName]) {
            this.sounds[soundName]();
        } else {
            console.warn(`Sound '${soundName}' not found`);
        }
    }
    
    // Volume and settings management
    setMusicVolume(volume) {
        this.musicVolume = Math.max(0, Math.min(1, volume / 100));
        if (this.backgroundMusic) {
            this.backgroundMusic.volume = this.musicVolume * (this.isMuted ? 0 : 1);
        }
        localStorage.setItem('musicVolume', Math.round(this.musicVolume * 100));
    }
    
    setSfxVolume(volume) {
        this.sfxVolume = Math.max(0, Math.min(1, volume / 100));
        localStorage.setItem('sfxVolume', Math.round(this.sfxVolume * 100));
    }
    
    setMuted(muted) {
        this.isMuted = muted;
        if (this.backgroundMusic) {
            this.backgroundMusic.volume = this.musicVolume * (muted ? 0 : 1);
            if (muted && this.isPlaying) {
                this.backgroundMusic.pause();
            } else if (!muted && this.isPlaying) {
                this.backgroundMusic.play().catch(error => {
                    console.warn('Failed to unmute background music:', error);
                });
            }
        }
        localStorage.setItem('muted', muted);
    }
    
    // Utility methods
    getMusicVolume() {
        return Math.round(this.musicVolume * 100);
    }
    
    getSfxVolume() {
        return Math.round(this.sfxVolume * 100);
    }
    
    isMutedState() {
        return this.isMuted;
    }
}

// Create and export global audio system instance
export const audioSystem = new AudioSystem();

// Helper function to add sound effects to buttons
export function addButtonSounds(buttonSelector, hoverSound = 'buttonHover', clickSound = 'buttonClick') {
    const buttons = document.querySelectorAll(buttonSelector);
    
    buttons.forEach(button => {
        // Add hover sound
        button.addEventListener('mouseenter', () => {
            audioSystem.playSound(hoverSound);
        });
        
        // Add click sound
        button.addEventListener('click', () => {
            audioSystem.playSound(clickSound);
        });
    });
}

// Initialize audio system when the page loads (will wait for user interaction)
document.addEventListener('DOMContentLoaded', () => {
    // Add click listener to initialize audio on first user interaction
    const initAudioOnInteraction = async () => {
        await audioSystem.initialize();
        document.removeEventListener('click', initAudioOnInteraction);
        document.removeEventListener('keydown', initAudioOnInteraction);
        document.removeEventListener('touchstart', initAudioOnInteraction);
    };
    
    document.addEventListener('click', initAudioOnInteraction);
    document.addEventListener('keydown', initAudioOnInteraction);
    document.addEventListener('touchstart', initAudioOnInteraction);
});
