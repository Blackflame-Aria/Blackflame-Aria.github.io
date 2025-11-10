const verbs = [
    "Ask", "Ban", "Bash", "Bite", "Break", "Build",
    "Cut", "Dig", "Drag", "Drop", "Drink", "Enjoy",
    "Eat", "End", "Feed", "Fill", "Force", "Grasp",
    "Gas", "Get", "Grab", "Grip", "Hoist", "House",
    "Ice", "Ink", "Join", "Kick", "Leave", "Marry",
    "Mix", "Nab", "Nail", "Open", "Press", "Quash",
    "Rub", "Run", "Save", "Snap", "Taste", "Touch",
    "Use", "Boil", "Moisten", "Wash", "Raze", "Yield"
];

const nouns = [
    "arms", "bugs", "boots", "bowls", "cabins", "fascists",
    "dogs", "eggs", "fakes", "flags", "greens", "guests",
    "hens", "hogs", "items", "jowls", "jewels", "juices",
    "kits", "pogs", "lamps", "lions", "levers", "lemons",
    "maps", "mugs", "names", "nests", "nights", "nurses",
    "orbs", "owls", "pages", "posts", "quests", "quotas",
    "rats", "ribs", "roots", "rules", "salads", "sauces",
    "toys", "urns", "vines", "words", "waters", "zebras"
];

const awards = [
    "RECEIVED A SCHOLORSHIP TO OXFORD", "JOINED THE FIRE DEPARTMENT", "CAN'T AFFORD TO MOVE OUT", "MOVED TO LUXEMBOURG", "BECAME A POLITICIAN",
    "WON A NOBEL PEACE PRIZE", "MOVED INTO THE SEWERS", "HAS TO RETAKE HIGH SCHOOL",
    "LEARNED TO FLY", "BECAME A FASHION MODEL",
    "MOVED OUT AND STARTED A CULT", "JOINED A REVOLUTION", "FOUNDED A BIRD SANCTUARY",
    "MOVED OUT AND SPIRALED INTO DEPRESSION", "GOT DIAGNOSED FOR AUTISM",
    "FELL INTO TOXIC WASTE", "DROPPED OUT OF COMMUNITY COLLEGE", "BECAME A SUCCESSFUL ARTIST"
];

const deaths = [
    "got abducted by aliens", "got crushed by a falling piano", "died of dysentery", "died trying to drive 2 cars at once", "fell down the old well", "died doing what they love", "got snatched by a hawk",
    "ran away from home", "joined a gang", "turned to drugs (oregano)", "joined the circus", "got mistaken for food", "tempted the fates", "met an untimely end", "gave their life for Sweden"
];

const egglingSprites = {
    egg: "<img src='Sprites/Egg.gif' class='sprite-img'>",
    baby: "<img src='Sprites/Baby.gif' class='sprite-img'>",
    child: "<img src='Sprites/Child.gif' class='sprite-img'>",
    teen: "<img src='Sprites/Teen.gif' class='sprite-img'>",
    adult: "<img src='Sprites/Adult.gif' class='sprite-img'>",
    sick: "<img src='Sprites/Sick.gif' class='sprite-img'>",
    sick2: "<img src='Sprites/Sick2.gif' class='sprite-img'>",
    dead: "<img src='Sprites/Dead.gif' class='sprite-img'>",
    dead2: "<img src='Sprites/Dead2.gif' class='sprite-img'>",
    graduate: "<img src='Sprites/Graduate.gif' class='sprite-img'>",
    secret: "<img src='Sprites/Secret.gif' class='sprite-img'>",
    egg2: "<img src='Sprites/Egg2.gif' class='sprite-img'>",
    baby2: "<img src='Sprites/Baby2.gif' class='sprite-img'>",
    child2: "<img src='Sprites/Child2.gif' class='sprite-img'>",
    secret2: "<img src='Sprites/Secret2.gif' class='sprite-img'>",
    wip: "<img src='Sprites/WIP.gif' class='sprite-img'>"
};

const boredomIcons = ["💤", "💭", "❓"];
const foodIcons = ["🍼", "🍔", "🍟", "🍰", "🍜"];
const playIcons = ["🎮", "🪀", "🏸", "🧸", "🪁"];
const poopIcons = ["💩"];
const sickIcons1 = ["😄", "😃", "😀", "😊", "😎", "👍"];
const sickIcons2 = ["😪", "😥", "😓"];
const sickIcons3 = ["😩", "😰", "😫", "😠"];
const sickIcons4 = ["😡", "🤒", "🤬"];
const sickIcons5 = ["❌", "💀"];

class Eggling {
    constructor(name) {
        this.name = name;
        this.age = 0;
        this.spriteState = "egg";
        this.boredom = 2;
        this.foodLevel = 2;
        this.poopLevel = 1;
        this.socialLevel = 9.5;
    }

    randomInRange(limit) {
        return Math.floor(Math.random() * limit);
    }

    feed() {
        if (this.isAlive()) {
            const maxFood = 5;
            const hungerPercent = Math.max(0, Math.min(100, (1 - this.foodLevel / maxFood) * 100));
            const foodEmoji = foodIcons[this.randomInRange(foodIcons.length)];
            
            if (hungerPercent <= 0) {
                this.appendToLog(`${foodEmoji} ${this.name} is full!`);
            } else {
                this.foodLevel = Math.min(5, this.foodLevel + .8);
                this.appendToLog(`${foodEmoji} Feeding ${this.name}...`);
            }
            this.updateMeters();
            this.saveToLocalStorage();;
        }
    }

    play() {
        if (this.isAlive()) {
            const playEmoji = playIcons[this.randomInRange(playIcons.length)];
            
            if (this.boredom <= 0) {
                this.appendToLog(`${playEmoji} ${this.name} is annoyed!`);
            } else {
                const maxBoredom = 10;
                const boredomPercent = Math.max(0, Math.min(100, (this.boredom / maxBoredom) * 100));
                const newBoredomPercent = Math.max(0, boredomPercent - 10.5);
                this.boredom = Math.max(0, maxBoredom * (newBoredomPercent / 100));
                
                this.appendToLog(`${playEmoji} Playing with ${this.name}...`);
            }
            this.updateMeters();
            this.saveToLocalStorage();
        }
    }

    talk() {
        if (this.isAlive()) {
            const maxSocial = 10;
            const socialPercent = Math.max(0, Math.min(100, (this.socialLevel / maxSocial) * 100));
            
            if (socialPercent >= 100) {
                this.appendToLog(`🗣️ ${this.name} has nothing to say!`);
            } else {
                const verb = verbs[this.randomInRange(verbs.length)];
                const noun = nouns[this.randomInRange(nouns.length)];
                const message = `🗣️ ${this.name} says: ${verb} the ${noun}`;
                this.appendToLog(message);
                
                const newSocialPercent = Math.min(100, socialPercent + 15.5);
                this.socialLevel = Math.min(maxSocial, maxSocial * (newSocialPercent / 100));
                
                const maxBoredom = 10;
                const boredomPercent = Math.max(0, Math.min(100, (this.boredom / maxBoredom) * 100));
                const newBoredomPercent = Math.max(0, boredomPercent - 4.5);
                this.boredom = Math.max(0, maxBoredom * (newBoredomPercent / 100));
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
                this.poopLevel = Math.max(0, this.poopLevel - 1.5);
                this.appendToLog(`🧹 Cleaning up after ${this.name}...`);
            }
            this.updateMeters();
            this.saveToLocalStorage();
        }
    }

    wait() {
        if (this.isAlive()) {
            this.age++;
            this.boredom += this.randomInRange(3);
            this.foodLevel = Math.max(0, this.foodLevel - 1.425);
            this.poopLevel += this.randomInRange(2);
            
            const maxSocial = 10;
            const socialPercent = Math.max(0, Math.min(100, (this.socialLevel / maxSocial) * 100));
            const newSocialPercent = Math.max(0, Math.min(100, socialPercent - 20));
            this.socialLevel = Math.max(0, maxSocial * (newSocialPercent / 100));
            
            this.appendToLog(`⏱️ Time passes... ${this.name} is now ${this.age} days old.`);
            this.checkStatus();
            this.updateMeters();
            this.saveToLocalStorage();
        }
    }
    
    tick() {
        this.age += 1;
        
        this.foodLevel = Math.max(0, this.foodLevel - 1);
        
        this.poopLevel = Math.min(10, this.poopLevel + 0.75);
        
        this.socialLevel = Math.max(0, this.socialLevel - 1.15);
        
        const maxSocial = 10;
        const newSocialPercent = Math.max(0, Math.min(100, (this.socialLevel / maxSocial) * 100));
        if (newSocialPercent <= 0) {
            this.appendToLog(`${this.name} is feeling lonely!`);
        }
        
        this.boredom = Math.min(10, this.boredom + 1.3);
        
        if (this.age >= 15 && this.age <= 20 && Math.random() < 0.2) {
            this.randomDeath();
        } else {
            this.checkStatus();
        }
        
        this.updateMeters();
        this.saveToLocalStorage();
    }

    isAlive() {
        let redMeters = 0;
        
        const maxFood = 5;
        const hungerPercent = Math.max(0, Math.min(100, (1 - this.foodLevel / maxFood) * 100));
        if (hungerPercent >= 70) redMeters++;
        
        const maxBoredom = 10;
        const boredomPercent = Math.max(0, Math.min(100, (this.boredom / maxBoredom) * 100));
        if (boredomPercent >= 70) redMeters++;
        
        const maxPoop = 10;
        const cleanlinessPercent = Math.max(0, Math.min(100, (1 - this.poopLevel / maxPoop) * 100));
        if (cleanlinessPercent <= 20) redMeters++;
        
        return redMeters < 2;
    }

    sickness() {
        const maxFood = 5;
        const maxBoredom = 10;
        const maxPoop = 10;
        const maxSocial = 10;

        const hungerPercent = Math.max(0, Math.min(100, (1 - this.foodLevel / maxFood) * 100));
        const boredomPercent = Math.max(0, Math.min(100, (this.boredom / maxBoredom) * 100));
        const cleanPercent = Math.max(0, Math.min(100, 100 - (this.poopLevel / maxPoop) * 100));
        const socialPercent = Math.max(0, Math.min(100, (this.socialLevel / maxSocial) * 100));

        let redMeters = 0;
        let yellowMeters = 0;

        if (hungerPercent >= 70) redMeters++;
        else if (hungerPercent >= 21) yellowMeters++;

        if (boredomPercent >= 70) redMeters++;
        else if (boredomPercent >= 21) yellowMeters++;

        if (cleanPercent <= 20) redMeters++;
        else if (cleanPercent <= 69) yellowMeters++;

        if (socialPercent <= 20) redMeters++;
        else if (socialPercent <= 69) yellowMeters++;

        return (redMeters >= 1 || yellowMeters >= 3) ? 16 : 0;
    }
    
    randomDeath() {
        const randomDeathMessage = deaths[this.randomInRange(deaths.length)];
        
        document.documentElement.style.setProperty('--matrix-green', '#f00');
        document.documentElement.style.setProperty('--matrix-glow', '0 0 10px #f00, 0 0 20px #f00');
        
        const actionButtons = document.querySelectorAll('.action-btn');
        actionButtons.forEach(btn => btn.disabled = true);
        
        document.getElementById('game-over').style.display = 'block';
        this.appendToLog(`${this.name} ${randomDeathMessage}.`);
        
        localStorage.removeItem('egglingData');
    }

    status() {
        if (this.isAlive()) {
            return "";
        }
        return " R.I.P.";
    }

    health() {
        if (this.age >= 20 && this.age < 40 && !this.graduated) {
            this.graduate();
            return;
        }
        
        this.updateMeters();
        this.updateSprite();
        
        const hungerBar = document.getElementById('hunger-bar');
        const boredomBar = document.getElementById('boredom-bar');
        const cleanBar = document.getElementById('clean-bar');
        const socialBar = document.getElementById('social-bar');
        
        const redMeters = [hungerBar, boredomBar, cleanBar, socialBar].filter(bar => bar.className.includes('danger')).length;
        const yellowMeters = [hungerBar, boredomBar, cleanBar, socialBar].filter(bar => bar.className.includes('warning')).length;
        const greenMeters = [hungerBar, boredomBar, cleanBar, socialBar].filter(bar => bar.className.includes('good')).length;
        
        let icon;
        
        if (!this.isAlive()) {
            icon = sickIcons5[this.randomInRange(sickIcons5.length)];
        } else if (redMeters >= 3) {
            icon = sickIcons4[this.randomInRange(sickIcons4.length)];
        } else if (redMeters >= 1 || yellowMeters >= 3) {
            icon = sickIcons3[this.randomInRange(sickIcons3.length)];
        } else if (yellowMeters >= 1) {
            icon = sickIcons2[this.randomInRange(sickIcons2.length)];
        } else {
            icon = sickIcons1[this.randomInRange(sickIcons1.length)];
        }
        
        document.getElementById('status').innerText = `${this.name} | Age: ${this.age} | Feeling: ${icon}${this.status()}`;
    }
    
    updateSprite() {
        const spriteElement = document.getElementById('eggling-sprite');
        
        if (!this.isAlive()) {
            this.spriteState = this.age >= 40 ? "dead2" : "dead";
        } else if (this.graduated && this.age < 40) {
            this.spriteState = "graduate";
        } else if (this.sickness() > 15) {
            this.spriteState = this.age >= 40 ? "sick2" : "sick";
        } else if (this.age >= 80) {
            this.spriteState = "wip";
        } else if (this.age >= 70) {
            this.spriteState = "child2";
        } else if (this.age >= 60) {
            this.spriteState = "baby2";
        } else if (this.age >= 50) {
            this.spriteState = "egg2";
        } else if (this.age >= 41) {
            this.spriteState = "secret2";
        } else if (this.age >= 40) {
            this.spriteState = "secret";
        } else if (this.age >= 15) {
            this.spriteState = "adult";
        } else if (this.age >= 10) {
            this.spriteState = "teen";
        } else if (this.age >= 5) {
            this.spriteState = "child";
        } else if (this.age >= 1) {
            this.spriteState = "baby";
        }
        
        spriteElement.innerHTML = `<div class="sprite-content">${egglingSprites[this.spriteState]}</div>`;
        
        spriteElement.className = 'eggling-sprite';
        if (this.spriteState === "dead" || this.spriteState === "dead2") {
            spriteElement.classList.add('dead');
        } else if (this.spriteState === "sick" || this.spriteState === "sick2") {
            spriteElement.classList.add('sick');
        } else if (this.spriteState === "graduate") {
            spriteElement.classList.add('graduate');
        } else {
            spriteElement.classList.add('alive');
        }
    }
    
    graduate() {
        this.graduated = true;
        
        document.documentElement.style.setProperty('--matrix-green', 'white');
        document.documentElement.style.setProperty('--matrix-glow', '0 0 10px white, 0 0 20px white');
        
        document.querySelectorAll('.bar, button, h1, h2, h3, .instructions, .game-container').forEach(element => {
            element.style.transition = 'all 1s ease';
            if (element.style.backgroundColor === '#0f0' || element.style.backgroundColor === 'rgb(0, 255, 0)' || 
                element.style.backgroundColor === '#f0f' || element.style.backgroundColor === 'rgb(255, 0, 255)') {
                element.style.backgroundColor = 'white';
            }
            if (element.style.color === '#0f0' || element.style.color === 'rgb(0, 255, 0)' || 
                element.style.color === '#f0f' || element.style.color === 'rgb(255, 0, 255)') {
                element.style.color = 'white';
            }
            if (element.style.borderColor === '#0f0' || element.style.borderColor === 'rgb(0, 255, 0)' || 
                element.style.borderColor === '#f0f' || element.style.borderColor === 'rgb(255, 0, 255)') {
                element.style.borderColor = 'white';
            }
            if (element.style.textShadow && (element.style.textShadow.includes('#0f0') || element.style.textShadow.includes('#f0f'))) {
                element.style.textShadow = element.style.textShadow.replace(/#0f0/g, 'white').replace(/#f0f/g, 'white');
            }
        });
        
        const award = awards[this.randomInRange(awards.length)];
        
        const statusText = `🎊 EGGLING ${award}! 🎊`;
        document.getElementById('status').innerText = statusText;
        this.appendToLog(`🎊 EGGLING ${award}! 🎊`);
        
        this.saveToLocalStorage();
        
        const existingButton = document.querySelector('#graduate-restart-btn');
        if (existingButton) {
            existingButton.remove();
        }

        const restartButton = document.createElement('button');
        restartButton.id = 'graduate-restart-btn';
        restartButton.innerText = 'Restart with a new Eggling';
        restartButton.style.backgroundColor = 'black';
        restartButton.style.color = 'white';
        restartButton.style.border = '1px solid white';
        restartButton.style.padding = '10px';
        restartButton.style.margin = '20px auto';
        restartButton.style.display = 'block';
        restartButton.style.cursor = 'pointer';
        
        restartButton.addEventListener('click', () => {
            localStorage.removeItem('egglingData');
            location.reload();
        });
        
        document.querySelector('.game-container').appendChild(restartButton);
    }
    
    updateMeters() {
        const maxFood = 5;
        const hungerPercent = Math.max(0, Math.min(100, (1 - this.foodLevel / maxFood) * 100));
        document.getElementById('hunger-bar').style.width = `${hungerPercent}%`;
        document.getElementById('hunger-value').innerText = `${hungerPercent.toFixed(1)}%`;
        
        const maxBoredom = 10;
        const boredomPercent = Math.max(0, Math.min(100, (this.boredom / maxBoredom) * 100));
        document.getElementById('boredom-bar').style.width = `${boredomPercent}%`;
        document.getElementById('boredom-value').innerText = `${boredomPercent.toFixed(1)}%`;
        
        const maxPoop = 10;
        const cleanPercent = Math.max(0, Math.min(100, 100 - (this.poopLevel / maxPoop) * 100));
        document.getElementById('clean-bar').style.width = `${cleanPercent}%`;
        document.getElementById('clean-value').innerText = `${cleanPercent.toFixed(1)}%`;
        
        const maxSocial = 10;
        const socialPercent = Math.max(0, Math.min(100, (this.socialLevel / maxSocial) * 100));
        document.getElementById('social-bar').style.width = `${socialPercent}%`;
        document.getElementById('social-value').innerText = `${socialPercent.toFixed(1)}%`;
        
        document.getElementById('hunger-bar').className = hungerPercent >= 70 ? 'bar danger' : hungerPercent >= 21 ? 'bar warning' : 'bar good';
        document.getElementById('boredom-bar').className = boredomPercent >= 70 ? 'bar danger' : boredomPercent >= 21 ? 'bar warning' : 'bar good';
        document.getElementById('clean-bar').className = cleanPercent <= 20 ? 'bar danger' : cleanPercent <= 69 ? 'bar warning' : 'bar good';
        document.getElementById('social-bar').className = socialPercent <= 20 ? 'bar danger' : socialPercent <= 69 ? 'bar warning' : 'bar good';
    }

    instructions() {
        const instr = `
        <div class="instructions-header">
            <h3>How to care for ${this.name}</h3>
            <button id="toggle-instructions" class="toggle-btn">▼</button>
        </div>
        <div id="instructions-content">
            <strong>Feed</strong> - Reduce hunger <br>
            <strong>Play</strong> - Reduce boredom <br>
            <strong>Talk</strong> - Reduce boredom <br>
            <strong>Clean</strong> - Improve cleanliness <br>
            <strong>Wait</strong> - Let time pass <br>
            <strong style="color: #fff; text-shadow: 0 0 2px #fff, 0 0 10px #fff;">Release</strong> - Release your eggling <br>
        </div>
        `;
        document.getElementById('instructions').innerHTML = instr;
        
        document.getElementById('toggle-instructions').addEventListener('click', function() {
            const content = document.getElementById('instructions-content');
            const toggleBtn = document.getElementById('toggle-instructions');
            
            if (content.style.display === 'none') {
                content.style.display = 'block';
                toggleBtn.textContent = '▼';
            } else {
                content.style.display = 'none';
                toggleBtn.textContent = '►';
            }
        });
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
            
            document.documentElement.style.setProperty('--matrix-green', '#f00');
            document.documentElement.style.setProperty('--matrix-glow', '0 0 10px #f00, 0 0 20px #f00');
            
            document.getElementById('game-over').style.display = 'block';
            this.appendToLog(`💔 ${this.name} has passed away... R.I.P.`);
            
            localStorage.removeItem('egglingData');
        } else if (this.age >= 41) {
            document.documentElement.style.setProperty('--matrix-green', '#f0f');
            document.documentElement.style.setProperty('--matrix-glow', '0 0 10px #f0f, 0 0 20px #f0f');
        } else if (this.age <= 40) {
            document.documentElement.style.setProperty('--matrix-green', '#0f0');
            document.documentElement.style.setProperty('--matrix-glow', '0 0 10px #0f0, 0 0 20px #0f0');
        }
    }
    
    saveToLocalStorage() {
        const egglingData = {
            name: this.name,
            age: this.age,
            boredom: this.boredom,
            foodLevel: this.foodLevel,
            poopLevel: this.poopLevel,
            socialLevel: this.socialLevel,
            graduated: this.graduated
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
            eggling.socialLevel = data.socialLevel || 6.5;
            eggling.graduated = data.graduated || false;
            
            if (eggling.graduated) {
                eggling.graduate();
            }
            
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
    
    window.addEventListener('beforeunload', () => {
        if (eggling && eggling.isAlive()) {
            const maxFood = 5;
            const maxBoredom = 10;
            const maxPoop = 10;
            
            const hungerPercent = Math.max(0, Math.min(100, (1 - eggling.foodLevel / maxFood) * 100));
            const boredomPercent = Math.max(0, Math.min(100, (eggling.boredom / maxBoredom) * 100));
            const cleanPercent = Math.max(0, Math.min(100, 100 - (eggling.poopLevel / maxPoop) * 100));
            
            const newHungerPercent = Math.min(100, hungerPercent + 12.5);
            eggling.foodLevel = Math.max(0, maxFood * (1 - newHungerPercent / 100));
            
            const newBoredomPercent = Math.min(100, boredomPercent + 12.5);
            eggling.boredom = Math.min(maxBoredom, maxBoredom * (newBoredomPercent / 100));
            
            const newCleanPercent = Math.max(0, cleanPercent - 12.5);
            eggling.poopLevel = Math.min(maxPoop, maxPoop * (1 - newCleanPercent / 100));
            
            eggling.saveToLocalStorage();
        }
    });
    
    function initGame() {
        function startGame() {
            const name = document.getElementById('name').value.trim();
            if (!name) return;
            
            eggling = new Eggling(name);
            eggling.health();
            eggling.instructions();
            eggling.appendToLog(`🥚 ${name} is hatching! Take care of your eggling.`);
            eggling.saveToLocalStorage();
            
            document.getElementById('start-container').style.display = 'none';
            document.getElementById('game-content').style.display = 'block';
            
            document.getElementById('game-over').style.display = 'none';
            
            const actionButtons = document.querySelectorAll('.action-btn');
            actionButtons.forEach(btn => btn.disabled = false);
        }

        document.getElementById('start').addEventListener('click', startGame);

        document.getElementById('name').addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                startGame();
            }
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
            document.documentElement.style.setProperty('--matrix-green', 'white');
            document.documentElement.style.setProperty('--matrix-glow', '0 0 10px white, 0 0 20px white');
            
            const actionButtons = document.querySelectorAll('.action-btn');
            actionButtons.forEach(btn => btn.disabled = true);
            
            const log = document.getElementById('log');
            log.innerText += 'EGGLING RELEASED\n';
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
            
            document.documentElement.style.setProperty('--matrix-green', '#0f0');
            document.documentElement.style.setProperty('--matrix-glow', '0 0 10px #0f0, 0 0 20px #0f0');
            
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
    
    document.addEventListener('keydown', (e) => {
        if (!eggling || !eggling.isAlive()) return;
        
        switch (e.key) {
            case '1':
                document.getElementById('feed-btn').click();
                break;
            case '2':
                document.getElementById('play-btn').click();
                break;
            case '3':
                document.getElementById('clean-btn').click();
                break;
            case '4':
                document.getElementById('talk-btn').click();
                break;
            case '5':
                document.getElementById('wait-btn').click();
                break;
        }
    });

    initGame();
    loadSavedEggling();
});