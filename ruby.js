export const RUBY_REGEXP = /(?:(?:[|｜]?(?<body1>[一-龠々〆ヵヶ]+?))|(?:[|｜](?<body2>[^|｜]+?)))《(?<ruby>.+?)》/gm;

export function convertRubyText(str) {
  return str.replace(RUBY_REGEXP, (...args) => {
    const groups = args[args.length - 1];
    const { body1, body2, ruby } = groups || {};
    const body = body1 || body2;
    return body && ruby ? `<ruby>${body}<rt>${ruby}</rt></ruby>` : args[0];
  });
}

export function renderRubyToElement(el, text, rubyEnabled = true) {
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

