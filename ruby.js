// ruby.js
// ルビ付き文字列を HTML の <ruby> 要素に変換する関数

const RUBY_REGEXP = /(?:(?:[|｜]?(?<body1>[一-龠々〆ヵヶ]+?))|(?:[|｜](?<body2>[^|｜]+?)))《(?<ruby>.+?)》/gm;

// 文字列全体に対してルビHTMLを返す（文字列→文字列）
function convertRubyText(str) {
  return str.replace(RUBY_REGEXP, (...args) => {
    const groups = args[args.length - 1];
    const { body1, body2, ruby } = groups || {};
    const body = body1 || body2;
    return body && ruby ? `<ruby>${body}<rt>${ruby}</rt></ruby>` : args[0];
  });
}

// DOMノードに対してルビ処理を適用（textContentをHTML化）
function applyRubyProcessing(container) {
  const targets = container.querySelectorAll("p, h1, h2, h3, h4, h5, h6, span");
  targets.forEach(node => {
    if (node.childNodes.length === 1 && node.childNodes[0].nodeType === Node.TEXT_NODE) {
      const replaced = convertRubyText(node.textContent);
      const span = document.createElement("span");
      span.innerHTML = replaced;
      node.replaceWith(span);
    }
  });
}

// カード内など任意の HTML 要素に適用するユーティリティ
function renderRubyToElement(el, text, rubyEnabled = true) {
  if (rubyEnabled) {
    el.innerHTML = convertRubyText(text);
  } else {
    el.textContent = text.replace(RUBY_REGEXP, (...args) => {
      const groups = args[args.length - 1];
      const { body1, body2 } = groups || {};
      return body1 || body2 || args[0];
    });
  }
}

// グローバルに公開
window.convertRubyText = convertRubyText;
window.applyRubyProcessing = applyRubyProcessing;
window.renderRubyToElement = renderRubyToElement;

// 🔽 デフォルトで pair.txt を fetch して読み込む
fetch('pair.txt')
  .then(response => response.text())
  .then(text => {
    if (window.pairsLoadedExternally) return; // ゲーム側が読み込んでいたら無視
    if (typeof window.loadPairsFromText === 'function') {
      window.loadPairsFromText(text);
      console.log('[DEBUG] pair.txt を初期ロードしました');
    } else {
      console.warn('[WARN] loadPairsFromText が未定義です');
    }
  })
  .catch(err => console.warn('[WARN] pair.txt の読み込みに失敗しました', err));
