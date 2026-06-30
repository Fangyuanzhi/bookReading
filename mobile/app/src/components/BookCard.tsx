import { Book } from '../api/config';
import { theme } from '../theme';
import { Pressable, StyleSheet, Text, View } from 'react-native';

type Props = {
  book: Book;
  onPress: () => void;
};

export default function BookCard({ book, onPress }: Props) {
  const initials = book.title?.slice(0, 2) || '书';

  return (
    <Pressable style={styles.row} onPress={onPress}>
      <View style={styles.cover}>
        <Text style={styles.coverText}>{initials}</Text>
      </View>
      <View style={styles.body}>
        <Text style={styles.author}>{book.author || '佚名'}</Text>
        <Text style={styles.title} numberOfLines={2}>
          {book.title}
        </Text>
        {book.description ? (
          <Text style={styles.desc} numberOfLines={2}>
            {book.description}
          </Text>
        ) : null}
      </View>
      <Text style={styles.chevron}>›</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.line,
    backgroundColor: theme.bgPanel,
  },
  cover: {
    width: 72,
    height: 96,
    borderRadius: 8,
    backgroundColor: theme.bgRaised,
    borderWidth: 1,
    borderColor: theme.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
  coverText: { fontSize: 14, color: theme.faint, fontWeight: '600' },
  body: { flex: 1, gap: 4 },
  author: {
    fontSize: 11,
    fontWeight: '600',
    color: theme.soft,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  title: { fontSize: 18, fontWeight: '600', color: theme.text },
  desc: { fontSize: 13, color: theme.soft, lineHeight: 18 },
  chevron: { fontSize: 22, color: theme.faint, paddingLeft: 4 },
});
