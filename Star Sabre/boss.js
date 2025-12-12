class WarshipBoss10 {
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

        // Sector-10 specific tuning — change these values to balance the boss
        const cfg = this.cfg = {
            // per-cannon HP (left, middle, right)
            cannonHp: [8000, 8000, 8000],
            // damage multiplier applied to each cannon's projectile
            cannonDmgMult: [2, 1.5, 2],
            // left cannon bullet size multiplier
            leftBulletSizeMult: 3,
            // middle-cannon spawn customization
            middleSpawn: {
                count: 1,
                spawnBoss: true,
                bossSizeMult: 0.85,
                bossHpMult: 0.8,
                speedMult: 0.7
            }
        };

        // Apply configuration to cannons (index 0 = left, 1 = mid, 2 = right)
        if (this.cannons && this.cannons.length === 3) {
            // HP
            for (let i = 0; i < 3; i++) {
                const c = this.cannons[i];
                if (!c) continue;
                c.hp = cfg.cannonHp[i] || c.hp;
                c.maxHp = cfg.cannonHp[i] || c.maxHp;
                // damage multiplier per cannon
                c.bulletDamageMult = cfg.cannonDmgMult[i] || 1;
            }
            // left cannon bullet size
            const left = this.cannons[0];
            if (left) left.bulletSizeMult = cfg.leftBulletSizeMult || 1;
            // middle cannon spawn props
            const mid = this.cannons[1];
            if (mid) mid.spawnEnemyProps = Object.assign({}, cfg.middleSpawn || {});
        }
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
            try { vibrateKind('boss_long'); } catch(_){ }
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

// Keep this file focused only on the sector-10 boss class so
// sector-5 behavior (WarshipBoss) remains unchanged in script.js.
