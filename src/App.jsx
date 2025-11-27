import { useEffect, useRef, useState } from "react";
import "./app.css";

const SIZE = 9;
const createEmptyBoard = () =>
  Array(SIZE)
    .fill(0)
    .map(() => Array(SIZE).fill(0));
const getBoxIndex = (r, c) => Math.floor(r / 3) * 3 + Math.floor(c / 3);

const ANIM_DELAY_MS = 10;
const sleep = (ms) => new Promise((res) => setTimeout(res, ms));

const solveSudokuDFSOptimized = async (bd, setBoard, animate = false, delayMs = ANIM_DELAY_MS) => {
  const rowUsed = Array.from({ length: 9 }, () => Array(10).fill(false));
  const colUsed = Array.from({ length: 9 }, () => Array(10).fill(false));
  const boxUsed = Array.from({ length: 9 }, () => Array(10).fill(false));
  const empties = [];

  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      const val = bd[r][c];
      if (val === 0) empties.push([r, c]);
      else {
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
        if (!rowUsed[r][num] && !colUsed[c][num] && !boxUsed[box][num]) candidates.push(num);
      }
      if (candidates.length === 0) return false;
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
  const coords = [];
  for (let r = 0; r < 9; r++) for (let c = 0; c < 9; c++) coords.push([r, c]);
  while (removed < removeCount && coords.length) {
    const idx = Math.floor(Math.random() * coords.length);
    const [r, c] = coords.splice(idx, 1)[0];
    if (newBoard[r][c] !== 0) {
      newBoard[r][c] = 0;
      removed++;
    }
  }
  return newBoard;
};

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

const options = { Easy: 40, Medium: 50, Hard: 60 };

const App = () => {
  const [board, setBoard] = useState(createEmptyBoard());
  const [errors, setErrors] = useState(createEmptyBoard());
  const [solving, setSolving] = useState(false);
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState("Pilih level");
  const [solveTime, setSolveTime] = useState(null);
  const [originalPuzzle, setOriginalPuzzle] = useState(createEmptyBoard());

  const [fastMode, setFastMode] = useState(false);

  const [manualElapsed, setManualElapsed] = useState(0);
  const manualStartRef = useRef(null);
  const manualIntervalRef = useRef(null);
  const manualRunningRef = useRef(false);
  const manualAccumRef = useRef(0);

  const audioRef = useRef(null);
  const [audioPlaying, setAudioPlaying] = useState(false); // whether audio element currently playing
  const [audioMuted, setAudioMuted] = useState(false);
  const [audioUserPaused, setAudioUserPaused] = useState(false); // user explicitly paused audio
  const AUDIO_TARGET_VOLUME = 0.35;

  useEffect(() => {
    const solved = generateSolvedBoard();
    const puzzle = removeCells(solved, options.Easy);
    setBoard(puzzle);
    setOriginalPuzzle(puzzle.map((row) => [...row]));
  }, []);

  useEffect(() => {
    return () => {
      if (manualIntervalRef.current) clearInterval(manualIntervalRef.current);
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

  const fadeInAudio = (a, target = AUDIO_TARGET_VOLUME, duration = 700) => {
    if (!a) return;
    try {
      a.volume = 0;
      const steps = 20;
      const stepTime = Math.max(10, Math.floor(duration / steps));
      const inc = target / steps;
      let step = 0;
      const h = setInterval(() => {
        step++;
        a.volume = Math.min(target, +(a.volume + inc).toFixed(4));
        if (step >= steps) {
          clearInterval(h);
          a.volume = target;
        }
      }, stepTime);
    } catch (e) {
    }
  };

  const playAudioOnGesture = async () => {
    if (audioUserPaused) return;
    const a = audioRef.current;
    if (!a) return;
    try {
      a.muted = false;
      a.loop = true;
      a.volume = 0;
      await a.play();
      setAudioPlaying(true);
      setAudioMuted(false);
      fadeInAudio(a, AUDIO_TARGET_VOLUME, 700);
    } catch (err) {
      try {
        a.muted = true;
        a.volume = 0;
        await a.play();
        setAudioPlaying(false);
        setAudioMuted(true);
      } catch (e2) {
        console.warn("Audio play failed even on gesture:", e2);
      }
    }
  };

  const startManualTimer = () => {
    // start or resume timer; also attempt to start audio (gesture)
    playAudioOnGesture();

    if (manualRunningRef.current) return;
    manualRunningRef.current = true;
    manualStartRef.current = Date.now();
    manualIntervalRef.current = setInterval(() => {
      const elapsedMs = Date.now() - manualStartRef.current;
      setManualElapsed(manualAccumRef.current + Math.floor(elapsedMs / 1000));
    }, 250);
  };

  const pauseManualTimer = () => {
    if (!manualRunningRef.current) return;
    const elapsedMs = Date.now() - manualStartRef.current;
    manualAccumRef.current += Math.floor(elapsedMs / 1000);
    clearManualInterval();
    manualRunningRef.current = false;
    manualStartRef.current = null;
    setManualElapsed(manualAccumRef.current);
  };

  const stopManualTimer = () => {
    clearManualInterval();
    manualRunningRef.current = false;
    manualStartRef.current = null;
    manualAccumRef.current = 0;
    setManualElapsed(0);
  };

  const handleTogglePlayAudio = async () => {
    const a = audioRef.current;
    if (!a) return;
    if (audioPlaying) {
      try {
        a.pause();
      } catch { }
      setAudioPlaying(false);
      setAudioUserPaused(true);
    } else {
      try {
        a.muted = false;
        a.loop = true;
        a.volume = 0;
        await a.play();
        fadeInAudio(a, AUDIO_TARGET_VOLUME, 500);
        setAudioPlaying(true);
        setAudioMuted(false);
        setAudioUserPaused(false);
      } catch (err) {
        try {
          a.muted = true;
          await a.play();
          setAudioPlaying(false);
          setAudioMuted(true);
        } catch (e2) {
          console.warn("Play audio failed:", e2);
        }
      }
    }
  };



  const handleVolumeChange = (val) => {
    const v = Number(val);
    const a = audioRef.current;
    if (a) {
      a.volume = v;
      if (v > 0) {
        a.muted = false;
        setAudioMuted(false);
      }
    }
  };

  const handleChange = (r, c, value) => {
    if (solving) return;

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
        if (isValid(newBoard, r, c, val)) newErrors[r][c] = false;
        else newErrors[r][c] = true;
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
    const isFull = board.every((row) => row.every((cell) => cell !== 0));
    if (isFull) {
      if (!isBoardValid(board)) {
        alert("Terdapat angka yang melanggar aturan Sudoku!");
        return;
      }
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

    const newBoard = board.map((row) => [...row]);
    const start = performance.now();
    const animate = !fastMode;
    const delay = fastMode ? 0 : ANIM_DELAY_MS;
    const solved = await solveSudokuDFSOptimized(newBoard, setBoard, animate, delay);
    const end = performance.now();
    const duration = ((end - start) / 1000).toFixed(3);
    setSolveTime(duration);

    if (solved) {
      setBoard(newBoard.map((row) => [...row]));
      pauseManualTimer();
    } else {
      alert("Tidak ada solusi yang valid!");
    }

    setSolving(false);
  };

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
    if (!originalPuzzle.some((row) => row.some((cell) => cell !== 0))) {
      createNewPuzzle(selected === "Pilih level" ? "Easy" : selected);
      return;
    }
    setBoard(originalPuzzle.map((row) => [...row]));
    setErrors(createEmptyBoard());
    setSolveTime(null);
    stopManualTimer();
    manualAccumRef.current = 0;
    setManualElapsed(0);
  };

  const formatSeconds = (secs) => {
    const s = Number(secs || 0);
    const minutes = Math.floor(s / 60).toString().padStart(2, "0");
    const seconds = (s % 60).toString().padStart(2, "0");
    return `${minutes}:${seconds}`;
  };

  return (
    <>
      <audio ref={audioRef} src="backsound.mp3" preload="auto" playsInline />
      <div className="app-container">
        <h1>Tugas Sistem Multimedia</h1>
        <h2>Sudoku Solver (Optimized DFS)</h2>
        <div>
          <strong>Waktu pengerjaan manual:</strong>{" "}
          <span>{formatSeconds(manualElapsed)}</span>
          {manualRunningRef.current ? " (sedang berjalan)" : " (berhenti)"}
        </div>
        <div style={{ marginLeft: 12, display: "flex", gap: 8, alignItems: "center" }}>
          <button onClick={handleTogglePlayAudio}>{audioPlaying ? "Pause Backsound" : "Play Backsound"}</button>
          <label style={{ display: "flex", gap: 6, alignItems: "center" }}>
            Vol
            <input type="range" min={0} max={1} step={0.01} defaultValue={AUDIO_TARGET_VOLUME} onChange={(e) => handleVolumeChange(e.target.value)} style={{ width: 100 }} />
          </label>
        </div>
        <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 8 }}>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <button onClick={() => (manualRunningRef.current ? pauseManualTimer() : startManualTimer())}>
              {manualRunningRef.current ? "Pause Timer" : "Start Timer"}
            </button>
            <button onClick={stopManualTimer}>Stop & Reset Timer</button>
          </div>

          <label style={{ marginLeft: 12 }}>
            <input type="checkbox" checked={fastMode} onChange={(e) => setFastMode(e.target.checked)} disabled={solving} />{" "}
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
              const isOriginal = originalPuzzle[rIdx] && originalPuzzle[rIdx][cIdx] !== 0;
              return (
                <input
                  key={`${rIdx}-${cIdx}`}
                  value={cell === 0 ? "" : cell}
                  onChange={(e) => handleChange(rIdx, cIdx, e.target.value)}
                  onKeyDown={(e) => {
                    const allowed = ["Backspace", "Delete", "ArrowLeft", "ArrowRight", "Tab"];
                    if (allowed.includes(e.key)) return;

                    if (!/^[1-9]$/.test(e.key)) {
                      e.preventDefault(); // blok selain angka 1-9
                    }
                  }}
                  onPaste={(e) => {
                    const text = e.clipboardData.getData("text") || "";
                    // hanya izinkan satu digit 1-9, sisanya batalkan paste
                    if (!/^[1-9]$/.test(text.trim())) {
                      e.preventDefault();
                    }
                  }}

                  type="tel"                
                  inputMode="numeric"       
                  pattern="[1-9]"           
                  autoComplete="off"
                  enterKeyHint="done"       
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
                    createNewPuzzle(opt);
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
          height="450"
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
