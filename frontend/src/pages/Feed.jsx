import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Rss, MessageCircle, Star } from 'lucide-react';
import api from '../api/config';
import { useAuthStore } from '../store/auth';
import { APP_CLASSES, APP_TYPE } from '../styles/theme';

function FeedNoteCard({ note }) {
  const author = note.user?.display_name || '读者';
  const bookTitle = note.book?.title || '未知书籍';
  const chapterLink = note.chapter_id ? `/read/${note.chapter_id}` : `/book/${note.book_id}`;
  const userLink = note.user?.id ? `/users/${note.user.id}` : null;

  return (
    <div className="p-4">
      <div className="flex items-center gap-2 mb-2">
        {userLink ? (
          <Link to={userLink} className="text-xs font-medium text-blue-600 hover:underline">
            {author}
          </Link>
        ) : (
          <span className="text-xs font-medium text-gray-500">{author}</span>
        )}
        <span className="text-xs text-gray-300">·</span>
        <span className="text-xs text-gray-400">写了段评</span>
        <span className="text-xs text-gray-300">·</span>
        <Link to={`/book/${note.book_id}`} className="text-xs text-blue-600 truncate hover:underline">
          {bookTitle}
        </Link>
        {note.likes > 0 && (
          <span className="ml-auto flex items-center gap-1 text-xs text-amber-600">
            <Star size={12} fill="currentColor" />
            {note.likes}
          </span>
        )}
      </div>
      {note.text_quote && (
        <p className={`${APP_TYPE.caption} italic text-gray-400 line-clamp-1 mb-2`}>
          「{note.text_quote}」
        </p>
      )}
      <Link to={chapterLink} className={`${APP_TYPE.body} text-gray-800 line-clamp-3 hover:text-blue-700`}>
        {note.body}
      </Link>
    </div>
  );
}

function FeedReviewCard({ review }) {
  const author = review.user?.display_name || '读者';
  const bookTitle = review.book?.title || '未知书籍';
  const link = review.chapter_id ? `/read/${review.chapter_id}` : `/book/${review.book_id}`;
  const userLink = review.user?.id ? `/users/${review.user.id}` : null;

  return (
    <div className="p-4">
      <div className="flex items-center gap-2 mb-2">
        {userLink ? (
          <Link to={userLink} className="text-xs font-medium text-blue-600 hover:underline">
            {author}
          </Link>
        ) : (
          <span className="text-xs font-medium text-gray-500">{author}</span>
        )}
        <span className="text-xs text-gray-300">·</span>
        <span className="text-xs text-gray-400">写了书评</span>
        <span className="text-xs text-gray-300">·</span>
        <Link to={`/book/${review.book_id}`} className="text-xs text-blue-600 truncate hover:underline">
          {bookTitle}
        </Link>
        {review.likes > 0 && (
          <span className="ml-auto flex items-center gap-1 text-xs text-amber-600">
            <Star size={12} fill="currentColor" />
            {review.likes}
          </span>
        )}
      </div>
      <Link to={link} className={`${APP_TYPE.body} text-gray-800 line-clamp-3 hover:text-blue-700`}>
        {review.body}
      </Link>
    </div>
  );
}

const PAGE_SIZE = 20;

export default function Feed() {
  const { user, isLoading: authLoading } = useAuthStore();
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const loadFeed = useCallback(async (pageNum, append = false) => {
    try {
      if (append) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }
      const res = await api.social.feed({ page: pageNum, page_size: PAGE_SIZE });
      const nextItems = res.data?.items || [];
      setTotal(res.data?.total ?? nextItems.length);
      setItems((prev) => (append ? [...prev, ...nextItems] : nextItems));
      setPage(pageNum);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    loadFeed(1, false);
  }, [user, loadFeed]);

  if (authLoading) {
    return (
      <div className="flex justify-center py-16">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="text-center py-24">
        <p className="opacity-60 mb-4">登录后查看关注动态</p>
        <Link to="/login" className={`${APP_CLASSES.btnPrimary} inline-block !w-auto px-8 py-3`}>
          去登录
        </Link>
      </div>
    );
  }

  const hasMore = items.length < total;

  return (
    <div>
      <div className="flex items-center gap-2 mb-6">
        <Rss size={22} className="text-blue-600" />
        <h1 className="text-2xl font-serif font-semibold">关注动态</h1>
      </div>
      <p className={`${APP_TYPE.caption} mb-6`}>你关注的人的最新段评与书评</p>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        </div>
      ) : items.length === 0 ? (
        <div className={`${APP_CLASSES.card} p-10 text-center text-gray-400`}>
          <MessageCircle size={32} className="mx-auto mb-4 opacity-40" />
          <p className="mb-2">还没有动态</p>
          <p className="text-sm mb-4">去「发现」页关注活跃读者，他们的想法会出现在这里</p>
          <Link to="/discover" className="text-blue-600 hover:text-blue-700 underline underline-offset-4">
            去发现页
          </Link>
        </div>
      ) : (
        <>
          <div className={`${APP_CLASSES.card} divide-y divide-gray-200 overflow-hidden`}>
            {items.map((item) =>
              item.type === 'note' ? (
                <FeedNoteCard key={`note-${item.note.id}`} note={item.note} />
              ) : (
                <FeedReviewCard key={`review-${item.review.id}`} review={item.review} />
              )
            )}
          </div>
          {hasMore && (
            <div className="flex justify-center mt-6">
              <button
                type="button"
                onClick={() => loadFeed(page + 1, true)}
                disabled={loadingMore}
                className={`${APP_CLASSES.btnPrimary} !w-auto px-8 py-2 text-sm`}
              >
                {loadingMore ? '加载中...' : '加载更多'}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
