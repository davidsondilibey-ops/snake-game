const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const scoreEl = document.getElementById('score');
const bestScoreEl = document.getElementById('best-score');
const startBtn = document.getElementById('start-btn');
const settingsBtn = document.getElementById('settings-btn');
const settingsPanel = document.getElementById('settings-panel');
const difficultySelect = document.getElementById('difficulty');
const wrapModeCheckbox = document.getElementById('wrap-mode');
const statusEl = document.getElementById('status');

const gridSize = 20;
const tileSize = canvas.width / gridSize;
const difficultySpeeds = {
  easy: 180,
  medium: 130,
  hard: 85,
};
const initialSnake = [
  { x: 10, y: 10 },
  { x: 9, y: 10 },
  { x: 8, y: 10 },
];

let snake;
let direction;
let nextDirection;
let food;
let score;
let bestScore;
let lastTime = 0;
let moveInterval = difficultySpeeds.medium;
let animationFrameId;
let isPlaying = false;

function loadSettings() {
  const savedDifficulty = localStorage.getItem('snake-difficulty');
  const savedWrapMode = localStorage.getItem('snake-wrap-mode');

  if (Object.hasOwn(difficultySpeeds, savedDifficulty)) {
    difficultySelect.value = savedDifficulty;
  }
  wrapModeCheckbox.checked = savedWrapMode !== 'false';
  moveInterval = difficultySpeeds[difficultySelect.value];
}

function saveSettings() {
  localStorage.setItem('snake-difficulty', difficultySelect.value);
  localStorage.setItem('snake-wrap-mode', String(wrapModeCheckbox.checked));
}

function loadBestScore() {
  const value = Number(localStorage.getItem('snake-best-score') || '0');
  bestScore = Number.isFinite(value) ? value : 0;
  bestScoreEl.textContent = String(bestScore);
}

function saveBestScore() {
  localStorage.setItem('snake-best-score', String(bestScore));
  bestScoreEl.textContent = String(bestScore);
}

function resetGame() {
  snake = initialSnake.map((segment) => ({ ...segment }));
  direction = { x: 1, y: 0 };
  nextDirection = { x: 1, y: 0 };
  score = 0;
  scoreEl.textContent = '0';
  spawnFood();
  statusEl.textContent = 'Use arrow keys or WASD';
  cancelAnimationFrame(animationFrameId);
  lastTime = 0;
}

function spawnFood() {
  const available = [];

  for (let y = 0; y < gridSize; y += 1) {
    for (let x = 0; x < gridSize; x += 1) {
      const isOccupied = snake.some((segment) => segment.x === x && segment.y === y);
      if (!isOccupied) available.push({ x, y });
    }
  }

  if (!available.length) {
    food = null;
    return;
  }

  const randomIndex = Math.floor(Math.random() * available.length);
  food = available[randomIndex];
}

function gameOver() {
  isPlaying = false;
  statusEl.textContent = 'Game over! Press Start to try again';

  if (score > bestScore) {
    bestScore = score;
    saveBestScore();
  }
}

function update() {
  direction = nextDirection;

  let head = { x: snake[0].x + direction.x, y: snake[0].y + direction.y };

  const hitsWall =
    head.x < 0 ||
    head.x >= gridSize ||
    head.y < 0 ||
    head.y >= gridSize;

  if (hitsWall && !wrapModeCheckbox.checked) {
    gameOver();
    return;
  }

  if (wrapModeCheckbox.checked) {
    head = {
      x: (head.x + gridSize) % gridSize,
      y: (head.y + gridSize) % gridSize,
    };
  }

  const willEatFood = food && head.x === food.x && head.y === food.y;
  const bodyToCheck = willEatFood ? snake : snake.slice(0, -1);
  const collidesWithBody = snake.some((segment, index) => {
    return index < bodyToCheck.length && segment.x === head.x && segment.y === head.y;
  });

  if (collidesWithBody) {
    gameOver();
    return;
  }

  snake.unshift(head);

  if (willEatFood) {
    score += 1;
    scoreEl.textContent = String(score);
    spawnFood();

    if (score > bestScore) {
      bestScore = score;
      saveBestScore();
    }

    if (!food) {
      isPlaying = false;
      statusEl.textContent = 'You win! The board is full.';
      return;
    }
  } else {
    snake.pop();
  }
}

function drawGrid() {
  ctx.fillStyle = '#091720';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  for (let x = 0; x < gridSize; x += 1) {
    for (let y = 0; y < gridSize; y += 1) {
      ctx.strokeStyle = 'rgba(255,255,255,0.04)';
      ctx.strokeRect(x * tileSize, y * tileSize, tileSize, tileSize);
    }
  }
}

function drawSnake() {
  snake.forEach((segment, index) => {
    const x = segment.x * tileSize;
    const y = segment.y * tileSize;

    ctx.fillStyle = index === 0 ? '#8bf3ff' : '#5ad1d7';
    ctx.fillRect(x + 1, y + 1, tileSize - 2, tileSize - 2);
  });
}

function drawFood() {
  if (!food) return;

  const x = food.x * tileSize + tileSize / 2;
  const y = food.y * tileSize + tileSize / 2;
  const radius = tileSize * 0.28;

  ctx.beginPath();
  ctx.fillStyle = '#ff6b6b';
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();
}

function render() {
  drawGrid();
  drawFood();
  drawSnake();
}

function gameTick(timestamp) {
  if (!isPlaying) return;

  const elapsed = timestamp - lastTime;
  if (elapsed >= moveInterval) {
    update();
    render();
    lastTime = timestamp;
  }

  animationFrameId = requestAnimationFrame(gameTick);
}

function startGame() {
  resetGame();
  moveInterval = difficultySpeeds[difficultySelect.value];
  isPlaying = true;
  statusEl.textContent = 'Good luck!';
  render();
  animationFrameId = requestAnimationFrame(gameTick);
}

function setDirection(newDirection) {
  if (!isPlaying) return;

  const isOpposite =
    newDirection.x === -direction.x && newDirection.y === -direction.y;

  if (!isOpposite) {
    nextDirection = newDirection;
  }
}

window.addEventListener('keydown', (event) => {
  const key = event.key.toLowerCase();

  if (key === ' ' || key === 'spacebar') {
    event.preventDefault();
    if (!isPlaying) {
      startGame();
    }
    return;
  }

  if (!['arrowup', 'arrowdown', 'arrowleft', 'arrowright', 'w', 'a', 's', 'd'].includes(key)) {
    return;
  }

  event.preventDefault();

  const map = {
    arrowup: { x: 0, y: -1 },
    w: { x: 0, y: -1 },
    arrowdown: { x: 0, y: 1 },
    s: { x: 0, y: 1 },
    arrowleft: { x: -1, y: 0 },
    a: { x: -1, y: 0 },
    arrowright: { x: 1, y: 0 },
    d: { x: 1, y: 0 },
  };

  setDirection(map[key]);
});

startBtn.addEventListener('click', () => {
  startGame();
});

settingsBtn.addEventListener('click', () => {
  const isOpen = settingsBtn.getAttribute('aria-expanded') === 'true';
  settingsBtn.setAttribute('aria-expanded', String(!isOpen));
  settingsPanel.hidden = isOpen;
});

difficultySelect.addEventListener('change', () => {
  moveInterval = difficultySpeeds[difficultySelect.value];
  saveSettings();
});

wrapModeCheckbox.addEventListener('change', saveSettings);

loadSettings();
loadBestScore();
resetGame();
render();
