// game.js

let pairs = [];
let fileLoaded = false;
const DEBUG = true;

const board = document.getElementById('game-board');
const fileInput = document.getElementById('file-input');
const useFileCheckbox = document.getElementById('use-file');
const pairCountSelect = document.getElementById('pair-count');
const rubyToggle = document.getElementById('show-ruby');
const startButton = document.getElementById('start-game');

// タイマー設定ドロップダウン
const timerSelect = document.createElement('select');
timerSelect.id = 'timer-setting';
timerSelect.innerHTML = `
  <option value="off">⏹️ タイマーなし</option>
  <option value="countdown">⏱️ 制限時間（60秒）</option>
  <option value="up">🕒 経過時間（ストップウォッチ）</option>
`;
const timerLabel = document.createElement('label');
timerLabel.textContent = 'タイマー設定：';
timerLabel.style.marginLeft = '20px';
timerLabel.appendChild(timerSelect);
document.getElementById('controls').appendChild(timerLabel);

// タイマー表示
const timerDisplay = document.createElement('span');
timerDisplay.id = 'timer-display';
timerDisplay.style.marginLeft = '20px';
timerDisplay.style.display = 'inline-block';
timerDisplay.style.fontSize = '16px';
timerDisplay.style.fontWeight = 'bold';
document.getElementById('controls').appendChild(timerDisplay);

// ログ表示
const logArea = document.getElementById('log-area');
logArea.style.marginTop = '20px';
logArea.style.fontSize = '14px';
logArea.style.maxHeight = '200px';
logArea.style.overflowY = 'auto';
document.body.appendChild(logArea);

const enumTimerMode = {
  OFF: 'off',
  COUNTDOWN: 'countdown',
  UP: 'up'
};

let timerInterval;
let timeCounter = 0;

function logDebug(message, ...optional) {
  if (DEBUG) console.log(`[DEBUG] ${message}`, ...optional);
}

function logUserAction(text) {
  const entry = document.createElement('div');
  entry.textContent = text;
  logArea.appendChild(entry);
  logArea.scrollTop = logArea.scrollHeight;
}

function startTimer(mode) {
  clearInterval(timerInterval);
  timeCounter = mode === enumTimerMode.COUNTDOWN ? 60 : 0;
  updateTimerDisplay(mode);

  timerInterval = setInterval(() => {
    if (mode === enumTimerMode.COUNTDOWN) {
      timeCounter--;
      updateTimerDisplay(mode);
      if (timeCounter <= 0) {
        clearInterval(timerInterval);
        alert('時間切れ！');
      }
    } else if (mode === enumTimerMode.UP) {
      timeCounter++;
      updateTimerDisplay(mode);
    }
  }, 1000);
}

function updateTimerDisplay(mode) {
  if (mode === enumTimerMode.OFF) {
    timerDisplay.textContent = '';
  } else if (mode === enumTimerMode.COUNTDOWN) {
    timerDisplay.textContent = `⏱️ 残り: ${timeCounter}s`;
  } else {
    timerDisplay.textContent = `🕒 経過: ${timeCounter}s`;
  }
}

function parsePairs(text) {
  const lines = text.replace(/\r\n/g, '\n').split('\n'); // ← Windows対策も含む
  return lines
    .map(line => line.trim())
    .filter(line => line && line.includes(','))
    .map(line => {
      const [rawA, rawB] = line.split(',');
      return [rawA.trim(), rawB.trim()];
    });
}


function parsePairsWithRuby(text) {
  const base = parsePairs(text);
  return base.map(([a, b]) => [
    typeof convertRubyText === 'function' ? convertRubyText(a) : a,
    typeof convertRubyText === 'function' ? convertRubyText(b) : b
  ]);
}

function loadDefaultPairs() {
  fetch('pair.txt')
    .then(response => {
      if (!response.ok) throw new Error('ファイルの取得に失敗しました');
      return response.text();
    })
    .then(text => {
      pairs = parsePairsWithRuby(text);
      fileLoaded = true;
      logDebug('pair.txt を読み込みました', pairs);
    })
    .catch(err => {
      console.warn('pair.txt の読み込みに失敗。フォールバックに切り替え：', err);
      const fallbackText = `｜洋弓《ようきゅう》,アーチェリー\n｜氷球《ひょうきゅう》,アイスホッケー`;
      pairs = parsePairsWithRuby(fallbackText);
      fileLoaded = true;
      logDebug('フォールバックペアを使用', pairs);
    });
}

function setupBoard(gamePairs, rubyEnabled, timerSetting) {
  board.innerHTML = '';

  const windowWidth = window.innerWidth;
  const columns = Math.max(2, Math.min(10, Math.floor(windowWidth / 170)));
  board.style.display = 'grid';
  board.style.gridTemplateColumns = `repeat(${columns}, 1fr)`;

  gamePairs.forEach(cardData => {
    const card = document.createElement('div');
    card.classList.add('card');
    card.dataset.pairId = cardData.pairId;
    card.dataset.value = cardData.value;

    const cardText = document.createElement('span');
    cardText.classList.add('card-text');
    renderRubyToElement(cardText, cardData.value, rubyEnabled);

    card.appendChild(cardText);
    card.addEventListener('click', handleCardClick);
    board.appendChild(card);
  });

  logDebug('描画完了', { cardCount: gamePairs.length });
  if (timerSetting !== enumTimerMode.OFF) startTimer(timerSetting);
}

let firstCard = null;
let lockBoard = false;

function handleCardClick(e) {
  if (lockBoard) return;
  const card = e.currentTarget;

  if (!card.classList.contains('flipped')) {
    card.classList.add('flipped');
    logUserAction(`🃏 選択: ${card.dataset.value}`);
  }

  if (!firstCard) {
    firstCard = card;
  } else {
    if (firstCard.dataset.pairId === card.dataset.pairId && firstCard !== card) {
      firstCard.classList.add('matched');
      card.classList.add('matched');
      resetBoard();
    } else {
      lockBoard = true;
      setTimeout(() => {
        firstCard.classList.remove('flipped');
        card.classList.remove('flipped');
        resetBoard();
      }, 1000);
    }
  }
}

function resetBoard() {
  firstCard = null;
  lockBoard = false;
}

for (let i = 1; i <= 50; i++) {
  const option = document.createElement('option');
  option.value = i;
  option.textContent = i;
  pairCountSelect.appendChild(option);
}

useFileCheckbox.addEventListener('change', (e) => {
  const useFile = e.target.checked;
  fileInput.style.display = useFile ? 'inline' : 'none';
  if (useFile) {
    pairs = [];
    fileLoaded = false;
    logDebug('ファイルモードへ切替：ペア初期化');
  } else {
    loadDefaultPairs();
  }
});

fileInput.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target.result;
      logDebug('ファイル読込成功', result);
      const parsed = parsePairsWithRuby(result);
      if (parsed.length > 0) {
        pairs = parsed;
        fileLoaded = true;
        logDebug('ファイルからペア読み込み成功', pairs);
      } else {
        alert("ファイルに有効なペアが含まれていません");
        logDebug('ファイルにペアが含まれていない');
        fileLoaded = false;
      }
    };
    reader.readAsText(file);
  }
});

window.addEventListener('DOMContentLoaded', () => {
  if (!useFileCheckbox.checked) {
    loadDefaultPairs();
    fileInput.style.display = 'none';
  } else {
    fileInput.style.display = 'inline';
  }
});

startButton.addEventListener('click', () => {
  const mode = document.getElementById('mode').value;
  const pairCountValue = pairCountSelect.value;
  const rubyEnabled = rubyToggle.checked;
  const timerSetting = timerSelect.value;

  logDebug('ゲーム開始ボタン押下', {
    mode,
    pairCountValue,
    rubyEnabled,
    timerSetting,
    pairCount: pairs.length,
    fileLoaded
  });

  if (!fileLoaded || !pairs || pairs.length === 0) {
    alert('ペアデータが読み込まれていません');
    logDebug('ゲーム開始失敗：ペア未読み込み');
    return;
  }

  let pairCount = pairs.length;
  if (pairCountValue !== 'max') {
    pairCount = parseInt(pairCountValue);
  }

  if (pairs.length < pairCount) {
    alert('Not enough pairs available!');
    logDebug('ゲーム開始失敗：指定ペア数に満たない', { available: pairs.length, requested: pairCount });
    return;
  }

  let selectedPairs;
  if (mode === 'ascending') {
    selectedPairs = pairs.slice(0, pairCount);
  } else {
    selectedPairs = [...pairs].sort(() => Math.random() - 0.5).slice(0, pairCount);
  }

  const gamePairs = selectedPairs.flatMap(([word, reading]) => [
    { value: word, reading: reading, pairId: word + reading },
    { value: reading, reading: word, pairId: word + reading }
  ]);

  logDebug('最終ペア配列', gamePairs);
  setupBoard(gamePairs.sort(() => Math.random() - 0.5), rubyEnabled, timerSetting);
});
