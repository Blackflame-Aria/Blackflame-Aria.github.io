// main.js - Main entry point for the game

import { Menu } from './menu.js';
import { Player } from './player.js';
import { Enemy } from './enemy.js';
import { Controls } from './controls.js';
import { Sounds } from './sounds.js';

class Game {
    constructor() {
        this.canvas = document.getElementById('renderCanvas');
        this.engine = new BABYLON.Engine(this.canvas, true);
        this.scene = new BABYLON.Scene(this.engine);
        
        // Enable physics
        this.scene.enablePhysics(new BABYLON.Vector3(0, -9.81, 0), new BABYLON.CannonJSPlugin());
        
        // Core subsystems. Sounds created early so UI can control audio immediately.
        this.sounds = new Sounds(this);
        this.cameraFollow = true; // default: camera follows player

        this.menu = new Menu(this);
        this.player = new Player(this);
        this.enemies = [];
        this.controls = new Controls(this);
        
        this.isPlaying = false;
        
        this.initScene();
        this.bindEvents();
        this.engine.runRenderLoop(() => {
            this.scene.render();
            if (this.isPlaying) {
                this.update();
            }
        });
    }
    
    initScene() {
        // Camera
        this.camera = new BABYLON.UniversalCamera('camera', new BABYLON.Vector3(0, 5, -10), this.scene);
        this.camera.setTarget(BABYLON.Vector3.Zero());
        // Camera attachment is managed by cameraFollow setting
        this._applyCameraMode();
        
        // Light
        const light = new BABYLON.HemisphericLight('light', new BABYLON.Vector3(0, 1, 0), this.scene);
        
        // Ground
        const ground = BABYLON.MeshBuilder.CreateGround('ground', { width: 20, height: 20 }, this.scene);
        ground.physicsImpostor = new BABYLON.PhysicsImpostor(ground, BABYLON.PhysicsImpostor.BoxImpostor, { mass: 0, restitution: 0.9 }, this.scene);
    }
    
    bindEvents() {
        window.addEventListener('resize', () => {
            this.engine.resize();
        });
    }

    // Toggle camera-follow behavior
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
        this.isPlaying = true;
        this.menu.hide();
        this.player.spawn();
        // Spawn initial enemies
        this.spawnEnemy();
    }
    
    update() {
        this.player.update();
        this.enemies.forEach(enemy => enemy.update());
        // Collision detection, etc.
        // Camera follow behavior
        if (this.cameraFollow && this.player && this.player.mesh) {
            const targetPos = this.player.mesh.position;
            const desired = new BABYLON.Vector3(
                targetPos.x,
                targetPos.y + 5,
                targetPos.z - 10
            );
            // Smooth the camera movement
            this.camera.position = BABYLON.Vector3.Lerp(this.camera.position, desired, 0.08);
            this.camera.setTarget(targetPos);
        }
    }
    
    spawnEnemy() {
        const enemy = new Enemy(this);
        this.enemies.push(enemy);
    }
    
    gameOver() {
        this.isPlaying = false;
        this.menu.show();
    }
}

// Initialize game when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new Game();
});