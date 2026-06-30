import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save } from 'lucide-react';
import ProtectedRoute from '../components/ProtectedRoute';
import api from '../api/config';
import { APP_CLASSES, APP_TYPE } from '../styles/theme';

function AuthorChapterEditContent() {
  const { bookId, chapterId } = useParams();
  const navigate = useNavigate();

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.chapters.detail(chapterId);
      const chapter = res.data;
      setTitle(chapter.title || '');
      setContent(chapter.content || '');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [chapterId]);

  useEffect(() => {
    load();
  }, [load]);

  const save = async (e) => {
    e?.preventDefault();
    setSaving(true);
    setError('');
    setSaved(false);
    try {
      await api.chapters.update(chapterId, { title, content });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between gap-4 mb-4">
        <Link to={`/author/${bookId}`} className={APP_CLASSES.btnGhost}>
          <ArrowLeft size={16} />
          返回章节列表
        </Link>
        <div className="flex items-center gap-2">
          {saved && <span className="text-sm text-emerald-600">已保存</span>}
          <button type="button" onClick={save} disabled={saving} className={APP_CLASSES.btnPrimary}>
            <Save size={16} />
            {saving ? '保存中…' : '保存'}
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-4 rounded-lg bg-red-50 text-red-700 text-sm">{error}</div>
      )}

      <form onSubmit={save} className={`${APP_CLASSES.card} p-6 space-y-4`}>
        <div>
          <label className="block text-sm mb-1.5 opacity-80">章节标题</label>
          <input
            className={APP_CLASSES.input}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="block text-sm mb-1.5 opacity-80">正文</label>
          <p className={`${APP_TYPE.caption} mb-2`}>
            每段之间空一行，阅读器会按段落拆分显示。
          </p>
          <textarea
            className={`${APP_CLASSES.input} min-h-[420px] resize-y font-serif leading-relaxed`}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="在这里写下章节内容…"
          />
        </div>
      </form>

      <div className="mt-4 flex justify-end">
        <button
          type="button"
          onClick={() => navigate(`/author/${bookId}`)}
          className={APP_CLASSES.btnGhost}
        >
          完成，返回书籍
        </button>
      </div>
    </div>
  );
}

export default function AuthorChapterEdit() {
  return (
    <ProtectedRoute>
      <AuthorChapterEditContent />
    </ProtectedRoute>
  );
}
