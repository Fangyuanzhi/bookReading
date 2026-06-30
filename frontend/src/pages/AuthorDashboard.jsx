import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { PenLine, Plus, BookOpen, ChevronRight } from 'lucide-react';
import ProtectedRoute from '../components/ProtectedRoute';
import api from '../api/config';
import { APP_CLASSES, APP_THEME, APP_TYPE } from '../styles/theme';

const STATUS_LABEL = {
  draft: { text: '草稿', className: 'bg-amber-100 text-amber-800' },
  published: { text: '已发布', className: 'bg-emerald-100 text-emerald-800' },
  removed: { text: '已下架', className: 'bg-gray-100 text-gray-600' },
};

function AuthorDashboardContent() {
  const navigate = useNavigate();
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');

  const loadBooks = async () => {
    try {
      setLoading(true);
      const res = await api.books.mine({ page: 1, page_size: 50 });
      setBooks(res.data?.books || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBooks();
  }, []);

  const handleCreate = async () => {
    const title = window.prompt('新书标题');
    if (!title?.trim()) return;

    setCreating(true);
    setError('');
    try {
      const res = await api.books.create({
        title: title.trim(),
        source: 'original',
        language: 'zh',
      });
      const book = res.data;
      navigate(`/author/${book.id}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <header className={`${APP_CLASSES.card} p-6 mb-6`}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className={APP_TYPE.label}>作者后台</p>
            <h1 className={`${APP_TYPE.title} text-gray-900 mt-2`}>我的创作</h1>
            <p className={`${APP_TYPE.caption} mt-2`}>
              撰写原创章节，管理草稿与发布。原创作品需手动发布后才会出现在书库。
            </p>
          </div>
          <PenLine size={28} className="shrink-0 text-blue-600 opacity-80" />
        </div>
        <button
          type="button"
          onClick={handleCreate}
          disabled={creating}
          className={`${APP_CLASSES.btnPrimary} mt-6`}
        >
          <Plus size={18} />
          {creating ? '创建中…' : '新建原创作品'}
        </button>
      </header>

      {error && (
        <div className="mb-4 p-4 rounded-lg bg-red-50 text-red-700 text-sm">{error}</div>
      )}

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        </div>
      ) : books.length === 0 ? (
        <div className={`${APP_CLASSES.card} p-8 text-center`}>
          <BookOpen size={32} className="mx-auto mb-3 text-gray-300" />
          <p className="text-gray-500 mb-4">还没有原创作品</p>
          <button type="button" onClick={handleCreate} className={APP_CLASSES.btnGhost}>
            创建第一本
          </button>
        </div>
      ) : (
        <div className={`${APP_CLASSES.card} divide-y divide-gray-200 overflow-hidden`}>
          {books.map((book) => {
            const status = STATUS_LABEL[book.status] || STATUS_LABEL.draft;
            return (
              <Link
                key={book.id}
                to={`/author/${book.id}`}
                className="flex items-center gap-4 p-4 sm:p-5 hover:bg-stone-50 transition-colors group"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${status.className}`}>
                      {status.text}
                    </span>
                    {book.source === 'original' && (
                      <span className="text-xs text-blue-600">原创</span>
                    )}
                  </div>
                  <h3 className="font-serif font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                    {book.title}
                  </h3>
                  {book.description && (
                    <p className={`${APP_TYPE.caption} line-clamp-1 mt-1`}>{book.description}</p>
                  )}
                </div>
                <ChevronRight size={18} className="shrink-0 text-gray-300 group-hover:text-gray-500" />
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function AuthorDashboard() {
  return (
    <ProtectedRoute>
      <AuthorDashboardContent />
    </ProtectedRoute>
  );
}
