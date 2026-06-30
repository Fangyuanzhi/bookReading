import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import api from '../api';
import type { PublicProfile } from '../api/config';
import FollowButton from '../components/FollowButton';
import { useAuthStore } from '../store/auth';
import { theme } from '../theme';
import type { RootStackParamList } from '../navigation/params';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type UserRoute = RouteProp<RootStackParamList, 'UserProfile'>;

function StatItem({ label, value, onPress }: { label: string; value: number; onPress?: () => void }) {
  const body = (
    <View style={styles.statItem}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
  if (onPress) return <Pressable onPress={onPress}>{body}</Pressable>;
  return body;
}

export default function UserProfileScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<UserRoute>();
  const { userId } = route.params;
  const currentUserId = useAuthStore((s) => s.user?.id);

  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await api.social.profile(userId);
      setProfile(res.data ?? null);
    } catch (err) {
      // 静默失败
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [userId]);

  useEffect(() => {
    load();
  }, [load]);

  const onRefresh = () => {
    setRefreshing(true);
    load();
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={theme.primary} />
      </View>
    );
  }

  const user = profile?.user;
  const stats = profile?.stats;
  const initials = (user?.display_name || user?.email || '读').slice(0, 1).toUpperCase();

  return (
    <ScrollView
      style={styles.root}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>
        <View style={styles.headerInfo}>
          <Text style={styles.name}>{user?.display_name || user?.username || '读者'}</Text>
          {user?.email ? <Text style={styles.email}>{user.email}</Text> : null}
        </View>
        {user?.id && user.id !== currentUserId ? (
          <FollowButton userId={user.id} />
        ) : (
          <Text style={styles.badge}>我自己</Text>
        )}
      </View>

      <View style={styles.statsCard}>
        <StatItem label="获赞" value={stats?.total_likes ?? 0} />
        <StatItem
          label="段评赞"
          value={stats?.note_likes ?? 0}
        />
        <StatItem
          label="书评赞"
          value={stats?.review_likes ?? 0}
        />
        <StatItem label="创作" value={stats?.books_created ?? 0} />
      </View>

      <View style={styles.statsCard}>
        <StatItem
          label="关注"
          value={profile?.following_count ?? 0}
          onPress={() => navigation.navigate('FollowList', { userId, type: 'following' })}
        />
        <StatItem
          label="粉丝"
          value={profile?.followers_count ?? 0}
          onPress={() => navigation.navigate('FollowList', { userId, type: 'followers' })}
        />
      </View>

      {user?.id === currentUserId && (
        <Text style={styles.hint}>这是你的公开主页，其他用户看到的就是这个页面</Text>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    padding: 20,
    paddingTop: 24,
    backgroundColor: theme.bgPanel,
    borderBottomWidth: 1,
    borderBottomColor: theme.line,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: theme.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: 28, fontWeight: '700', color: '#fff' },
  headerInfo: { flex: 1, gap: 4 },
  name: { fontSize: 22, fontWeight: '700', color: theme.text },
  email: { fontSize: 14, color: theme.soft },
  badge: {
    fontSize: 12,
    color: theme.primary,
    borderWidth: 1,
    borderColor: theme.primary,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  statsCard: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: theme.bgPanel,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.line,
    paddingVertical: 18,
  },
  statItem: { alignItems: 'center', minWidth: 64 },
  statValue: { fontSize: 20, fontWeight: '700', color: theme.text },
  statLabel: { fontSize: 12, color: theme.soft, marginTop: 4 },
  hint: {
    textAlign: 'center',
    fontSize: 12,
    color: theme.faint,
    marginTop: 24,
    marginHorizontal: 32,
  },
});
