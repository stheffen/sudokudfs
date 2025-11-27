import { useState, useEffect, useRef } from "react";
import "./app.css";

// Ukuran papan Sudoku
const SIZE = 9;

// Helper: buat papan kosong
const createEmptyBoard = () =>
  Array(SIZE)
    .fill(0)
    .map(() => Array(SIZE).fill(0));

// Hitung index box 0..8
const getBoxIndex = (r, c) => Math.floor(r / 3) * 3 + Math.floor(c / 3);

// Delay kecil untuk animasi (ms). Untuk percepat: turunkan angka ini (mis. 0-5) atau set ke 0 untuk tanpa animasi.
const ANIM_DELAY_MS = 10;

// Sleep util
const sleep = (ms) => new Promise((res) => setTimeout(res, ms));

/*
  Optimasi:
  - rowUsed[r][num], colUsed[c][num], boxUsed[b][num] => O(1) cek validitas
  - MRV: pilih sel kosong dengan jumlah kandidat paling sedikit
*/
const solveSudokuDFSOptimized = async (bd, setBoard, animate = false, delayMs = ANIM_DELAY_MS) => {
  const rowUsed = Array.from({ length: 9 }, () => Array(10).fill(false));
  const colUsed = Array.from({ length: 9 }, () => Array(10).fill(false));
  const boxUsed = Array.from({ length: 9 }, () => Array(10).fill(false));
  const empties = [];

  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      const val = bd[r][c];
      if (val === 0) {
        empties.push([r, c]);
      } else {
        rowUsed[r][val] = true;
        colUsed[c][val] = true;
        boxUsed[getBoxIndex(r, c)][val] = true;
      }
    }
  }

  const dfs = async () => {
    if (empties.length === 0) return true;

    let bestIdx = -1;
    let bestCount = 10;
    let bestCandidates = null;

    for (let i = 0; i < empties.length; i++) {
      const [r, c] = empties[i];
      const box = getBoxIndex(r, c);
      const candidates = [];
      for (let num = 1; num <= 9; num++) {
        if (!rowUsed[r][num] && !colUsed[c][num] && !boxUsed[box][num]) {
          candidates.push(num);
        }
      }
      if (candidates.length === 0) {
        return false;
      }
      if (candidates.length < bestCount) {
        bestCount = candidates.length;
        bestIdx = i;
        bestCandidates = candidates;
        if (bestCount === 1) break;
      }
    }

    const [r, c] = empties[bestIdx];
    const last = empties.pop();
    if (bestIdx < empties.length) empties[bestIdx] = last;
    const box = getBoxIndex(r, c);

    for (const num of bestCandidates) {
      bd[r][c] = num;
      rowUsed[r][num] = true;
      colUsed[c][num] = true;
      boxUsed[box][num] = true;

      if (animate && setBoard) {
        setBoard(bd.map((row) => [...row]));
        if (delayMs > 0) await sleep(delayMs);
      }

      if (await dfs()) return true;

      bd[r][c] = 0;
      rowUsed[r][num] = false;
      colUsed[c][num] = false;
      boxUsed[box][num] = false;

      if (animate && setBoard) {
        setBoard(bd.map((row) => [...row]));
        if (delayMs > 0) await sleep(delayMs);
      }
    }

    empties.push([r, c]);
    if (bestIdx < empties.length - 1) {
      const tmp = empties[empties.length - 1];
      empties[empties.length - 1] = empties[bestIdx];
      empties[bestIdx] = tmp;
    }

    return false;
  };

  return await dfs();
};

// generate solved board (backtracking simple)
const generateSolvedBoard = () => {
  const board = createEmptyBoard();
  const numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9];

  const isValidSlow = (bd, r, c, num) => {
    for (let i = 0; i < 9; i++) {
      if (i !== c && bd[r][i] === num) return false;
      if (i !== r && bd[i][c] === num) return false;
    }
    const sr = Math.floor(r / 3) * 3;
    const sc = Math.floor(c / 3) * 3;
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        const rr = sr + i;
        const cc = sc + j;
        if ((rr !== r || cc !== c) && bd[rr][cc] === num) return false;
      }
    }
    return true;
  };

  const fillBoard = (bd) => {
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        if (bd[r][c] === 0) {
          const shuffled = [...numbers].sort(() => Math.random() - 0.5);
          for (let num of shuffled) {
            if (isValidSlow(bd, r, c, num)) {
              bd[r][c] = num;
              if (fillBoard(bd)) return true;
              bd[r][c] = 0;
            }
          }
          return false;
        }
      }
    }
    return true;
  };

  fillBoard(board);
  return board;
};

const removeCells = (board, removeCount) => {
  const newBoard = board.map((row) => [...row]);
  let removed = 0;
  while (removed < removeCount) {
    const r = Math.floor(Math.random() * 9);
    const c = Math.floor(Math.random() * 9);
    if (newBoard[r][c] !== 0) {
      newBoard[r][c] = 0;
      removed++;
    }
  }
  return newBoard;
};

// isValid publik (klasik) — hanya dipakai untuk validasi input user
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

const App = () => {
  const [board, setBoard] = useState(createEmptyBoard());
  const [errors, setErrors] = useState(createEmptyBoard());
  const [solving, setSolving] = useState(false);
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState("Pilih level");
  const [solveTime, setSolveTime] = useState(null); // waktu algoritma DFS
  const [originalPuzzle, setOriginalPuzzle] = useState(createEmptyBoard());

  // Fast mode (tanpa animasi)
  const [fastMode, setFastMode] = useState(false);

  // Timer manual (waktu pemain saat mengerjakan)
  const [manualElapsed, setManualElapsed] = useState(0); // detik
  const manualStartRef = useRef(null); // timestamp saat start/resume
  const manualIntervalRef = useRef(null);
  const manualRunningRef = useRef(false); // true jika timer sedang berjalan
  const manualAccumRef = useRef(0); // akumulasi detik sebelum pause

  // Opsi level
  const options = {
    Easy: 40,
    Medium: 50,
    Hard: 60,
  };

  // Saat level dipilih => generate puzzle baru dan reset timer/manual state
  useEffect(() => {
    if (selected !== "Pilih level") {
      const removeCount = options[selected];
      const solved = generateSolvedBoard();
      const puzzle = removeCells(solved, removeCount);
      setBoard(puzzle);
      setOriginalPuzzle(puzzle.map((row) => [...row]));
      setErrors(createEmptyBoard());
      setSolveTime(null);

      resetManualTimerState();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected]);

  useEffect(() => {
    return () => {
      clearManualInterval();
    };
  }, []);

  const clearManualInterval = () => {
    if (manualIntervalRef.current) {
      clearInterval(manualIntervalRef.current);
      manualIntervalRef.current = null;
    }
  };

  const resetManualTimerState = () => {
    clearManualInterval();
    manualRunningRef.current = false;
    manualStartRef.current = null;
    manualAccumRef.current = 0;
    setManualElapsed(0);
  };

  const startManualTimer = () => {
    if (manualRunningRef.current) return;
    manualRunningRef.current = true;
    manualStartRef.current = Date.now();
    manualIntervalRef.current = setInterval(() => {
      const elapsedMs = Date.now() - manualStartRef.current;
      setManualElapsed(manualAccumRef.current + Math.floor(elapsedMs / 1000));
    }, 250); // update lebih responsif
  };

  const pauseManualTimer = () => {
    if (!manualRunningRef.current) return;
    // commit elapsed to accum, clear interval
    const elapsedMs = Date.now() - manualStartRef.current;
    manualAccumRef.current += Math.floor(elapsedMs / 1000);
    clearManualInterval();
    manualRunningRef.current = false;
    manualStartRef.current = null;
    setManualElapsed(manualAccumRef.current);
  };

  const stopManualTimer = () => {
    // stop and reset accum
    clearManualInterval();
    manualRunningRef.current = false;
    manualStartRef.current = null;
    manualAccumRef.current = 0;
    setManualElapsed(0);
  };

  const handleChange = (r, c, value) => {
    if (solving) return;

    // mulai timer manual saat input pertama (jika puzzle ada) — hanya jika belum pernah start
    if (!manualRunningRef.current && manualAccumRef.current === 0 && originalPuzzle.some((row) => row.some((cell) => cell !== 0))) {
      startManualTimer();
    }

    const newBoard = board.map((row) => [...row]);
    const newErrors = errors.map((row) => [...row]);

    if (value === "") {
      newBoard[r][c] = 0;
      newErrors[r][c] = false;
    } else {
      const char = value.slice(-1);
      const val = Number(char);
      if (!Number.isNaN(val) && val >= 1 && val <= 9) {
        newBoard[r][c] = val;
        if (isValid(newBoard, r, c, val)) {
          newErrors[r][c] = false;
        } else {
          newErrors[r][c] = true;
        }
      } else {
        return;
      }
    }

    setBoard(newBoard);
    setErrors(newErrors);
  };

  const isBoardValid = (bd) => {
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        const val = bd[r][c];
        if (val !== 0 && !isValid(bd, r, c, val)) return false;
      }
    }
    return true;
  };

  const handleSolve = async () => {
    // jika papan penuh -> anggap selesai manual
    const isFull = board.every((row) => row.every((cell) => cell !== 0));
    if (isFull) {
      if (!isBoardValid(board)) {
        alert("Terdapat angka yang melanggar aturan Sudoku!");
        return;
      }
      // stop timer manual
      pauseManualTimer();
      alert(`Puzzle sudah terisi. Waktu pengerjaan manual: ${formatSeconds(manualElapsed)}`);
      return;
    }

    if (!isBoardValid(board)) {
      alert("Terdapat angka yang melanggar aturan Sudoku!");
      return;
    }

    setSolving(true);
    setSolveTime(null);

    // salin board untuk solver (mutasi bd di solver)
    const newBoard = board.map((row) => [...row]);

    const start = performance.now();
    // jika fastMode: animate=false dan delay 0 (paling cepat)
    const animate = !fastMode;
    const delay = fastMode ? 0 : ANIM_DELAY_MS;
    const solved = await solveSudokuDFSOptimized(newBoard, setBoard, animate, delay);
    const end = performance.now();
    const duration = ((end - start) / 1000).toFixed(3);
    setSolveTime(duration);

    if (solved) {
      setBoard(newBoard.map((row) => [...row]));
      // stop/pause manual timer ketika solver menyelesaikan
      pauseManualTimer();
    } else {
      alert("Tidak ada solusi yang valid!");
    }

    setSolving(false);
  };

  // ===== Tombol: New Puzzle (buat puzzle baru, set original), Regenerate (same difficulty), Reset to original =====
  const createNewPuzzle = (level = null) => {
    const lvl = level || (selected === "Pilih level" ? "Easy" : selected);
    const removeCount = options[lvl] || 40;
    const solved = generateSolvedBoard();
    const puzzle = removeCells(solved, removeCount);
    setBoard(puzzle);
    setOriginalPuzzle(puzzle.map((row) => [...row]));
    setErrors(createEmptyBoard());
    setSolveTime(null);
    resetManualTimerState();
  };

  const regenerateSameDifficulty = () => {
    const lvl = selected === "Pilih level" ? "Easy" : selected;
    createNewPuzzle(lvl);
  };

  const resetToOriginal = () => {
    // jika originalPuzzle kosong, buat new puzzle default
    if (!originalPuzzle.some((row) => row.some((cell) => cell !== 0))) {
      createNewPuzzle(selected === "Pilih level" ? "Easy" : selected);
      return;
    }
    setBoard(originalPuzzle.map((row) => [...row]));
    setErrors(createEmptyBoard());
    setSolveTime(null);
    stopManualTimer();
    // tetap simpan originalPuzzle; timer reset tetapi manualAccum juga direset
    manualAccumRef.current = 0;
    setManualElapsed(0);
  };
  // ===============================================================

  const formatSeconds = (secs) => {
    const s = Number(secs || 0);
    const minutes = Math.floor(s / 60)
      .toString()
      .padStart(2, "0");
    const seconds = (s % 60).toString().padStart(2, "0");
    return `${minutes}:${seconds}`;
  };

  return (
    <>

      <div className="app-container">
        <h1>Tugas Sistem Multimedia</h1>
        <h1>Sudoku Solver (Optimized DFS)</h1>

        <div>
          <strong>Waktu pengerjaan manual:</strong>{" "}
          <span>{formatSeconds(manualElapsed)}</span>
          {manualRunningRef.current ? " (sedang berjalan)" : " (berhenti)"}
        </div>
        <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 8 }}>

          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <button onClick={() => (manualRunningRef.current ? pauseManualTimer() : startManualTimer())}>
              {manualRunningRef.current ? "Pause Timer" : "Start Timer"}
            </button>
            <button onClick={stopManualTimer}>Stop & Reset Timer</button>
          </div>

          <label style={{ marginLeft: 12 }}>
            <input
              type="checkbox"
              checked={fastMode}
              onChange={(e) => setFastMode(e.target.checked)}
              disabled={solving}
            />{" "}
            Fast mode (no animation)
          </label>
        </div>

        <div className="board-grid">
          {board.map((row, rIdx) =>
            row.map((cell, cIdx) => {
              const borders3x3 = `
        ${rIdx % 3 === 0 ? "border-top" : ""}
        ${cIdx % 3 === 0 ? "border-left" : ""}
        ${rIdx === 8 ? "border-bottom" : ""}
        ${cIdx === 8 ? "border-right" : ""}
      `;
              const isOriginal =
                originalPuzzle[rIdx] && originalPuzzle[rIdx][cIdx] !== 0;
              return (
                <input
                  key={`${rIdx}-${cIdx}`}
                  value={cell === 0 ? "" : cell}
                  onChange={(e) => handleChange(rIdx, cIdx, e.target.value)}
                  className={`board-cell ${errors[rIdx][cIdx] ? "error" : ""} ${isOriginal ? "original" : ""} ${borders3x3}`}
                  maxLength={1}
                  readOnly={solving || isOriginal}
                  title={isOriginal ? "Original (not editable)" : undefined}
                />
              );
            })
          )}
        </div>

        <div className="controls" style={{ marginTop: 12 }}>
          <div className="button-container" style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button onClick={handleSolve} disabled={solving}>
              {solving ? "Solving..." : "Solve (otomatis)"}
            </button>

            <button onClick={regenerateSameDifficulty} disabled={solving}>
              Regenerate (same difficulty)
            </button>

            <button onClick={resetToOriginal} disabled={solving}>
              Reset to original
            </button>
          </div>

        </div>
        <div className="dropdown" style={{ marginTop: 8 }}>
          <button onClick={() => setOpen(!open)}>{selected} </button>
          {open && (
            <div className="dropdown-menu">
              {Object.keys(options).map((opt) => (
                <div
                  key={opt}
                  className="dropdown-item"
                  onClick={() => {
                    setSelected(opt);
                    setOpen(false);
                  }}
                >
                  {opt}
                </div>
              ))}
            </div>
          )}
        </div>

        {solveTime && (
          <p className="solve-time" style={{ marginTop: 12 }}>
            Waktu algoritma DFS (optimasi MRV + lookup){fastMode ? " — fast mode (no animation)" : ""}: <b>{solveTime} detik</b>
          </p>
        )}

        <p style={{ marginTop: 12 }}>
          Isi angka 1–9 sesuai aturan Sudoku. Jika merah, berarti melanggar aturan.
          <br />
          Pilih level terlebih dahulu untuk memulai permainan.
        </p>
      </div>
      <div className="app-container" style={{ marginTop: 20 }}>
        <h2>Video Tutorial Bermain Sudoku</h2>
        <iframe
          title="youtube"
          src="https://www.youtube.com/embed/1oTDTHmzj_Q"
          width="100%"
          height="650"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        ></iframe>
      </div>
      <div className="created-container">
        <h1>Dibuat Oleh</h1>
        <div className="created">
          <div className="video-container">
            <img className="video" src="eri.jpeg" alt="erika" />
            <label>Erika P</label>
          </div>
          <div className="video-container">
            <img className="video" src="ang.jpeg" alt="angel" />
            <label>Angel V</label>
          </div>
          <div className="video-container">
            <img className="video" src="ken.jpeg" alt="kenrick" />
            <label>Kenrick</label>
          </div>
          <div className="video-container">
            <img className="video" src="glo.jpeg" alt="glorina" />
            <label>Glorina A</label>
          </div>
          <div className="video-container">
            <img className="video" src="sthe.jpeg" alt="stheffen" />
            <label>Stheffen</label>
          </div>
        </div>
      </div>
    </>
  );
};

export default App;
