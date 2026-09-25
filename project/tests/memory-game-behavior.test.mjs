import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '../..');
let importCounter = 0;

class ClassList {
  constructor() { this.values = new Set(); }
  add(...values) { values.forEach(value => this.values.add(value)); }
  remove(...values) { values.forEach(value => this.values.delete(value)); }
  contains(value) { return this.values.has(value); }
}

class FakeElement {
  constructor(env, tagName = 'div', id = '') {
    this.env = env;
    this.tagName = tagName.toUpperCase();
    this.children = [];
    this.parentElement = null;
    this.style = { display: '' };
    this.listeners = new Map();
    this.dataset = {};
    this.classList = new ClassList();
    this.value = '';
    this.checked = false;
    this.files = [];
    this.textContent = '';
    this._innerHTML = '';
    this._id = '';
    this.accept = '';
    env.elements.push(this);
    if (id) this.id = id;
  }

  set id(value) { this._id = value; }
  get id() { return this._id; }

  appendChild(child) {
    child.parentElement = this;
    this.children.push(child);
    return child;
  }

  removeChild(child) {
    this.children = this.children.filter(item => item !== child);
    child.parentElement = null;
  }

  addEventListener(type, callback) {
    const callbacks = this.listeners.get(type) ?? [];
    callbacks.push(callback);
    this.listeners.set(type, callbacks);
  }

  dispatch(type, extra = {}) {
    for (const callback of this.listeners.get(type) ?? []) {
      callback({ target: this, currentTarget: this, ...extra });
    }
  }

  click() { this.dispatch('click'); }

  querySelectorAll(selector) {
    const tags = selector.split(',').map(value => value.trim().toUpperCase());
    const result = [];
    const visit = element => {
      for (const child of element.children) {
        if (tags.includes(child.tagName)) result.push(child);
        visit(child);
      }
    };
    visit(this);
    return result;
  }

  set innerHTML(value) {
    this._innerHTML = value;
    if (value === '') {
      this.children = [];
      return;
    }

    if (this.id === 'settings-panel' && value.includes('set-revert-delay')) {
      const controls = [
        ['input', 'set-show-ruby', '', false],
        ['input', 'set-revert-delay', '1000', false],
        ['select', 'set-pair-remove', 'grey', false],
        ['input', 'set-font-size', '18', false],
        ['input', 'set-always-show-time', '', false],
        ['input', 'set-countdown-seconds', '60', false],
      ];
      for (const [tag, id, controlValue, checked] of controls) {
        if (!value.includes(id) || this.env.document.getElementById(id)) continue;
        const element = new FakeElement(this.env, tag, id);
        element.value = controlValue;
        element.checked = checked;
        this.appendChild(element);
      }
    }
  }

  get innerHTML() { return this._innerHTML; }
}

function createDeferred() {
  let resolve;
  let reject;
  const promise = new Promise((res, rej) => { resolve = res; reject = rej; });
  return { promise, resolve, reject };
}

async function boot({ defaultPairText = 'D,9\nE,8\n', deferDefaultFetch = false } = {}) {
  const env = {
    elements: [],
    documentListeners: new Map(),
    alerts: [],
    timeoutQueue: new Map(),
    nextTimeout: 1,
    intervals: new Set(),
    nextInterval: 1,
    deferredFetch: deferDefaultFetch ? createDeferred() : null,
  };

  const body = new FakeElement(env, 'body');
  env.document = {
    body,
    createElement: tag => new FakeElement(env, tag),
    getElementById: id => env.elements.find(element => element.id === id) ?? null,
    addEventListener(type, callback) {
      const callbacks = env.documentListeners.get(type) ?? [];
      callbacks.push(callback);
      env.documentListeners.set(type, callbacks);
    },
  };

  const add = (tag, id, parent = body) => {
    const element = new FakeElement(env, tag, id);
    parent.appendChild(element);
    return element;
  };

  const controls = add('div', 'controls');
  add('div', 'game-board');
  const fileInput = add('input', 'file-input');
  fileInput.style.display = 'none';
  fileInput.accept = '.txt';
  add('input', 'use-file');
  const pairCount = add('select', 'pair-count');
  pairCount.value = 'max';
  const mode = add('select', 'mode');
  mode.value = 'random';
  const showRuby = add('input', 'show-ruby');
  showRuby.checked = true;
  const enableTimer = add('input', 'enable-timer');
  enableTimer.checked = true;
  add('button', 'start-game');
  add('div', 'log-area');
  add('div', 'settings-panel');

  const storage = new Map();
  globalThis.document = env.document;
  globalThis.window = { innerWidth: 1200 };
  globalThis.localStorage = {
    getItem: key => storage.get(key) ?? null,
    setItem: (key, value) => storage.set(key, value),
  };
  globalThis.alert = message => env.alerts.push(message);
  globalThis.setTimeout = callback => {
    const id = env.nextTimeout++;
    env.timeoutQueue.set(id, callback);
    return id;
  };
  globalThis.clearTimeout = id => env.timeoutQueue.delete(id);
  globalThis.setInterval = callback => {
    const id = env.nextInterval++;
    env.intervals.add(id);
    return id;
  };
  globalThis.clearInterval = id => env.intervals.delete(id);
  globalThis.FileReader = class {
    readAsText(file) {
      this.result = file.content;
      this.onload?.({ target: { result: this.result } });
    }
  };
  globalThis.fetch = async () => {
    if (env.deferredFetch) return env.deferredFetch.promise;
    return { ok: true, text: async () => defaultPairText };
  };

  const moduleUrl = pathToFileURL(path.join(ROOT, 'main.js')).href + `?audit=${++importCounter}`;
  await import(moduleUrl);
  for (const callback of env.documentListeners.get('DOMContentLoaded') ?? []) callback();
  env.settle = async () => {
    for (let i = 0; i < 8; i++) await Promise.resolve();
  };
  await env.settle();

  env.controls = controls;
  env.fileInput = fileInput;
  env.pairCount = pairCount;
  env.mode = mode;
  env.showRuby = showRuby;
  env.enableTimer = enableTimer;
  env.useFile = env.document.getElementById('use-file');
  env.startButton = env.document.getElementById('start-game');
  env.board = env.document.getElementById('game-board');
  env.timerDisplay = env.document.getElementById('timer-display');
  env.runTimeouts = () => {
    const errors = [];
    const pending = [...env.timeoutQueue.entries()];
    env.timeoutQueue.clear();
    for (const [, callback] of pending) {
      try { callback(); } catch (error) { errors.push(error); }
    }
    return errors;
  };
  env.importPairs = text => {
    env.fileInput.files = [{ content: text }];
    env.fileInput.value = 'selected-file.txt';
    env.fileInput.dispatch('change');
  };
  env.start = pairCountValue => {
    env.pairCount.value = String(pairCountValue);
    env.startButton.click();
  };
  return env;
}

function settingsButton(env) {
  return env.elements.find(element => element.tagName === 'BUTTON' && element.textContent === '⚙️ 設定');
}

function cardTexts(env) {
  return env.board.children.map(card => card.children[0]).filter(Boolean);
}

test('settings button exposes one authoritative settings panel', async () => {
  const env = await boot();
  assert.equal(env.elements.filter(element => element.id === 'settings-panel').length, 1);
  const button = settingsButton(env);
  assert.ok(button, 'settings button should exist');
  button.click();
  const panel = env.document.getElementById('settings-panel');
  assert.notEqual(panel.style.display, 'none');
  assert.ok(env.document.getElementById('load-settings-file'));
  assert.ok(env.document.getElementById('export-settings'));
});

test('visible Ruby and timer controls govern the next game', async () => {
  const env = await boot({ defaultPairText: '｜漢字《かんじ》,meaning\n' });
  await env.settle();
  env.start(1);
  assert.ok(cardTexts(env).some(element => element.innerHTML.includes('<ruby>')), 'checked Show Ruby should render ruby');

  env.showRuby.checked = false;
  env.enableTimer.checked = false;
  env.start(1);
  assert.ok(cardTexts(env).every(element => !element.innerHTML.includes('<ruby>')), 'unchecked Show Ruby should suppress ruby markup');
  assert.equal(env.timerDisplay.textContent, '', 'unchecked timer must not show/start a timer');
  assert.equal(env.intervals.size, 0, 'unchecked timer must clear active interval');
});

test('hide mode removes a matched pair without delayed null-state failure', async () => {
  const env = await boot({ defaultPairText: 'A,1\n' });
  await env.settle();
  const removeMode = env.document.getElementById('set-pair-remove');
  removeMode.value = 'hide';
  env.start(1);
  const [first, second] = env.board.children;
  first.click();
  second.click();
  const errors = env.runTimeouts();
  assert.deepEqual(errors, []);
  assert.ok(first.classList.contains('removed'));
  assert.ok(second.classList.contains('removed'));
});

test('late default pair fetch cannot overwrite external-file mode', async () => {
  const env = await boot({ deferDefaultFetch: true });
  env.useFile.checked = true;
  env.useFile.dispatch('change');
  env.importPairs('EXTERNAL,1\nSECOND,2\n');
  env.deferredFetch.resolve({ ok: true, text: async () => 'DEFAULT,9\n' });
  await env.settle();
  env.start(2);
  const values = env.board.children.map(card => card.dataset.value);
  assert.ok(values.includes('EXTERNAL'));
  assert.ok(values.includes('SECOND'));
  assert.ok(!values.includes('DEFAULT'));
});

test('re-entering external-file mode does not retain a stale file selection with cleared state', async () => {
  const env = await boot();
  env.useFile.checked = true;
  env.useFile.dispatch('change');
  env.importPairs('A,1\n');
  env.useFile.checked = false;
  env.useFile.dispatch('change');
  env.useFile.checked = true;
  env.useFile.dispatch('change');
  assert.equal(env.fileInput.value, '');
});

test('starting a new round clears transient first-card state', async () => {
  const env = await boot({ defaultPairText: 'A,1\nB,2\n' });
  await env.settle();
  env.mode.value = 'ascending';
  env.start(1);
  env.board.children[0].click();
  env.start(1);
  const newFirst = env.board.children[0];
  newFirst.click();
  assert.ok(newFirst.classList.contains('flipped'));
  assert.ok(!newFirst.classList.contains('matched'));
});

test('distinct source rows get distinct pair identities', async () => {
  const env = await boot();
  env.useFile.checked = true;
  env.useFile.dispatch('change');
  env.importPairs('ab,c\na,bc\n');
  env.start(2);
  const ids = new Set(env.board.children.map(card => card.dataset.pairId));
  assert.equal(ids.size, 2);
});

test('pair file picker advertises both txt and csv inputs', async () => {
  const html = await fs.readFile(path.join(ROOT, 'index.html'), 'utf8');
  assert.match(html, /id="file-input"[^>]*accept="[^"]*\.txt[^"]*\.csv[^"]*"/);
});
