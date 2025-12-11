import * as Haptics from './haptics.js';

const ENEMY_FACING_OFFSET = -0.4;
const TAP_TARGET_RADIUS = 3.0;

export class Enemy {
    constructor(game) {
        this.game = game;
        this.mesh = null;
        this.health = 200;
        this.speed = 0;

        this.spawn();
    }

    spawn() {
        this.mesh = BABYLON.MeshBuilder.CreateSphere('enemy', { diameter: 1.6 }, this.game.scene);
        try {
            const R = (this.game && this.game.platformRadius) ? this.game.platformRadius : 10;
            const platformTop = (this.game && this.game.platform && typeof this.game.platform.position !== 'undefined') ? (this.game.platform.position.y + 0.3) : 0.3;
            const spawnY = platformTop + 0.8;
            const ex = 0;
            const ez = R * 0.25; 
            this.mesh.position.set(ex, spawnY, ez);
        } catch (e) {
            this.mesh.position.set(3, 3, 0);
        }

        if (this.game.physicsEnabled) {
            try {
                this.mesh.physicsImpostor = new BABYLON.PhysicsImpostor(this.mesh, BABYLON.PhysicsImpostor.SphereImpostor, {
                    mass: .5,
                    restitution: 0.01,
                    friction: 0.02
                }, this.game.scene);
                try {
                    const body = this.mesh.physicsImpostor.physicsBody;
                        if (body) {
                            body.allowSleep = false;
                            if (typeof body.linearDamping !== 'undefined') body.linearDamping = 0.02;
                            if (typeof body.angularDamping !== 'undefined') body.angularDamping = 0.02;
                        }
                } catch(e) {}
            } catch(e) { console.warn('Failed to create enemy physics impostor', e); }
        }

        this._lastCollisionTime = 0;
        this._invulnerable = true;
        setTimeout(() => { this._invulnerable = false; }, 600);

        try {
            if (this.game.physicsEnabled && this.mesh.physicsImpostor && this.game.player && this.game.player.mesh && this.game.player.mesh.physicsImpostor) {
                this.mesh.physicsImpostor.registerOnPhysicsCollide(this.game.player.mesh.physicsImpostor, () => {
                    this._onPhysicsCollideWithPlayer();
                });
            }
        } catch (e) {}

        try {
            const material = new BABYLON.StandardMaterial('enemyMatUnique', this.game.scene);
            const texPath = 'assets/textures/Kingpin.jpg';
            material.diffuseTexture = new BABYLON.Texture(texPath, this.game.scene, true, false, BABYLON.Texture.TRILINEAR_SAMPLINGMODE);
            material.emissiveColor = new BABYLON.Color3(0.08,0.02,0.02);
            material.specularColor = new BABYLON.Color3(0.1,0.1,0.12);
            material.diffuseTexture.hasAlpha = false;
            if (material.diffuseTexture) {
                material.diffuseTexture.uOffset = 0.75;
            }
            this.mesh.material = material;
            try {
                if (this.game && this.game.player && this.game.player.mesh) {
                    this.mesh.lookAt(this.game.player.mesh.position);
                    this.mesh.rotation.y += ENEMY_FACING_OFFSET;
                }
            } catch(e) {}
        } catch (e) {
            const fallback = new BABYLON.StandardMaterial('enemyMatFallback', this.game.scene);
            fallback.diffuseColor = new BABYLON.Color3(1, 0, 0);
            this.mesh.material = fallback;
        }

        try { if (this.game.hud) this.game.hud.updateEnemy(this.health); } catch(e) {}
        this._lastTrailTime = 0;

        try {
            if (this.game && this.game.scene && typeof this.game.scene.onPointerObservable !== 'undefined') {
                this._pointerObserver = this.game.scene.onPointerObservable.add((pi) => {
                    try {
                        if (!pi.event) return;
                        if (pi.type !== BABYLON.PointerEventTypes.POINTERDOWN) return;
                        const sx = (pi.event.clientX !== undefined) ? pi.event.clientX : pi.event.x;
                        const sy = (pi.event.clientY !== undefined) ? pi.event.clientY : pi.event.y;
                        const pick = this.game.scene.pick(sx, sy);
                        let hitNearby = false;
                        if (pick) {
                            if (pick.hit && pick.pickedPoint) {
                                const d = BABYLON.Vector3.Distance(pick.pickedPoint, this.mesh.position);
                                if (d <= TAP_TARGET_RADIUS) hitNearby = true;
                            }
                            if (!hitNearby && pick.ray && pick.ray.origin && pick.ray.direction) {
                                try {
                                    const ray = pick.ray;
                                    const v = this.mesh.position.subtract(ray.origin);
                                    const proj = Math.max(0, BABYLON.Vector3.Dot(v, ray.direction));
                                    const closest = ray.origin.add(ray.direction.scale(proj));
                                    const dRay = BABYLON.Vector3.Distance(closest, this.mesh.position);
                                    if (dRay <= TAP_TARGET_RADIUS) hitNearby = true;
                                } catch(e) {}
                            }
                        }
                        if (hitNearby) {
                            try { this.game.lockedEnemy = this; } catch(e) {}
                        }
                    } catch(e) {}
                });
            }
        } catch(e) {}
    }

    update() {
        if (!this.mesh) return;
        if (this.game.physicsEnabled && this.mesh.physicsImpostor) {
            try {
                const vel = this.mesh.physicsImpostor.getLinearVelocity();
                this.speed = vel ? vel.length() : 0;
            } catch (e) { this.speed = 0; }
        } else {
            this.speed = 0;
        }

        try {
            const player = this.game.player;
            if (player && player.mesh) {
                const playerPos = player.mesh.position;
                const toPlayer = playerPos.subtract(this.mesh.position);
                const distance = toPlayer.length();
                const dir = toPlayer.normalize();

                if (this.game.platformRadius) {
                    const distFromCenter = Math.sqrt(this.mesh.position.x*this.mesh.position.x + this.mesh.position.z*this.mesh.position.z);
                    const maxR = this.game.platformRadius * 0.95;
                    if (distFromCenter > maxR) {
                        const back = new BABYLON.Vector3(-this.mesh.position.x, 0, -this.mesh.position.z).normalize();
                        if (this.game.physicsEnabled && this.mesh.physicsImpostor) {
                            try { this.mesh.physicsImpostor.applyForce(back.scale(0.15), this.mesh.getAbsolutePosition()); } catch(e){}
                        } else {
                            this.mesh.position.addInPlace(back.scale(0.05));
                        }
                    }
                }

                const aggression = Math.min(1.6, Math.max(0.5, distance * 0.06));
                const screenFactor = (typeof window !== 'undefined' && window.innerWidth) ? Math.max(0.6, Math.min(1, window.innerWidth / 1366)) : 1;
                const baseForceScale = 6.5 * screenFactor;
                const forceScale = baseForceScale * (aggression);

                if (this.game.physicsEnabled && this.mesh.physicsImpostor) {
                    const force = dir.scale(forceScale);
                    try { this.mesh.physicsImpostor.applyForce(force, this.mesh.getAbsolutePosition()); } catch (e) {}
                    try { this.mesh.lookAt(playerPos); this.mesh.rotation.y += ENEMY_FACING_OFFSET; } catch(e) {}
                } else {
                    try {
                        this.mesh.position = this.mesh.position.add(dir.scale(0.02 * forceScale));
                    } catch(e) {}
                }
            }
        } catch(e) { }

        try {
            if (this.game && this.game.lockedEnemy === this && this.game.physicsEnabled && this.mesh.physicsImpostor && this.mesh.physicsImpostor.getLinearVelocity) {
                try {
                    const bodyVel = this.mesh.physicsImpostor.getLinearVelocity() || new BABYLON.Vector3(0,0,0);
                    const horizontal = new BABYLON.Vector3(bodyVel.x, 0, bodyVel.z);
                    const vertY = bodyVel.y || 0;
                    const hSpeed = horizontal.length();

                    try {
                        const playerPos = (this.game && this.game.player && this.game.player.mesh) ? this.game.player.mesh.position : null;
                        if (playerPos) {
                            const toPlayer = playerPos.subtract(this.mesh.position);
                            const forward = toPlayer.clone(); forward.y = 0;
                            if (forward.length() > 1e-4) forward.normalize(); else forward.set(0,0,1);

                            const forwardComp = forward.scale(BABYLON.Vector3.Dot(horizontal, forward));
                            const lateralComp = horizontal.subtract(forwardComp);

                            const lateralReduced = lateralComp.scale(0.5);

                            const newHorizontal = forwardComp.add(lateralReduced);

                            if (lateralComp.length() > 0.02) {
                                const corrective = lateralComp.scale(-2.5);
                                try { this.mesh.physicsImpostor.applyForce(corrective, this.mesh.getAbsolutePosition()); } catch(e) {}
                            }

                            try {
                                const newVel = new BABYLON.Vector3(newHorizontal.x, vertY, newHorizontal.z);
                                this.mesh.physicsImpostor.setLinearVelocity(newVel);
                            } catch(e) {}
                        }
                    } catch(e) {}

                    try {
                        const body = this.mesh.physicsImpostor.physicsBody;
                            if (body) {
                                if (typeof body.linearDamping !== 'undefined') body.linearDamping = 0.02;
                                if (typeof body.angularDamping !== 'undefined') body.angularDamping = 0.5;
                        }
                    } catch(e) {}
                } catch(e) {}
            } else {
                try {
                    const body = this.mesh.physicsImpostor && this.mesh.physicsImpostor.physicsBody;
                    if (body) {
                            if (typeof body.linearDamping !== 'undefined') body.linearDamping = 0.02;
                            if (typeof body.angularDamping !== 'undefined') body.angularDamping = 0.02;
                    }
                } catch(e) {}
            }
        } catch(e) {}

    }

    collideWithPlayer() {
        if (!this.game.player) return;
        const now = performance.now();
        if (now - this._lastCollisionTime < 130) return; 
        this._lastCollisionTime = now;
        const playerSpeed = this.game.player.speed || 0;
        const enemySpeed = this.speed || 0;
        const isBoost = this.game.controls && this.game.controls.isBoosting;
        const baseDamage = (playerSpeed + enemySpeed) * 0.5;

        const enemySpeedNorm = Math.max(0, Math.min(1, enemySpeed / 12));
        const vulnMultiplier = 1 - (0.6 * enemySpeedNorm); 

        let damageToEnemy = baseDamage * (1 + (playerSpeed / 10)) * vulnMultiplier;
        if (isBoost) damageToEnemy *= 1.6;
        this.takeDamage(damageToEnemy);
        try {
            const pts = 1 + Math.floor(Math.abs(damageToEnemy) / 2);
            if (this.game && this.game.player && typeof this.game.player.addPoints === 'function') {
                this.game.player.addPoints(pts);
            }
        } catch(e) {}

        let damageToPlayer = baseDamage * (1 + (enemySpeed / 8));
        damageToPlayer *= 1.2; 
        if (!this.game.player._invulnerable) this.game.player.takeDamage(damageToPlayer);

        try {
            const strength = Math.max(0.06, Math.min(1, ((playerSpeed + enemySpeed) / 14)));
            if (this.game && typeof this.game.triggerCameraShake === 'function') this.game.triggerCameraShake(strength);
        } catch(e) {}

        try {
            const pMesh = this.game.player.mesh;
            const eMesh = this.mesh;
            if (pMesh && eMesh && pMesh.physicsImpostor && eMesh.physicsImpostor && this.game.physicsEnabled) {
                const dir = pMesh.position.subtract(eMesh.position).normalize();
                const combined = (playerSpeed + enemySpeed);
                const playerImpulseMag = Math.max(0.14, combined * 0.22);
                const enemyImpulseMag = Math.max(0.08, combined * 0.12);
                const pImpulse = dir.scale(playerImpulseMag);
                const eImpulse = dir.scale(-enemyImpulseMag);
                try { pMesh.physicsImpostor.applyImpulse(pImpulse, pMesh.getAbsolutePosition()); } catch(e) {}
                try { eMesh.physicsImpostor.applyImpulse(eImpulse, eMesh.getAbsolutePosition()); } catch(e) {}
            }
        } catch(e) {}
        try { Haptics.collision(); } catch(e) {}
    }

    _onPhysicsCollideWithPlayer() {
        if (this._invulnerable) return;
        this.collideWithPlayer();
    }

    takeDamage(amount) {
        this.health -= amount;
        try { if (this.game.hud) this.game.hud.updateEnemy(Math.max(0, this.health)); } catch(e) {}

        if (this.health <= 0) {
            this.destroy();
        }
        
        this.mesh.scaling.scaleInPlace(0.9);
        setTimeout(() => {
            if (this.mesh) this.mesh.scaling.scaleInPlace(1 / 0.9);
        }, 100);
    }

    destroy() {
        try {
            if (this._pointerObserver && this.game && this.game.scene && this.game.scene.onPointerObservable) {
                try { this.game.scene.onPointerObservable.remove(this._pointerObserver); } catch(e) {}
                this._pointerObserver = null;
            }
        } catch(e) {}
        if (this.mesh) {
            this.mesh.dispose();
            this.mesh = null;
        }
        
        try { if (this.game.hud) this.game.hud.updateEnemy(0); } catch(e) {}

        const index = this.game.enemies.indexOf(this);
        if (index > -1) {
            this.game.enemies.splice(index, 1);
        }
        
        this.game.sounds.playSFX('enemy_destroy');
        try { if (this.game && typeof this.game.onEnemyDeath === 'function') this.game.onEnemyDeath('destroy'); } catch(e) {}
    }

    _drawHealth() {
        try {
            if (!this._healthDT) return;
            const ctx = this._healthDT.getContext();
            const size = this._healthDT.getSize ? this._healthDT.getSize() : { width: 128, height: 256 };
            const w = size.width; const h = size.height;
            ctx.clearRect(0,0,w,h);

            ctx.fillStyle = 'rgba(0,0,0,0.28)';
            ctx.fillRect(0,0,w,h);

            ctx.strokeStyle = 'rgba(16,255,16,0.9)';
            ctx.lineWidth = 6;
            ctx.strokeRect(4,4,w-8,h-8);

            const segs = 20;
            const segH = Math.floor((h - 16) / segs);
            const pct = Math.max(0, Math.min(1, (this.health / (this._maxHealth || 50))));
            const onCount = Math.round(pct * segs);
            for (let i=0;i<segs;i++){
                const y = h - 8 - (i+1)*segH;
                ctx.fillStyle = (i < onCount) ? 'rgba(0,255,0,0.98)' : 'rgba(255,255,255,0.06)';
                ctx.fillRect(8, y+2, w-16, segH-4);
            }

            this._healthDT.update();
        } catch(e) { /* ignore */ }
    }
}