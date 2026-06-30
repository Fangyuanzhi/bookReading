import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { MessageCircle, BookOpen, Users } from 'lucide-react';
import api from '../api/config';
import { useAuthStore } from '../store/auth';
import FollowButton from '../components/FollowButton';
import UserListModal from '../components/UserListModal';
import { APP_CLASSES, APP_THEME, APP_TYPE } from '../styles/theme';

export default function UserProfile() {
  const { id } = useParams();
  const { user: currentUser } = useAuthStore();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [listModal, setListModal] = useState(null);

  const loadProfile = () => {
    setLoading(true);
    api.social
      .profile(id)
      .then((res) => setProfile(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadProfile();
  }, [id]);

  const openList = async (type) => {
    try {
      const res =
        type === 'followers'
          ? await api.social.followers(id, { page: 1, page_size: 50 })
          : await api.social.following(id, { page: 1, page_size: 50 });
      setListModal({
        title: type === 'followers' ? '粉丝' : '关注',
        users: res.data?.users || [],
      });
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="text-center py-24 text-gray-400">
        <p>用户不存在</p>
        <Link to="/discover" className="text-blue-600 mt-4 inline-block">
          返回发现页
        </Link>
      </div>
    );
  }

  const name = profile.user?.display_name || '读者';
  const isSelf = profile.is_self || currentUser?.id === id;

  return (
    <div className="max-w-2xl mx-auto">
      {listModal && (
        <UserListModal
          title={listModal.title}
          users={listModal.users}
          onClose={() => setListModal(null)}
        />
      )}

      <div className={`${APP_CLASSES.card} p-6 mb-6`} style={{ backgroundColor: APP_THEME.bgPanel, borderColor: APP_THEME.line }}>
        <div className="flex items-start gap-4">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center font-serif text-xl font-semibold shrink-0"
            style={{ backgroundColor: APP_THEME.glow, color: APP_THEME.accent }}
          >
            {name.slice(0, 1)}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-serif font-semibold">{name}</h1>
            <div className="flex items-center gap-4 mt-3 text-sm">
              <button type="button" onClick={() => openList('followers')} className="hover:text-blue-600">
                <span className="font-medium">{profile.stats?.followers ?? 0}</span>
                <span className="text-gray-500 ml-1">粉丝</span>
              </button>
              <button type="button" onClick={() => openList('following')} className="hover:text-blue-600">
                <span className="font-medium">{profile.stats?.following ?? 0}</span>
                <span className="text-gray-500 ml-1">关注</span>
              </button>
            </div>
            <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
              <span>{profile.stats?.public_notes ?? 0} 条段评</span>
              <span>{profile.stats?.reviews ?? 0} 条书评</span>
            </div>
          </div>
          <FollowButton
            userId={id}
            initialFollowing={profile.is_following}
            isSelf={isSelf}
            onChange={() => loadProfile()}
          />
        </div>
      </div>

      {profile.recent_notes?.length > 0 && (
        <div className={`${APP_CLASSES.card} p-6 mb-6`} style={{ backgroundColor: APP_THEME.bgPanel, borderColor: APP_THEME.line }}>
          <h2 className="font-serif font-semibold mb-4 flex items-center gap-2">
            <MessageCircle size={18} style={{ color: APP_THEME.accent }} />
            段评
          </h2>
          <ul className="space-y-3">
            {profile.recent_notes.map((note) => (
              <li key={note.id} className="rounded-xl p-4" style={{ backgroundColor: APP_THEME.bgRaised }}>
                <p className="text-sm leading-relaxed">{note.body}</p>
                {note.text_quote && (
                  <p className="text-xs opacity-50 mt-2 line-clamp-2">「{note.text_quote}」</p>
                )}
                {note.book && (
                  <Link
                    to={note.chapter_id ? `/read/${note.chapter_id}` : `/book/${note.book_id}`}
                    className="inline-block mt-2 text-xs"
                    style={{ color: APP_THEME.accent }}
                  >
                    {note.book.title} →
                  </Link>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {profile.recent_reviews?.length > 0 && (
        <div className={`${APP_CLASSES.card} p-6`} style={{ backgroundColor: APP_THEME.bgPanel, borderColor: APP_THEME.line }}>
          <h2 className="font-serif font-semibold mb-4 flex items-center gap-2">
            <BookOpen size={18} style={{ color: APP_THEME.accent }} />
            书评
          </h2>
          <ul className="space-y-3">
            {profile.recent_reviews.map((review) => (
              <li key={review.id} className="rounded-xl p-4" style={{ backgroundColor: APP_THEME.bgRaised }}>
                <p className="text-sm leading-relaxed">{review.body}</p>
                {review.book && (
                  <Link
                    to={review.chapter_id ? `/read/${review.chapter_id}` : `/book/${review.book_id}`}
                    className="inline-block mt-2 text-xs"
                    style={{ color: APP_THEME.accent }}
                  >
                    {review.book.title} →
                  </Link>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {!profile.recent_notes?.length && !profile.recent_reviews?.length && (
        <div className={`${APP_CLASSES.card} p-8 text-center text-gray-400`}>
          <Users size={28} className="mx-auto mb-3 opacity-40" />
          <p className="text-sm">这位读者还没有公开的段评或书评</p>
        </div>
      )}
    </div>
  );
}
