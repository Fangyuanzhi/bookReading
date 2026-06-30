import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ShelfItem } from '../api/config';
import { theme } from '../theme';

type Props = {
  item: ShelfItem;
  onPressBook: () => void;
  onContinue: (chapterId: string) => void;
  onRemove?: () => void;
};

export default function ShelfBookCard({ item, onPressBook, onContinue, onRemove }: Props) {
  const book = item.book;
  if (!book) return null;

  const chapter = item.progress?.chapter;
  const chapterId = item.progress?.chapter_id || chapter?.id;
  const initials = book.title?.slice(0, 2) || '书';

  return (
    <View style={styles.row}>
      <Pressable style={styles.cover} onPress={onPressBook}>
        <Text style={styles.coverText}>{initials}</Text>
      </Pressable>

      <View style={styles.body}>
        <Text style={styles.author}>{book.author || '佚名'}</Text>
        <Pressable onPress={onPressBook}>
          <Text style={styles.title} numberOfLines={2}>{book.title}</Text>
        </Pressable>
        {chapter ? (
          <Pressable onPress={() => chapterId && onContinue(chapterId)}>
            <Text style={styles.progress} numberOfLines={1}>
              读到：{chapter.title}
            </Text>
          </Pressable>
        ) : (
          <Text style={styles.progressMuted}>尚未开始阅读</Text>
        )}
      </View>

      <View style={styles.actions}>
        {chapterId ? (
          <Pressable onPress={() => onContinue(chapterId)}>
            <Text style={styles.actionLink}>继续</Text>
          </Pressable>
        ) : (
          <Pressable onPress={onPressBook}>
            <Text style={styles.actionLink}>开始</Text>
          </Pressable>
        )}
        {onRemove ? (
          <Pressable style={styles.removeBtn} onPress={onRemove} hitSlop={8}>
            <Text style={styles.removeText}>移除</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
    backgroundColor: theme.bgPanel,
    borderBottomWidth: 1,
    borderBottomColor: theme.line,
  },
  cover: {
    width: 56,
    height: 76,
    borderRadius: 8,
    backgroundColor: theme.bgRaised,
    borderWidth: 1,
    borderColor: theme.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
  coverText: { fontSize: 13, color: theme.faint, fontWeight: '600' },
  body: { flex: 1, gap: 4 },
  author: {
    fontSize: 11,
    fontWeight: '600',
    color: theme.soft,
    textTransform: 'uppercase',
  },
  title: { fontSize: 16, fontWeight: '600', color: theme.text },
  progress: { fontSize: 13, color: theme.primary },
  progressMuted: { fontSize: 13, color: theme.faint },
  actions: { alignItems: 'flex-end', gap: 8 },
  actionLink: { fontSize: 14, color: theme.primary, fontWeight: '600' },
  removeBtn: { paddingVertical: 4, paddingHorizontal: 6 },
  removeText: { fontSize: 12, color: theme.faint },
});
