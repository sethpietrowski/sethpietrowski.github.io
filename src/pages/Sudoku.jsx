import React, { useState, useEffect } from "react";
import "../styles.css"
export default function Sudoku() {

  let initialBoard = [
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

  const [board, setBoard] = useState(initialBoard);
  const [selected, setSelected] = useState({ row: null, col: null });

  // Arrow key navigation
  useEffect(() => {
    const handleKey = (event) => {
      if (selected.row === null) return;

      let { row, col } = selected;
      switch (event.key) {
        case 'ArrowUp':
          event.preventDefault(); //default behavior changes the number of the cell
          if (row > 0) setSelected({ row: row - 1, col });
          break;
        case 'ArrowDown':
          event.preventDefault();
          if (row < 8) setSelected({ row: row + 1, col });
          break;
        case 'ArrowLeft':
          event.preventDefault();
          if (col > 0) setSelected({ row, col: col - 1 });
          break;
        case 'ArrowRight':
          event.preventDefault();
          if (col < 8) setSelected({ row, col: col + 1 });
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKey);

    return () => window.removeEventListener('keydown', handleKey);
  }, [selected]);

  //handle number input (keyboard/buttons)
  const handleInput = (value) => {
    if (selected.row === null) return;

    const { row, col } = selected;
    if (initialBoard[row][col] !== 0) return; // Lock original numbers

    const newBoard = board.map((r, i) => 
      r.map((c, j) => (i === row && j === col ? value : c))
    );
    setBoard(newBoard);
  };

  //check solution
  const checkSolution = () => {
    let correct = true;
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        if (board[r][c] !== solution[r][c]) {
          correct = false;
        }
      }
    }
    alert(correct ? "Congratulations! You solved the puzzle correctly." : "The solution is incorrect. Please try again.");
  };

  // new game button
  const newGame = () => {
    setBoard(initialBoard);
    setSelected({ row: null, col: null });
  };
  


  // // Create a Sudoku grid
  // const sudokuBoard = document.getElementById("sudoku-board");
  // const newGameButton = document.getElementById("new-game");


  // // Function to initialize the Sudoku board
  // function createBoard() {
  //     // Clear previous cells
  //     sudokuBoard.innerHTML = '';

  //     // Populate the grid
  //     for (let row = 0; row < 9; row++) {
  //         for (let col = 0; col < 9; col++) {
  //             const cell = document.createElement("input");
  //             cell.type = "number";
  //             cell.min = 1;
  //             cell.max = 9;
  //             cell.className = "cell";
  //             cell.setAttribute("step", "1"); //disable step functionality
  //             cell.setAttribute("onkeydown", "return event.key !== 'ArrowUp' && event.key !== 'ArrowDown';"); //disable arrow key increment and decrement

  //             if (board[row][col] !== 0) {
  //                 cell.value = board[row][col];
  //                 cell.classList.add('start-nums');
  //                 cell.disabled = true; // Lock original numbers
  //             } else {
  //                 cell.value = '';
  //             }
              
  //             cell.setAttribute('data-row', row);
  //             cell.setAttribute('data-col', col);

  //             if (row ===2 || row === 5) {
  //               cell.classList.add("horizontal-line");
  //             }
  //             if (col ===2 || col === 5) {
  //               cell.classList.add("vertical-line");
  //             }

  //             //Hande selecting cells
  //             cell.addEventListener('click', () => {
  //               if (selectedCell) {
  //                 selectedCell.classList.remove('selected');
  //               }
  //               selectedCell = cell;
  //               selectedCell.classList.add('selected');
  //               selectedCell.focus(); //have cell focus tracked
  //             })

  //             sudokuBoard.appendChild(cell);
  //         }
  //     }
  // }

  // function selectCell(row, col) {
  //   if (selectedCell) {
  //     selectedCell.classList.remove('selected');
  //   }
  //   selectedCell = document.querySelector(`input[data-row='${row}'][data-col='${col}']`);
  //   selectedCell.classList.add('selected');
  //   selectedCell.focus(); //selected cell changed, so focus this one
  // }

  // // Function to check if the solution is correct
  // function checkSolution() {
  //     let isCorrect = true;

  //   for (let row = 0; row < 9; row++) {
  //     for (let col = 0; col < 9; col++) {
  //       const cell = document.querySelector(`input[data-row='${row}'][data-col='${col}']`);
  //       const userValue = parseInt(cell.value, 10) || 0; // Read user input, treat empty as 0

  //       // Check if the filled value matches the solution, but ignore empty cells
  //       if (!userValue) {
  //         cell.style.backgroundColor = '#ffcccc'; // Highlight empty cells
  //         isCorrect = false;
  //       } else if (userValue !== 0 && userValue !== solution[row][col]) {
  //         cell.style.backgroundColor = '#ffcccc'; // Highlight incorrect cells
  //         isCorrect = false;
  //       } else {
  //         cell.style.backgroundColor = '#ccffcc'; // Highlight correct cells
  //       }
  //     }
  //   }
  // }


  // // Initialize the board when the page loads
  // window.onload = createBoard();
  
  return (
    <div className="container">
      <div id="banner-placeholder"></div>
      <h1>✏️Sudoku</h1>
      <div id="sudoku-container">
        <div id="game-area" className="sudoku-game">
            <div id="sudoku-board">
              {board.map((row, r) => 
                row.map((val, c) => {
                  const isSelected = selected.row === r && selected.col === c;
                  const isFixed = initialBoard[r][c] !== 0;
                  return (
                    <input
                      key={`${r}-${c}`}
                      type="text"
                      value={val === 0 ? "" : val}
                      onClick={() => setSelected({ row: r, col: c })}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (value === '' || /^[1-9]$/.test(value)) {
                          handleCellChange(r, c, value);
                        }
                      }
                      disabled={isFixed}
                      className={`cell
                        ${isFixed ? "start-nums" : ""}
                        ${isSelected ? "selected" : ""}
                        ${r === 2 || r === 5 ? "horizontal-line" : ""}
                        ${c === 2 || c === 5 ? "vertical-line" : ""}`}
                    />
                  );
                })
              )}
            </div>
            
            <div id="number-buttons">
              {[1,2,3,4,5,6,7,8,9].map(num => (
                <button 
                key={num} 
                className="number-button" 
                onClick={() => handleInput(num)}
                >
                  {num}
                </button>
              ))}   
            </div>
        </div>
        <button id="new-game">New Game</button>
        <button id="check-solution">Check Solution</button>
    </div>
  );
}