// file-parser.js
// テキストファイルを読み込んで、ルビ付きのペアを整形する関数群

// 対象形式:
// ｜洋弓《ようきゅう》,アーチェリー
// ｜氷球《ひょうきゅう》,アイスホッケー

// ルビ構文を含む行を value/reading に変換する（HTMLルビで）
// file-parser.js
function parsePairs(text) {
  return text
    .split('\n')
    .map(line => line.trim())
    .filter(line => line && line.includes(','))
    .map(line => {
      const [rawA, rawB] = line.split(',');
      return [rawA.trim(), rawB.trim()];
    });
}

  