import * as Haptics from './haptics.js';

export class Player {
    constructor(game) {
        this.game = game;
        this.mesh = null;
        this.speed = 0;
        this.health = 100;
        this.skin = 'default';
        this.accessories = [];
        this._accMeshes = {};
        this._accOffsets = {};
        this._orbCooldown = 0;
        this.maxStamina = 100;
        this.stamina = this.maxStamina;
        this.staminaRegen = 10;
        this._lastStaminaTime = performance.now ? performance.now() : Date.now();
        this._staminaBlockedUntil = null;
        this._damageReductionUntil = null;
    }

    spawn() {
        if (this.mesh) {
            try { this.mesh.dispose(); } catch (e) { }
            this.mesh = null;
        }

        this.health = 100;
        this.stamina = this.maxStamina;
        this._lastStaminaTime = performance.now ? performance.now() : Date.now();

        try {
            const saved = JSON.parse(localStorage.getItem('mr_customization') || '{}');
            if (saved && saved.skin) {
                this.skin = String(saved.skin);
            }
            if (saved && Array.isArray(saved.accessories) && saved.accessories.length) {
                this.accessories = saved.accessories.slice();
            }
        } catch (e) { }

        this.mesh = BABYLON.MeshBuilder.CreateSphere('player', { diameter: 1 }, this.game.scene);
        try {
            const R = (this.game && this.game.platformRadius) ? this.game.platformRadius : 10;
            const platformTop = (this.game && this.game.platform && typeof this.game.platform.position !== 'undefined') ? (this.game.platform.position.y + 0.3) : 0.3;
            const spawnY = platformTop + 0.5;
            const px = 0;
            const pz = -R * 0.35;
            this.mesh.position.set(px, spawnY, pz);
        } catch (e) {
            this.mesh.position.y = 1;
        }

        if (this.game.physicsEnabled) {
            try {
                this.mesh.physicsImpostor = new BABYLON.PhysicsImpostor(this.mesh, BABYLON.PhysicsImpostor.SphereImpostor, {
                    mass: 0.1,
                    restitution: 0.1,
                    friction: 1
                }, this.game.scene);
                try {
                    if (this.mesh.physicsImpostor.physicsBody) {
                        this.mesh.physicsImpostor.physicsBody.linearDamping = 0.25;
                        this.mesh.physicsImpostor.physicsBody.angularDamping = 0.4;
                    }
                } catch (e) { }
                try { if (this.mesh.physicsImpostor.physicsBody) this.mesh.physicsImpostor.physicsBody.allowSleep = false; } catch (e) { }
            } catch (e) { console.warn('Failed to create player physics impostor', e); }
        }

        this.updateAppearance();

        this._invulnerable = true;
        setTimeout(() => { this._invulnerable = false; }, 600);

        this._lastTrailTime = 0;

        try { if (this.game && this.game.hud) this.game.hud.updatePlayer(this.health, this.stamina); } catch (e) { }

        try {
            if (this.game.enemies && this.game.enemies.length) {
                this.game.enemies.forEach(en => {
                    try {
                        if (en.mesh && en.mesh.physicsImpostor) {
                            en.mesh.physicsImpostor.registerOnPhysicsCollide(this.mesh.physicsImpostor, () => {
                                en._onPhysicsCollideWithPlayer();
                            });
                        }
                    } catch (e) { }
                });
            }
        } catch (e) { }
    }

    update() {
        if (!this.mesh) return;
        try {
            const now = performance.now ? performance.now() : Date.now();
            if (this._staminaBlockedUntil && now < this._staminaBlockedUntil) {
                if (!this._lastStaminaTime || this._lastStaminaTime < this._staminaBlockedUntil) {
                    this._lastStaminaTime = this._staminaBlockedUntil;
                }
            } else {
                let start = this._lastStaminaTime || now;
                if (this._staminaBlockedUntil && start < this._staminaBlockedUntil) start = this._staminaBlockedUntil;
                const dt = Math.max(0, (now - start) / 1000);
                this.stamina = Math.min(this.maxStamina, (this.stamina || 0) + (this.staminaRegen * dt));
                this._lastStaminaTime = now;
                this._staminaBlockedUntil = null;
            }
        } catch (e) { }

        if (this.game.physicsEnabled && this.mesh.physicsImpostor) {
            try {
                const vel = this.mesh.physicsImpostor.getLinearVelocity();
                this.speed = vel ? vel.length() : 0;
            } catch (e) { this.speed = 0; }
        } else {
            this.speed = 0;
        }

        try { this.game.controls.applyToPlayer(this); } catch (e) { }

        try {
            Object.keys(this._accMeshes || {}).forEach(key => {
                try {
                    const am = this._accMeshes[key];
                    if (!am) return;
                    if (key === 'orbiter') return;
                    const locked = this.game && this.game.lockedEnemy;

                    if (am._children && Array.isArray(am._children)) {
                        const offsets = (this._accOffsets && this._accOffsets[key]) || [];
                        am._children.forEach((child, idx) => {
                            try {
                                const off = offsets[idx] || new BABYLON.Vector3(0, 0, 0);
                                const target = this.mesh.position.add(off);
                                if (locked) {
                                    child.position = BABYLON.Vector3.Lerp(child.position || target, target, 0.6);
                                } else {
                                    child.position.copyFrom(target);
                                }
                            } catch (e) { }
                        });
                        const grpTarget = this.mesh.position.clone();
                        if (locked) {
                            am.position = BABYLON.Vector3.Lerp(am.position || grpTarget, grpTarget, 0.6);
                        } else {
                            am.position.copyFrom(grpTarget);
                        }
                    } else {
                        const offset = this._accOffsets && this._accOffsets[key] ? this._accOffsets[key] : new BABYLON.Vector3(0, 0, 0);
                        const target = this.mesh.position.add(offset);
                        if (key === 'shield') {
                            return;
                        } else if (locked) {
                            am.position = BABYLON.Vector3.Lerp(am.position || target, target, 0.12);
                        } else {
                            am.position.copyFrom(target);
                        }
                    }
                } catch (e) { }
            });
        } catch (e) { }

        if (this.mesh.position.y < -20) {
            try { if (this.game && typeof this.game.onPlayerDeath === 'function') this.game.onPlayerDeath(); else this.game.gameOver(); } catch (e) { try { this.game.gameOver(); } catch (e) { } }
        }

        if (this.game.hud) this.game.hud.updatePlayer(this.health, this.stamina);

        try {
            if (this._accMeshes.orbiter) {
                const target = this.mesh.position.add(new BABYLON.Vector3(-0.9, 0.8, -0.6));
                this._accMeshes.orbiter.position = BABYLON.Vector3.Lerp(this._accMeshes.orbiter.position || this.mesh.position, target, 0.18);
                const now = performance.now();
                if (now - this._orbCooldown > 600) {
                    this._orbCooldown = now;
                    const enemies = (this.game.enemies || []).filter(e => e && e.mesh);
                    let nearest = null; let nd = Infinity;
                    enemies.forEach(e => {
                        const d = BABYLON.Vector3.Distance(e.mesh.position, this.mesh.position);
                        if (d < nd) { nd = d; nearest = e; }
                    });
                    if (nearest && nd < 8) {
                        try {
                            nearest.takeDamage(2);
                            this.game.sounds.playSFX('orb_hit');

                            const from = this._accMeshes.orbiter.position.clone();
                            const to = nearest.mesh.position.clone();
                            const dist = BABYLON.Vector3.Distance(from, to);

                            try {
                                const scene = this.game.scene;

                                const beam = BABYLON.MeshBuilder.CreateCylinder(`beam_${Date.now()}`, { diameter: 0.06, height: 1 }, scene);
                                const bm = new BABYLON.StandardMaterial(`beam_mat_${Date.now()}`, scene);
                                bm.emissiveColor = new BABYLON.Color3(0, 1, 0);
                                bm.alpha = 0.95;
                                beam.material = bm;

                                beam.scaling = new BABYLON.Vector3(1, dist, 1);
                                beam.position = BABYLON.Vector3.Center(from, to);
                                try { beam.lookAt(to); beam.rotate(BABYLON.Axis.X, Math.PI / 2, BABYLON.Space.LOCAL); } catch (e) { }

                                const start = performance.now();
                                const duration = 240;
                                const initialDiameter = 0.06;
                                const obs = scene.onBeforeRenderObservable.add(() => {
                                    const nowT = performance.now();
                                    const t = Math.max(0, Math.min(1, (nowT - start) / duration));
                                    try {
                                        const currentTo = nearest.mesh.position.clone();
                                        const dirVec = currentTo.subtract(from);
                                        const curDist = dirVec.length();
                                        if (curDist > 0.001) {
                                            beam.position = BABYLON.Vector3.Center(from, currentTo);
                                            beam.scaling.y = curDist;
                                            try { beam.lookAt(currentTo); beam.rotate(BABYLON.Axis.X, Math.PI / 2, BABYLON.Space.LOCAL); } catch (e) { }
                                        }

                                        const thicknessFactor = Math.max(0.02, 1.0 - t);
                                        beam.scaling.x = thicknessFactor;
                                        beam.scaling.z = thicknessFactor;
                                        bm.alpha = Math.max(0, 0.95 * (1 - t * 1.1));
                                    } catch (e) { }

                                    if (t >= 1) {
                                        try { if (beam) beam.dispose(); if (bm) bm.dispose(); } catch (e) { }
                                        try { scene.onBeforeRenderObservable.remove(obs); } catch (e) { }
                                    }
                                });
                            } catch (e) { }
                        } catch (e) { }
                    }
                }
            }
        } catch (e) { }
    }

    takeDamage(amount) {
        if (this._invulnerable) return;
        try {
            const now = performance.now ? performance.now() : Date.now();
            let effectiveAmount = amount;
            if (this._damageReductionUntil && now < this._damageReductionUntil) {
                effectiveAmount = effectiveAmount * 0.2;
            }

            const damageMultiplier = Math.max(0.5, 2 - this.speed / 10);
            this.health -= effectiveAmount * damageMultiplier;

            if (this.health <= 0) {
                try { if (this.game && typeof this.game.onPlayerDeath === 'function') this.game.onPlayerDeath(); else this.game.gameOver(); } catch (e) { try { this.game.gameOver(); } catch (e) { } }
            }

            this.game.sounds.playSFX('damage');
            if (this.game.hud) {
                this.game.hud.flashDamage();
                try { this.game.hud.updatePlayer(this.health, this.stamina); } catch (e) { }
            }
            try {
                const base = Math.max(0.08, Math.min(1, (effectiveAmount / 20)));
                if (this.game && typeof this.game.triggerCameraShake === 'function') this.game.triggerCameraShake(base);
            } catch (e) { }
        } catch (e) { }
    }

    dealDamage(enemy, isBoost) {
        let damage = this.speed;
        if (isBoost) damage *= 2;

        enemy.takeDamage(damage);
        this.game.sounds.playSFX('hit');

        try {
            const pts = 1 + Math.floor(Math.abs(damage) / 2);
            if (this.addPoints) this.addPoints(pts);
        } catch (e) { }
    }

    boost() {
        if (!this.mesh) return;

        if (!this.game.physicsEnabled || !this.mesh.physicsImpostor) return;
        const STAMINA_COST = Math.max(1, Math.round((this.maxStamina || 100) * 0.2));
        if ((this.stamina || 0) < STAMINA_COST) {
            try { if (this.game && this.game.sounds && typeof this.game.sounds.playSFX === 'function') this.game.sounds.playSFX('no_stamina'); } catch (e) { }
            try { if (this.game && this.game.hud && typeof this.game.hud.flashStamina === 'function') this.game.hud.flashStamina(); } catch (e) { }
            return;
        }
        this.stamina = Math.max(0, (this.stamina || 0) - STAMINA_COST);
        try { const now = performance.now ? performance.now() : Date.now(); this._staminaBlockedUntil = now + 1000; } catch (e) { }
        try { if (this.game && this.game.hud && typeof this.game.hud.updatePlayer === 'function') this.game.hud.updatePlayer(this.health, this.stamina); } catch (e) { }
        try {
            let dir = null;
            try {
                const controls = this.game && this.game.controls;
                if (controls && controls._lastRaw) {
                    const raw = controls._lastRaw;
                    if (raw && (Math.abs(raw.x) > 0.01 || Math.abs(raw.z) > 0.01)) {
                        dir = new BABYLON.Vector3(raw.x, 0, raw.z).normalize();
                    }
                }
            } catch (e) { }
            if (!dir) {
                const velocity = this.mesh.physicsImpostor.getLinearVelocity();
                if (velocity && velocity.length() > 0.05) {
                    dir = velocity.normalize();
                }
            }
            if (dir) {
                try {
                    const now = performance.now ? performance.now() : Date.now();
                    this._damageReductionUntil = now + 350;
                } catch (e) { }

                const boostForce = dir.scale(1.8);
                this.mesh.physicsImpostor.applyImpulse(boostForce, this.mesh.getAbsolutePosition());
            }
        } catch (e) { console.warn('Boost failed', e); }

        this.game.sounds.playSFX('boost');
        try { Haptics.boost(); } catch (e) { }
        if (this.game.hud) this.game.hud.showBoost();
    }

    addPoints(n) {
        try {
            const cur = parseInt(localStorage.getItem('mr_points') || '0', 10) || 0;
            const next = cur + Math.max(0, Math.floor(n || 0));
            localStorage.setItem('mr_points', String(next));
            this.points = next;
            try { const el = document.getElementById('pointsDisplay'); if (el) el.textContent = `Points: ${next}`; } catch (e) { }
            return next;
        } catch (e) { return 0; }
    }

    getPoints() {
        try { this.points = parseInt(localStorage.getItem('mr_points') || '0', 10) || 0; return this.points; } catch (e) { return 0; }
    }

    updateAppearance() {
        if (!this.mesh) return;
        try {
            Object.values(this._accMeshes).forEach(m => {
                try {
                    if (m && m._children && Array.isArray(m._children)) {
                        m._children.forEach(c => { try { if (c && typeof c.dispose === 'function') c.dispose(); } catch (e) { } });
                    }
                    try { if (m && typeof m.dispose === 'function') m.dispose(); } catch (e) { }
                } catch (e) { }
            });
        } catch (e) { }
        this._accMeshes = {};
        this._accOffsets = {};

        const material = new BABYLON.StandardMaterial('playerMatUnique', this.game.scene);
        const texturePath = `assets/textures/${this.skin}.png`;
        try {
            const tex = new BABYLON.Texture(texturePath, this.game.scene);
            tex.uScale = 2;
            tex.vScale = 2;
            try { tex.wrapU = BABYLON.Texture.WRAP_ADDRESSMODE; tex.wrapV = BABYLON.Texture.WRAP_ADDRESSMODE; } catch (e) { }
            material.diffuseTexture = tex;
            material.diffuseTexture.hasAlpha = false;
        } catch (e) {
            material.diffuseColor = new BABYLON.Color3(0, 1, 0);
        }
        material.emissiveColor = new BABYLON.Color3(0, 0.9, 0);
        material.specularColor = new BABYLON.Color3(0, 0, 0);
        material.specularPower = 16;
        this.mesh.material = material;

        this.accessories.forEach(acc => {
            try {
                if (acc === 'shields' || acc === 'shield') {
                    const sph = BABYLON.MeshBuilder.CreateSphere('shield', { diameter: 1.15, segments: 16 }, this.game.scene);
                    const sMat = new BABYLON.StandardMaterial('shieldMat', this.game.scene);
                    sMat.alpha = 0.28;
                    sMat.emissiveColor = new BABYLON.Color3(0, 1, 0);
                    sMat.backFaceCulling = true;
                    sph.material = sMat;
                    const offset = new BABYLON.Vector3(0, 0, 0);
                    sph.parent = this.mesh;
                    sph.position = offset;
                    this._accMeshes.shield = sph;
                    this._accOffsets.shield = offset;
                }
                else if (acc === 'studs') {
                    const group = new BABYLON.TransformNode('studs', this.game.scene);
                    const studsNodes = [];
                    for (let i = 0; i < 8; i++) {
                        const ang = (i / 8) * Math.PI * 2;
                        const cone = BABYLON.MeshBuilder.CreateCylinder('stud', { diameterTop: 0, diameterBottom: 0.08, height: 0.18, tessellation: 10 }, this.game.scene);
                        cone.material = new BABYLON.StandardMaterial('studMat', this.game.scene);
                        cone.material.emissiveColor = new BABYLON.Color3(0.8, 1, 0.2);
                        const localPos = new BABYLON.Vector3(Math.cos(ang) * 0.9, -0.05, Math.sin(ang) * 0.9);
                        cone.position = this.mesh.position.add(localPos);
                        try {
                            const radial = new BABYLON.Vector3(Math.cos(ang), 0, Math.sin(ang)).normalize();
                            const up = new BABYLON.Vector3(0, 1, 0);
                            let axis = BABYLON.Vector3.Cross(up, radial);
                            const dot = Math.max(-1, Math.min(1, BABYLON.Vector3.Dot(up, radial)));
                            const angle = Math.acos(dot);
                            if (axis.length() < 1e-4) axis = new BABYLON.Vector3(1, 0, 0);
                            axis.normalize();
                            const q = BABYLON.Quaternion.RotationAxis(axis, angle);
                            cone.rotationQuaternion = q;
                        } catch (e) {
                            cone.rotation.x = -Math.PI / 2;
                            cone.rotation.y = ang;
                        }
                        cone.parent = null;
                        studsNodes.push(cone);
                    }
                    group.position = this.mesh.position.clone();
                    this._accMeshes.studs = group;
                    this._accOffsets.studs = studsNodes.map(n => n.position.subtract(this.mesh.position));
                    this._accMeshes.studs._children = studsNodes;
                }
                else if (acc === 'spikes') {
                    const group = new BABYLON.TransformNode('spikes', this.game.scene);
                    const spikesNodes = [];
                    for (let i = 0; i < 6; i++) {
                        const ang = (i / 6) * Math.PI * 2;
                        const cone = BABYLON.MeshBuilder.CreateCylinder('spike', { diameterTop: 0, diameterBottom: 0.12, height: 0.34, tessellation: 10 }, this.game.scene);
                        cone.material = new BABYLON.StandardMaterial('spikeMat', this.game.scene);
                        cone.material.emissiveColor = new BABYLON.Color3(0.9, 1, 0.1);
                        const localPos = new BABYLON.Vector3(Math.cos(ang) * 0.95, -0.02, Math.sin(ang) * 0.95);
                        cone.position = this.mesh.position.add(localPos);
                        try {
                            const radial = new BABYLON.Vector3(Math.cos(ang), 0, Math.sin(ang)).normalize();
                            const up = new BABYLON.Vector3(0, 1, 0);
                            let axis = BABYLON.Vector3.Cross(up, radial);
                            const dot = Math.max(-1, Math.min(1, BABYLON.Vector3.Dot(up, radial)));
                            const angle = Math.acos(dot);
                            if (axis.length() < 1e-4) axis = new BABYLON.Vector3(1, 0, 0);
                            axis.normalize();
                            const q = BABYLON.Quaternion.RotationAxis(axis, angle);
                            cone.rotationQuaternion = q;
                        } catch (e) {
                            cone.rotation.x = -Math.PI / 2;
                            cone.rotation.y = ang;
                        }
                        cone.parent = null;
                        spikesNodes.push(cone);
                    }
                    group.position = this.mesh.position.clone();
                    this._accMeshes.spikes = group;
                    this._accOffsets.spikes = spikesNodes.map(n => n.position.subtract(this.mesh.position));
                    this._accMeshes.spikes._children = spikesNodes;
                }
                else if (acc === 'grease') {
                    if (this.mesh.material) {
                        this.mesh.material.specularColor = new BABYLON.Color3(1, 1, 1);
                        this.mesh.material.specularPower = 512;
                        try { this.mesh.material.emissiveColor = new BABYLON.Color3(0.02, 0.12, 0.02); } catch (e) { }
                    }
                    this._accMeshes.grease = { applied: true };
                }
                else if (acc === 'orbiter') {
                    const orb = BABYLON.MeshBuilder.CreateSphere('orbiter', { diameter: 0.18 }, this.game.scene);
                    const om = new BABYLON.StandardMaterial('orbMat', this.game.scene);
                    om.emissiveColor = new BABYLON.Color3(0, 1, 0);
                    om.alpha = 0.98;
                    orb.material = om;
                    orb.position = this.mesh.position.add(new BABYLON.Vector3(-0.9, 0.8, -0.6));
                    this._accMeshes.orbiter = orb;
                }
            } catch (e) { console.warn('Accessory apply failed', e); }
        });
    }

    setSkin(skin) {
        this.skin = skin;
        this.updateAppearance();
    }

    setAccessories(accessories) {
        this.accessories = accessories;
        this.updateAppearance();
    }

    _spawnGroundTrail(position, color) {
        try {
            const scene = this.game.scene;
            const size = 0.22;
            const name = `playerTrail_${Date.now()}_${Math.floor(Math.random() * 9999)}`;
            const plane = BABYLON.MeshBuilder.CreatePlane(name, { size: size }, scene);
            plane.rotation.x = Math.PI / 2;
            plane.position.copyFrom(position);
            plane.position.y += 0.01;
            const mat = new BABYLON.StandardMaterial(name + '_mat', scene);
            mat.emissiveColor = color || new BABYLON.Color3(0, 1, 1);
            mat.alpha = 0.92;
            mat.backFaceCulling = false;
            plane.material = mat;
            const life = 700;
            const start = performance.now();
            const obs = scene.onBeforeRenderObservable.add(() => {
                const t = (performance.now() - start) / life;
                if (t >= 1) {
                    try { plane.dispose(); mat.dispose(); } catch (e) { }
                    try { scene.onBeforeRenderObservable.remove(obs); } catch (e) { }
                } else {
                    mat.alpha = Math.max(0, 0.92 * (1 - t));
                    const s = 1 + t * 0.8;
                    plane.scaling.x = s; plane.scaling.z = s;
                }
            });
        } catch (e) { }
    }
}