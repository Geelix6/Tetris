import {
  PLAYFIELD_ROWS,
  PLAYFIELD_COLUMNS,
  TETRAMINO_NAMES,
  TETRAMINOES,
  getRandomElement,
  rotateMatrix,
} from "./utilities.js";

export class Tetris {
  constructor() {
    this.playfield;
    this.tetromino;
    this.gameRefreshRate = 700;
    this.gameLevel = 5;
    this.gameScore = 0;
    this.isGameOver = false;
    this.isGamePaused = false;
    this.init();
  }

  init() {
    this.generatePlayfield();
    this.nextTetrominoName = getRandomElement(TETRAMINO_NAMES);
    this.generateTetromino();
  }

  generatePlayfield() {
    this.playfield = new Array(PLAYFIELD_ROWS).fill().map(() => new Array(PLAYFIELD_COLUMNS).fill(0));
  }

  generateTetromino() {
    const name = this.nextTetrominoName;
    const matrix = TETRAMINOES[name];
    const column = PLAYFIELD_COLUMNS / 2 - Math.floor(matrix.length / 2);
    const row = name == "I" ? -3 : -2;

    this.tetromino = {
      name,
      matrix,
      row,
      column,
      ghostRow: row,
      ghostColumn: column,
    };
    this.nextTetrominoName = getRandomElement(TETRAMINO_NAMES);

    this.calculateGhostPosition();
  }

  calculateGhostPosition() {
    const oldTetrominoRow = this.tetromino.row;

    this.tetromino.row++;
    while (this.isValid()) {
      this.tetromino.row++;
    }

    this.tetromino.ghostRow = this.tetromino.row - 1;
    this.tetromino.ghostColumn = this.tetromino.column;
    this.tetromino.row = oldTetrominoRow;
  }

  moveTetrominoDown() {
    this.tetromino.row += 1;
    if (!this.isValid()) {
      this.tetromino.row -= 1;
      this.placeTetromino();
    }
  }

  moveTetrominoRight() {
    this.tetromino.column += 1;
    if (!this.isValid()) {
      this.tetromino.column -= 1;
    } else {
      this.calculateGhostPosition();
    }
  }

  moveTetrominoLeft() {
    this.tetromino.column -= 1;
    if (!this.isValid()) {
      this.tetromino.column += 1;
    } else {
      this.calculateGhostPosition();
    }
  }

  rotateTetromino() {
    const oldMatrix = this.tetromino.matrix;
    const rotatedMatrix = rotateMatrix(this.tetromino.matrix);
    this.tetromino.matrix = rotatedMatrix;
    if (!this.isValid()) {
      this.tetromino.matrix = oldMatrix;
    } else {
      this.calculateGhostPosition();
    }
  }

  dropTetrominoDown() {
    const rowsToDown = this.tetromino.ghostRow - this.tetromino.row;
    this.tetromino.row = this.tetromino.ghostRow;

    this.placeTetromino();

    this.gameScore += Math.round((rowsToDown * this.gameLevel) / 3);
    const score = document.querySelector(".score");
    score.textContent = this.gameScore;
  }

  isValid() {
    const matrixSize = this.tetromino.matrix.length;
    for (let row = 0; row < matrixSize; row++) {
      for (let column = 0; column < matrixSize; column++) {
        if (!this.tetromino.matrix[row][column]) continue;
        if (this.isOutsideOfGameBoard(row, column)) return false;
        if (this.isCollides(row, column)) return false;
      }
    }
    return true;
  }

  isOutsideOfGameBoard(row, column) {
    return (
      this.tetromino.column + column < 0 ||
      this.tetromino.column + column >= PLAYFIELD_COLUMNS ||
      this.tetromino.row + row >= PLAYFIELD_ROWS
    );
  }

  isCollides(row, column) {
    return this.playfield[this.tetromino.row + row]?.[this.tetromino.column + column];
  }

  placeTetromino() {
    const matrixSize = this.tetromino.matrix.length;
    for (let row = 0; row < matrixSize; row++) {
      for (let column = 0; column < matrixSize; column++) {
        if (!this.tetromino.matrix[row][column]) continue;
        if (this.isOutsideOfTopGameBoard(row)) {
          this.isGameOver = true;
          return;
        }

        this.playfield[this.tetromino.row + row][this.tetromino.column + column] = this.tetromino.name;
      }
    }
    this.processFillRows();
    this.generateTetromino();

    this.gameScore += 5 + 5 * this.gameLevel;
    const score = document.querySelector(".score");
    score.textContent = this.gameScore;
  }

  isOutsideOfTopGameBoard(row) {
    return this.tetromino.row + row < 0;
  }

  processFillRows() {
    const filledRows = this.findFilledRows();

    if (filledRows.length > 0) {
      const multiplier = filledRows.length == 1 ? 0 : 1.5 ** (filledRows.length - 1);
      this.gameScore += Math.round(((100 + 40 * this.gameLevel) * (1 + multiplier)) / 10) * 10;
    }

    this.removeFilledRows(filledRows);
  }

  findFilledRows() {
    const filledRows = [];
    for (let row = 0; row < PLAYFIELD_ROWS; row++) {
      if (this.playfield[row].every((cell) => !!cell)) {
        filledRows.push(row);
      }
    }
    return filledRows;
  }

  removeFilledRows(filledRows) {
    filledRows.forEach((row) => this.dropRowsAbove(row));
  }

  dropRowsAbove(rowToDelete) {
    for (let row = rowToDelete; row > 0; row--) {
      this.playfield[row] = this.playfield[row - 1];
    }
    this.playfield[0] = new Array(PLAYFIELD_COLUMNS).fill(0);
  }
}
