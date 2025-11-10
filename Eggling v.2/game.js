const verbs = [
    "Ask", "Ban", "Bash", "Bite", "Break", "Burn",
    "Cut", "Dig", "Drag", "Drop", "Drink", "Enjoy",
    "Eat", "End", "Feed", "Fill", "Force", "Grasp",
    "Gas", "Get", "Grab", "Steal", "Hoist", "House",
    "Ice", "Ink", "Join", "Kick", "Leave", "Marry",
    "Mix", "Nab", "Nail", "Open", "Press", "Quash",
    "Rub", "Run", "Save", "Snap", "Taste", "Touch",
    "Use", "Boil", "Moisten", "Wash", "Raze", "Squeeze"
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

const subjects = [
    "bugs are", "grass is", "water is", "clouds are", "stars are",
    "music is", "food is", "dreams are", "books are", "games are",
    "cats are", "dogs are", "birds are", "trees are", "flowers are",
    "people are", "children are", "adults are", "friends are", 
    "fascists are", "enemies are", "weed is", "art is",
    "movies are", "shows are", "songs are", "stories are", "jokes are",
    "computers are", "phones are", "cars are", "bikes are", "trains are",
    "mornings are", "nights are", "days are", "weeks are", "months are",
    "summers are", "winters are", "springs are", "falls are", "holidays are"
];

const descriptors = [
    "amazing", "terrible", "beautiful", "ugly", "sweet", 
    "sour", "loud", "quiet", "fast", "slow",
    "bright", "dark", "hot", "cold", "soft",
    "hard", "smooth", "rough", "heavy", "light",
    "strong", "weak", "big", "small", "tall",
    "short", "round", "square", "thin", "thick",
    "new", "old", "young", "ancient", "boring",
    "clean", "dirty", "dry", "wet", "shiny",
    "dull", "sharp", "blunt", "deep", "shallow",
    "empty", "full", "open", "closed", "simple", "near"
];

const opinions = [
    "like", "hate", "love", "don't care for", "prefer", "despise", "admire", "tolerate", "avoid", "enjoy", "hunt", "moisturize", "sniff", "obliterate", "have no opinion on",
    "spit on", "worship", "loathe"
];

const awards = [
    "RECEIVED A SCHOLORSHIP TO OXFORD", "CAN'T AFFORD TO MOVE OUT",
    "WON A NOBEL PEACE PRIZE", "LEARNED TO FLY",
    "MOVED OUT AND STARTED A CULT", "MOVED OUT AND SPIRALED INTO DEPRESSION", "DROPPED OUT OF COMMUNITY COLLEGE", "MOVED OUT AND BECAME A SUCCESSFUL ARTIST"
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
    graduate2: "<img src='Sprites/Graduate2.gif' class='sprite-img'>",
    secret: "<img src='Sprites/Secret.gif' class='sprite-img'>",
    egg2: "<img src='Sprites/Egg2.gif' class='sprite-img'>",
    baby2: "<img src='Sprites/Baby2.gif' class='sprite-img'>",
    child2: "<img src='Sprites/Child2.gif' class='sprite-img'>",
    teen2: "<img src='Sprites/Teen2.gif' class='sprite-img'>",
    adult2: "<img src='Sprites/Adult2.gif' class='sprite-img'>",
    secret2: "<img src='Sprites/Secret2.gif' class='sprite-img'>",
    wip: "<img src='Sprites/WIP.gif' class='sprite-img'>"
};

const boredomIcons = ["💤", "💭", "❓"];
const foodIcons = ["🍣", "🍔", "🍟", "🍰", "🍜"];
const playIcons = ["🎮", "🪀", "🏸", "🧸", "🪁"];
const workIcons = ["💻", "🛠️", "💰", "☹️", "📉"];
const sickIcons1 = ["😄", "😃", "😀", "😊", "😎", "👍"];
const sickIcons2 = ["😪", "😥", "😓"];
const sickIcons3 = ["😩", "😰", "😫", "😠"];
const sickIcons4 = ["😡", "🤒", "🤬"];
const sickIcons5 = ["❌", "💀"];

const colorManager = {
    GREEN_COLOR: '#0f0',
    PINK_COLOR: '#f0f',
    WHITE_COLOR: '#fff',
    RED_COLOR: '#f00',
    
    getGlowEffect: function(color) {
        return `0 0 10px ${color}, 0 0 20px ${color}`;
    },
    
    updateColors: function(eggling) {
        let color;
        
        if (!eggling.isAlive()) {
            color = this.RED_COLOR;
        } else if (eggling.graduated) {
            color = this.WHITE_COLOR;
        } else if (eggling.eggType === "egg2") {
            color = this.PINK_COLOR;
        } else {
            color = this.GREEN_COLOR;
        }
        
        document.documentElement.style.setProperty('--matrix-green', color);
        document.documentElement.style.setProperty('--matrix-glow', this.getGlowEffect(color));
    }
};

class Eggling {
    constructor(name, eggType = "egg") {
        this.MAX_FOOD = 5;
        this.MAX_BOREDOM = 10;
        this.MAX_POOP = 10;
        this.MAX_SOCIAL = 10;
        
        this.name = name;
        this.age = 0;
        this.spriteState = "egg";
        this.eggType = eggType;
        this.boredom = 5;
        this.foodLevel = 2;
        this.poopLevel = 0;
        this.poopDecayRate = 0.15;
        this.socialLevel = 7;
        this.graduated = false;
        
        colorManager.updateColors(this);
    }

    randomInRange(limit) {
        return Math.floor(Math.random() * limit);
    }
    
    getPercentage(value, max, inverted = false) {
        const percent = (value / max) * 100;
        return Math.max(0, Math.min(100, inverted ? 100 - percent : percent));
    }
    
    getMeterClass(percent, dangerThreshold, warningThreshold, inverted = false) {
        if (inverted) {
            return percent <= dangerThreshold ? 'bar danger' : percent <= warningThreshold ? 'bar warning' : 'bar good';
        }
        return percent >= dangerThreshold ? 'bar danger' : percent >= warningThreshold ? 'bar warning' : 'bar good';
    }

    feed() {
        if (this.isAlive()) {
            const hungerPercent = this.getPercentage(this.foodLevel, this.MAX_FOOD, true);
            const foodEmoji = foodIcons[this.randomInRange(foodIcons.length)];
            
            if (hungerPercent <= 0) {
                this.appendToLog(`${foodEmoji} ${this.name} is full!`);
            } else {
                this.foodLevel = Math.min(this.MAX_FOOD, this.foodLevel + .8);
                if (this.age >= 20) {
                    this.appendToLog(`${foodEmoji} ${this.name} is cooking...`);
                } else {
                    this.appendToLog(`${foodEmoji} Feeding ${this.name}...`);
                }
            }
            this.updateMeters();
            this.saveToLocalStorage();
            
            colorManager.updateColors(this);
        }
    }

    play() {
        if (this.isAlive()) {
            const playEmoji = playIcons[this.randomInRange(playIcons.length)];
            
            if (this.boredom <= 0) {
                this.appendToLog(`😠 ${this.name} is annoyed!`);
            } else {
                const boredomPercent = this.getPercentage(this.boredom, this.MAX_BOREDOM);
                const newBoredomPercent = Math.max(0, boredomPercent - 10.5);
                this.boredom = Math.max(0, this.MAX_BOREDOM * (newBoredomPercent / 100));
                
                if (this.age >= 20) {
                    const workEmoji = workIcons[this.randomInRange(workIcons.length)];
                    this.appendToLog(`${workEmoji} ${this.name} is working...`);
                } else {
                    this.appendToLog(`${playEmoji} Playing with ${this.name}...`);
                }
            }
            this.updateMeters();
            this.saveToLocalStorage();
            
            colorManager.updateColors(this);
        }
    }

    talk() {
        if (this.isAlive()) {
            const socialPercent = this.getPercentage(this.socialLevel, this.MAX_SOCIAL);
            if (socialPercent >= 100) {
                this.appendToLog(`🗣️ ${this.name} has nothing to say!`);
                return;
            }
            
            const randType = Math.random();
            let message;
            
            if (randType < 0.25) {
                const verb = verbs[this.randomInRange(verbs.length)];
                const noun = nouns[this.randomInRange(nouns.length)];
                message = `🗣️ ${this.name} says: ${verb} the ${noun}`;
            } else if (randType < 0.5) {
                const subject = subjects[this.randomInRange(subjects.length)];
                const descriptor = descriptors[this.randomInRange(descriptors.length)];
                message = `🗣️ ${this.name} says: The ${subject} ${descriptor}`;
            } else if (randType < 0.75) {
                const opinion = opinions[this.randomInRange(opinions.length)];
                const noun = nouns[this.randomInRange(nouns.length)];
                const descriptor = descriptors[this.randomInRange(descriptors.length)];
                message = `🗣️ ${this.name} says: I ${opinion} ${descriptor} ${noun}`;
            } else {
                const opinion = opinions[this.randomInRange(opinions.length)];
                const noun = nouns[this.randomInRange(nouns.length)];
                message = `🗣️ ${this.name} says: I ${opinion} ${noun}`;
            }
            
            this.appendToLog(message);
            
            const newSocialPercent = Math.min(100, socialPercent + 10.5);
            this.socialLevel = Math.min(this.MAX_SOCIAL, this.MAX_SOCIAL * (newSocialPercent / 100));
            const boredomPercent = this.getPercentage(this.boredom, this.MAX_BOREDOM);
            const newBoredomPercent = Math.max(0, boredomPercent - 4.5);
            this.boredom = Math.max(0, this.MAX_BOREDOM * (newBoredomPercent / 100));
            this.updateMeters();
            this.saveToLocalStorage();
            colorManager.updateColors(this);
        }
    }

    clean() {
        if (this.isAlive()) {
            const cleanPercent = this.getPercentage(this.poopLevel, this.MAX_POOP, true);
            
            if (cleanPercent >= 100) {
                this.appendToLog(`🧹 ${this.name} is sparkling!`);
            } else {
                this.poopLevel = Math.max(0, this.poopLevel - 1.8);
                if (this.age >= 20) {
                    this.appendToLog(`🧹 ${this.name} is cleaning...`);
                } else {
                    this.appendToLog(`🧹 Cleaning up after ${this.name}...`);
                }
            }
            this.updateMeters();
            this.saveToLocalStorage();
            
            colorManager.updateColors(this);
        }
    }

    wait() {
        if (this.isAlive()) {
            this.age++;
            this.boredom += this.randomInRange(3);
            this.foodLevel = Math.max(0, this.foodLevel - 1.425);
            
            this.poopLevel = Math.min(this.MAX_POOP, this.poopLevel + 1.45);
            
            colorManager.updateColors(this);
            
            const socialPercent = this.getPercentage(this.socialLevel, this.MAX_SOCIAL);
            const newSocialPercent = Math.max(0, Math.min(100, socialPercent - 8.5));
            this.socialLevel = Math.max(0, this.MAX_SOCIAL * (newSocialPercent / 100));
            
            this.appendToLog(`⏱️ Time passes... ${this.name} is now ${this.age.toString()} days old.`);
            this.checkStatus();
            this.updateMeters();
            this.saveToLocalStorage();
        }
    }

    tick() {
        this.age += 1;
        
        this.poopLevel = Math.min(this.MAX_POOP, this.poopLevel + 1.25);
        
        const ageScalingFactor = 0.005 * this.age;
        
        const additionalHungerDecrease = this.MAX_FOOD * 0.01 * (1 + ageScalingFactor);
        this.foodLevel = Math.max(0, this.foodLevel - additionalHungerDecrease);
        
        const additionalBoredomIncrease = this.MAX_BOREDOM * 0.01 * (1 + ageScalingFactor);
        this.boredom = Math.min(this.MAX_BOREDOM, this.boredom + additionalBoredomIncrease);
        
        const additionalCleanlinessDecrease = this.MAX_POOP * 0.01 * (1 + ageScalingFactor);
        this.poopLevel = Math.min(this.MAX_POOP, this.poopLevel + additionalCleanlinessDecrease);
        
        const additionalSocialDecrease = this.MAX_SOCIAL * 0.01 * (1 + ageScalingFactor);
        this.socialLevel = Math.max(0, this.socialLevel - additionalSocialDecrease);
        
        colorManager.updateColors(this);
        
        const newSocialPercent = this.getPercentage(this.socialLevel, this.MAX_SOCIAL);
        if (newSocialPercent <= 0) {
            this.appendToLog(`${this.name} is feeling lonely!`);
        }
        
        this.checkStatus();
        
        this.updateMeters();
        this.saveToLocalStorage();
    }

    isAlive() {
        let redMeters = 0;
        
        const hungerPercent = this.getPercentage(this.foodLevel, this.MAX_FOOD, true);
        if (hungerPercent >= 70) redMeters++;
        
        const boredomPercent = this.getPercentage(this.boredom, this.MAX_BOREDOM);
        if (boredomPercent >= 70) redMeters++;
        
        const cleanlinessPercent = this.getPercentage(this.poopLevel, this.MAX_POOP, true);
        if (cleanlinessPercent <= 20) redMeters++;
        
        return redMeters < 2;
    }

    sickness() {
        const hungerPercent = this.getPercentage(this.foodLevel, this.MAX_FOOD, true);
        const boredomPercent = this.getPercentage(this.boredom, this.MAX_BOREDOM);
        const cleanPercent = this.getPercentage(this.poopLevel, this.MAX_POOP, true);
        const socialPercent = this.getPercentage(this.socialLevel, this.MAX_SOCIAL);

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
    
    status() {
        if (this.isAlive()) {
            return "";
        }
        return " R.I.P.";
    }

    health() {
        if (this.age >= 39 && this.age < 40 && !this.graduated) {
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
        
        document.getElementById('status').innerText = `${this.name} | Age: ${this.age} | Mood: ${icon}${this.status()}`;
    }
    
    updateSprite() {
        const spriteContainer = document.getElementById('sprite-container');
        
        if (!this.isAlive()) {
            this.spriteState = this.eggType === "egg2" ? "dead2" : "dead";
            spriteContainer.innerHTML = this.eggType === "egg2" ? egglingSprites.dead2 : egglingSprites.dead;
            colorManager.updateColors(this);
            return;
        }
        
        if (this.graduated) {
            this.spriteState = this.eggType === "egg2" ? "graduate2" : "graduate";
            spriteContainer.innerHTML = this.eggType === "egg2" ? egglingSprites.graduate2 : egglingSprites.graduate;
            colorManager.updateColors(this);
            return;
        }
        
        if (this.sickness() >= 4) {
            this.spriteState = this.eggType === "egg2" ? "sick2" : "sick";
            spriteContainer.innerHTML = this.eggType === "egg2" ? egglingSprites.sick2 : egglingSprites.sick;
            colorManager.updateColors(this);
            return;
        }
        
        if (this.age >= 20) {
            this.spriteState = this.eggType === "egg2" ? "adult2" : "adult";
            spriteContainer.innerHTML = this.eggType === "egg2" ? egglingSprites.adult2 : egglingSprites.adult;
            colorManager.updateColors(this);
        } else if (this.age >= 13) {
            this.spriteState = this.eggType === "egg2" ? "teen2" : "teen";
            spriteContainer.innerHTML = this.eggType === "egg2" ? egglingSprites.teen2 : egglingSprites.teen;
            colorManager.updateColors(this);
        } else if (this.age >= 5) {
            this.spriteState = this.eggType === "egg2" ? "child2" : "child";
            spriteContainer.innerHTML = this.eggType === "egg2" ? egglingSprites.child2 : egglingSprites.child;
            colorManager.updateColors(this);
        } else if (this.age >= 1) {
            this.spriteState = this.eggType === "egg2" ? "baby2" : "baby";
            spriteContainer.innerHTML = this.eggType === "egg2" ? egglingSprites.baby2 : egglingSprites.baby;
            colorManager.updateColors(this);
        } else {
            if (Math.random() < 0.01) {
                this.spriteState = this.eggType === "egg2" ? "secret2" : "secret";
                spriteContainer.innerHTML = this.eggType === "egg2" ? egglingSprites.secret2 : egglingSprites.secret;
                colorManager.updateColors(this);
            } else {
                this.spriteState = this.eggType;
                spriteContainer.innerHTML = egglingSprites[this.eggType];
                colorManager.updateColors(this);
            }
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
        
        const statusText = `🎊 EGGLING ${award}! 🎊` + '\n';
        document.getElementById('status').innerText = statusText;
        this.appendToLog(`🎊 EGGLING ${award}! 🎊` + '\n');
        
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
        const hungerPercent = this.getPercentage(this.foodLevel, this.MAX_FOOD, true);
        document.getElementById('hunger-bar').style.width = `${hungerPercent}%`;
        document.getElementById('hunger-value').innerText = `${hungerPercent.toFixed(1)}%`;
        
        const boredomPercent = this.getPercentage(this.boredom, this.MAX_BOREDOM);
        document.getElementById('boredom-bar').style.width = `${boredomPercent}%`;
        document.getElementById('boredom-value').innerText = `${boredomPercent.toFixed(1)}%`;
        
        const cleanPercent = this.getPercentage(this.poopLevel, this.MAX_POOP, true);
        document.getElementById('clean-bar').style.width = `${cleanPercent}%`;
        document.getElementById('clean-value').innerText = `${cleanPercent.toFixed(1)}%`;
        
        const socialPercent = this.getPercentage(this.socialLevel, this.MAX_SOCIAL);
        document.getElementById('social-bar').style.width = `${socialPercent}%`;
        document.getElementById('social-value').innerText = `${socialPercent.toFixed(1)}%`;
        
        document.getElementById('hunger-bar').className = this.getMeterClass(hungerPercent, 70, 21);
        document.getElementById('boredom-bar').className = this.getMeterClass(boredomPercent, 70, 21);
        document.getElementById('clean-bar').className = this.getMeterClass(cleanPercent, 20, 70, true);
        document.getElementById('social-bar').className = this.getMeterClass(socialPercent, 20, 69, true);
    }

    instructions() {
        const instr = `
        <div class="instructions-header">
            <h3>How to care for ${this.name}</h3>
            <button id="toggle-instructions" class="toggle-btn">▼</button>
        </div>
        <div id="instructions-content">
            <strong>Feed</strong> - Reduce Hunger <br>
            <strong>Play</strong> - Reduce Boredom <br>
            <strong>Clean</strong> - Increase Hygeine <br>
            <strong>Talk</strong> - Hear ${this.name}'s Wisdom <br>
            <strong>Sleep</strong> - Let Time Pass <br>
            <strong>Poop</strong> - Tap to Remove <br>
            <strong style="color: #fff; text-shadow: 0 0 2px #fff, 0 0 10px #fff;">Release</strong> - Release Your Eggling <br>
        </div>
        `;
        document.getElementById('instructions').innerHTML = instr;
        setTimeout(() => {
            const content = document.getElementById('instructions-content');
            const toggleBtn = document.getElementById('toggle-instructions');
            if (content && toggleBtn) {
                content.style.display = 'block';
                toggleBtn.textContent = '▼';
            }
        }, 0);

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
            
            colorManager.updateColors(this);
            
            document.getElementById('game-over').style.display = 'block';
            this.appendToLog(`💔 ${this.name} has passed away... R.I.P.`);
            
            localStorage.removeItem('egglingData');
        } else {
            colorManager.updateColors(this);
        }
    }
    
    saveToLocalStorage() {
        const egglingData = {
            name: this.name,
            age: this.age,
            spriteState: this.spriteState,
            boredom: this.boredom,
            foodLevel: this.foodLevel,
            poopLevel: this.poopLevel,
            socialLevel: this.socialLevel,
            graduated: this.graduated,
            eggType: this.eggType,
            lastTimestamp: Date.now()
        };
        
        localStorage.setItem('egglingData', JSON.stringify(egglingData));
    }
    
    static loadFromLocalStorage() {
        const savedData = localStorage.getItem('egglingData');
        if (!savedData) return null;
        
        try {
            const data = JSON.parse(savedData);
            const eggling = new Eggling(data.name, data.eggType || "egg");
            eggling.age = data.age;
            eggling.spriteState = data.spriteState || "egg";
            eggling.boredom = data.boredom;
            eggling.foodLevel = data.foodLevel;
            eggling.poopLevel = data.poopLevel;
            eggling.socialLevel = data.socialLevel || 6.5;
            eggling.graduated = data.graduated || false;
            
            if (eggling.graduated) {
                eggling.graduate();
            } else if (eggling.eggType === "egg2" && eggling.age < 20 && eggling.isAlive()) {
                document.documentElement.style.setProperty('--matrix-green', '#f0f');
                document.documentElement.style.setProperty('--matrix-glow', '0 0 10px #f0f, 0 0 20px #f0f');
            } else if (eggling.age >= 20 && eggling.isAlive()) {
                document.documentElement.style.setProperty('--matrix-green', '#fff');
                document.documentElement.style.setProperty('--matrix-glow', '0 0 10px #fff, 0 0 20px #fff');
            } else if (!eggling.isAlive()) {
                document.documentElement.style.setProperty('--matrix-green', '#f00');
                document.documentElement.style.setProperty('--matrix-glow', '0 0 10px #f00, 0 0 20px #f00');
            }
                return eggling;
        } catch (e) {
            console.error('Error loading eggling data:', e);
            localStorage.removeItem('egglingData');
            return null;
        }
    }
}

let poopSpritesState = [false, false, false, false];
const poopSpriteIds = [
    'poop-left-1',
    'poop-right-1',
    'poop-left-2',
    'poop-right-2'
];

function getCleanlinessCap() {
    const capped = 100 - poopSpritesState.filter(Boolean).length * 10;
    return Math.max(0, capped);
}
function updateCleanlinessOverlay() {
    const activePoops = poopSpritesState.filter(Boolean).length;
    const overlay = document.getElementById('clean-cap-overlay');
    if (!overlay) return;
    const capPercent = activePoops * 10;
    overlay.style.width = capPercent + '%';
}
function enforceCleanlinessCap() {
    const cleanBar = document.getElementById('clean-bar');
    const cleanValue = document.getElementById('clean-value');
    if (!cleanBar || !cleanValue) return;
    let current = parseFloat(cleanBar.style.width)||0;
    let cap = getCleanlinessCap();
    if (current > cap) {
        cleanBar.style.width = cap + '%';
        cleanValue.innerText = cap.toFixed(1) + '%';
    }
    updateCleanlinessOverlay();
}

function persistPoopSpritesState() {
  localStorage.setItem('egglingPoopSprites', JSON.stringify(poopSpritesState));
}
function restorePoopSpritesState() {
  let s = localStorage.getItem('egglingPoopSprites');
  if (!s) return;
  try {
    let arr = JSON.parse(s);
    if (Array.isArray(arr) && arr.length === 4) {
      poopSpritesState = arr.map(Boolean);
      poopSpriteIds.forEach((id, idx) => {
        const el = document.getElementById(id);
        if (!el) return;
        el.style.display = poopSpritesState[idx] ? 'block' : 'none';
      });
    }
  }catch(e){}
  updateCleanlinessOverlay();
  enforceCleanlinessCap();
}

function resetPoopSprites() {
    poopSpritesState = [false, false, false, false];
    poopSpriteIds.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.style.display = 'none';
    });
    updateCleanlinessOverlay();
    enforceCleanlinessCap();
}
function revealNextPoop() {
    for (let i = 0; i < 4; i++) {
        if (!poopSpritesState[i]) {
            poopSpritesState[i] = true;
            const el = document.getElementById(poopSpriteIds[i]);
            if (el) el.style.display = 'block';
            updateCleanlinessOverlay();
            enforceCleanlinessCap();
            persistPoopSpritesState();
            break;
        }
    }
}
function onPoopSpriteClick(idx) {
    if (poopSpritesState[idx]) {
        playSound('poop');
        poopSpritesState[idx] = false;
        const el = document.getElementById(poopSpriteIds[idx]);
        if (el) el.style.display = 'none';

        enforceCleanlinessCap();
        updateCleanlinessOverlay();
        persistPoopSpritesState();
    }
}

const originalClean = Eggling.prototype.clean;
Eggling.prototype.clean = function () {
    const cap = window.getCleanlinessCap ? window.getCleanlinessCap() : 100;
    originalClean.apply(this, arguments);
    const cleanBar = document.getElementById('clean-bar');
    const cleanValue = document.getElementById('clean-value');
    let widthNow = parseFloat(cleanBar.style.width)||0;
    if (widthNow > cap) {
        widthNow = cap;
        cleanBar.style.width = widthNow + '%';
        cleanValue.innerText = widthNow.toFixed(1) + '%';
    }
    const maxPoop = 10;
    const forcedPoopLevel = maxPoop * (1 - cap / 100);
    if (this.poopLevel < forcedPoopLevel) this.poopLevel = forcedPoopLevel;
    enforceCleanlinessCap();
    updateCleanlinessOverlay();
}

const originalUpdateMeters = Eggling.prototype.updateMeters;
Eggling.prototype.updateMeters = function () {
    originalUpdateMeters.apply(this, arguments);
    enforceCleanlinessCap();
    updateCleanlinessOverlay();
}

function setupPoopSpriteListeners() {
    poopSpriteIds.forEach((id, idx) => {
        const el = document.getElementById(id);
        if (el && !el.dataset.poopready) {
            el.onclick = () => onPoopSpriteClick(idx);
            el.dataset.poopready = '1';
        }
    });
}

function patchWaitBtnForPoop() {
    const waitBtn = document.getElementById('wait-btn');
    if (!waitBtn || waitBtn._poopPatched) return;
    const orig = waitBtn.onclick || (()=>{});
    waitBtn.onclick = function(ev) {
        let shouldReveal = poopSpritesState.some(s=>!s);
        if (shouldReveal) revealNextPoop();
        orig.call(this, ev);
    };
    waitBtn._poopPatched=true;
}

function patchPoopFeatureOnStart() {
    resetPoopSprites();
    setupPoopSpriteListeners();
    patchWaitBtnForPoop();
    updateCleanlinessOverlay();
    enforceCleanlinessCap();
}

const sounds = {
  start: new Audio('Sounds/Start.mp3'),
  release: new Audio('Sounds/Release.mp3'),
  poop: new Audio('Sounds/Poop.mp3'),
  age: new Audio('Sounds/Age.mp3'),
  evolve: new Audio('Sounds/Evolve.mp3'),
  graduate: new Audio('Sounds/Graduate.mp3'),
  sick: new Audio('Sounds/Sick.mp3'),
  death: new Audio('Sounds/Death.mp3'),
  select: new Audio('Sounds/Select.mp3'),
  select2: new Audio('Sounds/Select2.mp3'),
  food: new Audio('Sounds/Food.mp3'),
  play: new Audio('Sounds/Play.mp3'),
  clean: new Audio('Sounds/Clean.mp3'),
  talk: new Audio('Sounds/talk.mp3'),
  no: new Audio('Sounds/No.mp3'),
};

let soundEnabled = true;
let volumeLevel = 1.0;
let isDragging = false;
let lastNonZeroVolume = 50;

function playSound(name) {
  if (soundEnabled && sounds[name]) {
    try {
      sounds[name].currentTime = 0;
      sounds[name].volume = volumeLevel;
      sounds[name].play();
    } catch (e) {}
  }
}

function updateVolume(volume) {
  volumeLevel = volume / 100;
  const volumeBar = document.getElementById('volume-bar');
  const volumeHandle = document.querySelector('.volume-handle');
  const volumeControl = document.querySelector('.volume-control');
  const volumeIcon = document.querySelector('.volume-icon');
  
  volumeBar.style.width = `${volume}%`;
  
  const meterWidth = 60;
  const handlePosition = (volume / 100) * meterWidth;
  volumeHandle.style.left = `${handlePosition}px`;
  
   if (volume > 0) {
    lastNonZeroVolume = volume;
  }
  
  if (volume === 0) {
    soundEnabled = false;
    volumeControl.classList.add('muted');
    volumeIcon.textContent = '🔇';
  } else {
    soundEnabled = true;
    volumeControl.classList.remove('muted');
    volumeIcon.textContent = '🔊';
  }
  
  Object.values(sounds).forEach(sound => {
    if (sound) {
      sound.volume = volumeLevel;
    }
  });
  
  localStorage.setItem('egglingSoundEnabled', soundEnabled);
  localStorage.setItem('egglingVolume', volume);
}

function loadSoundPreference() {
  const savedSoundPreference = localStorage.getItem('egglingSoundEnabled');
  const savedVolume = localStorage.getItem('egglingVolume');
  
  if (savedVolume !== null) {
    const volume = parseInt(savedVolume);
    lastNonZeroVolume = volume > 0 ? volume : 50;
    updateVolume(volume);
  } else {
    lastNonZeroVolume = 100;
    updateVolume(100);
  }
}

function handleMeterClick(e) {
  const meter = e.currentTarget;
  const rect = meter.getBoundingClientRect();
  const clickX = e.clientX - rect.left;
  const meterWidth = rect.width;
  const volumePercent = Math.round((clickX / meterWidth) * 100);
  
  updateVolume(Math.max(0, Math.min(100, volumePercent)));
}

function handleMeterDrag(e) {
  if (!isDragging) return;
  
  const meter = document.querySelector('.volume-meter');
  const rect = meter.getBoundingClientRect();
  const dragX = e.clientX - rect.left;
  const meterWidth = rect.width;
  const volumePercent = Math.round((dragX / meterWidth) * 100);
  
  updateVolume(Math.max(0, Math.min(100, volumePercent)));
}

function startDrag(e) {
  isDragging = true;
  e.preventDefault();
  
  const volumeControl = document.querySelector('.volume-control');
  volumeControl.classList.add('dragging');
  
  handleMeterClick(e);
}

function stopDrag() {
  isDragging = false;
  
  const volumeControl = document.querySelector('.volume-control');
  volumeControl.classList.remove('dragging');
}

document.addEventListener('DOMContentLoaded', () => {
    Object.values(sounds).forEach(sound => {
        if (sound) {
            sound.preload = 'auto';
            sound.load();
        }
    });
    
    const spriteUrls = [
        'Sprites/Egg.gif', 'Sprites/Baby.gif', 'Sprites/Child.gif', 'Sprites/Teen.gif', 'Sprites/Adult.gif',
        'Sprites/Sick.gif', 'Sprites/Sick2.gif', 'Sprites/Dead.gif', 'Sprites/Dead2.gif',
        'Sprites/Graduate.gif', 'Sprites/Graduate2.gif', 'Sprites/Secret.gif', 'Sprites/Egg2.gif',
        'Sprites/Baby2.gif', 'Sprites/Child2.gif', 'Sprites/Teen2.gif', 'Sprites/Adult2.gif',
        'Sprites/Secret2.gif', 'Sprites/WIP.gif', 'Sprites/poop.gif'
    ];
    
    spriteUrls.forEach(url => {
        const img = new Image();
        img.src = url;
    });
    
    loadSoundPreference();
    
    const volumeMeter = document.querySelector('.volume-meter');
    const volumeIcon = document.querySelector('.volume-icon');
    
    if (volumeIcon) {
        volumeIcon.addEventListener('click', (e) => {
            e.stopPropagation();
            
            if (soundEnabled && volumeLevel > 0) {
                updateVolume(0);
            } else {
                updateVolume(lastNonZeroVolume);
            }
        });
    }
    
    if (volumeMeter) {
        volumeMeter.addEventListener('click', handleMeterClick);
        
        volumeMeter.addEventListener('mousedown', startDrag);
        document.addEventListener('mousemove', handleMeterDrag);
        document.addEventListener('mouseup', stopDrag);
        
        volumeMeter.addEventListener('touchstart', (e) => {
            e.preventDefault();
            isDragging = true;
            
            const volumeControl = document.querySelector('.volume-control');
            volumeControl.classList.add('dragging');
            
            const touch = e.touches[0];
            const rect = volumeMeter.getBoundingClientRect();
            const touchX = touch.clientX - rect.left;
            const meterWidth = rect.width;
            const volumePercent = Math.round((touchX / meterWidth) * 100);
            updateVolume(Math.max(0, Math.min(100, volumePercent)));
        });
        
        document.addEventListener('touchmove', (e) => {
            if (!isDragging) return;
            e.preventDefault();
            const touch = e.touches[0];
            const rect = volumeMeter.getBoundingClientRect();
            const touchX = touch.clientX - rect.left;
            const meterWidth = rect.width;
            const volumePercent = Math.round((touchX / meterWidth) * 100);
            updateVolume(Math.max(0, Math.min(100, volumePercent)));
        });
        
        document.addEventListener('touchend', () => {
            isDragging = false;
            
            const volumeControl = document.querySelector('.volume-control');
            volumeControl.classList.remove('dragging');
        });
    }
    
    const realStartBtn = document.getElementById('start');
    if (realStartBtn) {
        const orig = realStartBtn.onclick || (()=>{});
        realStartBtn.onclick = function(ev) {
            patchPoopFeatureOnStart(); 
            orig.call(this, ev);
        };
    }
    setTimeout(()=>{
      setupPoopSpriteListeners(); 
      patchWaitBtnForPoop();
      restorePoopSpritesState(); 
      updateCleanlinessOverlay();
      enforceCleanlinessCap();
    },400);

    let eggling;
    
    window.addEventListener('beforeunload', () => {
        if (eggling && eggling.isAlive()) {
            const hungerPercent = eggling.getPercentage(eggling.foodLevel, eggling.MAX_FOOD, true);
            const boredomPercent = eggling.getPercentage(eggling.boredom, eggling.MAX_BOREDOM);
            const cleanPercent = eggling.getPercentage(eggling.poopLevel, eggling.MAX_POOP, true);
            
            const newHungerPercent = Math.min(100, hungerPercent + 12.5);
            eggling.foodLevel = Math.max(0, eggling.MAX_FOOD * (1 - newHungerPercent / 100));
            
            const newBoredomPercent = Math.min(100, boredomPercent + 12.5);
            eggling.boredom = Math.min(eggling.MAX_BOREDOM, eggling.MAX_BOREDOM * (newBoredomPercent / 100));
            
            const newCleanPercent = Math.max(0, cleanPercent - 16.5);
            eggling.poopLevel = Math.min(eggling.MAX_POOP, eggling.MAX_POOP * (1 - newCleanPercent / 100));
            
            eggling.saveToLocalStorage();
        }
    });
    
    function initGame() {
        const optionEgg = document.getElementById('option-egg');
        const optionEgg2 = document.getElementById('option-egg2');
        let selectedEggType = "egg";
        
        optionEgg.classList.add('selected');
    
    document.documentElement.style.setProperty('--matrix-green', colorManager.GREEN_COLOR);
    document.documentElement.style.setProperty('--matrix-glow', colorManager.getGlowEffect(colorManager.GREEN_COLOR));
    
    optionEgg.addEventListener('click', function() {
        playSound('select2');
        optionEgg.classList.add('selected');
        optionEgg2.classList.remove('selected');
        selectedEggType = "egg";
        document.documentElement.style.setProperty('--matrix-green', colorManager.GREEN_COLOR);
        document.documentElement.style.setProperty('--matrix-glow', colorManager.getGlowEffect(colorManager.GREEN_COLOR));
    });
    
    optionEgg2.addEventListener('click', function() {
        playSound('select');
        optionEgg2.classList.add('selected');
        optionEgg.classList.remove('selected');
        selectedEggType = "egg2";
        document.documentElement.style.setProperty('--matrix-green', colorManager.PINK_COLOR);
        document.documentElement.style.setProperty('--matrix-glow', colorManager.getGlowEffect(colorManager.PINK_COLOR));
    });
        
        function startGame() {
            const name = document.getElementById('name').value.trim();
            if (!name) {
                playSound('no');
                return;
            }
            
            playSound('start');
            eggling = new Eggling(name, selectedEggType);
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
            if (!eggling || !eggling.isAlive()) {
                playSound('no');
                return;
            }
            playSound('food');
            if (eggling.age >= 20) {
                document.getElementById('feed-btn').querySelector('.btn-text').textContent = 'Cook';
            }
            eggling.feed();
            eggling.checkStatus();
            colorManager.updateColors(eggling);
        });
        
        document.getElementById('play-btn').addEventListener('click', () => {
            if (!eggling || !eggling.isAlive()) {
                playSound('no');
                return;
            }
            playSound('play');
            if (eggling.age >= 20) {
                document.getElementById('play-btn').querySelector('.btn-text').textContent = 'Work';
            }
            eggling.play();
            eggling.checkStatus();
            colorManager.updateColors(eggling);
        });
        
        document.getElementById('talk-btn').addEventListener('click', () => {
            if (!eggling || !eggling.isAlive()) {
                playSound('no');
                return;
            }
            playSound('talk');
            if (eggling.age >= 20) {
                document.getElementById('talk-btn').querySelector('.btn-text').textContent = 'Talk';
            }
            eggling.talk();
            eggling.checkStatus();
            colorManager.updateColors(eggling);
        });
        
        document.getElementById('clean-btn').addEventListener('click', () => {
            if (!eggling || !eggling.isAlive()) {
                playSound('no');
                return;
            }
            playSound('clean');
            if (eggling.age >= 20) {
                document.getElementById('clean-btn').querySelector('.btn-text').textContent = 'Clean';
            }
            eggling.clean();
            eggling.checkStatus();
            colorManager.updateColors(eggling);
        });
        
        document.getElementById('wait-btn').addEventListener('click', () => {
            if (!eggling || !eggling.isAlive()) {
                playSound('no');
                return;
            }
            if ([0, 4, 12, 19].includes(eggling.age)) {
                playSound('evolve');
            } else if (eggling.age === 38) {
                playSound('graduate');
            } else {
                playSound('age');
            }
            eggling.appendToLog(`${eggling.name} is sleeping...`);
            document.getElementById('wait-btn').querySelector('.btn-text').textContent = 'Sleep';
            eggling.wait();
            eggling.checkStatus();
            colorManager.updateColors(eggling);
        });
        
        document.getElementById('murder-btn').addEventListener('click', () => {
            playSound('release');
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
            playSound('release');
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
            eggling.appendToLog(`Welcome back to ${eggling.name}!`);
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
    
    const vControl = document.querySelector('.volume-control');
    let collapseTimer = null;
    let isVolDragging = false;
    
    if (vControl) {
        vControl.addEventListener('mouseenter', () => {
            clearTimeout(collapseTimer);
            vControl.classList.add('expanded');
        });
        
        vControl.addEventListener('mouseleave', () => {
            if (!isVolDragging) {
                collapseTimer = setTimeout(() => {
                    vControl.classList.remove('expanded');
                }, 500);
            }
        });
        
        vControl.addEventListener('mousedown', () => {
            isVolDragging = true;
            clearTimeout(collapseTimer);
            vControl.classList.add('expanded');
        });
        
        document.addEventListener('mouseup', () => {
            isVolDragging = false;
            if (!vControl.matches(':hover')) {
                collapseTimer = setTimeout(() => {
                    vControl.classList.remove('expanded');
                }, 500);
            }
        });
    }
});

setTimeout(()=>{
  const restartBtn = document.getElementById('restart');
  if (restartBtn) {
    const origRestart = restartBtn.onclick || (()=>{});
    restartBtn.onclick = function(ev) {
      resetPoopSprites();
      localStorage.removeItem('egglingPoopSprites');
      origRestart.call(this, ev);
    }
  }
}, 900);

Eggling.prototype._updateSprite_prevSick = false;
const originalUpdateSprite = Eggling.prototype.updateSprite;
Eggling.prototype.updateSprite = function() {
    const wasSick = this._updateSprite_prevSick;
    const isSickNow = this.sickness() >= 4;
    if (isSickNow && !wasSick) {
        playSound('sick');
    }
    this._updateSprite_prevSick = isSickNow;
    originalUpdateSprite.apply(this, arguments);
}