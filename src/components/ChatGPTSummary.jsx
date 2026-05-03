import { useState } from 'react';

export default function ChatGPTSummary({ articles }) {
  const [copied, setCopied] = useState(false);
  const [includeNormal, setIncludeNormal] = useState(false);

  const importantArticles = articles.filter((a) => a.importance === '重要');
  const normalArticles = articles.filter((a) => a.importance === '通常');

  function buildText() {
    const today = new Date().toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    let text = `【行政・障害福祉ニュースまとめ】${today}\n`;
    text += `収集件数：重要 ${importantArticles.length}件 / 通常 ${normalArticles.length}件\n`;
    text += `\n`;

    text += `■ 重要記事（${importantArticles.length}件）\n`;
    text += `${'─'.repeat(40)}\n`;
    importantArticles.forEach((a, i) => {
      text += `\n【${i + 1}】${a.title}\n`;
      text += `  日付：${a.date}\n`;
      text += `  出典：${a.source}\n`;
      text += `  URL：${a.url}\n`;
      text += `  カテゴリ：${a.category}\n`;
      text += `  タグ：${a.tags.join('、')}\n`;
      text += `  メモ：${a.memo}\n`;
    });

    if (includeNormal && normalArticles.length > 0) {
      text += `\n\n■ 通常記事（${normalArticles.length}件）\n`;
      text += `${'─'.repeat(40)}\n`;
      normalArticles.forEach((a, i) => {
        text += `\n【${i + 1}】${a.title}\n`;
        text += `  日付：${a.date}\n`;
        text += `  出典：${a.source}\n`;
        text += `  URL：${a.url}\n`;
        text += `  カテゴリ：${a.category}\n`;
        text += `  タグ：${a.tags.join('、')}\n`;
        text += `  メモ：${a.memo}\n`;
      });
    }

    return text;
  }

  function handleCopy() {
    navigator.clipboard.writeText(buildText()).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <section className="section section-chatgpt">
      <h2 className="section-title">📋 ChatGPTに貼る用まとめ</h2>
      <div className="chatgpt-controls">
        <label className="toggle-label">
          <input
            type="checkbox"
            checked={includeNormal}
            onChange={(e) => setIncludeNormal(e.target.checked)}
          />
          <span> 通常記事も含める</span>
        </label>
        <button
          className={`copy-btn ${copied ? 'copy-done' : ''}`}
          onClick={handleCopy}
        >
          {copied ? '✅ コピーしました！' : '📋 クリップボードにコピー'}
        </button>
      </div>
      <pre className="chatgpt-preview">{buildText()}</pre>
    </section>
  );
}
