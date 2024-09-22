// Create a Sudoku grid
const sudokuBoard = document.getElementById("sudoku-board");
const newGameButton = document.getElementById("new-game");
const checkSolutionButton = document.getElementById("check-solution");

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

const solution = [
    [5, 3, 4, 6, 7, 8, 9, 1, 2],
    [6, 7, 2, 1, 9, 5, 3, 4, 8],
    [1, 9, 8, 3, 4, 2, 5, 6, 7],
    [8, 5, 9, 7, 6, 1, 4, 2, 3],
    [4, 2, 6, 8, 5, 3, 7, 9, 1],
    [7, 1, 3, 9, 2, 4, 8, 5, 6],
    [9, 6, 1, 5, 3, 7, 2, 8, 4],
    [2, 8, 7, 4, 1, 9, 6, 3, 5],
    [3, 4, 5, 2, 8, 6, 1, 7, 9]
  ];

// Function to initialize the Sudoku board
function createBoard() {
    

    // Clear previous cells
    sudokuBoard.innerHTML = '';

    // Populate the grid
    for (let row = 0; row < 9; row++) {
        for (let col = 0; col < 9; col++) {
            const cell = document.createElement("input");
            cell.type = "number";
            cell.min = 1;
            cell.max = 9;
            cell.className = "cell";

            if (board[row][col] !== 0) {
                cell.value = board[row][col];
                cell.disabled = true; // Lock original numbers
            } else {
                cell.value = '';
            }
            
            cell.setAttribute('data-row', row);
            cell.setAttribute('data-col', col);
      
            // Add bold borders for the 3x3 grid structure
            if (row % 3 === 0) {
              cell.style.borderTop = '2px solid black';
            }
            if (col % 3 === 0) {
              cell.style.borderLeft = '2px solid black';
            }
            if (row === 8) {
              cell.style.borderBottom = '2px solid black';
            }
            if (col === 8) {
              cell.style.borderRight = '2px solid black';
            }

            sudokuBoard.appendChild(cell);
        }
    }
}

// Function to check if the solution is correct
function checkSolution() {
    let isCorrect = true;

  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      const cell = document.querySelector(`input[data-row='${row}'][data-col='${col}']`);
      const userValue = parseInt(cell.value) || 0; // Read user input, treat empty as 0

      // Check if the filled value matches the solution, but ignore empty cells
      if (userValue !== 0 && userValue !== solution[row][col]) {
        isCorrect = false;
        cell.style.backgroundColor = '#ffcccc'; // Highlight incorrect cells
      } else {
        cell.style.backgroundColor = ''; // Clear highlighting for correct cells
      }
    }
  }

  if (isCorrect) {
    alert("Congratulations! You solved the puzzle correctly.");
  } else {
    alert("The solution is incorrect. Please try again.");
  }
}

// Add event listeners for buttons
//const newGameButton = document.getElementById("newGameButton");
//const checkSolutionButton = document.getElementById("checkSolutionButton");

newGameButton.addEventListener("click", createBoard);
checkSolutionButton.addEventListener("click", checkSolution);

// Initialize the board when the page loads
window.onload = createBoard();
