import ArticleCard from './ArticleCard';

export default function ImportantSection({ articles, onFavoriteChange }) {
  const importantArticles = articles
    .filter((a) => a.importance === '重要')
    .slice(0, 5);

  return (
    <section className="section section-important">
      <h2 className="section-title">🔴 重要（直近3日）</h2>
      {importantArticles.length === 0 ? (
        <p className="empty-msg">現在、重要記事はありません</p>
      ) : (
        importantArticles.map((article) => (
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
