import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import api from '../api';
import type { ProfileStats, ReadingProgressItem } from '../api/config';
import ContinueReadingCard from '../components/ContinueReadingCard';
import { useAuthStore } from '../store/auth';
import { clearExpiredCache } from '../store/offlineCache';
import { theme } from '../theme';
import type { RootStackParamList } from '../navigation/params';

type Nav = NativeStackNavigationProp<RootStackParamList>;

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

function MenuItem({
  icon,
  label,
  onPress,
  danger,
}: {
  icon: string;
  label: string;
  onPress: () => void;
  danger?: boolean;
}) {
  return (
    <Pressable style={styles.menuItem} onPress={onPress}>
      <Text style={styles.menuIcon}>{icon}</Text>
      <Text style={[styles.menuLabel, danger && { color: theme.danger }]}>{label}</Text>
      <Text style={styles.menuArrow}>›</Text>
    </Pressable>
  );
}

export default function ProfileScreen() {
  const navigation = useNavigation<Nav>();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  const [stats, setStats] = useState<ProfileStats | null>(null);
  const [recent, setRecent] = useState<ReadingProgressItem[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const [statsRes, recentRes] = await Promise.all([
        api.auth.stats(),
        api.reading.recent({ limit: 3 }),
      ]);
      setStats(statsRes.data ?? null);
      const items = Array.isArray(recentRes.data)
        ? recentRes.data
        : recentRes.data?.items ?? [];
      setRecent(items);
    } catch (err) {
      // 静默失败，保持现有数据
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const onRefresh = () => {
    setRefreshing(true);
    load();
  };

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
      </View>

      <View style={styles.statsCard}>
        {loading && !stats ? (
          <ActivityIndicator color={theme.primary} />
        ) : (
          <>
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
          </>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>继续阅读</Text>
        {recent.length === 0 ? (
          <Text style={styles.empty}>还没有阅读记录</Text>
        ) : (
          <FlatList
            data={recent}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item) => `${item.book_id}-${item.chapter_id}`}
            renderItem={({ item }) => (
              <ContinueReadingCard
                item={item}
                onPress={() => navigation.navigate('Reader', { chapterId: item.chapter_id })}
              />
            )}
            contentContainerStyle={{ gap: 12 }}
          />
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>我的内容</Text>
        <MenuItem
          icon="💬"
          label="我的段评"
          onPress={() => navigation.navigate('MyNotes')}
        />
        <MenuItem
          icon="📝"
          label="我的书评"
          onPress={() => navigation.navigate('MyReviews')}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>社交</Text>
        <MenuItem
          icon="👥"
          label="关注 / 粉丝"
          onPress={() => {
            if (user?.id) {
              navigation.navigate('FollowList', { userId: user.id, type: 'following' });
            }
          }}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>更多</Text>
        <MenuItem
          icon="⚙️"
          label="设置"
          onPress={() => navigation.navigate('Settings')}
        />
        <MenuItem
          icon="🚪"
          label="退出登录"
          danger
          onPress={logout}
        />
      </View>

      <Text style={styles.version}>陪读 RN · M4b</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.bg },
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
  section: { marginTop: 24, paddingHorizontal: 16 },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.soft,
    marginBottom: 10,
    marginLeft: 4,
  },
  empty: { fontSize: 14, color: theme.faint, marginLeft: 4, marginTop: 4 },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.bgPanel,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.line,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 10,
  },
  menuIcon: { fontSize: 18, marginRight: 12 },
  menuLabel: { flex: 1, fontSize: 16, color: theme.text },
  menuArrow: { fontSize: 20, color: theme.faint },
  version: { textAlign: 'center', fontSize: 12, color: theme.faint, marginVertical: 24 },
});
