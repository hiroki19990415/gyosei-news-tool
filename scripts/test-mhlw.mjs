import { load } from 'cheerio';

const url = 'https://www.mhlw.go.jp/stf/seisakunitsuite/bunya/hukushi_kaigo/shougaishahukushi/index.html';

const res = await fetch(url, {
  headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', 'Accept-Language': 'ja' },
  signal: AbortSignal.timeout(12000),
});
const html = await res.text();
const $ = load(html);

// 日付が含まれる要素の親・兄弟要素を確認する
$('*').each((_, el) => {
  const text = $(el).children().length === 0 ? $(el).text().trim() : '';
  if (/\d{4}年\d{1,2}月\d{1,2}日/.test(text) && text.length < 40) {
    const parent = $(el).parent();
    const parentText = parent.text().trim().slice(0, 120);
    const links = parent.find('a');
    console.log(`\n--- 日付テキスト: "${text}" ---`);
    console.log(`  親要素: <${parent[0]?.name}>`);
    console.log(`  親のテキスト: ${parentText}`);
    links.each((_, a) => {
      console.log(`  リンク: ${$(a).text().trim().slice(0,60)} → ${$(a).attr('href')?.slice(0,80)}`);
    });
  }
});
