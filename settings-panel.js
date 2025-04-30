export function setupSettingsPanel() {
  console.log('[DEBUG] setupSettingsPanel 呼び出し開始');

  const controls = document.getElementById('controls');
  if (!controls) {
    console.warn('[WARN] setupSettingsPanel: #controls が存在しません');
    return;
  }

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
    <label>制限タイマー（秒）: <input type="number" id="set-countdown-seconds" value="60" min="0" /></label><br/>
  `;

  controls.appendChild(settingsButton);
  controls.appendChild(settingsPanel);

  const saveBtn = document.createElement('button');
  saveBtn.id = 'save-settings';
  saveBtn.textContent = '保存';
  settingsPanel.appendChild(saveBtn);
  saveBtn.addEventListener('click', () => {
    saveSettings();
    console.log('[DEBUG] 設定を保存しました', getCurrentSettings());
    alert('設定を保存しました');
  });

  const exportBtn = document.createElement('button');
  exportBtn.id = 'export-settings';
  exportBtn.textContent = 'エクスポート';
  settingsPanel.appendChild(exportBtn);
  exportBtn.addEventListener('click', () => {
    exportSettingsAsIni();
  });

  const loadInput = document.createElement('input');
  loadInput.type = 'file';
  loadInput.id = 'load-settings-file';
  loadInput.accept = '.ini';
  settingsPanel.appendChild(loadInput);

  loadInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const iniText = reader.result;
      loadSettingsFromIni(iniText);
      saveSettings(); // 同時保存
    };
    reader.readAsText(file);
  });

  settingsPanel.querySelectorAll('input, select').forEach(el => {
    el.addEventListener('change', () => {
      saveSettings();
      console.log('[DEBUG] 設定変更を検知して保存', getCurrentSettings());
    });
  });

  loadSettings();
  console.log('[DEBUG] setupSettingsPanel 完了');
}

export function loadSettings() {
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
    console.log('[DEBUG] 設定をロードしました', settings);
  } catch (e) {
    console.warn('[WARN] 設定の読み込みに失敗しました', e);
  }
}

export function saveSettings() {
  const settings = getCurrentSettings();
  localStorage.setItem('memorySettings', JSON.stringify(settings));
}

export function getCurrentSettings() {
  return {
    showRuby: document.getElementById('set-show-ruby')?.checked ?? true,
    revertDelay: parseInt(document.getElementById('set-revert-delay')?.value || 1000),
    pairRemoveMode: document.getElementById('set-pair-remove')?.value || 'grey',
    fontSize: parseInt(document.getElementById('set-font-size')?.value || 18),
    alwaysShowTime: document.getElementById('set-always-show-time')?.checked ?? true,
    countdownSeconds: parseInt(document.getElementById('set-countdown-seconds')?.value || 60)
  };
}

export function loadSettingsFromIni(iniText) {
  const lines = iniText.split(/\r?\n/).filter(line => line && !line.startsWith('#') && !line.startsWith('['));
  const data = {};
  for (const line of lines) {
    const [key, valueRaw] = line.split('=').map(s => s.trim());
    let value = valueRaw;
    if (value === 'true') value = true;
    else if (value === 'false') value = false;
    else if (!isNaN(value)) value = parseInt(value);
    data[key] = value;
  }

  if ('showRuby' in data) document.getElementById('set-show-ruby').checked = data.showRuby;
  if ('revertDelay' in data) document.getElementById('set-revert-delay').value = data.revertDelay;
  if ('pairRemoveMode' in data) document.getElementById('set-pair-remove').value = data.pairRemoveMode;
  if ('fontSize' in data) document.getElementById('set-font-size').value = data.fontSize;
  if ('alwaysShowTime' in data) document.getElementById('set-always-show-time').checked = data.alwaysShowTime;
  if ('countdownSeconds' in data) document.getElementById('set-countdown-seconds').value = data.countdownSeconds;

  console.log('[DEBUG] INIファイルから設定を読み込みました', data);
}

export function exportSettingsAsIni() {
  const settings = getCurrentSettings();
  let ini = '[settings]\n';
  for (const [k, v] of Object.entries(settings)) {
    ini += `${k} = ${typeof v === 'boolean' ? String(v) : v}\n`;
  }

  const blob = new Blob([ini], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'memory-settings.ini';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}