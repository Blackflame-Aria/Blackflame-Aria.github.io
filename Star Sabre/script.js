const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const BASE_W = 480;
const BASE_H = 854; 

const GAME = {
    state: 'MENU',
    floor: 1,
    essence: 0,
    frame: 0,
    time: 0,
    dt: 0,
    lastTs: performance.now(),
    target: null,
    shake: 0,
    enemiesSpawned: 0,
    enemiesKilled: 0,
    enemiesRequired: 20,
    lastShootSfxTime: 0,
    deathTimer: 0,
    gatAmbientTimer: 0,
    shootAmbientTimer: 0,
    draftCount: 0,
    warship: null,
};
const ACCESS = (function(){
    try {
        const raw = localStorage.getItem('neonAccessibility');
        const d = raw ? JSON.parse(raw) : {};
        return {
            joyRight: !!d.joyRight,
            moveLevel: Math.min(5, Math.max(1, d.moveLevel || 3)),
            shakeLevel: Math.min(5, Math.max(1, d.shakeLevel || 3)),
            sfxLevel: Math.min(5, Math.max(1, d.sfxLevel || 5)),
            musicLevel: Math.min(5, Math.max(1, d.musicLevel || 5))
        };
    } catch(_) {
        return { joyRight:false, moveLevel:3, shakeLevel:3, sfxLevel:5, musicLevel:5 };
    }
})();

async function ensureIntroPlaying() {
    try {
        if (AudioEngine && AudioEngine.state && AudioEngine.state.ctx && AudioEngine.state.ctx.state === 'suspended') {
            try { await AudioEngine.state.ctx.resume(); } catch(_){}
        }
    } catch(_){}
    try {
        if (!MUSIC.current && !(AudioEngine && AudioEngine.state && AudioEngine.state.currentMusic)) {
            try {
                if (AudioEngine && AudioEngine.state && AudioEngine.state.ready) {
                    AudioEngine.playMusic('intro1', 1, true, 0);
                    return;
                }
            } catch(_){}
            try { bgm.intro1.muted = true; bgm.intro1.volume = 0; bgm.intro1.loop = true; const p = bgm.intro1.play(); if (p && typeof p.then === 'function') { p.then(()=>{ if (!SETTINGS.musicMuted) { try { bgm.intro1.muted = false; bgm.intro1.volume = 0.25; } catch(_){} } }).catch(()=>{}); } } catch(_){}
        }
    } catch(_){}
}

document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') { ensureIntroPlaying(); startMenuMusic(); }
});
let INTRO_PLAYING = false;
function stopMenuMusic() {
    try {
        if (AudioEngine && AudioEngine.state && AudioEngine.state.currentMusic) {
            AudioEngine.stopMusic(0);
        }
    } catch(_){}
    try {
        bgm.intro1.pause();
        bgm.intro1.currentTime = 0;
    } catch(_){}
    INTRO_PLAYING = false;
}
async function startMenuMusic() {
    if (SETTINGS.musicMuted) return;
    if (INTRO_PLAYING) return;
    try {
        if (AudioEngine && AudioEngine.state && AudioEngine.state.ready) {
            const result = await AudioEngine.playMusic('intro1', 1, true, 0);
            if (result) { INTRO_PLAYING = true; return; }
        }
    } catch(_){}
    try {
        bgm.intro1.loop = true;
        bgm.intro1.muted = true;
        bgm.intro1.volume = 0;
        const p = bgm.intro1.play();
        if (p && typeof p.then === 'function') {
            p.then(() => {
                INTRO_PLAYING = true;
                if (!SETTINGS.musicMuted) {
                    try { bgm.intro1.muted = false; bgm.intro1.volume = levelToGain(ACCESS.musicLevel || 5); } catch(_){}
                }
            }).catch(() => { INTRO_PLAYING = false; });
        } else {
            INTRO_PLAYING = true;
            try { bgm.intro1.muted = false; bgm.intro1.volume = levelToGain(ACCESS.musicLevel || 5); } catch(_){}
        }
    } catch(_){}
}
function setupFirstGestureIntroUnlock() {
    const once = () => { startMenuMusic(); window.removeEventListener('pointerdown', once); window.removeEventListener('touchstart', once, { passive: true }); window.removeEventListener('keydown', once); };
    window.addEventListener('pointerdown', once, { once: true });
    window.addEventListener('touchstart', once, { passive: true, once: true });
    window.addEventListener('keydown', once, { once: true });
}
document.addEventListener('DOMContentLoaded', () => {
    const splash = document.getElementById('splash-screen');
    const start = document.getElementById('start-screen');
    const playBtn = document.getElementById('splash-play-btn');
    const splashDialog = document.getElementById('splash-dialog');
    if (splash && start && playBtn) {
        splash.classList.remove('hidden');
        start.classList.add('hidden');
        playBtn.onclick = async () => {
            if (splashDialog) splashDialog.classList.add('closing');

            try {
                await AudioEngine.init();
                if (AudioEngine.state.ctx && AudioEngine.state.ctx.state === 'suspended') {
                    await AudioEngine.state.ctx.resume();
                }
                await preloadAudioAssets();
                await startMenuMusic();
            } catch(e) {
                console.warn('Audio init failed, using fallback:', e);
            }
            try {
                await startMenuMusic();
            } catch(e) {
                try {
                    bgm.intro1.loop = true;
                    bgm.intro1.volume = levelToGain(ACCESS.musicLevel || 5);
                    await bgm.intro1.play();
                    INTRO_PLAYING = true;
                } catch(_) {}
            }

            setTimeout(() => {
                splash.classList.add('hidden');
                start.classList.remove('hidden');
            }, 240);
        };
    } else {
        startMenuMusic();
        setupFirstGestureIntroUnlock();
    }
    const modal = document.getElementById('start-screen');
    if (modal && typeof MutationObserver !== 'undefined') {
        const obs = new MutationObserver(() => {
            const isHidden = modal.classList.contains('hidden');
            if (isHidden) { stopMenuMusic(); }
            else { startMenuMusic(); }
        });
        obs.observe(modal, { attributes: true, attributeFilter: ['class'] });
    }
});
function saveAccessibility(){
    try { localStorage.setItem('neonAccessibility', JSON.stringify(ACCESS)); } catch(_){ }
}
let meta = JSON.parse(localStorage.getItem('neonTowerSave')) || {
    dmgLvl: 0,
    rateLvl: 0,
    chargeLvl: 0,
    highScore: 0,
    essence: 0,
    supportCount: 0
};
let activeFrame = null;
const UPGRADE_COST_TABLE = [
    20, 50, 100, 150, 200,
    300, 400, 550, 700, 850,
    1000, 1150, 1300, 1500, 2000,
    2500, 3000, 3500, 4000, 4500,
    5000
];
const UPGRADE_COST_R = 1.25;
const RATE_UPGRADE_FACTOR = 0.94;
function computeUpgradeCost(n) {
    const lvl = Math.max(0, n || 0);
    if (lvl <= 20) return UPGRADE_COST_TABLE[lvl];
    const m = lvl - 20;
    const base = UPGRADE_COST_TABLE[20];
    return Math.max(1, Math.round(base * Math.pow(UPGRADE_COST_R, m)));
}
function computeUpgradeRefund(n) {
    const count = Math.max(0, n || 0);
    let sum = 0;
    const tableCount = Math.min(count, UPGRADE_COST_TABLE.length);
    for (let i = 0; i < tableCount; i++) sum += UPGRADE_COST_TABLE[i];
    if (count > UPGRADE_COST_TABLE.length) {
        const m = count - UPGRADE_COST_TABLE.length;
        const base = UPGRADE_COST_TABLE[20];
        const r = UPGRADE_COST_R;
        const geom = base * (r * (Math.pow(r, m) - 1) / (r - 1));
        sum += Math.round(geom);
    }
    return sum;
}
if (typeof meta.totalUpgrades !== 'number') {
    meta.totalUpgrades = (meta.dmgLvl || 0) + (meta.rateLvl || 0) + (meta.chargeLvl || 0);
}
if (typeof meta.supportCount === 'number' && meta.supportCount > 10) {
    meta.supportCount = 10;
}
try { localStorage.setItem('neonTowerSave', JSON.stringify(meta)); } catch(e) {}

let party = [];
let enemies = [];
let bullets = [];
let powerups = [];
let particles = [];
const PARTICLE_POOL_SIZE = 1500;
let particleFreeList = [];
let textPopups = [];
let blooms = [];
let playerTrail = [];

function initParticlePool() {
    particles = new Array(PARTICLE_POOL_SIZE);
    particleFreeList = [];
    for (let i = 0; i < PARTICLE_POOL_SIZE; i++) {
        particles[i] = { active: false, x: 0, y: 0, vx: 0, vy: 0, life: 0, fade: 0.05, size: 3, color: '#ffffff' };
        particleFreeList.push(i);
    }
}
function resetParticlePool() {
    for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        if (!p) continue;
        p.active = false; p.life = 0;
    }
    particleFreeList.length = 0;
    for (let i = 0; i < particles.length; i++) particleFreeList.push(i);
}
function emitParticle(x, y, vx, vy, life, fade, size, color) {
    if (particleFreeList.length === 0) return; 
    const idx = particleFreeList.pop();
    const p = particles[idx];
    p.active = true;
    p.x = x; p.y = y; p.vx = vx; p.vy = vy;
    p.life = life != null ? life : 1.0;
    if (fade != null) p.fade = fade; else p.fade = 0.05;
    if (size != null) p.size = size; else p.size = 3;
    p.color = color || '#ffffff';
}

initParticlePool();

const gameWrapper = document.getElementById('game-wrapper');
const DISPLAY = {
    metaEssence: 0,
    gameEssence: 0,
    upgradeCost: 0
};

function animateCount(el, from, to, durationMs = 400, suffix = '') {
    if (!el) return;
    if (from === to) { el.innerText = `${to}${suffix}`; return; }
    const start = performance.now();
    const diff = to - from;
    const easeOut = (t) => 1 - Math.pow(1 - t, 3);
    function step(now) {
        const t = Math.min(1, (now - start) / Math.max(60, durationMs));
        const k = easeOut(t);
        const val = Math.round(from + diff * k);
        el.innerText = `${val}${suffix}`;
        if (t < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
}

let DEBUG_REINF_GUIDES = false; // toggle with 'G'

const C = {
    laneY: 600,
    spawnY: -60,
    colors: {
        lydia: '#f0f',
        cybil: '#0ff',
        sofia: '#ff0',
        enemy: '#f00',
        boss:  '#f00'
    },
    traits: [
        { id: 'gatling', name: 'RAPID SHOT', desc: '2x SPEED' },
        { id: 'sniper', name: 'HEAVY CANNON', desc: '3x IMPACT' },
        { id: 'shotgun', name: 'BROADFIRE', desc: 'Triple shot' }
    ]
};

function fitCanvas() {
    canvas.width = BASE_W;
    canvas.height = BASE_H;
    const availW = Math.min(window.innerWidth, document.documentElement.clientWidth || window.innerWidth, (window.visualViewport && window.visualViewport.width) || window.innerWidth);
    const availH = Math.min(window.innerHeight, document.documentElement.clientHeight || window.innerHeight, (window.visualViewport && window.visualViewport.height) || window.innerHeight);
    const wrapperW = gameWrapper ? gameWrapper.offsetWidth : BASE_W;
    const wrapperH = gameWrapper ? gameWrapper.offsetHeight : BASE_H;
    const fitScale = Math.min(availW / wrapperW, availH / wrapperH);
    const scale = Math.min(1, fitScale);
    if (gameWrapper) {
        gameWrapper.style.transformOrigin = 'center center';
        gameWrapper.style.transform = `translate(-50%, -50%) scale(${scale})`;
    }
    C.laneY = Math.round(BASE_H * 0.84);
}
window.addEventListener('resize', fitCanvas);
fitCanvas();

const sfx = {
    shoot: new Audio('sfx/shoot.wav'), 
    gat: new Audio('sfx/gat.wav'),     
    hit: new Audio('sfx/hit.wav'),     
    ult: new Audio('sfx/ult.wav'),     
    die: new Audio('sfx/die.wav'),     
    click: new Audio('sfx/click.wav'),  
    powerup: new Audio('sfx/powerup.wav'),
    shotgun: new Audio('sfx/shotgun.wav'),
    launch: new Audio('sfx/Launch.wav'),
    blackhole: new Audio('sfx/BlackHole.wav'),
    upgrade: new Audio('sfx/upgrade.wav'),
    warning: new Audio('sfx/Warning.mp3'),
    laser1: new Audio('sfx/laser1.wav'),
    laser2: new Audio('sfx/laser2.wav'),
    laser3: new Audio('sfx/laser3.wav'),
    laser4: new Audio('sfx/laser4.wav'),
    cannon: new Audio('sfx/warcannon.wav')
};
const activeAudio = [];
const SETTINGS = { sfxMuted: false, musicMuted: false };
function loadAudioSettings() {
    try {
        const raw = localStorage.getItem('neonAudio');
        if (raw) {
            const obj = JSON.parse(raw);
            if (typeof obj.sfxMuted === 'boolean') SETTINGS.sfxMuted = obj.sfxMuted;
            if (typeof obj.musicMuted === 'boolean') SETTINGS.musicMuted = obj.musicMuted;
        }
    } catch(_){}
}
loadAudioSettings();

const AudioEngine = (() => {
    const state = {
        ctx: null,
        ready: false,
        enabled: true,
        buffers: new Map(),
        sfxGain: null,
        musicGain: null,
        masterGain: null,
        currentMusic: null,
        musicName: null
    };
    async function init() {
        if (state.ctx) return;
        try {
            const AudioContextClass = window.AudioContext || window.webkitAudioContext;
            if (!AudioContextClass) return;
            
            const ctx = new AudioContextClass({ latencyHint: 'interactive' });
            const master = ctx.createGain();
            const sfx = ctx.createGain();
            const music = ctx.createGain();
            master.gain.value = 1;
            sfx.gain.value = SETTINGS.sfxMuted ? 0 : 1;
            try {
                const initialLevel = (typeof levelToGain === 'function') ? levelToGain(ACCESS.musicLevel || 5) : 0.7;
                music.gain.value = SETTINGS.musicMuted ? 0 : Math.max(0, Math.min(1, initialLevel));
            } catch(_) {
                music.gain.value = SETTINGS.musicMuted ? 0 : 0.7;
            }
            sfx.connect(master); music.connect(master); master.connect(ctx.destination);
            state.ctx = ctx; state.masterGain = master; state.sfxGain = sfx; state.musicGain = music;
            state.ready = true;
        } catch(e) {
            console.warn('AudioEngine init error:', e);
        }
    }
    function unlockOnGesture() {
        const one = async () => {
            try { await init(); if (state.ctx && state.ctx.state === 'suspended') await state.ctx.resume(); } catch(_) {}
            window.removeEventListener('pointerdown', one);
            window.removeEventListener('touchstart', one, { passive: true });
            window.removeEventListener('keydown', one);
            window.removeEventListener('click', one);
        };
        window.addEventListener('pointerdown', one, { once: true });
        window.addEventListener('touchstart', one, { passive: true, once: true });
        window.addEventListener('keydown', one, { once: true });
        window.addEventListener('click', one, { once: true });
    }
    unlockOnGesture();
    async function loadBuffer(name, url) {
        if (!state.enabled) return;
        if (!state.ctx) return;
        if (state.buffers.has(name)) return;
        try {
            const res = await fetch(url);
            const arr = await res.arrayBuffer();
            const buf = await state.ctx.decodeAudioData(arr);
            state.buffers.set(name, buf);
        } catch(_) {}
    }
    async function loadList(list) {
        await Promise.all(list.map(x => loadBuffer(x.name, x.url)));
    }
    function playSfx(name, volume = 1, speed = 1) {
        if (!state.ready || !state.ctx) return false;
        if (state.ctx.state === 'suspended') return false;
        const buf = state.buffers.get(name);
        if (!buf) return false;
        try {
            const src = state.ctx.createBufferSource();
            src.buffer = buf;
            try { src.playbackRate.value = speed || 1; } catch(_){}
            const g = state.ctx.createGain();
            g.gain.value = 1.0;
            src.connect(g); g.connect(state.sfxGain);
            src.start(state.ctx.currentTime);
            src.onended = () => { try { src.disconnect(); g.disconnect(); } catch(_){} };
            return true;
        } catch(_) { return false; }
    }
    async function playMusic(name, volume = 0.2, loop = true, fadeInMs = 0) {
        if (!state.ready || !state.ctx) return false;
        if (!state.ctx) return false;
        if (state.ctx.state === 'suspended') {
            try { await state.ctx.resume(); } catch(_) { return false; }
        }
        const buf = state.buffers.get(name);
        if (!buf) return false;
        stopMusic(0);
        try {
            const src = state.ctx.createBufferSource();
            src.buffer = buf; src.loop = !!loop;
            const trackGain = state.ctx.createGain();
            src.connect(trackGain); trackGain.connect(state.musicGain);
            const now = state.ctx.currentTime;
            if (!SETTINGS.musicMuted) {
                try {
                    if (fadeInMs > 0) {
                        trackGain.gain.setValueAtTime(0, now);
                        trackGain.gain.linearRampToValueAtTime(1.0, now + Math.max(0, fadeInMs/1000));
                    } else {
                        trackGain.gain.setValueAtTime(1.0, now);
                    }
                } catch(_) {}
            } else {
                try { trackGain.gain.setValueAtTime(0, now); } catch(_) {}
            }
            src.start(now);
            state.currentMusic = src; state.musicName = name;
            return true;
        } catch(_) { return false; }
    }
    function stopMusic(fadeOutMs = 0) {
        if (!state.currentMusic || !state.ctx) return;
        try {
            const now = state.ctx.currentTime;
            if (fadeOutMs > 0) {
                const v = state.musicGain.gain.value;
                state.musicGain.gain.setValueAtTime(v, now);
                state.musicGain.gain.linearRampToValueAtTime(0, now + fadeOutMs/1000);
                setTimeout(() => { try { state.currentMusic.stop(); state.currentMusic.disconnect(); } catch(_){} state.currentMusic = null; }, fadeOutMs + 20);
            } else {
                state.currentMusic.stop(); state.currentMusic.disconnect(); state.currentMusic = null;
            }
        } catch(_) {}
    }
    function setSfxMuted(m) { if (state.sfxGain) state.sfxGain.gain.value = m ? 0 : 1; }
    function setMusicMuted(m) {
        if (!state.musicGain) return;
        try {
            if (m) {
                state.musicGain.gain.value = 0;
            } else {
                const gain = (typeof levelToGain === 'function') ? levelToGain(ACCESS.musicLevel || 5) : 1;
                state.musicGain.gain.value = Math.max(0, Math.min(1, gain));
            }
        } catch(_) {}
    }
    return { init, loadBuffer, loadList, playSfx, playMusic, stopMusic, setSfxMuted, setMusicMuted, state };
})();

function preloadAudioAssets() {
    const sfxList = [
        { name: 'shoot', url: 'sfx/shoot.wav' },
        { name: 'beam', url: 'sfx/beam.wav' },
        { name: 'shotgun', url: 'sfx/shotgun.wav' },
        { name: 'hit', url: 'sfx/hit.wav' },
        { name: 'ult', url: 'sfx/ult.wav' },
        { name: 'die', url: 'sfx/die.wav' },
        { name: 'click', url: 'sfx/click.wav' },
        { name: 'powerup', url: 'sfx/powerup.wav' },
        { name: 'blackhole', url: 'sfx/BlackHole.wav' },
        { name: 'upgrade', url: 'sfx/upgrade.wav' },
        { name: 'warning', url: 'sfx/Warning.mp3' },
        { name: 'laser1', url: 'sfx/laser1.wav' },
        { name: 'laser2', url: 'sfx/laser2.wav' },
        { name: 'laser3', url: 'sfx/laser3.wav' },
        { name: 'laser4', url: 'sfx/laser4.wav' },
        { name: 'cannon', url: 'sfx/cannon.wav' }
    ];
    const musicList = [
        { name: 'intro1', url: 'sfx/1.wav' },
        { name: 'waltuh', url: 'sfx/Waltuh.mp3' },
        { name: 'waltuhLoop', url: 'sfx/Waltuh-loop.mp3' },
        { name: 'waltuhLoop2', url: 'sfx/Waltuh-loop2.mp3' },
        { name: 'rustyLoop', url: 'sfx/Rusty-loop.mp3' },
        { name: 'rusty', url: 'sfx/Rusty.mp3' }
    ];
    try {
        AudioEngine.loadList(sfxList.concat(musicList)).catch(() => {});
    } catch(_) {}
}
window.preloadAudioAssets = preloadAudioAssets;

const bgm = {
    intro1: new Audio('sfx/1.wav'),
    waltuh: new Audio('sfx/Waltuh.mp3'),
    waltuhLoop: new Audio('sfx/Waltuh-loop.mp3'),
    waltuhLoop2: new Audio('sfx/Waltuh-loop2.mp3'),
    rustyLoop: new Audio('sfx/Rusty-loop.mp3'),
    rusty: new Audio('sfx/Rusty.mp3')
};
bgm.intro1.preload = 'auto';
bgm.waltuh.preload = 'auto';
bgm.waltuhLoop.preload = 'auto';
bgm.waltuhLoop2.preload = 'auto';
bgm.rustyLoop.preload = 'auto';
bgm.rusty.preload = 'auto';

function pickTrackForSector(sector) {
    if (sector <= 1) return 'waltuh';
    if (sector === 2) return 'waltuhLoop';
    if (sector === 3) return 'waltuhLoop2';
    if (sector === 4) return 'rustyLoop';
    if (sector === 5) return 'rusty';
    if (sector === 6) return 'waltuhLoop';
    if (sector === 7) return 'waltuhLoop2';
    if (sector === 8) return 'waltuhLoop2';
    if (sector === 9) return 'rustyLoop';
    if (sector === 10) return 'rusty';
    if (sector === 11) return 'waltuhLoop';
    if (sector === 12) return 'waltuhLoop2';
    if (sector === 13) return 'waltuhLoop2';
    if (sector === 14) return 'rustyLoop';
    if (sector === 15) return 'rusty';
    if (sector === 16) return 'waltuhLoop';
    if (sector === 17) return 'waltuhLoop2';
    if (sector === 18) return 'waltuhLoop2';
    if (sector === 19) return 'rustyLoop';
    if (sector === 20) return 'rusty';
    if (sector > 20) return 'extreme';
}

function musicUrlForName(name) {
    switch(name) {
        case 'intro1': return 'sfx/1.wav';
        case 'waltuh': return 'sfx/Waltuh.mp3';
        case 'waltuhLoop': return 'sfx/Waltuh-loop.mp3';
        case 'waltuhLoop2': return 'sfx/Waltuh-loop2.mp3';
        case 'rustyLoop': return 'sfx/Rusty-loop.mp3';
        case 'rusty': return 'sfx/Rusty.mp3';
        case 'extreme': return 'sfx/3.wav';
        default: return `sfx/${name}.mp3`;
    }
}

const MUSIC = {
    current: null,
    name: null,
    targetVolume: 1,
    _fadeTimer: null,
    play(name, opts = {}) {
        const volume = typeof opts.volume === 'number' ? opts.volume : 1;
        const fadeInMs = typeof opts.fadeInMs === 'number' ? opts.fadeInMs : 0;
        const loop = (opts.loop !== undefined) ? !!opts.loop : true;
        try {
            if (AudioEngine.state.ready && AudioEngine.playMusic(name, volume, loop, fadeInMs)) {
                this.current = null; this.name = name; this.targetVolume = volume; return;
            }
        } catch(_){}
        const track = bgm[name];
        if (!track) return;
        try { if (AudioEngine.state.currentMusic) { AudioEngine.stopMusic(0); } } catch(_){ }
        const prev = this.current;
        if (prev) { try { prev.pause(); prev.currentTime = 0; } catch(_){ } }
        this.current = track;
        this.name = name;
        try {
            track.loop = loop;
            this.targetVolume = Math.max(0, Math.min(1, volume));
            track.currentTime = 0;
            try { track.muted = true; } catch(_){ }
            track.volume = 0;
            console.log('[Music] Using HTMLAudio fallback for', name);
            const p = track.play();
            if (p && typeof p.then === 'function') {
                p.then(() => {
                    try {
                        if (this.current === track) {
                            if (!SETTINGS.musicMuted) {
                                try { track.muted = false; } catch(_){ }
                                if (fadeInMs > 0) {
                                    try { track.volume = 0; } catch(_){ }
                                    this.fadeTo(this.targetVolume, fadeInMs);
                                } else {
                                    try { track.volume = this.targetVolume; } catch(_){ }
                                }
                            } else {
                                try { track.muted = true; track.volume = 0; } catch(_){ }
                            }
                        }
                    } catch(_){ }
                }).catch(() => {
                    try { if (this.current === track) { this.current = null; this.name = null; } } catch(_){}
                });
            } else {
                if (!SETTINGS.musicMuted) {
                    try { track.muted = false; track.volume = this.targetVolume; } catch(_){ }
                    if (fadeInMs > 0) this.fadeTo(this.targetVolume, fadeInMs);
                }
            }
        } catch(_){ }
    },
    fadeTo(target, ms, onDone) {
        const a = this.current; if (!a) { if(onDone) onDone(); return; }
        const startVol = a.volume;
        const endVol = Math.max(0, Math.min(1, target));
        const dur = Math.max(10, ms || 0);
        const start = performance.now();
        if (this._fadeTimer) { clearInterval(this._fadeTimer); this._fadeTimer = null; }
        this._fadeTimer = setInterval(() => {
            const t = Math.min(1, (performance.now() - start) / dur);
            const v = startVol + (endVol - startVol) * t;
            try { a.volume = v; } catch(_){}
            if (t >= 1) {
                clearInterval(this._fadeTimer); this._fadeTimer = null;
                if (onDone) onDone();
            }
        }, 30);
    },
    stop(opts = {}) {
        try { if (AudioEngine.state.currentMusic) { AudioEngine.stopMusic(opts.fadeOutMs || 0); this.current = null; this.name = null; return; } } catch(_){}
        const a = this.current; if (!a) return;
        const fadeOutMs = typeof opts.fadeOutMs === 'number' ? opts.fadeOutMs : 0;
        if (fadeOutMs > 0) {
            this.fadeTo(0, fadeOutMs, () => { try { a.pause(); a.currentTime = 0; } catch(_){} this.current = null; this.name = null; });
        } else {
            try { a.pause(); a.currentTime = 0; } catch(_){}
            this.current = null; this.name = null;
        }
    }
};

function setSfxMuted(flag) {
    SETTINGS.sfxMuted = !!flag;
    applyVolumeLevels();
    if (SETTINGS.sfxMuted) {
        stopAllAudio();
    }
    try { AudioEngine.setSfxMuted(SETTINGS.sfxMuted); } catch(_){ }
    try { localStorage.setItem('neonAudio', JSON.stringify({ sfxMuted: SETTINGS.sfxMuted, musicMuted: SETTINGS.musicMuted })); } catch(_){}
    updateAudioButtons();
}
function toggleSfxMute() { setSfxMuted(!SETTINGS.sfxMuted); }
window.toggleSfxMute = toggleSfxMute;

function setMusicMuted(flag) {
    SETTINGS.musicMuted = !!flag;
    applyVolumeLevels();
    const a = MUSIC.current;
    if (a) {
        try {
            if (SETTINGS.musicMuted) {
                a.volume = 0; 
                if (a.paused) { a.play().catch(()=>{}); }
            } else {
                a.volume = MUSIC.targetVolume || 1;
                if (a.paused) { a.play().catch(()=>{}); }
            }
        } catch(_){}
    }
    try { AudioEngine.setMusicMuted(SETTINGS.musicMuted); } catch(_){ }
    try { localStorage.setItem('neonAudio', JSON.stringify({ sfxMuted: SETTINGS.sfxMuted, musicMuted: SETTINGS.musicMuted })); } catch(_){}
    updateAudioButtons();
}
function toggleMusicMute() { setMusicMuted(!SETTINGS.musicMuted); }
window.toggleMusicMute = toggleMusicMute;
window.toggleReinfDebug = function(){ DEBUG_REINF_GUIDES = !DEBUG_REINF_GUIDES; return DEBUG_REINF_GUIDES; };

const sfxPool = {
    shoot: [],
    gat: [],
    beam: []
};
const sfxIndex = { shoot: 0, gat: 0, beam: 0 };

;(function initSfxPools(){
    const shootChannels = 6; 
    const gatChannels = 3;
    const beamChannels = 3;
    for (let i = 0; i < shootChannels; i++) {
        const a = new Audio('sfx/shoot.wav');
        a.preload = 'auto';
        sfxPool.shoot.push(a);
    }
    for (let i = 0; i < beamChannels; i++) {
        const a = new Audio('sfx/beam.wav');
        a.preload = 'auto';
        sfxPool.beam.push(a);
    }
})();

const LOOPING = {
    map: new Map(),
    play(name, volume = 1) {
        if (SETTINGS.sfxMuted) return;
        let a = this.map.get(name);
        if (!a) {
            const base = sfx[name];
            if (!base) return;
            a = base.cloneNode();
            a.loop = true;
            a.volume = 1.0;
            this.map.set(name, a);
        }
        try { a.play().catch(()=>{}); } catch(_){ }
    },
    stop(name, resetTime = true) {
        const a = this.map.get(name);
        if (!a) return;
        try { a.pause(); if (resetTime) a.currentTime = 0; } catch(_){}
    },
    stopAll() {
        for (const a of this.map.values()) {
            try { a.pause(); a.currentTime = 0; } catch(_){}
        }
        this.map.clear();
    }
};

function playSfx(sound, volume = 1, opts = {}) {
    if (SETTINGS.sfxMuted) return;
    const uiAllowed = ['click','upgrade','warning'];
    if (GAME.state !== 'PLAY' && !uiAllowed.includes(sound)) return;
    if (sfx[sound]) {
        try {
            const speed = (opts && (opts.playbackRate || opts.rate)) || 1;
            if (AudioEngine.state.ready && AudioEngine.playSfx(sound, volume, speed)) return;
        } catch(_){}
        if (sound === 'shoot') {
            const now = Date.now();
            if (now - GAME.lastShootSfxTime < 40) return;
            GAME.lastShootSfxTime = now;
            const pool = sfxPool.shoot;
            if (pool.length) {
                const i = sfxIndex.shoot;
                const ch = pool[i];
                sfxIndex.shoot = (i + 1) % pool.length;
                try { ch.pause(); ch.currentTime = 0; } catch(e){}
                try { ch.playbackRate = (opts && (opts.playbackRate || opts.rate)) || 1; } catch(_){}
                ch.volume = volume;
                ch.play().catch(() => {});
                return;
            }
        } else if (sound === 'gat') {
            const now = Date.now();
            if (now - GAME.lastGatSfxTime < 1000) return;
            GAME.lastGatSfxTime = now;
            const pool = sfxPool.gat;
            if (pool.length) {
                const i = sfxIndex.gat;
                const ch = pool[i];
                sfxIndex.gat = (i + 1) % pool.length;
                try { ch.pause(); ch.currentTime = 0; } catch(e){}
                try { ch.playbackRate = (opts && (opts.playbackRate || opts.rate)) || 1; } catch(_){}
                ch.volume = volume;
                ch.play().catch(() => {});
                return;
            }
        } else if (sound === 'beam') {
            const now = Date.now();
            if (now - (GAME.lastBeamSfxTime || 0) < 200) return;
            GAME.lastBeamSfxTime = now;
            const pool = sfxPool.beam;
            if (pool.length) {
                const i = sfxIndex.beam;
                const ch = pool[i];
                sfxIndex.beam = (i + 1) % pool.length;
                try { ch.pause(); ch.currentTime = 0; } catch(e){}
                try { ch.playbackRate = (opts && (opts.playbackRate || opts.rate)) || 1; } catch(_){}
                ch.volume = Math.min(1, volume);
                ch.play().catch(() => {});
                return;
            }
        } else if (sound === 'shotgun') {
            const now = Date.now();
            if (now - GAME.lastShotgunSfxTime < 140) return;
            GAME.lastShotgunSfxTime = now;
            const clone = sfx[sound].cloneNode();
            clone.volume = volume;
            activeAudio.push(clone);
            clone.addEventListener('ended', () => {
                const i = activeAudio.indexOf(clone);
                if(i !== -1) activeAudio.splice(i, 1);
            });
            clone.play().catch(() => {});
            return;
        }

        const clone = sfx[sound].cloneNode();
            try { clone.playbackRate = (opts && (opts.playbackRate || opts.rate)) || 1; } catch(_){}
        clone.volume = volume;
        activeAudio.push(clone);
        clone.addEventListener('ended', () => {
            const i = activeAudio.indexOf(clone);
            if(i !== -1) activeAudio.splice(i, 1);
        });
        clone.play().catch(() => {});
    }
}

function stopGunAudio() {
    try {
        (sfxPool.shoot || []).forEach(a => { try { a.pause(); a.currentTime = 0; } catch(e){} });
        (sfxPool.gat || []).forEach(a => { try { a.pause(); a.currentTime = 0; } catch(e){} });
        (sfxPool.beam || []).forEach(a => { try { a.pause(); a.currentTime = 0; } catch(e){} });
    } catch(e){}
    for (let i = activeAudio.length - 1; i >= 0; i--) {
        const a = activeAudio[i];
        try {
            const src = (a && a.src) || '';
            if (src.includes('shoot.wav')) {
                a.pause(); a.currentTime = 0; activeAudio.splice(i, 1);
            }
        } catch(e){}
    }
}

function stopAllAudio() {
    stopGunAudio();
    LOOPING.stopAll();
    try { AudioEngine.stopMusic(0); } catch(_){}
    for (let i = activeAudio.length - 1; i >= 0; i--) {
        try { activeAudio[i].pause(); activeAudio[i].currentTime = 0; } catch(e){}
        activeAudio.splice(i,1);
    }
}


class Pet {
    constructor(type, trait, isMain = false) {
        this.type = type;
        this.trait = trait || { id: 'none', name: 'STANDARD' };
        this.isMain = isMain;

        let baseDmg = 4 + (meta.dmgLvl * 1.5);
        let baseHp = isMain ? 120 : 80;
        let baseRate = 35;

        if(this.trait.id === 'gatling') { 
            baseRate = 18; 
            baseDmg *= 0.65; 
        }
        if(this.trait.id === 'sniper') { 
            baseDmg *= 3; 
            baseRate *= 2.0; 
        }
        
        const rateLvl = (meta.rateLvl || 0);
        const rateExponent = (this.isMain ? 1 : 0.5) * rateLvl;
        baseRate = Math.max(3, Math.round(baseRate * Math.pow(RATE_UPGRADE_FACTOR, rateExponent)));

        this.hp = baseHp;
        this.maxHp = baseHp;
        this.hpDisplay = this.hp; 
        this.dmg = baseDmg;
        this.cooldownMax = baseRate;
        this.cooldown = 0;
        this.size = 16;
        
        this.x = 0;
        this.y = C.laneY;
        this.recoil = 0;
        this.ultCharge = 0;
        this.ultMeter = 0;
        this.powerup = { type: null, time: 0 };
        this.shieldActive = false;
        this.shieldTimer = 0;
        this.gatSfxTimer = 0;
        this.gatSfxBurstLeft = 0;
        this.beamSfxTimer = 0;
        this.beamSfxBurstLeft = 0;
        this.beamActive = false;
        this.beamTime = 0;
        this.deadProcessed = false;

        this.entering = false;
        this.targetX = 0;
        this.targetY = 0;

        this.blackHoleActive = false;
        this.blackHoleTime = 0;
        this.blackHoleRadius = 210; 
        this.blackHoleAngle = 0;
    }

    update(idx, total) {
        if (this.shieldActive) {
            this.shieldTimer -= (GAME.dt / 60);
            if (this.shieldTimer <= 0) {
                this.shieldActive = false;
                this.shieldTimer = 0;
            }
        }
        if (this.isMain && this.entering) {
            const ease = 0.12 * GAME.dt;
            this.x += (this.targetX - this.x) * Math.min(1, ease);
            this.y += (this.targetY - this.y) * Math.min(1, ease);
            this.recoil *= 0.6;
            const arrived = Math.hypot(this.x - this.targetX, this.y - this.targetY) < 1.5;
            if (arrived) {
                this.x = this.targetX;
                this.y = this.targetY;
                this.entering = false;
                this.cooldown = 0;
            }
        }

        if (total > 1 && idx !== 0) {
            const centerX = canvas.width / 2;
            const rowY = Math.max(0, C.laneY - 40);
            const supportIdx = Math.max(0, Math.min(9, idx - 1)); 
            const supportCount = Math.max(1, Math.min(10, total - 1));
                const minInset = 32; 
                const availWidth = Math.max(0, (canvas.width - minInset * 2));
                    const ease = 0.1 * GAME.dt;
                const defaultSpacing = 56;
                const spacingX = supportCount > 1 ? Math.min(defaultSpacing, availWidth / (supportCount - 1)) : defaultSpacing;
            const totalWidth = spacingX * (supportCount - 1);
            const startX = centerX - totalWidth / 2;
            const targetX = startX + supportIdx * spacingX;
            const targetY = rowY;
            this.x += (targetX - this.x) * 0.14;
            this.y += (targetY - this.y) * 0.14;
        }
        this.recoil *= 0.6;

        if (this.hpDisplay === undefined) this.hpDisplay = this.hp;
        if (this.hpDisplay > this.hp) {
            const diff = this.hpDisplay - this.hp;
            const step = Math.max(diff * 0.18 * GAME.dt, 0.6 * GAME.dt);
            this.hpDisplay = Math.max(this.hp, this.hpDisplay - step);
        } else if (this.hpDisplay < this.hp) {
            this.hpDisplay = this.hp;
        }
        if (this.isMain && getSelectedSkin() === 'MOONLIGHT' && this.hp > 0) {
            const perk = SKIN_PERKS.MOONLIGHT;
            const rate = (perk && perk.regenPctPerSec) ? perk.regenPctPerSec : 0.02;
            const add = this.maxHp * rate * (GAME.dt / 60);
            this.hp = Math.min(this.maxHp, this.hp + add);
        }

        if(this.cooldown > 0) this.cooldown -= GAME.dt;
        const chargeMult = 1 + (meta.chargeLvl || 0) * 0.20;
        let chargeRate = 0.1 * chargeMult;
        const hasDefaultTrait = !(this.trait && this.trait.id && (this.trait.id === 'sniper' || this.trait.id === 'gatling' || this.trait.id === 'shotgun'));
        if (this.isMain && hasDefaultTrait && (meta.chargeLvl || 0) >= 15) {
            chargeRate *= 0.5; 
        }
        if (!(this.blackHoleActive && this.isMain && hasDefaultTrait && (meta.chargeLvl || 0) >= 15)) {
            this.ultCharge = Math.min(100, this.ultCharge + chargeRate * GAME.dt);
        }

        if(!this.entering && this.cooldown <= 0) {
            let t = null;
            if (isValidTarget(GAME.target)) {
                t = GAME.target;
            } else {
                t = findClosestEnemy(this.x, this.y);
            }
            if(t && !this.beamActive) {
                this.shoot(t);
                let next = this.cooldownMax + (Math.random()*2);
                if (this.powerup.type === 'FIRE2X') {
                    next *= 0.2;
                }
                this.cooldown = next;
            }
        }

        if (this.beamActive) {
            this.beamTime -= GAME.dt / 60;
            this.beamSfxTimer -= GAME.dt / 60;
            if (this.beamSfxBurstLeft <= 0) {
                this.beamSfxBurstLeft = 0; 
            } else if (this.beamSfxTimer <= 0) {
                playSfx('beam');
                this.beamSfxBurstLeft--;
                this.beamSfxTimer = .8;
            }
            if (this.beamTime <= 0) {
                this.beamActive = false;
                this.beamTime = 0;
                this.beamSfxTimer = 0;
                this.beamSfxBurstLeft = 0;
                LOOPING.stop('laser1');
                if ((meta.rateLvl || 0) >= 15) LOOPING.stop('laser2');
            } else {
                let t = null;
                if (isValidTarget(GAME.target)) {
                    t = GAME.target;
                } else {
                    t = findClosestEnemy(this.x, this.y);
                }
                if (t) {
                    const msElapsed = GAME.dt * 10;
                    let dmg = msElapsed * 0.08;
                    const bigBeamActive = (this.powerup.type === 'BIG' && this.powerup.time > 0 && (meta.rateLvl || 0) >= 15);
                    if (bigBeamActive) dmg *= 2;
                    const ang = Math.atan2(t.y - this.y, t.x - this.x);
                    const dirX = Math.cos(ang), dirY = Math.sin(ang);
                    const maxLen = Math.max(canvas.width, canvas.height) * 1.5;
                    const x2 = this.x + dirX * maxLen;
                    const y2 = this.y + dirY * maxLen;
                    let beamWidth = 10;
                    if (bigBeamActive) beamWidth *= 4;
                    const allTargets = [...enemies];
                    if (GAME.warship && GAME.warship.cannons) {
                        allTargets.push(...GAME.warship.cannons.filter(c => !c.dead));
                    }
                        if (this.shieldActive) {
                            ctx.save();
                            ctx.globalAlpha = 0.55 + 0.25 * Math.sin(performance.now() / 120);
                            ctx.beginPath();
                            ctx.arc(this.x, drawY, 28, 0, Math.PI*2);
                            ctx.strokeStyle = '#00eaff';
                            ctx.lineWidth = 5;
                            ctx.shadowColor = '#00eaff';
                            ctx.shadowBlur = 18;
                            ctx.stroke();
                            ctx.restore();
                        }
                    for (let e of allTargets) {
                        if (!e || e.hp <= 0) continue;
                        const ax = this.x, ay = this.y;
                        const bx = x2, by = y2;
                        const ex = e.x, ey = e.y;
                        const abx = bx - ax, aby = by - ay;
                        const abLen2 = abx*abx + aby*aby;
                        const apx = ex - ax, apy = ey - ay;
                        let tProj = (apx*abx + apy*aby) / (abLen2 || 1);
                        tProj = Math.max(0, Math.min(1, tProj));
                        const closestX = ax + abx * tProj;
                        const closestY = ay + aby * tProj;
                        const dist = Math.hypot(ex - closestX, ey - closestY);
                        const targetSize = e.size || (e.radius || 20);
                        if (dist <= (beamWidth + targetSize)) {
                            e.hp -= dmg;
                            try { spawnDamagePopup(e, dmg, 'regular'); } catch(_){}
                            if (e.hp <= 0 && !e.deadProcessed && !e.dead) {
                                if (e.takeDamage) {
                                    e.takeDamage(0);
                                } else {
                                    e.deadProcessed = true;
                                    playSfx('die');
                                    createRainbowExplosion(e.x, e.y, e.rank === 'BOSS' ? 15 : 10);
                                    onEnemyKilled(e, 'GATLING_BEAM');
                                    if (GAME.target === e) GAME.target = null;
                                }
                            }
                        }
                    }
                    GAME.shake = Math.max(GAME.shake, 2);
                    this.recoil = Math.max(this.recoil, 4);
                }
            }
        }

        if (this.blackHoleActive) {
            this.blackHoleTime -= (GAME.dtMs || (GAME.dt * 16.6667)) / 1000; 
            this.blackHoleAngle -= 0.0025 * (GAME.dtMs || (GAME.dt * 16.6667)); 
            if (this.blackHoleTime <= 0) {
                this.blackHoleActive = false;
            } else {
                const radius = this.blackHoleRadius;
                const msElapsed = (GAME.dtMs || (GAME.dt * 16.6667));
                const candidates = [];
                for (let b of bullets) {
                    if (!b || !b.active || !b.enemyShot || b.ownerRank !== 'BOSS') continue;
                    const d = Math.hypot(b.x - this.x, b.y - this.y);
                    if (d <= radius + (b.radius || 0)) {
                        candidates.push({ b, d });
                    }
                }
                candidates.sort((a, b) => a.d - b.d);
                const limit = Math.min(5, candidates.length);
                for (let i = 0; i < limit; i++) {
                    const { b, d } = candidates[i];
                    const rx = b.x - this.x, ry = b.y - this.y;
                    const invD = 1 / Math.max(1e-3, d);
                    const t = Math.max(0, Math.min(1, d / radius));
                    const swirlStrength = (1 - t) * 0.28 * (msElapsed / 16.6667);
                    const pullStrength = (1 - t) * 0.12 * (msElapsed / 16.6667);
                    const tx = ry * invD, ty = -rx * invD;
                    b.vx += tx * swirlStrength;
                    b.vy += ty * swirlStrength;
                    const px = -rx * invD, py = -ry * invD;
                    b.vx += px * pullStrength;
                    b.vy += py * pullStrength;
                    const sp = Math.hypot(b.vx, b.vy);
                    const maxSp = 12 + (GAME.floor * 0.15);
                    if (sp > maxSp) {
                        const s = maxSp / sp;
                        b.vx *= s; b.vy *= s;
                    }
                    b.blackHoleInfluence = Math.min(1, (b.blackHoleInfluence || 0) + 0.5);
                }
                const allTargets = [...enemies];
                if (GAME.warship && GAME.warship.cannons) {
                    allTargets.push(...GAME.warship.cannons.filter(c => !c.dead));
                }
                for (let e of allTargets) {
                    if (!e || e.hp <= 0) continue;
                    const dist = Math.hypot(e.x - this.x, e.y - this.y);
                    const targetSize = e.size || (e.radius || 20);
                    if (dist <= radius + targetSize) {
                        const t = Math.max(0, Math.min(1, dist / radius));
                        const pivot = 0.55;
                        let dmgPerMs;
                        if (t <= pivot) {
                            const k = t / pivot; 
                            dmgPerMs = 1.2 + (0.1 - 1.2) * k; 
                        } else {
                            const k = (t - pivot) / (1 - pivot); 
                            dmgPerMs = 0.1 + (0.025 - 0.1) * k; 
                        }
                        const dmgFrame = dmgPerMs * msElapsed;
                        e.hp -= dmgFrame;
                        try { spawnDamagePopup(e, dmgFrame, 'regular'); } catch(_){}
                        if (e.hp <= 0 && !e.deadProcessed && !e.dead) {
                            if (e.takeDamage) {
                                e.takeDamage(0);
                            } else {
                                e.deadProcessed = true;
                                playSfx('die');
                                createRainbowExplosion(e.x, e.y, e.rank === 'BOSS' ? 30 : 18);
                                onEnemyKilled(e, 'BLACK_HOLE');
                                if (GAME.target === e) GAME.target = null;
                            }
                        }
                    }
                }
                GAME.shake = Math.max(GAME.shake, 3);
            }
        }
    }

    shoot(target) {
        this.recoil = 8;
        if (this.isMain) {
            const now = Date.now();
            if (now - (GAME.lastShootSfxTime || 0) >= 150) {
                playSfx('shoot');
                GAME.lastShootSfxTime = now;
            }
        } else {
            if (this.trait.id === 'shotgun') {
                playSfx('shotgun');
            } else if (this.trait.id === 'gatling') {
            } else if (this.trait.id === 'sniper') {
                playSfx('shoot');
            } else {
                playSfx('shoot');
            }
        }

        if (this.powerup.type === 'FIRE2X' && this.powerup.time > 0) {
            this.gatSfxTimer -= GAME.dt / 60;
            if (this.gatSfxBurstLeft <= 0) {
                this.gatSfxBurstLeft = 10;
                this.gatSfxTimer = 0;
            }
            if (this.gatSfxTimer <= 0 && this.gatSfxBurstLeft > 0) {
                this.gatSfxBurstLeft--;
                this.gatSfxTimer = 1.0;
            }
        } else {
            this.gatSfxTimer = 0;
        }

        const isMainUnit = !!this.isMain;
        if (isMainUnit && (meta.rateLvl || 0) >= 15) {
            if (!this.beamActive) {
                this.beamActive = true;
                this.beamTime = 1e9;
                this.beamSfxTimer = 0;
                this.beamSfxBurstLeft = 10;
                LOOPING.play('laser2');
            }
            return;
        }

        let count = (this.trait.id === 'shotgun') ? 3 : 1;
        if (this.powerup.type === 'TRIPLE') count = Math.max(count, 3);
        if (this.powerup.type === 'SEXTUPLE') count = Math.max(count, 6);
        
        if (isMainUnit && (meta.dmgLvl || 0) >= 15) {
            const chargeBoost = 1 + (meta.chargeLvl || 0) * 0.20;
            playSfx('cannon');
            GAME.shake = Math.max(GAME.shake, 15);
            activateSniperUlt(this, chargeBoost, { colorOverride: '#ff00ff' });
            return;
        }

        for(let i=0; i<count; i++) {
            let spread = (this.trait.id === 'shotgun') ? (Math.random()-0.5)*0.35 : (Math.random()-0.5)*0.2;
            let dmg = this.dmg;
            let bulletSizeMult = 1;
            let piercing = false;
            let shape = 'round';
            if (this.powerup.type === 'BIG') { dmg *= 3; bulletSizeMult = 3; shape = 'crescent'; }
            if (this.powerup.type === 'PIERCE') { piercing = true; }
            const impact15 = (meta.dmgLvl || 0) >= 15 && (this.isMain || this.trait.id !== 'sniper');
            const opts = { bulletSizeMult, piercing, shape };
            if (impact15) {
                opts.bigImpact = true;
                opts.sprite = 'BIGshot';
                if (this.powerup.type !== 'BIG') {
                    opts.bulletSizeMult = bulletSizeMult * 1.5;
                }
                if (this.powerup.type === 'BIG') {
                    opts.bulletSizeMult = Math.max(1, bulletSizeMult * 0.75);
                }
            }
            if (this.isMain) {
                const theme = getSkinTheme();
                opts.color = theme.primary;
                opts.skinKey = getSelectedSkin();
            }
            bullets.push(new Bullet(this.x, this.y - 10, target, dmg, this.type, spread, GAME.target, opts));
            if (impact15 && this.powerup.type === 'BIG') {
                try { console.log('[Bullet] Impact15 BIG shot created:', { bigImpact: !!opts.bigImpact, sizeMult: bulletSizeMult, shape }); } catch(_){}
            }
        }
        
        if(this.trait.id === 'sniper') GAME.shake = 4;
    }

    draw() {
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.beginPath(); ctx.ellipse(this.x, this.y+10, 15, 5, 0, 0, Math.PI*2); ctx.fill();

        ctx.shadowBlur = 15;
        if (party[0] === this) {
            const theme = getSkinTheme();
            ctx.shadowColor = theme.primary || C.colors[this.type.toLowerCase()];
            ctx.fillStyle = theme.primary || C.colors[this.type.toLowerCase()];
        } else {
            ctx.shadowColor = C.colors[this.type.toLowerCase()];
            ctx.fillStyle = C.colors[this.type.toLowerCase()];
        }
        
        let drawY = this.y + this.recoil;
        if (this.ultCharge >= 100) {
            ctx.save();
            ctx.globalCompositeOperation = 'lighter';
            const isPlayerUnit = (party[0] === this);
            const theme = isPlayerUnit ? getSkinTheme() : { primary: (C.colors[this.type.toLowerCase()] || '#fff'), accent: '#ffffff' };
            const glow = theme.primary || '#fff';
            const inner = 14;
            const outer = inner + 18;
            const grad = ctx.createRadialGradient(this.x, this.y, inner, this.x, this.y, outer);
            grad.addColorStop(0.00, hexToRgba(glow, 0.15));
            grad.addColorStop(0.35, hexToRgba(theme.accent || glow, 0.10));
            grad.addColorStop(0.70, hexToRgba(glow, 0.5));
            grad.addColorStop(1.00, hexToRgba(glow, 0.0));
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.arc(this.x, this.y, outer, 0, Math.PI*2);
            ctx.fill();
            ctx.restore();
        }

        const isPlayer = (party[0] === this);
        if (isPlayer) {
            const sel = getSelectedSkin();
            const img = SkinImages[sel] || SkinImages.DEFAULT;
            if (img && img.complete) {
                let angle = (typeof this.facingAngle === 'number') ? this.facingAngle : (-Math.PI/2);
                if (isValidTarget(GAME.target)) {
                    angle = Math.atan2(GAME.target.y - this.y, GAME.target.x - this.x);
                } else if (typeof this.lastMoveX === 'number' && typeof this.lastMoveY === 'number' && (Math.abs(this.lastMoveX) + Math.abs(this.lastMoveY) > 0.01)) {
                    angle = Math.atan2(this.lastMoveY, this.lastMoveX);
                }
                this.facingAngle = angle;
                const size = 30; 
                ctx.save();
                ctx.translate(this.x, drawY);
                ctx.rotate(angle + Math.PI/2);
                ctx.drawImage(img, -size/2, -size/2, size, size);
                ctx.restore();
            } else {
                drawPoly(this.x, drawY, 10, 4, Math.PI/4);
            }
        } else {
            if(this.type === 'Lydia') {
                const img = SkinImages.DEFAULT;
                if (img && img.complete) {
                    const size = 24;
                    ctx.save();
                    ctx.translate(this.x, drawY);
                    ctx.drawImage(img, -size/2, -size/2, size, size);
                    ctx.restore();
                } else {
                    drawPoly(this.x, drawY, 12, 3, 0);
                }
            } else if (this.type === 'Cybil') {
                const img = SkinImages.Cybil;
                if (img && img.complete) {
                    const size = 24;
                    ctx.save();
                    ctx.translate(this.x, drawY);
                    ctx.drawImage(img, -size/2, -size/2, size, size);
                    ctx.restore();
                } else {
                    ctx.beginPath(); ctx.arc(this.x, drawY, 10, 0, Math.PI*2); ctx.fill();
                }
            } else {
                const img = SkinImages.Sofia;
                if (img && img.complete) {
                    const size = 24;
                    ctx.save();
                    ctx.translate(this.x, drawY);
                    ctx.drawImage(img, -size/2, -size/2, size, size);
                    ctx.restore();
                } else {
                    drawPoly(this.x, drawY, 10, 4, Math.PI/4);
                }
            }
        }

        ctx.shadowBlur = 0;

        this.ultMeter += (this.ultCharge - this.ultMeter) * 0.08;
        const ultPct = Math.max(0, Math.min(1, this.ultMeter / 100));
        if (this.powerup.type && this.powerup.time > 0) {
            this.powerup.time -= GAME.dt / 60;
            if (this.powerup.time <= 0) {
                this.powerup.type = null; this.powerup.time = 0;
            }
        }
            if (!this.powerup.type) {
                this.gatSfxBurstLeft = 0;
                this.gatSfxTimer = 0;
            }

        const isPlayer2 = (party[0] === this);
        const healthR = isPlayer2 ? 20 : 18;
        const ultR = isPlayer2 ? 25 : 23;

        const hpPct = Math.max(0, Math.min(1, (this.hpDisplay !== undefined ? this.hpDisplay : this.hp) / this.maxHp));
        const mobile = (window.innerWidth <= 768) || ('ontouchstart' in window);
        function drawSolidRing(rad, track, progColor, pct, width) {
            const base = -Math.PI/2;
            ctx.lineWidth = width;
            ctx.lineCap = 'round';
            ctx.strokeStyle = track;
            ctx.beginPath(); ctx.arc(this.x, this.y, rad, 0, Math.PI*2); ctx.stroke();
            const capped = Math.max(0, Math.min(1, pct));
            ctx.strokeStyle = progColor;
            ctx.beginPath(); ctx.arc(this.x, this.y, rad, base, base + capped * Math.PI*2); ctx.stroke();
        }
        drawSolidRing.call(this, healthR, '#300', '#f00', hpPct, 3);
        const skinCol = (party[0] === this) ? getSkinTheme().primary : (C.colors[this.type.toLowerCase()] || '#f0f');
        drawSolidRing.call(this, ultR, '#111', skinCol, ultPct, 5);

        try {
            const now = performance.now();
            if (this._boostGlowUntil && now < this._boostGlowUntil) {
                ctx.save();
                ctx.globalCompositeOperation = 'lighter';
                const theme = getSkinTheme();
                const glow = theme.primary || '#fff';
                const inner = (isPlayer2 ? 18 : 16);
                const baseOuter = inner + 22;
                const windowMs = Math.max(1, this._boostGlowUntil - (this._boostStartTs || (this._boostGlowUntil - 500)));
                const remaining = Math.max(0, this._boostGlowUntil - now);
                const pct = Math.min(1, Math.max(0, remaining / windowMs));
                const outer = inner + 12 + 20 * pct;
                const a0 = 0.55 * pct;
                const a1 = 0.26 * pct;
                const ringA = 0.85 * pct;
                const grad = ctx.createRadialGradient(this.x, this.y, inner, this.x, this.y, outer);
                grad.addColorStop(0.00, hexToRgba(glow, a0));
                grad.addColorStop(0.60, hexToRgba(glow, a1));
                grad.addColorStop(1.00, hexToRgba(glow, 0.0));
                ctx.fillStyle = grad;
                ctx.beginPath();
                ctx.arc(this.x, this.y, outer, 0, Math.PI*2);
                ctx.fill();
                ctx.lineWidth = 6;
                ctx.strokeStyle = hexToRgba(glow, ringA);
                ctx.beginPath();
                ctx.arc(this.x, this.y, inner + 6, 0, Math.PI*2);
                ctx.stroke();
                ctx.restore();
            }
        } catch(_) {}

        if (this.beamActive) {
            let t = null;
            if (isValidTarget(GAME.target)) {
                t = GAME.target;
            } else {
                t = findClosestEnemy(this.x, this.y);
            }
            if (t) {
                const ang = Math.atan2(t.y - this.y, t.x - this.x);
                const dirX = Math.cos(ang), dirY = Math.sin(ang);
                const maxLen = Math.max(canvas.width, canvas.height) * 1.5;
                const endX = this.x + dirX * maxLen;
                const endY = this.y + dirY * maxLen;
                ctx.save();
                ctx.globalCompositeOperation = 'lighter';
                ctx.shadowBlur = 18;
                const bigBeamActive = (this.powerup.type === 'BIG' && this.powerup.time > 0 && (meta.rateLvl || 0) >= 15);
                const isPlayer = (party[0] === this);
                const baseCol = C.colors[this.type.toLowerCase()];
                const theme = isPlayer ? getSkinTheme() : { primary: baseCol, accent: baseCol };
                ctx.shadowColor = theme.accent || baseCol;
                ctx.strokeStyle = theme.accent || baseCol;
                ctx.lineWidth = bigBeamActive ? 32 : 8;
                ctx.beginPath();
                ctx.moveTo(this.x, this.y);
                ctx.lineTo(endX, endY);
                ctx.stroke();
                ctx.shadowBlur = 0;
                ctx.strokeStyle = theme.primary || '#fff';
                ctx.lineWidth = bigBeamActive ? 12 : 3;
                ctx.beginPath();
                ctx.moveTo(this.x, this.y);
                ctx.lineTo(endX, endY);
                ctx.stroke();
                ctx.globalCompositeOperation = 'source-over';
                ctx.restore();
            }
        }

        if (this.blackHoleActive && blackHoleImg && blackHoleImg.complete) {
            const r = this.blackHoleRadius;
            ctx.save();
            ctx.translate(this.x, this.y);
            ctx.rotate(this.blackHoleAngle); 
            ctx.globalCompositeOperation = 'lighter';
            ctx.globalAlpha = 0.85;
            const size = r * 2;
            ctx.drawImage(blackHoleImg, -size/2, -size/2, size, size);
            ctx.globalAlpha = 1;
            ctx.globalCompositeOperation = 'source-over';
            ctx.restore();
        }
    }
}

class Enemy {
    constructor(isBoss) {
        const BASE_HP = 25; 
        const HP_SCALING = 10; 
        const BASE_SPEED = 1.25; 
        const SPEED_SCALING = 0.1; 
        this.rank = isBoss ? 'BOSS' : 'minion';
        this._eid = (GAME._enemyIdCounter = (GAME._enemyIdCounter || 0) + 1);
        this.type = ['Lydia', 'Cybil', 'Sofia'][Math.floor(Math.random()*3)];
        
        this.maxHp = isBoss ? GAME.floor * 250 : BASE_HP + (GAME.floor * HP_SCALING);
        this.hp = this.maxHp;
        this.hpDisplay = this.hp; 
        this.x = Math.random() * (canvas.width - 60) + 30;
        this.y = C.spawnY;
        
        this.speed = isBoss ? (0.3 + GAME.floor * 0.05) : BASE_SPEED + (GAME.floor * SPEED_SCALING);
        
        this.size = isBoss ? 40 : 14;
        this.wobble = Math.random() * Math.PI;
        this.deadProcessed = false;
        if(isBoss) this.shootTimer = 0; 
        this.contactTimer = 0; 
        this.dotEffects = []; 
    }

    update() {
        const slowMult = (window.timeWarpActive) ? 0.7 : 1.0;
        this.y += this.speed * GAME.dt * slowMult;
        this.x += Math.sin(GAME.time * 0.05 + this.wobble) * 0.5 * (slowMult + 0.3);

        if(this.contactTimer > 0) this.contactTimer -= GAME.dt / 60;

        if (this.dotEffects && this.dotEffects.length) {
            const dtSec = GAME.dt / 60;
            for (let i = this.dotEffects.length - 1; i >= 0; i--) {
                const eff = this.dotEffects[i];
                eff.elapsed += dtSec;
                eff.tickAcc += dtSec;
                while (eff.tickAcc >= eff.tickInterval && eff.remaining > 0) {
                    eff.tickAcc -= eff.tickInterval;
                    const apply = Math.min(eff.perTick, eff.remaining);
                    this.hp -= apply;
                    try { spawnDamagePopup(this, apply, 'small'); } catch(_) {}
                    try { if (eff.color) createParticles(this.x, this.y, eff.color, 4); } catch(_) {}
                    eff.remaining -= apply;
                    if (this.hp <= 0) {
                        this.hp = 0;
                        if (!this.deadProcessed) {
                            this.deadProcessed = true;
                            this._remove = true;
                            try { playSfx('die'); } catch(_) {}
                            try { createRainbowExplosion(this.x, this.y, this.rank === 'BOSS' ? 40 : 40); } catch(_) {}
                            try { onEnemyKilled(this, 'DOT'); } catch(_) {}
                            if (GAME && GAME.target === this) GAME.target = null;
                        }
                        break;
                    }
                }
                if (eff.elapsed >= eff.duration || eff.remaining <= 0 || this.hp <= 0) {
                    this.dotEffects.splice(i, 1);
                }
            }
        }

        if(this.rank === 'BOSS') {
            const shootRateFrames = Math.max(50, 140 - GAME.floor * 5);
            const shootInterval = shootRateFrames / 90;
            this.shootTimer -= GAME.dt / 60;
            if(this.shootTimer <= 0 && party.length) {
                this.shootTimer = shootInterval;
                const tx = party[0].x, ty = party[0].y;
                const ang = Math.atan2(ty - this.y, tx - this.x);
                const spd = 3.2 + GAME.floor * 0.1;
                    bullets.push({
                    x: this.x, y: this.y,
                    vx: Math.cos(ang) * spd,
                    vy: Math.sin(ang) * spd,
                    enemyShot: true, color: '#f00', active: true,
                    ownerRank: 'BOSS',
                    baseRadius: 18, 
                    radius: 18,
                    age: 0,
                    growthDuration: 2.6,
                    trail: [],
                    trailMax: 22,
                    rot: 0,
                    blackHoleInfluence: 0,
                    update() {
                        this.trail.push({ x: this.x, y: this.y, r: this.radius });
                        if (this.trail.length > this.trailMax) this.trail.shift();

                        this.x += this.vx * GAME.dt;
                        this.y += this.vy * GAME.dt;
                        this.age += GAME.dt / 60;
                        this.rot -= 0.1 * GAME.dt; 
                        const progress = Math.min(1, this.age / this.growthDuration);
                        this.radius = this.baseRadius + (this.baseRadius * 2.8) * progress; 
                        if(party.length === 0) { this.active = false; return; }
                        for(let p of party) {
                            if(!p || p.hp <= 0) continue;
                            const d = Math.hypot(this.x - p.x, this.y - p.y);
                            const hitR = Math.max(6, this.radius * 0.6);
                            if(d < (p.size || 12) + hitR) {
                                const progress = Math.max(0, Math.min(1, this.age / this.growthDuration));
                                const base = 12 + GAME.floor * 0.8;
                                const scaled = Math.round(base * (1 + 2.8 * progress));
                                if (p.isMain && getSelectedSkin() === 'STARCORE') {
                                    const mult = SKIN_PERKS.STARCORE.armorMult || 0.75;
                                    const reduced = Math.max(1, Math.round(scaled * mult));
                                    {
                                        const invul = (party[0] && party[0]._boostInvulUntil && performance.now() < party[0]._boostInvulUntil);
                                        const apply = invul ? Math.round(reduced * 0.2) : reduced;
                                        p.hp -= apply;
                                    }
                                    spawnPlayerDamagePopup(p, reduced, true);
                                } else {
                                    {
                                        const invul = (party[0] && party[0]._boostInvulUntil && performance.now() < party[0]._boostInvulUntil);
                                        const apply = invul ? Math.round(scaled * 0.2) : scaled;
                                        p.hp -= apply;
                                    }
                                    spawnPlayerDamagePopup(p, scaled, true);
                                }
                                playSfx('hit');
                                GAME.shake = Math.max(GAME.shake, 5);
                                this.active = false;
                                break;
                            }
                        }
                        if(this.y > canvas.height+30 || this.x < -30 || this.x > canvas.width+30) this.active = false;
                    },
                    draw() {
                                        if (window.timeWarpActive) {
                                            ctx.save();
                                            ctx.globalAlpha = 0.7 + 0.2 * Math.sin(performance.now() / 80 + this.x);
                                            ctx.beginPath();
                                            ctx.arc(this.x, this.y, this.size + 10, 0, Math.PI*2);
                                            ctx.strokeStyle = '#ff00e6';
                                            ctx.lineWidth = 3;
                                            ctx.shadowColor = '#ff00e6';
                                            ctx.shadowBlur = 12;
                                            ctx.stroke();
                                            ctx.restore();
                                        }
                        ctx.save();
                        ctx.globalCompositeOperation = 'lighter';
                        if (this.trail && this.trail.length) {
                            for (let i = 0; i < this.trail.length; i++) {
                                const p = this.trail[i];
                                const t = i / this.trail.length;
                                let alpha = 0.08 + 0.18 * t;
                                alpha += 0.06 * Math.min(1, this.blackHoleInfluence || 0);
                                ctx.globalAlpha = alpha;
                                const s = Math.max(6, p.r * (0.5 + 0.3*t));
                                ctx.drawImage(fireballImg, this.x - s/2, this.y - s/2, s, s);
                            }
                            ctx.globalAlpha = 1;
                        }
                        ctx.translate(this.x, this.y);
                        ctx.rotate(this.rot);
                        const s = Math.max(12, this.radius * 1.2);
                        ctx.drawImage(fireballImg, -s/2, -s/2, s, s);
                        ctx.restore();
                    }
                });
            }
        }

        for(let p of party) {
            if(!p || p.hp <= 0) continue;
            const d = Math.hypot(this.x - p.x, this.y - p.y);
            if(d < this.size + (p.size || 12)) {
                if(this.contactTimer <= 0) {
                    const base = this.rank === 'BOSS' ? 60 : 40;
                    const scale = this.rank === 'BOSS' ? 5 : 2;
                    const dmg = base + (GAME.floor * scale);
                    if (p.isMain && getSelectedSkin() === 'STARCORE') {
                        const mult = SKIN_PERKS.STARCORE.armorMult || 0.75;
                        const reduced = Math.max(1, Math.round(dmg * mult));
                        {
                            const invul = (party[0] && party[0]._boostInvulUntil && performance.now() < party[0]._boostInvulUntil);
                            const apply = invul ? Math.round(reduced * 0.2) : reduced;
                            p.hp -= apply;
                        }
                        spawnPlayerDamagePopup(p, reduced, this.rank === 'BOSS');
                    } else {
                        {
                            const invul = (party[0] && party[0]._boostInvulUntil && performance.now() < party[0]._boostInvulUntil);
                            const apply = invul ? Math.round(dmg * 0.2) : dmg;
                            p.hp -= apply;
                        }
                        spawnPlayerDamagePopup(p, dmg, this.rank === 'BOSS');
                    }
                    playSfx('hit');
                    GAME.shake = Math.max(GAME.shake, this.rank === 'BOSS' ? 16 : 12);
                    this.contactTimer = 1.5;
                    if(p.hp <= 0) p.hp = 0;
                }
            }
        }

        if(this.y > C.laneY - 10) return 'CRASH';
        if (this.hpDisplay === undefined) this.hpDisplay = this.hp;
        if (this.hpDisplay > this.hp) {
            const diff = this.hpDisplay - this.hp;
            const step = Math.max(diff * 0.18 * GAME.dt, 0.6 * GAME.dt);
            this.hpDisplay = Math.max(this.hp, this.hpDisplay - step);
        } else if (this.hpDisplay < this.hp) {
            this.hpDisplay = this.hp;
        }
        return 'ALIVE';
    }

    draw() {
        ctx.shadowBlur = 10;
        ctx.shadowColor = (this.rank === 'BOSS') ? '#f00' : C.colors.enemy;
        ctx.fillStyle = (this.rank === 'BOSS') ? '#000' : '#111';
        ctx.strokeStyle = (this.rank === 'BOSS') ? '#f00' : C.colors.enemy;
        ctx.lineWidth = 2;

        ctx.beginPath();
        if(this.rank === 'BOSS') {
            drawPoly(this.x, this.y, this.size, 6, GAME.time * 0.02);
        } else {
            ctx.arc(this.x, this.y, this.size, 0, Math.PI*2);
        }
        ctx.fill();
        ctx.stroke();
        ctx.shadowBlur = 0;

        if (window.timeWarpActive) {
            ctx.save();
            ctx.globalCompositeOperation = 'lighter';
            const outerR = this.size + 28;
            const grad = ctx.createRadialGradient(this.x, this.y, this.size, this.x, this.y, outerR);
            grad.addColorStop(0.00, 'rgba(255,0,255,0.0)');
            grad.addColorStop(0.45, 'rgba(255,0,255,0.45)');
            grad.addColorStop(0.75, 'rgba(255,0,200,0.32)');
            grad.addColorStop(1.00, 'rgba(200,0,255,0.22)');
            ctx.strokeStyle = grad;
            ctx.lineWidth = 6;
            ctx.beginPath();
            ctx.arc(this.x, this.y, outerR - 6, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();
        }

        if(this === GAME.target) {
            const extra = (this.rank === 'BOSS') ? 28 : 14;
            const r = this.size + extra;
            ctx.lineWidth = (this.rank === 'BOSS') ? 4 : 4;
            const theme = (party && party[0]) ? getSkinTheme() : { primary: '#f0f' };
            ctx.strokeStyle = theme.primary || '#f0f';
            ctx.save();
            ctx.translate(this.x, this.y);
            ctx.setLineDash([12, 8]);
            ctx.lineDashOffset = -(GAME.time * 1);
            ctx.beginPath();
            ctx.arc(0, 0, r, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();
            ctx.setLineDash([]);
            ctx.lineDashOffset = 0;
        }

        const hpPct = Math.max(0, Math.min(1, (this.hpDisplay !== undefined ? this.hpDisplay : this.hp) / this.maxHp));
        const ringR = (this.rank === 'BOSS') ? this.size + 18 : this.size + 8;
        const lineW = (this.rank === 'BOSS') ? 7 : 5;
        const baseAng = -Math.PI / 2;
        const fullCirc = Math.PI * 2;
        ctx.lineWidth = lineW;
        ctx.lineCap = 'butt';
        if (hpPct > 0) {
            ctx.strokeStyle = '#f00';
            ctx.beginPath();
            if (hpPct >= 1) {
                ctx.arc(this.x, this.y, ringR, 0, fullCirc);
            } else {
                ctx.arc(this.x, this.y, ringR, baseAng, baseAng + hpPct * fullCirc);
            }
            ctx.stroke();
        }
        const missingPct = 1 - hpPct;
        if (missingPct > 0) {
            ctx.strokeStyle = '#300';
            ctx.beginPath();
            ctx.arc(this.x, this.y, ringR, baseAng + hpPct * fullCirc, baseAng + fullCirc);
            ctx.stroke();
        }
    }
}

class PowerupEntity {
    constructor() {
        this.x = Math.random() * (canvas.width - 60) + 30;
        this.y = C.spawnY;
        this.size = 14;
        this.speed = 5.0 + (GAME.floor * 0.05);
        this.wobble = Math.random() * Math.PI;
        const colors = ['#0ff', '#0ff', '#0ff', '#0ff', '#0ff'];
        this.color = colors[Math.floor(Math.random()*colors.length)];
        this.pickupRadius = this.size + 28;
    }
    update() {
        this.y += this.speed * GAME.dt;
        this.x += Math.sin(GAME.time * 0.05 + this.wobble) * 0.5;
        if(this.y > C.laneY - 10) return 'CRASH';
        return 'ALIVE';
    }
    draw() {
        ctx.shadowBlur = 12;
        ctx.shadowColor = this.color;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI*2);
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.strokeStyle = '#0ff';
        ctx.setLineDash([4, 4]);
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size + 6, 0, Math.PI*2);
        ctx.stroke();
        ctx.setLineDash([]);
    }
}

class Cannon {
    constructor(x, y, img, warship, isMiddle = false) {
        this.x = x;
        this.y = y;
        this.offsetX = x;
        this.offsetY = y;
        this.img = img;
        this.warship = warship;
        this.hp = 4000;
        this.maxHp = 4000;
        this.hpDisplay = 4000;
        this.baseSize = 64;
        this.size = this.baseSize;
        this.radius = this.size * 0.4;
        this.angle = 0;
        this.fireTimer = 0;
        this.fireRate = 60;
        this.recoil = 0;
        this.dead = false;
        this._cid = Math.random();
        this._eid = Math.random();
        this.rank = 'BOSS';
        this.isMiddle = isMiddle;
        this.spawnTimer = 0;
    }

    update() {
        if (this.dead) return;
        
        this.x = this.warship.x + this.offsetX;
        this.y = this.warship.y + this.offsetY;

        const hpDiff = this.hpDisplay - this.hp;
        if (Math.abs(hpDiff) > 0.1) {
            this.hpDisplay += (this.hp - this.hpDisplay) * 0.15;
        } else {
            this.hpDisplay = this.hp;
        }

        if (this.recoil > 0) {
            this.recoil -= 0.5 * GAME.dt;
            if (this.recoil < 0) this.recoil = 0;
        }

        if (this.isMiddle) {
            this.angle = 0;
            
            if (this.warship.settled) {
                const left = (this.warship && this.warship.cannons && this.warship.cannons[0]) ? this.warship.cannons[0] : null;
                const right = (this.warship && this.warship.cannons && this.warship.cannons[2]) ? this.warship.cannons[2] : null;
                let destroyedSides = 0;
                if (left && left.dead) destroyedSides++;
                if (right && right.dead) destroyedSides++;
                let baseInterval = 3;
                if (destroyedSides === 1) baseInterval = 2;
                else if (destroyedSides >= 2) baseInterval = 1;
                this.spawnTimer += GAME.dt / 60;
                if (this.spawnTimer >= baseInterval) {
                    this.spawnTimer = 0;
                    this.spawnEnemy();
                }
            }
        } else if (party.length > 0 && this.warship.settled) {
            const target = party[0];
            const dx = target.x - this.x;
            const dy = target.y - this.y;
            this.angle = Math.atan2(dy, dx) - Math.PI / 2;

            const aliveCannons = this.warship.cannons.filter(c => !c.dead).length;
            let rateMultiplier = 1;
            if (aliveCannons === 2) rateMultiplier = 0.8;
            else if (aliveCannons === 1) rateMultiplier = 0.64;
            
            this.fireTimer++;
            if (this.fireTimer >= this.fireRate * rateMultiplier) {
                this.fireTimer = 0;
                this.shoot(target);
            }
        }
    }

    shoot(target) {
        if (this.dead) return;
        const speed = 3;
        const dx = target.x - this.x;
        const dy = target.y - this.y;
        const dist = Math.sqrt(dx*dx + dy*dy);
        const vx = (dx / dist) * speed;
        const vy = (dy / dist) * speed;
        
        bullets.push(new Bullet(
            this.x,
            this.y,
            target,
            20,
            'warship',
            0,
            null,
            { vx, vy, enemy: true }
        ));
        
        this.recoil = 8;
        playSfx('cannon');
    }

    spawnEnemy() {
        if (this.dead) return;
        
        const spawnY = this.y + this.size * 0.5;
        const enemy = new Enemy(false);
        enemy.x = this.x;
        enemy.y = spawnY;
        enemy.speed *= 0.75;
        enemies.push(enemy);
        
        this.recoil = 8;
    }

    takeDamage(dmg) {
        if (this.dead) return;
        this.hp -= dmg;
        
        const warshipTop = {
            x: this.warship.x,
            y: this.warship.y - 10,
            size: 20,
            _cid: this._cid
        };
        spawnDamagePopup(warshipTop, dmg, 'small');
        
        if (this.hp <= 0) {
            this.hp = 0;
            this.dead = true;
            this.onDeath();
        }
    }

    onDeath() {
        playSfx('die');
        createRainbowExplosion(this.x, this.y, 30);
        GAME.shake = 10;
        
        if (GAME.target === this) {
            GAME.target = null;
        }
        
        if (GAME.warship) {
            GAME.warship.checkAllDestroyed();
        }
    }

    draw() {
        if (this.dead) return;

        const scaleRatio = this.warship.width / this.warship.baseImgW;
        this.size = this.baseSize * scaleRatio;
        this.radius = this.size * 0.4;

        const recoilOffset = this.recoil;
        const recoilAngle = this.angle - Math.PI / 2;
        const drawX = this.x - Math.cos(recoilAngle) * recoilOffset;
        const drawY = this.y - Math.sin(recoilAngle) * recoilOffset;

        ctx.save();
        ctx.translate(drawX, drawY);
        ctx.rotate(this.angle);
        
        if (this.img && this.img.complete) {
            ctx.drawImage(this.img, -this.size/2, -this.size/2, this.size, this.size);
        } else {
            ctx.fillStyle = '#888';
            ctx.fillRect(-this.size/2, -this.size/2, this.size, this.size);
        }
        
        ctx.restore();

        if (this === GAME.target) {
            const extra = 12;
            const r = (this.size * 0.6 + extra) * 0.85;
            ctx.lineWidth = 4;
            const theme = (party && party[0]) ? getSkinTheme() : { primary: '#f0f' };
            ctx.strokeStyle = theme.primary || '#f0f';
            ctx.save();
            ctx.translate(this.x, this.y);
            ctx.setLineDash([12, 8]);
            ctx.lineDashOffset = -(GAME.time * 1);
            ctx.beginPath();
            ctx.arc(0, 0, r, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();
            ctx.setLineDash([]);
            ctx.lineDashOffset = 0;
        }

        renderSmoothBar(
            this.x - 35,
            this.y + 55,
            70,
            8,
            this.hpDisplay,
            this.maxHp,
            '#00ff00'
        );
    }
}

class WarshipBoss {
    constructor() {
        this.x = BASE_W / 2;
        this.y = -200;
        this.targetY = 100;
        this.settled = false;
        this.dropSpeed = 1.5;
        this.baseImgW = 256;
        this.baseImgH = 64;
        this.width = BASE_W;
        this.height = (this.baseImgH / this.baseImgW) * this.width;
        this.backY = this.y - this.height;
        this.alpha = 1;
        this.exploding = false;
        this.explosionTimer = 0;
        
        const cannonSpacing = this.width / 3;
        this.cannons = [
            new Cannon(-cannonSpacing, this.height / 2, leftCannonImg, this, false),
            new Cannon(0, this.height / 2, midCannonImg, this, true),
            new Cannon(cannonSpacing, this.height / 2, rightCannonImg, this, false)
        ];
    }

    update() {
        if (this.exploding) {
            this.explosionTimer += GAME.dt;
            this.alpha = Math.max(0, 1 - this.explosionTimer / 60);
            
            if (this.explosionTimer >= 120) {
                if (!GAME.awaitingDraft) {
                    GAME.warship = null;
                    GAME.awaitingDraft = true;
                    GAME.postBossTimer = 3;
                    try { stopGunAudio(); } catch(_){}
                    try { LOOPING.stop('laser2'); } catch(_){}
                    GAME.gatAmbientTimer = 0;
                    GAME.shootAmbientTimer = 0;
                }
            }
            return;
        }

        if (!this.settled) {
            this.y += this.dropSpeed * GAME.dt;
            this.backY = this.y - this.height;
            
            if (this.y >= this.targetY) {
                this.y = this.targetY;
                this.backY = this.y - this.height;
                this.settled = true;
            }
        }

        for (let cannon of this.cannons) {
            if (!cannon.dead) {
                cannon.update();
            }
        }
    }

    checkAllDestroyed() {
        const allDead = this.cannons.every(c => c.dead);
        if (allDead && !this.exploding) {
            this.exploding = true;
            this.explosionTimer = 0;
            playSfx('die');
            createRainbowExplosion(this.x, this.y + this.height / 2, 50);
            GAME.shake = 20;
            GAME.essence = (GAME.essence || 0) + 1000;
            GAME.bossesSpawned = GAME.bossQuota;
            GAME.enemiesKilled = GAME.enemiesRequired + GAME.bossQuota;
        }
    }

    draw() {
        ctx.save();
        ctx.globalAlpha = this.alpha;

        if (warshipBackImg && warshipBackImg.complete) {
            ctx.drawImage(
                warshipBackImg,
                this.x - this.width / 2,
                this.backY,
                this.width,
                this.height
            );
        }

        if (warshipBossImg && warshipBossImg.complete) {
            ctx.drawImage(
                warshipBossImg,
                this.x - this.width / 2,
                this.y,
                this.width,
                this.height
            );
        }

        ctx.restore();

        for (let cannon of this.cannons) {
            if (!cannon.dead) {
                cannon.draw();
            }
        }
    }
}

class Bullet {
    constructor(x, y, target, dmg, type, spread, lockOnTarget = null, opts = {}) {
        this.x = x; this.y = y;
        this.prevX = x; this.prevY = y;
        this.dmg = dmg;
        this.enemy = !!opts.enemy;
        this.type = type;
        
        if (this.type === 'warship') {
            this.color = '#ff0000';
            this.vx = opts.vx || 0;
            this.vy = opts.vy || 4;
            this.w = 8;
            this.h = 22;
            this.trail = [];
            this.active = true;
            return;
        }
        
        this.color = opts.color || C.colors[type.toLowerCase()];
        this.active = true;
        this.sizeMult = opts.bulletSizeMult || 1;
        this.baseWidth = 3;
        this.width = this.baseWidth * this.sizeMult;
        this.growthRate = 0.2 * this.sizeMult;
        this.target = target;
        this.lockOnTarget = lockOnTarget;
        this.piercing = !!opts.piercing;
        this.shape = opts.shape || 'round';
        this.bigImpact = !!opts.bigImpact;
        this.sprite = opts.sprite || null;
        this.skinKey = opts.skinKey || null;
        if (this.shape === 'crescent') {
            this.multiHitWindow = 0.005; 
            this.multiHitTimer = 0;
            this.multiHitRemaining = 1; 
        }
        this.pierceChain = this.piercing;
        this.hitCount = 0;
        this.maxPierce = 3;
        this.hitTargets = [];
        const locked = (lockOnTarget !== null && target === lockOnTarget);
        let dx, dy;
        if (locked) {
            dx = target.x - x;
            dy = (target.y + 15) - y;
        } else {
            dx = (target.x + (Math.random()*10-5)) - x;
            dy = (target.y + 15) - y;
        }

        let baseSpread = spread;
        if (locked) baseSpread = 0;

        let angle = Math.atan2(dy, dx) + baseSpread;

        const BASE_SPREAD = 0.25;
        if (!locked) {
            angle += (Math.random() - 0.5) * BASE_SPREAD;
        }

        this.speed = 15;
        this.vx = Math.cos(angle) * this.speed;
        this.vy = Math.sin(angle) * this.speed;
        
        this.trail = []; 
    }

    update() {
        if (this.type === 'warship' && this.enemy) {
            this.x += this.vx * GAME.dt;
            this.y += this.vy * GAME.dt;
            
            this.trail.push({ x: this.x, y: this.y, life: 1 });
            if (this.trail.length > 15) this.trail.shift();
            for (let t of this.trail) {
                t.life -= 0.05 * GAME.dt;
            }
            
            for (let p of party) {
                const dx = this.x - p.x;
                const dy = this.y - p.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < 20) {
                    p.hp -= this.dmg;
                    spawnPlayerDamagePopup(p, this.dmg, false);
                    this.active = false;
                    createParticles(this.x, this.y, this.color, 8);
                    playSfx('hit');
                            if (p.hp <= 0) {
                                p.hp = 0;
                                if (p.isMain) {
                                    gameOver();
                                } else {
                                    try {
                                        p.deadProcessed = true;
                                        stopGunAudio();
                                        createRainbowExplosion(p.x, p.y, 40);
                                        playSfx('die');
                                        if (GAME.target === p) GAME.target = null;
                                    } catch(_){}
                                }
                            }
                    return;
                }
            }
            
            if (this.y > BASE_H + 50 || this.x < -50 || this.x > BASE_W + 50) {
                this.active = false;
            }
            return;
        }
        
        this.trail.push({x: this.x, y: this.y});
        if(this.trail.length > 3) this.trail.shift();

        const locked = (this.lockOnTarget && this.target === this.lockOnTarget);
        const shouldTrack = (locked || this.pierceChain) && this.target && isValidTarget(this.target);
        if (shouldTrack) {
            const dx = this.target.x - this.x;
            const dy = (this.target.y + 15) - this.y;
            const desired = Math.atan2(dy, dx);
            const current = Math.atan2(this.vy, this.vx);
            let diff = desired - current;
            while (diff > Math.PI) diff -= Math.PI * 2;
            while (diff < -Math.PI) diff += Math.PI * 2;
            const turnRate = (this.pierceChain ? 0.30 : 0.12) * GAME.dt;
            const newAngle = current + Math.max(-turnRate, Math.min(turnRate, diff));
            this.vx = Math.cos(newAngle) * this.speed;
            this.vy = Math.sin(newAngle) * this.speed;
        }

        this.prevX = this.x; this.prevY = this.y;
        this.x += this.vx * GAME.dt;
        this.y += this.vy * GAME.dt;

        const capMult = this.sizeMult > 1 ? 4 : 3;
        const maxWidth = this.baseWidth * capMult * this.sizeMult;
        this.width = Math.min(maxWidth, this.width + this.growthRate * GAME.dt);

        if(this.y < -50 || this.x < 0 || this.x > canvas.width) this.active = false;
        
        if (GAME.warship && GAME.warship.cannons) {
            for (let cannon of GAME.warship.cannons) {
                if (cannon.dead) continue;
                if ((this.pierceChain || this.shape === 'crescent') && this.hitTargets.includes(cannon)) continue;
                
                const dx = cannon.x - this.x;
                const dy = cannon.y - this.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                const hitPad = this.pierceChain ? Math.max(this.width || 3, 8) : Math.max(5 * this.sizeMult, (this.width || 3));
                
                if (dist < cannon.radius + hitPad) {
                    cannon.takeDamage(this.dmg);
                    createParticles(this.x, this.y, '#ff0000', 6);
                    playSfx('hit');
                    GAME.shake = Math.max(GAME.shake, 3);
                    
                    if (this.shape === 'crescent' || this.pierceChain) {
                        this.hitTargets.push(cannon);
                        if (this.pierceChain) {
                            this.hitCount++;
                            if (this.hitCount >= this.maxPierce) {
                                this.active = false;
                                break;
                            }
                        }
                    } else {
                        if (this.bigImpact) spawnCanvasExplosion(this.x, this.y, Math.max(20, 24 * (this.sizeMult || 1)), true, this.skinKey);
                        this.active = false;
                        return;
                    }
                }
            }
        }
        
        const secDelta = GAME.dt / 60;
        for(let e of enemies) {
            if(!e || e.hp <= 0) continue;
            if ((this.pierceChain || this.shape === 'crescent') && this.hitTargets.includes(e)) continue;

            let hit = false;
            if (this.shape === 'crescent') {
                const outerR = 18 * this.sizeMult;
                const innerR = outerR * 0.65;
                const span = 2.8; 
                const halfSpan = span / 2;
                const ex = e.x, ey = e.y;
                const dx = ex - this.x, dy = ey - this.y;
                const r = Math.hypot(dx, dy);
                if (r <= outerR + e.size && r >= Math.max(0, innerR - e.size)) {
                    const dirA = Math.atan2(this.vy, this.vx);
                    let ang = Math.atan2(dy, dx) - dirA;
                    while (ang > Math.PI) ang -= Math.PI * 2;
                    while (ang < -Math.PI) ang += Math.PI * 2;
                    const angularPad = 0.20; 
                    if (Math.abs(ang) <= halfSpan + angularPad) hit = true;
                }
            } else {
                const ax = this.prevX, ay = this.prevY;
                const bx = this.x, by = this.y;
                const ex = e.x, ey = e.y;
                const abx = bx - ax, aby = by - ay;
                const abLen2 = abx*abx + aby*aby || 1;
                const apx = ex - ax, apy = ey - ay;
                let tProj = (apx*abx + apy*aby) / abLen2;
                tProj = Math.max(0, Math.min(1, tProj));
                const closestX = ax + abx * tProj;
                const closestY = ay + aby * tProj;
                const dist = Math.hypot(ex - closestX, ey - closestY);
                const hitPad = this.pierceChain ? Math.max(this.width || 3, 8) : Math.max(5 * this.sizeMult, (this.width || 3));
                if (dist < e.size + hitPad) hit = true;
            }

            if(hit) {
                e.hp -= this.dmg;
                try { spawnDamagePopup(e, this.dmg, (this.shape === 'crescent') ? 'mid' : 'regular'); } catch(_){}
                playSfx('hit');
                GAME.shake = Math.max(GAME.shake, e.rank === 'BOSS' ? 4 : 2.5);
                createParticles(this.x, this.y, this.color, 3);
                try {
                    const selSkin = getSelectedSkin ? getSelectedSkin() : 'DEFAULT';
                    if (selSkin && selSkin !== 'DEFAULT') {
                        const total = Math.max(1, Math.round(this.dmg * 0.05));
                        const duration = 3.0;
                        const tickInterval = 0.5; 
                        const ticks = Math.max(1, Math.round(duration / tickInterval));
                        const perTick = Math.max(1, Math.floor(total / ticks));
                        const leftover = total - perTick * ticks;
                        const theme = getSkinTheme ? getSkinTheme() : { primary: '#ff9900' };
                        e.dotEffects.push({
                            duration,
                            elapsed: 0,
                            tickInterval,
                            tickAcc: 0,
                            perTick,
                            remaining: total,
                            color: theme.primary,
                        });
                        const last = e.dotEffects[e.dotEffects.length - 1];
                        last.tickAcc = Math.min(last.tickInterval * 0.6, last.tickInterval);
                    }
                } catch(_) {}
                if(e.hp <= 0 && !e.deadProcessed) {
                    e.deadProcessed = true;
                    playSfx('die');
                    GAME.shake = Math.max(GAME.shake, e.rank === 'BOSS' ? 14 : 7);
                    createRainbowExplosion(e.x, e.y, e.rank === 'BOSS' ? 25 : 25);
                    onEnemyKilled(e, 'PROJECTILE');
                    if(GAME.target === e) GAME.target = null;
                }
                if (this.shape === 'crescent' || this.pierceChain) this.hitTargets.push(e);

                if(this.pierceChain) {
                    this.hitTargets.push(e);
                    this.hitCount++;
                    if (this.hitCount >= this.maxPierce) {
                        this.active = false;
                        break;
                    }
                    let next = null, bestD = Infinity;
                    for (let cand of enemies) {
                        if(!cand || cand.hp <= 0 || this.hitTargets.includes(cand)) continue;
                        const d2 = (cand.x - this.x)**2 + (cand.y - this.y)**2;
                        if(d2 < bestD) { bestD = d2; next = cand; }
                    }
                    if (next) {
                        this.target = next;
                    } else {
                        if (this.bigImpact) spawnCanvasExplosion(this.x, this.y, Math.max(20, 24 * (this.sizeMult || 1)), true);
                        this.active = false;
                        break;
                    }
                } else if (this.shape === 'crescent') {
                    if (this.multiHitRemaining > 0) {
                        this.multiHitTimer = Math.max(this.multiHitTimer || 0, this.multiHitWindow);
                        this.multiHitRemaining--;
                    } else {
                        if (this.bigImpact) spawnCanvasExplosion(this.x, this.y, Math.max(20, 24 * (this.sizeMult || 1)), true, this.skinKey);
                        this.active = false;
                        break;
                    }
                } else {
                    if (this.bigImpact) spawnCanvasExplosion(this.x, this.y, Math.max(20, 24 * (this.sizeMult || 1)), true, this.skinKey);
                    this.active = false;
                    break;
                }
            }
        }
        if (this.shape === 'crescent' && (this.multiHitTimer || 0) > 0) {
            this.multiHitTimer -= secDelta;
            if (this.multiHitTimer <= 0 && this.multiHitRemaining <= 0) {
                if (this.bigImpact) spawnCanvasExplosion(this.x, this.y, Math.max(20, 24 * (this.sizeMult || 1)), true, this.skinKey);
                this.active = false;
            }
        }
    }

    draw() {
        if (this.type === 'warship' && this.enemy) {
            const angle = Math.atan2(this.vy, this.vx) + Math.PI / 2;
            
            for (let t of this.trail) {
                if (t.life > 0) {
                    ctx.save();
                    ctx.translate(t.x, t.y);
                    ctx.rotate(angle);
                    ctx.shadowBlur = 20;
                    ctx.shadowColor = 'rgba(255, 0, 0, 0.8)';
                    ctx.fillStyle = `rgba(255, 0, 0, ${t.life * 0.5})`;
                    ctx.beginPath();
                    ctx.ellipse(0, 0, this.w / 2, this.h / 2, 0, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.restore();
                }
            }
            
            ctx.save();
            ctx.translate(this.x, this.y);
            ctx.rotate(angle);
            ctx.shadowBlur = 25;
            ctx.shadowColor = 'rgba(255, 0, 0, 1)';
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.ellipse(0, 0, this.w / 2, this.h / 2, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
            ctx.shadowBlur = 0;
            return;
        }
        
        const isCrescent = (this.shape === 'crescent');
        if (this.bigImpact && BIGshotImg) {
            const ang = Math.atan2(this.vy, this.vx);
            const outerR = 18 * this.sizeMult;
            ctx.save();
            ctx.translate(this.x, this.y);
            ctx.rotate(ang + Math.PI/2);
            ctx.globalCompositeOperation = 'lighter';
            const imgMap = this.skinKey ? (SKIN_SPRITES[this.skinKey] || SKIN_SPRITES.DEFAULT) : SKIN_SPRITES.DEFAULT;
            const img = imgMap.bigshot || BIGshotImg;
            const w = outerR * 2.2;
            const h = outerR * 2.2;
            ctx.drawImage(img, -w/2, -h/2, w, h);
            ctx.restore();
            try { if (!BIGshotImgLoaded) console.warn('[Bullet] BIGshot drawn before load complete'); } catch(_){}
            return;
        }
        if (isCrescent) {
            const ang = Math.atan2(this.vy, this.vx);
            const outerR = 18 * this.sizeMult;
            ctx.save();
            ctx.translate(this.x, this.y);
            ctx.rotate(ang + Math.PI/2); 
            ctx.globalCompositeOperation = 'lighter';
            const imgMap = this.skinKey ? (SKIN_SPRITES[this.skinKey] || SKIN_SPRITES.DEFAULT) : SKIN_SPRITES.DEFAULT;
            const cimg = imgMap.crescent || crescentImg;
            if (cimg && cimg.complete && cimg.naturalWidth) {
                const w = outerR * 2.2;
                const h = outerR * 2.2;
                ctx.drawImage(cimg, -w/2, -h/2, w, h);
            } else {
                const innerR = outerR * 0.65;
                const span = 2.8;
                const start = -span/2;
                const end = span/2;
                ctx.fillStyle = this.color;
                ctx.beginPath();
                ctx.arc(0, 0, outerR, start, end);
                ctx.arc(0, 0, innerR, end, start, true);
                ctx.closePath();
                ctx.fill();
            }
            ctx.restore();
        } else {
            ctx.globalCompositeOperation = 'lighter';
            ctx.strokeStyle = this.color;
            ctx.lineWidth = this.width;
            ctx.beginPath();
            if(this.trail.length > 0) ctx.moveTo(this.trail[0].x, this.trail[0].y);
            ctx.lineTo(this.x, this.y);
            ctx.stroke();
            ctx.globalCompositeOperation = 'source-over';
        }
    }
}

function isValidTarget(target) {
    if (!target) return false;
    if (target.dead) return false;
    if (target.hp !== undefined && target.hp <= 0) return false;
    if (target._cid) return !target.dead;
    if (target._eid) return enemies.includes(target) && target.hp > 0;
    return false;
}

function findClosestEnemy(x, y) {
    let closest = null;
    let minD = Infinity;
    for(let e of enemies) {
        let d = (e.x - x)**2 + (e.y - y)**2;
        if(d < minD) { minD = d; closest = e; }
    }
    
    if (GAME.warship && GAME.warship.cannons) {
        for (let cannon of GAME.warship.cannons) {
            if (cannon.dead) continue;
            let d = (cannon.x - x)**2 + (cannon.y - y)**2;
            if(d < minD) { minD = d; closest = cannon; }
        }
    }
    
    return closest;
}

function createParticles(x, y, color, count) {
    for(let i=0; i<count; i++) {
        const vx = (Math.random()-0.5)*10;
        const vy = (Math.random()-0.5)*10;
        emitParticle(x, y, vx, vy, 1.0, 0.05, 3, color);
    }
}

function createRainbowExplosion(x, y, count) {
    for (let i = 0; i < count; i++) {
        const hue = Math.floor(Math.random() * 360);
        const color = `hsl(${hue}, 100%, 55%)`;
        const vx = (Math.random()-0.5) * 6;
        const vy = (Math.random()-0.5) * 6;
        const size = 3 + Math.random()*2;
        emitParticle(x, y, vx, vy, 1.8, 0.035, size, color);
    }
}

function spawnDamagePopup(enemy, amount, category = 'regular') {
    if (!enemy) return;
    const eid = enemy._eid || enemy._cid;
    if (!eid) return;
    const baseSize = category === 'large' ? 20 : (category === 'mid' ? 14 : 9);
    const scale = Math.min((enemy.size || 14) / 14, 2.2);
    const fontSize = Math.max(14, Math.round(baseSize * scale));
    const life = category === 'large' ? 1.1 : 0.8;
    const val = Math.max(1, Math.round((amount || 0) * 99));
    const startX = enemy.x + (enemy.size || 14) * 0.7;
    const startY = enemy.y - (enemy.size || 14) * 0.9;
    const perEnemy = textPopups.filter(p => p.enemyId === eid);
    if (perEnemy.length >= 8) {
        let oldestIdx = -1;
        let oldestT = Infinity;
        for (let i = 0; i < textPopups.length; i++) {
            const p = textPopups[i];
            if (p.enemyId !== eid) continue;
            if (p.t < oldestT) { oldestT = p.t; oldestIdx = i; }
        }
        if (oldestIdx >= 0) textPopups.splice(oldestIdx, 1);
    }
    let color = '#00ffff';
    if (category === 'mid') color = '#ffff00';
    else if (category === 'large') color = '#ff00ff';
    textPopups.push({
        enemyId: eid,
        x0: startX,
        y0: startY,
        size:fontSize,
        life,
        age: 0,
        t: 0,
        txt: String(val),
        color,
        category
    });
}

function spawnPlayerDamagePopup(pet, amount, critical = false) {
    if (!pet) return;
    const baseSize = critical ? 22 : 18;
    const scale = 1.0;
    const fontSize = Math.max(10, Math.round(baseSize * scale));
    const life = critical ? 1.0 : 0.8;
    const val = Math.max(1, Math.round((amount || 0) * 99));
    const startX = pet.x + 10;
    const startY = pet.y - 18;
    const perUnit = textPopups.filter(p => p.playerId === 1); 
    if (perUnit.length >= 8) {
        let oldestIdx = -1;
        let oldestT = Infinity;
        for (let i = 0; i < textPopups.length; i++) {
            const p = textPopups[i];
            if (p.playerId !== 1) continue;
            if (p.t < oldestT) { oldestT = p.t; oldestIdx = i; }
        }
        if (oldestIdx >= 0) textPopups.splice(oldestIdx, 1);
    }
    textPopups.push({
        playerId: 1,
        x0: startX,
        y0: startY,
        size: fontSize,
        life,
        age: 0,
        t: 0,
        txt: String(val),
        color: critical ? '#ff0000' : '#ff6666',
        category: critical ? 'large' : 'mid'
    });
}

function drawPoly(x, y, r, sides, rotate) {
    ctx.beginPath();
    for (let i = 0; i < sides; i++) {
        const angle = (i * 2 * Math.PI / sides) - Math.PI / 2 + rotate;
        const px = x + r * Math.cos(angle);
        const py = y + r * Math.sin(angle);
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
}

function hexToRgba(hex,a){
    let h = hex.replace('#','');
    if(h.length===3) h = h.split('').map(c=>c+c).join('');
    const num = parseInt(h,16);
    const r=(num>>16)&255, g=(num>>8)&255, b=num&255;
    return `rgba(${r},${g},${b},${(a||0).toFixed(3)})`;
}

function renderBar(x, y, w, h, pct, color) {
    ctx.fillStyle = '#f0f';
    ctx.fillRect(x, y, w, h);
    ctx.fillStyle = color;
    ctx.fillRect(x, y, Math.max(0, w * pct), h);
}

function renderSmoothBar(x, y, w, h, currentHp, maxHp, color) {
    const pct = Math.max(0, Math.min(1, currentHp / maxHp));
    ctx.fillStyle = 'rgba(40, 40, 40, 0.8)';
    ctx.fillRect(x, y, w, h);
    ctx.fillStyle = color;
    ctx.fillRect(x, y, Math.max(0, w * pct), h);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 1;
    ctx.strokeRect(x, y, w, h);
}

function drawSegmentedRing(cx, cy, radius, trackColor, segCount, segGapRad, lineWidth, progressPct, progressColor) {
    const full = Math.PI * 2;
    const pct = Math.max(0, Math.min(0.985, progressPct));
    const per = full / segCount;
    const segArcSpan = Math.max(0, per - segGapRad);
    const base = -Math.PI / 2;
    ctx.lineWidth = lineWidth;
    ctx.lineCap = 'butt';
    ctx.setLineDash([]);

    ctx.strokeStyle = trackColor;
    for (let i = 0; i < segCount; i++) {
        const start = base + i * per + segGapRad * 0.5;
        const end = start + segArcSpan;
        ctx.beginPath();
        ctx.arc(cx, cy, radius, start, end);
        ctx.stroke();
    }

    let remainingAngle = full * pct; 
    if (remainingAngle <= 0) return;
    ctx.strokeStyle = progressColor;
    for (let i = 0; i < segCount && remainingAngle > 0; i++) {
        const start = base + i * per + segGapRad * 0.5;
        const end = start + segArcSpan;
        const span = segArcSpan;
        if (remainingAngle >= span) {
            ctx.beginPath();
            ctx.arc(cx, cy, radius, start, end);
            ctx.stroke();
            remainingAngle -= span;
        } else {
            ctx.beginPath();
            ctx.arc(cx, cy, radius, start, start + remainingAngle);
            ctx.stroke();
            remainingAngle = 0;
        }
    }
    ctx.setLineDash([]);
}

function toCanvasCoords(clientX, clientY) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = BASE_W / rect.width;
    const scaleY = BASE_H / rect.height;
    const x = (clientX - rect.left) * scaleX;
    const y = (clientY - rect.top) * scaleY;
    return { x, y };
}

const bgSpace = new Image(); bgSpace.src = 'images/space.png';
const bgStars = new Image(); bgStars.src = 'images/stars.png';
const bgStars2 = new Image(); bgStars2.src = 'images/stars2.png';
const fireballImg = new Image(); fireballImg.src = 'images/Fireball.png';
const crescentImg = new Image(); crescentImg.src = 'images/crescent.png';
let BIGshotImgLoaded = false;
const BIGshotImg = new Image();
BIGshotImg.onload = () => { BIGshotImgLoaded = true; try { console.log('[Assets] BIGshot.png loaded'); } catch(_){} };
BIGshotImg.onerror = () => { try { console.warn('[Assets] BIGshot.png failed to load at images/BIGshot.png'); } catch(_){} };
BIGshotImg.src = 'images/BIGshot.png';

let aftershockImgLoaded = false;
const aftershockImg = new Image();
aftershockImg.onload = () => { aftershockImgLoaded = true; try { console.log('[Assets] aftershock.png loaded'); } catch(_){} };
aftershockImg.onerror = () => { try { console.warn('[Assets] aftershock.png failed to load at images/aftershock.png'); } catch(_){} };
aftershockImg.src = 'images/aftershock.png';
const blackHoleImg = new Image(); blackHoleImg.src = 'images/BlackHole.png';
let starsOffset = 0;
let stars2Offset = 0;
const starBIGshotImg = new Image(); starBIGshotImg.src = 'images/starBIGshot.png';
const moonBIGshotImg = new Image(); moonBIGshotImg.src = 'images/moonBIGshot.png';
const darkBIGshotImg = new Image(); darkBIGshotImg.src = 'images/darkBIGshot.png';
const starCrescentImg = new Image(); starCrescentImg.src = 'images/starcrescent.png';
const moonCrescentImg = new Image(); moonCrescentImg.src = 'images/mooncrescent.png';
const darkCrescentImg = new Image(); darkCrescentImg.src = 'images/darkcrescent.png';
const starAftershockImg = new Image(); starAftershockImg.src = 'images/staraftershock1.png';
const moonAftershockImg = new Image(); moonAftershockImg.src = 'images/moonaftershock1.png';
const darkAftershockImg = new Image(); darkAftershockImg.src = 'images/darkaftershock1.png';

const warshipBossImg = new Image(); warshipBossImg.src = 'first-boss/BOSS.png';
const warshipBackImg = new Image(); warshipBackImg.src = 'first-boss/BOSS_BACK.png';
const leftCannonImg = new Image(); leftCannonImg.src = 'first-boss/L_CANNON.png';
const midCannonImg = new Image(); midCannonImg.src = 'first-boss/M_CANNON.png';
const rightCannonImg = new Image(); rightCannonImg.src = 'first-boss/R_CANNON.png';

const SKIN_SPRITES = {
    DEFAULT: { bigshot: BIGshotImg, crescent: crescentImg, aftershock: aftershockImg },
    STARCORE: { bigshot: starBIGshotImg, crescent: starCrescentImg, aftershock: starAftershockImg },
    MOONLIGHT: { bigshot: moonBIGshotImg, crescent: moonCrescentImg, aftershock: moonAftershockImg },
    DARKMATTER: { bigshot: darkBIGshotImg, crescent: darkCrescentImg, aftershock: darkAftershockImg }
};
function drawBackground() {
    ctx.fillStyle = '#08080c';
    ctx.fillRect(0,0,canvas.width,canvas.height);

    const canDraw = (img) => !!(img && img.complete && (img.naturalWidth || 0) > 0);

    try {
        if (canDraw(bgSpace)) {
            ctx.drawImage(bgSpace, 0, 0, canvas.width, canvas.height);
        }
    } catch (_) { }

    try {
        if (canDraw(bgStars)) {
            const h = bgStars.naturalHeight || bgStars.height || 64;
            starsOffset = (starsOffset + 0.6) % h;
            ctx.save();
            ctx.globalAlpha = 0.55;
            for (let y = -h + starsOffset; y < canvas.height; y += h) {
                ctx.drawImage(bgStars, 0, y, canvas.width, h);
            }
            ctx.restore();
        }
    } catch (_) { }

    try {
        if (canDraw(bgStars2)) {
            const h2 = bgStars2.naturalHeight || bgStars2.height || 64;
            stars2Offset = (stars2Offset + 1.0) % h2;
            ctx.save();
            ctx.globalAlpha = 0.75;
            for (let y = -h2 + stars2Offset; y < canvas.height; y += h2) {
                ctx.drawImage(bgStars2, 0, y, canvas.width, h2);
            }
            ctx.restore();
        }
    } catch (_) { }
}

function getJoyCenter() {
    const x = ACCESS.joyRight ? (canvas.width - (JOY.radius + 20)) : (JOY.radius + 20);
    return { x, y: C.laneY };
}


function loop() {
    if(GAME.state !== 'PLAY') { activeFrame = null; return; }
    activeFrame = requestAnimationFrame(loop);

    const now = performance.now();
    const rawDtMs = now - GAME.lastTs;
    GAME.lastTs = now;
    const dtFrames = Math.min(3, rawDtMs / 16.6667);
    const timeScale = (GAME.deathTimer > 0) ? 0.25 : 1; 
    GAME.dt = dtFrames * timeScale;
    GAME.dtMs = rawDtMs * timeScale; 
    const realSec = rawDtMs / 1000;
    GAME.frame++;
    GAME.time++;
    
    ctx.fillStyle = '#08080c';
    if(GAME.shake > 0) {
        ctx.save();
        const shakeScale = (ACCESS.shakeLevel === 1)?0.5:(ACCESS.shakeLevel===2?0.75:(ACCESS.shakeLevel===3?1.0:(ACCESS.shakeLevel===4?1.3:1.6)));
        let dx = (Math.random()-0.5)*GAME.shake*2*shakeScale;
        let dy = (Math.random()-0.5)*GAME.shake*2*shakeScale;
        ctx.translate(dx, dy);
        GAME.shake *= 0.9;
        if(GAME.shake < 0.5) GAME.shake = 0;
    }
    ctx.fillRect(0,0, canvas.width, canvas.height);

    drawBackground();

    let bossIsPresent = enemies.some(e => e.rank === 'BOSS');

    if (GAME.enemiesKilled < GAME.enemiesRequired) {
        if (GAME.enemiesSpawned < GAME.enemiesRequired) {
            if(GAME.spawnTimer <= 0) {
                let spawnRateFrames = Math.max(20, 80 - (GAME.floor * 2));
                let intervalSec = spawnRateFrames / 60;
                enemies.push(new Enemy(false));
                GAME.enemiesSpawned++;
                GAME.spawnTimer = intervalSec;
            } else {
                GAME.spawnTimer -= GAME.dt / 60; 
            }
        }
    } else if (!bossIsPresent && GAME.bossesSpawned < GAME.bossQuota && !GAME.warship && GAME.enemiesKilled >= GAME.enemiesRequired) {
        if (!GAME._pendingBossWarning) {
            GAME._pendingBossWarning = true;
            const warnEl = document.getElementById('boss-warning');
            if (warnEl) warnEl.classList.remove('hidden');
            playSfx('warning');
            setTimeout(() => {
                if (warnEl) warnEl.classList.add('hidden');
                if (GAME.floor === 5 && !GAME.warship && GAME.enemiesKilled >= GAME.enemiesRequired) {
                    playSfx('laser4');
                    GAME.warship = new WarshipBoss();
                    GAME.bossesSpawned = GAME.bossQuota;
                    GAME._warshipSpawned = true;
                } else if (!enemies.some(e => e.rank === 'BOSS') && GAME.bossesSpawned < GAME.bossQuota && GAME.floor !== 5) {
                    enemies.push(new Enemy(true));
                    GAME.bossesSpawned++;
                }
                GAME._pendingBossWarning = false;
            }, 1500);
        }
    }
    if (GAME.powerupsSpawned < GAME.powerupQuota) {
        GAME.powerupSpawnTimer -= GAME.dt / 60;
        if (GAME.powerupSpawnTimer <= 0) {
            spawnSpacedPowerup();
            GAME.powerupsSpawned++;
            GAME.powerupSpawnTimer = 6 + (powerups.length * 2) + Math.random()*1.5; 
        }
    }
    if (window.timeWarpActive) {
        window.timeWarpTimer -= GAME.dt / 60;
        if (window.timeWarpTimer <= 0) {
            window.timeWarpActive = false;
            window.timeWarpTimer = 0;
            try { playSfx('powerdown'); } catch(_) {}
        }
    }
    if (GAME.bossesSpawned >= GAME.bossQuota && !bossIsPresent && !GAME.warship && GAME.enemiesKilled >= GAME.enemiesRequired + GAME.bossQuota && !GAME.awaitingDraft) {
        GAME.awaitingDraft = true;
        GAME.postBossTimer = 3;
        try { stopGunAudio(); } catch(_){}
        LOOPING.stop('laser2');
        GAME.gatAmbientTimer = 0;
        GAME.shootAmbientTimer = 0;
    }
    if (GAME.awaitingDraft) {
        GAME.postBossTimer -= GAME.dt / 60; 
        if (GAME.postBossTimer <= 0) {
            GAME.awaitingDraft = false;
            GAME.postBossTimer = 0;
            MUSIC.stop({ fadeOutMs: 1000 });
            showDraft();
            return;
        }
    }

    if (GAME.warship) {
        GAME.warship.update();
        if (GAME.warship) {
            GAME.warship.draw();
        }
    }

    for(let i=enemies.length-1; i>=0; i--) {
        let res = enemies[i].update();
            if(res === 'CRASH') {
            playSfx('die');
            createParticles(enemies[i].x, enemies[i].y, C.colors.enemy, 8);
            if (party[0]) {
                let breachDmg = (enemies[i].rank === 'BOSS') ? 80 : 20;
                if (getSelectedSkin() === 'STARCORE') {
                    const mult = SKIN_PERKS.STARCORE.armorMult || 0.75;
                    breachDmg = Math.round(breachDmg * mult);
                }
                const p0 = party[0];
                const invul = (p0 && p0._boostInvulUntil && performance.now() < p0._boostInvulUntil);
                const applied = invul ? Math.round(breachDmg * 0.2) : breachDmg; 
                party[0].hp -= applied;
                playSfx('hit');
                GAME.shake = Math.max(GAME.shake, invul ? 3 : 5);
            }
            enemies[i]._remove = true;
            onEnemyKilled(enemies[i], 'CRASH');
        } else if (enemies[i].hp <= 0 && enemies[i].deadProcessed) {
            createParticles(enemies[i].x, enemies[i].y, C.colors.enemy, 8);
            enemies[i]._remove = true;
        } else {
            enemies[i].draw();
        }
    }
    {
        let w = 0;
        for (let i = 0; i < enemies.length; i++) {
            const e = enemies[i];
            if (!e || e._remove) continue;
            enemies[w++] = e;
        }
        enemies.length = w;
    }

    for(let i=powerups.length-1; i>=0; i--) {
        const res = powerups[i].update();
        const p = party[0];
        if (p && p.hp > 0) {
            const hitR = powerups[i].pickupRadius || (powerups[i].size + (p.size || 12));
            const d = Math.hypot(powerups[i].x - p.x, powerups[i].y - p.y);
            if (d < hitR) {
                grantRandomPowerup(p);
                powerups[i]._remove = true;
                continue;
            }
        }
        if (res === 'CRASH') {
            powerups[i]._remove = true;
        } else {
            let granted = false;
            for(let b of bullets) {
                const d = Math.hypot(b.x - powerups[i].x, b.y - powerups[i].y);
                const bulletPickupR = powerups[i].pickupRadius ? powerups[i].pickupRadius * 0.75 : (powerups[i].size + Math.max(5, (b.width||3)));
                if (d < bulletPickupR) {
                    grantRandomPowerup(party[0]);
                    granted = true;
                    b.active = false;
                    break;
                }
            }
            if (granted) { powerups[i]._remove = true; continue; }
            powerups[i].draw();
        }
    }
    {
        let w = 0;
        for (let i = 0; i < powerups.length; i++) {
            const pu = powerups[i];
            if (!pu || pu._remove) continue;
            powerups[w++] = pu;
        }
        powerups.length = w;
    }

    for (let k = 1; k < party.length; k++) {
        const ally = party[k];
        if (ally && ally.hp <= 0 && !ally.deadProcessed) {
            ally.deadProcessed = true;
            stopGunAudio();
            createRainbowExplosion(ally.x, ally.y, 40);
            playSfx('die');
            if (GAME.target === ally) GAME.target = null;
        }
    }

    if(!party[0] || party[0].hp <= 0) {
        if (GAME.deathTimer <= 0) {
            GAME.deathTimer = 3; 
            stopGunAudio();
            MUSIC.stop({ fadeOutMs: 3000 });
            const p0 = party[0];
            if (p0 && !p0.deadProcessed) {
                p0.deadProcessed = true;
                createRainbowExplosion(p0.x, p0.y, 60);
                playSfx('die');
                if (GAME.target === p0) GAME.target = null;
            }
        }
    } else {
        applyPlayerMovement();
        drawPlayerTrail(realSec);
        party.forEach((p, idx) => { if(p.hp > 0) { p.update(idx, party.length); p.draw(); } });
    }

    for(let i=0; i<bullets.length; i++) {
        const b = bullets[i];
        b.update();
        if (!b.active) { b._remove = true; continue; }
        b.draw();
    }
    {
        let w = 0;
        for (let i = 0; i < bullets.length; i++) {
            const b = bullets[i];
            if (!b || b._remove) continue;
            bullets[w++] = b;
        }
        bullets.length = w;
    }

    for(let i=0; i<particles.length; i++) {
        let p = particles[i];
        if (!p || !p.active) continue;
        p.x += p.vx; p.y += p.vy; 
        const fade = (p.fade !== undefined ? p.fade : 0.05);
        p.life -= fade;
        const alpha = Math.min(1, p.life);
        ctx.globalAlpha = alpha;
        ctx.fillStyle = p.color;
        const size = p.size || 3;
        ctx.fillRect(p.x - size/2, p.y - size/2, size, size);
        ctx.globalAlpha = 1;
        if(p.life <= 0) { p.active = false; particleFreeList.push(i); }
    }

    for (let i = 0; i < blooms.length; i++) {
        const b = blooms[i];
        if (b.maxRadius) {
            b.life -= realSec * (b.slow ? 0.55 : 0.95);
            if (b.life <= 0) { b._remove = true; continue; }
            const remainingPct = b.life / b.maxLife;
            const elapsedPct = 1 - remainingPct;
            const growthFactor = b.slow ? 0.04 : 0.10;
            b.radius = b.radius + (b.maxRadius - b.radius) * growthFactor * GAME.dt;
            b.pulse += (realSec * 6);
            const pulseScale = 1 + Math.sin(b.pulse) * 0.07 * remainingPct;
            const baseAlpha = (b.slow ? 0.85 : 0.65) * remainingPct;
            const grad = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, b.radius);
            const c0 = b.colors[0] || '#0ff';
            const c1 = b.colors[1] || '#00f';
            const c2 = b.colors[2] || '#0ff';
            grad.addColorStop(0.00, hexToRgba(c0, baseAlpha));
            grad.addColorStop(0.45, hexToRgba(c1, baseAlpha*0.85));
            grad.addColorStop(0.78, hexToRgba(c2, baseAlpha*0.55));
            grad.addColorStop(1.00, hexToRgba('#000', 0));
            ctx.save();
            ctx.globalCompositeOperation = 'lighter';
            ctx.fillStyle = grad;
            ctx.beginPath(); ctx.arc(b.x, b.y, b.radius, 0, Math.PI*2); ctx.fill();
            const ringAlpha = Math.min(0.85, 0.35 + remainingPct * 0.3);
            ctx.lineWidth = Math.max(2, 6 * remainingPct) * pulseScale;
            const ringBase = b.ringColor || '#f00';
            ctx.strokeStyle = hexToRgba(ringBase, ringAlpha * 0.7);
            ctx.beginPath(); ctx.arc(b.x, b.y, b.ringRadius, 0, Math.PI*2); ctx.stroke();
            if (elapsedPct < 0.25) {
                ctx.globalAlpha = (0.25 - elapsedPct) * 2.4;
                ctx.fillStyle = hexToRgba(ringBase, 0.8 * (1 - elapsedPct));
                ctx.beginPath(); ctx.arc(b.x, b.y, b.ringRadius * 0.45, 0, Math.PI*2); ctx.fill();
                ctx.globalAlpha = 1;
            }
            ctx.restore();
        } else {
            b.life -= realSec;
            const alpha = Math.max(0, b.life / 0.6);
            if (b.img && b.img.complete && b.img.naturalWidth) {
                ctx.save();
                ctx.globalAlpha = alpha;
                const size = b.radius * 2;
                ctx.drawImage(b.img, b.x - size/2, b.y - size/2, size, size);
                ctx.globalAlpha = 1;
                ctx.restore();
            } else {
                const grad = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, b.radius);
                grad.addColorStop(0, `rgba(0,170,255,${0.35*alpha})`);
                grad.addColorStop(0.6, `rgba(0,170,255,${0.18*alpha})`);
                grad.addColorStop(1, `rgba(0,170,255,0)`);
                ctx.fillStyle = grad;
                ctx.beginPath(); ctx.arc(b.x, b.y, b.radius, 0, Math.PI*2); ctx.fill();
            }
            if (b.life <= 0) b._remove = true;
        }
    }
    {
        let w = 0;
        for (let i = 0; i < blooms.length; i++) {
            const b = blooms[i];
            if (!b || b._remove) continue;
            blooms[w++] = b;
        }
        blooms.length = w;
    }

    for (let i = 0; i < textPopups.length; i++) {
        const p = textPopups[i];
        p.age += realSec;
        p.t = Math.max(0, Math.min(1, p.age / p.life));
        if (p.t >= 1) { p._remove = true; continue; }
        const t = p.t;
        const easeOutCubic = (u) => 1 - Math.pow(1 - u, 3);
        const kx = easeOutCubic(t);
        const offsetX = 6 + 26 * kx + 10 * (t * t);
        const offsetY = -6 * (1 - t) * 0.6 + 22 * (t * t);
        const jx = (Math.random() - 0.5) * 3; 
        const jy = (Math.random() - 0.5) * 3; 
        let alpha = t < 0.65 ? 1 : (1 - (t - 0.65) / 0.35);
        alpha = Math.max(0, Math.min(1, alpha));
        const x = p.x0 + offsetX + jx;
        const y = p.y0 + offsetY + jy;
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.font = `bold ${p.size}px Orbitron, monospace`;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.lineWidth = Math.max(1, Math.round(p.size * 0.10));
        ctx.strokeStyle = '#000';
        ctx.fillStyle = p.color || '#ff00ff';
        ctx.strokeText(p.txt, x, y);
        ctx.fillText(p.txt, x, y);
        ctx.restore();
    }
    {
        let w = 0;
        for (let i = 0; i < textPopups.length; i++) {
            const p = textPopups[i];
            if (!p || p._remove) continue;
            textPopups[w++] = p;
        }
        textPopups.length = w;
    }

    if(GAME.shake > 0) ctx.restore();

    ctx.strokeStyle = '#808';
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(6, C.laneY); ctx.lineTo(canvas.width-6, C.laneY); ctx.stroke();

    updateKeyboardStick();
    drawJoystickOverlay();
    drawUltButtons();
    updatePlayerAura();
    drawReinforcementDebugOverlay();

    updateUI();



    if (party[0] && party[0].hp <= 0) {
        GAME.shootAmbientTimer = 0;
    }

    if (GAME.deathTimer > 0) {
        GAME.deathTimer -= realSec;
        if (GAME.deathTimer <= 0) {
            gameOver();
            return;
        }
    }
}


const input = { left:false, right:false, up:false, down:false };
input.joystickActive = false;
input.jIdentifier = null;
input.jStartX = 0; input.jStartY = 0;
input.jCurX = 0; input.jCurY = 0;
input.jVecX = 0; input.jVecY = 0;
input.jMagnitude = 0;
input.jMoved = false;
window.addEventListener('keydown', (e) => {
    const c = e.code;
    if(['KeyW','KeyA','KeyS','KeyD','ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Space','KeyQ','KeyE','Digit1','Digit2','Digit3'].includes(c)) {
        try { e.preventDefault(); } catch(_){}
    }
    if(c === 'ArrowLeft' || c === 'KeyA') input.left = true;
    if(c === 'ArrowRight' || c === 'KeyD') input.right = true;
    if(c === 'ArrowUp' || c === 'KeyW') input.up = true;
    if(c === 'ArrowDown' || c === 'KeyS') input.down = true;
    if(c === 'Space') {
        if(GAME.state === 'PLAY' || GAME.state === 'PAUSE') togglePause();
    }
    if(c === 'KeyQ') {
        const p = party[0];
        if(p) {
            const t = findClosestEnemy(p.x, p.y);
            if(t) GAME.target = t;
        }
    }
    if(c === 'KeyE') {
        const p = party[0];
        if(p && p.ultCharge >= 100) activateUlt(p);
    }
    if(c === 'Digit1') { triggerTraitUlt('sniper'); }
    if(c === 'Digit2') { triggerTraitUlt('gatling'); }
    if(c === 'Digit3') { triggerTraitUlt('shotgun'); }
    if (c === 'KeyH') {
        meta.essence = (meta.essence || 0) + 10000;
        try { localStorage.setItem('neonTowerSave', JSON.stringify(meta)); } catch(_){}
        updateUI();
        try { console.log('[DEBUG] +10,000 banked essence =>', meta.essence); } catch(_){ }
    }
    if (c === 'KeyG') {
        DEBUG_REINF_GUIDES = !DEBUG_REINF_GUIDES;
        try { console.log('[Reinf Guides]', DEBUG_REINF_GUIDES ? 'ON' : 'OFF'); } catch(_){}
    }
    if (c === 'KeyL') {
        const p0 = party[0];
        console.log('[Audio] beamActive:', !!(p0 && p0.beamActive), 'rate15:', (meta.rateLvl||0)>=15,
            'BIG:', (p0 && p0.powerup && p0.powerup.type === 'BIG' && p0.powerup.time > 0));
    }
    if (c === 'KeyJ') {
        meta.essence = 0;
        try { localStorage.setItem('neonTowerSave', JSON.stringify(meta)); } catch(_){}
        updateUI();
        try { console.log('[ESSENCE] Stored essence reset to 0'); } catch(_){}
    }
});
window.addEventListener('keyup', (e) => {
    const c = e.code;
    if(c === 'ArrowLeft' || c === 'KeyA') input.left = false;
    if(c === 'ArrowRight' || c === 'KeyD') input.right = false;
    if(c === 'ArrowUp' || c === 'KeyW') input.up = false;
    if(c === 'ArrowDown' || c === 'KeyS') input.down = false;
});

function triggerBoostDodge(){
    const p0 = party && party[0];
    if (!p0 || p0.hp <= 0) return;
    const now = performance.now();
    const last = p0._boostCooldownTs || 0;
    if (now - last < 2000) return; 
    let dx = 0, dy = 0;
    if (typeof p0.lastMoveX === 'number' || typeof p0.lastMoveY === 'number') {
        dx = p0.lastMoveX || 0; dy = p0.lastMoveY || 0;
    }
    if (Math.abs(dx) + Math.abs(dy) < 0.01) {
        if (GAME.target && enemies.includes(GAME.target)) {
            const ang = Math.atan2(GAME.target.y - p0.y, GAME.target.x - p0.x);
            dx = Math.cos(ang); dy = Math.sin(ang);
        } else {
            dy = -1;
        }
    }
    const len = Math.hypot(dx, dy) || 1; dx /= len; dy /= len;
    const boostSpeed = 22; 
    p0._boostVX = dx * boostSpeed;
    p0._boostVY = dy * boostSpeed;
    p0._boostActive = true;
    p0._boostHitTs = new Map();
    p0._boostDecay = .90; 
    p0._boostCooldownTs = now;
    p0._boostStartTs = now;
    p0._boostInvulUntil = now + 500;
    p0._boostGlowUntil = p0._boostInvulUntil;
    p0._postBoostPhase = 'decel';
    p0._postBoostTs = now;
    p0._postBoostDecelMs = 10; 
    p0._postBoostAccelMs = 0;  
    try { playSfx('dodge'); } catch(_){}
    GAME.shake = Math.max(GAME.shake, 3);
    try {
        const theme = getSkinTheme ? getSkinTheme() : { primary: '#ff00ff', accent: '#00ffff' };
        blooms.push({
            x: p0.x,
            y: p0.y,
            radius: 0,
            maxRadius: 100,
            ringRadius: 50,
            ringColor: theme.primary || '#ff00ff',
            colors: [theme.primary || '#ff00ff', theme.accent || theme.primary || '#ffffff', theme.primary || '#ff00ff'],
            life: 0.6,
            maxLife: 0.6,
            slow: false,
            pulse: 0
        });
        
        const base = Math.max(4, 6 + (meta.dmgLvl || 0));
        const peakDamage = Math.round(base * 0.6);
        const effectiveRadius = 140;
        enemies.forEach(e => {
            if (!e || e.hp <= 0) return;
            const dx = e.x - p0.x;
            const dy = e.y - p0.y;
            const dist = Math.hypot(dx, dy);
            if (dist <= effectiveRadius + e.size) {
                const t = Math.min(1, Math.max(0, dist / effectiveRadius));
                const mul = 0.20 + (0.75 - 0.20) * (1 - t);
                const dmg = Math.max(1, Math.round(peakDamage * mul));
                try { playSfx('die'); } catch(_){}
                e.hp -= dmg;
                try { spawnDamagePopup(e, dmg, 'small'); } catch(_){}
                createParticles(e.x, e.y, '#f00', 4);
                if (e.hp <= 0 && !e.deadProcessed) {
                    e.deadProcessed = true;
                    playSfx('die');
                    createRainbowExplosion(e.x, e.y, e.rank === 'BOSS' ? 25 : 25);
                    onEnemyKilled(e, 'BOOST_SPLASH');
                    if (GAME.target === e) GAME.target = null;
                }
            }
        });
    } catch(_) {}
}
window.addEventListener('keydown', (e) => {
    if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') {
        triggerBoostDodge();
    }
});

canvas.addEventListener('mousedown', (e) => {
    if(GAME.state !== 'PLAY') return;
    const { x, y } = toCanvasCoords(e.clientX, e.clientY);
    const traitClicked = detectUltButton(x, y);
    if(traitClicked) {
        playSfx('click');
        if (traitClicked === 'default') {
            const p = party[0];
            if (p && p.ultCharge >= 100) activateUlt(p);
        } else {
            triggerTraitUlt(traitClicked);
        }
        return;
    }
    playSfx('click');
    const selectionR = 90;
    let best = null; let bestDist = Infinity; let bestType = null; let bestPet = null;
    for(let en of enemies) {
        const d = Math.hypot(en.x - x, en.y - y);
        if(d <= en.size + selectionR && d < bestDist) { best = en; bestDist = d; bestType = 'enemy'; }
    }
    if (GAME.warship && GAME.warship.cannons) {
        for (let cannon of GAME.warship.cannons) {
            if (cannon.dead) continue;
            const d = Math.hypot(cannon.x - x, cannon.y - y);
            if(d <= cannon.radius + selectionR && d < bestDist) { best = cannon; bestDist = d; bestType = 'enemy'; }
        }
    }
    for(let p of party) {
        if(!p || p.hp<=0 || p.ultCharge < 100) continue;
        const d = Math.hypot(p.x - x, p.y - y);
        if(d <= selectionR && d < bestDist) { bestPet = p; bestDist = d; bestType = 'pet'; }
    }
    if(bestType === 'enemy' && best) { GAME.target = best; }
    else if(bestType === 'pet' && bestPet) { activateUlt(bestPet); }
});

function handleTap(x, y) {
    const traitClicked = detectUltButton(x, y);
    if(traitClicked) {
        if (traitClicked === 'default') {
            const p = party[0];
            if (p && p.ultCharge >= 100) activateUlt(p);
        } else {
            triggerTraitUlt(traitClicked);
        }
        return;
    }
    const selectionR = 90; 
    let best = null; let bestDist = Infinity; let bestType = null; let bestPet = null;
    for(let en of enemies) {
        const d = Math.hypot(en.x - x, en.y - y);
        if(d <= en.size + selectionR && d < bestDist) { best = en; bestDist = d; bestType = 'enemy'; }
    }
    if (GAME.warship && GAME.warship.cannons) {
        for (let cannon of GAME.warship.cannons) {
            if (cannon.dead) continue;
            const d = Math.hypot(cannon.x - x, cannon.y - y);
            if(d <= cannon.radius + selectionR && d < bestDist) { best = cannon; bestDist = d; bestType = 'enemy'; }
        }
    }
    for(let p of party) {
        if(!p || p.hp<=0 || p.ultCharge < 100) continue;
        const d = Math.hypot(p.x - x, p.y - y);
        if(d <= selectionR && d < bestDist) { bestPet = p; bestDist = d; bestType = 'pet'; }
    }
    if(bestType === 'enemy' && best) { GAME.target = best; }
    else if(bestType === 'pet' && bestPet) { activateUlt(bestPet); }
}

canvas.addEventListener('touchstart', (e) => {
    if (GAME.state !== 'PLAY') return;
    if (!e.changedTouches.length) return;
    const t = e.changedTouches[0];
    input.jIdentifier = t.identifier;
    const { x, y } = toCanvasCoords(t.clientX, t.clientY);
    const jc = getJoyCenter();
    const baseX = jc.x; 
    const baseY = jc.y;
    const distToCenter = Math.hypot(x - baseX, y - baseY);
    if (distToCenter <= JOY.radius) {
        input.jStartX = baseX; input.jStartY = baseY; input.jCurX = x; input.jCurY = y;
        input.jVecX = 0; input.jVecY = 0; input.jMagnitude = 0; input.jMoved = false;
        input.joystickActive = true;
    } else {
        input.joystickActive = false;
        handleTap(x, y);
    }
    e.preventDefault();
},{passive:false});

canvas.addEventListener('touchmove', (e) => {
    if (!input.joystickActive) return;
    const t = Array.from(e.changedTouches).find(tt => tt.identifier === input.jIdentifier);
    if(!t) return;
    const { x, y } = toCanvasCoords(t.clientX, t.clientY);
    input.jCurX = x; input.jCurY = y;
    const jc = getJoyCenter();
    const baseX = jc.x; 
    const baseY = jc.y;
    input.jStartX = baseX; input.jStartY = baseY;
    let dx = x - baseX;
    let dy = y - baseY;
    const dist = Math.hypot(dx, dy);
    const deadzone = 20;
    if (dist > deadzone) input.jMoved = true;
    const maxR = JOY.radius;
    const clamped = Math.min(dist, maxR);
    const scale = dist === 0 ? 0 : clamped / dist;
    dx *= scale; dy *= scale;
    const normDx = dx / maxR;
    const normDy = dy / maxR;
    const normDist = Math.hypot(normDx, normDy);
    input.jVecX = normDx;
    input.jVecY = normDy;
    input.jMagnitude = normDist > (deadzone / maxR) ? 1 : 0;
    e.preventDefault();
},{passive:false});

function endTouch(identifier, clientX, clientY) {
    if (!input.joystickActive || identifier !== input.jIdentifier) return;
    const wasMoved = input.jMoved;
    input.joystickActive = false;
    input.jIdentifier = null;
    input.jVecX = 0; input.jVecY = 0; input.jMagnitude = 0; input.jMoved = false;
    if (!wasMoved) {
        const { x, y } = toCanvasCoords(clientX, clientY);
        handleTap(x, y);
    }
}

canvas.addEventListener('touchend', (e) => {
    for(const t of e.changedTouches) endTouch(t.identifier, t.clientX, t.clientY);
},{passive:false});
canvas.addEventListener('touchcancel', (e) => {
    for(const t of e.changedTouches) endTouch(t.identifier, t.clientX, t.clientY);
},{passive:false});

function applyPlayerMovement() {
    const p = party[0];
    if(!p || p.hp <= 0) return;
    if (p.entering) return;
    if (typeof p.vx !== 'number') p.vx = 0;
    if (typeof p.vy !== 'number') p.vy = 0;
    let dirX = 0, dirY = 0;
    let magnitude = 0;
    if (input.joystickActive) {
        dirX = input.jVecX || 0;
        dirY = input.jVecY || 0;
        const vecLen = Math.hypot(dirX, dirY);
        if (vecLen > 0) {
            dirX /= vecLen;
            dirY /= vecLen;
        }
        magnitude = input.jMagnitude;
    } else {
        if (input.left) dirX -= 1;
        if (input.right) dirX += 1;
        if (input.up) dirY -= 1;
        if (input.down) dirY += 1;
        const len = Math.hypot(dirX, dirY);
        if (len > 0) { dirX /= len; dirY /= len; magnitude = 1; }
    }

    function moveParams(level){
        const L = Math.min(5, Math.max(1, level|0));
        switch(L){
            case 1: return { accel:0.4, maxSpeed:4.0, friction:0.5 };
            case 2: return { accel:0.6, maxSpeed:5.5, friction:0.4 };
            case 3: return { accel:0.8, maxSpeed:7.0, friction:0.30 };
            case 4: return { accel:1.1, maxSpeed:9.0, friction:0.22 };
            case 5: return { accel:1.5, maxSpeed:11.0, friction:0.16 };
        }
        return { accel:0.8, maxSpeed:7.0, friction:0.30 };
    }
    const { accel, maxSpeed, friction } = moveParams(ACCESS.moveLevel || 3);

    const nowTs = performance.now();
    let accelMult = 1;
    let frictionMult = 1;
    if (p._postBoostPhase) {
        const decelMs = p._postBoostDecelMs || 420;
        const elapsed = nowTs - (p._postBoostTs || nowTs);
        if (p._postBoostPhase === 'decel') {
            frictionMult = 2.4;
            accelMult = 0.7;
            const curSp = Math.hypot(p.vx, p.vy);
            const capSp = 0.9;
            if (curSp > capSp) {
                const s = capSp / (curSp || 1);
                p.vx *= s; p.vy *= s;
            }
            if (elapsed >= decelMs) {
                p._postBoostPhase = null;
                p._postBoostTs = 0;
            }
        }
    }

    if (magnitude > 0.01) {
        p.vx += dirX * (accel * accelMult) * magnitude * GAME.dt;
        p.vy += dirY * (accel * accelMult) * magnitude * GAME.dt;
    } else {
        const fr = Math.pow(1 - (friction * frictionMult), GAME.dt);
        p.vx *= fr;
        p.vy *= fr;
        if (Math.abs(p.vx) < 0.02) p.vx = 0;
        if (Math.abs(p.vy) < 0.02) p.vy = 0;
    }

    if (p._boostActive) {
        p.x += p._boostVX;
        p.y += p._boostVY;
        p._boostVX *= p._boostDecay;
        p._boostVY *= p._boostDecay;
        try {
            const base = Math.max(6, 8 + (meta.dmgLvl || 0));
            const contactDamage = Math.round(base * 1.0);
            const contactRadius = 28; 
            for (let i = 0; i < enemies.length; i++) {
                const e = enemies[i];
                if (!e || e.hp <= 0) continue;
                const now = performance.now();
                const graceMs = 80;
                const lastTs = p._boostHitTs ? (p._boostHitTs.get(e._eid) || 0) : 0;
                if (lastTs && (now - lastTs) < graceMs) continue;
                const d = Math.hypot(e.x - p.x, e.y - p.y);
                if (d <= (e.size + contactRadius)) {
                    if (p._boostHitTs) p._boostHitTs.set(e._eid, now);
                    try { playSfx('die'); } catch(_){}
                    e.hp -= contactDamage;
                    try { spawnDamagePopup(e, contactDamage, 'mid'); } catch(_){}
                    createParticles(e.x, e.y, '#f00', 6);
                    if (e.hp <= 0 && !e.deadProcessed) {
                        e.deadProcessed = true;
                        e._remove = true; 
                        playSfx('die');
                        createRainbowExplosion(e.x, e.y, e.rank === 'BOSS' ? 25 : 25);
                        onEnemyKilled(e, 'BOOST_CONTACT');
                        if (GAME.target === e) GAME.target = null;
                    }
                }
            }
        } catch(_) {}
        if (Math.hypot(p._boostVX, p._boostVY) < 0.5) {
            p._boostActive = false;
            p._boostVX = 0; p._boostVY = 0;
            p._boostInvulUntil = 0;
            p._boostHitTs = null;
            if (!p._postBoostPhase) {
                p._postBoostPhase = 'decel';
                p._postBoostTs = performance.now();
            }
        }
    }

    const sp = Math.hypot(p.vx, p.vy);
    if (sp > maxSpeed) {
        const s = maxSpeed / sp;
        p.vx *= s; p.vy *= s;
    }

    p.x += p.vx * GAME.dt;
    p.y += p.vy * GAME.dt;
    p.lastMoveX = p.vx;
    p.lastMoveY = p.vy;

    const spd = Math.hypot(p.vx, p.vy);
    if (spd > 0.2) {
        playerTrail.push({ x: p.x, y: p.y, life: 1.0 });
        if (playerTrail.length > 60) playerTrail.shift();
    }

    const minX = 20, maxX = canvas.width - 20;
    const minY = 20, maxY = C.laneY - 20;
    if (p.x < minX) { p.x = minX; if (p.vx < 0) p.vx = 0; }
    if (p.x > maxX) { p.x = maxX; if (p.vx > 0) p.vx = 0; }
    if (p.y < minY) { p.y = minY; if (p.vy < 0) p.vy = 0; }
    if (p.y > maxY) { p.y = maxY; if (p.vy > 0) p.vy = 0; }
}

function drawPlayerTrail(realSec) {
    if (!playerTrail.length) return;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < playerTrail.length; i++) {
        const t = playerTrail[i];
        t.life -= realSec * 2.5;
        if (t.life < 0) { continue; }
        const alpha = Math.max(0, Math.min(1, t.life));
        ctx.globalAlpha = alpha * 0.6;
        const theme = getSkinTheme();
        const selSkin = getSelectedSkin();
        const trailCol = (selSkin === 'STARCORE' && theme.accent) ? theme.accent : theme.primary;
        ctx.fillStyle = trailCol;
        const size = 6 * (0.5 + 0.5 * t.life);
        ctx.beginPath();
        ctx.arc(t.x, t.y, size, 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.globalAlpha = 1;
    ctx.restore();
    for (let i = playerTrail.length - 1; i >= 0; i--) {
        if (playerTrail[i].life <= 0) playerTrail.splice(i, 1);
    }
}

function activateUlt(pet) {
    if (!pet || pet.hp <= 0) return;
    pet.ultCharge = 0;
    GAME.shake = 15;
    const isDefaultTrait = !(pet.trait && pet.trait.id && (pet.trait.id === 'sniper' || pet.trait.id === 'gatling' || pet.trait.id === 'shotgun'));
    if (isDefaultTrait && (meta.chargeLvl || 0) >= 15) {
        pet.blackHoleActive = true;
        pet.blackHoleTime = 10.0;
        pet.blackHoleAngle = 0;
        playSfx('blackhole');
        GAME.shake = 22;
        pet.ultMeter = 0;
        return; 
    }
    playSfx('ult');
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.fillRect(0,0,canvas.width,canvas.height);

    const chargeBoost = 1 + (meta.chargeLvl || 0) * 0.20;

    const tid = (pet.trait && pet.trait.id) ? pet.trait.id.toLowerCase() : 'none';
    if (tid === 'sniper') { activateSniperUlt(pet, chargeBoost); return; }
    if (tid === 'gatling') {
        pet.beamActive = true; pet.beamTime = 10; pet.beamSfxTimer = 0; pet.beamSfxBurstLeft = 10;
        LOOPING.play('laser1');
        return;
    }
    if (tid === 'shotgun') { activateShotgunUlt(pet, chargeBoost); return; }

    const base = (6 + meta.dmgLvl) * 3;
    const peakDamage = Math.round(base * chargeBoost);
    const bloomBase = 120;
    const effectiveRadius = (bloomBase * 2.1) * 1.5; 
    enemies.forEach(e => {
        if (!e || e.hp <= 0) return;
        const dx = e.x - pet.x;
        const dy = e.y - pet.y;
        const dist = Math.hypot(dx, dy);
        if (dist <= effectiveRadius + e.size) {
            const t = Math.min(1, Math.max(0, dist / effectiveRadius));
            const mul = 0.25 + (1.2 - 0.25) * (1 - t);
            const dmg = Math.max(1, Math.round(peakDamage * mul));
            e.hp -= dmg;
            try { spawnDamagePopup(e, dmg, 'large'); } catch(_){}
            createParticles(e.x, e.y, '#f00', 6);
            if (e.hp <= 0 && !e.deadProcessed) {
                e.deadProcessed = true;
                playSfx('die');
                createRainbowExplosion(e.x, e.y, e.rank === 'BOSS' ? 25 : 25);
                onEnemyKilled(e, 'ULT_BLAST');
                if (GAME.target === e) GAME.target = null;
            }
        }
    });
    spawnUltBloom(pet.x, pet.y, getSkinTheme().primary);
}

function activateSniperUlt(pet, chargeBoost, opts = {}) {
    const target = GAME.target && isValidTarget(GAME.target) ? GAME.target : findClosestEnemy(pet.x, pet.y);
    if (target) playSfx('cannon');
    if (!target) return;
    const ang = Math.atan2(target.y - pet.y, target.x - pet.x);
    const spd = 14; 
    let mainDamage = Math.round(40 * chargeBoost);
    let splashDamage = Math.round(10 * chargeBoost);
    const impact15 = (meta.dmgLvl || 0) >= 15;
    const bigActive = (pet.powerup && pet.powerup.type === 'BIG' && pet.powerup.time > 0);
    const bigBomb = impact15 && bigActive;
    if (bigBomb) { mainDamage *= 2; splashDamage *= 2; }
    const splashRadius = 150;
    const skinKey = pet.isMain ? getSelectedSkin() : null;

    const proj = {
        x: pet.x,
        y: pet.y,
        vx: Math.cos(ang) * spd,
        vy: Math.sin(ang) * spd,
        radius: bigBomb ? 80 : 40, 
        color: (opts.colorOverride || C.colors['cybil']), 
        active: true,
        impactBomb: !!bigBomb,
        skinKey,
        update() {
            this.x += this.vx * GAME.dt;
            this.y += this.vy * GAME.dt;
            
            const allTargets = [...enemies];
            if (GAME.warship && GAME.warship.cannons) {
                allTargets.push(...GAME.warship.cannons.filter(c => !c.dead));
            }
            
            for (let i = 0; i < allTargets.length; i++) {
                const e = allTargets[i];
                const targetSize = e._cid ? (e.radius || 20) : (e.size || 20);
                const d = Math.hypot(this.x - e.x, this.y - e.y);
                if (d < this.radius + targetSize) {
                    playSfx('ult');
                    e.hp -= mainDamage;
                    try { spawnDamagePopup(e, mainDamage, 'large'); } catch(_){}
                    if (e.hp <= 0 && !e.deadProcessed && !e.dead) {
                        if (e.takeDamage) {
                            e.takeDamage(0);
                        } else {
                            e.deadProcessed = true;
                            playSfx('die');
                            createRainbowExplosion(e.x, e.y, e.rank === 'BOSS' ? 25 : 25);
                            onEnemyKilled(e, 'SNIPER_MAIN');
                            if (GAME.target === e) GAME.target = null;
                        }
                    }
                    
                    for (let j = 0; j < allTargets.length; j++) {
                        const o = allTargets[j];
                        const dd = Math.hypot(this.x - o.x, this.y - o.y);
                        if (dd <= splashRadius) {
                            o.hp -= splashDamage;
                            try { spawnDamagePopup(o, splashDamage, 'mid'); } catch(_){}
                            createParticles(o.x, o.y, '#0ff', 8);
                            if (o.hp <= 0 && !o.deadProcessed && !o.dead) {
                                if (o.takeDamage) {
                                    o.takeDamage(0);
                                } else {
                                    o.deadProcessed = true;
                                    playSfx('die');
                                    createRainbowExplosion(o.x, o.y, o.rank === 'BOSS' ? 40 : 40);
                                    onEnemyKilled(o, 'SNIPER_SPLASH');
                                    if (GAME.target === o) GAME.target = null;
                                }
                            }
                        }
                    }
                    GAME.shake = Math.max(GAME.shake, 20);
                    spawnCanvasExplosion(this.x, this.y, this.radius * 1, true, this.skinKey);
                    this.active = false;
                    break;
                }
            }
            if (this.x < -50 || this.x > canvas.width + 50 || this.y < -50 || this.y > canvas.height + 50) this.active = false;
        },
        draw() {
            const map = (this.skinKey && SKIN_SPRITES[this.skinKey]) ? SKIN_SPRITES[this.skinKey] : SKIN_SPRITES.DEFAULT;
            const img = map.bigshot || BIGshotImg;
            if (img) {
                const ang = Math.atan2(this.vy, this.vx);
                ctx.save();
                ctx.translate(this.x, this.y);
                ctx.rotate(ang + Math.PI/2);
                ctx.globalCompositeOperation = 'lighter';
                const size = this.impactBomb ? this.radius * 2.0 : this.radius * 1.5; 
                ctx.drawImage(img, -size/2, -size/2, size, size);
                ctx.globalCompositeOperation = 'source-over';
                ctx.restore();
            }
        }
    };
    bullets.push(proj);
}

function spawnCanvasExplosion(x, y, r, useAftershock = false, skinKey = null) {
    const bursts = 360;
    for (let i = 0; i < bursts; i++) {
        const a = Math.random() * Math.PI * 1;
        const m = r * (0.5 + Math.random()*0.9);
        const vx = Math.cos(a) * (m/18);
        const vy = Math.sin(a) * (m/18);
        const col = (i % 3 === 0)? '#ff00ff' : (i % 3 === 1 ? '#00d4ff' : '#ffffff');
        emitParticle(x, y, vx, vy, 1.0, 0.05, 3, col);
    }
    if (useAftershock) {
        const key = skinKey || getSelectedSkin();
        const map = SKIN_SPRITES[key] || SKIN_SPRITES.DEFAULT;
        const img = map.aftershock || aftershockImg;
        if (img && img.complete) {
            blooms.push({ x, y, radius: r*1.2, life: 1, maxLife: 1, img });
        } else if (aftershockImg && aftershockImg.complete) {
            blooms.push({ x, y, radius: r*1.2, life: 1, maxLife: 1, img: aftershockImg });
        } else {
            blooms.push({ x, y, radius: r*0.7, maxRadius: r*2.0, ringRadius: r*1.3, life: 1, maxLife: 1, pulse: 0, slow: true, colors:['#f0f','#f0f','#f00'] });
            blooms.push({ x, y, radius: r*1.2, maxRadius: r*2.8, ringRadius: r*1.9, life: 1, maxLife:1, pulse:0, slow: true, colors:['#550022','#002255','#000814'] });
        }
    } else {
        blooms.push({ x, y, radius: r*0.7, maxRadius: r*2.0, ringRadius: r*1.3, life: 1, maxLife: 1, pulse: 0, slow: true, colors:['#f0f','#f0f','#f00'] });
        blooms.push({ x, y, radius: r*1.2, maxRadius: r*2.8, ringRadius: r*1.9, life: 1, maxLife:1, pulse:0, slow: true, colors:['#550022','#002255','#000814'] });
    }
}

function activateShotgunUlt(pet, chargeBoost) {
    const count = 9;
    const baseDmg = pet.dmg;
    const scaled = Math.round(baseDmg * chargeBoost);
    createMuzzleFlash(pet.x, pet.y - 10, C.colors[pet.type.toLowerCase()] || '#0ff');
    for (let i = 0; i < count; i++) {
        const ang = Math.random() * Math.PI * 2;
        const spd = 9 + Math.random()*3;
        const lifeSec = 10;
        bullets.push({
            x: pet.x, y: pet.y - 10,
            vx: Math.cos(ang) * spd,
            vy: Math.sin(ang) * spd,
            dmg: scaled,
            color: C.colors[pet.type.toLowerCase()] || '#0ff',
            active: true,
            age: 0,
            maxAge: lifeSec,
            radius: 6,
            enemyShot: false,
            update() {
                this.x += this.vx * GAME.dt;
                this.y += this.vy * GAME.dt;
                this.age += GAME.dt / 60;
                if (this.age >= this.maxAge) { this.active = false; return; }
                const loss = 0.95;
                if (this.x <= 5 || this.x >= canvas.width - 5) { this.vx = -this.vx * loss; this.x = Math.max(5, Math.min(canvas.width-5, this.x)); }
                if (this.y <= 5 || this.y >= C.laneY - 5) { this.vy = -this.vy * loss; this.y = Math.max(5, Math.min(C.laneY-5, this.y)); }
                for (let e of enemies) {
                    if (!e || e.hp <= 0) continue;
                    const d = Math.hypot(this.x - e.x, this.y - e.y);
                    if (d < (this.radius + e.size)) {
                        e.hp -= this.dmg;
                        try { spawnDamagePopup(e, this.dmg, 'regular'); } catch(_){}
                        playSfx('hit');
                        createParticles(e.x, e.y, this.color, 3);
                        if (e.hp <= 0 && !e.deadProcessed) {
                            e.deadProcessed = true;
                            playSfx('die');
                            createRainbowExplosion(e.x, e.y, e.rank === 'BOSS' ? 25 : 25);
                            onEnemyKilled(e, 'SHOTGUN');
                            if (GAME.target === e) GAME.target = null;
                        }
                    }
                }
            },
            draw() {
                ctx.save();
                ctx.globalCompositeOperation = 'lighter';
                ctx.fillStyle = this.color;
                ctx.beginPath(); ctx.arc(this.x, this.y, this.radius, 0, Math.PI*2); ctx.fill();
                ctx.globalCompositeOperation = 'source-over';
                ctx.restore();
            }
        });
    }
    GAME.shake = Math.max(GAME.shake, 10);
}

function createMuzzleFlash(x, y, color) {
    const n = 12;
    for (let i = 0; i < n; i++) {
        const a = Math.random() * Math.PI * 2;
        const sp = 3 + Math.random()*2;
        const vx = Math.cos(a) * sp;
        const vy = Math.sin(a) * sp;
        const size = 2 + Math.random()*2;
        emitParticle(x, y, vx, vy, 0.6, 0.08, size, color);
    }
}

function spawnUltBloom(x, y, baseColor) {
    const theme = getSkinTheme();
    const main = theme.primary || baseColor || '#ff00ff';
    const accent = theme.accent || '#ffffff';
    const r = 180;
    const id = getSelectedSkin();
    let innerColors, outerColors, ringColor;
    if (id === 'STARCORE') {
        innerColors = [main, accent, '#ffffff'];
        outerColors = [accent, main, '#101016'];
        ringColor = accent;
    } else if (id === 'MOONLIGHT') {
        innerColors = [main, '#00ffbb', '#cffff0'];
        outerColors = [accent, main, '#001018'];
        ringColor = main;
    } else if (id === 'DARKMATTER') {
        innerColors = [main, '#660000', '#ffaaaa'];
        outerColors = [accent, main, '#0a0000'];
        ringColor = accent;
    } else {
        innerColors = [main, accent, '#ffffff'];
        outerColors = [accent, main, '#000000'];
        ringColor = main;
    }
    blooms.push({ x, y, radius: r*0.8, maxRadius: r*2.6, ringRadius: r*1.6, life:1.4, maxLife:1.4, pulse:0, colors: innerColors, ringColor });
    blooms.push({ x, y, radius: r*1.2, maxRadius: r*3.4, ringRadius: r*2.1, life:1.2, maxLife:1.2, pulse:0, colors: outerColors, ringColor });
}

async function startGame() {
    if(activeFrame) { cancelAnimationFrame(activeFrame); activeFrame = null; }
    party = [ new Pet('Lydia', null, true) ];
    const p0 = party[0];
    p0.x = canvas.width / 2;
    p0.y = canvas.height + 40;
    p0.targetX = canvas.width / 2;
    p0.targetY = Math.min(C.laneY - 90, canvas.height - 120);
    p0.entering = true;
    const supportN = Math.min(10, Math.max(0, meta.supportCount || 0));
    const sniperTrait = C.traits.find(t => t.id === 'sniper');
    for (let i = 0; i < supportN; i++) {
        const alt = new Pet('Lydia', sniperTrait, false);
        alt.hp = 100; alt.maxHp = 100;
        if (party.length < 11) party.push(alt);
    }
    (function applyDarkmatterBonuses(){
        const sel = getSelectedSkin();
        if (sel === 'DARKMATTER') {
            const perk = SKIN_PERKS.DARKMATTER;
            if (p0 && perk.playerHpBonus) {
                p0.maxHp += perk.playerHpBonus;
                p0.hp = Math.min(p0.maxHp, p0.hp + perk.playerHpBonus);
            }
            for (let i = 1; i < party.length; i++) {
                const s = party[i]; if (!s) continue;
                s.maxHp += (perk.supportHpBonus || 0);
                s.hp = Math.min(s.maxHp, s.hp + (perk.supportHpBonus || 0));
            }
        }
    })();
    enemies = []; bullets = []; powerups = []; resetParticlePool();
    GAME.floor = 1; 
    GAME.essence = 0;
    GAME.totalKillsRun = 0;
    GAME.enemiesSpawned = 0;
    GAME.enemiesKilled = 0; 
    GAME.enemiesRequired = 10;
    GAME.bossQuota = 1; 
    GAME.powerupQuota = 1; 
    GAME.bossesSpawned = 0;
    GAME.powerupsSpawned = 0;
    GAME.powerupSpawnTimer = 0;
    GAME.warship = null;
    GAME._warshipSpawned = false;
    GAME._pendingBossWarning = false;
    bossSpawnedThisFloor = false;
    GAME.state = 'PLAY';
    document.getElementById('game-over')?.classList.add('hidden');
    document.getElementById('start-screen').classList.add('hidden');
    document.getElementById('draft-screen').classList.add('hidden');
    GAME.lastTs = performance.now();
    GAME.spawnTimer = 0;
    GAME.awaitingDraft = false;
    GAME.postBossTimer = 0;
    GAME.deathTimer = 0;
    GAME.draftCount = 0;
    
    const trackName = pickTrackForSector(GAME.floor);
    try {
        if (AudioEngine.state.ctx && AudioEngine.state.ctx.state === 'suspended') {
            await AudioEngine.state.ctx.resume();
        }
        const isAlreadyPlaying = (AudioEngine.state.musicName === trackName) || (MUSIC.name === trackName);
        if (isAlreadyPlaying) {
            console.log('Music already playing:', trackName);
        } else {
            try { MUSIC.stop({ fadeOutMs: 0 }); } catch(_){ }
            let ok = false;
            try {
                ok = await AudioEngine.playMusic(trackName, 1.0, true, 800);
            } catch(_) { ok = false; }
            if (!ok && AudioEngine && AudioEngine.state && AudioEngine.state.ready) {
                try {
                    const url = musicUrlForName(trackName);
                    await AudioEngine.loadBuffer(trackName, url).catch(() => {});
                    ok = await AudioEngine.playMusic(trackName, 1.0, true, 800).catch(() => false);
                } catch(_) { ok = false; }
            }
            if (!ok) {
                console.log('[Music] Falling back to HTMLAudio for', trackName);
                MUSIC.play(trackName, { fadeInMs: 800, loop: true });
            }
        }
        applyVolumeLevels();
    } catch(e) {
        console.warn('Music start failed:', e);
        try { MUSIC.play(trackName, { fadeInMs: 800, loop: true }); } catch(_){ }
        applyVolumeLevels();
    }
    
    loop();
}

const LAUNCH = {
    active: false,
    startTs: 0,
    duration: 3000,
    lastTs: 0,
    stars: [],
    starCount: 320,
    frame: null,
    overlay: null,
    octx: null,
    uiLayer: null,
    skipAllowed: false,
    skipFns: [],
    rumble: null
};

function beginLaunch() {
    if (LAUNCH.active) return;
    try { stopMenuMusic(); } catch(_){}
    const overlay = document.createElement('canvas');
    overlay.id = 'launch-overlay';
    overlay.width = BASE_W; overlay.height = BASE_H;
    Object.assign(overlay.style, {
        position: 'absolute', left: '0', top: '0', width: '100%', height: '100%', opacity: '.5',
        pointerEvents: 'none', zIndex: '1'
    });
    gameWrapper.appendChild(overlay);
    const octx = overlay.getContext('2d');

    LAUNCH.active = true;
    LAUNCH.startTs = performance.now();
    LAUNCH.lastTs = LAUNCH.startTs;
    LAUNCH.stars = [];
    LAUNCH.overlay = overlay;
    LAUNCH.octx = octx;
    LAUNCH.uiLayer = document.getElementById('ui-layer');
    LAUNCH.skipAllowed = false;

    for (let i = 0; i < LAUNCH.starCount; i++) {
        const w = (Math.random() < 0.7) ? 1 : 2;
        LAUNCH.stars.push({
            x: Math.random() * overlay.width,
            y: -Math.random() * (overlay.height + 200),
            w,
            lenMax: 80 + Math.random() * 60,
            len: w,
            speed: 260 + Math.random() * 440,
            spawnDelay: Math.random() * 1500, 
            alpha: 0.45 + Math.random() * 0.55
        });
    }

    const startScreen = document.getElementById('start-screen');
    if (startScreen) startScreen.style.pointerEvents = 'none';

    const onKey = (e) => { if (LAUNCH.active && LAUNCH.skipAllowed && (e.code === 'Space' || e.code === 'Enter')) { e.preventDefault?.(); endLaunch(true); } };
    const onClick = (e) => { if (LAUNCH.active && LAUNCH.skipAllowed) { e.preventDefault?.(); endLaunch(true); } };
    document.addEventListener('keydown', onKey);
    document.addEventListener('mousedown', onClick);
    document.addEventListener('touchstart', onClick, { passive: false });
    LAUNCH.skipFns = [ ['keydown', onKey], ['mousedown', onClick], ['touchstart', onClick] ];

    (async () => {
        try {
            if (AudioEngine && AudioEngine.state && AudioEngine.state.ready) {
                const ok = await AudioEngine.playMusic('waltuh', 1, true, 0);
                if (!ok) { MUSIC.play('waltuh', { loop: true, fadeInMs: 0 }); }
            } else {
                MUSIC.play('waltuh', { loop: true, fadeInMs: 0 });
            }
        } catch(_){ }
    })();

    setTimeout(() => {
        try {
            const playingWebAudio = !!(AudioEngine && AudioEngine.state && AudioEngine.state.currentMusic);
            const playingHtmlAudio = !!(MUSIC && MUSIC.current);
            if (!playingWebAudio && !playingHtmlAudio) {
                const track = bgm.waltuh;
                if (track) {
                    try {
                        track.loop = true;
                        track.muted = false;
                        track.volume = SETTINGS.musicMuted ? 0 : 0.2;
                        const p = track.play();
                        if (p && typeof p.then === 'function') {
                            p.catch(()=>{});
                        }
                        MUSIC.current = track; MUSIC.name = 'waltuh'; MUSIC.targetVolume = track.volume;
                    } catch(_) {}
                }
            }
        } catch(_) {}
    }, 300);

    LAUNCH.frame = requestAnimationFrame(launchLoop);
}
window.beginLaunch = beginLaunch;

function launchLoop(now) {
    if (!LAUNCH.active) return;
    LAUNCH.frame = requestAnimationFrame(launchLoop);
    const elapsed = now - LAUNCH.startTs;
    const dt = Math.max(0, now - LAUNCH.lastTs);
    LAUNCH.lastTs = now;
    const t = Math.min(1, elapsed / LAUNCH.duration);

    if (!LAUNCH.skipAllowed && elapsed >= 500) LAUNCH.skipAllowed = true;

    const amp = 12 * (t * t);
    const dx = (Math.random() - 0.5) * 2 * amp;
    const dy = (Math.random() - 0.5) * 2 * amp;
    if (LAUNCH.uiLayer) LAUNCH.uiLayer.style.transform = `translate(${dx}px, ${dy}px)`;
    if (LAUNCH.overlay) LAUNCH.overlay.style.transform = `translate(${dx}px, ${dy}px)`;

    try { sfx.launch.volume = Math.max(0, Math.min(1, 0.1 + 0.9 * t)); } catch(_){}

    const octx = LAUNCH.octx, overlay = LAUNCH.overlay; if (!octx || !overlay) return;
    octx.clearRect(0,0,overlay.width, overlay.height);
    octx.save();
    octx.globalCompositeOperation = 'lighter';
    const fadeIn = Math.min(1, (elapsed / LAUNCH.duration) / 1);
    const fadeOut = Math.min(1, ((LAUNCH.duration - elapsed) / LAUNCH.duration) / 1);
    const fade = Math.max(0, Math.min(1, Math.min(fadeIn, fadeOut)));
    const dtSec = dt / 1000;
    for (let i = 0; i < LAUNCH.stars.length; i++) {
        const s = LAUNCH.stars[i];
        const starElapsed = Math.max(0, elapsed - (s.spawnDelay || 0));
        const starT = Math.max(0, Math.min(1, starElapsed / LAUNCH.duration));
        s.y += s.speed * dtSec;
        const growEase = starT * starT; 
        s.len = s.w + (s.lenMax - s.w) * growEase;
        const alpha = s.alpha * (5 + 5 * fade);
        if (starT < 0.12) {
            octx.fillStyle = `rgba(255,100,255,${alpha})`;
            const thinW = Math.max(.5, s.w * 0.3);
            octx.fillRect(Math.floor(s.x - thinW / 2), Math.floor(s.y - s.w), thinW, s.w);
        } else {
            octx.strokeStyle = `rgba(255,100,255,${alpha})`;
            octx.lineWidth = s.w;
            octx.beginPath();
            octx.moveTo(s.x, s.y - s.len);
            octx.lineTo(s.x, s.y);
            octx.stroke();
        }
        if (s.y - s.len > overlay.height + 8) {
            s.x = Math.random() * overlay.width;
            s.y = -Math.random() * (overlay.height * 0.6 + 120);
            s.w = (Math.random() < 0.7) ? 1 : 2;
            s.lenMax = 80 + Math.random() * 60;
            s.len = s.w;
            s.speed = 260 + Math.random() * 440;
            s.spawnDelay = elapsed + Math.random() * 800;
            s.alpha = 0.45 + Math.random() * 0.55;
        }
    }
    octx.restore();

    if (elapsed >= LAUNCH.duration) {
        endLaunch(false);
    }
}

async function endLaunch(skipped) {
    if (!LAUNCH.active) return;
    LAUNCH.active = false;
    if (LAUNCH.frame) { cancelAnimationFrame(LAUNCH.frame); LAUNCH.frame = null; }
    if (LAUNCH.uiLayer) LAUNCH.uiLayer.style.transform = '';
    if (LAUNCH.overlay) LAUNCH.overlay.style.transform = '';
    if (LAUNCH.overlay && LAUNCH.overlay.parentNode) LAUNCH.overlay.parentNode.removeChild(LAUNCH.overlay);
    LAUNCH.overlay = null; LAUNCH.octx = null; LAUNCH.stars = [];
    const startScreen = document.getElementById('start-screen');
    if (startScreen) startScreen.style.pointerEvents = '';
    for (const [evt, fn] of (LAUNCH.skipFns || [])) {
        try { document.removeEventListener(evt, fn); } catch(_){}
    }
    LAUNCH.skipFns = [];
    if (skipped) {
        try { sfx.launch.pause(); sfx.launch.currentTime = 0; } catch(_){}
    }
    
    try {
        if (AudioEngine.state.ctx && AudioEngine.state.ctx.state === 'suspended') {
            await AudioEngine.state.ctx.resume();
        }
    } catch(e) {
        console.warn('AudioContext resume failed on launch end:', e);
    }
    
    startGame();
}


function showDraft() {
    GAME.state = 'DRAFT';
    try { stopGunAudio(); } catch(_){ }
    try { LOOPING.stopAll(); } catch(_){ }
    try { MUSIC.stop({ fadeOutMs: 1000 }); } catch(_){ }
    try { if (AudioEngine && AudioEngine.stopMusic) AudioEngine.stopMusic(1000); } catch(_){ }
    const con = document.getElementById('draft-cards');
    con.innerHTML = '';
    bullets = [];
    resetParticlePool();
    const draftCost = Math.max(0, (GAME.draftCount || 0) * 5);
    const runEssEl = document.getElementById('run-essence-display');
    if (runEssEl) runEssEl.innerText = (GAME.essence || 0);
    
    for(let i=0; i<3; i++) {
        const desiredOrder = ['shotgun','gatling','sniper'];
        const traitId = desiredOrder[i] || 'shotgun';
        let trait = C.traits.find(t => t.id === traitId) || C.traits[0];
        let allowedTypes;
        if (traitId === 'shotgun') {
            allowedTypes = ['Cybil','Sofia'];
        } else if (traitId === 'gatling') {
            allowedTypes = ['Lydia','Cybil','Sofia'];
        } else { 
            allowedTypes = ['Lydia'];
        }
        const type = allowedTypes[Math.floor(Math.random() * allowedTypes.length)];
        
        let d = document.createElement('div');
        d.className = `card`;
        d.innerHTML = `
            <h3>${type}</h3>
            <div class="trait">${trait.name}</div>
            <div class="stats">${trait.desc}</div>
            <div class="card-cost" style="position:absolute; right:10px; top:10px; font-family: 'Orbitron', monospace; font-weight:500;">
                <span style="color:#ffff00">ESSENCE:</span>
                <span style="color:#00ffff">${draftCost}</span>
            </div>
        `;
        d.onclick = () => {
            playSfx('click');
            if (draftCost > 0 && (GAME.essence || 0) < draftCost) {
                return;
            }
            const newbie = new Pet(type, trait, false);
            let placed = false;
            for (let s = 1; s <= 10; s++) {
                if (!party[s] || (party[s] && party[s].hp <= 0)) {
                    party[s] = newbie;
                    placed = true;
                    break;
                }
            }
            if (!placed) {
                if (party.length < 11) {
                    party.push(newbie);
                } else {
                    party[party.length - 1] = newbie;
                }
            }
            if (draftCost > 0) {
                GAME.essence = Math.max(0, (GAME.essence || 0) - draftCost);
            }
            GAME.draftCount = (GAME.draftCount || 0) + 1;
            resume();
        };
        con.appendChild(d);
    }
    document.getElementById('draft-screen').classList.remove('hidden');
}

function onEnemyKilled(enemy, cause) {
    try {
        const isBoss = enemy && enemy.rank === 'BOSS';
        if (isBoss) {
            GAME.essence += Math.floor(7 * GAME.floor * 0.8);
        } else {
            GAME.essence += (1 + GAME.floor);
        }
        GAME.enemiesKilled++;
        GAME.totalKillsRun = (GAME.totalKillsRun || 0) + 1;
    } catch(_){
        GAME.enemiesKilled++;
        GAME.totalKillsRun = (GAME.totalKillsRun || 0) + 1;
    }
}

async function resume() {
    GAME.floor++;
    GAME.enemiesRequired = 10 + (GAME.floor - 1);
    GAME.bossQuota = 1 + Math.floor(GAME.floor / 5);
    GAME.powerupQuota = 1 + Math.floor((GAME.floor - 1) / 5);
    GAME.bossesSpawned = 0;
    GAME.powerupsSpawned = 0; 
    GAME.powerupSpawnTimer = 0;
    GAME.enemiesSpawned = 0;
    GAME.enemiesKilled = 0; 
    GAME.target = null;
    GAME.warship = null;
    GAME._warshipSpawned = false;
    GAME._pendingBossWarning = false;
    bossSpawnedThisFloor = false;
    bullets = [];
    resetParticlePool();
    powerups = [];
    
    document.getElementById('draft-screen').classList.add('hidden');
    GAME.state = 'PLAY';
    if(activeFrame) { cancelAnimationFrame(activeFrame); activeFrame = null; }
    GAME.lastTs = performance.now();
    GAME.spawnTimer = 0;
    GAME.awaitingDraft = false;
    GAME.postBossTimer = 0;
    GAME.deathTimer = 0;

    if (party[0]) {
        const p0 = party[0];
        p0.x = canvas.width / 2;
        p0.y = canvas.height + 40;
        p0.targetX = canvas.width / 2;
        p0.targetY = Math.min(C.laneY - 90, canvas.height - 120);
        p0.entering = true;
    }
    const trackName = pickTrackForSector(GAME.floor);
    try {
        if (AudioEngine.state.ctx && AudioEngine.state.ctx.state === 'suspended') {
            await AudioEngine.state.ctx.resume();
        }
        const isAlreadyPlaying = (AudioEngine.state.musicName === trackName) || (MUSIC.name === trackName);
        if (isAlreadyPlaying) {
            console.log('Music already playing:', trackName);
        } else {
            try { MUSIC.stop({ fadeOutMs: 0 }); } catch(_){ }
            let ok = false;
            try {
                ok = !!(await AudioEngine.playMusic(trackName, 1, true, 800).catch(() => false));
            } catch(_) { ok = false; }
            if (!ok && AudioEngine && AudioEngine.state && AudioEngine.state.ready) {
                try {
                    const url = musicUrlForName(trackName);
                    console.log('[Music] resume(): loading buffer for', trackName, url);
                    await AudioEngine.loadBuffer(trackName, url).catch((err)=>{ console.log('[Music] resume(): loadBuffer failed', trackName, err); });
                    const hasBuf = AudioEngine.state && AudioEngine.state.buffers && AudioEngine.state.buffers.has(trackName);
                    console.log('[Music] resume(): buffer present?', hasBuf);
                    ok = !!(await AudioEngine.playMusic(trackName, 1, true, 800).catch(() => false));
                    console.log('[Music] resume(): play after load ok?', ok);
                } catch(_) { ok = false; }
            }
            if (!ok) {
                console.log('[Music] resume(): falling back to HTMLAudio for', trackName);
                MUSIC.play(trackName, { fadeInMs: 800, loop: true });
            }
        }
        applyVolumeLevels();
    } catch(e) {
        console.warn('Music resume failed:', e);
        try { MUSIC.play(trackName, { fadeInMs: 800, loop: true }); } catch(_){ }
        applyVolumeLevels();
    }
    const p0 = party[0];
    if (p0 && p0.beamActive) {
            if ((meta.rateLvl || 0) >= 15) {
            LOOPING.play('laser2');
            if (p0.powerup && p0.powerup.type === 'BIG' && p0.powerup.time > 0) {
                LOOPING.play('laser3');
            }
        } else {
            LOOPING.play('laser1');
        }
    }
    loop();
}

const ICONS = {
    pause: '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M15.75 5.25v13.5m-7.5-13.5v13.5" /></svg>',
    play: '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 0 1 0 1.972l-11.54 6.347a1.125 1.125 0 0 1-1.667-.986V5.653Z" /></svg>',
    sfxOn: '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M19.114 5.636a9 9 0 0 1 0 12.728M16.463 8.288a5.25 5.25 0 0 1 0 7.424M6.75 8.25l4.72-4.72a.75.75 0 0 1 1.28.53v15.88a.75.75 0 0 1-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.009 9.009 0 0 1 2.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75Z" /></svg>',
    sfxOff: '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M17.25 9.75 19.5 12m0 0 2.25 2.25M19.5 12l2.25-2.25M19.5 12l-2.25 2.25m-10.5-6 4.72-4.72a.75.75 0 0 1 1.28.53v15.88a.75.75 0 0 1-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.009 9.009 0 0 1 2.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75Z" /></svg>',
    musicOn: '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="m9 9 10.5-3m0 6.553v3.75a2.25 2.25 0 0 1-1.632 2.163l-1.32.377a1.803 1.803 0 1 1-.99-3.467l2.31-.66a2.25 2.25 0 0 0 1.632-2.163Zm0 0V2.25L9 5.25v10.303m0 0v3.75a2.25 2.25 0 0 1-1.632 2.163l-1.32.377a1.803 1.803 0 1 1-.99-3.467l2.31-.66A2.25 2.25 0 0 0 9 15.553Z" /></svg>',
    musicOff: '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M17.25 9.75 19.5 12m0 0 2.25 2.25M19.5 12l2.25-2.25M19.5 12l-2.25 2.25m-10.5-6 4.72-4.72a.75.75 0 0 1 1.28.53v15.88a.75.75 0 0 1-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.009 9.009 0 0 1 2.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75Z" /></svg>'
};
function togglePause() {
    const btn = document.getElementById('pause-btn');
    if(GAME.state === 'PLAY') {
        if(activeFrame) { cancelAnimationFrame(activeFrame); activeFrame = null; }
        GAME.state = 'PAUSE';
        if(btn) { btn.innerHTML = ICONS.play; btn.setAttribute('aria-label','Resume'); }
    } else if (GAME.state === 'PAUSE') {
        GAME.lastTs = performance.now();
        GAME.state = 'PLAY';
        if(btn) { btn.innerHTML = ICONS.pause; btn.setAttribute('aria-label','Pause'); }
        loop();
    }
}
window.togglePause = togglePause;

function updateAudioButtons() {
    const sfxBtn = document.getElementById('sfx-mute-btn');
    const musBtn = document.getElementById('music-mute-btn');
    if (sfxBtn) sfxBtn.innerHTML = SETTINGS.sfxMuted ? ICONS.sfxOff : ICONS.sfxOn;
    if (musBtn) musBtn.innerHTML = SETTINGS.musicMuted ? ICONS.musicOff : ICONS.musicOn;
}
document.addEventListener('DOMContentLoaded', updateAudioButtons);

function skipDraft() {
    playSfx('click');
    party.forEach(p => { if (p && p.hp > 0) p.hp = p.maxHp; });
    GAME.draftCount = (GAME.draftCount || 0) + 1;
    resume();
}

function gameOver() {
    if(GAME.state === 'GAME_OVER') return;
    GAME.state = 'GAME_OVER';
    if(activeFrame) { cancelAnimationFrame(activeFrame); activeFrame = null; }
    if(GAME.floor > meta.highScore) meta.highScore = GAME.floor;
    meta.essence += GAME.essence;
    localStorage.setItem('neonTowerSave', JSON.stringify(meta));
    const go = document.getElementById('game-over');
    if(go) {
        const finalFloorEl = document.getElementById('final-floor');
        const totalKillsEl = document.getElementById('total-kills');
        const essenceEarnedEl = document.getElementById('essence-earned');
        const totalEssenceEl = document.getElementById('total-essence');
        if (finalFloorEl) finalFloorEl.innerText = GAME.floor;
        if (totalKillsEl) totalKillsEl.innerText = (GAME.totalKillsRun || 0);
        if (essenceEarnedEl) essenceEarnedEl.innerText = GAME.essence || 0;
        if (totalEssenceEl) totalEssenceEl.innerText = meta.essence || 0;
        go.classList.remove('hidden');
    }
    try { LOOPING.stopAll(); } catch(e){}
    activeAudio.forEach(a => { try { a.pause(); a.currentTime = 0; } catch(e){} });
    activeAudio.length = 0;
    try {
        (sfxPool.shoot || []).forEach(a => { try { a.pause(); a.currentTime = 0; } catch(e){} });
        (sfxPool.gat || []).forEach(a => { try { a.pause(); a.currentTime = 0; } catch(e){} });
        (sfxPool.beam || []).forEach(a => { try { a.pause(); a.currentTime = 0; } catch(e){} });
    } catch(e){}
    document.getElementById('start-screen').classList.add('hidden');
    document.getElementById('draft-screen').classList.add('hidden');
    updateUI();
}

function restartRun() {
    location.reload();
}
window.restartRun = restartRun;

function closeGameOver() {
    const go = document.getElementById('game-over');
    if (!go) return;
    go.classList.add('closing');
    setTimeout(() => { go.classList.remove('closing'); go.classList.add('hidden'); }, 240);
    document.getElementById('start-screen').classList.remove('hidden');
    GAME.state = 'MENU';
    try { startMenuMusic(); } catch(_){}
}
window.closeGameOver = closeGameOver;
    const draft = document.getElementById('draft-screen');
    if (draft) {
        draft.classList.add('closing');
        setTimeout(() => { draft.classList.remove('closing'); draft.classList.add('hidden'); }, 240);
    }

function updateUI() {
    const bossIsPresent = enemies.some(e => e.rank === 'BOSS');
    let remaining = GAME.enemiesRequired - GAME.enemiesKilled;
    remaining = Math.max(0, remaining); 
    
    let waveText;
    if (remaining > 0) {
        waveText = `(${remaining})`;
    } else if (bossIsPresent) {
        waveText = "BOSS"; 
    } else {
        waveText = "COMPLETE";
    }

    document.getElementById('floor-display').innerText = `${GAME.floor} ${waveText}`;
    {
        const el = document.getElementById('essence-display');
        const from = DISPLAY.gameEssence;
        const to = GAME.essence || 0;
        animateCount(el, from, to, 350, '');
        DISPLAY.gameEssence = to;
    }

    const hsEl = document.getElementById('high-score');
    const recValEl = document.getElementById('record-floor');
    if (recValEl) { recValEl.innerText = `${meta.highScore}`; }
    else if (hsEl) { hsEl.innerText = `RECORD: SECTOR ${meta.highScore}`; }
    {
        const el = document.getElementById('meta-essence-display');
        const from = DISPLAY.metaEssence;
        const to = meta.essence || 0;
        animateCount(el, from, to, 350, '');
        DISPLAY.metaEssence = to;
    }

    document.getElementById('lvl-dmg').innerText = `LVL ${meta.dmgLvl}`;
    document.getElementById('lvl-rate').innerText = `LVL ${meta.rateLvl}`;
    const hpLvlEl = document.getElementById('lvl-hp');
    if (hpLvlEl) hpLvlEl.innerText = `LVL ${meta.chargeLvl}`;
    const supLvlEl = document.getElementById('lvl-support');
    if (supLvlEl) supLvlEl.innerText = `LVL ${Math.min(10, meta.supportCount || 0)}`;

    const nextCost = computeUpgradeCost(meta.totalUpgrades || 0);
    {
        const elD = document.getElementById('cost-dmg');
        const elR = document.getElementById('cost-rate');
        const dmgUnavailable = (meta.dmgLvl >= 14) && (meta.rateLvl >= 15 || meta.chargeLvl >= 15);
        const rateUnavailable = (meta.rateLvl >= 14) && (meta.dmgLvl >= 15 || meta.chargeLvl >= 15);
        if (elD) {
            elD.innerText = dmgUnavailable ? `UNAVAILABLE` : `${nextCost} ESSENCE`;
            elD.classList.toggle('disabled', !!dmgUnavailable);
            const tileD = elD.closest('.shop-item');
            if (tileD) tileD.classList.toggle('disabled', !!dmgUnavailable);
        }
        if (elR) {
            elR.innerText = rateUnavailable ? `UNAVAILABLE` : `${nextCost} ESSENCE`;
            elR.classList.toggle('disabled', !!rateUnavailable);
            const tileR = elR.closest('.shop-item');
            if (tileR) tileR.classList.toggle('disabled', !!rateUnavailable);
        }
        DISPLAY.upgradeCost = nextCost;
    }
    const costHpEl = document.getElementById('cost-hp');
    if (costHpEl) {
        const hpUnavailable = (meta.chargeLvl >= 14) && (meta.dmgLvl >= 15 || meta.rateLvl >= 15);
        costHpEl.innerText = hpUnavailable ? `UNAVAILABLE` : `${nextCost} ESSENCE`;
        costHpEl.classList.toggle('disabled', !!hpUnavailable);
        const tileH = costHpEl.closest('.shop-item');
        if (tileH) tileH.classList.toggle('disabled', !!hpUnavailable);
    }
    const costSupEl = document.getElementById('cost-support');
    const supportItem = document.getElementById('shop-support');
    const supportMaxed = (meta.supportCount || 0) >= 10;
    const nextSupportCost = 1000 + 500 * Math.max(0, Math.min(10, (meta.supportCount || 0)));
    if (costSupEl) costSupEl.innerText = supportMaxed ? `MAX` : `${nextSupportCost} ESSENCE`;
    if (supportItem) {
        if (supportMaxed) supportItem.classList.add('disabled');
        else supportItem.classList.remove('disabled');
    }
}
function grantRandomPowerup(p) {
    if (!p) return;
    const hasSpecial = (meta.dmgLvl || 0) >= 15 || (meta.rateLvl || 0) >= 15;
    const options = hasSpecial ? ['BIG','SHIELD','TIMEWARP'] : ['TRIPLE','FIRE2X','PIERCE','BIG','SEXTUPLE','SHIELD','TIMEWARP'];
    const pick = options[Math.floor(Math.random()*options.length)];
    p.powerup.type = pick;
    if (pick === 'BIG' && (meta.rateLvl || 0) >= 15) {
    p.powerup.time = 12;
    LOOPING.play('laser3');
    setTimeout(() => { LOOPING.stop('laser3'); }, 12000);
    } else {
        p.powerup.time = 10;
    }
    const messages = {
        TRIPLE: 'TRIPLE SHOT',
        FIRE2X: 'RAPID SHOT',
        PIERCE: 'PIERCING SHOT',
        BIG: 'BIG SHOT',
        SEXTUPLE: 'MULTI SHOT',
        SHIELD: 'SHIELD',
        TIMEWARP: 'TIME WARP'
    };
    const el = document.getElementById('powerup-warning');
    if (el) {
        el.textContent = messages[pick] || 'POWER-UP ACQUIRED';
        el.classList.remove('hidden');
        setTimeout(() => el.classList.add('hidden'), 1800);
    }
    if (pick === 'SHIELD') {
        try { p.shieldActive = true; p.shieldTimer = p.powerup.time || 12; } catch(_) {}
        try { vibrate(120); } catch(_) {}
    }
    if (pick === 'TIMEWARP') {
        try { window.timeWarpActive = true; window.timeWarpTimer = p.powerup.time || 10; } catch(_) {}
        try { vibrate(140); } catch(_) {}
    }
    playSfx('powerup');
}

function resetUpgrades() {
    const n = meta.totalUpgrades || 0;
    const refundFull = computeUpgradeRefund(n);
    const sN = Math.max(0, Math.min(10, meta.supportCount || 0));
    const supportRefundFull = (sN > 0) ? (sN * 1000 + 500 * ((sN - 1) * sN) / 2) : 0;
    const totalSpent = refundFull + supportRefundFull;
    const partial = Math.round(totalSpent * 0.6);
    if (typeof meta.essence !== 'number') meta.essence = 0;
    meta.essence += partial;
    meta.dmgLvl = 0;
    meta.rateLvl = 0;
    meta.chargeLvl = 0;
    meta.totalUpgrades = 0;
    meta.upgradeCost = computeUpgradeCost(0);
    meta.supportCount = 0;
    try {
        localStorage.setItem('neonTowerSave', JSON.stringify(meta));
    } catch (e) {}
    updateUI();
}

window.resetUpgrades = resetUpgrades;

function openResetConfirm() {
    const modal = document.getElementById('reset-confirm');
    if (!modal) return;
    playSfx('click');
    modal.classList.remove('hidden');
}
window.openResetConfirm = openResetConfirm;

function initResetConfirmEvents() {
    const modal = document.getElementById('reset-confirm');
    const confirmBtn = document.getElementById('reset-confirm-btn');
    const cancelBtn = document.getElementById('reset-cancel-btn');
    if (!modal || !confirmBtn || !cancelBtn) return;
    const hide = () => modal.classList.add('hidden');
    const animatedClose = () => {
        const dlg = modal.querySelector('.reset-dialog');
        if (dlg) {
            dlg.classList.add('closing');
            setTimeout(() => { dlg.classList.remove('closing'); hide(); }, 240);
        } else {
            hide();
        }
    };
    confirmBtn.addEventListener('click', () => { playSfx('click'); resetUpgrades(); animatedClose(); });
    cancelBtn.addEventListener('click', () => { playSfx('click'); animatedClose(); });
    modal.addEventListener('click', (e) => {
        const dlg = document.querySelector('#reset-confirm .reset-dialog');
        if (!dlg) return;
        if (!dlg.contains(e.target)) animatedClose();
    });
}

document.addEventListener('DOMContentLoaded', initResetConfirmEvents);

(function setupIntroAutoplayFallback(){
    function startIntro(){
        try {
            if (!MUSIC.current && !AudioEngine.state.currentMusic) {
                if (AudioEngine.state.ready) {
                    AudioEngine.playMusic('intro1', 1, true, 0);
                } else {
                    MUSIC.play('intro1', { loop: true, fadeInMs: 0 });
                }
            }
        } catch(_) {}
        document.removeEventListener('mousedown', startIntro);
        document.removeEventListener('touchstart', startIntro);
        document.removeEventListener('keydown', startIntro);
    }
    document.addEventListener('mousedown', startIntro);
    document.addEventListener('touchstart', startIntro, { passive: true });
    document.addEventListener('keydown', startIntro);
})();

function openAccessibility(){
    const modal = document.getElementById('accessibility-modal');
    if (!modal) return;
    const leftBtn = document.getElementById('joy-left-btn');
    const rightBtn = document.getElementById('joy-right-btn');
    const move = document.getElementById('move-sens');
    const shake = document.getElementById('shake-level');
    const sfxLevel = document.getElementById('sfx-level');
    const musicLevel = document.getElementById('music-level');
    if (leftBtn && rightBtn) {
        const reflect = () => {
            const jr = !!ACCESS.joyRight;
            leftBtn.classList.toggle('selected', !jr);
            rightBtn.classList.toggle('selected', jr);
        };
        reflect();
        leftBtn.onclick = () => { ACCESS.joyRight = false; reflect(); saveAccessibility(); };
        rightBtn.onclick = () => { ACCESS.joyRight = true; reflect(); saveAccessibility(); };
    }
    if (move) {
        const mvLabel = document.getElementById('move-sens-val');
        move.value = String(ACCESS.moveLevel || 3);
        if (mvLabel) mvLabel.textContent = move.value;
        const min = parseFloat(move.min||'1');
        const max = parseFloat(move.max||'5');
        const val = parseFloat(move.value||String(ACCESS.moveLevel||3));
        const pct = Math.max(0, Math.min(1, (val - min) / Math.max(1, (max - min)))) * 100;
        move.style.setProperty('--fill', pct + '%');
        move.oninput = () => {
            ACCESS.moveLevel = Math.min(5, Math.max(1, parseInt(move.value)||3));
            if (mvLabel) mvLabel.textContent = String(ACCESS.moveLevel);
            const v = parseFloat(move.value||String(ACCESS.moveLevel));
            const p = Math.max(0, Math.min(1, (v - min) / Math.max(1, (max - min)))) * 100;
            move.style.setProperty('--fill', p + '%');
            saveAccessibility();
        };
    }
    if (shake) {
        const shLabel = document.getElementById('shake-level-val');
        shake.value = String(ACCESS.shakeLevel || 3);
        if (shLabel) shLabel.textContent = shake.value;
        {
            const min = parseFloat(shake.min||'1');
            const max = parseFloat(shake.max||'5');
            const val = parseFloat(shake.value||String(ACCESS.shakeLevel||3));
            const pct = Math.max(0, Math.min(1, (val - min) / Math.max(1, (max - min)))) * 100;
            shake.style.setProperty('--fill', pct + '%');
        }
        shake.oninput = () => {
            ACCESS.shakeLevel = Math.min(5, Math.max(1, parseInt(shake.value)||3));
            if (shLabel) shLabel.textContent = String(ACCESS.shakeLevel);
            const min = parseFloat(shake.min||'1');
            const max = parseFloat(shake.max||'5');
            const v = parseFloat(shake.value||String(ACCESS.shakeLevel));
            const p = Math.max(0, Math.min(1, (v - min) / Math.max(1, (max - min)))) * 100;
            shake.style.setProperty('--fill', p + '%');
            saveAccessibility();
        };
    }
    if (sfxLevel) {
        const valEl = document.getElementById('sfx-level-val');
        sfxLevel.value = String(ACCESS.sfxLevel || 5);
        if (valEl) valEl.textContent = sfxLevel.value;
        try {
            const min = parseFloat(sfxLevel.min||'1');
            const max = parseFloat(sfxLevel.max||'5');
            const val = parseFloat(sfxLevel.value||String(ACCESS.sfxLevel||5));
            const pct = Math.max(0, Math.min(1, (val - min) / Math.max(1, (max - min)))) * 100;
            sfxLevel.style.setProperty('--fill', pct + '%');
        } catch(_){}
        sfxLevel.oninput = () => {
            const v = Math.min(5, Math.max(1, parseInt(sfxLevel.value)||5));
            ACCESS.sfxLevel = v; if (valEl) valEl.textContent = String(v);
            try {
                const min = parseFloat(sfxLevel.min||'1');
                const max = parseFloat(sfxLevel.max||'5');
                const pct = Math.max(0, Math.min(1, (v - min) / Math.max(1, (max - min)))) * 100;
                sfxLevel.style.setProperty('--fill', pct + '%');
            } catch(_){}
            applyVolumeLevels(); saveAccessibility();
        };
        sfxLevel.onchange = () => { saveAccessibility(); };
    }
    if (musicLevel) {
        const valEl = document.getElementById('music-level-val');
        musicLevel.value = String(ACCESS.musicLevel || 5);
        if (valEl) valEl.textContent = musicLevel.value;
        try {
            const min = parseFloat(musicLevel.min||'1');
            const max = parseFloat(musicLevel.max||'5');
            const val = parseFloat(musicLevel.value||String(ACCESS.musicLevel||5));
            const pct = Math.max(0, Math.min(1, (val - min) / Math.max(1, (max - min)))) * 100;
            musicLevel.style.setProperty('--fill', pct + '%');
        } catch(_){}
        musicLevel.oninput = () => {
            const v = Math.min(5, Math.max(1, parseInt(musicLevel.value)||5));
            ACCESS.musicLevel = v; if (valEl) valEl.textContent = String(v);
            try {
                const min = parseFloat(musicLevel.min||'1');
                const max = parseFloat(musicLevel.max||'5');
                const pct = Math.max(0, Math.min(1, (v - min) / Math.max(1, (max - min)))) * 100;
                musicLevel.style.setProperty('--fill', pct + '%');
            } catch(_){}
            applyVolumeLevels(); saveAccessibility();
        };
        musicLevel.onchange = () => { saveAccessibility(); };
    }
    const closeBtn = document.getElementById('acc-close-btn');
    if (closeBtn) closeBtn.onclick = () => { closeAccessibility(); };
    const onKey = (e) => {
        if (e.code === 'Escape') {
            closeAccessibility();
            document.removeEventListener('keydown', onKey);
        }
    };
    document.addEventListener('keydown', onKey);
    modal.classList.remove('hidden');
}
window.openAccessibility = openAccessibility;

function closeAccessibility(){
    const modal = document.getElementById('accessibility-modal');
    if (!modal) return;
    const dlg = modal.querySelector('.reset-dialog');
    if (dlg) {
        dlg.classList.add('closing');
        setTimeout(() => { dlg.classList.remove('closing'); modal.classList.add('hidden'); }, 240);
    } else {
        modal.classList.add('hidden');
    }
}
window.closeAccessibility = closeAccessibility;

function levelToGain(level){
    const l = Math.min(5, Math.max(1, level||3));
    switch (l) {
        case 1: return 0.0;   
        case 2: return 0.25;  
        case 3: return 0.70;  
        case 4: return 0.85;  
        case 5: return 1.00;  
    }
    return 0.70;
}

function applyVolumeLevels(){
    const sfxGain = levelToGain(ACCESS.sfxLevel || 5);
    const musicGain = levelToGain(ACCESS.musicLevel || 5);
    try {
        if (AudioEngine.state.sfxGain) AudioEngine.state.sfxGain.gain.value = SETTINGS.sfxMuted ? 0 : sfxGain;
        if (AudioEngine.state.musicGain) AudioEngine.state.musicGain.gain.value = SETTINGS.musicMuted ? 0 : Math.min(1, musicGain);
    } catch(_){}
    try {
        for (const a of activeAudio) {
            if (a && typeof a.volume === 'number') {
                a.volume = SETTINGS.sfxMuted ? 0 : Math.max(0, Math.min(1, sfxGain));
                if (!a.paused && a.volume > 0 && typeof a.play === 'function') { try { a.play(); } catch(_){} }
            }
        }
        LOOPING.map.forEach(a => {
            try {
                if (a && typeof a.volume === 'number') {
                    a.volume = SETTINGS.sfxMuted ? 0 : Math.max(0, Math.min(1, sfxGain));
                    if (!a.paused && a.volume > 0 && typeof a.play === 'function') { try { a.play(); } catch(_){} }
                }
            } catch(_){}
        });
        if (MUSIC.current) {
            MUSIC.targetVolume = Math.max(0, Math.min(1, musicGain));
            try {
                MUSIC.current.volume = SETTINGS.musicMuted ? 0 : MUSIC.targetVolume;
                if (!MUSIC.current.paused && MUSIC.current.volume > 0 && typeof MUSIC.current.play === 'function') { try { MUSIC.current.play(); } catch(_){} }
            } catch(_){}
        }
    } catch(_){}
}

document.addEventListener('DOMContentLoaded', () => { try { applyVolumeLevels(); } catch(_){} });
document.addEventListener('DOMContentLoaded', () => {
    try {
        const sfxLevel = document.getElementById('sfx-level');
        const musicLevel = document.getElementById('music-level');
        const sfxVal = document.getElementById('sfx-level-val');
        const musicVal = document.getElementById('music-level-val');
        if (sfxLevel) {
            sfxLevel.value = String(ACCESS.sfxLevel || 5);
            if (sfxVal) sfxVal.textContent = sfxLevel.value;
        }
        if (musicLevel) {
            musicLevel.value = String(ACCESS.musicLevel || 5);
            if (musicVal) musicVal.textContent = musicLevel.value;
        }
    } catch(_){}
});

function openSkins(){
    const modal = document.getElementById('skins-modal');
    if (!modal) return;
    modal.classList.remove('hidden');
    initSkinsEvents();
    const onKey = (e) => {
        if (e.code === 'Escape') {
            modal.classList.add('hidden');
            document.removeEventListener('keydown', onKey);
        }
    };
    document.addEventListener('keydown', onKey);
}
function closeSkins(){
    const modal = document.getElementById('skins-modal');
    if (!modal) return;
    const dlg = modal.querySelector('.reset-dialog');
    if (dlg) {
        dlg.classList.add('closing');
        setTimeout(() => { dlg.classList.remove('closing'); modal.classList.add('hidden'); }, 240);
    } else {
        modal.classList.add('hidden');
    }
}
window.openSkins = openSkins;
window.closeSkins = closeSkins;

const SKINS = {
    STARCORE: { cost: 500 },
    MOONLIGHT: { cost: 750 },
    DARKMATTER: { cost: 1000 }
};
const SKIN_PERKS = {
    STARCORE: { label: '+ARMOR', armorMult: 0.75 },
    MOONLIGHT: { label: '+REGEN', regenPctPerSec: 0.02 },
    DARKMATTER: { label: '+HEALTH', playerHpBonus: 120, supportHpBonus: 60 }
};
const SKIN_THEMES = {
    DEFAULT:  { primary: '#ff00ff', accent: '#ffaaff' },
    STARCORE: { primary: '#ffffff', accent: '#ff66ff' },
    MOONLIGHT:{ primary: '#00ff88', accent: '#008844' },
    DARKMATTER:{ primary: '#bb0000', accent: '#880000' }
};
const SkinImages = {
    DEFAULT: (() => { const i = new Image(); i.src = 'skins/DEFAULT.png'; return i; })(),
    STARCORE: (() => { const i = new Image(); i.src = 'skins/STARCORE.png'; return i; })(),
    MOONLIGHT: (() => { const i = new Image(); i.src = 'skins/MOONLIGHT.png'; return i; })(),
    DARKMATTER: (() => { const i = new Image(); i.src = 'skins/DARKMATTER.png'; return i; })(),
    Cybil: (() => { const i = new Image(); i.src = 'skins/Cybil.png'; return i; })(),
    Sofia: (() => { const i = new Image(); i.src = 'skins/Sofia.png'; return i; })(),
};

function getSkinData(){
    const data = JSON.parse(localStorage.getItem('starSabreSkins')) || { purchased: {}, selected: null };
    return data;
}
function setSkinData(data){
    localStorage.setItem('starSabreSkins', JSON.stringify(data));
}

function renderSkinCards(){
    const data = getSkinData();
    const cards = document.querySelectorAll('#skins-modal .skin-card');
    cards.forEach(card => {
        const skinId = card.getAttribute('data-skin');
        const nameEl = card.querySelector('.skin-name');
        const costEl = card.querySelector('.skin-cost');
        let perkEl = card.querySelector('.skin-perk');
        if (!perkEl) {
            perkEl = document.createElement('div');
            perkEl.className = 'skin-perk';
            if (nameEl) nameEl.insertAdjacentElement('afterend', perkEl);
        }
        const purchased = skinId === 'DEFAULT' ? true : !!data.purchased[skinId];
        const isSelected = data.selected === skinId;
        if (purchased) {
            nameEl.textContent = skinId; 
            costEl.textContent = isSelected ? 'Selected' : 'Purchased';
        } else {
            const cost = SKINS[skinId]?.cost || parseInt(card.getAttribute('data-cost')) || 0;
            costEl.textContent = `${cost} ESSENCE`;
        }
        const perk = SKIN_PERKS[skinId];
        if (perkEl) {
            perkEl.textContent = perk ? perk.label : '';
        }
        card.classList.toggle('selected', isSelected);
    });
}

function tryPurchaseOrSelectSkin(skinId){
    const data = getSkinData();
    const cost = SKINS[skinId]?.cost;
    const purchased = !!data.purchased[skinId];
    if (!purchased) {
        if (meta.essence >= cost) {
            meta.essence -= cost;
            data.purchased[skinId] = true;
            setSkinData(data);
            localStorage.setItem('neonTowerSave', JSON.stringify(meta));
            updateUI();
            playSfx('powerup');
        } else {
            playSfx('hit');
            return;
        }
    }
    data.selected = (data.selected === skinId) ? null : skinId;
    setSkinData(data);
    renderSkinCards();
}

function getSelectedSkin(){
    const data = getSkinData();
    return data.selected || 'DEFAULT';
}

function getSkinTheme(){
    const id = getSelectedSkin();
    return SKIN_THEMES[id] || SKIN_THEMES.DEFAULT;
}

function initSkinsEvents(){
    const container = document.getElementById('skins-modal');
    if (!container) return;
    const cards = container.querySelectorAll('.skin-card');
    cards.forEach(card => {
        card.onclick = () => {
            const skinId = card.getAttribute('data-skin');
            tryPurchaseOrSelectSkin(skinId);
        };
    });
    renderSkinCards();
}

function buyUpgrade(type) {
    if (type === 'hp') type = 'charge';
    const isSpecialActive = (meta.dmgLvl >= 15) || (meta.rateLvl >= 15) || (meta.chargeLvl >= 15);
    if (isSpecialActive && type !== 'support') {
        if (type === 'dmg' && (meta.rateLvl >= 15 || meta.chargeLvl >= 15) && (meta.dmgLvl >= 14)) { playSfx('click'); return updateUI(); }
        if (type === 'rate' && (meta.dmgLvl >= 15 || meta.chargeLvl >= 15) && (meta.rateLvl >= 14)) { playSfx('click'); return updateUI(); }
        if (type === 'charge' && (meta.dmgLvl >= 15 || meta.rateLvl >= 15) && (meta.chargeLvl >= 14)) { playSfx('click'); return updateUI(); }
    }
    if (type === 'support') {
        const current = Math.max(0, meta.supportCount || 0);
        if (current >= 10) { playSfx('click'); updateUI(); return; }
        const supportCost = 1000 + 500 * current;
        if ((meta.essence || 0) < supportCost) { playSfx('click'); return; }
        meta.essence -= supportCost;
        meta.supportCount = current + 1;
        if (meta.supportCount > 10) meta.supportCount = 10;
        playSfx('click');
        updateUI();
        localStorage.setItem('neonTowerSave', JSON.stringify(meta));
        return;
    }
    const cost = computeUpgradeCost(meta.totalUpgrades || 0);
    if (meta.essence < cost) { playSfx('click'); return; }
    meta.essence -= cost;
    playSfx('upgrade');
    if (type === 'dmg') meta.dmgLvl = (meta.dmgLvl || 0) + 1;
    if (type === 'rate') meta.rateLvl = (meta.rateLvl || 0) + 1;
    if (type === 'charge') meta.chargeLvl = (meta.chargeLvl || 0) + 1;
    meta.totalUpgrades = (meta.totalUpgrades || 0) + 1;
    meta.upgradeCost = computeUpgradeCost(meta.totalUpgrades || 0);
    updateUI();
    localStorage.setItem('neonTowerSave', JSON.stringify(meta));
}

updateUI();

const traitCycle = { sniper: -1, gatling: -1, shotgun: -1 };

function traitUnits(traitId) {
    return party.map((p,i)=>({p,i}))
        .filter(o => o.p && o.p.hp > 0 && o.p.trait && o.p.trait.id === traitId);
}

function triggerTraitUlt(traitId) {
    const units = traitUnits(traitId);
    if(!units.length) return false;
    let start = (traitCycle[traitId] + 1) % units.length;
    for(let offset=0; offset<units.length; offset++) {
        const idx = (start + offset) % units.length;
        const {p} = units[idx];
        if(p.ultCharge >= 100) {
            activateUlt(p);
            traitCycle[traitId] = idx;
            return true;
        }
    }
    return false;
}

const JOY = { stickX:0, stickY:0, radius:100 }; 
const JOY_ARROWS = {
    up: new Path2D('M4.5 15.75 L12 8.25 L19.5 15.75'),
    left: new Path2D('M15.75 19.5 L8.25 12 L15.75 4.5'),
    right: new Path2D('M8.25 4.5 L15.75 12 L8.25 19.5'),
    down: new Path2D('M19.5 8.25 L12 15.75 L4.5 8.25')
};
function updateKeyboardStick() {
    if(input.joystickActive) {
        JOY.stickX = input.jVecX * JOY.radius;
        JOY.stickY = input.jVecY * JOY.radius;
        return;
    }
    let dx = 0, dy = 0;
    if(input.left) dx -= 1;
    if(input.right) dx += 1;
    if(input.up) dy -= 1;
    if(input.down) dy += 1;
    const len = Math.hypot(dx, dy);
    let targetX = 0, targetY = 0;
    if(len > 0) { targetX = (dx/len) * JOY.radius; targetY = (dy/len) * JOY.radius; }
    const lerp = 0.25;
    JOY.stickX += (targetX - JOY.stickX) * lerp;
    JOY.stickY += (targetY - JOY.stickY) * lerp;
    if(Math.abs(JOY.stickX) < 0.5) JOY.stickX = 0;
    if(Math.abs(JOY.stickY) < 0.5) JOY.stickY = 0;
}

function drawJoystickOverlay() {
    const jc = getJoyCenter();
    const baseX = jc.x; 
    const baseY = jc.y;
    ctx.save();
    ctx.globalCompositeOperation = 'source-over';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.strokeStyle = '#808';
    ctx.fillStyle = 'rgba(255,0,255,0.15)';
    ctx.arc(baseX, baseY, JOY.radius, 0, Math.PI*2); ctx.fill(); ctx.stroke();
    try {
        const p0 = party && party[0];
        const theme = getSkinTheme ? getSkinTheme() : { primary: '#ff00ff' };
        const last = p0 && p0._boostCooldownTs || 0;
        const elapsed = last ? (performance.now() - last) : Infinity;
        const cdMs = 2000;
        const pct = Math.min(1, Math.max(0, elapsed / cdMs));
        const startAng = -Math.PI/2; 
        const endAng = startAng + pct * Math.PI * 2;
        const trackR = JOY.radius + 0;
        ctx.beginPath();
        ctx.strokeStyle = 'rgba(255,255,255,0.15)';
        ctx.lineWidth = 3;
        ctx.arc(baseX, baseY, trackR, 0, Math.PI*2);
        ctx.stroke();
        ctx.beginPath();
        ctx.strokeStyle = hexToRgba(theme.primary || '#00ffff', 0.9);
        ctx.lineWidth = 4;
        ctx.arc(baseX, baseY, trackR, startAng, endAng);
        ctx.stroke();
    } catch(_) {}
    const sx = baseX + JOY.stickX * 0.65;
    const sy = baseY + JOY.stickY * 0.65;
    ctx.beginPath();
    ctx.fillStyle = '#000';
    ctx.strokeStyle = 'rgba(255,0,255,0.5)';
    ctx.arc(sx, sy, 16, 0, Math.PI*2); ctx.fill(); ctx.stroke();
    const arrowSize = 30;
    const arrowDist = 26; 
    const s = arrowSize / 24;
    let jdx = 0, jdy = 0, jm = 0;
    if (input.joystickActive) {
        jdx = input.jVecX; jdy = input.jVecY; jm = Math.min(1, Math.max(0, input.jMagnitude));
    } else {
        jdx = (JOY.stickX / JOY.radius) || 0;
        jdy = (JOY.stickY / JOY.radius) || 0;
        jm = Math.min(1, Math.hypot(jdx, jdy));
    }
    const len = Math.hypot(jdx, jdy) || 1;
    const ndx = jdx / len, ndy = jdy / len;
    function strengthFor(dirX, dirY) {
        const dot = Math.max(0, ndx*dirX + ndy*dirY);
        return Math.max(0.15, Math.min(1, dot * jm));
    }
    function drawArrow(path, cx, cy, k) {
        ctx.save();
        ctx.translate(cx, cy);
        ctx.scale(s, s);
        ctx.translate(-12, -12);
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.lineWidth = 2 / s; 
        ctx.strokeStyle = hexToRgba('#ff00ff', 0.25 + 0.65 * k);
        ctx.stroke(path);
        ctx.restore();
    }
    drawArrow(JOY_ARROWS.up,    sx, sy - arrowDist, strengthFor(0, -1));
    drawArrow(JOY_ARROWS.left,  sx - arrowDist, sy, strengthFor(-1, 0));
    drawArrow(JOY_ARROWS.right, sx + arrowDist, sy, strengthFor(1, 0));
    drawArrow(JOY_ARROWS.down,  sx, sy + arrowDist, strengthFor(0, 1));
    ctx.restore();
}

function drawReinforcementDebugOverlay() {
    if (!DEBUG_REINF_GUIDES) return;
    const maxSlots = 10;
    const centerX = canvas.width / 2;
    const rowY = Math.max(0, C.laneY - 40);
    const minInset = 32;
    const availWidth = Math.max(0, (canvas.width - minInset * 2));
    const defaultSpacing = 56;
    const spacingX = Math.min(defaultSpacing, availWidth / (maxSlots - 1));
    const totalWidth = spacingX * (maxSlots - 1);
    const startX = centerX - totalWidth / 2;
    ctx.save();
    ctx.lineWidth = 2;
    for (let i = 0; i < maxSlots; i++) {
        const x = startX + i * spacingX;
        const occupied = !!(party[i + 1] && party[i + 1].hp > 0);
        ctx.beginPath();
        ctx.strokeStyle = occupied ? 'rgba(0,255,180,0.9)' : 'rgba(255,255,255,0.35)';
        ctx.fillStyle = occupied ? 'rgba(0,255,180,0.18)' : 'rgba(255,255,255,0.08)';
        ctx.arc(x, rowY, 12, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = occupied ? '#0ff' : '#aaa';
        ctx.font = '10px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(String(i + 1), x, rowY);
    }
    ctx.restore();
}

const ULT_BUTTONS = [
    { 
        trait:'sniper', 
        label:'BOMB', 
        offsetY:0,
        color:'#0ff' 
    },
    { 
        trait:'gatling', 
        label:'BEAM', 
        offsetY:0, 
        color:'#ff0' 
    },
    { 
        trait:'shotgun', 
        label:'BURST', 
        offsetY:0, 
        color:'#0f0' 
    }
];
const ULT_BTN_RADIUS = 32;
const DEF_ULT_BTN_RADIUS = 36;

const ALL_ULTS = [
    { id:'default', label:'BLAST', color:'#f0f' },
    { id:'sniper', label:'BOMB', color:'#f0f' },
    { id:'gatling', label:'BEAM', color:'#ff0' },
    { id:'shotgun', label:'BURST', color:'#0ff' }
];
function getUltCircleCenter() {
    const joy = getJoyCenter();
    const leftX = (JOY.radius + 20);
    const rightX = canvas.width - (JOY.radius + 20);
    const cx = (joy.x === leftX) ? rightX : leftX;
    const cy = C.laneY;
    return { cx, cy };
}
function computeUltButtonPositions() {
    const { cx, cy } = getUltCircleCenter();
    const maxBtnR = Math.max(DEF_ULT_BTN_RADIUS, ULT_BTN_RADIUS);
    const innerR = Math.max(24, JOY.radius - (maxBtnR + 8));
    const byId = (id) => ALL_ULTS.find(u => u.id === id);
    return [
        { x: cx,           y: cy - innerR, ult: byId('default') }, 
        { x: cx - innerR,  y: cy,          ult: byId('gatling') }, 
        { x: cx + innerR,  y: cy,          ult: byId('sniper') },  
        { x: cx,           y: cy + innerR, ult: byId('shotgun') }  
    ];
}
function detectUltButton(x, y) {
    const pos = computeUltButtonPositions();
    const SELECT_R = 105; 
    let best = null; let bestDist = Infinity;
    for (const p of pos) {
        const d = Math.hypot(x - p.x, y - p.y);
        if (d <= SELECT_R && d < bestDist) { best = p; bestDist = d; }
    }
    return best ? best.ult.id : null;
}

function drawUltButtons() {
    ctx.save();
    ctx.lineWidth = 5;
    const pulseT = performance.now()/500;
    const { cx, cy } = getUltCircleCenter();
    ctx.beginPath();
    ctx.fillStyle = 'rgba(255,0,255,0.12)';
    ctx.strokeStyle = '#808';
    ctx.arc(cx, cy, JOY.radius, 0, Math.PI*2); ctx.fill(); ctx.stroke();

    const positions = computeUltButtonPositions();
    const theme = getSkinTheme();
    for (const pos of positions) {
        let pct = 0; let anyReady = false;
        if (pos.ult.id === 'default') {
            const main = party[0];
            if (main) { pct = Math.min(1, main.ultCharge/100); anyReady = main.ultCharge >= 100; }
            if ((meta.chargeLvl || 0) >= 15) {
                pos.ult.label = 'DOOM';
                pos.ult.color = '#bb0000';
            } else {
                pos.ult.color = theme.primary;
            }
        } else {
            const units = traitUnits(pos.ult.id);
            for (const {p} of units) {
                pct = Math.max(pct, Math.min(1, p.ultCharge/100));
                if (p.ultCharge >= 100) anyReady = true;
            }
        }
        const radius = pos.ult.id === 'default' ? DEF_ULT_BTN_RADIUS : ULT_BTN_RADIUS;
        ctx.beginPath();
        ctx.fillStyle = 'rgba(30,30,40,0.55)';
        ctx.strokeStyle = '#222';
        ctx.arc(pos.x, pos.y, radius, 0, Math.PI*2); ctx.fill(); ctx.stroke();
        if (pct > 0) {
            ctx.beginPath();
            ctx.strokeStyle = pos.ult.color;
            ctx.lineWidth = 4;
            ctx.arc(pos.x, pos.y, radius-4, -Math.PI/2, -Math.PI/2 + pct*Math.PI*2);
            ctx.stroke();
        }
        if (anyReady) {
            const glowAlpha = 0.55 + 0.35*Math.sin(pulseT*2);
            ctx.beginPath();
            ctx.lineWidth = 6 + 3*Math.sin(pulseT*3);
            ctx.strokeStyle = hexToRgba(pos.ult.color, glowAlpha);
            ctx.arc(pos.x, pos.y, radius, 0, Math.PI*2);
            ctx.stroke();
        }
        ctx.fillStyle = anyReady ? '#fff' : '#888';
        ctx.font = 'bold 14px monospace';
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(pos.ult.label, pos.x, pos.y);
    }
    ctx.restore();
}

function spawnSpacedPowerup() {
    const minSpacing = 160;
    let attempts = 12;
    let px = 0;
    let py = C.spawnY;
    while(attempts-- > 0) {
        const candX = Math.random() * (canvas.width - 60) + 30;
        let ok = true;
        for(const p of powerups) {
            const d = Math.hypot(candX - p.x, py - p.y);
            if (d < minSpacing) { ok = false; break; }
        }
        if (ok) { px = candX; break; }
    }
    const pu = new PowerupEntity();
    pu.x = px; pu.y = py;
    setTimeout(() => {
        powerups.push(pu);
    }, 3000);
}

function updatePlayerAura() {
    const aura = document.getElementById('player-aura');
    if(!aura) return;
    const p = party[0];
    if(!p || p.hp <= 0) {
        aura.classList.remove('active');
        aura.classList.add('hidden');
        return;
    }
    aura.style.left = p.x + 'px';
    aura.style.top = p.y + 'px';
    aura.style.setProperty('--aura-color', getSkinTheme().primary);
    if(p.ultCharge >= 100 || p.shieldActive) {
        aura.classList.add('active');
        aura.classList.remove('hidden');
    } else {
        aura.classList.remove('active');
        aura.classList.add('hidden');
    }
}

function vibrate(pattern) {
    if (navigator.vibrate) {
        navigator.vibrate(pattern);
    }
}
