import { useState } from 'react';
import { Flag } from 'lucide-react';
import api from '../api/config';
import { useAuthStore } from '../store/auth';
import { APP_CLASSES, APP_TYPE } from '../styles/theme';

const REASONS = [
  { value: 'copyright', label: '侵权 / 版权' },
  { value: 'inappropriate', label: '不当内容' },
  { value: 'spam', label: '垃圾信息' },
  { value: 'other', label: '其他' },
];

export default function ReportButton({
  targetType,
  targetId,
  label = '举报',
  className = '',
  variant = 'default',
}) {
  const { user } = useAuthStore();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState('copyright');
  const [detail, setDetail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  if (!user || !targetId) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setError('');
      await api.reports.create({
        target_type: targetType,
        target_id: targetId,
        reason,
        detail: detail.trim(),
      });
      setMessage('举报已提交，我们会尽快处理。');
      setDetail('');
    } catch (err) {
      setError(err.message || '提交失败');
    } finally {
      setSubmitting(false);
    }
  };

  const btnClass =
    variant === 'ghost'
      ? 'text-xs opacity-60 hover:opacity-100 flex items-center gap-1'
      : `${APP_CLASSES.btnGhost} text-sm`;

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={`${btnClass} ${className}`}>
        <Flag size={variant === 'ghost' ? 12 : 14} />
        {label}
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/40">
          <div className={`${APP_CLASSES.card} w-full max-w-md p-6`}>
            <h3 className={`${APP_TYPE.title} text-gray-900 mb-2`}>举报内容</h3>
            <p className={`${APP_TYPE.caption} mb-4`}>
              依据避风港原则，收到有效举报后我们将及时处理。
            </p>

            {message ? (
              <p className="text-sm text-green-700 mb-4">{message}</p>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className={APP_TYPE.label}>举报原因</label>
                  <select
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    className="mt-2 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                  >
                    {REASONS.map((r) => (
                      <option key={r.value} value={r.value}>
                        {r.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={APP_TYPE.label}>补充说明（可选）</label>
                  <textarea
                    value={detail}
                    onChange={(e) => setDetail(e.target.value)}
                    rows={3}
                    placeholder="请描述具体问题…"
                    className="mt-2 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm resize-none"
                  />
                </div>
                {error && <p className="text-sm text-red-600">{error}</p>}
                <div className="flex gap-3 justify-end">
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    className={APP_CLASSES.btnGhost}
                  >
                    取消
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className={APP_CLASSES.btnPrimary}
                  >
                    {submitting ? '提交中…' : '提交举报'}
                  </button>
                </div>
              </form>
            )}

            {message && (
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  setMessage('');
                }}
                className={`${APP_CLASSES.btnPrimary} w-full mt-2`}
              >
                关闭
              </button>
            )}
          </div>
        </div>
      )}
    </>
  );
}
