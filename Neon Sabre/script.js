/* --- ENGINE CONFIG --- */
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

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
    lastGatSfxTime: 0,
    lastShotgunSfxTime: 0,
    spawnTimer: 0, 
    awaitingDraft: false, 
    postBossTimer: 0, 
    bossesSpawned: 0, 
    bossQuota: 1, 
    powerupsSpawned: 0, 
    powerupQuota: 1,
    deathTimer: 0,
    gatAmbientTimer: 0,
    shootAmbientTimer: 0
};
let bossSpawnedThisFloor = false; 
let activeFrame = null;

let meta = JSON.parse(localStorage.getItem('neonTowerSave')) || {
    dmgLvl: 0,
    rateLvl: 0,
    chargeLvl: 0, 
    highScore: 0,
    essence: 0,
    supportCount: 0
};
if (typeof meta.chargeLvl !== 'number' && typeof meta.hpLvl === 'number') {
    meta.chargeLvl = meta.hpLvl;
    delete meta.hpLvl;
}
if (typeof meta.totalUpgrades !== 'number') {
    meta.totalUpgrades = (meta.dmgLvl || 0) + (meta.rateLvl || 0) + (meta.chargeLvl || 0);
}
if (typeof meta.upgradeCost !== 'number') {
    const base = 10;
    meta.upgradeCost = Math.max(base, Math.round(base * Math.pow(1.5, meta.totalUpgrades)));
}
if (typeof meta.supportCount !== 'number') {
    meta.supportCount = 0;
}
try { localStorage.setItem('neonTowerSave', JSON.stringify(meta)); } catch(e) {}

let party = [];
let enemies = [];
let bullets = [];
let powerups = [];
let particles = [];
let textPopups = [];
let blooms = [];

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
    const wrapper = document.getElementById('game-wrapper');
    const wrapperW = wrapper ? wrapper.clientWidth : Math.min(window.innerWidth - 20, 480);
    const maxW = Math.min(wrapperW, 480);
    canvas.width = maxW;
    const wrapperH = wrapper ? wrapper.clientHeight : 700;
    canvas.height = wrapperH;
    C.laneY = Math.round(canvas.height * 0.88);
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
    shotgun: new Audio('sfx/shotgun.wav')
};
const activeAudio = [];

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
    if (GAME.state !== 'PLAY') return;
    if (sfx[sound]) {
        if (sound === 'shoot') {
            const now = Date.now();
            if (now - GAME.lastShootSfxTime < 140) return;
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
            if (now - (GAME.lastBeamSfxTime || 0) < 1000) return;
            GAME.lastBeamSfxTime = now;
            const pool = sfxPool.beam;
            if (pool.length) {
                const i = sfxIndex.beam;
                const ch = pool[i];
                sfxIndex.beam = (i + 1) % pool.length;
                try { ch.pause(); ch.currentTime = 0; } catch(e){}
                ch.volume = volume;
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
    }

    update(idx, total) {
        if (total > 1 && idx !== 0) {
            const spacing = 50;
            const startX = (canvas.width/2) - ((total-1)*spacing)/2;
            const targetX = startX + (idx*spacing);
            this.x += (targetX - this.x) * 0.1;
        }
        this.recoil *= 0.6;

        if(this.cooldown > 0) this.cooldown -= GAME.dt;
        const chargeMult = 1 + (meta.chargeLvl || 0) * 0.20;
        this.ultCharge = Math.min(100, this.ultCharge + 0.1 * chargeMult * GAME.dt);

        if(this.cooldown <= 0) {
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
                playSfx('beam', 0.5);
                this.beamSfxBurstLeft--;
                this.beamSfxTimer = 1.0;
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
                    const dmg = msElapsed * 0.05;
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

        let count = (this.trait.id === 'shotgun') ? 3 : 1;
        if (this.powerup.type === 'TRIPLE') count = Math.max(count, 3);
        if (this.powerup.type === 'SEXTUPLE') count = Math.max(count, 6);
        
        for(let i=0; i<count; i++) {
            let spread = (this.trait.id === 'shotgun') ? (Math.random()-0.5)*1.5 : (Math.random()-0.5)*0.2;
            let dmg = this.dmg;
            let bulletSizeMult = 1;
            let piercing = false;
            if (this.powerup.type === 'BIG') { dmg *= 3; bulletSizeMult = 3; }
            if (this.powerup.type === 'PIERCE') { piercing = true; }
            bullets.push(new Bullet(this.x, this.y - 10, target, dmg, this.type, spread, GAME.target, { bulletSizeMult, piercing }));
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
        const healthR = isPlayer ? 18: 16;
        const ultR = isPlayer ? 23 : 20;

        ctx.strokeStyle = '#300';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(this.x, this.y, healthR, 0, Math.PI * 2);
        ctx.stroke();
        const hpPct = Math.max(0, Math.min(1, this.hp / this.maxHp));
        ctx.strokeStyle = '#f00';
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.arc(this.x, this.y, healthR, -Math.PI/2, -Math.PI/2 + hpPct * Math.PI * 2);
        ctx.stroke();

        ctx.strokeStyle = C.colors[this.type.toLowerCase()] || '#f0f';
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.arc(this.x, this.y, ultR, -Math.PI/2, -Math.PI/2 + ultPct * Math.PI * 2);
        ctx.stroke();

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
    }
}

class Enemy {
    constructor(isBoss) {
        const BASE_HP = 20; 
        const HP_SCALING = 10; 
        const BASE_SPEED = 1.0; 
        const SPEED_SCALING = 0.08; 
        this.rank = isBoss ? 'BOSS' : 'minion';
        this.type = ['Lydia', 'Cybil', 'Sofia'][Math.floor(Math.random()*3)];
        
        this.maxHp = isBoss ? GAME.floor * 250 : BASE_HP + (GAME.floor * HP_SCALING);
        this.hp = this.maxHp;
        this.x = Math.random() * (canvas.width - 60) + 30;
        this.y = C.spawnY;
        
        this.speed = isBoss ? (0.3 + GAME.floor * 0.02) : BASE_SPEED + (GAME.floor * SPEED_SCALING);
        
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
                    baseRadius: 10.5,
                    radius: 10.5,
                    age: 0,
                    growthDuration: 2,
                    update() {
                        this.x += this.vx * GAME.dt;
                        this.y += this.vy * GAME.dt;
                        this.age += GAME.dt / 60;
                        const progress = Math.min(1, this.age / this.growthDuration);
                        this.radius = this.baseRadius + (this.baseRadius * 2) * progress;
                        if(party.length === 0) { this.active = false; return; }
                        for(let p of party) {
                            if(!p || p.hp <= 0) continue;
                            const d = Math.hypot(this.x - p.x, this.y - p.y);
                            if(d < (p.size || 12) + this.radius) {
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
                        ctx.fillStyle = this.color;
                        ctx.beginPath(); ctx.arc(this.x, this.y, this.radius, 0, Math.PI*2); ctx.fill();
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
            const pulse = 1 + Math.sin(GAME.time * 0.03) * 0.1;
            ctx.save();
            ctx.translate(this.x, this.y);
            ctx.scale(pulse, pulse);
            ctx.setLineDash([12, 8]);
            ctx.beginPath();
            ctx.arc(0, 0, r, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();
            ctx.setLineDash([]);
        }

        const hpPct = Math.max(0, Math.min(1, this.hp / this.maxHp));
        const ringR = (this.rank === 'BOSS') ? this.size + 16 : this.size + 6;
        ctx.lineWidth = (this.rank === 'BOSS') ? 6 : 4;
        ctx.strokeStyle = '#400';
        ctx.beginPath(); ctx.arc(this.x, this.y, ringR, 0, Math.PI*2); ctx.stroke();
        ctx.strokeStyle = '#f00';
        ctx.beginPath(); ctx.arc(this.x, this.y, ringR, -Math.PI/2, -Math.PI/2 + hpPct * Math.PI*2); ctx.stroke();
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
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size + 6, 0, Math.PI*2);
        ctx.stroke();
    }
}

class Bullet {
    constructor(x, y, target, dmg, type, spread, lockOnTarget = null, opts = {}) {
        this.x = x; this.y = y;
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

        this.speed = 12;
        this.vx = Math.cos(angle) * this.speed;
        this.vy = Math.sin(angle) * this.speed;
        
        this.trail = []; 
    }

    update() {
        this.trail.push({x: this.x, y: this.y});
        if(this.trail.length > 3) this.trail.shift();

        const locked = (this.lockOnTarget && this.target === this.lockOnTarget);
        if (locked && this.target && enemies.includes(this.target) && this.target.hp > 0) {
            const dx = this.target.x - this.x;
            const dy = (this.target.y + 15) - this.y;
            const desired = Math.atan2(dy, dx);
            const current = Math.atan2(this.vy, this.vx);
            let diff = desired - current;
            while (diff > Math.PI) diff -= Math.PI * 2;
            while (diff < -Math.PI) diff += Math.PI * 2;
            const turnRate = 0.12 * GAME.dt;
            const newAngle = current + Math.max(-turnRate, Math.min(turnRate, diff));
            this.vx = Math.cos(newAngle) * this.speed;
            this.vy = Math.sin(newAngle) * this.speed;
        }

        this.x += this.vx * GAME.dt;
        this.y += this.vy * GAME.dt;

        const capMult = this.sizeMult > 1 ? 4 : 3;
        const maxWidth = this.baseWidth * capMult * this.sizeMult;
        this.width = Math.min(maxWidth, this.width + this.growthRate * GAME.dt);

        if(this.y < -50 || this.x < 0 || this.x > canvas.width) this.active = false;
        
        for(let e of enemies) {
            let dist = Math.hypot(this.x - e.x, this.y - e.y);
            const bigArcRadius = this.sizeMult > 1 ? 20 * this.sizeMult : 5 * this.sizeMult;
            if(dist < e.size + bigArcRadius) {
                e.hp -= this.dmg;
                playSfx('hit', 0.4);
                GAME.shake = Math.max(GAME.shake, e.rank === 'BOSS' ? 4 : 2.5); 
                createParticles(this.x, this.y, this.color, 3);
                if(!this.piercing) this.active = false;
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
                if(!this.piercing) break;
            }
        }
    }

    draw() {
        const isBig = this.sizeMult > 1.0;
        if (isBig) {
            const ang = Math.atan2(this.vy, this.vx);
            const arcRadius = 20 * this.sizeMult; 
            const arcSpan = 1.1;
            ctx.save();
            ctx.globalCompositeOperation = 'lighter';
            ctx.strokeStyle = this.color;
            ctx.lineWidth = Math.max(this.width, 10 * this.sizeMult);
            ctx.beginPath();
            ctx.arc(this.x, this.y, arcRadius, ang - arcSpan/2, ang + arcSpan/2);
            ctx.stroke();
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

/* --- SYSTEMS --- */
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
    ctx.fillStyle = '#333';
    ctx.fillRect(x, y, w, h);
    ctx.fillStyle = color;
    ctx.fillRect(x, y, Math.max(0, w * pct), h);
}

const bgSpace = new Image(); bgSpace.src = 'images/space.png';
const bgStars = new Image(); bgStars.src = 'images/stars.png';
const bgStars2 = new Image(); bgStars2.src = 'images/stars2.png';
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
    } catch (_) { /* ignore draw errors and keep fallback */ }

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
    } catch (_) { /* ignore */ }

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
    } catch (_) { /* ignore */ }
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
        if(GAME.spawnTimer <= 0) {
            let intervalSec = Math.max(0.5, (100 / 60));
            powerups.push(new PowerupEntity());
            GAME.powerupsSpawned++;
            GAME.spawnTimer = intervalSec;
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
            const d = Math.hypot(powerups[i].x - p.x, powerups[i].y - p.y);
            if (d < (powerups[i].size + (p.size || 12))) {
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
                if (d < powerups[i].size + Math.max(5, (b.width||3))) {
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
        }
    }

    if(!party[0] || party[0].hp <= 0) {
        if (GAME.deathTimer <= 0) {
            GAME.deathTimer = 3; 
            stopGunAudio();
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

    ctx.strokeStyle = '#333';
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(6, C.laneY); ctx.lineTo(canvas.width-6, C.laneY); ctx.stroke();

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
            GAME.shootAmbientTimer = 0.15;
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
window.addEventListener('keydown', (e) => {
    if(e.key === 'ArrowLeft' || e.key === 'a') input.left = true;
    if(e.key === 'ArrowRight' || e.key === 'd') input.right = true;
    if(e.key === 'ArrowUp' || e.key === 'w') input.up = true;
    if(e.key === 'ArrowDown' || e.key === 's') input.down = true;
    if(e.key === ' ' || e.key === 'Spacebar') {
        if(GAME.state === 'PLAY' || GAME.state === 'PAUSE') {
            togglePause();
        }
    }
    if(e.key === 'q' || e.key === 'Q') {
        const p = party[0];
        if(p) {
            const t = findClosestEnemy(p.x, p.y);
            if(t) GAME.target = t;
        }
    }
    if(e.key === 'e' || e.key === 'E') {
        const p = party[0];
        if(p && p.ultCharge >= 100) {
            activateUlt(p);
        }
    }
    if(e.key === '1') {
        const p = party[1];
        if(p && p.ultCharge >= 100) activateUlt(p);
    }
    if(e.key === '2') {
        const p = party[2];
        if(p && p.ultCharge >= 100) activateUlt(p);
    }
    if(e.key === '3') {
        const p = party[3];
        if(p && p.ultCharge >= 100) activateUlt(p);
    }
});
window.addEventListener('keyup', (e) => {
    if(e.key === 'ArrowLeft' || e.key === 'a') input.left = false;
    if(e.key === 'ArrowRight' || e.key === 'd') input.right = false;
    if(e.key === 'ArrowUp' || e.key === 'w') input.up = false;
    if(e.key === 'ArrowDown' || e.key === 's') input.down = false;
});

canvas.addEventListener('mousedown', (e) => {
    if(GAME.state !== 'PLAY') return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    playSfx('click', 0.3);

    let clickedEnemy = false;
    for(let e of enemies) {
        if(Math.hypot(e.x - x, e.y - y) < e.size + 10) {
            GAME.target = e;
            clickedEnemy = true;
            break;
        }
    }

    if(!clickedEnemy) {
        for(let p of party) {
            if(Math.hypot(p.x - x, p.y - y) < 30 && p.ultCharge >= 100) {
                activateUlt(p);
            }
        }
    }
});

function applyPlayerMovement() {
    const p = party[0];
    if(!p || p.hp <= 0) return;
    let mvx = 0, mvy = 0;
    if(input.left) mvx -= 1;
    if(input.right) mvx += 1;
    if(input.up) mvy -= 1;
    if(input.down) mvy += 1;
    if(mvx !== 0 || mvy !== 0) {
        const len = Math.hypot(mvx, mvy) || 1;
        const speed = 2.25;
        p.x += (mvx/len) * speed;
        p.y += (mvy/len) * speed;
    }
    p.x = Math.max(20, Math.min(canvas.width - 20, p.x));
    p.y = Math.max(20, Math.min(C.laneY - 20, p.y));
}

function activateUlt(pet) {
    if (!pet || pet.hp <= 0) return;
    pet.ultCharge = 0;
    GAME.shake = 15;
    playSfx('ult', 0.8);
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.fillRect(0,0,canvas.width,canvas.height);

    const chargeBoost = 1 + (meta.chargeLvl || 0) * 0.20;

    if (pet.trait && pet.trait.id === 'sniper') {
        activateSniperUlt(pet, chargeBoost);
        return;
    }

    if (pet.trait && pet.trait.id === 'gatling') {
        pet.beamActive = true;
        pet.beamTime = 10;
        pet.beamSfxTimer = 0;
        pet.beamSfxBurstLeft = 10;
        return;
    }

    if (pet.trait && pet.trait.id === 'shotgun') {
        activateShotgunUlt(pet, chargeBoost);
        return;
    }

    const base = 6 + meta.dmgLvl;
    const ultimateDamage = Math.round(base * chargeBoost);
    enemies.forEach(e => { 
        e.hp -= ultimateDamage; 
        createParticles(e.x, e.y, '#f00', 6); 
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
                    for (let j = 0; j < enemies.length; j++) {
                        const o = enemies[j];
                        const dd = Math.hypot(this.x - o.x, this.y - o.y);
                        if (dd <= splashRadius) {
                            o.hp -= splashDamage;
                            createParticles(o.x, o.y, '#08f', 8);
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
    const r = 120;
    const innerColors = ['#ff0000', '#ff6699', '#ffffff'];
    blooms.push({ x, y, radius: r*0.8, maxRadius: r*2.6, ringRadius: r*1.6, life:1.4, maxLife:1.4, pulse:0, colors: innerColors });
    const outerColors = ['#551a00', '#330033', '#000000'];
    blooms.push({ x, y, radius: r*1.2, maxRadius: r*3.4, ringRadius: r*2.1, life:1.2, maxLife:1.2, pulse:0, colors: outerColors });
}

function startGame() {
    if(activeFrame) { cancelAnimationFrame(activeFrame); activeFrame = null; }
    party = [ new Pet('Lydia', null, true) ];
    const supportN = Math.max(0, meta.supportCount || 0);
    const sniperTrait = C.traits.find(t => t.id === 'sniper');
    for (let i = 0; i < supportN; i++) {
        const alt = new Pet('Cybil', sniperTrait, false);
        alt.hp = 100; alt.maxHp = 100;
        party.push(alt);
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
    loop();
}

function showDraft() {
    GAME.state = 'DRAFT';
    stopAllAudio();
    const con = document.getElementById('draft-cards');
    con.innerHTML = '';
    bullets = [];
    particles = [];
    
    for(let i=0; i<3; i++) {
            let type = ['Lydia', 'Cybil', 'Sofia'][Math.floor(Math.random()*3)];
        let trait = C.traits[Math.floor(Math.random()*C.traits.length)];
        
        let d = document.createElement('div');
        d.className = `card`;
        d.innerHTML = `
            <h3>${type}</h3>
            <div class="trait">${trait.name}</div>
            <div class="stats">${trait.desc}</div>
        `;
        d.onclick = () => {
            playSfx('click', 0.2);
            party.push(new Pet(type, trait, false));
            if(party.length > 5) party.shift();
            resume();
        };
        con.appendChild(d);
    }
    document.getElementById('draft-screen').classList.remove('hidden');
}

function resume() {
    GAME.floor++;
    GAME.enemiesRequired = 10 + (GAME.floor - 1);
    GAME.bossQuota = 1 + Math.floor((GAME.floor - 1) / 5);
    GAME.powerupQuota = 1 + Math.floor((GAME.floor - 1) / 5);
    GAME.bossesSpawned = 0;
    GAME.powerupsSpawned = 0;
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
    loop();
}

function togglePause() {
    const btn = document.getElementById('pause-btn');
    if(GAME.state === 'PLAY') {
        if(activeFrame) { cancelAnimationFrame(activeFrame); activeFrame = null; }
        GAME.state = 'PAUSE';
        if(btn) btn.textContent = 'RESUME';
    } else if (GAME.state === 'PAUSE') {
        GAME.lastTs = performance.now();
        GAME.state = 'PLAY';
        if(btn) btn.textContent = 'PAUSE';
        loop();
    }
}
window.togglePause = togglePause;

function skipDraft() {
    playSfx('click', 0.2);
    party.forEach(p => p.hp = p.maxHp);
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
        document.getElementById('final-floor').innerText = GAME.floor;
        document.getElementById('banked-essence').innerText = meta.essence;
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
    GAME.state = 'MENU';
    startGame();
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
    document.getElementById('essence-display').innerText = GAME.essence;

    document.getElementById('high-score').innerText = `RECORD: ${meta.highScore}`;
    document.getElementById('meta-essence-display').innerText = meta.essence;

    document.getElementById('lvl-dmg').innerText = `LVL ${meta.dmgLvl}`;
    document.getElementById('lvl-rate').innerText = `LVL ${meta.rateLvl}`;
    const hpLvlEl = document.getElementById('lvl-hp');
    if (hpLvlEl) hpLvlEl.innerText = `LVL ${meta.chargeLvl}`;
    const supLvlEl = document.getElementById('lvl-support');
    if (supLvlEl) supLvlEl.innerText = `LVL ${meta.supportCount || 0}`;

    const nextCost = Math.max(1, Math.round(meta.upgradeCost));
    document.getElementById('cost-dmg').innerText = `${nextCost} ESSENCE`;
    document.getElementById('cost-rate').innerText = `${nextCost} ESSENCE`;
    const costHpEl = document.getElementById('cost-hp');
    if (costHpEl) costHpEl.innerText = `${nextCost} ESSENCE`;
    const costSupEl = document.getElementById('cost-support');
    if (costSupEl) costSupEl.innerText = `1000 ESSENCE`;
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
    const base = 10; const r = 1.5; const n = meta.totalUpgrades || 0;
    const refund = Math.round(n > 0 ? base * (Math.pow(r, n) - 1) / (r - 1) : 0);
    if (typeof meta.essence !== 'number') meta.essence = 0;
    meta.essence += refund;
    meta.dmgLvl = 0;
    meta.rateLvl = 0;
    meta.chargeLvl = 0;
    meta.totalUpgrades = 0;
    meta.upgradeCost = base;
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
    if (type === 'support') {
        const supportCost = 1000;
        if ((meta.essence || 0) < supportCost) return;
        meta.essence -= supportCost;
        meta.supportCount = (meta.supportCount || 0) + 1;
        playSfx('click', 0.3);
        updateUI();
        localStorage.setItem('neonTowerSave', JSON.stringify(meta));
        return;
    }
    const cost = Math.max(1, Math.round(meta.upgradeCost));
    if (meta.essence < cost) return;
    meta.essence -= cost;
    if (type === 'dmg') meta.dmgLvl = (meta.dmgLvl || 0) + 1;
    if (type === 'rate') meta.rateLvl = (meta.rateLvl || 0) + 1;
    if (type === 'charge') meta.chargeLvl = (meta.chargeLvl || 0) + 1;
    meta.totalUpgrades = (meta.totalUpgrades || 0) + 1;
    meta.upgradeCost = Math.ceil(cost * 1.5);
    playSfx('click', 0.3);
    updateUI();
    localStorage.setItem('neonTowerSave', JSON.stringify(meta));
}

updateUI();