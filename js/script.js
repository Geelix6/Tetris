import { Tetris } from "./tetris.js";
import {
  PLAYFIELD_COLUMNS,
  PLAYFIELD_ROWS,
  convertMatrixTo4x4Size,
  convertPositionToIndex,
  SAD_SMILE,
} from "./utilities.js";

const tetris = new Tetris();
const cells = document.querySelectorAll(".grid>div");
let hammer;
let requestId;
let timeoutId;

document.addEventListener("visibilitychange", () => {
  !tetris.isGameOver && !tetris.isGamePaused && pauseGame();
});

document.addEventListener("click", (event) => {
  if (event.target.closest(".pause") && !tetris.isGameOver) {
    tetris.isGamePaused ? continueGame() : pauseGame();
  }
  if (event.target.closest(".restart")) {
    restartGame();
    tetris.isGamePaused && continueGame();
  }
  if (event.target.classList.contains("hints")) {
    showHowToPlayMenu();
  }

  if (event.target.dataset.gamelevel === "decrease") {
    decreaseGameLevel();
    event.target.blur();
  }
  if (event.target.dataset.gamelevel === "increase") {
    increaseGameLevel();
    event.target.blur();
  }
});

initKeydown();
initTouch();

moveDown();

function initKeydown() {
  document.addEventListener("keydown", onKeydown);
}

function onKeydown(event) {
  if (event.key === "=") increaseGameLevel();
  if (event.key === "-") decreaseGameLevel();

  if (tetris.isGamePaused) {
    const howToPlayMenu = document.querySelector(".how-to-play");
    if (!howToPlayMenu.hidden) {
      if (event.key === "Escape") hideHowToPlayMenu();
      return;
    }

    const activeKeys = ["ArrowDown", "ArrowLeft", "ArrowRight", "ArrowUp", " "];
    if (activeKeys.includes(event.key)) continueGame();
    return;
  }

  if (event.key === "ArrowDown") moveDown();
  if (event.key === "ArrowLeft") moveLeft();
  if (event.key === "ArrowRight") moveRight();
  if (event.key === "ArrowUp") rotate();
  if (event.key === " ") dropDown();
  if (event.key === "Escape") pauseGame();
}

function initTouch() {
  document.addEventListener("dblclick", (event) => {
    event.preventDefault();
  });

  hammer = new Hammer(document.querySelector(".grid"));
  hammer.get("pan").set({ direction: Hammer.DIRECTION_ALL });
  hammer.get("swipe").set({ direction: Hammer.DIRECTION_ALL });

  activateHammerTouchEvents();
}

function activateHammerTouchEvents() {
  const threshold = 30;
  let deltaX = 0;
  let deltaY = 0;

  hammer.on("panstart", () => {
    deltaX = 0;
    deltaY = 0;
  });

  hammer.on("panleft", (event) => {
    if (Math.abs(event.deltaX - deltaX) > threshold) {
      moveLeft();
      deltaX = event.deltaX;
      deltaY = event.deltaY;
    }
  });

  hammer.on("panright", (event) => {
    if (Math.abs(event.deltaX - deltaX) > threshold) {
      moveRight();
      deltaX = event.deltaX;
      deltaY = event.deltaY;
    }
  });

  hammer.on("pandown", (event) => {
    if (Math.abs(event.deltaY - deltaY) > threshold) {
      moveDown();
      deltaX = event.deltaX;
      deltaY = event.deltaY;
    }
  });

  hammer.on("tap", () => {
    rotate();
  });

  hammer.on("swipedown", () => {
    dropDown();
  });
}

function moveDown() {
  tetris.moveTetrominoDown();
  draw();
  stopLoop();
  startLoop();

  if (tetris.isGameOver) {
    gameOver();
  }
}

function moveLeft() {
  tetris.moveTetrominoLeft();
  draw();
}

function moveRight() {
  tetris.moveTetrominoRight();
  draw();
}

function rotate() {
  tetris.rotateTetromino();
  draw();
}

function dropDown() {
  tetris.dropTetrominoDown();
  draw();

  stopLoop();
  startLoop();

  if (tetris.isGameOver) {
    gameOver();
  }
}

function startLoop() {
  timeoutId = setInterval(() => (requestId = requestAnimationFrame(moveDown)), tetris.gameRefreshRate);
}

function stopLoop() {
  cancelAnimationFrame(requestId);
  clearTimeout(timeoutId);
}

function draw() {
  cells.forEach((cell) => cell.removeAttribute("class"));
  drawPlayfield();
  drawTetromino();
  drawGhostTetromino();
  drawNextTetramino();
}

function drawPlayfield() {
  for (let row = 0; row < PLAYFIELD_ROWS; row++) {
    for (let column = 0; column < PLAYFIELD_COLUMNS; column++) {
      if (!tetris.playfield[row][column]) continue;

      const name = tetris.playfield[row][column];
      const cellIndex = convertPositionToIndex(row, column);
      cells[cellIndex].classList.add(name);
    }
  }
}

function drawTetromino() {
  const name = tetris.tetromino.name;
  const tetrominoMatrixSize = tetris.tetromino.matrix.length;

  for (let row = 0; row < tetrominoMatrixSize; row++) {
    for (let column = 0; column < tetrominoMatrixSize; column++) {
      if (!tetris.tetromino.matrix[row][column]) continue;
      if (tetris.tetromino.row + row < 0) continue;

      const cellIndex = convertPositionToIndex(tetris.tetromino.row + row, tetris.tetromino.column + column);
      cells[cellIndex].classList.add(name);
    }
  }
}

function drawGhostTetromino() {
  const tetrominoMatrixSize = tetris.tetromino.matrix.length;

  for (let row = 0; row < tetrominoMatrixSize; row++) {
    for (let column = 0; column < tetrominoMatrixSize; column++) {
      if (!tetris.tetromino.matrix[row][column]) continue;
      if (tetris.tetromino.ghostRow + row < 0) continue;

      const cellIndex = convertPositionToIndex(tetris.tetromino.ghostRow + row, tetris.tetromino.ghostColumn + column);
      cells[cellIndex].classList.add("ghost");
    }
  }
}

function drawNextTetramino() {
  const secondGridCells = document.querySelectorAll(".grid-show-next>div");
  secondGridCells.forEach((cell) => cell.removeAttribute("class"));
  const name = tetris.nextTetrominoName;
  const matrix = convertMatrixTo4x4Size(name);

  for (let x = 0; x < 4; x++) {
    for (let y = 0; y < 4; y++) {
      if (!matrix[x][y]) continue;
      const cellIndex = x * 4 + y;
      secondGridCells[cellIndex].classList.add(name);
    }
  }
}

function gameOver() {
  stopLoop();
  document.removeEventListener("keydown", onKeydown);
  hammer.off("panstart pandown panleft panright swipedown tap");

  const secondGridCells = document.querySelectorAll(".grid-show-next>div");
  secondGridCells.forEach((cell) => cell.removeAttribute("class"));

  const endGameMessage = `Game Over! Your score is ${tetris.gameScore}\nClick the restart button and try to beat it!`;
  gameOverAnimation(endGameMessage);
}

function gameOverAnimation(endGameMessage) {
  const filledCells = [...cells].filter((cell) => cell.classList.length > 0);
  filledCells.forEach((cell, index) => {
    setTimeout(() => cell.classList.add("hide"), index * 10);
    setTimeout(() => cell.removeAttribute("class"), index * 10 + 500);
  });

  tetris.drawSadSmileTimeoutId = setTimeout(drawSadSmile, filledCells.length * 10 + 1000);
  tetris.endGameMessageTimeoutId = setTimeout(() => alert(endGameMessage), filledCells.length * 10 + 2000);
}

function drawSadSmile() {
  const TOP_OFFSET = 5;

  for (let row = 0; row < SAD_SMILE.length; row++) {
    for (let column = 0; column < SAD_SMILE[0].length; column++) {
      if (!SAD_SMILE[row][column]) continue;

      const cellIndex = convertPositionToIndex(TOP_OFFSET + row, column);
      cells[cellIndex].classList.add("sad");
    }
  }
}

function pauseGame() {
  const pauseButton = document.querySelector(".pause");
  const gridForeground = document.querySelector(".grid-foreground");
  gridForeground.style.display = "flex";

  stopLoop();

  hammer.off("panstart pandown panleft panright swipedown tap");
  hammer.on("tap", () => continueGame());

  tetris.isGamePaused = true;
  changePauseButtonIcon();

  pauseButton.setAttribute("title", "Continue the game");
  pauseButton.blur();
}

function continueGame() {
  const pauseButton = document.querySelector(".pause");
  const gridForeground = document.querySelector(".grid-foreground");
  gridForeground.style.display = "none";

  startLoop();

  hammer.off("tap");
  activateHammerTouchEvents();

  tetris.isGamePaused = false;
  changePauseButtonIcon();

  pauseButton.setAttribute("title", "Pause the game");
  pauseButton.blur();
}

function changePauseButtonIcon() {
  const pauseButton = document.querySelector(".pause");
  const iconPause = `<svg xmlns="http://www.w3.org/2000/svg" height="100%" viewBox="0 0 320 512"><path fill="#fff" d="M48 64C21.5 64 0 85.5 0 112V400c0 26.5 21.5 48 48 48H80c26.5 0 48-21.5 48-48V112c0-26.5-21.5-48-48-48H48zm192 0c-26.5 0-48 21.5-48 48V400c0 26.5 21.5 48 48 48h32c26.5 0 48-21.5 48-48V112c0-26.5-21.5-48-48-48H240z"/></svg>`;
  const iconPlay = `<svg style="transform: translateX(0.1vw) scale(0.85)" xmlns="http://www.w3.org/2000/svg" height="100%" viewBox="0 0 384 512"><path fill="#fff" d="M73 39c-14.8-9.1-33.4-9.4-48.5-.9S0 62.6 0 80V432c0 17.4 9.4 33.4 24.5 41.9s33.7 8.1 48.5-.9L361 297c14.3-8.7 23-24.2 23-41s-8.7-32.2-23-41L73 39z"/></svg>`;

  pauseButton.innerHTML = tetris.isGamePaused ? iconPlay : iconPause;
}

function restartGame() {
  const restartButton = document.querySelector(".restart");
  if (restartButton.dataset.type === "Wait for restarting...") return;
  let waitForAnimationEnd = 0;
  stopLoop();

  if (tetris.isGameOver) {
    restartButton.setAttribute("data-type", "Wait for restarting...");
    const animatingCells = document.querySelectorAll(".grid>div.hide");
    waitForAnimationEnd = animatingCells.length * 10 + 500;

    clearTimeout(tetris.drawSadSmileTimeoutId);
    clearTimeout(tetris.endGameMessageTimeoutId);

    setTimeout(() => {
      tetris.isGameOver = false;
      document.addEventListener("keydown", onKeydown);
      activateHammerTouchEvents();

      restartButton.removeAttribute("data-type");
    }, waitForAnimationEnd);
  }

  tetris.init();
  tetris.gameScore = 0;

  setTimeout(() => {
    moveDown();
    document.querySelector(".score").textContent = 0;
  }, waitForAnimationEnd);

  restartButton.blur();
}

function showHowToPlayMenu() {
  const howToPlayMenu = document.querySelector(".how-to-play");
  howToPlayMenu.hidden = false;
  !tetris.isGameOver && pauseGame();

  const closeButton = howToPlayMenu.querySelector(".how-to-play-close");
  closeButton.addEventListener("click", hideHowToPlayMenu, { once: true });

  const hintsButton = document.querySelector(".hints");
  hintsButton.blur();
}

function hideHowToPlayMenu() {
  const howToPlayMenu = document.querySelector(".how-to-play");
  howToPlayMenu.hidden = true;
  !tetris.isGameOver && continueGame();
}

function decreaseGameLevel() {
  if (tetris.gameRefreshRate === 1300) return;
  tetris.gameRefreshRate += 150;
  tetris.gameLevel--;

  const level = document.querySelector(".level");
  level.textContent--;
}

function increaseGameLevel() {
  if (tetris.gameRefreshRate === 100) return;
  tetris.gameRefreshRate -= 150;
  tetris.gameLevel++;

  const level = document.querySelector(".level");
  level.textContent++;
}
