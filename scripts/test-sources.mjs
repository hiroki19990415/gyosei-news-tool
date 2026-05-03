import { load } from 'cheerio';

const URLS = [
  { name: '厚労省 報道発表', url: 'https://www.mhlw.go.jp/stf/houdou/index.html' },
  { name: '厚労省 新着情報', url: 'https://www.mhlw.go.jp/stf/newpage_hpupdate.html' },
  { name: 'こども家庭庁 新着情報', url: 'https://www.cfa.go.jp/news/' },
  { name: 'こども家庭庁 障害児支援', url: 'https://www.cfa.go.jp/policies/shougaijishien' },
];

for (const src of URLS) {
  try {
    const res = await fetch(src.url, {
      headers: { 'User-Agent': 'Mozilla/5.0', 'Accept-Language': 'ja' },
      signal: AbortSignal.timeout(10000),
    });
    const html = await res.text();
    const $ = load(html);
    let samples = [];
    $('table tr').each((_, r) => {
      const cells = $(r).find('td');
      if (cells.length >= 2) {
        const date = $(cells[0]).text().trim().slice(0, 20);
        const title = $(cells[1]).text().trim().slice(0, 40);
        if (date && title) samples.push(`  ${date} | ${title}`);
      }
    });
    if (samples.length === 0) {
      $('ul li, ol li').each((_, li) => {
        const t = $(li).text().trim().slice(0, 60);
        if (t.length > 10) samples.push(`  ${t}`);
      });
    }
    console.log(`\n=== ${src.name} (${samples.length}件) ===`);
    samples.slice(0, 5).forEach(s => console.log(s));
  } catch (e) {
    console.log(`\n=== ${src.name} → エラー: ${e.message} ===`);
  }
}
