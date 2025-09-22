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
  const [message, setMessage] = useState(null);

  // Arrow key navigation
  useEffect(() => {
    const handleKey = (event) => {
      if (selected.row === null || selected.col === null) return;

      let { row, col } = selected;
      switch (event.key) {
        case 'ArrowUp':
          event.preventDefault(); //default behavior changes the number of the cell
          if (row > 0) {
            setSelected({ row: row - 1, col });
            setTimeout(() => {
              const cell = document.querySelector(`input[data-row='${row - 1}'][data-col='${col}']`);
              if (cell) cell.focus();
            }, 0);
          }
          break;
        case 'ArrowDown':
          event.preventDefault();
          if (row < 8) {
            setSelected({ row: row + 1, col });
            setTimeout(() => {
              const cell = document.querySelector(`input[data-row='${row + 1}'][data-col='${col}']`);
              if (cell) cell.focus();
            }, 0);
          }
          break;
        case 'ArrowLeft':
          event.preventDefault();
          if (col > 0) {
            setSelected({ row, col: col - 1 });
            setTimeout(() => {
              const cell = document.querySelector(`input[data-row='${row}'][data-col='${col - 1}']`);
              if (cell) cell.focus();
            }, 0);
          }
          break;
        case 'ArrowRight':
          event.preventDefault();
          if (col < 8) {
            setSelected({ row, col: col + 1 });
            setTimeout(() => {
              const cell = document.querySelector(`input[data-row='${row}'][data-col='${col + 1}']`);
              if (cell) cell.focus();
            }, 0);
          }
          break;
        case '1': case '2': case '3': case '4': case '5':
        case '6': case '7': case '8': case '9':
          event.preventDefault();
          handleInput(parseInt(event.key));
          break;
        case 'Backspace': case 'Delete': case ' ':
          event.preventDefault();
          handleInput(0);
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKey);

    return () => window.removeEventListener('keydown', handleKey);
  }, [selected, board, initialBoard]);

  //handle number input (keyboard/buttons)
  const handleInput = (value) => {
    if (selected.row === null || selected.col === null) return;

    const { row, col } = selected;
    if (initialBoard[row][col] !== 0) return; // Lock original numbers

    const newBoard = [...board];
    newBoard[row][col] = value;
    setBoard(newBoard);
  };

  //check solution
  const checkSolution = () => {
    let incorrectCount = 0;
    let emptyCount = 0;

    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        if (board[r][c] === 0) {
          emptyCount++;
        } else if (board[r][c] !== solution[r][c]) {
          incorrectCount++;
        }
      }
    }

    if (emptyCount > 0) {
      setMessage({
        type: 'warning',
        text: 'Please fill in all cells before checking solution.',
      });
    } else if (incorrectCount > 0) {
      setMessage({
        type: 'error',
        text: 'The solution is incorrect. Please try again.',
        incorrectCount: incorrectCount
      });
    } else {
      setMessage({
        type: 'success',
        text: 'Congratulations, you solved the puzzle correctly!',
      });
    }
  };

  // new game button
  const newGame = () => {
    setBoard(initialBoard.map(row => [...row]));
    setSelected({ row: null, col: null });
    setMessage(null);
  };
  
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
                    disabled={isFixed}
                    value={val || ""}
                    data-row={r}
                    data-col={c}
                    onClick={() => setSelected({ row: r, col: c })}
                    className={`cell
                      ${isFixed ? "start-nums" : ""}
                      ${isSelected ? "selected" : ""}
                      ${r === 2 || r === 5 ? "horizontal-line" : ""}
                      ${c === 2 || c === 5 ? "vertical-line" : ""}`}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value === '' || /^[1-9]$/.test(value)) {
                        handleInput(value === '' ? 0 : parseInt(value));
                      }
                    }}
                  />
                );
              })
            )}
          </div>

          {message && (
            <div id="message-area">
              <div className={`message ${message.type}`}>
                {message.text}
              </div>
              {message.incorrectCount !== undefined && (
                <div className="incorrect-count">
                  Incorrect Count: {message.incorrectCount}
                </div>
              )}
            </div>
          )}
        </div>
            
        <div id="controls-area">
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
          <button id="new-game" onClick={newGame}>New Game</button>
          <button id="check-solution" onClick={checkSolution}>Check Solution</button>
        </div>
      </div>
    </div>
  );
}