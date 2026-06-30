import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, Eye, EyeOff, Pencil } from 'lucide-react';
import ProtectedRoute from '../components/ProtectedRoute';
import api from '../api/config';
import { APP_CLASSES, APP_THEME, APP_TYPE } from '../styles/theme';

function AuthorBookContent() {
  const { bookId } = useParams();
  const navigate = useNavigate();

  const [book, setBook] = useState(null);
  const [chapters, setChapters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [statusLoading, setStatusLoading] = useState(false);
  const [error, setError] = useState('');

  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [description, setDescription] = useState('');
  const [accessType, setAccessType] = useState('free');
  const [priceYuan, setPriceYuan] = useState('');

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const [bookRes, chaptersRes] = await Promise.all([
        api.books.detail(bookId),
        api.books.chapters(bookId),
      ]);
      const bookData = bookRes.data;
      setBook(bookData);
      setTitle(bookData.title || '');
      setAuthor(bookData.author || '');
      setDescription(bookData.description || '');
      setAccessType(bookData.access_type || 'free');
      setPriceYuan(bookData.price > 0 ? String(bookData.price / 100) : '');
      setChapters(chaptersRes.data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [bookId]);

  useEffect(() => {
    load();
  }, [load]);

  const saveBook = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const payload = { title, author, description, access_type: accessType };
      if (accessType === 'paid') {
        const yuan = parseFloat(priceYuan);
        if (!yuan || yuan <= 0) {
          setError('请设置有效的单本价格');
          setSaving(false);
          return;
        }
        payload.price = Math.round(yuan * 100);
      }
      const res = await api.books.update(bookId, payload);
      setBook(res.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const togglePublish = async () => {
    const next = book.status === 'published' ? 'draft' : 'published';
    if (next === 'published' && chapters.length === 0) {
      setError('至少需要一个章节才能发布');
      return;
    }
    if (next === 'draft' && !window.confirm('撤回后读者将无法在书库看到此书，确定吗？')) return;

    setStatusLoading(true);
    setError('');
    try {
      const res = await api.books.updateStatus(bookId, next);
      setBook(res.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setStatusLoading(false);
    }
  };

  const addChapter = async () => {
    const chapterTitle = window.prompt('章节标题', `第 ${chapters.length + 1} 章`);
    if (!chapterTitle?.trim()) return;

    setError('');
    try {
      const res = await api.books.createChapter(bookId, {
        title: chapterTitle.trim(),
        content: '',
      });
      navigate(`/author/${bookId}/chapters/${res.data.id}`);
    } catch (err) {
      setError(err.message);
    }
  };

  const deleteChapter = async (chapter) => {
    if (!window.confirm(`确定删除「${chapter.title}」？`)) return;
    try {
      await api.chapters.delete(chapter.id);
      setChapters((prev) => prev.filter((c) => c.id !== chapter.id));
    } catch (err) {
      setError(err.message);
    }
  };

  const deleteBook = async () => {
    if (!window.confirm('确定删除这本书？此操作不可恢复。')) return;
    try {
      await api.books.delete(bookId);
      navigate('/author');
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (!book) {
    return <div className="text-center py-24 text-red-600">书籍不存在或无权访问</div>;
  }

  const isPublished = book.status === 'published';

  return (
    <div className="max-w-2xl mx-auto">
      <Link to="/author" className={`${APP_CLASSES.btnGhost} mb-4`}>
        <ArrowLeft size={16} />
        返回创作列表
      </Link>

      {error && (
        <div className="mb-4 p-4 rounded-lg bg-red-50 text-red-700 text-sm">{error}</div>
      )}

      <div className={`${APP_CLASSES.card} p-6 mb-6`}>
        <div className="flex items-center justify-between gap-4 mb-6">
          <h1 className={`${APP_TYPE.title} text-gray-900`}>编辑书籍</h1>
          <span
            className={`text-xs px-2 py-1 rounded-full font-medium ${
              isPublished ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
            }`}
          >
            {isPublished ? '已发布' : '草稿'}
          </span>
        </div>

        <form onSubmit={saveBook} className="space-y-4">
          <div>
            <label className="block text-sm mb-1.5 opacity-80">书名</label>
            <input
              className={APP_CLASSES.input}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-sm mb-1.5 opacity-80">作者署名</label>
            <input
              className={APP_CLASSES.input}
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              placeholder="显示在书库与阅读页"
            />
          </div>
          <div>
            <label className="block text-sm mb-1.5 opacity-80">简介</label>
            <textarea
              className={`${APP_CLASSES.input} min-h-[100px] resize-y`}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="一句话介绍这本书…"
            />
          </div>
          <div>
            <label className="block text-sm mb-1.5 opacity-80">阅读权限</label>
            <select
              className={APP_CLASSES.input}
              value={accessType}
              onChange={(e) => setAccessType(e.target.value)}
            >
              <option value="free">免费阅读</option>
              <option value="vip">VIP 专享</option>
              <option value="paid">单本付费</option>
            </select>
          </div>
          {accessType === 'paid' && (
            <div>
              <label className="block text-sm mb-1.5 opacity-80">定价（元）</label>
              <input
                type="number"
                min="0.01"
                step="0.01"
                className={APP_CLASSES.input}
                value={priceYuan}
                onChange={(e) => setPriceYuan(e.target.value)}
                placeholder="例如 9.9"
              />
            </div>
          )}
          <button type="submit" disabled={saving} className={APP_CLASSES.btnPrimary}>
            {saving ? '保存中…' : '保存信息'}
          </button>
        </form>

        <div className="flex flex-wrap gap-2 mt-6 pt-6 border-t border-gray-200">
          <button
            type="button"
            onClick={togglePublish}
            disabled={statusLoading}
            className={APP_CLASSES.btnPrimary}
          >
            {isPublished ? <EyeOff size={16} /> : <Eye size={16} />}
            {statusLoading ? '处理中…' : isPublished ? '撤回为草稿' : '发布到书库'}
          </button>
          {isPublished && chapters[0] && (
            <Link to={`/read/${chapters[0].id}`} className={APP_CLASSES.btnGhost}>
              预览阅读
            </Link>
          )}
          <button type="button" onClick={deleteBook} className={`${APP_CLASSES.btnGhost} text-red-600`}>
            <Trash2 size={16} />
            删除书籍
          </button>
        </div>
      </div>

      <div className={`${APP_CLASSES.card} overflow-hidden`}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className={APP_TYPE.label}>章节管理 · {chapters.length}</h2>
          <button type="button" onClick={addChapter} className={APP_CLASSES.btnGhost}>
            <Plus size={16} />
            新建章节
          </button>
        </div>

        {chapters.length === 0 ? (
          <div className="p-8 text-center text-gray-400">
            <p className="mb-4">还没有章节</p>
            <button type="button" onClick={addChapter} className={APP_CLASSES.btnPrimary}>
              写第一章
            </button>
          </div>
        ) : (
          <ul className="divide-y divide-gray-200">
            {chapters.map((chapter) => (
              <li key={chapter.id} className="flex items-center gap-3 px-4 sm:px-6 py-4 hover:bg-stone-50">
                <span className="text-xs text-gray-400 w-8 shrink-0">{chapter.idx}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 truncate">{chapter.title}</p>
                </div>
                <Link
                  to={`/author/${bookId}/chapters/${chapter.id}`}
                  className={APP_CLASSES.btnGhost}
                  title="编辑"
                >
                  <Pencil size={16} />
                </Link>
                <button
                  type="button"
                  onClick={() => deleteChapter(chapter)}
                  className={`${APP_CLASSES.btnGhost} text-red-500`}
                  title="删除"
                >
                  <Trash2 size={16} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export default function AuthorBook() {
  return (
    <ProtectedRoute>
      <AuthorBookContent />
    </ProtectedRoute>
  );
}
