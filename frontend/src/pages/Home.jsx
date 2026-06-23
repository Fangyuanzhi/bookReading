import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/config';
import BookCard from '../components/BookCard';
import { APP_THEME } from '../styles/theme';
import { Sparkles, Upload, BookMarked } from 'lucide-react';
import { useAuthStore } from '../store/auth';

export default function Home() {
  const [books, setBooks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const { user } = useAuthStore();

  useEffect(() => {
    loadBooks();
  }, []);

  const loadBooks = async () => {
    try {
      setIsLoading(true);
      const res = await api.books.list({ page: 1, page_size: 20 });
      setBooks(res.data?.books || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-4">
        <div className="w-10 h-10 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: APP_THEME.accent, borderTopColor: 'transparent' }} />
        <p className="text-sm opacity-50">加载书库…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-24 rounded-2xl border" style={{ borderColor: APP_THEME.line, color: '#fca5a5' }}>
        加载失败：{error}
      </div>
    );
  }

  return (
    <div>
      <section
        className="rounded-3xl border p-8 sm:p-10 mb-12 relative overflow-hidden"
        style={{ backgroundColor: APP_THEME.bgPanel, borderColor: APP_THEME.line }}
      >
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 text-xs uppercase tracking-widest mb-4 px-3 py-1 rounded-full border" style={{ borderColor: APP_THEME.line, color: APP_THEME.accent }}>
            <Sparkles size={14} />
            氛围陪伴式读书
          </div>
          <h1 className="text-3xl sm:text-5xl font-serif font-semibold mb-4 leading-[1.2]">
            找一本书，
            <br />
            <span style={{ color: APP_THEME.accent }}>和陌生人一起</span>读到同一页
          </h1>
          <p className="text-sm sm:text-base opacity-70 leading-relaxed max-w-lg mb-8">
            护眼阅读 · 滚动/翻页双模式 · 段评锚定在原文旁。结伴模式里，你会感到不是一个人在读。
          </p>
          <div className="flex flex-wrap gap-3">
            {user && (
              <Link
                to="/upload"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium text-sm transition-all hover:brightness-110"
                style={{ backgroundColor: APP_THEME.accent, color: APP_THEME.bg }}
              >
                <Upload size={16} />
                导入书籍
              </Link>
            )}
            {books[0] && (
              <Link
                to={`/book/${books[0].id}`}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm border transition-colors hover:border-[#E0A24E]"
                style={{ borderColor: APP_THEME.line, color: APP_THEME.soft }}
              >
                <BookMarked size={16} />
                继续阅读
              </Link>
            )}
          </div>
        </div>
        <div className="absolute -right-16 -bottom-16 w-64 h-64 rounded-full blur-3xl opacity-25" style={{ backgroundColor: APP_THEME.accent }} />
        <div className="absolute right-8 top-8 w-32 h-32 rounded-full blur-2xl opacity-10" style={{ backgroundColor: APP_THEME.accentDark }} />
      </section>

      <div className="flex items-end justify-between mb-6">
        <div>
          <h2 className="text-2xl font-serif font-semibold">书库</h2>
          <p className="text-sm opacity-50 mt-1">共 {books.length} 本书</p>
        </div>
      </div>

      {books.length === 0 ? (
        <div
          className="text-center py-24 rounded-3xl border"
          style={{ borderColor: APP_THEME.line, color: APP_THEME.faint }}
        >
          <BookMarked size={40} className="mx-auto mb-4 opacity-40" />
          <p className="mb-4">暂无书籍</p>
          {user && (
            <Link to="/upload" className="text-sm underline" style={{ color: APP_THEME.accent }}>
              去导入 EPUB / TXT →
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {books.map((book) => (
            <BookCard key={book.id} book={book} />
          ))}
        </div>
      )}
    </div>
  );
}
