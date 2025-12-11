// enemy.js - Handles enemy mechanics

export class Enemy {
    constructor(game) {
        this.game = game;
        this.mesh = null;
        this.health = 50;
        this.speed = 0;
        
        this.spawn();
    }
    
    spawn() {
        this.mesh = BABYLON.MeshBuilder.CreateSphere('enemy', { diameter: 0.8 }, this.game.scene);
        this.mesh.position.set(
            (Math.random() - 0.5) * 10,
            5,
            (Math.random() - 0.5) * 10
        );
        
        // Physics
        this.mesh.physicsImpostor = new BABYLON.PhysicsImpostor(this.mesh, BABYLON.PhysicsImpostor.SphereImpostor, { 
            mass: 0.5, 
            restitution: 0.6,
            friction: 0.2
        }, this.game.scene);
        
        // Material
        const material = new BABYLON.StandardMaterial('enemyMat', this.game.scene);
        material.diffuseColor = new BABYLON.Color3(1, 0, 0);
        this.mesh.material = material;
    }
    
    update() {
        if (!this.mesh) return;
        
        this.speed = this.mesh.physicsImpostor.getLinearVelocity().length();
        
        // Simple AI - move towards player
        const playerPos = this.game.player.mesh.position;
        const direction = playerPos.subtract(this.mesh.position).normalize();
        const force = direction.scale(0.1);
        this.mesh.physicsImpostor.applyForce(force, this.mesh.getAbsolutePosition());
        
        // Check collision with player
        const distance = BABYLON.Vector3.Distance(this.mesh.position, playerPos);
        if (distance < 1.2) {
            this.collideWithPlayer();
        }
    }
    
    collideWithPlayer() {
        const playerSpeed = this.game.player.speed;
        const isBoost = this.game.controls.isBoosting;
        
        // Enemy takes damage
        let damageToEnemy = playerSpeed;
        if (isBoost) damageToEnemy *= 2;
        this.takeDamage(damageToEnemy);
        
        // Player takes damage
        let damageToPlayer = 10;
        if (playerSpeed < 1) damageToPlayer *= 2; // More damage if player is slow
        this.game.player.takeDamage(damageToPlayer);
    }
    
    takeDamage(amount) {
        this.health -= amount;
        
        if (this.health <= 0) {
            this.destroy();
        }
        
        // Visual feedback
        this.mesh.scaling.scaleInPlace(0.9);
        setTimeout(() => {
            if (this.mesh) this.mesh.scaling.scaleInPlace(1 / 0.9);
        }, 100);
    }
    
    destroy() {
        if (this.mesh) {
            this.mesh.dispose();
            this.mesh = null;
        }
        
        // Remove from game
        const index = this.game.enemies.indexOf(this);
        if (index > -1) {
            this.game.enemies.splice(index, 1);
        }
        
        this.game.sounds.playSFX('enemy_destroy');
    }
}