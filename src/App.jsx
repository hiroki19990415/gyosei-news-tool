import { useState, useEffect, useCallback } from 'react';
import { sampleArticles } from './data/sampleData';
import { getFavorites, isWithinDays } from './utils/storage';
import ImportantSection from './components/ImportantSection';
import LatestSection from './components/LatestSection';
import FavoritesSection from './components/FavoritesSection';
import ChatGPTSummary from './components/ChatGPTSummary';
import './App.css';

// 関連性の高い記事かどうかを判定するキーワード
const RELEVANCE_KEYWORDS = [
  '障害', '福祉', '支援', '介護', '医療', '保健',
  '自立', '通所', '訪問', '就労', '相談', '手帳',
  '補助金', '助成', '公募', '募集', '通知', '事務連絡',
  '改定', '改正', '条例', '予算', '審議', '補正',
  '虐待', '処分', '指定', '行政', '自治体', 'DX',
  '奈良', '市町村', 'マイナ', 'セキュリティ',
];

function isRelevant(article) {
  // 専門系サイトは全件OK
  const trustedSources = [
    '厚労省', 'こども家庭庁', '奈良県', '総務省',
    '奈良市 福祉', '香芝市 障害', '三郷町 障がい', '大和郡山市 障害',
    '橿原市 障がい', '天理市',
  ];
  for (const s of trustedSources) {
    if (article.source.includes(s)) return true;
  }
  // 一般サイト（王寺町・生駒市トップなど）はキーワードで判定
  const text = article.title + ' ' + article.category + ' ' + article.tags.join(' ');
  return RELEVANCE_KEYWORDS.some((kw) => text.includes(kw));
}

const PERIOD_OPTIONS = [
  { label: '直近3日', days: 3 },
  { label: '直近7日', days: 7 },
  { label: '直近30日', days: 30 },
];

export default function App() {
  const [allArticles, setAllArticles] = useState([]);
  const [favorites, setFavorites] = useState(getFavorites);
  const [dataMode, setDataMode] = useState('loading');
  const [fetchedAt, setFetchedAt] = useState(null);
  const [failedSources, setFailedSources] = useState([]);
  const [displayDays, setDisplayDays] = useState(30);

  useEffect(() => {
    fetch('/articles.json')
      .then((res) => {
        if (!res.ok) throw new Error('not found');
        return res.json();
      })
      .then((data) => {
        setAllArticles(data.articles || []);
        setFetchedAt(data.fetchedAt || null);
        setFailedSources(data.failedSources || []);
        setDataMode('real');
      })
      .catch(() => {
        setAllArticles(sampleArticles);
        setDataMode('sample');
      });
  }, []);

  const refreshFavorites = useCallback(() => {
    setFavorites(getFavorites());
  }, []);

  // 表示期間と関連性でフィルタリング
  const articles = allArticles
    .filter((a) => isWithinDays(a.date, displayDays))
    .filter((a) => isRelevant(a));

  const importantCount = articles.filter((a) => a.importance === '重要').length;
  const normalCount = articles.filter((a) => a.importance === '通常').length;

  return (
    <div className="app">
      <header className="app-header">
        <h1 className="app-title">🏛 行政・障害福祉ニュース</h1>
        <p className="app-subtitle">奈良県障害福祉課 実務情報収集ツール</p>

        {dataMode === 'loading' && (
          <p className="last-fetch">読み込み中...</p>
        )}
        {dataMode === 'real' && fetchedAt && (
          <p className="last-fetch">
            最終取得: {new Date(fetchedAt).toLocaleString('ja-JP')}
            　（全{allArticles.length}件取得済み）
          </p>
        )}
        {dataMode === 'sample' && (
          <p className="last-fetch sample-mode">
            ⚠ サンプルデータ表示中 ― npm run fetch を実行すると実データに切り替わります
          </p>
        )}

        <div className="period-selector">
          {PERIOD_OPTIONS.map((opt) => (
            <button
              key={opt.days}
              className={`period-btn ${displayDays === opt.days ? 'active' : ''}`}
              onClick={() => setDisplayDays(opt.days)}
            >
              {opt.label}
            </button>
          ))}
        </div>

        <p className="article-count">
          表示中：{articles.length}件
          （重要 {importantCount}件 / 通常 {normalCount}件）
        </p>
      </header>

      <main className="app-main">
        {failedSources.length > 0 && (
          <div className="failed-sources">
            <strong>⚠ 取得できなかった情報源：</strong>
            <ul>
              {failedSources.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ul>
          </div>
        )}

        <ImportantSection articles={articles} onFavoriteChange={refreshFavorites} />
        <LatestSection articles={articles} onFavoriteChange={refreshFavorites} />
        <FavoritesSection favorites={favorites} onFavoriteChange={refreshFavorites} />
        <ChatGPTSummary articles={articles} />
      </main>

      <footer className="app-footer">
        <p>※ このツールは公開情報のみを収集します</p>
        <p>※ 表示期間を超えた記事は非表示になります（お気に入りを除く）</p>
      </footer>
    </div>
  );
}
