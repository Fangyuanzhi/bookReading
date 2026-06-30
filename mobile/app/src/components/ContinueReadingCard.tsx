import { ReadingProgressItem } from '../api/config';
import { theme } from '../theme';
import { Pressable, StyleSheet, Text, View } from 'react-native';

type Props = {
  item: ReadingProgressItem;
  onPress: () => void;
};

export default function ContinueReadingCard({ item, onPress }: Props) {
  return (
    <Pressable style={styles.row} onPress={onPress}>
      <View style={styles.body}>
        <Text style={styles.label}>继续阅读</Text>
        <Text style={styles.title} numberOfLines={1}>
          {item.book_title || '未知书籍'}
        </Text>
        <Text style={styles.chapter} numberOfLines={1}>
          {item.chapter_title || '章节'}
        </Text>
      </View>
      <Text style={styles.action}>继续 ›</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.line,
    backgroundColor: theme.bgPanel,
  },
  body: { flex: 1, gap: 4 },
  label: {
    fontSize: 11,
    fontWeight: '600',
    color: theme.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  title: { fontSize: 16, fontWeight: '600', color: theme.text },
  chapter: { fontSize: 13, color: theme.soft },
  action: { fontSize: 14, color: theme.primary, fontWeight: '500' },
});
