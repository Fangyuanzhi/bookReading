import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart } from 'lucide-react';
import ReportButton from '../ReportButton';

export default function ReviewSection({ theme, reviews, onSubmit, onLike, isCompanionMode }) {
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
    <section className="max-w-2xl mx-auto px-6 py-8 border-t" style={{ borderColor: theme.line }}>
      <h3 className="font-semibold mb-4">章末书评</h3>

      {isCompanionMode && (
        <form onSubmit={handleSubmit} className="mb-6">
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="读完整章，写下你的感受..."
            rows={4}
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
            {submitting ? '发布中...' : '发布书评'}
          </button>
        </form>
      )}

      <div className="space-y-4">
        {reviews.length === 0 ? (
          <p className="text-sm opacity-50">还没有章末书评</p>
        ) : (
          reviews.map((review) => (
            <div key={review.id} className="rounded-lg p-4" style={{ backgroundColor: theme.bgRaised || theme.line }}>
              <div className="flex items-center justify-between gap-2 mb-2">
                {review.user?.id ? (
                  <Link
                    to={`/users/${review.user.id}`}
                    className="text-sm font-medium hover:underline"
                    style={{ color: theme.accent }}
                  >
                    {review.user.display_name || review.user.email || '读者'}
                  </Link>
                ) : (
                  <span className="text-sm font-medium">
                    {review.user?.display_name || review.user?.email || '读者'}
                  </span>
                )}
                <span className="text-xs opacity-50">
                  {review.created_at ? new Date(review.created_at).toLocaleDateString('zh-CN') : ''}
                </span>
              </div>
              <p className="text-sm leading-relaxed whitespace-pre-wrap">{review.body}</p>
              <div className="mt-3 flex items-center gap-4">
                <button
                  type="button"
                  onClick={() => onLike(review.id, review.has_liked)}
                  className="flex items-center gap-1 text-xs opacity-70 hover:opacity-100"
                >
                  <Heart size={14} fill={review.has_liked ? theme.accent : 'none'} />
                  {review.likes || 0}
                </button>
                <ReportButton
                  targetType="review"
                  targetId={review.id}
                  label="举报"
                  variant="ghost"
                />
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
