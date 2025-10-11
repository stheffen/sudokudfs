import { useState, useEffect } from "react";
import "./app.css";

const SIZE = 9;

const createEmptyBoard = () => Array(SIZE).fill(0).map(() => Array(SIZE).fill(0));

const isValid = (board, r, c, num) => {
  for (let i = 0; i < 9; i++) {
    if (i !== c && board[r][i] === num) return false;
    if (i !== r && board[i][c] === num) return false;
  }

  const startRow = Math.floor(r / 3) * 3;
  const startCol = Math.floor(c / 3) * 3;
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) {
      const rr = startRow + i;
      const cc = startCol + j;
      if ((rr !== r || cc !== c) && board[rr][cc] === num) return false;
    }
  }
  return true;
};

// const fillRandomCells = (board, count = 15) => {
//   const newBoard = board.map(row => [...row]);
//   let filled = 0;
//   while (filled < count) {
//     const r = Math.floor(Math.random() * 9);
//     const c = Math.floor(Math.random() * 9);
//     const num = Math.floor(Math.random() * 9) + 1;

//     if (newBoard[r][c] === 0 && isValid(newBoard, r, c, num)) {
//       newBoard[r][c] = num;
//       filled++;
//     }
//   }
//   return newBoard;
// };

const App = () => {
  const [board, setBoard] = useState(createEmptyBoard());
  const [errors, setErrors] = useState(createEmptyBoard());
  const [solving, setSolving] = useState(false);

  // useEffect(() => {
  //   const randomBoard = fillRandomCells(createEmptyBoard(), 15);
  //   setBoard(randomBoard);
  // }, []);

  const handleChange = (r, c, value) => {
    const val = Number(value);
    const newBoard = board.map(row => [...row]);
    const newErrors = errors.map(row => [...row]);

    if (value === "") {
      newBoard[r][c] = 0;
      newErrors[r][c] = false;
    } else if (val >= 1 && val <= 9) {
      if (isValid(newBoard, r, c, val)) {
        newBoard[r][c] = val;
        newErrors[r][c] = false;
      } else {
        
        newBoard[r][c] = val;
        newErrors[r][c] = true;
      }
    } else {
      return;
    }

    setBoard(newBoard);
    setErrors(newErrors);
  };

  const sleep = (ms) => new Promise(res => setTimeout(res, ms));

  const solveSudoku = async (bd) => {
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        if (bd[r][c] === 0) {
          for (let num = 1; num <= 9; num++) {
            if (isValid(bd, r, c, num)) {
              bd[r][c] = num;
              setBoard(bd.map(row => [...row]));
              await sleep(0);
              if (await solveSudoku(bd)) return true;
              bd[r][c] = 0;
              setBoard(bd.map(row => [...row]));
              await sleep(0);
            }
          }
          return false;
        }
      }
    }
    return true;
  };

  const isBoardValid = (bd) => {
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        const val = bd[r][c];
        if (val !== 0 && !isValid(bd, r, c, val)) {
          return false;
        }
      }
    }
    return true;
  };

  const handleSolve = async () => {
    if (!isBoardValid(board)) {
      alert("Terdapat angka yang melanggar aturan Sudoku! Periksa kembali input Anda.");
      return;
    }
    setSolving(true);
    const newBoard = board.map(row => [...row]);
    const solved = await solveSudoku(newBoard);
    if (solved) {
      setBoard(newBoard);
    } else {
      alert("Tidak ada solusi yang valid!");
    }
    setSolving(false);
  };

  const handleReset = () => {
    setBoard(createEmptyBoard());
    setErrors(createEmptyBoard());
  };

  return (
    <div className="app-container">
      <h1>Sudoku Solver (DFS Algorithm)</h1>
      <div className="board-grid">
        {board.map((row, rIdx) =>
          row.map((cell, cIdx) => (
            <input
              key={`${rIdx}-${cIdx}`}
              value={cell === 0 ? "" : cell}
              onChange={(e) => handleChange(rIdx, cIdx, e.target.value)}
              className={`board-cell ${errors[rIdx][cIdx] ? "error" : ""}`}
              maxLength={1}
              readOnly={solving}
            />
          ))
        )}
      </div>

      <div className="button-container">
        <button onClick={handleSolve} disabled={solving}>
          {solving ? "Solving..." : "Solve"}
        </button>
        <button onClick={handleReset} disabled={solving}>
          Reset
        </button>
      </div>

      <p>
        Isi angka 1–9 sesuai aturan Sudoku. Jika merah, berarti melanggar aturan.
      </p>
    </div>
  );
}

export default App;