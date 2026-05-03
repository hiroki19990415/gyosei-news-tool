// 各サイトから情報を取得して public/articles.json に保存するスクリプト
// 実行方法: npm run fetch

import { load as cheerioLoad } from 'cheerio';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// ES modules では __dirname が使えないため、これで代用する
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUTPUT_FILE = path.join(__dirname, '..', 'public', 'articles.json');
const FETCH_TIMEOUT_MS = 15000;

// 90日以上前の記事は除外する（古いアーカイブ記事が混入するのを防ぐ）
const MAX_AGE_DAYS = 90;
const DATE_CUTOFF = new Date();
DATE_CUTOFF.setDate(DATE_CUTOFF.getDate() - MAX_AGE_DAYS);

// ============================================================
// 日付パーサー（和暦・西暦どちらにも対応）
// ============================================================
function parseJapaneseDate(str) {
  if (!str) return null;
  str = str.trim().replace(/\s+/g, '');

  // 西暦: 2026-05-03, 2026.05.03, 2026/05/03, 2026年5月3日
  let m = str.match(/(\d{4})[-./年](\d{1,2})[-./月](\d{1,2})/);
  if (m) {
    return `${m[1]}-${String(m[2]).padStart(2, '0')}-${String(m[3]).padStart(2, '0')}`;
  }

  // 令和: 令和8年5月3日
  m = str.match(/令和(\d+)年(\d{1,2})月(\d{1,2})日/);
  if (m) {
    const year = 2018 + parseInt(m[1]);
    return `${year}-${String(m[2]).padStart(2, '0')}-${String(m[3]).padStart(2, '0')}`;
  }

  // 平成
  m = str.match(/平成(\d+)年(\d{1,2})月(\d{1,2})日/);
  if (m) {
    const year = 1988 + parseInt(m[1]);
    return `${year}-${String(m[2]).padStart(2, '0')}-${String(m[3]).padStart(2, '0')}`;
  }

  return null;
}

// ============================================================
// 重要度の判定（キーワードベース）
// ============================================================
const IMPORTANCE_KEYWORDS = [
  '通知', '事務連絡', '報酬改定', '制度改正', '制度見直し',
  '補助金', '公募', '募集', '締切', '期限',
  '事故', '虐待', '行政処分', '指定取消', '指定停止',
  '医療費助成', '自立支援医療', '更生医療',
  '障害福祉課', '障害児支援',
];

function classifyImportance(title, category) {
  const text = title || '';
  for (const kw of IMPORTANCE_KEYWORDS) {
    if (text.includes(kw)) return '重要';
  }
  if (category === '奈良県庁発表') return '重要';
  return '通常';
}

// ============================================================
// ひとことメモの生成（ルールベース）
// ============================================================
const MEMO_RULES = [
  { keywords: ['通知', '事務連絡'],                   memo: '制度確認の起点' },
  { keywords: ['補助金', '公募', '交付金', '助成', '募集'], memo: '補助金スケジュール確認向き' },
  { keywords: ['締切', '期限'],                       memo: '期限確認を意識' },
  { keywords: ['虐待', '事故', '行政処分', '指定取消'],  memo: '実務影響を見ておきたい' },
  { keywords: ['奈良市', '生駒市', '王寺', '三郷', '香芝', '橿原', '大和郡山', '天理'], memo: '県内共有の材料' },
  { keywords: ['報酬改定', '制度改正', '制度見直し'],    memo: '制度確認の起点' },
  { keywords: ['人材', '人手', '処遇改善'],             memo: '団体対応でも話題化しやすい' },
  { keywords: ['DX', 'デジタル'],                     memo: '実務影響を見ておきたい' },
  { keywords: ['先行', '事例'],                       memo: '県内照会の参考' },
];

function generateMemo(title) {
  const text = title || '';
  for (const rule of MEMO_RULES) {
    if (rule.keywords.some((kw) => text.includes(kw))) return rule.memo;
  }
  return '県内照会の参考';
}

// ============================================================
// タグ付け（ルールベース）
// ============================================================
const TAG_RULES = [
  { keywords: ['通知'],                                 tag: '通知' },
  { keywords: ['事務連絡'],                              tag: '事務連絡' },
  { keywords: ['報酬改定'],                              tag: '報酬改定' },
  { keywords: ['補助金', '交付金', '助成金'],              tag: '補助金' },
  { keywords: ['公募', '募集', '締切', '期限'],            tag: '期限あり' },
  { keywords: ['虐待'],                                 tag: '虐待' },
  { keywords: ['事故'],                                 tag: '事故' },
  { keywords: ['行政処分', '指定取消', '指定停止'],         tag: '行政処分' },
  { keywords: ['自治体DX', 'DX推進', 'デジタル化'],        tag: '自治体DX' },
  { keywords: ['情報セキュリティ', 'セキュリティ'],          tag: '情報セキュリティ' },
  { keywords: ['医療費助成', '障害者医療', '自立支援医療'],   tag: '障害者医療費助成' },
  { keywords: ['人材確保', '人手不足', '処遇改善'],          tag: '人材確保' },
  { keywords: ['パブリックコメント', 'パブコメ'],            tag: 'パブリックコメント' },
  { keywords: ['奈良市'],      tag: '奈良市' },
  { keywords: ['生駒市'],      tag: '生駒市' },
  { keywords: ['王寺町', '王寺'], tag: '王寺町' },
  { keywords: ['三郷町', '三郷'], tag: '三郷町' },
  { keywords: ['香芝市', '香芝'], tag: '香芝市' },
  { keywords: ['橿原市', '橿原'], tag: '橿原市' },
  { keywords: ['大和郡山市', '大和郡山'], tag: '大和郡山市' },
  { keywords: ['天理市', '天理'], tag: '天理市' },
  { keywords: ['奈良県'],      tag: '奈良県' },
];

function assignTags(title, sourceName) {
  const text = (title || '') + ' ' + (sourceName || '');
  const tags = new Set();
  for (const rule of TAG_RULES) {
    if (rule.keywords.some((kw) => text.includes(kw))) tags.add(rule.tag);
  }
  return Array.from(tags);
}

// ============================================================
// タイムアウト付きHTTPフェッチ
// ============================================================
async function fetchWithTimeout(url, timeoutMs = FETCH_TIMEOUT_MS) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; GyoseiNewsBot/1.0)',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'ja,en;q=0.5',
      },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const buf = await res.arrayBuffer();
    return new TextDecoder('utf-8').decode(buf);
  } finally {
    clearTimeout(timer);
  }
}

// ============================================================
// 記事オブジェクトを生成する
// ============================================================
function makeArticle(title, date, href, baseUrl, sourceName, category) {
  let url = href;
  if (href && !href.startsWith('http')) {
    url = href.startsWith('/') ? baseUrl + href : baseUrl + '/' + href;
  }
  if (!url) url = baseUrl;

  const tags = assignTags(title, sourceName);
  const importance = classifyImportance(title, category);
  const memo = generateMemo(title);
  const id = `${sourceName}-${date}-${title.slice(0, 20)}`
    .replace(/[\s/\\?#]/g, '-');

  return { id, title, date, source: sourceName, url, category, tags, importance, memo };
}

// ============================================================
// 厚労省 障害福祉ページ専用スクレイパー
// （リンクテキストに日付＋タイトルが一体で入っている構造）
// ============================================================

// ナビゲーションメニュー等の除外キーワード
const NAV_KEYWORDS = [
  '本文へ移動', 'ページトップ', 'メニュー', 'サイトマップ', 'アクセス',
  '政策', '報道発表', '統計情報', '所管の法令', '申請・募集',
  '組織情報', '調達情報', '関連リンク', 'English', 'Global Site',
  'お問い合わせ', 'プライバシー', 'リンク', 'ホーム',
];

function isNavTitle(title) {
  if (!title || title.length < 8) return true;
  return NAV_KEYWORDS.some((kw) => title.trim() === kw || title.trim().startsWith(kw));
}

function extractMhlwArticles(html, baseUrl, sourceName, category) {
  const $ = cheerioLoad(html);
  const articles = [];
  const seen = new Set();

  $('a[href]').each((_, el) => {
    const href = $(el).attr('href') || '';
    const rawText = $(el).text(); // 改行を保持したまま取得

    // 行ごとに分割して空行を除去
    const lines = rawText.split(/[\n\r]/).map((s) => s.trim()).filter((s) => s.length > 0);
    if (lines.length < 2) return; // 日付＋タイトルの2行構造が必要

    // 日付を含む行を探す
    let date = null;
    for (const line of lines) {
      const d = parseJapaneseDate(line);
      if (d) { date = d; break; }
    }
    if (!date) return;
    if (new Date(date) < DATE_CUTOFF) return;

    // タイトルは「日付でない・8文字以上・ナビでない」行を探す
    const title = lines.find((l) => {
      const d = parseJapaneseDate(l);
      return !d && l.length >= 8 && !isNavTitle(l);
    });
    if (!title || seen.has(title)) return;

    seen.add(title);
    articles.push(makeArticle(title, date, href, baseUrl, sourceName, category));
  });

  return articles;
}

// ============================================================
// HTMLから記事リストを抽出する汎用関数
// ============================================================
function extractArticlesFromHTML(html, baseUrl, sourceName, category) {
  const $ = cheerioLoad(html);
  const articles = [];
  const seen = new Set();

  function tryAdd(title, dateText, href) {
    title = (title || '').trim();
    const date = parseJapaneseDate(dateText);
    if (!title || !date || seen.has(title)) return;
    if (title.length < 8) return; // 短すぎるタイトルを除外
    if (isNavTitle(title)) return; // ナビゲーション項目を除外
    // 90日以上前の記事はスキップ（古いアーカイブ混入防止）
    if (new Date(date) < DATE_CUTOFF) return;
    seen.add(title);
    articles.push(makeArticle(title, date, href, baseUrl, sourceName, category));
  }

  // パターン1: table の行（1列目=日付, 2列目=タイトル+リンク）
  $('table tr').each((_, row) => {
    const cells = $(row).find('td');
    if (cells.length < 2) return;
    const dateText = $(cells[0]).text();
    const linkEl = $(cells[1]).find('a').first();
    const title = linkEl.text() || $(cells[1]).text();
    tryAdd(title, dateText, linkEl.attr('href') || '');
  });

  if (articles.length > 0) return articles;

  // パターン2: dl > dt(日付) + dd(タイトル+リンク)
  $('dl').each((_, dl) => {
    const dts = $(dl).find('dt');
    const dds = $(dl).find('dd');
    dts.each((i, dt) => {
      const dd = dds.eq(i);
      const linkEl = dd.find('a').first();
      const title = linkEl.text() || dd.text();
      tryAdd(title, $(dt).text(), linkEl.attr('href') || '');
    });
  });

  if (articles.length > 0) return articles;

  // パターン3: ul/ol の li（日付テキスト + リンク）
  $('ul li, ol li').each((_, li) => {
    const linkEl = $(li).find('a').first();
    const title = linkEl.text().trim();
    const liText = $(li).text();
    tryAdd(title, liText, linkEl.attr('href') || '');
  });

  if (articles.length > 0) return articles;

  // パターン4: リンクの隣に日付テキストがある構造
  $('a').each((_, a) => {
    const title = $(a).text().trim();
    const href = $(a).attr('href') || '';
    const parentText = $(a).parent().text();
    tryAdd(title, parentText, href);
  });

  return articles;
}

// ============================================================
// 情報源の定義（優先順に記述）
// ============================================================
const SOURCES = [
  // ===== 第1優先：制度・通知系 =====
  {
    name: '厚労省 障害福祉 新着',
    url: 'https://www.mhlw.go.jp/stf/seisakunitsuite/bunya/hukushi_kaigo/shougaishahukushi/index.html',
    baseUrl: 'https://www.mhlw.go.jp',
    category: '障害福祉制度・報酬・通知',
    type: 'mhlw',
  },
  {
    name: '厚労省 障害福祉通知・事務連絡',
    url: 'https://www.mhlw.go.jp/seisakunitsuite/bunya/hukushi_kaigo/shougaishahukushi/kaisei/tuuchi.html',
    baseUrl: 'https://www.mhlw.go.jp',
    category: '障害福祉制度・報酬・通知',
    type: 'mhlw',
  },
  {
    name: '厚労省 障害者虐待防止関係通知',
    url: 'https://www.mhlw.go.jp/stf/seisakunitsuite/bunya/hukushi_kaigo/shougaishahukushi/gyakutaiboushi/tsuuchi.html',
    baseUrl: 'https://www.mhlw.go.jp',
    category: '障害福祉制度・報酬・通知',
    type: 'mhlw',
  },
  {
    name: 'こども家庭庁 通知・事務連絡',
    url: 'https://www.cfa.go.jp/laws/tuuchi',
    baseUrl: 'https://www.cfa.go.jp',
    category: '障害福祉制度・報酬・通知',
  },
  {
    name: 'こども家庭庁 障害児支援',
    url: 'https://www.cfa.go.jp/policies/shougaijishien',
    baseUrl: 'https://www.cfa.go.jp',
    category: '障害福祉制度・報酬・通知',
  },
  {
    name: '奈良県 障害福祉事業者向け案内',
    url: 'https://www.pref.nara.lg.jp/n064/50285.html',
    baseUrl: 'https://www.pref.nara.lg.jp',
    category: '奈良県庁発表',
  },
  // ===== 第2優先：県内自治体 =====
  {
    name: '奈良市 福祉・医療・保健',
    url: 'https://www.city.nara.lg.jp/soshiki/list4-8.html',
    baseUrl: 'https://www.city.nara.lg.jp',
    category: '奈良県内自治体ニュース',
  },
  {
    name: '生駒市',
    url: 'https://www.city.ikoma.lg.jp/',
    baseUrl: 'https://www.city.ikoma.lg.jp',
    category: '奈良県内自治体ニュース',
  },
  {
    name: '三郷町 障がい者福祉',
    url: 'https://www.town.sango.nara.jp/life/2/15/74/',
    baseUrl: 'https://www.town.sango.nara.jp',
    category: '奈良県内自治体ニュース',
  },
  {
    name: '香芝市 障害者福祉',
    url: 'https://www.city.kashiba.lg.jp/life/2/43/59/',
    baseUrl: 'https://www.city.kashiba.lg.jp',
    category: '奈良県内自治体ニュース',
  },
  {
    name: '橿原市 障がい者福祉',
    url: 'https://www.city.kashihara.nara.jp/kenko_fukushi/shogaishafukushi/index.html',
    baseUrl: 'https://www.city.kashihara.nara.jp',
    category: '奈良県内自治体ニュース',
  },
  // ===== 第3優先 =====
  {
    name: '大和郡山市 障害福祉',
    url: 'https://www.city.yamatokoriyama.lg.jp/soshiki/syougaihukushika/syougaihukushi/shogaifukushi/news_shougai/index.html',
    baseUrl: 'https://www.city.yamatokoriyama.lg.jp',
    category: '奈良県内自治体ニュース',
  },
  {
    name: '王寺町 子育て・福祉',
    url: 'https://www.town.oji.nara.jp/category/4.html',
    baseUrl: 'https://www.town.oji.nara.jp',
    category: '奈良県内自治体ニュース',
  },
];

// ============================================================
// メイン処理
// ============================================================
async function fetchSource(source) {
  console.log(`  取得中: ${source.name}`);
  const html = await fetchWithTimeout(source.url);
  let articles;
  if (source.type === 'mhlw') {
    articles = extractMhlwArticles(html, source.baseUrl, source.name, source.category);
  } else {
    articles = extractArticlesFromHTML(html, source.baseUrl, source.name, source.category);
  }
  console.log(`  → ${articles.length}件取得`);
  return articles;
}

async function main() {
  console.log('===== 行政・障害福祉ニュース取得開始 =====');
  console.log(`対象サイト数: ${SOURCES.length}件\n`);

  const allArticles = [];
  const failedSources = [];

  for (const source of SOURCES) {
    try {
      const articles = await fetchSource(source);
      allArticles.push(...articles);
    } catch (err) {
      console.warn(`  ⚠ スキップ [${source.name}]: ${err.message}`);
      failedSources.push(source.name);
    }
  }

  // 日付の新しい順にソート
  allArticles.sort((a, b) => (b.date > a.date ? 1 : -1));

  // 重複除去（同じタイトルは1件だけ残す）
  const seen = new Set();
  const uniqueArticles = allArticles.filter((a) => {
    if (seen.has(a.title)) return false;
    seen.add(a.title);
    return true;
  });

  const result = {
    fetchedAt: new Date().toISOString(),
    articleCount: uniqueArticles.length,
    failedSources,
    articles: uniqueArticles,
  };

  const outputDir = path.dirname(OUTPUT_FILE);
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(result, null, 2), 'utf-8');

  console.log('\n===== 完了 =====');
  console.log(`取得記事: ${uniqueArticles.length}件`);
  if (failedSources.length > 0) {
    console.log(`取得失敗（スキップ済み）: ${failedSources.join(', ')}`);
  }
  console.log(`保存先: public/articles.json`);
}

main().catch((err) => {
  console.error('予期せぬエラー:', err.message);
  process.exit(1);
});
