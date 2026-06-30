import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import api from '../api';
import { ShelfItem } from '../api/config';
import ShelfBookCard from '../components/ShelfBookCard';
import type { MainTabParamList, RootStackParamList } from '../navigation/params';
import { theme } from '../theme';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type TabNav = BottomTabNavigationProp<MainTabParamList>;

export default function ShelfScreen() {
  const navigation = useNavigation<Nav>();
  const tabNav = useNavigation<TabNav>();
  const [items, setItems] = useState<ShelfItem[]>([]);
  const [total, setTotal] = useState(0);
  const [searchInput, setSearchInput] = useState('');
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      setError('');
      const params: Record<string, string | number> = { page: 1, page_size: 50 };
      if (query.trim()) params.q = query.trim();
      const res = await api.shelf.list(params);
      setItems(res.data?.items || []);
      setTotal(res.data?.total ?? 0);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [query]);

  useEffect(() => {
    load();
  }, [load]);

  const handleRemove = async (bookId: string) => {
    try {
      await api.shelf.remove(bookId);
      setItems((prev) => prev.filter((item) => item.book_id !== bookId));
      setTotal((prev) => Math.max(0, prev - 1));
    } catch {
      // ignore
    }
  };

  const header = (
    <View style={styles.header}>
      <View style={styles.titleRow}>
        <Text style={styles.title}>我的书架</Text>
        {total > 0 ? <Text style={styles.count}>{total} 本</Text> : null}
      </View>
      <TextInput
        style={styles.search}
        value={searchInput}
        onChangeText={setSearchInput}
        placeholder="搜索书架中的书..."
        placeholderTextColor={theme.faint}
        returnKeyType="search"
        onSubmitEditing={() => setQuery(searchInput)}
        clearButtonMode="while-editing"
      />
    </View>
  );

  if (loading && !refreshing) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={theme.primary} />
        <Text style={styles.hint}>加载书架…</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.error}>{error}</Text>
        <Pressable style={styles.retryBtn} onPress={load}>
          <Text style={styles.retryText}>重试</Text>
        </Pressable>
      </View>
    );
  }

  if (items.length === 0) {
    return (
      <View style={styles.root}>
        {header}
        <View style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>
            {query ? '没有找到匹配的书籍' : '书架还是空的'}
          </Text>
          <Text style={styles.emptyHint}>
            {query ? '换个关键词试试' : '在书籍详情页点「加入书架」收藏想读的书'}
          </Text>
          {!query ? (
            <Pressable
              style={styles.primaryBtn}
              onPress={() => tabNav.navigate('Home')}
            >
              <Text style={styles.primaryBtnText}>去书库逛逛</Text>
            </Pressable>
          ) : null}
        </View>
      </View>
    );
  }

  return (
    <FlatList
      style={styles.list}
      data={items}
      keyExtractor={(item) => item.book_id}
      ListHeaderComponent={header}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => {
            setRefreshing(true);
            load();
          }}
        />
      }
      renderItem={({ item }) => (
        <ShelfBookCard
          item={item}
          onPressBook={() =>
            item.book?.id && navigation.navigate('BookDetail', { bookId: item.book.id })
          }
          onContinue={(chapterId) =>
            navigation.navigate('Reader', {
              chapterId,
              bookTitle: item.book?.title,
            })
          }
          onRemove={() => handleRemove(item.book_id)}
        />
      )}
    />
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.bg },
  list: { flex: 1, backgroundColor: theme.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  hint: { color: theme.soft, fontSize: 14 },
  error: { color: theme.danger, fontSize: 15, textAlign: 'center', padding: 24 },
  retryBtn: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    backgroundColor: theme.primary,
  },
  retryText: { color: '#fff', fontWeight: '600' },
  header: { padding: 16, gap: 12 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  title: { fontSize: 24, fontWeight: '700', color: theme.text },
  count: { fontSize: 14, color: theme.faint },
  search: {
    backgroundColor: theme.bgPanel,
    borderWidth: 1,
    borderColor: theme.line,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    color: theme.text,
  },
  emptyCard: {
    margin: 16,
    padding: 32,
    borderRadius: 16,
    backgroundColor: theme.bgPanel,
    borderWidth: 1,
    borderColor: theme.line,
    alignItems: 'center',
    gap: 8,
  },
  emptyTitle: { fontSize: 16, color: theme.text, fontWeight: '600' },
  emptyHint: { fontSize: 14, color: theme.soft, textAlign: 'center' },
  primaryBtn: {
    marginTop: 12,
    backgroundColor: theme.primary,
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  primaryBtnText: { color: '#fff', fontSize: 15, fontWeight: '600' },
});
