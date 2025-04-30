const RUBY_REGEXP = /(?:(?:[|｜]?(?<body1>[一-龠]+?))|(?:[|｜](?<body2>[^|｜]+?)))《(?<ruby>.+?)》/gm;

// ルビ処理を単語単位で実行する関数
function processRuby(node) {
    if (!node.textContent) return;

    const matches = Array.from(node.textContent.matchAll(RUBY_REGEXP));
    let currentNode = node;

    for (const match of matches) {
        const { body1, body2, ruby } = match.groups || {};
        const body = body1 || body2;

        if (!body || !ruby) continue;

        // ルビのDOMを作成
        const rubyElement = document.createElement("ruby");
        rubyElement.classList.add("ruby");
        rubyElement.textContent = body;
        
        const rtElement = document.createElement("rt");
        rtElement.textContent = ruby;

        // ルビのフォントサイズを変更
        rtElement.style.fontSize = "0.6em";  // フォントサイズを変更 (0.6emに設定)

        rubyElement.appendChild(rtElement);

        // ノードの置換
        const index = currentNode.textContent.indexOf(match[0]);
        const beforeText = currentNode.splitText(index);
        beforeText.textContent = beforeText.textContent.slice(match[0].length);
        currentNode.replaceWith(rubyElement);

        // 次のノードを対象に続行
        currentNode = beforeText;
    }
}

// 全体処理を修正
function applyRubyProcessing(container) {
    const textNodes = Array.from(container.querySelectorAll("p, h1, h2, h3, h4, h5, h6, span"));

    textNodes.forEach((node) => {
        processRuby(node);
    });
}
