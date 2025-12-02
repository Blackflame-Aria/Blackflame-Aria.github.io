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
    draftCount: 0
};
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
    20, 50, 90, 130, 200,
    300, 430, 600, 780, 950,
    1200, 1700, 2200, 2800, 3500,
    4500, 6000, 8000, 10000, 12000,
    15000
];
const UPGRADE_COST_R = 1.25;
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
if (typeof meta.chargeLvl !== 'number' && typeof meta.hpLvl === 'number') {
    meta.chargeLvl = meta.hpLvl;
    delete meta.hpLvl;
}
if (typeof meta.totalUpgrades !== 'number') {
    meta.totalUpgrades = (meta.dmgLvl || 0) + (meta.rateLvl || 0) + (meta.chargeLvl || 0);
}
if (typeof meta.upgradeCost !== 'number') {
    const base = 10;
    meta.upgradeCost = computeUpgradeCost(meta.totalUpgrades || 0);
}
if (typeof meta.supportCount !== 'number') {
    meta.supportCount = 0;
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
let textPopups = [];
let blooms = [];

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
        cybil: '#08f',
        sofia: '#0a0',
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
    launch: new Audio('sfx/launch.wav'),
    blackhole: new Audio('sfx/Blackhole.wav')
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

const bgm = {
    waltuh: new Audio('sfx/Waltuh.mp3'),
    waltuhLoop: new Audio('sfx/Waltuh-loop.mp3'),
    waltuhLoop2: new Audio('sfx/Waltuh-loop2.mp3'),
    rustyLoop: new Audio('sfx/Rusty-loop.mp3'),
    rusty: new Audio('sfx/Rusty.mp3')
};
bgm.waltuh.preload = 'auto';
bgm.waltuhLoop.preload = 'auto';
bgm.waltuhLoop2.preload = 'auto';
bgm.rustyLoop.preload = 'auto';
bgm.rusty.preload = 'auto';

function pickTrackForSector(sector) {
    if (sector <= 1) return 'waltuh';
    if (sector === 2) return 'waltuhLoop';
    const r = ((sector - 3) % 10 + 10) % 10; 
    if (r <= 1) return 'waltuhLoop2'; 
    if (r <= 3) return 'rustyLoop'; 
    if (r <= 6) return 'rusty';
    return 'waltuhLoop';
}

const MUSIC = {
    current: null,
    name: null,
    targetVolume: 1,
    _fadeTimer: null,
    play(name, opts = {}) {
        const track = bgm[name];
        if (!track) return;
        this.stop();
        this.current = track;
        this.name = name;
        const volume = typeof opts.volume === 'number' ? opts.volume : 1;
        const fadeInMs = typeof opts.fadeInMs === 'number' ? opts.fadeInMs : 0;
        const loop = (opts.loop !== undefined) ? !!opts.loop : true;
        try {
            track.loop = loop;
            this.targetVolume = Math.max(0, Math.min(1, volume));
            track.currentTime = 0;
            track.volume = SETTINGS.musicMuted ? 0 : (fadeInMs > 0 ? 0 : this.targetVolume);
            track.play().catch(()=>{});
            if (!SETTINGS.musicMuted && fadeInMs > 0) this.fadeTo(this.targetVolume, fadeInMs);
        } catch(_){}
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
    if (SETTINGS.sfxMuted) {
        stopAllAudio();
    }
    try { localStorage.setItem('neonAudio', JSON.stringify({ sfxMuted: SETTINGS.sfxMuted, musicMuted: SETTINGS.musicMuted })); } catch(_){}
    updateAudioButtons();
}
function toggleSfxMute() { setSfxMuted(!SETTINGS.sfxMuted); }
window.toggleSfxMute = toggleSfxMute;

function setMusicMuted(flag) {
    SETTINGS.musicMuted = !!flag;
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
    for (let i = 0; i < gatChannels; i++) {
        const a = new Audio('sfx/gat.wav');
        a.preload = 'auto';
        sfxPool.gat.push(a);
    }
    for (let i = 0; i < beamChannels; i++) {
        const a = new Audio('sfx/beam.wav');
        a.preload = 'auto';
        sfxPool.beam.push(a);
    }
})();

function playSfx(sound, volume = 1) {
    if (SETTINGS.sfxMuted) return;
    if (GAME.state !== 'PLAY') return;
    if (sfx[sound]) {
        if (sound === 'shoot') {
            const now = Date.now();
            if (now - GAME.lastShootSfxTime < 500) return;
            GAME.lastShootSfxTime = now;
            const pool = sfxPool.shoot;
            if (pool.length) {
                const i = sfxIndex.shoot;
                const ch = pool[i];
                sfxIndex.shoot = (i + 1) % pool.length;
                try { ch.pause(); ch.currentTime = 0; } catch(e){}
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
                ch.volume = volume;
                ch.play().catch(() => {});
                return;
            }
        } else if (sound === 'beam') {
            const now = Date.now();
            if (now - (GAME.lastBeamSfxTime || 0) < 400) return;
            GAME.lastBeamSfxTime = now;
            const pool = sfxPool.beam;
            if (pool.length) {
                const i = sfxIndex.beam;
                const ch = pool[i];
                sfxIndex.beam = (i + 1) % pool.length;
                try { ch.pause(); ch.currentTime = 0; } catch(e){}
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
            if (src.includes('shoot.wav') || src.includes('gat.wav')) {
                a.pause(); a.currentTime = 0; activeAudio.splice(i, 1);
            }
        } catch(e){}
    }
}

function stopAllAudio() {
    stopGunAudio();
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
        let baseHp = isMain ? 100 : 60;
        let baseRate = 35;

        if(this.trait.id === 'gatling') { 
            baseRate = 20; 
            baseDmg *= 0.65; 
        }
        if(this.trait.id === 'sniper') { 
            baseDmg *= 3; 
            baseRate *= 2.0; 
        }
        
        baseRate = Math.max(3, Math.round(baseRate * Math.pow(0.9, meta.rateLvl)));

        this.hp = baseHp;
        this.maxHp = baseHp;
        this.hpDisplay = this.hp; 
        this.dmg = baseDmg;
        this.cooldownMax = baseRate;
        this.cooldown = 0;
        this.size = 12;
        
        this.x = 0;
        this.y = C.laneY;
        this.recoil = 0;
        this.ultCharge = 0;
        this.ultMeter = 0;
        this.powerup = { type: null, time: 0 };
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

        if(this.cooldown > 0) this.cooldown -= GAME.dt;
        const chargeMult = 1 + (meta.chargeLvl || 0) * 0.20;
        let chargeRate = 0.1 * chargeMult;
        const hasDefaultTrait = !(this.trait && this.trait.id && (this.trait.id === 'sniper' || this.trait.id === 'gatling' || this.trait.id === 'shotgun'));
        if (this.isMain && hasDefaultTrait && (meta.chargeLvl || 0) >= 15) {
            chargeRate *= 0.5; 
        }
        this.ultCharge = Math.min(100, this.ultCharge + chargeRate * GAME.dt);

        if(!this.entering && this.cooldown <= 0) {
            let t = null;
            if (GAME.target && enemies.includes(GAME.target) && GAME.target.hp > 0) {
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
                playSfx('beam', 1);
                this.beamSfxBurstLeft--;
                this.beamSfxTimer = .8;
            }
            if (this.beamTime <= 0) {
                this.beamActive = false;
                this.beamTime = 0;
                this.beamSfxTimer = 0;
                this.beamSfxBurstLeft = 0;
            } else {
                let t = null;
                if (GAME.target && enemies.includes(GAME.target) && GAME.target.hp > 0) {
                    t = GAME.target;
                } else {
                    t = findClosestEnemy(this.x, this.y);
                }
                if (t) {
                    const msElapsed = GAME.dt * 10;
                    const dmg = msElapsed * 0.08;
                    const ang = Math.atan2(t.y - this.y, t.x - this.x);
                    const dirX = Math.cos(ang), dirY = Math.sin(ang);
                    const maxLen = Math.max(canvas.width, canvas.height) * 1.5;
                    const x2 = this.x + dirX * maxLen;
                    const y2 = this.y + dirY * maxLen;
                    const beamWidth = 10;
                    for (let e of enemies) {
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
                        if (dist <= (beamWidth + e.size)) {
                            e.hp -= dmg;
                            if (e.hp <= 0 && !e.deadProcessed) {
                                e.deadProcessed = true;
                                playSfx('die', 0.4);
                                createRainbowExplosion(e.x, e.y, e.rank === 'BOSS' ? 20 : 10);
                                GAME.enemiesKilled++;
                                if (GAME.target === e) GAME.target = null;
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
                for (let e of enemies) {
                    if (!e || e.hp <= 0) continue;
                    const dist = Math.hypot(e.x - this.x, e.y - this.y);
                    if (dist <= radius + e.size) {
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
                        if (e.hp <= 0 && !e.deadProcessed) {
                            e.deadProcessed = true;
                            playSfx('die', 0.35);
                            createRainbowExplosion(e.x, e.y, e.rank === 'BOSS' ? 40 : 18);
                            GAME.enemiesKilled++;
                            if (GAME.target === e) GAME.target = null;
                        }
                    }
                }
                GAME.shake = Math.max(GAME.shake, 3);
            }
        }
    }

    shoot(target) {
        this.recoil = 8;
        if (!this.isMain) {
            if (this.trait.id === 'shotgun') {
                playSfx('shotgun', 0.5);
            } else if (this.trait.id === 'gatling') {
            } else if (this.trait.id === 'sniper') {
                playSfx('shoot', 0.5);
            } else {
                playSfx('shoot', 0.5);
            }
        }

        if (this.powerup.type === 'FIRE2X' && this.powerup.time > 0) {
            this.gatSfxTimer -= GAME.dt / 60;
            if (this.gatSfxBurstLeft <= 0) {
                this.gatSfxBurstLeft = 10;
                this.gatSfxTimer = 0;
            }
            if (this.gatSfxTimer <= 0 && this.gatSfxBurstLeft > 0) {
                playSfx('gat', 0.12);
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
                playSfx('beam', 0.8);
            }
            return;
        }

        let count = (this.trait.id === 'shotgun') ? 3 : 1;
        if (this.powerup.type === 'TRIPLE') count = Math.max(count, 3);
        if (this.powerup.type === 'SEXTUPLE') count = Math.max(count, 6);
        
        if (isMainUnit && (meta.dmgLvl || 0) >= 15) {
            const chargeBoost = 1 + (meta.chargeLvl || 0) * 0.20;
            playSfx('ult', 0.8);
            GAME.shake = Math.max(GAME.shake, 15);
            activateSniperUlt(this, chargeBoost);
            return;
        }

        for(let i=0; i<count; i++) {
            let spread = (this.trait.id === 'shotgun') ? (Math.random()-0.5)*1.5 : (Math.random()-0.5)*0.2;
            let dmg = this.dmg;
            let bulletSizeMult = 1;
            let piercing = false;
            let shape = 'round';
            if (this.powerup.type === 'BIG') { dmg *= 3; bulletSizeMult = 3; shape = 'crescent'; }
            if (this.powerup.type === 'PIERCE') { piercing = true; }
            bullets.push(new Bullet(this.x, this.y - 10, target, dmg, this.type, spread, GAME.target, { bulletSizeMult, piercing, shape }));
        }
        
        if(this.trait.id === 'sniper') GAME.shake = 4;
    }

    draw() {
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.beginPath(); ctx.ellipse(this.x, this.y+10, 15, 5, 0, 0, Math.PI*2); ctx.fill();

        ctx.shadowBlur = 15;
        ctx.shadowColor = C.colors[this.type.toLowerCase()];
        ctx.fillStyle = C.colors[this.type.toLowerCase()];
        
        let drawY = this.y + this.recoil;
        
        if(this.type === 'Lydia') {
            drawPoly(this.x, drawY, 12, 3, GAME.time * 0.1);
        } else if (this.type === 'Cybil') {
            ctx.beginPath(); ctx.arc(this.x, drawY, 10, 0, Math.PI*2); ctx.fill();
        } else {
            drawPoly(this.x, drawY, 10, 4, Math.PI/4);
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

        const isPlayer = (party[0] === this);
        const healthR = isPlayer ? 16 : 14;
        const ultR = isPlayer ? 21 : 18;

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
        drawSolidRing.call(this, ultR, '#111', (C.colors[this.type.toLowerCase()] || '#f0f'), ultPct, 5);

        if (this.ultCharge >= 100) {
            ctx.save();
            ctx.globalCompositeOperation = 'lighter';
            const glow = C.colors[this.type.toLowerCase()] || '#f0f';
            const inner = ultR - 2;
            const outer = ultR + 12;
            const grad = ctx.createRadialGradient(this.x, this.y, inner, this.x, this.y, outer);
            grad.addColorStop(0.00, hexToRgba(glow, 0.55));
            grad.addColorStop(0.35, hexToRgba(glow, 0.38));
            grad.addColorStop(0.70, hexToRgba(glow, 0.22));
            grad.addColorStop(1.00, hexToRgba(glow, 0.0));
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.arc(this.x, this.y, outer, 0, Math.PI*2);
            ctx.fill();
            ctx.lineWidth = 7;
            ctx.strokeStyle = hexToRgba(glow, 0.85);
            ctx.beginPath();
            ctx.arc(this.x, this.y, ultR, 0, Math.PI*2);
            ctx.stroke();
            ctx.lineWidth = 3;
            ctx.strokeStyle = hexToRgba('#fff', 0.6);
            ctx.beginPath();
            ctx.arc(this.x, this.y, ultR - 4, 0, Math.PI*2);
            ctx.stroke();
            ctx.restore();
        }

        if (this.beamActive) {
            let t = null;
            if (GAME.target && enemies.includes(GAME.target) && GAME.target.hp > 0) {
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
                ctx.shadowColor = C.colors[this.type.toLowerCase()];
                ctx.strokeStyle = C.colors[this.type.toLowerCase()];
                ctx.lineWidth = 8;
                ctx.beginPath();
                ctx.moveTo(this.x, this.y);
                ctx.lineTo(endX, endY);
                ctx.stroke();
                ctx.shadowBlur = 0;
                ctx.strokeStyle = '#fff';
                ctx.lineWidth = 3;
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
    }

    update() {
        this.y += this.speed * GAME.dt;
        this.x += Math.sin(GAME.time * 0.05 + this.wobble) * 0.5;

        if(this.contactTimer > 0) this.contactTimer -= GAME.dt / 60;

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
                    dmg: 20, enemyShot: true, color: '#f00', active: true,
                    baseRadius: 18, 
                    radius: 18,
                    age: 0,
                    growthDuration: 2.6,
                    trail: [],
                    trailMax: 12,
                    rot: 0,
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
                                p.hp -= this.dmg;
                                playSfx('hit', 0.4);
                                GAME.shake = Math.max(GAME.shake, 5);
                                this.active = false;
                                break;
                            }
                        }
                        if(this.y > canvas.height+30 || this.x < -30 || this.x > canvas.width+30) this.active = false;
                    },
                    draw() {
                        ctx.save();
                        ctx.globalCompositeOperation = 'lighter';
                        if (this.trail && this.trail.length) {
                            for (let i = 0; i < this.trail.length; i++) {
                                const p = this.trail[i];
                                const t = i / this.trail.length;
                                const alpha = 0.08 + 0.18 * t;
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
                    p.hp -= dmg;
                    playSfx('hit', 0.4);
                    GAME.shake = Math.max(GAME.shake, this.rank === 'BOSS' ? 16 : 12);
                    this.contactTimer = 0.35;
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

        if(this === GAME.target) {
            const extra = (this.rank === 'BOSS') ? 28 : 14;
            const r = this.size + extra;
            ctx.lineWidth = (this.rank === 'BOSS') ? 4 : 4;
            ctx.strokeStyle = '#f0f';
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
        this.size = 12;
        this.speed = 1.0 + (GAME.floor * 0.05);
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

class Bullet {
    constructor(x, y, target, dmg, type, spread, lockOnTarget = null, opts = {}) {
        this.x = x; this.y = y;
        this.prevX = x; this.prevY = y;
        this.dmg = dmg;
        this.color = C.colors[type.toLowerCase()];
        this.active = true;
        this.sizeMult = opts.bulletSizeMult || 1;
        this.baseWidth = 3;
        this.width = this.baseWidth * this.sizeMult;
        this.growthRate = 0.2 * this.sizeMult;
        this.target = target;
        this.lockOnTarget = lockOnTarget;
        this.piercing = !!opts.piercing;
        this.shape = opts.shape || 'round';
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
        this.trail.push({x: this.x, y: this.y});
        if(this.trail.length > 3) this.trail.shift();

        const locked = (this.lockOnTarget && this.target === this.lockOnTarget);
        const shouldTrack = (locked || this.pierceChain) && this.target && enemies.includes(this.target) && this.target.hp > 0;
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
                playSfx('hit', 0.4);
                GAME.shake = Math.max(GAME.shake, e.rank === 'BOSS' ? 4 : 2.5);
                createParticles(this.x, this.y, this.color, 3);
                if(e.hp <= 0 && !e.deadProcessed) {
                    e.deadProcessed = true;
                    playSfx('die', 0.4);
                    GAME.shake = Math.max(GAME.shake, e.rank === 'BOSS' ? 14 : 7);
                    createRainbowExplosion(e.x, e.y, e.rank === 'BOSS' ? 80 : 40);
                    if(e.rank === 'BOSS') {
                        GAME.essence += Math.floor(5 * GAME.floor * 0.8);
                    } else {
                        GAME.essence += (1 + GAME.floor);
                    }
                    GAME.enemiesKilled++;
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
                        this.active = false;
                        break;
                    }
                } else if (this.shape === 'crescent') {
                    if (this.multiHitRemaining > 0) {
                        this.multiHitTimer = Math.max(this.multiHitTimer || 0, this.multiHitWindow);
                        this.multiHitRemaining--;
                    } else {
                        this.active = false;
                        break;
                    }
                } else {
                    this.active = false;
                    break;
                }
            }
        }
        if (this.shape === 'crescent' && (this.multiHitTimer || 0) > 0) {
            this.multiHitTimer -= secDelta;
            if (this.multiHitTimer <= 0 && this.multiHitRemaining <= 0) this.active = false;
        }
    }

    draw() {
        const isCrescent = (this.shape === 'crescent');
        if (isCrescent) {
            const ang = Math.atan2(this.vy, this.vx);
            const outerR = 18 * this.sizeMult;
            const innerR = outerR * 0.65;
            const span = 2.8; 
            const start = ang - span/2;
            const end = ang + span/2;
            ctx.save();
            ctx.globalCompositeOperation = 'lighter';
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.arc(this.x, this.y, outerR, start, end);
            ctx.arc(this.x, this.y, innerR, end, start, true);
            ctx.closePath();
            ctx.fill();
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

function findClosestEnemy(x, y) {
    let closest = null;
    let minD = Infinity;
    for(let e of enemies) {
        let d = (e.x - x)**2 + (e.y - y)**2;
        if(d < minD) { minD = d; closest = e; }
    }
    return closest;
}

function createParticles(x, y, color, count) {
    for(let i=0; i<count; i++) {
        particles.push({
            x, y, 
            vx: (Math.random()-0.5)*10, 
            vy: (Math.random()-0.5)*10,
            life: 1.0, color
        });
    }
}

function createRainbowExplosion(x, y, count) {
    for (let i = 0; i < count; i++) {
        const hue = Math.floor(Math.random() * 360);
        const color = `hsl(${hue}, 100%, 55%)`;
        particles.push({
            x, y,
            vx: (Math.random()-0.5) * 6,
            vy: (Math.random()-0.5) * 6,
            life: 1.8,
            fade: 0.035,
            size: 3 + Math.random()*2,
            color
        });
    }
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
const blackHoleImg = new Image(); blackHoleImg.src = 'images/BlackHole.png';
let starsOffset = 0;
let stars2Offset = 0;
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
        let dx = (Math.random()-0.5)*GAME.shake*2;
        let dy = (Math.random()-0.5)*GAME.shake*2;
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
    } else if (!bossIsPresent && GAME.bossesSpawned < GAME.bossQuota) {
        document.getElementById('boss-warning').classList.remove('hidden');
        setTimeout(() => {
            document.getElementById('boss-warning').classList.add('hidden');
            if (!enemies.some(e => e.rank === 'BOSS')) {
                enemies.push(new Enemy(true));
                GAME.bossesSpawned++;
            }
        }, 1500);
    }
    if (GAME.powerupsSpawned < GAME.powerupQuota) {
        GAME.powerupSpawnTimer -= GAME.dt / 60;
        if (GAME.powerupSpawnTimer <= 0) {
            spawnSpacedPowerup();
            GAME.powerupsSpawned++;
            GAME.powerupSpawnTimer = 6 + (powerups.length * 2) + Math.random()*1.5; 
        }
    }
    if (GAME.bossesSpawned >= GAME.bossQuota && !bossIsPresent && GAME.enemiesKilled >= GAME.enemiesRequired + GAME.bossQuota && !GAME.awaitingDraft) {
        GAME.awaitingDraft = true;
        GAME.postBossTimer = 3;
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

    for(let i=enemies.length-1; i>=0; i--) {
        let res = enemies[i].update();
        if(res === 'CRASH') {
            playSfx('die', 0.4);
            createParticles(enemies[i].x, enemies[i].y, C.colors.enemy, 8);
            if (party[0]) {
                const breachDmg = (enemies[i].rank === 'BOSS') ? 80 : 20;
                party[0].hp -= breachDmg;
                playSfx('hit', 0.4);
                GAME.shake = Math.max(GAME.shake, 5); 
            }
            enemies.splice(i, 1);
            GAME.enemiesKilled++;
            GAME.essence += (1 + GAME.floor);
        } else if (enemies[i].hp <= 0 && enemies[i].deadProcessed) {
            createParticles(enemies[i].x, enemies[i].y, C.colors.enemy, 8);
            enemies.splice(i, 1);
        } else {
            enemies[i].draw();
        }
    }

    for(let i=powerups.length-1; i>=0; i--) {
        const res = powerups[i].update();
        const p = party[0];
        if (p && p.hp > 0) {
            const hitR = powerups[i].pickupRadius || (powerups[i].size + (p.size || 12));
            const d = Math.hypot(powerups[i].x - p.x, powerups[i].y - p.y);
            if (d < hitR) {
                grantRandomPowerup(p);
                powerups.splice(i,1);
                continue;
            }
        }
        if (res === 'CRASH') {
            powerups.splice(i,1);
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
            if (granted) { powerups.splice(i,1); continue; }
            powerups[i].draw();
        }
    }

    for (let k = 1; k < party.length; k++) {
        const ally = party[k];
        if (ally && ally.hp <= 0 && !ally.deadProcessed) {
            ally.deadProcessed = true;
            stopGunAudio();
            createRainbowExplosion(ally.x, ally.y, 40);
            playSfx('die', 0.4);
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
                playSfx('die', 0.5);
                if (GAME.target === p0) GAME.target = null;
            }
        }
    } else {
        applyPlayerMovement();
        party.forEach((p, idx) => { if(p.hp > 0) { p.update(idx, party.length); p.draw(); } });
    }

    for(let i=bullets.length-1; i>=0; i--) {
        bullets[i].update();
        if(!bullets[i].active) bullets.splice(i, 1);
        else bullets[i].draw();
    }
    for(let i=particles.length-1; i>=0; i--) {
        let p = particles[i];
        p.x += p.vx; p.y += p.vy; 
        const fade = (p.fade !== undefined ? p.fade : 0.05);
        p.life -= fade;
        const alpha = Math.min(1, p.life);
        ctx.globalAlpha = alpha;
        ctx.fillStyle = p.color;
        const size = p.size || 3;
        ctx.fillRect(p.x - size/2, p.y - size/2, size, size);
        ctx.globalAlpha = 1;
        if(p.life <= 0) particles.splice(i, 1);
    }

    for (let i = blooms.length - 1; i >= 0; i--) {
        const b = blooms[i];
        if (b.maxRadius) {
            b.life -= realSec * (b.slow ? 0.55 : 0.95);
            if (b.life <= 0) { blooms.splice(i,1); continue; }
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
            ctx.strokeStyle = hexToRgba('#f00', ringAlpha * 0.5);
            ctx.beginPath(); ctx.arc(b.x, b.y, b.ringRadius, 0, Math.PI*2); ctx.stroke();
            if (elapsedPct < 0.25) {
                ctx.globalAlpha = (0.25 - elapsedPct) * 2.4;
                ctx.fillStyle = hexToRgba('#f00', 0.8 * (1 - elapsedPct));
                ctx.beginPath(); ctx.arc(b.x, b.y, b.ringRadius * 0.45, 0, Math.PI*2); ctx.fill();
                ctx.globalAlpha = 1;
            }
            ctx.restore();
        } else {
            b.life -= realSec;
            const alpha = Math.max(0, b.life / 0.6);
            const grad = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, b.radius);
            grad.addColorStop(0, `rgba(0,170,255,${0.35*alpha})`);
            grad.addColorStop(0.6, `rgba(0,170,255,${0.18*alpha})`);
            grad.addColorStop(1, `rgba(0,170,255,0)`);
            ctx.fillStyle = grad;
            ctx.beginPath(); ctx.arc(b.x, b.y, b.radius, 0, Math.PI*2); ctx.fill();
            if (b.life <= 0) blooms.splice(i,1);
        }
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

    const hasGat = party.some(p => p && p.hp > 0 && p.trait && p.trait.id === 'gatling');
    if (hasGat && GAME.state === 'PLAY') {
        GAME.gatAmbientTimer -= realSec;
        if (GAME.gatAmbientTimer <= 0) {
            const prevState = GAME.state;
            playSfx('gat', 0.15);
            GAME.gatAmbientTimer = 1.0;
        }
    } else {
        GAME.gatAmbientTimer = 0; 
    }

    if (party[0] && party[0].hp > 0 && GAME.state === 'PLAY') {
        GAME.shootAmbientTimer -= realSec;
        if (GAME.shootAmbientTimer <= 0) {
            playSfx('shoot', 0.2);
            GAME.shootAmbientTimer = 0.35;
        }
    } else {
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
});
window.addEventListener('keyup', (e) => {
    const c = e.code;
    if(c === 'ArrowLeft' || c === 'KeyA') input.left = false;
    if(c === 'ArrowRight' || c === 'KeyD') input.right = false;
    if(c === 'ArrowUp' || c === 'KeyW') input.up = false;
    if(c === 'ArrowDown' || c === 'KeyS') input.down = false;
});

canvas.addEventListener('mousedown', (e) => {
    if(GAME.state !== 'PLAY') return;
    const { x, y } = toCanvasCoords(e.clientX, e.clientY);
    const traitClicked = detectUltButton(x, y);
    if(traitClicked) {
        playSfx('click', 0.3);
        if (traitClicked === 'default') {
            const p = party[0];
            if (p && p.ultCharge >= 100) activateUlt(p);
        } else {
            triggerTraitUlt(traitClicked);
        }
        return;
    }
    playSfx('click', 0.3);
    const selectionR = 90;
    let best = null; let bestDist = Infinity; let bestType = null; let bestPet = null;
    for(let en of enemies) {
        const d = Math.hypot(en.x - x, en.y - y);
        if(d <= en.size + selectionR && d < bestDist) { best = en; bestDist = d; bestType = 'enemy'; }
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
    const baseX = JOY.radius + 30; 
    const baseY = C.laneY;
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
    const baseX = JOY.radius + 30; 
    const baseY = C.laneY;
    input.jStartX = baseX; input.jStartY = baseY;
    let dx = x - baseX;
    let dy = y - baseY;
    const dist = Math.hypot(dx, dy);
    if (dist > 14) input.jMoved = true;
    const maxR = JOY.radius;
    const clamped = Math.min(dist, maxR);
    const scale = dist === 0 ? 0 : clamped / dist;
    dx *= scale; dy *= scale;
    input.jVecX = dx / maxR; input.jVecY = dy / maxR; input.jMagnitude = clamped / maxR;
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
    let dirX = 0, dirY = 0, magnitude = 0;
    if (input.joystickActive) {
        dirX = input.jVecX; dirY = input.jVecY;
        magnitude = Math.min(1, Math.max(0, input.jMagnitude));
    } else {
        if(input.left) dirX -= 1;
        if(input.right) dirX += 1;
        if(input.up) dirY -= 1;
        if(input.down) dirY += 1;
        const len = Math.hypot(dirX, dirY);
        if (len > 0) { dirX /= len; dirY /= len; magnitude = 1; }
    }

    const accel = 0.8;   
    const maxSpeed = 7;  
    const friction = .3; 

    if (magnitude > 0.01) {
        p.vx += dirX * accel * magnitude;
        p.vy += dirY * accel * magnitude;
    } else {
        p.vx *= (1 - friction);
        p.vy *= (1 - friction);
        if (Math.abs(p.vx) < 0.02) p.vx = 0;
        if (Math.abs(p.vy) < 0.02) p.vy = 0;
    }

    const sp = Math.hypot(p.vx, p.vy);
    if (sp > maxSpeed) {
        const s = maxSpeed / sp;
        p.vx *= s; p.vy *= s;
    }

    p.x += p.vx;
    p.y += p.vy;

    const minX = 20, maxX = canvas.width - 20;
    const minY = 20, maxY = C.laneY - 20;
    if (p.x < minX) { p.x = minX; if (p.vx < 0) p.vx = 0; }
    if (p.x > maxX) { p.x = maxX; if (p.vx > 0) p.vx = 0; }
    if (p.y < minY) { p.y = minY; if (p.vy < 0) p.vy = 0; }
    if (p.y > maxY) { p.y = maxY; if (p.vy > 0) p.vy = 0; }
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
        playSfx('blackhole', 0.9);
        GAME.shake = 22;
        return; 
    }
    playSfx('ult', 0.8);
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.fillRect(0,0,canvas.width,canvas.height);

    const chargeBoost = 1 + (meta.chargeLvl || 0) * 0.20;

    const tid = (pet.trait && pet.trait.id) ? pet.trait.id.toLowerCase() : 'none';
    if (tid === 'sniper') { activateSniperUlt(pet, chargeBoost); return; }
    if (tid === 'gatling') { pet.beamActive = true; pet.beamTime = 10; pet.beamSfxTimer = 0; pet.beamSfxBurstLeft = 10; playSfx('beam', 0.9); return; }
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
            createParticles(e.x, e.y, '#f00', 6);
            if (e.hp <= 0 && !e.deadProcessed) {
                e.deadProcessed = true;
                playSfx('die', 0.4);
                createRainbowExplosion(e.x, e.y, e.rank === 'BOSS' ? 80 : 40);
                GAME.enemiesKilled++;
                if (GAME.target === e) GAME.target = null;
            }
        }
    });
    spawnUltBloom(pet.x, pet.y, C.colors[pet.type.toLowerCase()] || '#ff00ff');
}

function activateSniperUlt(pet, chargeBoost) {
    const target = GAME.target && enemies.includes(GAME.target) ? GAME.target : findClosestEnemy(pet.x, pet.y);
    if (!target) return;
    const ang = Math.atan2(target.y - pet.y, target.x - pet.x);
    const spd = 14; 
    const mainDamage = Math.round(40 * chargeBoost);
    const splashDamage = Math.round(10 * chargeBoost);
    const splashRadius = 150;

    const proj = {
        x: pet.x,
        y: pet.y,
        vx: Math.cos(ang) * spd,
        vy: Math.sin(ang) * spd,
        radius: 40, 
        color: C.colors['cybil'], 
        active: true,
        update() {
            this.x += this.vx * GAME.dt;
            this.y += this.vy * GAME.dt;
            for (let i = 0; i < enemies.length; i++) {
                const e = enemies[i];
                const d = Math.hypot(this.x - e.x, this.y - e.y);
                if (d < this.radius + e.size) {
                    e.hp -= mainDamage;
                    if (e.hp <= 0 && !e.deadProcessed) {
                        e.deadProcessed = true;
                        playSfx('die', 0.4);
                        createRainbowExplosion(e.x, e.y, e.rank === 'BOSS' ? 80 : 40);
                        GAME.enemiesKilled++;
                        if (GAME.target === e) GAME.target = null;
                    }
                    for (let j = 0; j < enemies.length; j++) {
                        const o = enemies[j];
                        const dd = Math.hypot(this.x - o.x, this.y - o.y);
                        if (dd <= splashRadius) {
                            o.hp -= splashDamage;
                            createParticles(o.x, o.y, '#08f', 8);
                            if (o.hp <= 0 && !o.deadProcessed) {
                                o.deadProcessed = true;
                                playSfx('die', 0.4);
                                createRainbowExplosion(o.x, o.y, o.rank === 'BOSS' ? 80 : 40);
                                GAME.enemiesKilled++;
                                if (GAME.target === o) GAME.target = null;
                            }
                        }
                    }
                    GAME.shake = Math.max(GAME.shake, 20);
                    spawnCanvasExplosion(this.x, this.y, this.radius * 1);
                    this.active = false;
                    break;
                }
            }
            if (this.x < -50 || this.x > canvas.width + 50 || this.y < -50 || this.y > canvas.height + 50) this.active = false;
        },
        draw() {
            ctx.save();
            ctx.globalCompositeOperation = 'lighter';
            ctx.shadowBlur = 20;
            ctx.shadowColor = '#08f';
            ctx.fillStyle = '#022a';
            ctx.beginPath(); ctx.arc(this.x, this.y, this.radius, 0, Math.PI*2); ctx.fill();
            ctx.shadowBlur = 0;
            ctx.strokeStyle = '#08f';
            ctx.lineWidth = 3;
            ctx.beginPath(); ctx.arc(this.x, this.y, this.radius, 0, Math.PI*2); ctx.stroke();
            ctx.globalCompositeOperation = 'source-over';
            ctx.restore();
        }
    };
    bullets.push(proj);
}

function spawnCanvasExplosion(x, y, r) {
    const bursts = 360;
    for (let i = 0; i < bursts; i++) {
        const a = Math.random() * Math.PI * 1;
        const m = r * (0.5 + Math.random()*0.9);
        particles.push({
            x, y,
            vx: Math.cos(a) * (m/18),
            vy: Math.sin(a) * (m/18),
            life: 1,
            color: (i % 3 === 0)? '#ff00ff' : (i % 3 === 1 ? '#00d4ff' : '#ffffff')
        });
    }
    blooms.push({ x, y, radius: r*0.7, maxRadius: r*2.0, ringRadius: r*1.3, life: 1, maxLife: 1, pulse: 0, slow: true, colors:['#f0f','#f0f','#f00'] });
    blooms.push({ x, y, radius: r*1.2, maxRadius: r*2.8, ringRadius: r*1.9, life: 1, maxLife:1, pulse:0, slow: true, colors:['#550022','#002255','#000814'] });
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
                        playSfx('hit', 0.3);
                        createParticles(e.x, e.y, this.color, 3);
                        if (e.hp <= 0 && !e.deadProcessed) {
                            e.deadProcessed = true;
                            playSfx('die', 0.4);
                            createRainbowExplosion(e.x, e.y, e.rank === 'BOSS' ? 80 : 40);
                            GAME.enemiesKilled++;
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
        particles.push({
            x, y,
            vx: Math.cos(a) * sp,
            vy: Math.sin(a) * sp,
            life: 0.6,
            fade: 0.08,
            size: 2 + Math.random()*2,
            color
        });
    }
}

function spawnUltBloom(x, y, baseColor) {
    const r = 180; 
    const innerColors = ['#ff0000', '#ff6699', '#ffffff'];
    blooms.push({ x, y, radius: r*0.8, maxRadius: r*2.6, ringRadius: r*1.6, life:1.4, maxLife:1.4, pulse:0, colors: innerColors });
    const outerColors = ['#551a00', '#330033', '#000000'];
    blooms.push({ x, y, radius: r*1.2, maxRadius: r*3.4, ringRadius: r*2.1, life:1.2, maxLife:1.2, pulse:0, colors: outerColors });
}

function startGame() {
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
        const alt = new Pet('Cybil', sniperTrait, false);
        alt.hp = 100; alt.maxHp = 100;
        if (party.length < 11) party.push(alt);
    }
    enemies = []; bullets = []; powerups = []; particles = [];
    GAME.floor = 1; 
    GAME.essence = 0;
    GAME.enemiesSpawned = 0;
    GAME.enemiesKilled = 0; 
    GAME.enemiesRequired = 10;
    GAME.bossQuota = 1; 
    GAME.powerupQuota = 1; 
    GAME.bossesSpawned = 0;
    GAME.powerupsSpawned = 0;
    GAME.powerupSpawnTimer = 0;
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

    try { MUSIC.play('waltuh', { loop: true, volume: .2 }); } catch(_){}

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

function endLaunch(skipped) {
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
    startGame();
}


function showDraft() {
    GAME.state = 'DRAFT';
    stopAllAudio();
    const con = document.getElementById('draft-cards');
    con.innerHTML = '';
    bullets = [];
    particles = [];
    const draftCost = Math.max(0, (GAME.draftCount || 0) * 5);
    
    for(let i=0; i<3; i++) {
            let type = ['Lydia', 'Cybil', 'Sofia'][Math.floor(Math.random()*3)];
        let trait = C.traits[Math.floor(Math.random()*C.traits.length)];
        
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
            playSfx('click', 0.2);
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

function resume() {
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
    bossSpawnedThisFloor = false;
    bullets = [];
    particles = [];
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
    MUSIC.play(trackName, { fadeInMs: 0, loop: true, volume: .2 });
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
    playSfx('click', 0.2);
    party.forEach(p => p.hp = p.maxHp);
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
        if (totalKillsEl) totalKillsEl.innerText = GAME.enemiesKilled || 0;
        if (essenceEarnedEl) essenceEarnedEl.innerText = GAME.essence || 0;
        if (totalEssenceEl) totalEssenceEl.innerText = meta.essence || 0;
        go.classList.remove('hidden');
    }
    activeAudio.forEach(a => { try { a.pause(); a.currentTime = 0; } catch(e){} });
    activeAudio.length = 0;
    try {
        (sfxPool.shoot || []).forEach(a => { try { a.pause(); a.currentTime = 0; } catch(e){} });
        (sfxPool.gat || []).forEach(a => { try { a.pause(); a.currentTime = 0; } catch(e){} });
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
    if(go) go.classList.add('hidden');
    document.getElementById('start-screen').classList.remove('hidden');
    GAME.state = 'MENU';
}
window.closeGameOver = closeGameOver;

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

    document.getElementById('high-score').innerText = `RECORD: ${meta.highScore}`;
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
    const options = ['TRIPLE','FIRE2X','PIERCE','BIG','SEXTUPLE'];
    const pick = options[Math.floor(Math.random()*options.length)];
    p.powerup.type = pick;
    p.powerup.time = 10;
    const messages = {
        TRIPLE: 'POWER-UP: TRIPLE SHOT',
        FIRE2X: 'POWER-UP: RAPID SHOT',
        PIERCE: 'POWER-UP: PIERCING SHOT',
        BIG: 'POWER-UP: BIG SHOT',
        SEXTUPLE: 'POWER-UP: MULTI SHOT'
    };
    const el = document.getElementById('powerup-warning');
    if (el) {
        el.textContent = messages[pick] || 'POWER-UP ACQUIRED';
        el.classList.remove('hidden');
        setTimeout(() => el.classList.add('hidden'), 1500);
    }
    playSfx('powerup', 0.6);
}

function resetUpgrades() {
    const n = meta.totalUpgrades || 0;
    const refund = computeUpgradeRefund(n);
    const sN = Math.max(0, Math.min(10, meta.supportCount || 0));
    const supportRefund = (sN > 0) ? (sN * 1000 + 500 * ((sN - 1) * sN) / 2) : 0;
    if (typeof meta.essence !== 'number') meta.essence = 0;
    meta.essence += (refund + supportRefund);
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
    modal.classList.remove('hidden');
}
window.openResetConfirm = openResetConfirm;

function initResetConfirmEvents() {
    const modal = document.getElementById('reset-confirm');
    const confirmBtn = document.getElementById('reset-confirm-btn');
    const cancelBtn = document.getElementById('reset-cancel-btn');
    if (!modal || !confirmBtn || !cancelBtn) return;
    const hide = () => modal.classList.add('hidden');
    confirmBtn.addEventListener('click', () => { resetUpgrades(); hide(); });
    cancelBtn.addEventListener('click', () => { hide(); });
    modal.addEventListener('click', (e) => {
        const dlg = document.querySelector('#reset-confirm .reset-dialog');
        if (!dlg) return;
        if (!dlg.contains(e.target)) hide();
    });
}

document.addEventListener('DOMContentLoaded', initResetConfirmEvents);

function buyUpgrade(type) {
    if (type === 'hp') type = 'charge';
    const isSpecialActive = (meta.dmgLvl >= 15) || (meta.rateLvl >= 15) || (meta.chargeLvl >= 15);
    if (isSpecialActive && type !== 'support') {
        if (type === 'dmg' && (meta.rateLvl >= 15 || meta.chargeLvl >= 15) && (meta.dmgLvl >= 14)) return updateUI();
        if (type === 'rate' && (meta.dmgLvl >= 15 || meta.chargeLvl >= 15) && (meta.rateLvl >= 14)) return updateUI();
        if (type === 'charge' && (meta.dmgLvl >= 15 || meta.rateLvl >= 15) && (meta.chargeLvl >= 14)) return updateUI();
    }
    if (type === 'support') {
        const current = Math.max(0, meta.supportCount || 0);
        if (current >= 10) { updateUI(); return; }
        const supportCost = 1000 + 500 * current;
        if ((meta.essence || 0) < supportCost) return;
        meta.essence -= supportCost;
        meta.supportCount = current + 1;
        if (meta.supportCount > 10) meta.supportCount = 10;
        playSfx('click', 0.3);
        updateUI();
        localStorage.setItem('neonTowerSave', JSON.stringify(meta));
        return;
    }
    const cost = computeUpgradeCost(meta.totalUpgrades || 0);
    if (meta.essence < cost) return;
    meta.essence -= cost;
    if (type === 'dmg') meta.dmgLvl = (meta.dmgLvl || 0) + 1;
    if (type === 'rate') meta.rateLvl = (meta.rateLvl || 0) + 1;
    if (type === 'charge') meta.chargeLvl = (meta.chargeLvl || 0) + 1;
    meta.totalUpgrades = (meta.totalUpgrades || 0) + 1;
    meta.upgradeCost = computeUpgradeCost(meta.totalUpgrades || 0);
    playSfx('click', 0.3);
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
    const baseX = JOY.radius + 20; 
    const baseY = C.laneY;
    ctx.save();
    ctx.globalCompositeOperation = 'source-over';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.strokeStyle = '#808';
    ctx.fillStyle = 'rgba(255,0,255,0.15)';
    ctx.arc(baseX, baseY, JOY.radius, 0, Math.PI*2); ctx.fill(); ctx.stroke();
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
    { id:'sniper', label:'BOMB', color:'#0ff' },
    { id:'gatling', label:'BEAM', color:'#ff0' },
    { id:'shotgun', label:'BURST', color:'#0f0' }
];
function getUltCircleCenter() {
    const cx = canvas.width - (JOY.radius + 20);
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
    for (const pos of positions) {
        let pct = 0; let anyReady = false;
        if (pos.ult.id === 'default') {
            const main = party[0];
            if (main) { pct = Math.min(1, main.ultCharge/100); anyReady = main.ultCharge >= 100; }
            // Override label/color if Black Hole ult is available (chargeLvl >= 15)
            if ((meta.chargeLvl || 0) >= 15) {
                pos.ult.label = 'DOOM';
                pos.ult.color = '#880000';
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
    powerups.push(pu);
}

function updatePlayerAura() {
    const aura = document.getElementById('player-aura');
    if(!aura) return;
    const p = party[0];
    if(!p || p.hp <= 0) {
        aura.classList.remove('active');
        return;
    }
    aura.style.left = p.x + 'px';
    aura.style.top = p.y + 'px';
    if(p.ultCharge >= 100) {
        const col = C.colors[p.type.toLowerCase()] || '#ff00ff';
        aura.style.setProperty('--aura-color', col);
        aura.classList.add('active');
    } else {
        aura.classList.remove('active');
    }
}
