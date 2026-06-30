import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';
import api from '../api';
import { useAuthStore } from '../store/auth';
import { theme } from '../theme';

type Props = {
  userId: string;
  size?: 'sm' | 'md';
  onChange?: (following: boolean) => void;
};

export default function FollowButton({ userId, size = 'md', onChange }: Props) {
  const currentUser = useAuthStore((s) => s.user);
  const [following, setFollowing] = useState(false);
  const [loading, setLoading] = useState(false);

  const isSelf = currentUser?.id === userId;

  useEffect(() => {
    if (!currentUser || !userId || isSelf) return;
    api.social
      .followStatus(userId)
      .then((res) => setFollowing(res.data?.is_following ?? false))
      .catch(() => {});
  }, [currentUser, userId, isSelf]);

  if (isSelf || !userId) return null;

  const handleToggle = async () => {
    if (loading || !currentUser) return;
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
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  const compact = size === 'sm';

  return (
    <Pressable
      style={[styles.btn, compact && styles.btnSm, following && styles.btnFollowing]}
      onPress={handleToggle}
      disabled={loading || !currentUser}
    >
      {loading ? (
        <ActivityIndicator size="small" color={following ? theme.soft : '#fff'} />
      ) : (
        <Text style={[styles.text, compact && styles.textSm, following && styles.textFollowing]}>
          {following ? '已关注' : '关注'}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    backgroundColor: theme.primary,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
    minWidth: 72,
    alignItems: 'center',
  },
  btnSm: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    minWidth: 60,
  },
  btnFollowing: {
    backgroundColor: theme.bgRaised,
    borderWidth: 1,
    borderColor: theme.line,
  },
  text: { color: '#fff', fontSize: 14, fontWeight: '600' },
  textSm: { fontSize: 12 },
  textFollowing: { color: theme.soft },
});
