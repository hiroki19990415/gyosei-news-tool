import { useState } from 'react';
import { addFavorite, removeFavorite, isFavorite } from '../utils/storage';

export default function ArticleCard({ article, onFavoriteChange }) {
  const [favorited, setFavorited] = useState(isFavorite(article.id));

  function handleFavoriteToggle() {
    if (favorited) {
      removeFavorite(article.id);
      setFavorited(false);
    } else {
      addFavorite(article);
      setFavorited(true);
    }
    if (onFavoriteChange) onFavoriteChange();
  }

  return (
    <div className={`article-card ${article.importance === '重要' ? 'card-important' : 'card-normal'}`}>
      <div className="card-header">
        <span className={`badge ${article.importance === '重要' ? 'badge-important' : 'badge-normal'}`}>
          {article.importance === '重要' ? '🔴 重要' : '📰 通常'}
        </span>
        <span className="badge badge-category">{article.category}</span>
        <button
          className={`fav-btn ${favorited ? 'fav-active' : ''}`}
          onClick={handleFavoriteToggle}
          title={favorited ? 'お気に入りから外す' : 'お気に入りに追加'}
        >
          {favorited ? '⭐' : '☆'}
        </button>
      </div>

      <a
        href={article.url}
        target="_blank"
        rel="noopener noreferrer"
        className="card-title"
      >
        {article.title}
      </a>

      <div className="card-meta">
        <span className="meta-date">📅 {article.date}</span>
        <span className="meta-source">🏛 {article.source}</span>
      </div>

      <div className="card-tags">
        {article.tags.map((tag) => (
          <span key={tag} className="tag">#{tag}</span>
        ))}
      </div>

      {article.memo && (
        <div className="card-memo">
          💬 {article.memo}
        </div>
      )}
    </div>
  );
}
