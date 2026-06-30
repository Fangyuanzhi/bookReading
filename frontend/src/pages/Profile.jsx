import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/config';
import { useAuthStore } from '../store/auth';
import { APP_THEME, APP_CLASSES } from '../styles/theme';
import { User, Mail, Calendar, MessageCircle, BookOpen, History, Sparkles, PenLine, Crown, BookMarked, Rss } from 'lucide-react';
import ContinueReadingCard from '../components/ContinueReadingCard';
import { filterRecentReadingItems } from '../utils/recentReading';
import UserListModal from '../components/UserListModal';

export default function Profile() {
  const { user, fetchMe, isLoading } = useAuthStore();
  const [notes, setNotes] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [recentReading, setRecentReading] = useState([]);
  const [stats, setStats] = useState(null);
  const [socialStats, setSocialStats] = useState(null);
  const [vipStatus, setVipStatus] = useState(null);
  const [recordsLoading, setRecordsLoading] = useState(true);
  const [listModal, setListModal] = useState(null);

  useEffect(() => {
    fetchMe().catch(console.error);
  }, [fetchMe]);

  useEffect(() => {
    if (!user) return;

    const loadRecords = async () => {
      try {
        setRecordsLoading(true);
        const [notesRes, reviewsRes, recentRes, statsRes, vipRes, socialRes] = await Promise.all([
          api.notes.mine({ page: 1, page_size: 20 }),
          api.reviews.mine({ page: 1, page_size: 20 }),
          api.reading.recent({ limit: 5 }).catch(() => ({ data: { items: [] } })),
          api.auth.stats().catch(() => ({ data: null })),
          api.vip.status().catch(() => ({ data: { is_vip: false } })),
          api.social.profile(user.id).catch(() => ({ data: null })),
        ]);
        setNotes(notesRes.data?.notes || []);
        setReviews(reviewsRes.data?.reviews || []);
        setRecentReading(filterRecentReadingItems(recentRes.data?.items));
        setStats(statsRes.data);
        setSocialStats(socialRes.data?.stats || null);
        setVipStatus(vipRes.data);
      } catch (err) {
        console.error('Failed to load user records:', err);
      } finally {
        setRecordsLoading(false);
      }
    };

    loadRecords();
  }, [user]);

  const openList = async (type) => {
    if (!user) return;
    try {
      const res =
        type === 'followers'
          ? await api.social.followers(user.id, { page: 1, page_size: 50 })
          : await api.social.following(user.id, { page: 1, page_size: 50 });
      setListModal({
        title: type === 'followers' ? '粉丝' : '关注',
        users: res.data?.users || [],
      });
    } catch (err) {
      console.error(err);
    }
  };

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
      {listModal && (
        <UserListModal
          title={listModal.title}
          users={listModal.users}
          onClose={() => setListModal(null)}
        />
      )}

      <h1 className="text-2xl font-serif font-semibold mb-6">个人中心</h1>

      <div className={`${APP_CLASSES.card} p-6 mb-6`} style={{ backgroundColor: APP_THEME.bgPanel, borderColor: APP_THEME.line }}>
        <div className="flex items-center gap-4 mb-4">
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

        {socialStats && (
          <div className="flex items-center gap-6 mb-4 text-sm">
            <button type="button" onClick={() => openList('followers')} className="hover:opacity-80">
              <span className="font-medium">{socialStats.followers ?? 0}</span>
              <span className="opacity-60 ml-1">粉丝</span>
            </button>
            <button type="button" onClick={() => openList('following')} className="hover:opacity-80">
              <span className="font-medium">{socialStats.following ?? 0}</span>
              <span className="opacity-60 ml-1">关注</span>
            </button>
          </div>
        )}

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

      <Link
        to="/feed"
        className={`${APP_CLASSES.card} p-5 mb-6 flex items-center justify-between gap-4 hover:border-blue-200 transition-colors`}
        style={{ backgroundColor: APP_THEME.bgPanel, borderColor: APP_THEME.line }}
      >
        <div className="flex items-center gap-3">
          <Rss size={22} style={{ color: APP_THEME.accent }} />
          <div>
            <p className="font-medium">关注动态</p>
            <p className="text-sm opacity-60">查看你关注的人的最新想法</p>
          </div>
        </div>
        <span className="text-sm opacity-50">→</span>
      </Link>

      <Link
        to={`/users/${user.id}`}
        className={`${APP_CLASSES.card} p-5 mb-6 flex items-center justify-between gap-4 hover:border-blue-200 transition-colors`}
        style={{ backgroundColor: APP_THEME.bgPanel, borderColor: APP_THEME.line }}
      >
        <div className="flex items-center gap-3">
          <User size={22} style={{ color: APP_THEME.accent }} />
          <div>
            <p className="font-medium">我的公开主页</p>
            <p className="text-sm opacity-60">段评、书评与粉丝</p>
          </div>
        </div>
        <span className="text-sm opacity-50">→</span>
      </Link>

      <Link
        to="/shelf"
        className={`${APP_CLASSES.card} p-5 mb-6 flex items-center justify-between gap-4 hover:border-blue-200 transition-colors`}
        style={{ backgroundColor: APP_THEME.bgPanel, borderColor: APP_THEME.line }}
      >
        <div className="flex items-center gap-3">
          <BookMarked size={22} style={{ color: APP_THEME.accent }} />
          <div>
            <p className="font-medium">我的书架</p>
            <p className="text-sm opacity-60">收藏想读的书，随时继续阅读</p>
          </div>
        </div>
        <span className="text-sm opacity-50">→</span>
      </Link>

      <Link
        to="/vip"
        className={`${APP_CLASSES.card} p-5 mb-6 flex items-center justify-between gap-4 hover:border-amber-300 transition-colors`}
        style={{ backgroundColor: vipStatus?.is_vip ? '#FFFBEB' : APP_THEME.bgPanel, borderColor: APP_THEME.line }}
      >
        <div className="flex items-center gap-3">
          <Crown size={22} className={vipStatus?.is_vip ? 'text-amber-500' : 'text-gray-400'} />
          <div>
            <p className="font-medium">{vipStatus?.is_vip ? 'VIP 会员' : '开通 VIP'}</p>
            <p className="text-sm opacity-60">
              {vipStatus?.is_vip
                ? `有效期至 ${new Date(vipStatus.end_at).toLocaleDateString('zh-CN')}`
                : '畅读 VIP 专区 · 支持创作者'}
            </p>
          </div>
        </div>
        <span className="text-sm opacity-50">→</span>
      </Link>

      {stats && (
        <div className={`${APP_CLASSES.card} p-6 mb-6`} style={{ backgroundColor: APP_THEME.bgPanel, borderColor: APP_THEME.line }}>
          <h3 className="font-serif font-semibold mb-4 flex items-center gap-2">
            <Sparkles size={18} style={{ color: APP_THEME.accent }} />
            被点亮
          </h3>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="rounded-xl p-4" style={{ backgroundColor: APP_THEME.bgRaised }}>
              <p className="text-2xl font-serif font-semibold" style={{ color: APP_THEME.accent }}>
                {stats.total_likes ?? 0}
              </p>
              <p className="text-xs opacity-60 mt-1">总计</p>
            </div>
            <div className="rounded-xl p-4" style={{ backgroundColor: APP_THEME.bgRaised }}>
              <p className="text-2xl font-serif font-semibold">{stats.note_likes ?? 0}</p>
              <p className="text-xs opacity-60 mt-1">段评</p>
            </div>
            <div className="rounded-xl p-4" style={{ backgroundColor: APP_THEME.bgRaised }}>
              <p className="text-2xl font-serif font-semibold">{stats.review_likes ?? 0}</p>
              <p className="text-xs opacity-60 mt-1">书评</p>
            </div>
          </div>
          {(stats.books_created ?? 0) > 0 && (
            <Link
              to="/author"
              className="inline-flex items-center gap-1 mt-4 text-sm"
              style={{ color: APP_THEME.accent }}
            >
              <PenLine size={14} />
              我的创作 · {stats.books_created} 本
            </Link>
          )}
        </div>
      )}

      {!stats?.books_created && (
        <div className={`${APP_CLASSES.card} p-6 mb-6`} style={{ backgroundColor: APP_THEME.bgPanel, borderColor: APP_THEME.line }}>
          <h3 className="font-serif font-semibold mb-2 flex items-center gap-2">
            <PenLine size={18} style={{ color: APP_THEME.accent }} />
            开始创作
          </h3>
          <p className="text-sm opacity-60 mb-4">撰写原创作品，发布后与读者一起陪伴阅读。</p>
          <Link to="/author" className={APP_CLASSES.btnPrimary} style={{ display: 'inline-flex', width: 'auto' }}>
            进入作者后台
          </Link>
        </div>
      )}

      {recentReading.length > 0 && (
        <div className={`${APP_CLASSES.card} overflow-hidden mb-6`} style={{ backgroundColor: APP_THEME.bgPanel, borderColor: APP_THEME.line }}>
          <h3 className="font-serif font-semibold px-6 py-4 border-b flex items-center gap-2" style={{ borderColor: APP_THEME.line }}>
            <History size={18} style={{ color: APP_THEME.accent }} />
            最近阅读
          </h3>
          <div className="divide-y divide-gray-200">
            {recentReading.map((item) => (
              <ContinueReadingCard key={`${item.book_id}-${item.chapter_id}`} item={item} />
            ))}
          </div>
        </div>
      )}

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
