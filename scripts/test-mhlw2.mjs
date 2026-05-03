import { load } from 'cheerio';

const url = 'https://www.mhlw.go.jp/stf/seisakunitsuite/bunya/hukushi_kaigo/shougaishahukushi/index.html';
const res = await fetch(url, {
  headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', 'Accept-Language': 'ja' },
  signal: AbortSignal.timeout(12000),
});
const html = await res.text();
const $ = load(html);

// 日付divの2つ上の祖先要素を確認
$('div').each((_, el) => {
  const text = $(el).text().trim();
  if (/^\d{4}年\d{1,2}月\d{1,2}日/.test(text) && text.length < 40) {
    // 親の親（祖父母）要素のテキストとリンクを見る
    const grandParent = $(el).parent().parent();
    const gpText = grandParent.text().trim().slice(0, 200);
    const links = grandParent.find('a');
    console.log(`\n=== 日付: "${text}" ===`);
    console.log(`祖父母テキスト（200字）: ${gpText}`);
    links.each((_, a) => {
      console.log(`  リンク: "${$(a).text().trim().slice(0,60)}" → ${$(a).attr('href')?.slice(0,80)}`);
    });
  }
});
