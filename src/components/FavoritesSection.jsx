import ArticleCard from './ArticleCard';

export default function FavoritesSection({ favorites, onFavoriteChange }) {
  return (
    <section className="section section-favorites">
      <h2 className="section-title">⭐ お気に入り</h2>
      {favorites.length === 0 ? (
        <p className="empty-msg">お気に入りに追加した記事がここに残ります（3日後も表示）</p>
      ) : (
        favorites.map((article) => (
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
