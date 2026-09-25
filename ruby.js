export const RUBY_REGEXP = /(?:(?:[|｜]?(?<body1>[一-龠々〆ヵヶ]+?))|(?:[|｜](?<body2>[^|｜]+?)))《(?<ruby>.+?)》/gm;

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function convertRubyText(str) {
  const text = String(str);
  let result = '';
  let lastIndex = 0;

  RUBY_REGEXP.lastIndex = 0;
  for (const match of text.matchAll(RUBY_REGEXP)) {
    const index = match.index ?? 0;
    const { body1, body2, ruby } = match.groups || {};
    const body = body1 || body2;

    result += escapeHtml(text.slice(lastIndex, index));
    if (body && ruby) {
      result += `<ruby>${escapeHtml(body)}<rt>${escapeHtml(ruby)}</rt></ruby>`;
    } else {
      result += escapeHtml(match[0]);
    }
    lastIndex = index + match[0].length;
  }
  result += escapeHtml(text.slice(lastIndex));
  RUBY_REGEXP.lastIndex = 0;

  return result;
}

export function renderRubyToElement(el, text, rubyEnabled = true) {
  if (rubyEnabled) {
    el.innerHTML = convertRubyText(text);
  } else {
    RUBY_REGEXP.lastIndex = 0;
    el.textContent = String(text).replace(RUBY_REGEXP, (...args) => {
      const groups = args[args.length - 1];
      const { body1, body2 } = groups || {};
      return body1 || body2 || args[0];
    });
    RUBY_REGEXP.lastIndex = 0;
  }
}
