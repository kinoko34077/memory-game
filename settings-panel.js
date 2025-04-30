
// ------- Settings UI -------
const settingsButton = document.createElement('button');
settingsButton.textContent = '⚙️ 設定';
settingsButton.style.marginLeft = '10px';

const settingsPanel = document.createElement('div');
settingsPanel.id = 'settings-panel';
settingsPanel.style.border = '1px solid #ccc';
settingsPanel.style.padding = '10px';
settingsPanel.style.marginTop = '10px';
settingsPanel.style.display = 'none';
settingsPanel.style.backgroundColor = '#f9f9f9';

// UI項目：各入力フォーム
settingsPanel.innerHTML = `
  <label><input type="checkbox" id="set-show-ruby" /> ルビを表示</label><br/>
  <label>裏返しに戻すまでの時間（ms）: <input type="number" id="set-revert-delay" value="1000" min="100" step="100" /></label><br/>
  <label>揃ったペアの処理: 
    <select id="set-pair-remove">
      <option value="grey">グレー表示</option>
      <option value="hide">非表示</option>
    </select>
  </label><br/>
  <label>文字サイズ(px): <input type="number" id="set-font-size" value="18" min="8" max="40"/></label><br/>
  <label><input type="checkbox" id="set-always-show-time" /> 経過時間を常に表示</label><br/>
  <label>制限タイマー（秒）: <input type="number" id="set-countdown-seconds" value="60" min="0" /></label>
`;

// ボタン動作と挿入
settingsButton.addEventListener('click', () => {
  settingsPanel.style.display = settingsPanel.style.display === 'none' ? 'block' : 'none';
});
document.getElementById('controls').appendChild(settingsButton);
document.getElementById('controls').appendChild(settingsPanel);

// ------- Settings ロード＆保存 -------
function loadSettings() {
  const saved = localStorage.getItem('memorySettings');
  if (!saved) return;

  try {
    const settings = JSON.parse(saved);
    document.getElementById('set-show-ruby').checked = settings.showRuby ?? true;
    document.getElementById('set-revert-delay').value = settings.revertDelay ?? 1000;
    document.getElementById('set-pair-remove').value = settings.pairRemoveMode ?? 'grey';
    document.getElementById('set-font-size').value = settings.fontSize ?? 18;
    document.getElementById('set-always-show-time').checked = settings.alwaysShowTime ?? true;
    document.getElementById('set-countdown-seconds').value = settings.countdownSeconds ?? 60;
  } catch (e) {
    console.warn('設定の読み込みに失敗しました', e);
  }
}

function saveSettings() {
  const settings = {
    showRuby: document.getElementById('set-show-ruby').checked,
    revertDelay: parseInt(document.getElementById('set-revert-delay').value),
    pairRemoveMode: document.getElementById('set-pair-remove').value,
    fontSize: parseInt(document.getElementById('set-font-size').value),
    alwaysShowTime: document.getElementById('set-always-show-time').checked,
    countdownSeconds: parseInt(document.getElementById('set-countdown-seconds').value)
  };
  localStorage.setItem('memorySettings', JSON.stringify(settings));
}

// ------- 自動保存ハンドラ -------
settingsPanel.addEventListener('change', saveSettings);

// ページ読み込み時に呼び出す
window.addEventListener('DOMContentLoaded', () => {
  loadSettings();
});
