// sounds.js - Handles audio (separate music and SFX)

export class Sounds {
    constructor(game) {
        this.game = game;
        this.musicVolume = 0.5;
        this.sfxVolume = 0.5;

        // Mapping of sound names to file paths (place your files into assets/sounds/)
        this.soundFiles = {
            boost: 'assets/sounds/boost.wav',
            hit: 'assets/sounds/hit.wav',
            damage: 'assets/sounds/damage.wav',
            enemy_destroy: 'assets/sounds/enemy_destroy.wav'
        };

        // Music file (single track, looped)
        this.musicFile = 'assets/sounds/background_music.mp3';

        // Music audio element (single instance, looped)
        this.musicAudio = null;

        // Optional preloaded SFX cache (stores Audio objects for quick reuse)
        this._preloadedSFX = {};

        this._init();
    }

    _init() {
        // Create the music audio element
        this.musicAudio = new Audio();
        this.musicAudio.src = this.musicFile;
        this.musicAudio.loop = true;
        this.musicAudio.volume = this.musicVolume;
        this.musicAudio.preload = 'auto';

        // Preload SFX (shallow preload: create an Audio object for each file so browser can cache)
        Object.keys(this.soundFiles).forEach(key => {
            const a = new Audio();
            a.src = this.soundFiles[key];
            a.preload = 'auto';
            this._preloadedSFX[key] = a;
        });

        // Try to start music if allowed (some browsers block autoplay)
        this._tryPlayMusic();
    }

    _tryPlayMusic() {
        if (!this.musicAudio) return;
        // Attempt to play; if blocked, note it and play on first user interaction
        const p = this.musicAudio.play();
        if (p && p.catch) {
            p.catch(() => {
                const onFirstInteraction = () => {
                    this.musicAudio.play().catch(() => {});
                    window.removeEventListener('pointerdown', onFirstInteraction);
                    window.removeEventListener('touchstart', onFirstInteraction);
                };
                window.addEventListener('pointerdown', onFirstInteraction);
                window.addEventListener('touchstart', onFirstInteraction);
            });
        }
    }

    // Start/stop music explicitly
    playMusic() {
        if (!this.musicAudio) return;
        this.musicAudio.volume = this.musicVolume;
        this.musicAudio.play().catch(() => {});
    }

    stopMusic() {
        if (!this.musicAudio) return;
        this.musicAudio.pause();
        this.musicAudio.currentTime = 0;
    }

    // Play an SFX by name. Creates a new Audio node for overlapping playback.
    playSFX(name) {
        const src = this.soundFiles[name];
        if (!src) {
            console.warn('SFX not found:', name);
            return;
        }

        // Create a new audio element so multiple instances can play simultaneously
        const a = new Audio();
        a.src = src;
        a.volume = this.sfxVolume;
        a.preload = 'auto';
        a.play().catch(() => {});
    }

    // Setters for volumes (independent)
    setMusicVolume(v) {
        this.musicVolume = parseFloat(v);
        if (this.musicAudio) this.musicAudio.volume = this.musicVolume;
    }

    setSFXVolume(v) {
        this.sfxVolume = parseFloat(v);
    }

    // Convenience: change music track at runtime
    setMusicTrack(src) {
        if (!this.musicAudio) return;
        this.musicAudio.pause();
        this.musicAudio.src = src;
        this.musicAudio.load();
        this._tryPlayMusic();
    }
}