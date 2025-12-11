// menu.js - Handles main menu and submenus

export class Menu {
    constructor(game) {
        this.game = game;
        this.menu = document.getElementById('menu');
        this.settingsMenu = document.getElementById('settingsMenu');
        this.customizationMenu = document.getElementById('customizationMenu');
        
        this.bindEvents();
    }
    
    bindEvents() {
        document.getElementById('playBtn').addEventListener('click', () => this.game.startGame());
        document.getElementById('settingsBtn').addEventListener('click', () => this.showSettings());
        document.getElementById('customizationBtn').addEventListener('click', () => this.showCustomization());
        document.getElementById('backBtn').addEventListener('click', () => window.location.href = '../index.html');
        
        document.querySelectorAll('.backToMenu').forEach(btn => {
            btn.addEventListener('click', () => this.showMain());
        });
        
        // Settings controls
        document.getElementById('musicVolume').addEventListener('input', (e) => this.game.sounds.setMusicVolume(e.target.value));
        document.getElementById('sfxVolume').addEventListener('input', (e) => this.game.sounds.setSFXVolume(e.target.value));
        document.getElementById('cameraShake').addEventListener('input', (e) => this.setCameraShake(e.target.value));
        document.getElementById('joyconPos').addEventListener('change', (e) => this.setJoyconPosition(e.target.value));
        const camFollowEl = document.getElementById('cameraFollow');
        if (camFollowEl) {
            // initialize checkbox from game state
            camFollowEl.checked = !!this.game.cameraFollow;
            camFollowEl.addEventListener('change', (e) => {
                this.game.setCameraFollow(e.target.checked);
            });
        }
        
        // Customization
        this.populateCustomization();
    }
    
    show() {
        this.menu.style.display = 'block';
    }
    
    hide() {
        this.menu.style.display = 'none';
        this.settingsMenu.classList.add('hidden');
        this.customizationMenu.classList.add('hidden');
    }
    
    showSettings() {
        this.menu.style.display = 'none';
        this.settingsMenu.classList.remove('hidden');
    }
    
    showCustomization() {
        this.menu.style.display = 'none';
        this.customizationMenu.classList.remove('hidden');
    }
    
    showMain() {
        this.settingsMenu.classList.add('hidden');
        this.customizationMenu.classList.add('hidden');
        this.menu.style.display = 'block';
    }
    
    setCameraShake(intensity) {
        // Implement camera shake logic
        console.log('Camera shake set to:', intensity);
    }
    
    setJoyconPosition(position) {
        // Implement joycon position logic
        console.log('Joycon position set to:', position);
    }
    
    populateCustomization() {
        const skinSelect = document.getElementById('skinSelect');
        const accessorySelect = document.getElementById('accessorySelect');
        
        // Populate with available skins (you'll add texture files here)
        const skins = ['default', 'red', 'blue', 'green'];
        skins.forEach(skin => {
            const option = document.createElement('option');
            option.value = skin;
            option.textContent = skin.charAt(0).toUpperCase() + skin.slice(1);
            skinSelect.appendChild(option);
        });
        
        // Populate accessories
        const accessories = ['spikes', 'shield', 'speed_boost'];
        accessories.forEach(acc => {
            const option = document.createElement('option');
            option.value = acc;
            option.textContent = acc.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
            accessorySelect.appendChild(option);
        });
    }
}