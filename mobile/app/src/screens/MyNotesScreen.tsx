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
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import api from '../api';
import type { Note } from '../api/config';
import { useAuthStore } from '../store/auth';
import { theme } from '../theme';
import type { RootStackParamList } from '../navigation/params';

type Nav = NativeStackNavigationProp<RootStackParamList>;

function NoteItem({
  item,
  onPress,
  onLike,
}: {
  item: Note;
  onPress: () => void;
  onLike: () => void;
}) {
  return (
    <Pressable style={styles.card} onPress={onPress}>
      <Text style={styles.bookTitle}>{item.book?.title || '书籍'}</Text>
      {item.text_quote ? (
        <Text style={styles.quote} numberOfLines={2}>
          「{item.text_quote}」
        </Text>
      ) : null}
      <Text style={styles.body} numberOfLines={3}>
        {item.body}
      </Text>
      <View style={styles.footer}>
        <Text style={styles.date}>{formatDate(item.created_at)}</Text>
        <Pressable onPress={onLike} style={styles.likeBtn}>
          <Text style={[styles.likeText, item.has_liked && { color: theme.danger }]}>
            {item.has_liked ? '❤️' : '🤍'} {item.likes ?? 0}
          </Text>
        </Pressable>
      </View>
    </Pressable>
  );
}

function formatDate(iso?: string) {
  if (!iso) return '';
  const d = new Date(iso);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function pad(n: number) {
  return n < 10 ? `0${n}` : `${n}`;
}

export default function MyNotesScreen() {
  const navigation = useNavigation<Nav>();
  const user = useAuthStore((s) => s.user);
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const load = useCallback(
    async (p = 1, refresh = false) => {
      try {
        const res = await api.notes.mine({ page: p, page_size: 20 });
        const data = res.data;
        const list = data?.notes ?? data?.items ?? [];
        setNotes((prev) => (refresh || p === 1 ? list : [...prev, ...list]));
        setHasMore(list.length === 20);
      } catch (err) {
        // 静默失败
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    []
  );

  useEffect(() => {
    load(1, true);
  }, [load]);

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

  const handleLike = async (note: Note, index: number) => {
    if (!note.id) return;
    try {
      if (note.has_liked) {
        await api.notes.unlike(note.id);
      } else {
        await api.notes.like(note.id);
      }
      setNotes((prev) => {
        const next = [...prev];
        next[index] = {
          ...note,
          has_liked: !note.has_liked,
          likes: (note.likes ?? 0) + (note.has_liked ? -1 : 1),
        };
        return next;
      });
    } catch {
      // 失败不处理
    }
  };

  return (
    <View style={styles.root}>
      {loading && notes.length === 0 ? (
        <ActivityIndicator style={styles.loader} color={theme.primary} />
      ) : (
        <FlatList
          data={notes}
          contentContainerStyle={{ padding: 16, gap: 12 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          keyExtractor={(item, idx) => item.id || `${idx}`}
          onEndReached={onLoadMore}
          onEndReachedThreshold={0.5}
          ListEmptyComponent={
            <Text style={styles.empty}>还没有发表段评</Text>
          }
          renderItem={({ item, index }) => (
            <NoteItem
              item={item}
              onPress={() => {
                if (item.chapter_id) {
                  navigation.navigate('Reader', {
                    chapterId: item.chapter_id,
                    bookTitle: item.book?.title,
                  });
                }
              }}
              onLike={() => handleLike(item, index)}
            />
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.bg },
  loader: { marginTop: 40 },
  card: {
    backgroundColor: theme.bgPanel,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.line,
    padding: 16,
    gap: 8,
  },
  bookTitle: { fontSize: 14, fontWeight: '600', color: theme.primary },
  quote: { fontSize: 14, color: theme.soft, fontStyle: 'italic' },
  body: { fontSize: 15, color: theme.text, lineHeight: 22 },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  date: { fontSize: 12, color: theme.faint },
  likeBtn: { padding: 4 },
  likeText: { fontSize: 13, color: theme.soft },
  empty: { textAlign: 'center', color: theme.faint, marginTop: 40 },
});
