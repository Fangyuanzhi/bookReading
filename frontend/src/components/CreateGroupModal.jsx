import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/config';
import { APP_CLASSES } from '../styles/theme';

export default function CreateGroupModal({ bookId: initialBookId, bookTitle, onClose }) {
  const navigate = useNavigate();
  const [bookId, setBookId] = useState(initialBookId || '');
  const [name, setName] = useState(bookTitle ? `${bookTitle} · 共读` : '');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!bookId?.trim() || !name.trim()) return;

    setSubmitting(true);
    setError('');
    try {
      const res = await api.groups.create({
        book_id: bookId.trim(),
        name: name.trim(),
        description: description.trim() || undefined,
      });
      navigate(`/groups/${res.data.id}`);
    } catch (err) {
      setError(err.message);
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40" onClick={onClose}>
      <div
        className={`${APP_CLASSES.card} w-full max-w-md p-6 shadow-xl`}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-semibold text-gray-900 mb-4">创建共读小组</h2>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 text-red-700 text-sm">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {!bookTitle && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">书籍 ID</label>
              <input
                type="text"
                value={bookId}
                onChange={(e) => setBookId(e.target.value)}
                readOnly={!!initialBookId}
                className={APP_CLASSES.input}
                placeholder="在书籍详情页 URL 中可见"
                required
              />
            </div>
          )}

          {bookTitle && (
            <p className="text-sm text-gray-600">
              共读书籍：<span className="font-medium text-gray-900">{bookTitle}</span>
            </p>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">小组名称</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={APP_CLASSES.input}
              maxLength={100}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">简介（可选）</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className={APP_CLASSES.input}
              rows={3}
              placeholder="例如：每周读两章，周末讨论"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className={APP_CLASSES.btnGhost}>
              取消
            </button>
            <button
              type="submit"
              disabled={submitting || !name.trim()}
              className={APP_CLASSES.btnPrimary}
            >
              {submitting ? '创建中…' : '创建'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
