import test from 'node:test';
import assert from 'node:assert/strict';
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

async function boot({ defaultPairText = 'A,1\n' } = {}) {
  const env = {
    elements: [],
    documentListeners: new Map(),
    alerts: [],
    intervals: new Set(),
    nextInterval: 1,
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
  add('input', 'use-file');
  const pairCount = add('select', 'pair-count');
  pairCount.value = 'max';
  const mode = add('select', 'mode');
  mode.value = 'ascending';
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
    callback();
    return 1;
  };
  globalThis.clearTimeout = () => {};
  globalThis.setInterval = () => {
    const id = env.nextInterval++;
    env.intervals.add(id);
    return id;
  };
  globalThis.clearInterval = id => env.intervals.delete(id);
  globalThis.FileReader = class {};
  globalThis.fetch = async () => ({ ok: true, text: async () => defaultPairText });

  const moduleUrl = pathToFileURL(path.join(ROOT, 'main.js')).href + `?lifecycle=${++importCounter}`;
  await import(moduleUrl);
  for (const callback of env.documentListeners.get('DOMContentLoaded') ?? []) callback();
  for (let i = 0; i < 8; i++) await Promise.resolve();

  env.board = env.document.getElementById('game-board');
  env.startButton = env.document.getElementById('start-game');
  env.pairCount = pairCount;
  env.logArea = env.document.getElementById('log-area');
  env.timerDisplay = env.document.getElementById('timer-display');
  env.start = count => {
    env.pairCount.value = String(count);
    env.startButton.click();
  };
  return env;
}

test('final match enters completion state and stops the active timer', async () => {
  const env = await boot();
  env.start(1);
  assert.equal(env.intervals.size, 1, 'timer should be active during the round');

  const [first, second] = env.board.children;
  first.click();
  second.click();

  assert.ok(first.classList.contains('matched'));
  assert.ok(second.classList.contains('matched'));
  assert.equal(env.intervals.size, 0, 'final match must stop the timer');
  assert.equal(env.timerDisplay.textContent, '', 'completed round must clear timer display');
  assert.match(
    env.logArea.children.at(-1)?.textContent ?? '',
    /完了/,
    'completion must be visible to the user',
  );
});
