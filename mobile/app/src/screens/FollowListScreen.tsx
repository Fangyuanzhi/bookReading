import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import api from '../api';
import type { User } from '../api/config';
import FollowButton from '../components/FollowButton';
import { useAuthStore } from '../store/auth';
import { theme } from '../theme';
import type { RootStackParamList } from '../navigation/params';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type FollowRoute = RouteProp<RootStackParamList, 'FollowList'>;

function UserItem({
  user,
  onPress,
}: {
  user: User;
  onPress: () => void;
}) {
  const initials = (user.display_name || user.email || '读').slice(0, 1).toUpperCase();
  const currentUserId = useAuthStore((s) => s.user?.id);

  return (
    <Pressable style={styles.row} onPress={onPress}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{initials}</Text>
      </View>
      <View style={styles.info}>
        <Text style={styles.name}>{user.display_name || user.username || '读者'}</Text>
        {user.email ? <Text style={styles.email}>{user.email}</Text> : null}
      </View>
      {user.id && user.id !== currentUserId ? (
        <FollowButton userId={user.id} />
      ) : null}
    </Pressable>
  );
}

export default function FollowListScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<FollowRoute>();
  const { userId, type } = route.params;
  const currentUserId = useAuthStore((s) => s.user?.id);

  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const load = useCallback(
    async (p = 1, refresh = false) => {
      try {
        const apiCall = type === 'followers' ? api.social.followers : api.social.following;
        const res = await apiCall(userId, { page: p, page_size: 20 });
        const data = res.data;
        const list = data?.users ?? data?.items ?? [];
        setUsers((prev) => (refresh || p === 1 ? list : [...prev, ...list]));
        setHasMore(list.length === 20);
      } catch (err) {
        // 静默失败
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [type, userId]
  );

  useEffect(() => {
    setPage(1);
    load(1, true);
  }, [load, type, userId]);

  const onRefresh = () => {
    setRefreshing(true);
    setPage(1);
    load(1, true);
  };

  const onLoadMore = () => {
    if (!hasMore || loading) return;
    const next = page + 1;
    setPage(next);
    load(next);
  };

  const title = type === 'followers' ? '粉丝' : '关注';

  return (
    <View style={styles.root}>
      <View style={styles.tabs}>
        <Pressable
          style={[styles.tab, type === 'following' && styles.tabActive]}
          onPress={() =>
            navigation.setParams({ type: 'following', userId })
          }
        >
          <Text style={[styles.tabText, type === 'following' && styles.tabTextActive]}>
            关注
          </Text>
        </Pressable>
        <Pressable
          style={[styles.tab, type === 'followers' && styles.tabActive]}
          onPress={() =>
            navigation.setParams({ type: 'followers', userId })
          }
        >
          <Text style={[styles.tabText, type === 'followers' && styles.tabTextActive]}>
            粉丝
          </Text>
        </Pressable>
      </View>

      {loading && users.length === 0 ? (
        <ActivityIndicator style={styles.loader} color={theme.primary} />
      ) : (
        <FlatList
          data={users}
          contentContainerStyle={{ padding: 16, gap: 10 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          keyExtractor={(item, idx) => item.id || `${idx}`}
          onEndReached={onLoadMore}
          onEndReachedThreshold={0.5}
          ListEmptyComponent={<Text style={styles.empty}>暂无{title}</Text>}
          renderItem={({ item }) => (
            <UserItem
              user={item}
              onPress={() => {
                if (item.id && item.id !== currentUserId) {
                  navigation.navigate('UserProfile', { userId: item.id });
                }
              }}
            />
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.bg },
  tabs: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: theme.line,
    backgroundColor: theme.bgPanel,
  },
  tab: { flex: 1, paddingVertical: 14, alignItems: 'center' },
  tabActive: { borderBottomWidth: 2, borderBottomColor: theme.primary },
  tabText: { fontSize: 15, color: theme.soft },
  tabTextActive: { color: theme.primary, fontWeight: '600' },
  loader: { marginTop: 40 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.bgPanel,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.line,
    padding: 12,
    gap: 12,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: 18, fontWeight: '600', color: '#fff' },
  info: { flex: 1, gap: 2 },
  name: { fontSize: 15, fontWeight: '600', color: theme.text },
  email: { fontSize: 12, color: theme.soft },
  empty: { textAlign: 'center', color: theme.faint, marginTop: 40 },
});
