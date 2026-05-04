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

  // カテゴリ→地域バッジの変換
  const geoMap = {
    '障害福祉制度・報酬・通知': { label: '🏛 国', cls: 'badge-national' },
    '奈良県庁発表':             { label: '🌸 県', cls: 'badge-pref' },
    '奈良県内自治体ニュース':   { label: '🏘 市町村', cls: 'badge-city' },
  };
  const geo = geoMap[article.category] || { label: '📄', cls: 'badge-normal' };

  return (
    <div className="article-card">
      <div className="card-header">
        <span className={`badge ${geo.cls}`}>{geo.label}</span>
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
