import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, Flame, MessageCircle, BookOpen, Users, Star, ChevronRight } from 'lucide-react';
import api from '../api/config';
import FollowButton from '../components/FollowButton';
import { APP_CLASSES, APP_TYPE } from '../styles/theme';

function SectionHeader({ icon: Icon, label, hint }) {
  return (
    <div className="flex items-center gap-2 px-1 mb-3">
      <Icon size={16} className="text-blue-600" strokeWidth={1.75} />
      <h2 className={APP_TYPE.label}>{label}</h2>
      {hint && <span className={`${APP_TYPE.caption} ml-auto`}>{hint}</span>}
    </div>
  );
}

function HotNoteCard({ note }) {
  const bookTitle = note.book?.title || '未知书籍';
  const author = note.user?.display_name || '读者';
  const chapterLink = note.chapter_id ? `/read/${note.chapter_id}` : `/book/${note.book_id}`;
  const userLink = note.user?.id ? `/users/${note.user.id}` : null;

  return (
    <div className="p-4 hover:bg-stone-50 transition-colors">
      <div className="flex items-center gap-2 mb-2">
        {userLink ? (
          <Link to={userLink} className="text-xs font-medium text-blue-600 hover:underline">
            {author}
          </Link>
        ) : (
          <span className="text-xs font-medium text-gray-500">{author}</span>
        )}
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
      <Link to={chapterLink} className={`${APP_TYPE.body} text-gray-800 line-clamp-2 hover:text-blue-700`}>
        {note.body}
      </Link>
    </div>
  );
}

function HotReviewCard({ review }) {
  const bookTitle = review.book?.title || '未知书籍';
  const author = review.user?.display_name || '读者';
  const link = review.chapter_id ? `/read/${review.chapter_id}` : `/book/${review.book_id}`;
  const userLink = review.user?.id ? `/users/${review.user.id}` : null;

  return (
    <div className="p-4 hover:bg-stone-50 transition-colors">
      <div className="flex items-center gap-2 mb-2">
        {userLink ? (
          <Link to={userLink} className="text-xs font-medium text-blue-600 hover:underline">
            {author}
          </Link>
        ) : (
          <span className="text-xs font-medium text-gray-500">{author}</span>
        )}
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

function ReaderCard({ reader }) {
  const name = reader.user?.display_name || '读者';
  const initial = name.slice(0, 1);
  const userId = reader.user?.id;

  return (
    <div className="flex items-center gap-3 p-4">
      <Link
        to={userId ? `/users/${userId}` : '#'}
        className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-medium text-sm shrink-0 hover:bg-blue-100"
      >
        {initial}
      </Link>
      <div className="flex-1 min-w-0">
        <Link
          to={userId ? `/users/${userId}` : '#'}
          className="text-sm font-medium text-gray-900 truncate hover:text-blue-600 block"
        >
          {name}
        </Link>
        <p className="text-xs text-gray-500 mt-0.5">
          {reader.public_notes} 条段评 · {reader.reviews} 条书评
        </p>
      </div>
      {userId && (
        <FollowButton userId={userId} size="sm" />
      )}
      {reader.total_likes > 0 && (
        <span className="flex items-center gap-1 text-xs text-amber-600 shrink-0">
          <Sparkles size={12} />
          {reader.total_likes}
        </span>
      )}
    </div>
  );
}

function HotGroupCard({ group }) {
  const bookTitle = group.book?.title || '未知书籍';

  return (
    <Link
      to={`/groups/${group.id}`}
      className="flex items-center gap-4 p-4 hover:bg-stone-50 transition-colors"
    >
      <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
        <Users size={18} className="text-blue-600" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-gray-900 truncate">{group.name}</p>
        <p className="text-xs text-gray-500 mt-0.5 truncate">
          {bookTitle} · {group.member_count ?? 0} 人共读
        </p>
      </div>
      <ChevronRight size={16} className="text-gray-300 shrink-0" />
    </Link>
  );
}

export default function Discover() {
  const [feed, setFeed] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.discover
      .feed()
      .then((res) => setFeed(res.data || null))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  const dailyPicks = feed?.daily_picks || [];
  const hotNotes = feed?.hot_notes || [];
  const hotReviews = feed?.hot_reviews || [];
  const newBooks = feed?.new_books || [];
  const originalBooks = feed?.original_books || [];
  const activeReaders = feed?.active_readers || [];
  const hotGroups = feed?.hot_groups || [];

  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <Sparkles size={22} className="text-blue-600" />
        <h1 className="text-2xl font-serif font-semibold">发现</h1>
      </div>
      <p className={`${APP_TYPE.caption} mb-8`}>热门想法、活跃读者与新书上架</p>

      {dailyPicks.length > 0 && (
        <section className="mb-8">
          <SectionHeader icon={Sparkles} label="今日精选" hint="每日三本" />
          <div className={`${APP_CLASSES.card} divide-y divide-gray-100 overflow-hidden`}>
            {dailyPicks.map((book) => (
              <Link
                key={book.id}
                to={`/book/${book.id}`}
                className="flex items-center gap-4 p-4 hover:bg-stone-50 transition-colors"
              >
                <div className="w-10 h-12 rounded bg-stone-100 flex items-center justify-center shrink-0">
                  <BookOpen size={16} className="text-gray-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 truncate">{book.title}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{book.author || '未知作者'}</p>
                </div>
                <ChevronRight size={16} className="text-gray-300 shrink-0" />
              </Link>
            ))}
          </div>
        </section>
      )}

      {hotNotes.length > 0 && (
        <section className="mb-8">
          <SectionHeader icon={Flame} label="热门段评" />
          <div className={`${APP_CLASSES.card} divide-y divide-gray-100 overflow-hidden`}>
            {hotNotes.map((note) => (
              <HotNoteCard key={note.id} note={note} />
            ))}
          </div>
        </section>
      )}

      {hotGroups.length > 0 && (
        <section className="mb-8">
          <SectionHeader icon={Users} label="热门共读" />
          <div className={`${APP_CLASSES.card} divide-y divide-gray-100 overflow-hidden`}>
            {hotGroups.map((group) => (
              <HotGroupCard key={group.id} group={group} />
            ))}
          </div>
        </section>
      )}

      {hotReviews.length > 0 && (
        <section className="mb-8">
          <SectionHeader icon={MessageCircle} label="热门书评" />
          <div className={`${APP_CLASSES.card} divide-y divide-gray-100 overflow-hidden`}>
            {hotReviews.map((review) => (
              <HotReviewCard key={review.id} review={review} />
            ))}
          </div>
        </section>
      )}

      {originalBooks.length > 0 && (
        <section className="mb-8">
          <SectionHeader icon={BookOpen} label="原创新作" />
          <div className={`${APP_CLASSES.card} divide-y divide-gray-100 overflow-hidden`}>
            {originalBooks.map((book) => (
              <Link
                key={book.id}
                to={`/book/${book.id}`}
                className="flex items-center gap-4 p-4 hover:bg-stone-50 transition-colors"
              >
                <p className="font-medium text-gray-900 truncate flex-1">{book.title}</p>
                <ChevronRight size={16} className="text-gray-300 shrink-0" />
              </Link>
            ))}
          </div>
        </section>
      )}

      {newBooks.length > 0 && (
        <section className="mb-8">
          <SectionHeader icon={BookOpen} label="新书上架" />
          <div className={`${APP_CLASSES.card} divide-y divide-gray-100 overflow-hidden`}>
            {newBooks.map((book) => (
              <Link
                key={book.id}
                to={`/book/${book.id}`}
                className="flex items-center gap-4 p-4 hover:bg-stone-50 transition-colors"
              >
                <p className="font-medium text-gray-900 truncate flex-1">{book.title}</p>
                <ChevronRight size={16} className="text-gray-300 shrink-0" />
              </Link>
            ))}
          </div>
        </section>
      )}

      {activeReaders.length > 0 && (
        <section className="mb-8">
          <SectionHeader icon={Users} label="活跃读者" hint="关注他们，动态会出现在你的时间线" />
          <div className={`${APP_CLASSES.card} divide-y divide-gray-100 overflow-hidden`}>
            {activeReaders.map((reader) => (
              <ReaderCard key={reader.user.id} reader={reader} />
            ))}
          </div>
        </section>
      )}

      {!dailyPicks.length && !hotNotes.length && !hotReviews.length && !newBooks.length && (
        <div className={`${APP_CLASSES.card} p-10 text-center text-gray-400`}>
          <p>暂无推荐内容，先去书库逛逛吧</p>
          <Link to="/" className="text-blue-600 mt-4 inline-block hover:underline">
            返回首页
          </Link>
        </div>
      )}
    </div>
  );
}
