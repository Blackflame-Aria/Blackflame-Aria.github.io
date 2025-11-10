// here's the suits and ranks for the cards
const suits = ["Spades ♠️", "Hearts ❤️", "Diamonds ♦️", "Clubs ♣️"];
const ranks = ["2", "3", "4", "5", "6", "7", "8", "9", "10", "Jack", "Queen", "King", "Ace"];

// this card class represents 1 card
class Card {
    constructor(suit, rank) {
        this.suit = suit;
        this.rank = rank;
    }

    getValue() {
        return ranks.indexOf(this.rank);
    }

    toString() {
        return `${this.rank} of ${this.suit}`;
    }
}

// deck class is to represent the card deck
class Deck {
    constructor() {
        this.cards = [];
        for (let suit of suits) {
            for (let rank of ranks) {
                this.cards.push(new Card(suit, rank));
            }
        }
        this.shuffle();
    }

    shuffle() {
        for (let i = this.cards.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.cards[i], this.cards[j]] = [this.cards[j], this.cards[i]];
        }
    }

    dealCard() {
        return this.cards.pop();
    }
}

// and the player class represents a player, of course
class Player {
    constructor(name) {
        this.name = name;
        this.hand = [];
        this.score = 0;
    }

    addCard(card) {
        this.hand.push(card);
    }

    playCard() {
        return this.hand.shift(); 
    }

    addPoint() {
        this.score++;
    }

    toString() {
        return `${this.name} (Score: ${this.score})`;
    }
}

// here's the main logic for the game
class Game {
    constructor() {
        this.deck = new Deck();
        this.player1 = new Player("Diva 1");
        this.player2 = new Player("Diva 2");
        this.dealCards();
        this.gameLog = document.querySelector(".log-content");
        this.replayButton = document.getElementById("replay-button");
        this.drawButton = document.getElementById("draw-button");
        this.player1CardDisplay = document.querySelector("#player1 .card-display");
        this.player2CardDisplay = document.querySelector("#player2 .card-display");
        this.player1Score = document.querySelector("#player1 .score");
        this.player2Score = document.querySelector("#player2 .score");
        this.player1Div = document.getElementById("player1");
        this.player2Div = document.getElementById("player2");
        this.replayButton.addEventListener("click", () => this.resetGame());
        this.drawButton.addEventListener("click", () => this.playRound());
        this.replayButton.disabled = true;
        this.drawButton.disabled = false;
        this.setTurnGlow("player1");
    }

    dealCards() {
        for (let i = 0; i < 26; i++) {
            this.player1.addCard(this.deck.dealCard());
            this.player2.addCard(this.deck.dealCard());
        }
    }
    // this section oversees each round with log entries
    playRound() {
        if (this.player1.hand.length === 0 || this.player2.hand.length === 0) {
            this.endGame();
            return;
        }

        this.drawButton.disabled = true;
        this.setTurnGlow("player1");

        const card1 = this.player1.playCard();
        this.player1CardDisplay.textContent = card1.toString();

        this.setTurnGlow("player2");

        setTimeout(() => {
            const card2 = this.player2.playCard();
            this.player2CardDisplay.textContent = card2.toString();

            this.player1Score.textContent = `Score: ${this.player1.score}`;
            this.player2Score.textContent = `Score: ${this.player2.score}`;

            let logEntry = document.createElement("div");
            logEntry.style.marginBottom = "10px"; 
            logEntry.innerHTML = `${this.player1.name} plays: ${card1.toString()}<br>
                                  ${this.player2.name} plays: ${card2.toString()}<br>`;

            let roundResult;
            if (card1.getValue() > card2.getValue()) {
                this.player1.addPoint();
                roundResult = `${this.player1.name} wins the battle!!`;
            } else if (card1.getValue() < card2.getValue()) {
                this.player2.addPoint();
                roundResult = `${this.player2.name} wins the battle!!`;
            } else {
                roundResult = `Tie! No one wins!!`;
            }

            logEntry.innerHTML += roundResult + `<br>Score: ${this.player1.score} to ${this.player2.score}`;

            this.gameLog.insertBefore(logEntry, this.gameLog.firstChild);
            this.gameLog.scrollTop = 0;

            console.log(`${this.player1.name} plays: ${card1.toString()}`);
            console.log(`${this.player2.name} plays: ${card2.toString()}`);
            console.log(roundResult);
            console.log(`Score: ${this.player1.score} to ${this.player2.score}`);

            if (this.player1.hand.length === 0 || this.player2.hand.length === 0) {
                this.endGame();
            } else {
                this.setTurnGlow("player1");
                this.drawButton.disabled = false;
            }
        }, 900);
    }

    setTurnGlow(player) {
        if (player === "player1") {
            this.player1Div.classList.add("turn-glow");
            this.player2Div.classList.remove("turn-glow");
        } else {
            this.player2Div.classList.add("turn-glow");
            this.player1Div.classList.remove("turn-glow");
        }
    }

    playGame() {
        this.replayButton.disabled = true;
        this.drawButton.disabled = false;
        this.setTurnGlow("player1");
    }

    showModal(title, message) {
        const modal = document.getElementById('game-modal');
        const modalTitle = document.getElementById('modal-title');
        const modalMessage = document.getElementById('modal-message');
        
        modalTitle.textContent = title;
        modalMessage.textContent = message;
        modal.classList.add('active');
    }

    hideModal() {
        const modal = document.getElementById('game-modal');
        modal.classList.remove('active');
    }

    endGame() {
        let result = "";
        if (this.player1.score > this.player2.score) {
            result = `${this.player1.name} wins the war!!`;
        } else if (this.player1.score < this.player2.score) {
            result = `${this.player2.name} wins the war!!`;
        } else {
            result = "Stalemate!! lame...";
        }
    
        let logEntry = document.createElement("div");
        logEntry.innerHTML = `Game Over!! ${result}`;
        
        this.gameLog.insertBefore(logEntry, this.gameLog.firstChild);
        
        this.replayButton.disabled = false;
        this.drawButton.disabled = true;
        this.player1Div.classList.remove("turn-glow");
        this.player2Div.classList.remove("turn-glow");
    
        this.showModal("GAME OVER", result);
        console.log(`Game Over!! ${result}`);
    }

    resetGame() {
        this.hideModal();
        this.player1 = new Player("Diva 1");
        this.player2 = new Player("Diva 2");
        this.deck = new Deck();
        this.dealCards();
        this.gameLog.innerHTML = ""; // Clear the log
        this.replayButton.disabled = true;
        this.drawButton.disabled = false;
        this.player1CardDisplay.textContent = "";
        this.player2CardDisplay.textContent = "";
        this.player1Score.textContent = "Score: 0";
        this.player2Score.textContent = "Score: 0";
        this.setTurnGlow("player1");
    }
}

// This code starts the game
const game = new Game();
game.playGame();

// Modal close handler
document.getElementById('modal-ok-button').addEventListener('click', function() {
    game.hideModal();
});

// Close modal when clicking outside of it
document.getElementById('game-modal').addEventListener('click', function(e) {
    if (e.target === this) {
        game.hideModal();
    }
});