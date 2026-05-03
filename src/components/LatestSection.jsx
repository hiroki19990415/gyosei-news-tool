import ArticleCard from './ArticleCard';

// 障害福祉・行政関連の優先キーワード
const WELFARE_KEYWORDS = [
  '障害', '福祉', '支援', '介護', '自立', '通所', '就労',
  '手帳', '通知', '事務連絡', '報酬', '制度', '補助', '助成',
  '医療', '保健', '虐待', '行政処分', '指定', '事業者',
  '奈良県', '奈良市', '生駒市', '香芝市', '橿原市', '三郷町',
];

function getWelfareScore(article) {
  const text = article.title + ' ' + article.category + ' ' + article.tags.join(' ');
  return WELFARE_KEYWORDS.filter((kw) => text.includes(kw)).length;
}

export default function LatestSection({ articles, onFavoriteChange }) {
  // 障害福祉スコアが高い順 → 日付が新しい順でソート
  const sorted = [...articles].sort((a, b) => {
    const scoreDiff = getWelfareScore(b) - getWelfareScore(a);
    if (scoreDiff !== 0) return scoreDiff;
    return b.date > a.date ? 1 : -1;
  });

  return (
    <section className="section section-latest">
      <h2 className="section-title">📰 最新一覧（表示期間内）</h2>
      {sorted.length === 0 ? (
        <p className="empty-msg">現在、表示できる記事はありません</p>
      ) : (
        sorted.map((article) => (
          <ArticleCard
            key={article.id}
            article={article}
            onFavoriteChange={onFavoriteChange}
          />
        ))
      )}
    </section>
  );
}
