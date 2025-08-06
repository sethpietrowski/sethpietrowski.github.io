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
            cell.setAttribute("step", "1"); //disable step functionality
            cell.setAttribute("onkeydown", "return event.key !== 'ArrowUp' && event.key !== 'ArrowDown';"); //disable arrow key increment and decrement

            if (board[row][col] !== 0) {
                cell.value = board[row][col];
                cell.classList.add('start-nums');
                cell.disabled = true; // Lock original numbers
            } else {
                cell.value = '';
            }
            
            cell.setAttribute('data-row', row);
            cell.setAttribute('data-col', col);

            if (row ===2 || row === 5) {
              cell.classList.add("horizontal-line");
            }
            if (col ===2 || col === 5) {
              cell.classList.add("vertical-line");
            }

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
    if (selectedCell && !selectedCell.disabled) {
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
      event.preventDefault(); //default behavior changes the number of the cell
      if (row > 0) {
        selectCell(row - 1, col);
      }
      break;
    case 'ArrowDown':
      event.preventDefault();
      if (row < 8) {
        selectCell(row + 1, col);
      }
      break;
    case 'ArrowLeft':
      event.preventDefault();
      if (col > 0) {
        selectCell(row, col - 1);
      }
      break;
    case 'ArrowRight':
      event.preventDefault();
      if (col < 8) {
        selectCell(row, col + 1);
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
  selectedCell.focus(); //selected cell changed, so focus this one
}

// Function to check if the solution is correct
function checkSolution() {
    let isCorrect = true;

  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      const cell = document.querySelector(`input[data-row='${row}'][data-col='${col}']`);
      const userValue = parseInt(cell.value, 10) || 0; // Read user input, treat empty as 0

      // Check if the filled value matches the solution, but ignore empty cells
      if (!userValue) {
        cell.style.backgroundColor = '#ffcccc'; // Highlight empty cells
        isCorrect = false;
      } else if (userValue !== 0 && userValue !== solution[row][col]) {
        cell.style.backgroundColor = '#ffcccc'; // Highlight incorrect cells
        isCorrect = false;
      } else {
        cell.style.backgroundColor = '#ccffcc'; // Highlight correct cells
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
document.addEventListener("DOMContentLoaded", () => {
  console.log("DOM fully loaded");
  const newGameButton = document.getElementById("new-game");
  const checkSolutionButton = document.getElementById("check-solution");
  
  console.log(newGameButton, checkSolutionButton);

  if (newGameButton && checkSolutionButton) {
    console.log("Both buttons found");

    newGameButton.onclick = () => {
      console.log("New Game Inline test Clicked");
    };
    newGameButton.addEventListener("click", () => {
      console.log("New Game button was clicked");
      createBoard();
    });
    checkSolutionButton.onclick = () => {
      console.log("Check Solution Inline test Clicked");
    };
    checkSolutionButton.addEventListener("click", () => {
      console.log("Check Solution button was clicked");
      checkSolution();
    });
  } else {
    console.error("Buttons not found");
  }
});


// Initialize the board when the page loads
window.onload = createBoard();
