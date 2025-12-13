export class HUD {
    constructor(game) {
        this.game = game;
        this._enemySegmentsCount = 25;
        this.enemyContainer = null;
        this.enemyBarSegments = null;
        this.enemyHealthText = null;
        this.playerContainer = null;
        this.playerBarSegments = null;
        this._playerSegmentsCount = 25;
        this._staminaSegmentsCount = 10;
        this._ensureEnemyHUD();
        this._ensurePlayerHUD();
    }

    _ensureEnemyHUD() {
        this.enemyContainer = document.getElementById('enemyHud');
        if (!this.enemyContainer) {
            this.enemyContainer = document.createElement('div');
            this.enemyContainer.id = 'enemyHud';
            document.getElementById('viewport').appendChild(this.enemyContainer);
        }

        this.enemyContainer.innerHTML = `
            <div class="hud-panel">
                <div class="health enemy"><div class="label">ENEMY</div><div class="bar-wrap"><div class="bar-segments"></div></div><div class="value">0%</div></div>
            </div>
        `;

        this.enemyBarSegments = this.enemyContainer.querySelector('.bar-segments');
        this.enemyHealthText = this.enemyContainer.querySelector('.health .value');

        if (this.enemyBarSegments && this.enemyBarSegments.children.length === 0) {
            for (let i = 0; i < this._enemySegmentsCount; i++) {
                const seg = document.createElement('div');
                seg.className = 'seg on';
                this.enemyBarSegments.appendChild(seg);
            }
        }
    }

    _ensurePlayerHUD() {
        this.playerContainer = document.getElementById('playerHud');
        if (!this.playerContainer) {
            this.playerContainer = document.createElement('div');
            this.playerContainer.id = 'playerHud';
            document.getElementById('viewport').appendChild(this.playerContainer);
        }

        this.playerContainer.innerHTML = `
            <div class="hud-panel">
                <div class="player-stats">
                    <div class="health player"><div class="label">PLAYER</div><div class="bar-wrap"><div class="bar-segments hp-segments"></div></div><div class="value hp-value">100%</div></div>
                    <div class="stamina player"><div class="label">STAMINA</div><div class="bar-wrap"><div class="bar-segments stam-segments"></div></div><div class="value stam-value">100%</div></div>
                </div>
            </div>
        `;
        this.playerBarSegments = this.playerContainer.querySelector('.hp-segments');
        this.playerHealthText = this.playerContainer.querySelector('.hp-value');
        this.playerStamSegments = this.playerContainer.querySelector('.stam-segments');
        this.playerStamText = this.playerContainer.querySelector('.stam-value');

        if (this.playerBarSegments && this.playerBarSegments.children.length === 0) {
            for (let i = 0; i < this._playerSegmentsCount; i++) {
                const seg = document.createElement('div');
                seg.className = 'seg on';
                this.playerBarSegments.appendChild(seg);
            }
        }
        if (this.playerStamSegments && this.playerStamSegments.children.length === 0) {
            for (let i = 0; i < this._staminaSegmentsCount; i++) {
                const seg = document.createElement('div');
                seg.className = 'seg on';
                this.playerStamSegments.appendChild(seg);
            }
        }
    }

    _animateSegments(segments, targetOnCount) {
        const total = segments.length;
        const currentOn = segments.filter(s => s.classList.contains('on')).length;
        if (currentOn === targetOnCount) return;
        const stepDelay = 18; 
        if (targetOnCount < currentOn) {
            for (let i = currentOn - 1; i >= targetOnCount; i--) {
                ((idx) => setTimeout(() => segments[idx].classList.remove('on'), (currentOn - 1 - idx) * stepDelay))(i);
            }
        } else {
            for (let i = currentOn; i < targetOnCount; i++) {
                ((idx) => setTimeout(() => segments[idx].classList.add('on'), (idx - currentOn) * stepDelay))(i);
            }
        }
    }

    updateEnemy(health) {
        if (!this.enemyBarSegments) this._ensureEnemyHUD();
        const pct = Math.max(0, Math.min(200, health));
        const onCount = Math.round(pct / 8);
        const segments = Array.from(this.enemyBarSegments.children || []);
        segments.forEach((s, i) => s.style.transitionDelay = `${i * 10}ms`);
        this._animateSegments(segments, onCount);
        if (this.enemyHealthText) this.enemyHealthText.textContent = Math.max(0, Math.floor(health)) + '%';
    }

    updatePlayer(health, stamina) {
        if (!this.playerBarSegments) this._ensurePlayerHUD();
        const pct = Math.max(0, Math.min(100, health));
        const onCount = Math.round(pct / 4);
        const segments = Array.from(this.playerBarSegments.children || []);
        segments.forEach((s, i) => s.style.transitionDelay = `${i * 10}ms`);
        this._animateSegments(segments, onCount);
        try { if (this.playerHealthText) this.playerHealthText.textContent = Math.max(0, Math.floor(health)) + '%'; } catch(e) {}

        if (typeof stamina !== 'undefined' && this.playerStamSegments) {
            const spct = Math.max(0, Math.min(100, stamina));
            const sonCount = Math.round((spct / 100) * this._staminaSegmentsCount);
            const ssegments = Array.from(this.playerStamSegments.children || []);
            ssegments.forEach((s, i) => s.style.transitionDelay = `${i * 10}ms`);
            this._animateSegments(ssegments, sonCount);
            try { if (this.playerStamText) this.playerStamText.textContent = Math.max(0, Math.floor(stamina)) + '%'; } catch(e) {}
        }
    }

    update() {
    }

    flashDamage() {
        if (!this.enemyContainer) return;
        this.enemyContainer.classList.add('damage');
        setTimeout(() => this.enemyContainer.classList.remove('damage'), 220);
    }

    showBoost() {
        if (!this.playerContainer) return;
        this.playerContainer.classList.add('boost');
        setTimeout(() => this.playerContainer.classList.remove('boost'), 300);
    }

    flashStamina() {
        if (!this.playerContainer) return;
        this.playerContainer.classList.add('low-stamina');
        setTimeout(() => this.playerContainer.classList.remove('low-stamina'), 360);
    }
}
