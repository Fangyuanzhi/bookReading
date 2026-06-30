import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import api from '../api';
import { Book, Chapter } from '../api/config';
import type { RootStackParamList } from '../navigation/params';
import { theme } from '../theme';

type Route = RouteProp<RootStackParamList, 'BookDetail'>;
type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function BookDetailScreen() {
  const { params } = useRoute<Route>();
  const navigation = useNavigation<Nav>();
  const { bookId } = params;

  const [book, setBook] = useState<Book | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [progress, setProgress] = useState<{ chapter_id?: string } | null>(null);
  const [inShelf, setInShelf] = useState(false);
  const [shelfLoading, setShelfLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const [bookRes, chaptersRes, progressRes, shelfRes] = await Promise.all([
        api.books.detail(bookId),
        api.books.chapters(bookId),
        api.reading.bookProgress(bookId).catch(() => ({ data: null })),
        api.shelf.status(bookId).catch(() => ({ data: { in_shelf: false } })),
      ]);
      setBook(bookRes.data ?? null);
      const raw = chaptersRes.data;
      const list = Array.isArray(raw) ? raw : raw?.chapters || [];
      setChapters(list);
      setProgress(progressRes.data as { chapter_id?: string } | null);
      setInShelf(shelfRes.data?.in_shelf ?? false);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [bookId]);

  useEffect(() => {
    load();
  }, [load]);

  const startChapter = (chapter: Chapter) => {
    navigation.navigate('Reader', {
      chapterId: chapter.id,
      bookTitle: book?.title,
    });
  };

  const toggleShelf = async () => {
    if (shelfLoading) return;
    try {
      setShelfLoading(true);
      if (inShelf) {
        await api.shelf.remove(bookId);
        setInShelf(false);
      } else {
        await api.shelf.add(bookId);
        setInShelf(true);
      }
    } catch {
      // ignore
    } finally {
      setShelfLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  if (error || !book) {
    return (
      <View style={styles.center}>
        <Text style={styles.error}>{error || '书籍不存在'}</Text>
      </View>
    );
  }

  const continueChapter = progress?.chapter_id
    ? chapters.find((c) => c.id === progress.chapter_id)
    : chapters[0];

  return (
    <View style={styles.root}>
      <View style={styles.hero}>
        <Text style={styles.author}>{book.author || '佚名'}</Text>
        <Text style={styles.title}>{book.title}</Text>
        {book.description ? (
          <Text style={styles.desc}>{book.description}</Text>
        ) : null}
        {continueChapter ? (
          <Pressable
            style={styles.btnPrimary}
            onPress={() => startChapter(continueChapter)}
          >
            <Text style={styles.btnPrimaryText}>
              {progress?.chapter_id ? '继续阅读' : '开始阅读'}
            </Text>
          </Pressable>
        ) : null}
        <Pressable
          style={[styles.btnSecondary, inShelf && styles.btnSecondaryActive]}
          onPress={toggleShelf}
          disabled={shelfLoading}
        >
          <Text style={[styles.btnSecondaryText, inShelf && styles.btnSecondaryTextActive]}>
            {shelfLoading ? '…' : inShelf ? '已在书架' : '加入书架'}
          </Text>
        </Pressable>
      </View>

      <Text style={styles.sectionLabel}>目录 · {chapters.length} 章</Text>
      <FlatList
        data={chapters}
        keyExtractor={(c) => c.id}
        renderItem={({ item, index }) => (
          <Pressable style={styles.chapterRow} onPress={() => startChapter(item)}>
            <Text style={styles.chapterIndex}>{index + 1}</Text>
            <Text style={styles.chapterTitle} numberOfLines={2}>
              {item.title || `第 ${index + 1} 章`}
            </Text>
            <Text style={styles.chevron}>›</Text>
          </Pressable>
        )}
        ListEmptyComponent={
          <Text style={styles.empty}>暂无章节</Text>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  error: { color: theme.danger, padding: 24, textAlign: 'center' },
  hero: {
    margin: 16,
    padding: 20,
    borderRadius: 16,
    backgroundColor: theme.bgPanel,
    borderWidth: 1,
    borderColor: theme.line,
    gap: 8,
  },
  author: {
    fontSize: 11,
    fontWeight: '600',
    color: theme.soft,
    textTransform: 'uppercase',
  },
  title: { fontSize: 24, fontWeight: '700', color: theme.text },
  desc: { fontSize: 14, color: theme.soft, lineHeight: 20 },
  btnPrimary: {
    marginTop: 12,
    backgroundColor: theme.primary,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  btnPrimaryText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  btnSecondary: {
    marginTop: 8,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.line,
    backgroundColor: theme.bgPanel,
  },
  btnSecondaryActive: {
    backgroundColor: theme.bgRaised,
  },
  btnSecondaryText: { color: theme.primary, fontSize: 15, fontWeight: '600' },
  btnSecondaryTextActive: { color: theme.soft },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: theme.soft,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginHorizontal: 16,
    marginBottom: 8,
  },
  chapterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: theme.bgPanel,
    borderBottomWidth: 1,
    borderBottomColor: theme.line,
    gap: 12,
  },
  chapterIndex: {
    width: 28,
    fontSize: 14,
    color: theme.faint,
    fontWeight: '600',
  },
  chapterTitle: { flex: 1, fontSize: 16, color: theme.text },
  chevron: { fontSize: 20, color: theme.faint },
  empty: { textAlign: 'center', color: theme.faint, padding: 24 },
});
