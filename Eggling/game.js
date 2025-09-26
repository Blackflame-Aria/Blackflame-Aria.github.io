const verbs = [
    "Ask", "Ban", "Bash", "Bite", "Break", "Build",
    "Cut", "Dig", "Drag", "Drop", "Drink", "Enjoy",
    "Eat", "End", "Feed", "Fill", "Force", "Grasp",
    "Gas", "Get", "Grab", "Grip", "Hoist", "House",
    "Ice", "Ink", "Join", "Kick", "Leave", "Marry",
    "Mix", "Nab", "Nail", "Open", "Press", "Quash",
    "Rub", "Run", "Save", "Snap", "Taste", "Touch",
    "Use", "Vet", "View", "Wash", "Xerox", "Yield"
];

const nouns = [
    "arms", "bugs", "boots", "bowls", "cabins", "cigars",
    "dogs", "eggs", "fakes", "flags", "greens", "guests",
    "hens", "hogs", "items", "jowls", "jewels", "juices",
    "kits", "logs", "lamps", "lions", "levers", "lemons",
    "maps", "mugs", "names", "nests", "nights", "nurses",
    "orbs", "owls", "pages", "posts", "quests", "quotas",
    "rats", "ribs", "roots", "rules", "salads", "sauces",
    "toys", "urns", "vines", "words", "waters", "zebras"
];

const boredomIcons = ["💤", "💭", "❓"];
const foodIcons = ["🍼", "🍔", "🍟", "🍰", "🍜"];
const poopIcons = ["💩"];
const sickIcons1 = ["😄", "😃", "😀", "😊", "😎", "👍"];
const sickIcons2 = ["😪", "😥", "😰", "😓"];
const sickIcons3 = ["😩", "😫"];
const sickIcons4 = ["😡", "🤒"];
const sickIcons5 = ["❌", "💀", "👽", "😇"];

class Eggling {
    constructor(name) {
        this.name = name;
        this.age = 0;
        this.boredom = 2;
        this.foodLevel = 2;
        this.poopLevel = 1;
    }

    randomInRange(limit) {
        return Math.floor(Math.random() * limit);
    }

    feed() {
        if (this.isAlive()) {
            const maxFood = 5;
            const hungerPercent = Math.max(0, Math.min(100, (1 - this.foodLevel / maxFood) * 100));
            
            if (hungerPercent <= 0) {
                this.appendToLog(`🍔 ${this.name} is full!`);
            } else {
                this.foodLevel = Math.min(5, this.foodLevel + 1);
                this.appendToLog(`🍔 Feeding ${this.name}... Hunger decreased!`);
            }
            this.updateMeters();
            this.saveToLocalStorage();
        }
    }

    play() {
        if (this.isAlive()) {
            if (this.boredom <= 0) {
                this.appendToLog(`🎮 ${this.name} is annoyed!`);
            } else {
                this.boredom = Math.max(0, this.boredom - this.randomInRange(2));
                this.appendToLog(`🎮 Playing with ${this.name}... Boredom decreased!`);
            }
            this.updateMeters();
            this.saveToLocalStorage();
        }
    }

    talk() {
        if (this.isAlive()) {
            if (this.boredom <= 0) {
                this.appendToLog(`😶 ${this.name} has nothing to say!`);
            } else {
                const verb = verbs[this.randomInRange(verbs.length)];
                const noun = nouns[this.randomInRange(nouns.length)];
                const message = `🗣️ : ${verb} the ${noun}`;
                this.appendToLog(message);
                this.boredom = Math.max(0, this.boredom - 1);
                this.appendToLog(`Talking to ${this.name}... Boredom slightly decreased!`);
            }
            this.updateMeters();
            this.saveToLocalStorage();
        }
    }

    clean() {
        if (this.isAlive()) {
            const maxPoop = 10;
            const cleanPercent = Math.max(0, Math.min(100, 100 - (this.poopLevel / maxPoop) * 100));
            
            if (cleanPercent >= 100) {
                this.appendToLog(`🧹 ${this.name} is sparkling, blinding!`);
            } else {
                this.poopLevel = Math.max(0, this.poopLevel - 1);
                this.appendToLog(`🧹 Cleaning up after ${this.name}... Cleanliness improved!`);
            }
            this.updateMeters();
            this.saveToLocalStorage();
        }
    }

    wait() {
        if (this.isAlive()) {
            this.age++;
            this.boredom += this.randomInRange(3);
            this.foodLevel = Math.max(0, this.foodLevel - 2);
            this.poopLevel += this.randomInRange(2);
            this.appendToLog(`⏱️ Time passes... ${this.name} is now ${this.age} days old. Getting hungry, bored and nasty.`);
            this.checkStatus();
            this.updateMeters();
            this.saveToLocalStorage();
        }
    }

    isAlive() {
        return this.sickness() <= 10;
    }

    sickness() {
        return this.poopLevel + this.boredom + Math.max(0, this.age - 32) + Math.abs(this.foodLevel - 2);
    }

    status() {
        if (this.isAlive()) {
            return "";
        }
        return " R.I.P";
    }

    health() {
        const sicknessLevel = this.sickness();
        let icon = '';
        if (sicknessLevel <= 2) {
            icon = sickIcons1[this.randomInRange(sickIcons1.length)];
        } else if (sicknessLevel <= 4) {
            icon = sickIcons2[this.randomInRange(sickIcons2.length)];
        } else if (sicknessLevel <= 6) {
            icon = sickIcons3[this.randomInRange(sickIcons3.length)];
        } else if (sicknessLevel <= 10) {
            icon = sickIcons4[this.randomInRange(sickIcons4.length)];
        } else {
            icon = sickIcons5[this.randomInRange(sickIcons5.length)];
        }
        const statusText = `${this.name} (Age: ${this.age}) - Feeling: ${icon}`;
        document.getElementById('status').innerText = statusText;
        
        this.updateMeters();
    }
    
    updateMeters() {
        const maxFood = 5;
        const hungerPercent = Math.max(0, Math.min(100, (1 - this.foodLevel / maxFood) * 100));
        document.getElementById('hunger-bar').style.width = `${hungerPercent}%`;
        document.getElementById('hunger-value').innerText = `${Math.round(hungerPercent)}%`;
        
        const maxBoredom = 10;
        const boredomPercent = Math.max(0, Math.min(100, (this.boredom / maxBoredom) * 100));
        document.getElementById('boredom-bar').style.width = `${boredomPercent}%`;
        document.getElementById('boredom-value').innerText = `${Math.round(boredomPercent)}%`;
        
        const maxPoop = 10;
        const cleanPercent = Math.max(0, Math.min(100, 100 - (this.poopLevel / maxPoop) * 100));
        document.getElementById('clean-bar').style.width = `${cleanPercent}%`;
        document.getElementById('clean-value').innerText = `${Math.round(cleanPercent)}%`;
        
        document.getElementById('hunger-bar').className = hungerPercent >= 70 ? 'bar danger' : hungerPercent >= 21 ? 'bar warning' : 'bar good';
        document.getElementById('boredom-bar').className = boredomPercent >= 70 ? 'bar danger' : boredomPercent >= 21 ? 'bar warning' : 'bar good';
        document.getElementById('clean-bar').className = cleanPercent <= 20 ? 'bar danger' : cleanPercent <= 69 ? 'bar warning' : 'bar good';
    }

    instructions() {
        const instr = `
        <h3>How to care for ${this.name}</h3>
            <strong>Feed</strong> - Reduce hunger <br>
            <strong>Play</strong> - Reduce boredom <br>
            <strong>Talk</strong> - Reduce boredom <br>
            <strong>Clean</strong> - Improve cleanliness <br>
            <strong>Wait</strong> - Let time pass <br>
            <strong style="color: #f00; text-shadow: 0 0 5px #f00, 0 0 10px #f00;">Murder</strong> - Murder your eggling <br>
        `;
        document.getElementById('instructions').innerHTML = instr;
    }

    appendToLog(message) {
        const log = document.getElementById('log');
        log.innerText += message + '\n';
        log.scrollTop = log.scrollHeight;
    }
    
    checkStatus() {
        this.health();
        if (!this.isAlive()) {
            const actionButtons = document.querySelectorAll('.action-btn');
            actionButtons.forEach(btn => btn.disabled = true);
            
            document.getElementById('game-over').style.display = 'block';
            this.appendToLog(`💔 ${this.name} has passed away... R.I.P.`);
            
            localStorage.removeItem('egglingData');
        }
    }
    
    saveToLocalStorage() {
        const egglingData = {
            name: this.name,
            age: this.age,
            boredom: this.boredom,
            foodLevel: this.foodLevel,
            poopLevel: this.poopLevel
        };
        
        localStorage.setItem('egglingData', JSON.stringify(egglingData));
    }
    
    static loadFromLocalStorage() {
        const savedData = localStorage.getItem('egglingData');
        if (!savedData) return null;
        
        try {
            const data = JSON.parse(savedData);
            const eggling = new Eggling(data.name);
            eggling.age = data.age;
            eggling.boredom = data.boredom;
            eggling.foodLevel = data.foodLevel;
            eggling.poopLevel = data.poopLevel;
            
            return eggling;
        } catch (e) {
            console.error('Error loading eggling data:', e);
            localStorage.removeItem('egglingData');
            return null;
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    let eggling;
    
    function initGame() {
        document.getElementById('start').addEventListener('click', () => {
            const name = document.getElementById('name').value.trim();
            if (!name) return;
            
            eggling = new Eggling(name);
            eggling.health();
            eggling.instructions();
            eggling.appendToLog(`🥚 ${name} has hatched! Take care of your eggling.`);
            eggling.saveToLocalStorage();
            
            document.getElementById('start-container').style.display = 'none';
            document.getElementById('game-content').style.display = 'block';
            
            document.getElementById('game-over').style.display = 'none';
            
            const actionButtons = document.querySelectorAll('.action-btn');
            actionButtons.forEach(btn => btn.disabled = false);
        });
        
        document.getElementById('feed-btn').addEventListener('click', () => {
            if (!eggling || !eggling.isAlive()) return;
            eggling.feed();
            eggling.checkStatus();
        });
        
        document.getElementById('play-btn').addEventListener('click', () => {
            if (!eggling || !eggling.isAlive()) return;
            eggling.play();
            eggling.checkStatus();
        });
        
        document.getElementById('talk-btn').addEventListener('click', () => {
            if (!eggling || !eggling.isAlive()) return;
            eggling.talk();
            eggling.checkStatus();
        });
        
        document.getElementById('clean-btn').addEventListener('click', () => {
            if (!eggling || !eggling.isAlive()) return;
            eggling.clean();
            eggling.checkStatus();
        });
        
        document.getElementById('wait-btn').addEventListener('click', () => {
            if (!eggling || !eggling.isAlive()) return;
            eggling.wait();
            eggling.checkStatus();
        });
        
        document.getElementById('murder-btn').addEventListener('click', () => {
            document.documentElement.style.setProperty('--matrix-green', '#f00');
            document.documentElement.style.setProperty('--matrix-glow', '0 0 10px #f00, 0 0 20px #f00');
            
            const actionButtons = document.querySelectorAll('.action-btn');
            actionButtons.forEach(btn => btn.disabled = true);
            
            const log = document.getElementById('log');
            log.innerText += 'EGGLING MURDERED\n';
            log.scrollTop = log.scrollHeight;
            
            setTimeout(() => {
                document.documentElement.style.setProperty('--matrix-green', '#0f0');
                document.documentElement.style.setProperty('--matrix-glow', '0 0 10px #0f0, 0 0 20px #0f0');
                document.getElementById('log').innerText = '';
                document.getElementById('start-container').style.display = 'block';
                document.getElementById('game-content').style.display = 'none';
                document.getElementById('name').value = '';
                localStorage.removeItem('egglingData');
            }, 3000);
        });
        
        document.getElementById('restart').addEventListener('click', () => {
            document.getElementById('log').innerText = '';
            
            document.getElementById('start-container').style.display = 'block';
            document.getElementById('game-content').style.display = 'none';
            
            document.getElementById('name').value = '';
            
            localStorage.removeItem('egglingData');
        });
    }
    
    function loadSavedEggling() {
        const savedEggling = Eggling.loadFromLocalStorage();
        if (savedEggling) {
            eggling = savedEggling;
            eggling.appendToLog(`Welcome back to ${eggling.name}! Your eggling was waiting for you.`);
            eggling.health();
            eggling.instructions();
            
            document.getElementById('start-container').style.display = 'none';
            document.getElementById('game-content').style.display = 'block';
            
            const actionButtons = document.querySelectorAll('.action-btn');
            actionButtons.forEach(btn => btn.disabled = false);
        }
    }
    
    initGame();
    loadSavedEggling();
});