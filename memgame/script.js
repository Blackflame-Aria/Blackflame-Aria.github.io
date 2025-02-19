const cardValues = [
    { color: '#FF0000', label: 'Red' },
    { color: '#FFA500', label: 'Orange' },
    { color: '#FFFF00', label: 'Yellow' },
    { color: '#008000', label: 'Green' },
    { color: '#0000FF', label: 'Blue' },
    { color: '#4B0082', label: 'Indigo' },
    { color: '#EE82EE', label: 'Violet' },
    { color: '#FFC0CB', label: 'Pink' },
    { color: '#964B00', label: 'Brown' },
    { color: '#808080', label: 'Gray' },
    { color: '#800080', label: 'Purple' },
    { color: '#00FFFF', label: 'Cyan' },
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
        cardElement.dataset.label = card.label;
        const label = document.createElement('span');
        label.textContent = card.label;
        cardElement.appendChild(label);
        cardElement.addEventListener('click', flipCard);
        gameBoard.appendChild(cardElement);
    });
}

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
            alert(`Congrats! Your score is: ${score}`);
        }
    } else {
        setTimeout(() => {
            firstCard.classList.remove('flipped');
            firstCard.style.background = '';
            firstCard.innerHTML = `<span>${firstCard.dataset.label}</span>`;
            secondCard.classList.remove('flipped');
            secondCard.style.background = '';
            secondCard.innerHTML = `<span>${secondCard.dataset.label}</span>`;
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

initGame();