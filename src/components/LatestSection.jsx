import ArticleCard from './ArticleCard';

export default function LatestSection({ articles, onFavoriteChange }) {
  return (
    <section className="section section-latest">
      <h2 className="section-title">📰 最新一覧（直近3日）</h2>
      {articles.length === 0 ? (
        <p className="empty-msg">現在、表示できる記事はありません</p>
      ) : (
        articles.map((article) => (
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
