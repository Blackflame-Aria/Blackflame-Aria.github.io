// script.js
const cardValues = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
let gameCards = [];
let firstCard = null;
let secondCard = null;
let lockBoard = false;
let score = 0;
let timer;
let timeLeft = 210; // Set initial time
let timerStarted = false; // Flag to check if timer has started
let matchedCardsCount = 0; // Track matched cards

// Initialize the game
function initGame() {
    gameCards = [...cardValues, ...cardValues]; // Duplicate values for pairs
    gameCards.sort(() => 0.5 - Math.random()); // Shuffle cards
    const gameBoard = document.getElementById('game-board');
    gameBoard.innerHTML = ''; // Clear previous cards
    score = 0; // Reset score
    timeLeft = 210; // Reset time
    matchedCardsCount = 0; // Reset matched cards count
    document.getElementById('score').textContent = `Score: ${score}`;
    document.getElementById('timer').textContent = `Time: ${timeLeft}`;

    gameCards.forEach(value => {
        const card = document.createElement('div');
        card.classList.add('card');
        card.dataset.value = value;
        card.addEventListener('click', flipCard);
        gameBoard.appendChild(card);
    });
}

// Start the timer
function startTimer() {
    timer = setInterval(() => {
        timeLeft--;
        document.getElementById('timer').textContent = `Time: ${timeLeft}`;
        if (timeLeft <= 0) {
            clearInterval(timer);
            alert(`Time's up! Your score: ` + score);
            resetGame();
        }
    }, 1000);
}

// Flip the card
function flipCard() {
    if (lockBoard || this.classList.contains('flipped') || this.classList.contains('matched')) return;

    this.classList.add('flipped');

    if (!firstCard) {
        firstCard = this;
        // Start the timer only when the first card is flipped
        if (!timerStarted) {
            timerStarted = true; // Set the flag to true
            startTimer();
        }
    } else {
        secondCard = this;
        lockBoard = true;

        checkForMatch();
    }
}

// Check for a match
function checkForMatch() {
    if (firstCard.dataset.value === secondCard.dataset.value) {
        firstCard.classList.add('matched');
        secondCard.classList.add('matched');
        score += Math.floor(timeLeft / 10); // Increase score based on remaining time
        matchedCardsCount += 2; // Increase matched cards count
        document.getElementById('score').textContent = `Score: ${score}`;
        resetBoard();

        // Check if all cards are matched
        if (matchedCardsCount === gameCards.length) {
            clearInterval(timer); // Stop the timer
            alert(`Congrats! Your score is: ${score}`);
        }
    } else {
        setTimeout(() => {
            firstCard.classList.remove('flipped');
            secondCard.classList.remove('flipped');
            resetBoard();
        }, 500);
    }
}

// Reset the board
function resetBoard() {
    [firstCard, secondCard] = [null, null];
    lockBoard = false;
}

// Reset the game
function resetGame() {
    clearInterval(timer);
    timerStarted = false; // Reset the timer flag
    initGame();
}

// Restart the game
document.getElementById('restart-button').addEventListener('click', resetGame);

// Start the game on page load
initGame();