import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api/config';
import { APP_THEME, APP_CLASSES } from '../styles/theme';
import { getBookCover } from '../components/Reader/BookDecoration';
import { BookOpen, ChevronRight, Play, List, Eye } from 'lucide-react';

export default function BookDetail() {
  const { id } = useParams();
  const [book, setBook] = useState(null);
  const [chapters, setChapters] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadBookData();
  }, [id]);

  const loadBookData = async () => {
    try {
      setIsLoading(true);
      const [bookRes, chaptersRes] = await Promise.all([
        api.books.detail(id),
        api.books.chapters(id),
      ]);
      setBook(bookRes.data);
      setChapters(chaptersRes.data?.chapters || chaptersRes.data || []);
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
      </div>
    );
  }

  if (error || !book) {
    return <div className="text-center py-24 text-red-300">加载失败：{error || '书籍不存在'}</div>;
  }

  const firstChapter = chapters[0];

  return (
    <div className="max-w-4xl mx-auto">
      <div
        className={`${APP_CLASSES.card} p-6 sm:p-10 mb-8 relative overflow-hidden`}
        style={{ backgroundColor: APP_THEME.bgPanel, borderColor: APP_THEME.line }}
      >
        <div className="absolute -right-20 -top-20 w-48 h-48 rounded-full blur-3xl opacity-15" style={{ backgroundColor: APP_THEME.accent }} />
        <div className="flex flex-col sm:flex-row gap-8 relative">
          <div className="relative w-full sm:w-44 h-60 flex-shrink-0 mx-auto sm:mx-0 perspective-book">
            <div
              className="w-full h-full rounded-r-2xl rounded-l-md shadow-2xl overflow-hidden book-cover-3d"
              style={{ backgroundColor: APP_THEME.bgRaised }}
            >
              {getBookCover(book) ? (
                <img src={getBookCover(book)} alt={book.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <BookOpen size={52} style={{ color: APP_THEME.faint }} />
                </div>
              )}
              {/* spine highlight */}
              <div
                className="absolute left-0 top-0 bottom-0 w-3 pointer-events-none"
                style={{
                  background: 'linear-gradient(90deg, rgba(255,255,255,0.25), rgba(255,255,255,0.04) 55%, transparent)',
                }}
              />
              {/* page edges illusion */}
              <div
                className="absolute right-0 top-1 bottom-1 w-1.5 pointer-events-none"
                style={{
                  background: 'linear-gradient(90deg, rgba(0,0,0,0.12), transparent)',
                }}
              />
            </div>
          </div>
          <div className="flex-1 text-center sm:text-left">
            <p className="text-xs uppercase tracking-widest opacity-50 mb-2">{book.author ? 'Book' : '书籍'}</p>
            <h1 className="text-2xl sm:text-4xl font-serif font-semibold mb-2 leading-tight">{book.title}</h1>
            <p className="opacity-60 mb-4">{book.author || '佚名'}</p>
            {book.description && (
              <p className="text-sm leading-relaxed opacity-75 mb-6 max-w-xl">{book.description}</p>
            )}
            <div className="flex flex-wrap gap-3 justify-center sm:justify-start">
              {firstChapter && (
                <Link
                  to={`/read/${firstChapter.id}`}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all hover:brightness-110 shadow-lg"
                  style={{ backgroundColor: APP_THEME.accent, color: APP_THEME.bg }}
                >
                  <Play size={16} />
                  开始阅读
                </Link>
              )}
              <span
                className="inline-flex items-center gap-2 px-4 py-3 rounded-xl text-sm border opacity-70"
                style={{ borderColor: APP_THEME.line, color: APP_THEME.soft }}
              >
                <Eye size={15} />
                护眼 · 翻页模式
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className={`${APP_CLASSES.card} overflow-hidden`} style={{ backgroundColor: APP_THEME.bgPanel, borderColor: APP_THEME.line }}>
        <div className="px-6 py-4 border-b flex items-center gap-2" style={{ borderColor: APP_THEME.line }}>
          <List size={18} style={{ color: APP_THEME.accent }} />
          <h2 className="font-serif font-semibold">章节列表</h2>
          <span className="text-sm opacity-40 ml-auto">{chapters.length} 章</span>
        </div>

        {chapters.length === 0 ? (
          <div className="p-12 text-center opacity-50">暂无章节</div>
        ) : (
          <div>
            {chapters.map((chapter, index) => (
              <Link
                key={chapter.id}
                to={`/read/${chapter.id}`}
                className="flex items-center justify-between px-6 py-4 border-b transition-all hover:pl-8 group"
                style={{ borderColor: APP_THEME.line }}
              >
                <div className="flex items-center gap-4 min-w-0">
                  <span
                    className="text-xs font-medium w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors"
                    style={{ backgroundColor: APP_THEME.bgRaised, color: APP_THEME.soft }}
                  >
                    {index + 1}
                  </span>
                  <span className="truncate group-hover:text-[#E0A24E] transition-colors">{chapter.title}</span>
                </div>
                <ChevronRight size={18} className="opacity-30 group-hover:opacity-70 group-hover:translate-x-0.5 transition-all shrink-0" />
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
