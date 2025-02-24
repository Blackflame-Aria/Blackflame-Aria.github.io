$(document).ready(function () {
    let currentPlayer = 1;
    let gameActive = true;
    let board = Array(25).fill(null);
    let symbols = { p1: 'X', p2: 'O' }; 

    function createGrid() {
        $('#gameGrid').empty();
        for (let i = 0; i < 25; i++) {
            $('#gameGrid').append(`<div class="cell" data-index="${i}"></div>`);
        }
    }

    $('#symbolSelect').change(function () {
        const choice = $(this).val();
        if (choice === '1') {
            symbols = { p1: 'X', p2: 'O' };
        } else if (choice === '2') {
            symbols = { p1: '<img src="images/ghostdonut_green.gif" alt="A">', p2: '<img src="images/ghostdonut_pink.gif" alt="B">' };
        } else if (choice === '3') {
            symbols = { p1: '<img src="images/latte_mint.gif" alt="Y">', p2: '<img src="images/latte_rose.gif" alt="Z">' };
        }
        else if (choice === '4') {
            symbols = { p1: '<img src="images/maca_strawb.png" alt="Y">', p2: '<img src="images/maca_lavender.png" alt="Z">' };
        }
        resetGame();
    });

    $('#gameGrid').on('click', '.cell', function () {
        const index = $(this).data('index');
        if (!gameActive || board[index]) return;

        const symbol = currentPlayer === 1 ? symbols.p1 : symbols.p2;
        $(this).html(symbol);
        board[index] = currentPlayer;

        if (checkWin()) {
            showResult(`Slayer ${currentPlayer} Wins!`);
            gameActive = false;
        } else if (board.every(cell => cell !== null)) {
            showResult("It's a Draw!");
            gameActive = false;
        } else {
            currentPlayer = currentPlayer === 1 ? 2 : 1;
            $('#turnIndicator').text(`Slayer ${currentPlayer}'s Turn`);
        }
    });

   
    function checkWin() {
        const winConditions = [
            
            ...Array(5).fill().map((_, i) => Array(5).fill().map((_, j) => i * 5 + j)),
            
            ...Array(5).fill().map((_, i) => Array(5).fill().map((_, j) => j * 5 + i)),
            
            Array(5).fill().map((_, i) => i * 6),
             
            Array(5).fill().map((_, i) => (i + 1) * 4) 
        ];

        return winConditions.some(condition => {
            return condition.every(index => board[index] === currentPlayer);
        });
    }

    function showResult(message) {
        $('#resultMessage').text(message);
        $('#resultModal').modal('show');
    }

    $('#restartBtn').click(function () {
        resetGame();
    });

    function resetGame() {
        currentPlayer = 1;
        gameActive = true;
        board = Array(25).fill(null);
        $('#turnIndicator').text("Slayer 1's Turn");
        createGrid();
    }

    createGrid();
});