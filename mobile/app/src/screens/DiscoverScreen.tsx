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
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import api from '../api';
import {
  ActiveReader,
  Book,
  DiscoverFeed,
  HotGroup,
  Note,
  Review,
} from '../api/config';
import FollowButton from '../components/FollowButton';
import type { RootStackParamList } from '../navigation/params';
import { theme } from '../theme';

type Nav = NativeStackNavigationProp<RootStackParamList>;

function SectionHeader({ label, hint }: { label: string; hint?: string }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionLabel}>{label}</Text>
      {hint ? <Text style={styles.sectionHint}>{hint}</Text> : null}
    </View>
  );
}

function BookRow({ book, onPress }: { book: Book; onPress: () => void }) {
  return (
    <Pressable style={styles.cardRow} onPress={onPress}>
      <View style={styles.bookIcon}>
        <Text style={styles.bookIconText}>{book.title?.slice(0, 1) || '书'}</Text>
      </View>
      <View style={styles.cardBody}>
        <Text style={styles.cardTitle} numberOfLines={1}>{book.title}</Text>
        {book.author ? (
          <Text style={styles.cardMeta} numberOfLines={1}>{book.author}</Text>
        ) : null}
      </View>
      <Text style={styles.chevron}>›</Text>
    </Pressable>
  );
}

function HotNoteCard({
  note,
  onPress,
}: {
  note: Note;
  onPress: () => void;
}) {
  const author = note.user?.display_name || '读者';
  const bookTitle = note.book?.title || '未知书籍';

  return (
    <Pressable style={styles.noteCard} onPress={onPress}>
      <View style={styles.noteMeta}>
        <Text style={styles.noteAuthor}>{author}</Text>
        <Text style={styles.noteDot}>·</Text>
        <Text style={styles.noteBook} numberOfLines={1}>{bookTitle}</Text>
        {(note.likes ?? 0) > 0 ? (
          <Text style={styles.noteLikes}>★ {note.likes}</Text>
        ) : null}
      </View>
      {note.text_quote ? (
        <Text style={styles.noteQuote} numberOfLines={1}>
          「{note.text_quote}」
        </Text>
      ) : null}
      <Text style={styles.noteBody} numberOfLines={2}>{note.body}</Text>
    </Pressable>
  );
}

function HotReviewCard({
  review,
  onPress,
}: {
  review: Review;
  onPress: () => void;
}) {
  const author = review.user?.display_name || '读者';
  const bookTitle = review.book?.title || '未知书籍';

  return (
    <Pressable style={styles.noteCard} onPress={onPress}>
      <View style={styles.noteMeta}>
        <Text style={styles.noteAuthor}>{author}</Text>
        <Text style={styles.noteDot}>·</Text>
        <Text style={styles.noteBook} numberOfLines={1}>{bookTitle}</Text>
        {(review.likes ?? 0) > 0 ? (
          <Text style={styles.noteLikes}>★ {review.likes}</Text>
        ) : null}
      </View>
      <Text style={styles.noteBody} numberOfLines={3}>{review.body}</Text>
    </Pressable>
  );
}

function ReaderRow({ reader }: { reader: ActiveReader }) {
  const name = reader.user.display_name || '读者';
  const initial = name.slice(0, 1);

  return (
    <View style={styles.readerRow}>
      <View style={styles.readerAvatar}>
        <Text style={styles.readerAvatarText}>{initial}</Text>
      </View>
      <View style={styles.readerBody}>
        <Text style={styles.readerName} numberOfLines={1}>{name}</Text>
        <Text style={styles.readerStats}>
          {reader.public_notes} 条段评 · {reader.reviews} 条书评
        </Text>
      </View>
      <FollowButton userId={reader.user.id} size="sm" />
      {reader.total_likes > 0 ? (
        <Text style={styles.readerLikes}>✦ {reader.total_likes}</Text>
      ) : null}
    </View>
  );
}

function GroupRow({ group }: { group: HotGroup }) {
  const bookTitle = group.book?.title || '未知书籍';

  return (
    <View style={styles.cardRow}>
      <View style={styles.groupIcon}>
        <Text style={styles.groupIconText}>共</Text>
      </View>
      <View style={styles.cardBody}>
        <Text style={styles.cardTitle} numberOfLines={1}>{group.name}</Text>
        <Text style={styles.cardMeta} numberOfLines={1}>
          {bookTitle} · {group.member_count ?? 0} 人共读
        </Text>
      </View>
    </View>
  );
}

export default function DiscoverScreen() {
  const navigation = useNavigation<Nav>();
  const [feed, setFeed] = useState<DiscoverFeed | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await api.discover.feed();
      setFeed(res.data ?? null);
    } catch {
      setFeed(null);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const goBook = (bookId: string) => navigation.navigate('BookDetail', { bookId });
  const goReader = (chapterId: string, bookTitle?: string) =>
    navigation.navigate('Reader', { chapterId, bookTitle });

  if (loading && !refreshing) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  const dailyPicks = feed?.daily_picks || [];
  const hotNotes = feed?.hot_notes || [];
  const hotReviews = feed?.hot_reviews || [];
  const newBooks = feed?.new_books || [];
  const originalBooks = feed?.original_books || [];
  const activeReaders = feed?.active_readers || [];
  const hotGroups = feed?.hot_groups || [];
  const hasContent =
    dailyPicks.length ||
    hotNotes.length ||
    hotReviews.length ||
    newBooks.length ||
    originalBooks.length ||
    activeReaders.length ||
    hotGroups.length;

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => {
            setRefreshing(true);
            load();
          }}
        />
      }
    >
      <Text style={styles.pageTitle}>发现</Text>
      <Text style={styles.pageHint}>热门想法、活跃读者与新书上架</Text>

      {!hasContent ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyText}>暂无推荐内容，先去书库逛逛吧</Text>
        </View>
      ) : null}

      {dailyPicks.length > 0 ? (
        <View style={styles.section}>
          <SectionHeader label="今日精选" hint="每日三本" />
          <View style={styles.card}>
            {dailyPicks.map((book) => (
              <BookRow key={book.id} book={book} onPress={() => goBook(book.id)} />
            ))}
          </View>
        </View>
      ) : null}

      {hotNotes.length > 0 ? (
        <View style={styles.section}>
          <SectionHeader label="热门段评" />
          <View style={styles.card}>
            {hotNotes.map((note) => (
              <HotNoteCard
                key={note.id}
                note={note}
                onPress={() => {
                  if (note.chapter_id) goReader(note.chapter_id, note.book?.title);
                  else if (note.book_id) goBook(note.book_id);
                }}
              />
            ))}
          </View>
        </View>
      ) : null}

      {hotGroups.length > 0 ? (
        <View style={styles.section}>
          <SectionHeader label="热门共读" />
          <View style={styles.card}>
            {hotGroups.map((group) => (
              <GroupRow key={group.id} group={group} />
            ))}
          </View>
        </View>
      ) : null}

      {hotReviews.length > 0 ? (
        <View style={styles.section}>
          <SectionHeader label="热门书评" />
          <View style={styles.card}>
            {hotReviews.map((review) => (
              <HotReviewCard
                key={review.id}
                review={review}
                onPress={() => {
                  if (review.chapter_id) goReader(review.chapter_id, review.book?.title);
                  else goBook(review.book_id);
                }}
              />
            ))}
          </View>
        </View>
      ) : null}

      {originalBooks.length > 0 ? (
        <View style={styles.section}>
          <SectionHeader label="原创新作" />
          <View style={styles.card}>
            {originalBooks.map((book) => (
              <BookRow key={book.id} book={book} onPress={() => goBook(book.id)} />
            ))}
          </View>
        </View>
      ) : null}

      {newBooks.length > 0 ? (
        <View style={styles.section}>
          <SectionHeader label="新书上架" />
          <View style={styles.card}>
            {newBooks.map((book) => (
              <BookRow key={book.id} book={book} onPress={() => goBook(book.id)} />
            ))}
          </View>
        </View>
      ) : null}

      {activeReaders.length > 0 ? (
        <View style={styles.section}>
          <SectionHeader label="活跃读者" hint="关注他们，动态会出现在你的时间线" />
          <View style={styles.card}>
            {activeReaders.map((reader) => (
              <ReaderRow key={reader.user.id} reader={reader} />
            ))}
          </View>
        </View>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.bg },
  content: { padding: 16, paddingBottom: 32 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  pageTitle: { fontSize: 24, fontWeight: '700', color: theme.text },
  pageHint: { fontSize: 14, color: theme.soft, marginTop: 4, marginBottom: 16 },
  section: { marginBottom: 20 },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: theme.soft,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sectionHint: { fontSize: 12, color: theme.faint, marginLeft: 'auto' },
  card: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.line,
    backgroundColor: theme.bgPanel,
    overflow: 'hidden',
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.line,
  },
  bookIcon: {
    width: 40,
    height: 48,
    borderRadius: 6,
    backgroundColor: theme.bgRaised,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bookIconText: { fontSize: 16, color: theme.faint, fontWeight: '600' },
  cardBody: { flex: 1 },
  cardTitle: { fontSize: 16, fontWeight: '600', color: theme.text },
  cardMeta: { fontSize: 12, color: theme.soft, marginTop: 2 },
  chevron: { fontSize: 20, color: theme.faint },
  noteCard: {
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: theme.line,
  },
  noteMeta: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 6 },
  noteAuthor: { fontSize: 12, fontWeight: '600', color: theme.primary },
  noteDot: { fontSize: 12, color: theme.faint },
  noteBook: { fontSize: 12, color: theme.primary, flex: 1 },
  noteLikes: { fontSize: 12, color: '#D97706', marginLeft: 4 },
  noteQuote: { fontSize: 12, color: theme.faint, fontStyle: 'italic', marginBottom: 4 },
  noteBody: { fontSize: 15, color: theme.text, lineHeight: 22 },
  readerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: theme.line,
  },
  readerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  readerAvatarText: { fontSize: 14, fontWeight: '600', color: theme.primary },
  readerBody: { flex: 1 },
  readerName: { fontSize: 14, fontWeight: '600', color: theme.text },
  readerStats: { fontSize: 12, color: theme.soft, marginTop: 2 },
  readerLikes: { fontSize: 12, color: '#D97706' },
  groupIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  groupIconText: { fontSize: 12, fontWeight: '700', color: theme.primary },
  emptyCard: {
    padding: 32,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.line,
    backgroundColor: theme.bgPanel,
    alignItems: 'center',
  },
  emptyText: { fontSize: 14, color: theme.faint },
});
