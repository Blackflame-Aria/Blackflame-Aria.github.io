// player.js - Handles player ball mechanics

export class Player {
    constructor(game) {
        this.game = game;
        this.mesh = null;
        this.speed = 0;
        this.health = 100;
        this.skin = 'default';
        this.accessories = [];
    }
    
    spawn() {
        this.mesh = BABYLON.MeshBuilder.CreateSphere('player', { diameter: 1 }, this.game.scene);
        this.mesh.position.y = 5;
        
        // Physics
        this.mesh.physicsImpostor = new BABYLON.PhysicsImpostor(this.mesh, BABYLON.PhysicsImpostor.SphereImpostor, { 
            mass: 1, 
            restitution: 1.8,
            friction: 10.1
        }, this.game.scene);
        
        // Material
        this.updateAppearance();
    }
    
    update() {
        if (!this.mesh) return;
        
        // Update speed based on velocity
        this.speed = this.mesh.physicsImpostor.getLinearVelocity().length();
        
        // Apply controls
        this.game.controls.applyToPlayer(this);
        
        // Check boundaries
        if (this.mesh.position.y < -10) {
            this.game.gameOver();
        }
    }
    
    takeDamage(amount) {
        // Damage calculation based on speed
        const damageMultiplier = Math.max(0.5, 2 - this.speed / 10); // Faster = less damage taken
        this.health -= amount * damageMultiplier;
        
        if (this.health <= 0) {
            this.game.gameOver();
        }
        
        // Camera shake effect
        this.game.sounds.playSFX('damage');
    }
    
    dealDamage(enemy, isBoost) {
        // Damage calculation based on speed
        let damage = this.speed;
        if (isBoost) damage *= 2;
        
        enemy.takeDamage(damage);
        this.game.sounds.playSFX('hit');
    }
    
    boost() {
        if (!this.mesh) return;
        
        const velocity = this.mesh.physicsImpostor.getLinearVelocity();
        const boostForce = velocity.normalize().scale(5);
        this.mesh.physicsImpostor.applyImpulse(boostForce, this.mesh.getAbsolutePosition());
        
        this.game.sounds.playSFX('boost');
    }
    
    updateAppearance() {
        if (!this.mesh) return;
        
        const material = new BABYLON.StandardMaterial('playerMat', this.game.scene);
        
        // Load texture based on skin
        const texturePath = `assets/textures/${this.skin}.png`;
        material.diffuseTexture = new BABYLON.Texture(texturePath, this.game.scene);
        
        this.mesh.material = material;
        
        // Apply accessories (simplified - you can layer meshes)
        this.accessories.forEach(acc => {
            // Add accessory meshes or modify material
            console.log('Applying accessory:', acc);
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
}