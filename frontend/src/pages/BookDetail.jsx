import { useCallback, useEffect, useState } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import LoadErrorPanel from '../components/LoadErrorPanel';
import { isNotFoundError } from '../utils/apiError';
import { BookOpen, ChevronRight, Users, Plus, Bookmark, BookmarkCheck, Map } from 'lucide-react';
import api from '../api/config';
import { useAuthStore } from '../store/auth';
import { getBookCover } from '../components/Reader/BookDecoration';
import { hasBookLore } from '../utils/lore';
import CreateGroupModal from '../components/CreateGroupModal';
import PaymentModal from '../components/PaymentModal';
import { APP_CLASSES, APP_NAME, APP_TYPE } from '../styles/theme';
import { accessLabel, formatPrice } from '../utils/price';

export default function BookDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const [book, setBook] = useState(null);
  const [chapters, setChapters] = useState([]);
  const [groups, setGroups] = useState([]);
  const [progress, setProgress] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [inShelf, setInShelf] = useState(false);
  const [shelfLoading, setShelfLoading] = useState(false);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      const requests = [
        api.books.detail(id),
        api.books.chapters(id),
        api.groups.list({ book_id: id, page: 1, page_size: 20 }).catch(() => ({ data: { groups: [] } })),
      ];

      if (user) {
        requests.push(api.reading.getBookProgress(id).catch(() => ({ data: null })));
        requests.push(api.shelf.status(id).catch(() => ({ data: { in_shelf: false } })));
      }

      const results = await Promise.all(requests);
      const bookRes = results[0];
      const chaptersRes = results[1];
      const groupsRes = results[2];
      const progressRes = user ? results[3] : null;
      const shelfRes = user ? results[4] : null;

      setBook(bookRes.data);
      setChapters(chaptersRes.data?.chapters || chaptersRes.data || []);
      setGroups(groupsRes.data?.groups || []);
      if (progressRes) setProgress(progressRes.data);
      if (shelfRes) setInShelf(!!shelfRes.data?.in_shelf);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [id, user]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <div className="flex justify-center py-32">
        <div className="w-8 h-8 rounded-full border-2 border-gray-200 border-t-blue-600 animate-spin" />
      </div>
    );
  }

  if (error || !book) {
    if (isNotFoundError(error)) {
      return <Navigate to="/" replace state={{ notice: '书籍不存在或已下架' }} />;
    }

    return (
      <LoadErrorPanel
        message={error || '书籍不存在或无权访问'}
        onRetry={load}
      />
    );
  }

  const cover = getBookCover(book);
  const showWorld = hasBookLore(book);
  const isPublished = book.status === 'published';
  const hasAccess = book.has_access !== false;
  const accessType = book.access_type || 'free';
  const continueChapter = progress?.chapter;
  const firstChapter = chapters[0];

  const startReading = () => {
    const target = continueChapter || firstChapter;
    if (!target) return;
    if (hasAccess) {
      navigate(`/read/${target.id}`);
    } else if (user) {
      setShowPayment(true);
    } else {
      navigate('/login');
    }
  };

  const toggleShelf = async () => {
    if (!user) {
      navigate('/login');
      return;
    }
    if (!isPublished || shelfLoading) return;

    try {
      setShelfLoading(true);
      if (inShelf) {
        await api.shelf.remove(id);
        setInShelf(false);
      } else {
        await api.shelf.add(id);
        setInShelf(true);
      }
    } catch (err) {
      console.error('Shelf toggle failed:', err);
    } finally {
      setShelfLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto flex flex-col gap-6">
      <header className={`${APP_CLASSES.card} p-6`}>
        <div className="flex gap-5">
          <div className="w-28 h-40 shrink-0 rounded-lg overflow-hidden bg-stone-100 border border-gray-200">
            {cover ? (
              <img src={cover} alt={book.title} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-300">
                <BookOpen size={32} />
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className={APP_TYPE.label}>
              {book.source === 'original' ? '原创作品' : '公版书库'}
              {accessType !== 'free' && (
                <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 normal-case tracking-normal">
                  {accessLabel(accessType)}
                  {accessType === 'paid' && book.price > 0 && ` · ${formatPrice(book.price)}`}
                </span>
              )}
            </p>
            <h1 className={`${APP_TYPE.title} text-gray-900 mt-1`}>{book.title}</h1>
            {book.author && (
              <p className="text-gray-600 mt-1">{book.author}</p>
            )}
            {book.description && (
              <p className={`${APP_TYPE.caption} mt-3 line-clamp-4`}>{book.description}</p>
            )}
          </div>
        </div>

        {isPublished && (
          <div className="flex flex-wrap gap-2 mt-6">
            {chapters.length > 0 && (
              hasAccess ? (
                continueChapter ? (
                  <Link to={`/read/${continueChapter.id}`} className={APP_CLASSES.btnPrimary}>
                    继续阅读 · {continueChapter.title}
                  </Link>
                ) : (
                  <Link to={`/read/${firstChapter.id}`} className={APP_CLASSES.btnPrimary}>
                    开始阅读
                  </Link>
                )
              ) : (
                <button type="button" onClick={startReading} className={APP_CLASSES.btnPrimary}>
                  {accessType === 'vip' ? '开通 VIP 阅读' : `购买 · ${formatPrice(book.price)}`}
                </button>
              )
            )}
            {!hasAccess && user && accessType === 'paid' && chapters.length > 0 && (
              <Link to="/vip" className={APP_CLASSES.btnGhost}>
                或开通 VIP 畅读
              </Link>
            )}
            <button
              type="button"
              onClick={toggleShelf}
              disabled={shelfLoading}
              className={APP_CLASSES.btnGhost}
            >
              {inShelf ? <BookmarkCheck size={16} /> : <Bookmark size={16} />}
              {inShelf ? '已在书架' : '加入书架'}
            </button>
          </div>
        )}
      </header>

      {showWorld && isPublished && (
        <section className={`${APP_CLASSES.card} p-6`}>
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="font-medium text-gray-900">世界图谱</h2>
              <p className={`${APP_TYPE.caption} mt-1`}>
                探索地点与人物 · 随阅读进度解锁 · 点击查看详情
              </p>
            </div>
            <Link to={`/book/${id}/world`} className={`${APP_CLASSES.btnPrimary} !py-2 shrink-0`}>
              <Map size={16} />
              进入
            </Link>
          </div>
        </section>
      )}

      {chapters.length > 0 && (
        <section className={`${APP_CLASSES.card} p-6`}>
          <h2 className="font-medium text-gray-900 mb-4">目录 · {chapters.length} 章</h2>
          <ul className="flex flex-col gap-1">
            {chapters.map((chapter) => (
              <li key={chapter.id}>
                {hasAccess ? (
                  <Link
                    to={`/read/${chapter.id}`}
                    className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg hover:bg-stone-50 transition-colors"
                  >
                    <span className="text-gray-800 truncate">{chapter.title}</span>
                    <ChevronRight size={16} className="text-gray-300 shrink-0" />
                  </Link>
                ) : (
                  <button
                    type="button"
                    onClick={startReading}
                    className="w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg hover:bg-stone-50 transition-colors text-left"
                  >
                    <span className="text-gray-500 truncate">{chapter.title}</span>
                    <span className={`${APP_TYPE.caption} shrink-0`}>需解锁</span>
                  </button>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      {isPublished && (
        <section className={`${APP_CLASSES.card} p-6`}>
          <div className="flex items-center justify-between gap-4 mb-4">
            <div>
              <h2 className="font-medium text-gray-900">共读小组</h2>
              <p className={`${APP_TYPE.caption} mt-1`}>找书友一起读这本书</p>
            </div>
            {user && (
              <button
                type="button"
                onClick={() => setShowCreateGroup(true)}
                className={`${APP_CLASSES.btnPrimary} !py-2 text-sm shrink-0`}
              >
                <Plus size={16} />
                创建
              </button>
            )}
          </div>

          {groups.length === 0 ? (
            <p className={`${APP_TYPE.caption}`}>
              还没有共读小组
              {user ? '，来创建第一个吧' : '。登录后可创建或加入'}
            </p>
          ) : (
            <ul className="flex flex-col gap-2">
              {groups.map((group) => (
                <li key={group.id}>
                  <Link
                    to={`/groups/${group.id}`}
                    className="flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-stone-50 transition-colors"
                  >
                    <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                      <Users size={18} className="text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">{group.name}</p>
                      <p className={`${APP_TYPE.caption}`}>{group.member_count} 位书友</p>
                    </div>
                    <ChevronRight size={16} className="text-gray-300 shrink-0" />
                  </Link>
                </li>
              ))}
            </ul>
          )}

          <div className="mt-4">
            <Link to="/groups" className={`${APP_TYPE.caption} hover:text-gray-700`}>
              查看我的共读小组 →
            </Link>
          </div>
        </section>
      )}

      {showCreateGroup && (
        <CreateGroupModal
          bookId={id}
          bookTitle={book.title}
          onClose={() => setShowCreateGroup(false)}
        />
      )}

      {showPayment && (
        <PaymentModal
          type={accessType === 'vip' ? 'vip' : 'book'}
          amount={accessType === 'vip' ? 1990 : book.price}
          subject={accessType === 'vip' ? `${APP_NAME} VIP 月卡` : `购买《${book.title}》`}
          description={accessType === 'vip' ? '畅读全部 VIP 专区作品' : '单本永久阅读权限'}
          bookId={accessType === 'paid' ? id : undefined}
          onClose={() => setShowPayment(false)}
          onSuccess={load}
        />
      )}
    </div>
  );
}
