import { Menu } from './menu.js';
import { Player } from './player.js';
import { Enemy } from './enemy.js';
import { Controls } from './controls.js';
import { Sounds } from './sounds.js';
import { HUD } from './hud.js';
import * as Haptics from './haptics.js';

class Game {
    constructor() {
        this.canvas = document.getElementById('renderCanvas');
        this.engine = new BABYLON.Engine(this.canvas, true);
        this.scene = new BABYLON.Scene(this.engine);

        this.physicsEnabled = !!window.MR_PHYSICS_AVAILABLE;
        if (this.physicsEnabled) {
            try {
                this.scene.enablePhysics(new BABYLON.Vector3(0, -15, 0), new BABYLON.CannonJSPlugin());
            } catch (e) {
                console.warn('Failed to enable physics despite availability flag:', e);
                this.physicsEnabled = false;
            }
        } else {
            console.warn('Physics disabled: Cannon or Babylon Cannon plugin not available.');
        }
        
        this.sounds = new Sounds(this);
        this.cameraFollow = true; 

        this.menu = new Menu(this);
        this.player = new Player(this);
        this.enemies = [];
        this.controls = new Controls(this);
        this.hud = new HUD(this);
        
        this.isPlaying = false;
        this.cameraShakeMultiplier = 0.28;
        this._shakeTime = 0;
        this._shakeDuration = 420; 
        this._shakeMagnitude = 0; 
        this._cameraTarget = new BABYLON.Vector3(0,0,0);
        this._cameraPosLerp = 0.02;
        this._cameraPosLerpLocked = 0.045;
        this._cameraTargetLerp = 0.02;
        
        this.initScene();
        this.bindEvents();
        this.engine.runRenderLoop(() => {
            this.scene.render();
            if (this.isPlaying && !this._paused) {
                this.update();
            }
        });
    }
    
    initScene() {
        this.camera = new BABYLON.UniversalCamera('camera', new BABYLON.Vector3(0, 5, -10), this.scene);
        this.camera.setTarget(BABYLON.Vector3.Zero());
        this._applyCameraMode();
        
        const light = new BABYLON.HemisphericLight('light', new BABYLON.Vector3(0, 1, 0), this.scene);
        
        const baseDiameter = 28;
        const arenaDiameter = baseDiameter * 0.75;
        const platform = BABYLON.MeshBuilder.CreateCylinder('platform', { diameter: arenaDiameter, height: 0.6, tessellation: 8 }, this.scene);
        platform.position.y = 0;
        const pm = new BABYLON.StandardMaterial('platformMat', this.scene);
        try {
            const floorTex = new BABYLON.Texture('assets/textures/floor.png', this.scene, true, false);
            const tiles = Math.max(2, Math.floor(arenaDiameter / 6));
            floorTex.uScale = tiles;
            floorTex.vScale = tiles;
            pm.diffuseTexture = floorTex;
            pm.specularColor = new BABYLON.Color3(0.06,0.06,0.06);
            pm.emissiveColor = new BABYLON.Color3(0.01,0.01,0.01);
        } catch(e) {
            pm.diffuseColor = new BABYLON.Color3(0.06, 0.06, 0.06);
            pm.emissiveColor = new BABYLON.Color3(0.02,0.02,0.02);
        }
        pm.specularColor = new BABYLON.Color3(0.1,0.1,0.12);
        platform.material = pm;
        try { 
            platform.physicsImpostor = new BABYLON.PhysicsImpostor(platform, BABYLON.PhysicsImpostor.MeshImpostor, { mass: 0, restitution: 0.9 }, this.scene);
        } catch(e) {
            try { platform.physicsImpostor = new BABYLON.PhysicsImpostor(platform, BABYLON.PhysicsImpostor.BoxImpostor, { mass: 0, restitution: 0.9 }, this.scene); } catch(e2) {}
        }
        this.platform = platform;
        this.platformRadius = arenaDiameter / 2;

        try {
            const rimHeight = 0.18;
            const outerR = this.platformRadius * 1.01;
            const rimDiameter = outerR * 2;
            const rim = BABYLON.MeshBuilder.CreateCylinder('platformRim', { diameter: rimDiameter, height: rimHeight, tessellation: 8 }, this.scene);
            const platformTop = platform.position.y + 0.3;
            rim.position = new BABYLON.Vector3(0, platformTop - (rimHeight / 2) - 0.02, 0);
            const rimMat = new BABYLON.StandardMaterial('rimMat', this.scene);
            rimMat.diffuseColor = new BABYLON.Color3(0, 1, 0);
            rimMat.emissiveColor = new BABYLON.Color3(0, 0.9, 0);
            rimMat.specularColor = new BABYLON.Color3(0,0,0);
            rim.material = rimMat;
            try {
                const sides = 8;
                const R = this.platformRadius;
                const platformTopY = platform.position.y + 0.3;
                const segHeight = rimHeight;
                const segDepth = 0.28;
                const theta = (Math.PI * 2) / sides;
                const sideLength = 2 * R * Math.sin(Math.PI / sides);
                const midRadius = R * Math.cos(Math.PI / sides);
                for (let i = 0; i < sides; i++) {
                    const midAngle = (i * theta) + theta/2;
                    const sx = Math.cos(midAngle) * midRadius;
                    const sz = Math.sin(midAngle) * midRadius;
                    const seg = BABYLON.MeshBuilder.CreateBox(`rimSeg_${i}`, { width: sideLength * 1.02, depth: segDepth, height: segHeight }, this.scene);
                    seg.position = new BABYLON.Vector3(sx, platformTopY - (segHeight / 2) - 0.02, sz);
                    seg.rotation = new BABYLON.Vector3(0, -midAngle, 0);
                    seg.isVisible = false;
                    try {
                        seg.physicsImpostor = new BABYLON.PhysicsImpostor(seg, BABYLON.PhysicsImpostor.BoxImpostor, { mass:0, restitution:0.05, friction: 0.6 }, this.scene);
                    } catch(e) {
                    }
                }
            } catch(e) { }
        } catch(e) { }

        try {
            const skybox = BABYLON.MeshBuilder.CreateBox('skyBox', { size: 500 }, this.scene);
            skybox.infiniteDistance = true;
            const skyMat = new BABYLON.StandardMaterial('skyMat', this.scene);
            skyMat.backFaceCulling = false;
            const skyTex = new BABYLON.Texture('assets/textures/bg.png', this.scene, true, false);
            skyTex.uScale = 8;
            skyTex.vScale = 8;
            skyMat.diffuseTexture = skyTex;
            skyMat.disableLighting = true;
            skyMat.emissiveColor = new BABYLON.Color3(1,1,1);
            skybox.material = skyMat;
        } catch(e) { console.warn('Skybox creation failed', e); }

        try {
            this._deathY = (this.platform && typeof this.platform.position !== 'undefined') ? (this.platform.position.y - 6.0) : -6;
        } catch(e) { this._deathY = -6; }
    }

    togglePause() {
        this._paused = !this._paused;
        if (this._paused) {
            this.showPauseOverlay();
            this._pausePhysics();
            try { if (this.sounds && typeof this.sounds.stopMusic === 'function') this.sounds.stopMusic(); } catch(e) {}
        } else {
            this.hidePauseOverlay();
            this._resumePhysics();
            try { if (this.sounds && typeof this.sounds.playBackgroundMusic === 'function' && this.isPlaying) this.sounds.playBackgroundMusic(); } catch(e) {}
        }
        console.log('Paused:', !!this._paused);
    }

    _pausePhysics() {
        if (!this.scene || !this.scene.meshes) return;
        try {
            this.scene.meshes.forEach(m => {
                try {
                    if (m.physicsImpostor && m.physicsImpostor.physicsBody && typeof m.physicsImpostor.physicsBody.sleep === 'function') {
                        m.physicsImpostor.physicsBody.sleep();
                    }
                } catch(e) {}
            });
        } catch(e) {}
    }

    _resumePhysics() {
        if (!this.scene || !this.scene.meshes) return;
        try {
            this.scene.meshes.forEach(m => {
                try {
                    if (m.physicsImpostor && m.physicsImpostor.physicsBody && typeof m.physicsImpostor.physicsBody.wakeUp === 'function') {
                        m.physicsImpostor.physicsBody.wakeUp();
                    }
                } catch(e) {}
            });
        } catch(e) {}
    }

    showPauseOverlay() {
        try {
            let el = document.getElementById('pauseOverlay');
            if (!el) {
                el = document.createElement('div');
                el.id = 'pauseOverlay';
                el.textContent = 'PAUSED';
                document.body.appendChild(el);
            }
            el.classList.add('visible');
        } catch(e) { console.warn('showPauseOverlay failed', e); }
    }

    hidePauseOverlay() {
        try {
            const el = document.getElementById('pauseOverlay');
            if (el) el.classList.remove('visible');
        } catch(e) {}
    }
    
    bindEvents() {
        window.addEventListener('resize', () => {
            this.engine.resize();
        });
        window.addEventListener('keydown', (e) => {
            try {
                if (e.code === 'Space') {
                    e.preventDefault();
                    if (this.isPlaying) this.togglePause();
                }
            } catch(_) {}
        });
        try {
            this.scene.onPointerObservable.add((pi) => {
                if (!this.isPlaying) return;
                if (pi.type === BABYLON.PointerEventTypes.POINTERDOWN) {
                    try {
                        const pick = this.scene.pick(this.scene.pointerX, this.scene.pointerY);
                        if (pick && pick.hit && pick.pickedMesh && pick.pickedMesh.name && pick.pickedMesh.name.indexOf('enemy') !== -1) {
                            const enemy = this.enemies.find(e => e.mesh === pick.pickedMesh);
                            if (enemy) this.toggleLock(enemy);
                        }
                    } catch(e){}
                }
            });
        } catch(e) {}

        window.addEventListener('keydown', (ev) => {
            if (!this.isPlaying) return;
            if (ev.key === 'q' || ev.key === 'Q') {
                if (this.lockedEnemy) this.unlock(); else this.lockNearestEnemy();
            }
        });
        try {
            const clickables = document.querySelectorAll('button, [role="button"], a.neon, .neon, .menu-button');
            clickables.forEach(el => {
                try {
                    el.addEventListener('pointerdown', () => { try { Haptics.buttonPress(); } catch(e){} });
                } catch(e) {}
            });

            const ranges = document.querySelectorAll('input[type="range"]');
            ranges.forEach(r => {
                try {
                    r.addEventListener('input', (e) => {
                        try {
                            const step = parseFloat(r.step || '0');
                            const val = parseFloat(r.value || '0');
                            if (step > 0) {
                                const nearest = Math.round(val / step) * step;
                                if (Math.abs(val - nearest) < (step * 0.5)) { try { Haptics.sliderSnap(); } catch(e){} }
                            } else { try { Haptics.weak(); } catch(e){} }
                        } catch(e) {}
                    });
                    r.addEventListener('change', () => { try { Haptics.sliderSnap(); } catch(e){} });
                } catch(e) {}
            });
        } catch(e) {}
    }

    setCameraFollow(enabled) {
        this.cameraFollow = !!enabled;
        this._applyCameraMode();
    }

    _applyCameraMode() {
        if (!this.camera) return;
        if (this.cameraFollow) {
            try { this.camera.detachControl(); } catch (e) {}
        } else {
            this.camera.attachControl(this.canvas, true);
        }
    }
    
    startGame() {
        if (this.isPlaying) return;

        this._clearEntities();

        try { this._startPoints = parseInt(localStorage.getItem('mr_points') || '0', 10) || 0; } catch(e) { this._startPoints = 0; }

        this.isPlaying = true;
        this.menu.hide();
        this.player.spawn();
        this.spawnEnemy();
        try { if (this.sounds && typeof this.sounds.playBackgroundMusic === 'function') this.sounds.playBackgroundMusic(); } catch(e) {}
        try {
            const e = this.enemies[0];
            if (e && e.mesh && this.player && this.player.mesh) {
                try { this.player.mesh.lookAt(e.mesh.position); } catch(e){}
                try { e.mesh.lookAt(this.player.mesh.position); } catch(e){}
            }
        } catch(e) {}
    }

    lockNearestEnemy() {
        if (!this.enemies || this.enemies.length === 0) return;
        let nearest = null; let nd = Infinity;
        for (const e of this.enemies) {
            if (!e || !e.mesh) continue;
            const d = BABYLON.Vector3.Distance(e.mesh.position, this.player.mesh.position);
            if (d < nd) { nd = d; nearest = e; }
        }
        if (nearest) this.lockedEnemy = nearest;
    }
    toggleLock(enemy) {
        if (this.lockedEnemy === enemy) this.lockedEnemy = null; else this.lockedEnemy = enemy;
    }
    unlock() { this.lockedEnemy = null; }

    onEnemyDeath(reason) {
        try { if (typeof this.triggerCameraShake === 'function') this.triggerCameraShake(0.6); } catch(e) {}
        setTimeout(() => { this.showEnemyDeathModal('yay'); }, 450);
    }

    onPlayerDeath() {
        try { if (typeof this.triggerCameraShake === 'function') this.triggerCameraShake(0.45); } catch(e) {}
        setTimeout(() => { this.showEnemyDeathModal('L'); }, 450);
        this.isPlaying = false;
    }

    showEnemyDeathModal(type) {
        try {
            const existing = document.getElementById('enemyDeathModal');
            if (existing) existing.remove();
            const modal = document.createElement('div');
            modal.id = 'enemyDeathModal';
            modal.className = 'submenu';
            modal.style.zIndex = 2000;
            const txt = (type === 'L') ? 'L' : 'yay';
            let total = 0; try { total = parseInt(localStorage.getItem('mr_points') || '0', 10) || 0; } catch(e) { total = 0; }
            const start = (typeof this._startPoints === 'number') ? this._startPoints : 0;
            const earned = Math.max(0, total - start);
            modal.innerHTML = `\n                <div class="title glitch" data-text="${txt}">${txt}</div>\n                <div style="margin-top:10px; font-size:14px;">\n                    <div>POINTS EARNED: <span class="death-points-earned">${earned}</span></div>\n                    <div>TOTAL POINTS: <span class="death-points-total">${total}</span></div>\n                </div>\n                <div style="margin-top:12px;">\n                    <button id="deathMainMenu" class="neon">MAIN MENU</button>\n                </div>\n            `;
            document.getElementById('viewport').appendChild(modal);
            try { const mobile = document.getElementById('mobileControls'); if (mobile) mobile.classList.remove('hidden'); } catch(e) {}
            const btn = document.getElementById('deathMainMenu');
            if (btn) btn.addEventListener('click', () => {
                try { modal.remove(); } catch(e) {}
                try { window.location.reload(); } catch(e) { try { this.gameOver(); } catch(e) { try { this.menu.show(); } catch(e) {} } }
            });
        } catch(e) { console.warn('Failed to show death modal', e); }
    }
    
    update() {
        this.player.update();
        this.enemies.forEach(enemy => enemy.update());
        try {
            if (this.enemies && this.enemies.length) {
                const deathY = typeof this._deathY !== 'undefined' ? this._deathY : -6;
                this.enemies.slice().forEach(en => {
                    try {
                        if (en && en.mesh && en.mesh.position.y < deathY) {
                            en.takeDamage(9999);
                            this.onEnemyDeath('fall');
                        }
                    } catch(e) {}
                });
            }
        } catch(e) {}
        if (this.cameraFollow && this.player && this.player.mesh) {
            const targetPos = this.player.mesh.position;
            if (this.lockedEnemy && this.lockedEnemy.mesh) {
                const enemyPos = this.lockedEnemy.mesh.position;
                const fromEnemy = this.player.mesh.position.subtract(enemyPos).normalize();
                const back = fromEnemy.scale(10);
                const desired = this.player.mesh.position.add(back).add(new BABYLON.Vector3(0, 5, 0));
                this.camera.position = BABYLON.Vector3.Lerp(this.camera.position, desired, this._cameraPosLerpLocked);
                try {
                    this._cameraTarget = BABYLON.Vector3.Lerp(this._cameraTarget, enemyPos, this._cameraTargetLerp);
                    this.camera.setTarget(this._cameraTarget);
                } catch(e) {}
                try { this.player.mesh.lookAt(enemyPos); } catch(e) {}
            } else {
                try {
                    const arenaR = this.platformRadius || 10;
                    const fixedHeight = Math.max(8, arenaR * 0.6) + 1;
                    const fixedZ = -arenaR * 1.4;
                    const fixedPos = new BABYLON.Vector3(0, fixedHeight, fixedZ);
                    this.camera.position = BABYLON.Vector3.Lerp(this.camera.position, fixedPos, this._cameraPosLerp);
                    this._cameraTarget = BABYLON.Vector3.Lerp(this._cameraTarget, targetPos, this._cameraTargetLerp);
                    this.camera.setTarget(this._cameraTarget);
                } catch(e) {}
            }
        }

        try {
            if (this._shakeTime > 0) {
                const dt = this.engine.getDeltaTime() || 16.6;
                this._shakeTime -= dt;
                const t = Math.max(0, this._shakeTime / this._shakeDuration);
                const amp = this._shakeMagnitude * t;
                const ox = (Math.random() * 2 - 1) * amp;
                const oy = (Math.random() * 2 - 1) * amp * 0.6;
                const oz = (Math.random() * 2 - 1) * amp * 0.6;
                this.camera.position.addInPlace(new BABYLON.Vector3(ox, oy, oz));
            }
        } catch(e) {}

        try {
            if (this._lastLocked && (!this.lockedEnemy || this._lastLocked !== this.lockedEnemy)) {
                try { this._lastLocked.renderOutline = false; } catch(e) {}
                this._lastLocked = null;
            }
            if (this.lockedEnemy && this.lockedEnemy.mesh) {
                const m = this.lockedEnemy.mesh;
                try {
                    m.renderOutline = true;
                    m.outlineColor = new BABYLON.Color3(1, 0, 0);
                    m.outlineWidth = 0.1;
                    this._lastLocked = m;
                } catch(e) {}
            }
        } catch(e) {}
    }

    triggerCameraShake(baseStrength) {
        try {
            const clamped = Math.max(0, Math.min(1, baseStrength || 0));
            this._shakeMagnitude = Math.max(this._shakeMagnitude, clamped * (this.cameraShakeMultiplier || 0.5) * 1.2);
            this._shakeTime = Math.max(this._shakeTime, this._shakeDuration);
        } catch(e) {}
    }
    
    spawnEnemy() {
        const enemy = new Enemy(this);
        this.enemies.push(enemy);
    }
    
    gameOver() {
        this.isPlaying = false;
        this.menu.show();
        this._clearEntities();
    }

    _clearEntities() {
        try {
            if (this.player && this.player.mesh) {
                try { this.player.mesh.dispose(); } catch (e) {}
                this.player.mesh = null;
            }
        } catch (e) {}

        if (Array.isArray(this.enemies)) {
            this.enemies.forEach(en => {
                try {
                    if (en && en.mesh) en.mesh.dispose();
                } catch (e) {}
            });
            this.enemies.length = 0;
        }

        if (this.hud) this.hud.update(0, 100);
    }
}

function __mr_startGame() {
    try { new Game(); } catch (e) { console.error('Failed to start Game', e); }
}
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', __mr_startGame);
} else {
    __mr_startGame();
}