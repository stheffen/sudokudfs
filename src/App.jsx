import { useState } from "react";
import "./app.css";

export default function App() {
 // Buat board kosong (9x9)
  const emptyBoard = () =>
    Array.from({ length: 9 }, () => Array(9).fill(0));

  const [board, setBoard] = useState(emptyBoard());
  const [solving, setSolving] = useState(false);

  // Ubah angka di cell
  const handleChange = (r, c, val) => {
    const num = Number(val) || 0;
    const copy = board.map((row) => [...row]);
    copy[r][c] = num;
    setBoard(copy);
  };

  // Cek apakah num valid di posisi (r, c)
  const isValid = (bd, num, r, c) => {
    // Baris dan kolom
    for (let i = 0; i < 9; i++)
      if (bd[r][i] === num || bd[i][c] === num) return false;

    // Blok 3x3
    const sr = Math.floor(r / 3) * 3;
    const sc = Math.floor(c / 3) * 3;
    for (let i = 0; i < 3; i++)
      for (let j = 0; j < 3; j++)
        if (bd[sr + i][sc + j] === num) return false;

    return true;
  };

  const sleep = (ms) => new Promise((res) => setTimeout(res, ms));
  
  // Fungsi DFS 
  const solve = async (bd) => {
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        if (bd[r][c] === 0) {
          for (let num = 1; num <= 9; num++) {
            if (isValid(bd, num, r, c)) {
              bd[r][c] = num;
              setBoard(bd.map((row) => [...row]));
              await sleep(10); 
              if (await solve(bd)) return true;
              bd[r][c] = 0;
              setBoard(bd.map((row) => [...row]));
              await sleep(10);
            }
          }
          return false; // tidak ada angka valid
        }
      }
    }
    return true; // selesai
  };

  // Tombol "Solve"
  const handleSolve = () => {
    if (solving) return;
    setSolving(true);
    const clone = board.map((r) => [...r]);
    solve(clone);
    setBoard(clone);
    setSolving(false);
  };

  // Tombol "Reset"
  const handleReset = () => setBoard(emptyBoard());

  return (
    <div className="app-container">
      <h1>Sudoku Solver (DFS Algoritm)</h1>
      <div className="board-grid">
        {board.map((row, rIdx) =>
          row.map((cell, cIdx) => (
            <input
              key={`${rIdx}-${cIdx}`}
              value={cell === 0 ? "" : cell}
              onChange={(e) => handleChange(rIdx, cIdx, e.target.value)}
              className="board-cell"
              maxLength={1}
            />
          ))
        )}
      </div>
      

      <div className="button-container">
        <button
          onClick={handleSolve}
          disabled={solving}
        >
          {solving ? "Solving..." : "Solve"}
        </button>
        <button
          onClick={handleReset}
          disabled={solving}
        >
          Reset
        </button>
      </div>

      <p>
        Isi angka 1–9 lalu klik <b>Solve</b> untuk menjalankan DFS Backtracking.
      </p>
    </div>
  );
}
