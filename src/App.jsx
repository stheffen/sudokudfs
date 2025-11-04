import { useState, useEffect } from "react";
import "./app.css";

// Ukuran papan Sudoku
const SIZE = 9;

// Fungsi untuk membuat papan Sudoku kosong
const createEmptyBoard = () =>
  // Buat array 9x9 diisi dengan nol
  Array(SIZE)
    .fill(0)
    .map(() => Array(SIZE).fill(0));

// Fungsi untuk memeriksa apakah penempatan angka valid di papan tiap baris dan kolom
const isValid = (board, r, c, num) => {
  // Periksa semua baris dan kolom
  for (let i = 0; i < 9; i++) {
    // Periksa baris dan kolom jika ada angka yang sama makan kembalikan false
    if (i !== c && board[r][i] === num) return false;
    if (i !== r && board[i][c] === num) return false;
  }

  // Periksa subgrid 3x3 untuk memastikan angka tidak ada yang sama
  const startRow = Math.floor(r / 3) * 3;
  const startCol = Math.floor(c / 3) * 3;
  // Iterasi dalam subgrid untuk menelusuri 9 sel dalam subgrid 3×3
  for (let i = 0; i < 3; i++) {
    // Iterasi dalam subgrid untuk menelusuri 9 sel dalam subgrid 3×3
    for (let j = 0; j < 3; j++) {
      // Menghitung posisi sebenarnya di papan Sudoku, Untuk memeriksa semua 9 sel di blok 3x3.
      const rr = startRow + i;
      const cc = startCol + j;
      // memastikan tidak memeriksa dirinya sendiri dan mengecek apakah angka num sudah ada di salah satu sel subgrid
      // Jika ketemu langsung return false karena angka tidak boleh diulang di subgrid
      if ((rr !== r || cc !== c) && board[rr][cc] === num) return false;
    }
  }
  // Jika tidak ada konflik, penempatan valid
  return true;
};

// Fungsi untuk menunda eksekusi (untuk animasi)
const sleep = (ms) => new Promise((res) => setTimeout(res, ms));

// Fungsi untuk menyelesaikan Sudoku menggunakan DFS Algorithm
const solveSudoku = async (bd, setBoard, animate = false) => {
  // Cari sel kosong
  for (let r = 0; r < 9; r++) {
    // Iterasi kolom
    for (let c = 0; c < 9; c++) {
      // Jika sel kosong ditemukan
      if (bd[r][c] === 0) {
        // Coba angka 1-9
        for (let num = 1; num <= 9; num++) {
          // Periksa apakah penempatan valid
          if (isValid(bd, r, c, num)) {
            // Tempatkan angka
            bd[r][c] = num;
            // Jika animasi diaktifkan, perbarui papan dan tunggu sebentar
            if (animate && setBoard) {
              // Perbarui papan dengan salinan baru untuk memicu render ulang
              setBoard(bd.map((row) => [...row]));
              await sleep(0.1);
            }
            // Rekursif untuk menyelesaikan sisa papan
            if (await solveSudoku(bd, setBoard, animate)) return true;
            // Jika tidak berhasil, hapus angka (backtrack)
            bd[r][c] = 0;
          }
        }
        // Jika tidak ada angka yang valid, kembalikan false
        return false;
      }
    }
  }
  // Jika seluruh papan terisi, kembalikan true
  return true;
};

// Fungsi untuk menghasilkan papan Sudoku yang sudah terisi
const generateSolvedBoard = () => {
  // Buat papan kosong
  const board = createEmptyBoard();
  // Daftar angka 1-9
  const numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9];

  // Fungsi rekursif untuk mengisi papan
  const fillBoard = (bd) => {
    // Iterasi baris
    for (let r = 0; r < 9; r++) {
      // Iterasi kolom
      for (let c = 0; c < 9; c++) {
        // Jika sel kosong ditemukan
        if (bd[r][c] === 0) {
          // Acak urutan angka
          const shuffled = [...numbers].sort(() => Math.random() - 0.5);
          // Coba setiap angka dalam urutan acak
          for (let num of shuffled) {
            // Periksa apakah penempatan valid
            if (isValid(bd, r, c, num)) {
              // Tempatkan angka
              bd[r][c] = num;
              // Rekursif untuk mengisi sisa papan
              if (fillBoard(bd)) return true;
              // Jika tidak berhasil, hapus angka (backtrack)
              bd[r][c] = 0;
            }
          }
          // Jika tidak ada angka yang valid, kembalikan false
          return false;
        }
      }
    }
    // Jika seluruh papan terisi, kembalikan true
    return true;
  };
  // Mulai mengisi papan
  fillBoard(board);
  // Kembalikan papan yang sudah terisi
  return board;
};

// Fungsi untuk menghapus sel dari papan untuk membuat teka-teki
const removeCells = (board, removeCount) => {
  // Salin papan untuk dimodifikasi
  const newBoard = board.map((row) => [...row]);
  // Hitung berapa banyak sel yang telah dihapus
  let removed = 0;

  // Hapus sel secara acak hingga mencapai jumlah yang diinginkan
  while (removed < removeCount) {
    // Pilih baris dan kolom acak
    const r = Math.floor(Math.random() * 9);
    const c = Math.floor(Math.random() * 9);
    // Jika sel belum dihapus, hapus dan tingkatkan penghitung
    if (newBoard[r][c] !== 0) {
      newBoard[r][c] = 0;
      
      removed++;
    }
  }
  // Kembalikan papan dengan sel yang dihapus
  return newBoard;
};

const App = () => {
  const [board, setBoard] = useState(createEmptyBoard());
  const [errors, setErrors] = useState(createEmptyBoard());
  const [solving, setSolving] = useState(false);
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState("Pilih level");
  const [solveTime, setSolveTime] = useState(null); //Tambahkan state untuk waktu

  // Opsi level dengan jumlah sel yang dihapus
  const options = {
    Easy: 40,
    Medium: 50,
    Hard: 60,
  };

  // Reset papan saat level dipilih
  useEffect(() => {
    if (selected !== "Pilih level") handleReset();
  }, [selected]);

  // Tangani perubahan input sel
  const handleChange = (r, c, value) => {
    // Konversi nilai input ke angka
    const val = Number(value);
    // Salin papan dan kesalahan saat ini
    const newBoard = board.map((row) => [...row]);
    // Salin status kesalahan saat ini
    const newErrors = errors.map((row) => [...row]);

    // Validasi input
    if (value === "") {
      // Kosongkan sel
      newBoard[r][c] = 0;
      // Hapus kesalahan
      newErrors[r][c] = false;
      // Jika input bukan angka 1-9, abaikan
    } else if (val >= 1 && val <= 9) {
      // Periksa validitas penempatan
      if (isValid(newBoard, r, c, val)) {
        // Perbarui papan dan hapus kesalahan
        newBoard[r][c] = val;
        newErrors[r][c] = false;
        // Jika melanggar aturan, tandai sebagai kesalahan
      } else {
        // Perbarui papan dan tandai kesalahan
        newBoard[r][c] = val;
        newErrors[r][c] = true;
      }
    }

    // Perbarui state papan dan kesalahan
    setBoard(newBoard);
    setErrors(newErrors);
  };

  // Fungsi untuk memeriksa apakah papan valid sebelum menyelesaikan
  const isBoardValid = (bd) => {
    // Periksa setiap sel di papan
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        // Dapatkan nilai sel
        const val = bd[r][c];
        // Jika sel tidak kosong dan penempatan tidak valid, kembalikan false
        if (val !== 0 && !isValid(bd, r, c, val)) {
          // Jika ada pelanggaran aturan, kembalikan false
          return false;
        }
      }
    }
    // Jika tidak ada pelanggaran, kembalikan true
    return true;
  };

  const handleSolve = async () => {
    if (!isBoardValid(board)) {
      alert("Terdapat angka yang melanggar aturan Sudoku!");
      return;
    }

    setSolving(true);
    setSolveTime(null);

    // Salin papan untuk diselesaikan
    const newBoard = board.map((row) => [...row]);

    //Mulai pengukuran waktu
    const start = performance.now();

    // Panggil fungsi penyelesaian dengan animasi
    const solved = await solveSudoku(newBoard, setBoard, true);

    //Akhiri pengukuran waktu
    const end = performance.now();
    const duration = ((end - start) / 1000).toFixed(3);
    setSolveTime(duration);

    // Perbarui papan jika berhasil diselesaikan
    if (solved) {
      setBoard(newBoard);
      // Jika tidak ada solusi
    } else {
      alert("Tidak ada solusi yang valid!");
    }
    setSolving(false);
  };

  // Fungsi untuk mengatur ulang papan berdasarkan level yang dipilih
  const handleReset = () => {
    // Dapatkan jumlah sel yang akan dihapus berdasarkan level
    const removeCount = options[selected];
    // Hasilkan papan yang sudah terisi
    const solved = generateSolvedBoard();
    // Hapus sel untuk membuat teka-teki
    const puzzle = removeCells(solved, removeCount);
    // Perbarui papan dan kesalahan
    setBoard(puzzle);
    // Kosongkan kesalahan
    setErrors(createEmptyBoard());
    setSolveTime(null);
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

      <div className="controls">
        <div className="button-container">
          <button onClick={handleSolve} disabled={solving}>
            {solving ? "Solving..." : "Solve"}
          </button>
          <button onClick={handleReset} disabled={solving}>
            Reset
          </button>
        </div>

        <div className="dropdown">
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
      </div>

      {solveTime && (
        <p className="solve-time">
          Waktu penyelesaian level <b>{selected}</b>:{" "}
          <b>{solveTime} detik</b>
        </p>
      )}

      <p>
        Isi angka 1–9 sesuai aturan Sudoku. Jika merah, berarti melanggar aturan.
        <br />
        Pilih level terlebih dahulu untuk memulai permainan.
      </p>
    </div>
  );
};

export default App;
