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
import type { Review } from '../api/config';
import { theme } from '../theme';
import type { RootStackParamList } from '../navigation/params';

type Nav = NativeStackNavigationProp<RootStackParamList>;

function ReviewItem({
  item,
  onPress,
  onLike,
}: {
  item: Review;
  onPress: () => void;
  onLike: () => void;
}) {
  return (
    <Pressable style={styles.card} onPress={onPress}>
      <Text style={styles.bookTitle}>{item.book?.title || '书籍'}</Text>
      <Text style={styles.body} numberOfLines={4}>
        {item.body}
      </Text>
      <View style={styles.footer}>
        <Pressable onPress={onLike} style={styles.likeBtn}>
          <Text style={[styles.likeText, item.has_liked && { color: theme.danger }]}>
            {item.has_liked ? '❤️' : '🤍'} {item.likes ?? 0}
          </Text>
        </Pressable>
      </View>
    </Pressable>
  );
}

export default function MyReviewsScreen() {
  const navigation = useNavigation<Nav>();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const load = useCallback(
    async (p = 1, refresh = false) => {
      try {
        const res = await api.reviews.mine({ page: p, page_size: 20 });
        const data = res.data;
        const list = data?.reviews ?? data?.items ?? [];
        setReviews((prev) => (refresh || p === 1 ? list : [...prev, ...list]));
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

  const handleLike = async (review: Review, index: number) => {
    if (!review.id) return;
    try {
      if (review.has_liked) {
        await api.reviews.unlike(review.id);
      } else {
        await api.reviews.like(review.id);
      }
      setReviews((prev) => {
        const next = [...prev];
        next[index] = {
          ...review,
          has_liked: !review.has_liked,
          likes: (review.likes ?? 0) + (review.has_liked ? -1 : 1),
        };
        return next;
      });
    } catch {
      // 失败不处理
    }
  };

  return (
    <View style={styles.root}>
      {loading && reviews.length === 0 ? (
        <ActivityIndicator style={styles.loader} color={theme.primary} />
      ) : (
        <FlatList
          data={reviews}
          contentContainerStyle={{ padding: 16, gap: 12 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          keyExtractor={(item, idx) => item.id || `${idx}`}
          onEndReached={onLoadMore}
          onEndReachedThreshold={0.5}
          ListEmptyComponent={
            <Text style={styles.empty}>还没有发表书评</Text>
          }
          renderItem={({ item, index }) => (
            <ReviewItem
              item={item}
              onPress={() => {
                if (item.book_id) {
                  navigation.navigate('BookDetail', { bookId: item.book_id });
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
  body: { fontSize: 15, color: theme.text, lineHeight: 22 },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 4,
  },
  likeBtn: { padding: 4 },
  likeText: { fontSize: 13, color: theme.soft },
  empty: { textAlign: 'center', color: theme.faint, marginTop: 40 },
});
