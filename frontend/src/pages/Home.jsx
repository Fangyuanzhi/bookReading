import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import api from '../api/config';
import BookCard from '../components/BookCard';
import ContinueReadingCard from '../components/ContinueReadingCard';
import LoadErrorPanel from '../components/LoadErrorPanel';
import { APP_CLASSES, APP_NAME, APP_TAGLINE, APP_TYPE } from '../styles/theme';
import { filterRecentReadingItems } from '../utils/recentReading';
import { useAuthStore } from '../store/auth';

export default function Home() {
  const location = useLocation();
  const [books, setBooks] = useState([]);
  const [originalBooks, setOriginalBooks] = useState([]);
  const [recentReading, setRecentReading] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const { user } = useAuthStore();

  useEffect(() => {
    if (location.state?.notice) {
      setNotice(location.state.notice);
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  useEffect(() => {
    loadBooks();
  }, []);

  useEffect(() => {
    if (!user) {
      setRecentReading([]);
      return;
    }
    api.reading
      .recent({ limit: 5 })
      .then((res) => setRecentReading(filterRecentReadingItems(res.data?.items)))
      .catch(() => setRecentReading([]));
  }, [user]);

  const loadBooks = async () => {
    try {
      setIsLoading(true);
      const [allRes, originalRes] = await Promise.all([
        api.books.list({ page: 1, page_size: 20 }),
        api.books.list({ page: 1, page_size: 10, source: 'original' }),
      ]);
      setBooks(allRes.data?.books || []);
      setOriginalBooks(originalRes.data?.books || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-4">
        <div className="w-8 h-8 rounded-full border-2 border-gray-200 border-t-blue-600 animate-spin" />
        <p className={APP_TYPE.caption}>加载书库…</p>
      </div>
    );
  }

  if (error) {
    return (
      <LoadErrorPanel
        message={error}
        onRetry={loadBooks}
      />
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {notice && (
        <div className={`${APP_CLASSES.card} p-4 border-amber-200 bg-amber-50 text-amber-900 text-sm`}>
          {notice}
        </div>
      )}
      <header className={`${APP_CLASSES.card} p-6`}>
        <p className={`${APP_TYPE.label} mb-4`}>{APP_NAME} · 书库</p>
        <h1 className={`${APP_TYPE.display} text-gray-900 mb-4`}>找一本书，读到同一页</h1>
        <p className={`${APP_TYPE.body} text-gray-500 max-w-lg`}>
          滚动阅读 · 段评锚定原文 · 可切换护眼主题与翻页模式。
        </p>
        {user && (
          <div className="flex flex-wrap gap-3 mt-6">
            <Link to="/upload" className={APP_CLASSES.btnPrimary}>
              导入书籍
            </Link>
            <Link to="/author" className={APP_CLASSES.btnGhost}>
              开始创作
            </Link>
          </div>
        )}
      </header>

      {originalBooks.length > 0 && (
        <section>
          <h2 className={`${APP_TYPE.label} px-1 mb-3`}>原创作品 · {originalBooks.length}</h2>
          <div className={`${APP_CLASSES.card} divide-y divide-gray-200 overflow-hidden`}>
            {originalBooks.map((book) => (
              <BookCard key={book.id} book={book} />
            ))}
          </div>
        </section>
      )}

      {user && recentReading.length > 0 && (
        <section className={`${APP_CLASSES.card} overflow-hidden`}>
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className={APP_TYPE.label}>继续阅读</h2>
          </div>
          <div className="divide-y divide-gray-200">
            {recentReading.map((item) => (
              <ContinueReadingCard key={`${item.book_id}-${item.chapter_id}`} item={item} />
            ))}
          </div>
        </section>
      )}

      <div className="flex items-center justify-between px-1">
        <h2 className={APP_TYPE.label}>全部书籍 · {books.length}</h2>
      </div>

      {books.length === 0 ? (
        <div className={`${APP_CLASSES.card} p-6 text-center text-gray-400`}>
          <p className="mb-4 text-base">暂无书籍</p>
          {user && (
            <Link to="/upload" className="text-base text-blue-600 hover:text-blue-700 underline underline-offset-4">
              去导入 EPUB / TXT
            </Link>
          )}
        </div>
      ) : (
        <div className={`${APP_CLASSES.card} divide-y divide-gray-200 overflow-hidden`}>
          {books.map((book) => (
            <BookCard key={book.id} book={book} />
          ))}
        </div>
      )}
    </div>
  );
}
