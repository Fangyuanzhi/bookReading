import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/config';
import { useAuthStore } from '../store/auth';
import { APP_THEME, APP_CLASSES } from '../styles/theme';
import { User, Mail, Calendar, MessageCircle, BookOpen } from 'lucide-react';

export default function Profile() {
  const { user, fetchMe, isLoading } = useAuthStore();
  const [notes, setNotes] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [recordsLoading, setRecordsLoading] = useState(true);

  useEffect(() => {
    fetchMe().catch(console.error);
  }, [fetchMe]);

  useEffect(() => {
    if (!user) return;

    const loadRecords = async () => {
      try {
        setRecordsLoading(true);
        const [notesRes, reviewsRes] = await Promise.all([
          api.notes.mine({ page: 1, page_size: 20 }),
          api.reviews.mine({ page: 1, page_size: 20 }),
        ]);
        setNotes(notesRes.data?.notes || []);
        setReviews(reviewsRes.data?.reviews || []);
      } catch (err) {
        console.error('Failed to load user records:', err);
      } finally {
        setRecordsLoading(false);
      }
    };

    loadRecords();
  }, [user]);

  if (isLoading) {
    return (
      <div className="flex justify-center py-24">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: APP_THEME.accent }} />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="text-center py-24">
        <p className="opacity-60 mb-4">请先登录</p>
        <Link to="/login" className={APP_CLASSES.btnPrimary} style={{ display: 'inline-block', width: 'auto', padding: '12px 32px' }}>
          去登录
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-serif font-semibold mb-6">个人中心</h1>

      <div className={`${APP_CLASSES.card} p-6 mb-6`} style={{ backgroundColor: APP_THEME.bgPanel, borderColor: APP_THEME.line }}>
        <div className="flex items-center gap-4 mb-6">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center font-serif text-xl font-semibold"
            style={{ backgroundColor: APP_THEME.glow, color: APP_THEME.accent }}
          >
            {(user.display_name || user.email || '?').slice(0, 1)}
          </div>
          <div>
            <h2 className="text-xl font-serif">{user.display_name || '读者'}</h2>
            <p className="text-sm opacity-60 flex items-center gap-1 mt-1">
              <Mail size={14} />
              {user.email}
            </p>
          </div>
        </div>

        <div className="border-t pt-4 space-y-3 text-sm" style={{ borderColor: APP_THEME.line }}>
          <div className="flex justify-between opacity-80">
            <span className="flex items-center gap-1"><User size={14} /> 用户 ID</span>
            <span className="font-mono text-xs opacity-60">{user.id?.slice(0, 8)}...</span>
          </div>
          <div className="flex justify-between opacity-80">
            <span className="flex items-center gap-1"><Calendar size={14} /> 注册时间</span>
            <span>{user.created_at ? new Date(user.created_at).toLocaleDateString('zh-CN') : '-'}</span>
          </div>
        </div>
      </div>

      <div className={`${APP_CLASSES.card} p-6 mb-6`} style={{ backgroundColor: APP_THEME.bgPanel, borderColor: APP_THEME.line }}>
        <h3 className="font-serif font-semibold mb-4 flex items-center gap-2">
          <MessageCircle size={18} style={{ color: APP_THEME.accent }} />
          我的段评
        </h3>
        {recordsLoading ? (
          <p className="text-sm opacity-50">加载中...</p>
        ) : notes.length === 0 ? (
          <p className="text-sm opacity-50">还没有段评，去阅读页写下第一条想法吧。</p>
        ) : (
          <ul className="space-y-3">
            {notes.map((note) => (
              <li key={note.id} className="rounded-xl p-4" style={{ backgroundColor: APP_THEME.bgRaised }}>
                <p className="text-sm leading-relaxed">{note.body}</p>
                {note.text_quote && <p className="text-xs opacity-50 mt-2 line-clamp-2">「{note.text_quote}」</p>}
                {note.chapter_id && (
                  <Link to={`/read/${note.chapter_id}`} className="inline-block mt-2 text-xs" style={{ color: APP_THEME.accent }}>
                    回到这一章 →
                  </Link>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className={`${APP_CLASSES.card} p-6`} style={{ backgroundColor: APP_THEME.bgPanel, borderColor: APP_THEME.line }}>
        <h3 className="font-serif font-semibold mb-4 flex items-center gap-2">
          <BookOpen size={18} style={{ color: APP_THEME.accent }} />
          我的书评
        </h3>
        {recordsLoading ? (
          <p className="text-sm opacity-50">加载中...</p>
        ) : reviews.length === 0 ? (
          <p className="text-sm opacity-50">还没有书评。</p>
        ) : (
          <ul className="space-y-3">
            {reviews.map((review) => (
              <li key={review.id} className="rounded-xl p-4" style={{ backgroundColor: APP_THEME.bgRaised }}>
                <p className="text-sm leading-relaxed">{review.body}</p>
                <div className="flex items-center gap-3 mt-2 text-xs opacity-50">
                  <span>{review.likes || 0} 点亮</span>
                  {review.chapter_id && (
                    <Link to={`/read/${review.chapter_id}`} style={{ color: APP_THEME.accent }}>
                      查看章节 →
                    </Link>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
