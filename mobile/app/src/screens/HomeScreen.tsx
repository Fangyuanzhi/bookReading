import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import api from '../api';
import { Book, ReadingProgressItem } from '../api/config';
import BookCard from '../components/BookCard';
import ContinueReadingCard from '../components/ContinueReadingCard';
import type { RootStackParamList } from '../navigation/params';
import { theme } from '../theme';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function HomeScreen() {
  const navigation = useNavigation<Nav>();
  const [books, setBooks] = useState<Book[]>([]);
  const [recent, setRecent] = useState<ReadingProgressItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      setError('');
      const [booksRes, recentRes] = await Promise.all([
        api.books.list({ page: 1, page_size: 30 }),
        api.reading.recent({ limit: 5 }).catch(() => ({ data: { items: [] } })),
      ]);
      setBooks(booksRes.data?.books || []);
      setRecent(recentRes.data?.items || []);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={theme.primary} />
        <Text style={styles.hint}>加载书库…</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.error}>加载失败：{error}</Text>
      </View>
    );
  }

  const header = (
    <View style={styles.header}>
      <Text style={styles.headerLabel}>陪读 · 书库</Text>
      <Text style={styles.headerTitle}>找一本书，读到同一页</Text>
      <Text style={styles.headerBody}>
        原生阅读 · 段评锚定原文 · 护眼主题
      </Text>
      {recent.length > 0 ? (
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>继续阅读</Text>
          {recent.map((item) => (
            <ContinueReadingCard
              key={`${item.book_id}-${item.chapter_id}`}
              item={item}
              onPress={() =>
                navigation.navigate('Reader', {
                  chapterId: item.chapter_id,
                  bookTitle: item.book_title,
                })
              }
            />
          ))}
        </View>
      ) : null}
      <Text style={styles.sectionLabel}>全部书籍 · {books.length}</Text>
    </View>
  );

  return (
    <FlatList
      data={books}
      keyExtractor={(b) => b.id}
      ListHeaderComponent={header}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} />
      }
      renderItem={({ item }) => (
        <BookCard
          book={item}
          onPress={() => navigation.navigate('BookDetail', { bookId: item.id })}
        />
      )}
      ListEmptyComponent={
        <View style={styles.empty}>
          <Text style={styles.emptyText}>暂无书籍</Text>
        </View>
      }
      style={styles.list}
    />
  );
}

const styles = StyleSheet.create({
  list: { flex: 1, backgroundColor: theme.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  hint: { color: theme.soft, fontSize: 14 },
  error: { color: theme.danger, fontSize: 15, padding: 24, textAlign: 'center' },
  header: {
    padding: 16,
    gap: 8,
    backgroundColor: theme.bg,
  },
  headerLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: theme.soft,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  headerTitle: { fontSize: 28, fontWeight: '700', color: theme.text },
  headerBody: { fontSize: 15, color: theme.soft, lineHeight: 22, marginBottom: 8 },
  section: {
    marginVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.line,
    overflow: 'hidden',
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: theme.soft,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 8,
    marginBottom: 4,
  },
  empty: { padding: 32, alignItems: 'center' },
  emptyText: { color: theme.faint, fontSize: 15 },
});
