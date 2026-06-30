import { StyleSheet, Text, View } from 'react-native';
import { theme } from '../theme';

interface Props {
  count: number;
  accent?: string;
}

export default function PresenceBar({ count, accent = theme.primary }: Props) {
  return (
    <View style={styles.bar}>
      <View style={styles.dots}>
        {[0, 1, 2, 3, 4].map((i) => (
          <View key={i} style={[styles.dot, { backgroundColor: accent, opacity: 0.4 + i * 0.12 }]} />
        ))}
      </View>
      <Text style={styles.text}>
        此刻 <Text style={[styles.count, { color: accent }]}>{count}</Text> 人和你读到这一章
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginHorizontal: 16,
    marginBottom: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.line,
    backgroundColor: theme.bgPanel,
  },
  dots: { flexDirection: 'row', gap: 4 },
  dot: { width: 6, height: 6, borderRadius: 3 },
  text: { flex: 1, fontSize: 13, color: theme.soft },
  count: { fontWeight: '700' },
});
