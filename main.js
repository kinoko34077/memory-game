import { renderRubyToElement } from './ruby.js';
import { setupSettingsPanel, getCurrentSettings } from './settings-panel.js';

let pairs = [];
let fileLoaded = false;
let pairLoadGeneration = 0;
const DEBUG = true;

const board = document.getElementById('game-board');
const fileInput = document.getElementById('file-input');
const useFileCheckbox = document.getElementById('use-file');
const pairCountSelect = document.getElementById('pair-count');
const startButton = document.getElementById('start-game');
const logArea = document.getElementById('log-area');

const timerDisplay = document.createElement('span');
timerDisplay.id = 'timer-display';
timerDisplay.style.marginLeft = '20px';
timerDisplay.style.display = 'inline-block';
timerDisplay.style.fontSize = '16px';
timerDisplay.style.fontWeight = 'bold';
document.getElementById('controls').appendChild(timerDisplay);

const enumTimerMode = {
  OFF: 'off',
  COUNTDOWN: 'countdown',
  UP: 'up'
};

let timerInterval;
let timeCounter = 0;
let currentTimerMode = enumTimerMode.OFF;
let settings = {};
let revertTimeout = null;
let roundCompleted = false;

function logDebug(message, ...optional) {
  if (DEBUG) console.log(`[DEBUG] ${message}`, ...optional);
}

function logUserAction(text) {
  const entry = document.createElement('div');
  entry.textContent = text;
  logArea.appendChild(entry);
  logArea.scrollTop = logArea.scrollHeight;
}

function stopTimer() {
  clearInterval(timerInterval);
  timerInterval = undefined;
  currentTimerMode = enumTimerMode.OFF;
  timeCounter = 0;
  timerDisplay.textContent = '';
}

function startTimer(mode) {
  stopTimer();
  currentTimerMode = mode;
  timeCounter = mode === enumTimerMode.COUNTDOWN ? settings.countdownSeconds : 0;
  updateTimerDisplay();

  timerInterval = setInterval(() => {
    if (mode === enumTimerMode.COUNTDOWN) {
      timeCounter--;
      updateTimerDisplay();
      if (timeCounter <= 0) {
        clearInterval(timerInterval);
        timerInterval = undefined;
        alert('時間切れ！');
      }
    } else if (mode === enumTimerMode.UP) {
      timeCounter++;
      updateTimerDisplay();
    }
  }, 1000);
}

function updateTimerDisplay() {
  if (currentTimerMode === enumTimerMode.OFF) {
    timerDisplay.textContent = '';
    return;
  }
  if (currentTimerMode === enumTimerMode.COUNTDOWN) {
    timerDisplay.textContent = `⏱️ 残り: ${timeCounter}s`;
  } else {
    timerDisplay.textContent = `🕒 経過: ${timeCounter}s`;
  }
}

function parsePairs(text) {
  const lines = text.replace(/\r\n/g, '\n').split('\n');
  return lines
    .map(line => line.trim())
    .filter(line => line && line.includes(','))
    .map(line => {
      const [rawA, rawB] = line.split(',');
      return [rawA.trim(), rawB.trim()];
    });
}

function parsePairsWithRuby(text) {
  return parsePairs(text);
}

function loadDefaultPairs() {
  const generation = ++pairLoadGeneration;
  fetch('pair.txt')
    .then(response => {
      if (!response.ok) throw new Error('ファイルの取得に失敗しました');
      return response.text();
    })
    .then(text => {
      if (generation !== pairLoadGeneration || useFileCheckbox.checked) return;
      pairs = parsePairsWithRuby(text);
      fileLoaded = true;
      logDebug('pair.txt を読み込みました', pairs);
    })
    .catch(err => {
      if (generation !== pairLoadGeneration || useFileCheckbox.checked) return;
      console.warn('pair.txt の読み込みに失敗。フォールバックに切り替え：', err);
      const fallbackText = `｜洋弓《ようきゅう》,アーチェリー\n｜氷球《ひょうきゅう》,アイスホッケー`;
      pairs = parsePairsWithRuby(fallbackText);
      fileLoaded = true;
      logDebug('フォールバックペアを使用', pairs);
    });
}

function resetBoard() {
  firstCard = null;
  lockBoard = false;
}

function isRoundComplete() {
  return board.children.length > 0 && [...board.children].every(card => card.classList.contains('matched'));
}

function completeRound() {
  if (roundCompleted) return;
  roundCompleted = true;
  stopTimer();
  logUserAction('✅ ゲーム完了！');
}

function setupBoard(gamePairs) {
  if (revertTimeout !== null) {
    clearTimeout(revertTimeout);
    revertTimeout = null;
  }
  resetBoard();
  roundCompleted = false;
  stopTimer();
  board.innerHTML = '';

  const windowWidth = window.innerWidth;
  const columns = Math.max(2, Math.min(10, Math.floor(windowWidth / 170)));
  board.style.display = 'grid';
  board.style.gridTemplateColumns = `repeat(${columns}, 1fr)`;

  gamePairs.forEach(cardData => {
    const card = document.createElement('button');
    card.type = 'button';
    card.classList.add('card');
    card.dataset.pairId = cardData.pairId;
    card.dataset.value = cardData.value;

    const cardText = document.createElement('span');
    cardText.classList.add('card-text');
    cardText.style.fontSize = settings.fontSize + 'px';

    renderRubyToElement(cardText, cardData.value, settings.showRuby);

    card.appendChild(cardText);
    card.addEventListener('click', handleCardClick);
    board.appendChild(card);
  });

  logDebug('描画完了', { cardCount: gamePairs.length });
  if (settings.timerEnabled && (settings.countdownSeconds > 0 || settings.alwaysShowTime)) {
    startTimer(settings.countdownSeconds > 0 ? enumTimerMode.COUNTDOWN : enumTimerMode.UP);
  }
}

let firstCard = null;
let lockBoard = false;

function handleCardClick(e) {
  if (lockBoard || roundCompleted) return;
  const card = e.currentTarget;

  if (!card.classList.contains('flipped')) {
    card.classList.add('flipped');
    logUserAction(`🃏 選択: ${card.dataset.value}`);
  }

  if (!firstCard) {
    firstCard = card;
  } else if (firstCard.dataset.pairId === card.dataset.pairId && firstCard !== card) {
    const matchedFirst = firstCard;
    const matchedSecond = card;
    matchedFirst.classList.add('matched');
    matchedSecond.classList.add('matched');

    if (settings.pairRemoveMode === 'hide') {
      setTimeout(() => {
        matchedFirst.innerHTML = '';
        matchedSecond.innerHTML = '';
        matchedFirst.classList.add('removed');
        matchedSecond.classList.add('removed');
      }, 300);
    }

    resetBoard();
    if (isRoundComplete()) completeRound();
  } else {
    const previousCard = firstCard;
    lockBoard = true;
    revertTimeout = setTimeout(() => {
      previousCard.classList.remove('flipped');
      card.classList.remove('flipped');
      revertTimeout = null;
      resetBoard();
    }, settings.revertDelay);
  }
}

// 初期設定
for (let i = 1; i <= 50; i++) {
  const option = document.createElement('option');
  option.value = i;
  option.textContent = i;
  pairCountSelect.appendChild(option);
}

useFileCheckbox.addEventListener('change', (e) => {
  const useFile = e.target.checked;
  fileInput.style.display = useFile ? 'inline' : 'none';
  fileInput.value = '';

  if (useFile) {
    pairLoadGeneration++;
    pairs = [];
    fileLoaded = false;
    logDebug('ファイルモードへ切替：ペア初期化');
  } else {
    loadDefaultPairs();
  }
});

fileInput.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const generation = ++pairLoadGeneration;
  const reader = new FileReader();
  reader.onload = (event) => {
    if (generation !== pairLoadGeneration || !useFileCheckbox.checked) return;
    const result = event.target.result;
    logDebug('ファイル読込成功', result);
    const parsed = parsePairsWithRuby(result);
    if (parsed.length > 0) {
      pairs = parsed;
      fileLoaded = true;
      logDebug('ファイルからペア読み込み成功', pairs);
    } else {
      alert('ファイルに有効なペアが含まれていません');
      fileLoaded = false;
    }
  };
  reader.readAsText(file);
});

document.addEventListener('DOMContentLoaded', () => {
  if (!useFileCheckbox.checked) {
    loadDefaultPairs();
    fileInput.style.display = 'none';
  } else {
    fileInput.style.display = 'inline';
  }
  setupSettingsPanel();
  settings = getCurrentSettings();
});

startButton.addEventListener('click', () => {
  settings = getCurrentSettings();

  const mode = document.getElementById('mode').value;
  const pairCountValue = pairCountSelect.value;

  logDebug('ゲーム開始ボタン押下', {
    mode,
    pairCountValue,
    settings,
    pairCount: pairs.length,
    fileLoaded
  });

  if (!fileLoaded || !pairs || pairs.length === 0) {
    alert('ペアデータが読み込まれていません');
    return;
  }

  let pairCount = pairs.length;
  if (pairCountValue !== 'max') {
    pairCount = parseInt(pairCountValue);
  }

  if (pairs.length < pairCount) {
    alert('Not enough pairs available!');
    return;
  }

  let selectedPairs;
  if (mode === 'ascending') {
    selectedPairs = pairs.slice(0, pairCount);
  } else {
    selectedPairs = [...pairs].sort(() => Math.random() - 0.5).slice(0, pairCount);
  }

  const gamePairs = selectedPairs.flatMap(([word, reading], pairIndex) => {
    const pairId = `pair-${pairIndex}`;
    return [
      { value: word, reading, pairId },
      { value: reading, reading: word, pairId }
    ];
  });

  setupBoard(gamePairs.sort(() => Math.random() - 0.5));
});
