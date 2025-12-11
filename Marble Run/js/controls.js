// controls.js - Handles input controls

export class Controls {
    constructor(game) {
        this.game = game;
        this.keys = {};
        this.joystick = { x: 0, y: 0 };
        this.isBoosting = false;
        
        this.bindEvents();
        this.setupMobileControls();
    }
    
    bindEvents() {
        window.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;
        });
        
        window.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
        });
        
        // Prevent context menu on right click
        this.game.canvas.addEventListener('contextmenu', (e) => e.preventDefault());
    }
    
    setupMobileControls() {
        const joystick = document.getElementById('joystick');
        const boostBtn = document.getElementById('boostBtn');
        
        // Joystick touch events
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
                this.joystick.y = (touch.clientY - centerY) / (rect.height / 2);
                
                // Clamp to circle
                const length = Math.sqrt(this.joystick.x ** 2 + this.joystick.y ** 2);
                if (length > 1) {
                    this.joystick.x /= length;
                    this.joystick.y /= length;
                }
            }
        });
        
        joystick.addEventListener('touchend', () => {
            this.joystick.x = 0;
            this.joystick.y = 0;
        });
        
        // Boost button
        boostBtn.addEventListener('touchstart', () => {
            this.isBoosting = true;
            this.game.player.boost();
        });
        
        boostBtn.addEventListener('touchend', () => {
            this.isBoosting = false;
        });
        
        // Show mobile controls on touch devices
        if ('ontouchstart' in window) {
            document.getElementById('mobileControls').classList.remove('hidden');
        }
    }
    
    applyToPlayer(player) {
        if (!player.mesh) return;
        
        let forceX = 0;
        let forceZ = 0;
        
        // Keyboard controls
        if (this.keys['ArrowLeft'] || this.keys['KeyA']) forceX -= 1;
        if (this.keys['ArrowRight'] || this.keys['KeyD']) forceX += 1;
        if (this.keys['ArrowUp'] || this.keys['KeyW']) forceZ += 1;
        if (this.keys['ArrowDown'] || this.keys['KeyS']) forceZ -= 1;
        
        // Mobile joystick
        forceX += this.joystick.x;
        forceZ += this.joystick.y;
        
        // Apply force
        const force = new BABYLON.Vector3(forceX, 0, forceZ).normalize().scale(2);
        player.mesh.physicsImpostor.applyForce(force, player.mesh.getAbsolutePosition());
    }
}