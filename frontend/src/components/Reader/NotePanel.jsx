import { useState } from 'react';
import { Heart, MessageCircle, X } from 'lucide-react';
export default function NotePanel({
  theme,
  paragraphIndex,
  paragraphText,
  notes: paraNotes,
  onClose,
  onSubmit,
  onLike,
  isCompanionMode,
}) {
  const [body, setBody] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!body.trim()) return;

    try {
      setSubmitting(true);
      setError('');
      await onSubmit(body.trim());
      setBody('');
    } catch (err) {
      setError(err.message || '发送失败');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-20 max-h-[70vh] overflow-y-auto rounded-t-2xl border-t shadow-2xl animate-slide-up"
      style={{ backgroundColor: theme.bgPanel || theme.bg, borderColor: theme.line, color: theme.text }}
    >
      <div className="sticky top-0 flex items-start justify-between gap-3 px-4 py-3 border-b" style={{ borderColor: theme.line }}>
        <div className="min-w-0">
          <p className="text-sm opacity-70">段评 · 第 {paragraphIndex + 1} 段</p>
          <p className="text-sm line-clamp-2 mt-1 opacity-90">{paragraphText}</p>
        </div>
        <button type="button" onClick={onClose} className="p-1 opacity-70 hover:opacity-100">
          <X size={18} />
        </button>
      </div>

      {isCompanionMode && (
        <form onSubmit={handleSubmit} className="p-4 border-b" style={{ borderColor: theme.line }}>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="写下此刻的想法..."
            rows={3}
            className="w-full resize-none rounded-lg px-3 py-2 text-sm"
            style={{ backgroundColor: theme.bgRaised || theme.line, color: theme.text, borderColor: theme.line }}
          />
          {error && <p className="text-sm text-red-400 mt-2">{error}</p>}
          <button
            type="submit"
            disabled={submitting || !body.trim()}
            className="mt-3 px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50"
            style={{ backgroundColor: theme.accent, color: theme.bg }}
          >
            {submitting ? '发送中...' : '发表段评'}
          </button>
        </form>
      )}

      <div className="p-4 space-y-4">
        {paraNotes.length === 0 ? (
          <p className="text-sm opacity-50 text-center py-4">
            {isCompanionMode ? '还没有段评，来做第一个吧' : '独自模式下仅浏览段评'}
          </p>
        ) : (
          paraNotes.map((note) => (
            <div key={note.id} className="rounded-lg p-3" style={{ backgroundColor: theme.bgRaised || theme.line }}>
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="text-sm font-medium">
                  {note.user?.display_name || note.user?.email || '读者'}
                </span>
                <span className="text-xs opacity-50">
                  {note.created_at ? new Date(note.created_at).toLocaleString('zh-CN') : ''}
                </span>
              </div>
              <p className="text-sm leading-relaxed whitespace-pre-wrap">{note.body}</p>
              <div className="flex items-center gap-3 mt-3 text-xs opacity-70">
                <button
                  type="button"
                  onClick={() => onLike(note.id, note.has_liked)}
                  className="flex items-center gap-1 hover:opacity-100"
                >
                  <Heart size={14} fill={note.has_liked ? theme.accent : 'none'} />
                  {note.likes || 0}
                </button>
                <span className="flex items-center gap-1">
                  <MessageCircle size={14} />
                  段评
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
