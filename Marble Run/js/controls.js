import * as Haptics from './haptics.js';

export class Controls {
    constructor(game) {
        this.game = game;
        this.keys = {};
        this.joystick = { x: 0, y: 0 };
        this.isBoosting = false;
        this._boostReady = true;
        this._boostCooldownMs = 500;
        this._boostLastUsed = 0;
        this._boostAnimRaf = null;

        this.bindEvents();
        this.setupMobileControls();
    }

    bindEvents() {
        window.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;
            if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') {
                try {
                    if (this.game && this.game._paused) return;
                    if (this._boostReady) {
                        this._boostReady = false;
                        this._boostLastUsed = performance.now();
                        this.isBoosting = true;
                        if (this.game && this.game.player) this.game.player.boost();
                        try { Haptics.boost(); } catch(e) {}
                        try { const b = document.getElementById('boostBtn'); if (b) { b.classList.add('pulse'); setTimeout(()=>b.classList.remove('pulse'),560); } } catch(e) {}
                        this._startBoostCooldown();
                    }
                } catch(e) {}
            }
        });

        window.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
            if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') {
                this.isBoosting = false;
            }
        });

        this.game.canvas.addEventListener('contextmenu', (e) => e.preventDefault());
    }

    setupMobileControls() {
        const joystick = document.getElementById('joystick');
        const boostBtn = document.getElementById('boostBtn');
        const knob = joystick ? joystick.querySelector('.knob') : null;
        this._joystickElem = joystick;
        this._knobElem = knob;
        try {
            this.joystick.x = 0; this.joystick.y = 0;
            if (knob) knob.style.transform = 'translate(calc(-50% + 0px), calc(-50% + 0px))';
        } catch(e) {}

        let joystickStart = null;
        joystick.addEventListener('touchstart', (e) => {
            e.preventDefault();
            joystickStart = e.touches[0];
        });

        joystick.addEventListener('touchmove', (e) => {
            e.preventDefault();
            if (joystickStart) {
                const touch = e.touches[0];
                const rect = joystick.getBoundingClientRect();
                const centerX = rect.left + rect.width / 2;
                const centerY = rect.top + rect.height / 2;

                this.joystick.x = (touch.clientX - centerX) / (rect.width / 2);
                this.joystick.y = (centerY - touch.clientY) / (rect.height / 2);

                const length = Math.sqrt(this.joystick.x ** 2 + this.joystick.y ** 2);
                if (length > 1) {
                    this.joystick.x /= length;
                    this.joystick.y /= length;
                }

                if (knob) {
                    const maxOffset = Math.round(rect.width * 0.28);
                    const offsetX = Math.round(this.joystick.x * maxOffset);
                    const offsetY = Math.round(-this.joystick.y * maxOffset);
                    knob.style.transform = `translate(calc(-50% + ${offsetX}px), calc(-50% + ${offsetY}px))`;
                }
            }
        });

        joystick.addEventListener('touchend', () => {
            this.joystick.x = 0;
            this.joystick.y = 0;
            if (knob) knob.style.transform = 'translate(calc(-50% + 0px), calc(-50% + 0px))';
        });

        let pointerActive = false;
        joystick.addEventListener('pointerdown', (e) => {
            try { Haptics.weak(); } catch(e) {}
            pointerActive = true;
            const rect = joystick.getBoundingClientRect();
            const centerX = rect.left + rect.width / 2;
            const centerY = rect.top + rect.height / 2;
            this.joystick.x = (e.clientX - centerX) / (rect.width / 2);
            this.joystick.y = (centerY - e.clientY) / (rect.height / 2);
            const length = Math.sqrt(this.joystick.x ** 2 + this.joystick.y ** 2);
            if (length > 1) { this.joystick.x /= length; this.joystick.y /= length; }
            if (knob) {
                const maxOffset = Math.round(rect.width * 0.28);
                const offsetX = Math.round(this.joystick.x * maxOffset);
                const offsetY = Math.round(-this.joystick.y * maxOffset);
                knob.style.transform = `translate(calc(-50% + ${offsetX}px), calc(-50% + ${offsetY}px))`;
            }
        });
        window.addEventListener('pointermove', (e) => {
            if (!pointerActive) return;
            const rect = joystick.getBoundingClientRect();
            const centerX = rect.left + rect.width / 2;
            const centerY = rect.top + rect.height / 2;
            this.joystick.x = (e.clientX - centerX) / (rect.width / 2);
            this.joystick.y = (centerY - e.clientY) / (rect.height / 2);
            const length = Math.sqrt(this.joystick.x ** 2 + this.joystick.y ** 2);
            if (length > 1) { this.joystick.x /= length; this.joystick.y /= length; }
            if (knob) {
                const maxOffset = Math.round(rect.width * 0.28);
                const offsetX = Math.round(this.joystick.x * maxOffset);
                const offsetY = Math.round(-this.joystick.y * maxOffset);
                knob.style.transform = `translate(calc(-50% + ${offsetX}px), calc(-50% + ${offsetY}px))`;
            }
        });
        window.addEventListener('pointerup', (e) => {
            pointerActive = false;
            this.joystick.x = 0; this.joystick.y = 0;
            if (knob) knob.style.transform = 'translate(calc(-50% + 0px), calc(-50% + 0px))';
        });

        const attemptBoost = (e) => {
            if (e && e.preventDefault) e.preventDefault();
            if (this.game && this.game._paused) return false;
            if (!this._boostReady) return false;
            this._boostReady = false;
            this._boostLastUsed = performance.now();
            this.isBoosting = true;
            try { if (this.game && this.game.player) this.game.player.boost(); } catch(e){}
            try { if (boostBtn) { boostBtn.classList.add('pulse'); setTimeout(()=>boostBtn.classList.remove('pulse'), 560); } } catch(e){}
            try { Haptics.boost(); } catch(e) {}
            this._startBoostCooldown();
            return true;
        };
        const onBoostEnd = (e) => {
            if (e && e.preventDefault) e.preventDefault();
            this.isBoosting = false;
        };
        if (boostBtn) {
            boostBtn.addEventListener('pointerdown', attemptBoost);
            window.addEventListener('pointerup', onBoostEnd);
            boostBtn.addEventListener('touchstart', attemptBoost);
            boostBtn.addEventListener('touchend', onBoostEnd);
        }

        try {
            if (boostBtn) {
                boostBtn.style.position = boostBtn.style.position || 'absolute';
                try {
                    const jRect = joystick ? joystick.getBoundingClientRect() : null;
                    if (jRect && jRect.width) {
                        boostBtn.style.width = `${Math.round(jRect.width)}px`;
                        boostBtn.style.height = `${Math.round(jRect.width)}px`;
                    }
                } catch(e) {}

                try {
                    const svgns = 'http://www.w3.org/2000/svg';
                    const svg = document.createElementNS(svgns, 'svg');
                    svg.setAttribute('class', 'boostRing');
                    svg.setAttribute('viewBox', '0 0 100 100');
                    svg.style.position = 'absolute';
                    svg.style.left = '0'; svg.style.top = '0';
                    svg.style.width = '100%'; svg.style.height = '100%';
                    svg.style.pointerEvents = 'none';
                    const circ = document.createElementNS(svgns, 'circle');
                    circ.setAttribute('cx','50'); circ.setAttribute('cy','50');
                    circ.setAttribute('fill','none'); circ.setAttribute('stroke','#00ffff');
                    circ.setAttribute('stroke-linecap','round');
                    svg.appendChild(circ);
                    boostBtn.appendChild(svg);
                    this._boostRingSvg = svg;
                    this._boostRingCircle = circ;
                    this.updateBoostRing = () => {
                        try {
                            const jRectNow = joystick ? joystick.getBoundingClientRect() : null;
                            const btnRect = boostBtn.getBoundingClientRect();
                            if (!btnRect || !btnRect.width) return;
                            if (jRectNow && jRectNow.width) {
                                boostBtn.style.width = `${Math.round(jRectNow.width)}px`;
                                boostBtn.style.height = `${Math.round(jRectNow.width)}px`;
                            }
                            const btnSizeNow = Math.max(64, Math.round(btnRect.width));
                            const strokePxNow = Math.max(2, Math.round(btnSizeNow * 0.06));
                            const strokeSVG = (strokePxNow / btnSizeNow) * 100;
                            const baseR = 50 - (strokeSVG / 2) - 2;
                            const rNow = Math.min(50 - (strokeSVG/2) - 1, baseR * 1.02);
                            this._boostRingCircle.setAttribute('r', String(rNow));
                            this._boostRingCircle.setAttribute('stroke-width', String(strokeSVG));
                            const circumferenceNow = (2 * Math.PI * rNow).toFixed(3);
                            this._boostRingCircle.setAttribute('stroke-dasharray', circumferenceNow);
                            try { this._boostRingCircle.setAttribute('stroke-dashoffset', '0'); } catch(e){}
                        } catch(e) { }
                    };
                    try { this.updateBoostRing(); } catch(e) {}
                    window.addEventListener('resize', () => { try { this.updateBoostRing(); } catch(e){} });
                } catch(e) {}
            }
        } catch(e) {}

        if ('ontouchstart' in window) {
            document.getElementById('mobileControls').classList.remove('hidden');
        }
    }

    applyToPlayer(player) {
        if (!player.mesh) return;

        let forceX = 0;
        let forceZ = 0;

        if (this.keys['ArrowLeft'] || this.keys['KeyA']) forceX -= 1;
        if (this.keys['ArrowRight'] || this.keys['KeyD']) forceX += 1;
        if (this.keys['ArrowUp'] || this.keys['KeyW']) forceZ += 1;
        if (this.keys['ArrowDown'] || this.keys['KeyS']) forceZ -= 1;

        forceX += this.joystick.x;
        forceZ += this.joystick.y;

        const raw = new BABYLON.Vector3(forceX, 0, forceZ);
        const screenFactor = (typeof window !== 'undefined' && window.innerWidth) ? Math.max(0.6, Math.min(1, window.innerWidth / 1366)) : 1;
        const baseAccel = 3.0 * screenFactor;

        let force = new BABYLON.Vector3(0,0,0);
        try {
            const locked = this.game && this.game.lockedEnemy;
            if (locked && locked.mesh) {
                const enemyPos = locked.mesh.position;
                const toEnemy = enemyPos.subtract(player.mesh.position);
                const dist = toEnemy.length();
                if (dist > 0.001) {
                    const radial = toEnemy.normalize();
                    const tangent = new BABYLON.Vector3(-radial.z, 0, radial.x).normalize();
                    const mapped = tangent.scale(-forceX).add(radial.scale(forceZ));
                    if (mapped.length() > 0) {
                        force = mapped.normalize().scale(baseAccel);
                        this._lastRaw = { x: mapped.x, z: mapped.z };
                    }
                }
            } else {
                if (raw.length() > 0) {
                    force = raw.normalize().scale(baseAccel);
                    this._lastRaw = { x: raw.x, z: raw.z };
                }
            }
            try { player.mesh.physicsImpostor.applyForce(force, player.mesh.getAbsolutePosition()); } catch(e) {}
        } catch(e) {
            const fallback = raw.length() > 0 ? raw.normalize().scale(baseAccel) : new BABYLON.Vector3(0,0,0);
            try { player.mesh.physicsImpostor.applyForce(fallback, player.mesh.getAbsolutePosition()); } catch(e) {}
        }

        try {
            const knob = this._knobElem;
            const joystickBase = this._joystickElem;
            if (knob && joystickBase) {
                const rect = joystickBase.getBoundingClientRect();
                const maxOffset = Math.round(rect.width * 0.28);
                let vx = forceX;
                let vy = forceZ;
                const mag = Math.sqrt(vx*vx + vy*vy);
                if (mag > 1) { vx /= mag; vy /= mag; }
                const offsetX = Math.round(vx * maxOffset);
                const offsetY = Math.round(-vy * maxOffset);
                knob.style.transform = `translate(calc(-50% + ${offsetX}px), calc(-50% + ${offsetY}px))`;
            }
        } catch(e) {}
    }

    setJoyconPosition(position) {
        try {
            const joystick = document.getElementById('joystick');
            const boostBtn = document.getElementById('boostBtn');
            const mobile = document.getElementById('mobileControls');
            if (!joystick || !boostBtn) return;
            if (position === 'right') {
                joystick.style.left = 'auto';
                joystick.style.right = '20px';
                boostBtn.style.right = 'auto';
                boostBtn.style.left = '20px';
                if (mobile) { mobile.classList.add('joy-right'); mobile.classList.remove('joy-left'); }
            } else {
                joystick.style.right = 'auto';
                joystick.style.left = '20px';
                boostBtn.style.left = 'auto';
                boostBtn.style.right = '20px';
                if (mobile) { mobile.classList.remove('joy-right'); mobile.classList.add('joy-left'); }
            }
            try { if (typeof this.updateBoostRing === 'function') this.updateBoostRing(); } catch(e) {}
        } catch(e) { console.warn('setJoyconPosition failed', e); }
    }

    _startBoostCooldown() {
        const start = performance.now();
        const duration = this._boostCooldownMs || 1000;
        const circ = this._boostRingCircle;
        let r = 44;
        try { r = parseFloat(circ.getAttribute('r')) || r; } catch(e) {}
        const circumference = (2 * Math.PI * r);
        if (this._boostAnimRaf) { cancelAnimationFrame(this._boostAnimRaf); this._boostAnimRaf = null; }
        const tick = () => {
            const now = performance.now();
            const elapsed = now - start;
            const t = Math.max(0, Math.min(1, elapsed / duration));
            try { if (circ) circ.setAttribute('stroke-dashoffset', String(Math.round(circumference * (1 - t)))); } catch(e) {}
            if (t < 1) {
                this._boostAnimRaf = requestAnimationFrame(tick);
            } else {
                this._boostReady = true;
                try { if (circ) circ.setAttribute('stroke-dashoffset', '0'); } catch(e) {}
                this._boostAnimRaf = null;
            }
        };
        try { if (circ) circ.setAttribute('stroke-dashoffset', String(Math.round(circumference))); } catch(e) {}
        this._boostAnimRaf = requestAnimationFrame(tick);
    }
}