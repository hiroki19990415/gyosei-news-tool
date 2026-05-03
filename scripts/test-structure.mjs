// 各ページの実際のHTML構造を調べるスクリプト
import { load } from 'cheerio';

const URLS = [
  { name: '厚労省 障害福祉トップ', url: 'https://www.mhlw.go.jp/stf/seisakunitsuite/bunya/hukushi_kaigo/shougaishahukushi/index.html' },
  { name: 'こども家庭庁 通知一覧', url: 'https://www.cfa.go.jp/laws/tuuchi' },
];

for (const src of URLS) {
  try {
    const res = await fetch(src.url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', 'Accept-Language': 'ja' },
      signal: AbortSignal.timeout(12000),
    });
    const html = await res.text();
    const $ = load(html);

    console.log(`\n====== ${src.name} ======`);
    console.log(`ページサイズ: ${html.length} 文字`);

    // 日付らしき文字列が含まれる行を探す
    let dateLines = [];
    $('*').each((_, el) => {
      const text = $(el).children().length === 0 ? $(el).text().trim() : '';
      if (/\d{4}[年\/.\-]\d{1,2}[月\/.\-]\d{1,2}|令和\d+年\d+月/.test(text) && text.length < 80) {
        dateLines.push(text);
      }
    });
    console.log(`日付を含む要素: ${dateLines.length}件`);
    dateLines.slice(0, 5).forEach(d => console.log('  ', d));
  } catch (e) {
    console.log(`\n====== ${src.name} → エラー: ${e.message} ======`);
  }
}
