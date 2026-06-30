import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/config';
import { useAuthStore } from '../store/auth';
import { APP_CLASSES } from '../styles/theme';

export default function FollowButton({ userId, initialFollowing = false, isSelf = false, onChange, size = 'md' }) {
  const { user } = useAuthStore();
  const [following, setFollowing] = useState(initialFollowing);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setFollowing(initialFollowing);
  }, [initialFollowing]);

  useEffect(() => {
    if (!user || !userId || isSelf) return;
    api.social
      .followStatus(userId)
      .then((res) => setFollowing(res.data?.is_following ?? false))
      .catch(() => {});
  }, [user, userId, isSelf]);

  const sizeClass = size === 'sm' ? 'text-xs px-3 py-1.5' : 'text-sm px-4 py-2';

  if (isSelf || !userId) {
    return null;
  }

  if (!user) {
    return (
      <Link
        to="/login"
        className={`${APP_CLASSES.btnPrimary} !w-auto ${sizeClass}`}
      >
        关注
      </Link>
    );
  }

  const handleToggle = async () => {
    if (loading) return;
    setLoading(true);
    try {
      if (following) {
        await api.social.unfollow(userId);
        setFollowing(false);
        onChange?.(false);
      } else {
        await api.social.follow(userId);
        setFollowing(true);
        onChange?.(true);
      }
    } catch (err) {
      console.error('Follow toggle failed:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleToggle}
      disabled={loading}
      className={`${APP_CLASSES.btnPrimary} !w-auto ${sizeClass} ${following ? '!bg-stone-100 !text-gray-700 border border-gray-200' : ''}`}
    >
      {loading ? '...' : following ? '已关注' : '关注'}
    </button>
  );
}
