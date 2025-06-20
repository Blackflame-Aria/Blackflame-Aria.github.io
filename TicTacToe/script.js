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
        } else if (choice === '4') {
            symbols = { p1: '<img src="images/maca_strawb.png" alt="Y">', p2: '<img src="images/maca_lavender.png" alt="Z">' };
        }
        resetGame();
    });

    function aiMove() {
        if (!gameActive) return;
        let move = getBestMove();
        if (move === null) return;
        const symbol = symbols.p2;
        $(`.cell[data-index="${move}"]`).html(symbol);
        board[move] = 2;
        if (checkWin(2)) {
            showResult(`Slayer 2 Wins!`);
            gameActive = false;
        } else if (board.every(cell => cell !== null)) {
            showResult("It's a Draw!");
            gameActive = false;
        } else {
            currentPlayer = 1;
            $('#turnIndicator').text(`Slayer 1's Turn`);
        }
    }

    function getBestMove() {
        let emptyCells = board.map((cell, idx) => cell === null ? idx : null).filter(idx => idx !== null);

        // 1. Win if possible
        for (let idx of emptyCells) {
            board[idx] = 2;
            if (checkWin(2)) {
                board[idx] = null;
                return idx;
            }
            board[idx] = null;
        }

        // 2. Block opponent's win
        for (let idx of emptyCells) {
            board[idx] = 1;
            if (checkWin(1)) {
                board[idx] = null;
                return idx;
            }
            board[idx] = null;
        }

        // 3. Try to create a line of 3 for itself
        for (let idx of emptyCells) {
            board[idx] = 2;
            if (countInLine(idx, 2, 3)) {
                board[idx] = null;
                return idx;
            }
            board[idx] = null;
        }

        // 4. Block opponent's line of 3
        for (let idx of emptyCells) {
            board[idx] = 1;
            if (countInLine(idx, 1, 3)) {
                board[idx] = null;
                return idx;
            }
            board[idx] = null;
        }

        // 5. Take center if available
        let center = 12;
        if (board[center] === null) return center;

        // 6. Take a random corner
        let corners = [0, 4, 20, 24];
        let availableCorners = corners.filter(idx => board[idx] === null);
        if (availableCorners.length > 0) {
            return availableCorners[Math.floor(Math.random() * availableCorners.length)];
        }

        // 7. Take a random side
        let sides = [1, 3, 5, 9, 15, 19, 21, 23];
        let availableSides = sides.filter(idx => board[idx] === null);
        if (availableSides.length > 0) {
            return availableSides[Math.floor(Math.random() * availableSides.length)];
        }

        // 8. Otherwise, pick random
        if (emptyCells.length > 0) {
            return emptyCells[Math.floor(Math.random() * emptyCells.length)];
        }
        return null;
    }

    function countInLine(idx, player, countNeeded) {
        let size = 5;
        let row = Math.floor(idx / size);
        let col = idx % size;
        let directions = [
            { dr: 0, dc: 1 },
            { dr: 1, dc: 0 },
            { dr: 1, dc: 1 },
            { dr: 1, dc: -1 }
        ];
        for (let dir of directions) {
            let count = 1;
            for (let step = 1; step < 4; step++) {
                let r = row + dir.dr * step;
                let c = col + dir.dc * step;
                if (r < 0 || r >= size || c < 0 || c >= size) break;
                if (board[r * size + c] === player) count++;
            }
            for (let step = 1; step < 4; step++) {
                let r = row - dir.dr * step;
                let c = col - dir.dc * step;
                if (r < 0 || r >= size || c < 0 || c >= size) break;
                if (board[r * size + c] === player) count++;
            }
            if (count >= countNeeded) return true;
        }
        return false;
    }

    $('#gameGrid').on('click', '.cell', function () {
        const index = $(this).data('index');
        if (!gameActive || board[index]) return;
        const symbol = currentPlayer === 1 ? symbols.p1 : symbols.p2;
        $(this).html(symbol);
        board[index] = currentPlayer;
        if (checkWin(currentPlayer)) {
            showResult(`Slayer ${currentPlayer} Wins!`);
            gameActive = false;
        } else if (board.every(cell => cell !== null)) {
            showResult("It's a Draw!");
            gameActive = false;
        } else {
            currentPlayer = currentPlayer === 1 ? 2 : 1;
            $('#turnIndicator').text(`Slayer ${currentPlayer}'s Turn`);
            if (currentPlayer === 2) {
                setTimeout(aiMove, 500);
            }
        }
    });

    function checkWin(player) {
        let winLength = 4;
        let size = 5;
        for (let row = 0; row < size; row++) {
            for (let col = 0; col <= size - winLength; col++) {
                let win = true;
                for (let k = 0; k < winLength; k++) {
                    if (board[row * size + (col + k)] !== player) {
                        win = false;
                        break;
                    }
                }
                if (win) return true;
            }
        }
        for (let col = 0; col < size; col++) {
            for (let row = 0; row <= size - winLength; row++) {
                let win = true;
                for (let k = 0; k < winLength; k++) {
                    if (board[(row + k) * size + col] !== player) {
                        win = false;
                        break;
                    }
                }
                if (win) return true;
            }
        }
        for (let row = 0; row <= size - winLength; row++) {
            for (let col = 0; col <= size - winLength; col++) {
                let win = true;
                for (let k = 0; k < winLength; k++) {
                    if (board[(row + k) * size + (col + k)] !== player) {
                        win = false;
                        break;
                    }
                }
                if (win) return true;
            }
        }
        for (let row = 0; row <= size - winLength; row++) {
            for (let col = winLength - 1; col < size; col++) {
                let win = true;
                for (let k = 0; k < winLength; k++) {
                    if (board[(row + k) * size + (col - k)] !== player) {
                        win = false;
                        break;
                    }
                }
                if (win) return true;
            }
        }
        return false;
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