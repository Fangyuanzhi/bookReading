import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { BookMarked, Search } from 'lucide-react';
import api from '../api/config';
import { useAuthStore } from '../store/auth';
import ShelfBookCard from '../components/ShelfBookCard';
import { APP_CLASSES, APP_THEME } from '../styles/theme';

export default function Shelf() {
  const { user } = useAuthStore();
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [query, setQuery] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    if (!user) return;
    try {
      setLoading(true);
      setError('');
      const params = { page: 1, page_size: 50 };
      if (query.trim()) params.q = query.trim();
      const res = await api.shelf.list(params);
      setItems(res.data?.items || []);
      setTotal(res.data?.total ?? 0);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [user, query]);

  useEffect(() => {
    load();
  }, [load]);

  const handleSearch = (e) => {
    e.preventDefault();
    setQuery(searchInput);
  };

  const handleRemove = async (bookId) => {
    try {
      await api.shelf.remove(bookId);
      setItems((prev) => prev.filter((item) => item.book_id !== bookId));
      setTotal((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Failed to remove from shelf:', err);
    }
  };

  if (!user) {
    return (
      <div className="text-center py-24">
        <p className="opacity-60 mb-4">登录后查看我的书架</p>
        <Link to="/login" className={APP_CLASSES.btnPrimary} style={{ display: 'inline-block', width: 'auto', padding: '12px 32px' }}>
          去登录
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl font-serif font-semibold flex items-center gap-2">
          <BookMarked size={24} style={{ color: APP_THEME.accent }} />
          我的书架
        </h1>
        {total > 0 && (
          <span className="text-sm opacity-50">{total} 本</span>
        )}
      </div>

      <form onSubmit={handleSearch} className="mb-6 relative">
        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="search"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="搜索书架中的书..."
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300"
        />
      </form>

      {loading ? (
        <div className="flex justify-center py-24">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: APP_THEME.accent }} />
        </div>
      ) : error ? (
        <div className="text-center py-16 text-red-600">{error}</div>
      ) : items.length === 0 ? (
        <div className={`${APP_CLASSES.card} p-10 text-center`}>
          <BookMarked size={40} className="mx-auto mb-4 text-gray-300" />
          <p className="text-gray-600 mb-2">
            {query ? '没有找到匹配的书籍' : '书架还是空的'}
          </p>
          <p className="text-sm opacity-50 mb-6">
            {query ? '换个关键词试试' : '在书籍详情页点「加入书架」收藏想读的书'}
          </p>
          {!query && (
            <Link to="/" className={APP_CLASSES.btnPrimary} style={{ display: 'inline-block', width: 'auto' }}>
              去书库逛逛
            </Link>
          )}
        </div>
      ) : (
        <div className={`${APP_CLASSES.card} overflow-hidden divide-y divide-gray-100`}>
          {items.map((item) => (
            <ShelfBookCard key={item.book_id} item={item} onRemove={handleRemove} />
          ))}
        </div>
      )}
    </div>
  );
}
