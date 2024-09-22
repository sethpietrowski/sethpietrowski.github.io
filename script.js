// Create a Sudoku grid
const sudokuBoard = document.getElementById("sudoku-board");
const newGameButton = document.getElementById("new-game");
const checkSolutionButton = document.getElementById("check-solution");

let board = [];

// Function to initialize the Sudoku board
function createBoard() {
    board = [
        // This is an example puzzle; you can replace it with a puzzle generator.
        [5, 3, 0, 0, 7, 0, 0, 0, 0],
        [6, 0, 0, 1, 9, 5, 0, 0, 0],
        [0, 9, 8, 0, 0, 0, 0, 6, 0],
        [8, 0, 0, 0, 6, 0, 0, 0, 3],
        [4, 0, 0, 8, 0, 3, 0, 0, 1],
        [7, 0, 0, 0, 2, 0, 0, 0, 6],
        [0, 6, 0, 0, 0, 0, 2, 8, 0],
        [0, 0, 0, 4, 1, 9, 0, 0, 5],
        [0, 0, 0, 0, 8, 0, 0, 7, 9]
    ];

    // Clear previous cells
    sudokuBoard.innerHTML = '';

    // Populate the grid
    for (let row = 0; row < 9; row++) {
        for (let col = 0; col < 9; col++) {
            const cell = document.createElement("input");
            cell.type = "text";
            cell.className = "cell";

            if (board[row][col] !== 0) {
                cell.value = board[row][col];
                cell.disabled = true; // Lock original numbers
            }

            sudokuBoard.appendChild(cell);
        }
    }
}

// Function to check if the solution is correct
function checkSolution() {
    const cells = document.querySelectorAll('.cell');
    let userSolution = [];

    cells.forEach((cell, index) => {
        const row = Math.floor(index / 9);
        const col = index % 9;
        const value = parseInt(cell.value) || 0;

        if (!userSolution[row]) userSolution[row] = [];
        userSolution[row][col] = value;
    });

    // Compare the user's solution with the correct one
    if (JSON.stringify(userSolution) === JSON.stringify(board)) {
        alert("Correct Solution!");
    } else {
        alert("Incorrect Solution!");
    }
}

newGameButton.addEventListener("click", createBoard);
checkSolutionButton.addEventListener("click", checkSolution);

// Initialize the board when the page loads
createBoard();
