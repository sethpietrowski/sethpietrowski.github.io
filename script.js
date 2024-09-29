let selectedCell = null; //keep track of the currently selected cell

// Create a Sudoku grid
const sudokuBoard = document.getElementById("sudoku-board");
const newGameButton = document.getElementById("new-game");
const checkSolutionButton = document.getElementById("check-solution");

let board = [
    // Puzzle to eventually be replaced with generator
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
                cell.readOnly = true; //Make editable but not typable
            }
            
            cell.setAttribute('data-row', row);
            cell.setAttribute('data-col', col);

            //Hande selecting cells
            cell.addEventListener('click', () => {
              if (selectedCell) {
                selectedCell.classList.remove('selected');
              }
              selectedCell = cell;
              selectedCell.classList.add('selected');
              selectedCell.focus(); //have cell focus tracked
            })

            sudokuBoard.appendChild(cell);
        }
    }
}

// for handling number button clicks
document.querySelectorAll('.number-button').forEach(button => {
  button.addEventListener('click', () => {
    if (selectedCell) {
      selectedCell.value = button.getAttribute('data-value');
    }
  });
});

// Arrow key navigation

document.addEventListener('keydown', (event) => {
  if (!selectedCell) return;

  const row = parseInt(selectedCell.getAttribute('data-row'));
  const col = parseInt(selectedCell.getAttribute('data-col'));

  switch (event.key) {
    case 'ArrowUp':
      if (row > 0) {
        selectedCell(row - 1, col);
      }
      break;
    case 'ArrowDown':
      if (row < 8) {
        selectedCell(row + 1, col);
      }
      break;
    case 'ArrowLeft':
      if (col > 0) {
        selectedCell(row, col - 1);
      }
      break;
    case 'ArrowRight':
      if (col < 8) {
        selectedCell(row, col + 1);
      }
      break;
  }
});

function selectCell(row, col) {
  if (selectedCell) {
    selectedCell.classList.remove('selected');
  }
  selectedCell = document.querySelector(`input[data-row='${row}'][data-col='${col}']`);
  selectedCell.classList.add('selected');
  selectedCell.focus(); //cselected cell changed, so focus this one
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

newGameButton.addEventListener("click", createBoard);
checkSolutionButton.addEventListener("click", checkSolution);

// Initialize the board when the page loads
window.onload = createBoard();
