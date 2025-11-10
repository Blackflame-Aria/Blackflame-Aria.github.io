const cardValues = [
    { color: '#F00' }, // RED
    { color: '#0F0' }, // GREEN
    { color: '#00F' }, // BLUE
    { color: '#FF0' }, // YELLOW
    { color: '#0FF' }, // CYAN
    { color: '#608' }, // PURPLE
    { color: '#FFF' }, // WHITE
    { color: '#F0F' }, // PINK
    { color: '#963' }, // BROWN
    { color: '#083' }, // DARK GREEN
];

let gameCards = [];
let firstCard = null;
let secondCard = null;
let lockBoard = false;
let score = 0;
let timer;
let timeLeft = 90; 
let timerStarted = false; 
let matchedCardsCount = 0; 

function initGame() {
    gameCards = [...cardValues, ...cardValues]; 
    gameCards.sort(() => 0.5 - Math.random()); 
    const gameBoard = document.getElementById('game-board');
    gameBoard.innerHTML = ''; 
    score = 0; 
    timeLeft = 90; 
    matchedCardsCount = 0; 
    document.getElementById('score').textContent = `Score: ${score}`;
    document.getElementById('timer').textContent = `Time: ${timeLeft}`;

    gameCards.forEach((card, index) => {
        const cardElement = document.createElement('div');
        cardElement.classList.add('card');
        cardElement.dataset.color = card.color;
        cardElement.style.setProperty('--card-color', card.color);
        cardElement.addEventListener('click', flipCard);
        gameBoard.appendChild(cardElement);
    });
}

function showModal(title, message) {
    const modal = document.getElementById('game-modal');
    const modalTitle = document.getElementById('modal-title');
    const modalMessage = document.getElementById('modal-message');
    
    modalTitle.textContent = title;
    modalMessage.textContent = message;
    modal.classList.add('active');
}

function hideModal() {
    const modal = document.getElementById('game-modal');
    modal.classList.remove('active');
}

function startTimer() {
    timer = setInterval(() => {
        timeLeft--;
        document.getElementById('timer').textContent = `Time: ${timeLeft}`;
        if (timeLeft <= 0) {
            clearInterval(timer);
            showModal("TIME'S UP!", `Your score: ${score}`);
        }
    }, 1000);
}

function flipCard() {
    if (lockBoard || this.classList.contains('flipped') || this.classList.contains('matched')) return;

    this.classList.add('flipped');
    this.style.background = this.dataset.color;
    this.innerHTML = '';

    if (!firstCard) {
        firstCard = this;
        if (!timerStarted) {
            timerStarted = true; 
            startTimer();
        }
    } else {
        secondCard = this;
        secondCard.style.background = secondCard.dataset.color;
        secondCard.innerHTML = '';
        lockBoard = true;

        checkForMatch();
    }
}

function checkForMatch() {
    if (firstCard.dataset.color === secondCard.dataset.color) {
        firstCard.classList.add('matched');
        secondCard.classList.add('matched');
        score += Math.floor(timeLeft / 10); 
        matchedCardsCount += 2; 
        document.getElementById('score').textContent = `Score: ${score}`;
        resetBoard();

        if (matchedCardsCount === gameCards.length) {
            clearInterval(timer); 
            showModal("CONGRATULATIONS", `Well done! Your score: ${score}`);
        }
    } else {
        setTimeout(() => {
            firstCard.classList.remove('flipped');
            firstCard.style.background = '';
            firstCard.innerHTML = '';
            secondCard.classList.remove('flipped');
            secondCard.style.background = '';
            secondCard.innerHTML = '';
            resetBoard();
        }, 500);
    }
}

function resetBoard() {
    [firstCard, secondCard] = [null, null];
    lockBoard = false;
}

function resetGame() {
    clearInterval(timer);
    timerStarted = false; 
    initGame();
}

document.getElementById('restart-button').addEventListener('click', resetGame);
document.getElementById('modal-ok-button').addEventListener('click', function() {
    hideModal();
    resetGame();
});

document.getElementById('game-modal').addEventListener('click', function(e) {
    if (e.target === this) {
        hideModal();
        resetGame();
    }
});

initGame();