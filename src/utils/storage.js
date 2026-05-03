// localStorageへの読み書きをまとめたファイル

const FAVORITES_KEY = 'gyosei_favorites';
const LAST_FETCH_KEY = 'gyosei_last_fetch';

// お気に入りの一覧を取得する
export function getFavorites() {
  try {
    const raw = localStorage.getItem(FAVORITES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

// お気に入りに追加する
export function addFavorite(article) {
  const favorites = getFavorites();
  const exists = favorites.some((f) => f.id === article.id);
  if (!exists) {
    favorites.push(article);
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
  }
}

// お気に入りから削除する
export function removeFavorite(articleId) {
  const favorites = getFavorites().filter((f) => f.id !== articleId);
  localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
}

// お気に入りかどうか判定する
export function isFavorite(articleId) {
  return getFavorites().some((f) => f.id === articleId);
}

// 最終取得日時を保存する
export function saveLastFetchTime() {
  localStorage.setItem(LAST_FETCH_KEY, new Date().toISOString());
}

// 最終取得日時を取得する
export function getLastFetchTime() {
  return localStorage.getItem(LAST_FETCH_KEY);
}

// 記事が指定日数以内かどうか判定する
export function isWithinDays(dateStr, days) {
  const articleDate = new Date(dateStr);
  const now = new Date();
  const diffDays = (now - articleDate) / (1000 * 60 * 60 * 24);
  return diffDays <= days;
}

// 後方互換用（直近3日）
export function isWithin3Days(dateStr) {
  return isWithinDays(dateStr, 3);
}
