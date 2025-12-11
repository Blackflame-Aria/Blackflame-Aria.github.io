export class Sounds {
    constructor(game) {
        this.game = game;
        this.musicVolume = 0.5;
        this.sfxVolume = 0.5;

        this.soundFiles = {
            boost: 'assets/sounds/boost.wav',
            hit: 'assets/sounds/hit.wav',
            damage: 'assets/sounds/damage.wav',
            enemy_destroy: 'assets/sounds/enemy_destroy.wav',
            orb_hit: 'assets/sounds/orb_hit.wav'
        };

        this.menuFile = 'assets/sounds/menu.mp3';
        this.musicFile = 'assets/sounds/background_music.mp3';
        this.musicAudio = null;
        this.audioCtx = null;
        this.musicGain = null;
        this.sfxGain = null;
        this._sfxBuffers = {};

        this._init();
    }

    _init() {
        try {
            this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        } catch(e) { this.audioCtx = null; }

        this.musicAudio = new Audio();
        this.musicAudio.src = this.musicFile;
        this.musicAudio.loop = true;
        this.musicAudio.preload = 'auto';

        try {
            const saved = JSON.parse(localStorage.getItem('mr_settings') || 'null');
            if (saved) {
                if (typeof saved.musicVolume === 'number') this.musicVolume = saved.musicVolume;
                if (typeof saved.sfxVolume === 'number') this.sfxVolume = saved.sfxVolume;
            }
        } catch (e) { }

        if (this.audioCtx) {
            try {
                this.musicGain = this.audioCtx.createGain();
                this.sfxGain = this.audioCtx.createGain();
                this.musicGain.gain.value = this.musicVolume;
                this.sfxGain.gain.value = this.sfxVolume;
                try {
                    const srcNode = this.audioCtx.createMediaElementSource(this.musicAudio);
                    srcNode.connect(this.musicGain);
                    this.musicGain.connect(this.audioCtx.destination);
                    this.sfxGain.connect(this.audioCtx.destination);
                } catch(e) {
                    this.musicAudio.volume = this.musicVolume;
                }
            } catch(e) {
                this.musicAudio.volume = this.musicVolume;
            }
            Object.keys(this.soundFiles).forEach(key => {
                const url = this.soundFiles[key];
                fetch(url).then(r => r.arrayBuffer()).then(buf => {
                    this.audioCtx.decodeAudioData(buf, (decoded) => {
                        this._sfxBuffers[key] = decoded;
                    }, () => {
                    });
                }).catch(()=>{});
            });
        } else {
            this.musicAudio.volume = this.musicVolume;
            this._preloadedSFX = {};
            Object.keys(this.soundFiles).forEach(key => {
                const a = new Audio();
                a.src = this.soundFiles[key];
                a.preload = 'auto';
                a.volume = this.sfxVolume;
                this._preloadedSFX[key] = a;
            });
        }

    }

    _tryPlayMusic() {
        if (!this.musicAudio) return;
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

    playMusic() {
        if (!this.musicAudio) return;
        try { if (this.audioCtx && this.audioCtx.state === 'suspended') this.audioCtx.resume(); } catch(e) {}
        this.musicAudio.play().catch(() => {});
    }

    stopMusic() {
        if (!this.musicAudio) return;
        this.musicAudio.pause();
        this.musicAudio.currentTime = 0;
    }

    playSFX(name) {
        const src = this.soundFiles[name];
        if (!src) {
            console.warn('SFX not found:', name);
            return;
        }
        try {
            if (this.audioCtx && this._sfxBuffers[name]) {
                const buf = this._sfxBuffers[name];
                const srcNode = this.audioCtx.createBufferSource();
                srcNode.buffer = buf;
                const localGain = this.audioCtx.createGain();
                const mul = (name === 'orb_hit') ? 0.12 : 1.0;
                localGain.gain.value = Math.max(0, (this.sfxVolume || 0.5) * mul);
                srcNode.connect(localGain);
                localGain.connect(this.sfxGain);
                srcNode.start(0);
                return;
            }
        } catch(e) {}

        const a = new Audio();
        a.src = src;
        if (name === 'orb_hit') a.volume = Math.max(0, (this.sfxVolume || 0.5) * 0.12);
        else a.volume = this.sfxVolume;
        a.preload = 'auto';
        a.play().catch(() => {});
    }

    setMusicVolume(v) {
        this.musicVolume = parseFloat(v);
        if (this.musicAudio) this.musicAudio.volume = this.musicVolume;
    }

    setSFXVolume(v) {
        this.sfxVolume = parseFloat(v);
    }

    setMusicTrack(src, autoplay = false) {
        if (!this.musicAudio) return;
        try { if (this.audioCtx && this.audioCtx.state === 'suspended') this.audioCtx.resume(); } catch(e) {}
        this.musicAudio.pause();
        this.musicAudio.src = src;
        this.musicAudio.load();
        if (autoplay) this._tryPlayMusic();
    }

    playMenuMusic() {
        try {
            if (!this.musicAudio) return;
            this.setMusicTrack(this.menuFile, true);
        } catch(e) {}
    }

    playBackgroundMusic() {
        try {
            if (!this.musicAudio) return;
            if (this.game && this.game.isPlaying && !this.game._paused) {
                this.setMusicTrack(this.musicFile, true);
            } else {
                this.setMusicTrack(this.musicFile, false);
            }
        } catch(e) {}
    }
}