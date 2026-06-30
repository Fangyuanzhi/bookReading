import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Users, BookOpen, LogOut, UserPlus, Trash2 } from 'lucide-react';
import api from '../api/config';
import { useAuthStore } from '../store/auth';
import { APP_CLASSES, APP_TYPE } from '../styles/theme';

export default function GroupDetail() {
  const { id } = useParams();
  const { user } = useAuthStore();
  const [group, setGroup] = useState(null);
  const [posts, setPosts] = useState([]);
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      const [groupRes, postsRes] = await Promise.all([
        api.groups.detail(id),
        api.groups.posts(id, { page: 1, page_size: 100 }),
      ]);
      setGroup(groupRes.data);
      setPosts(postsRes.data?.posts || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [id, user]);

  const handleJoin = async () => {
    if (!user) return;
    setActionLoading(true);
    setError('');
    try {
      await api.groups.join(id);
      await loadData();
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleLeave = async () => {
    if (!window.confirm('确定退出这个共读小组？')) return;
    setActionLoading(true);
    setError('');
    try {
      await api.groups.leave(id);
      window.location.href = '/groups';
    } catch (err) {
      setError(err.message);
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('确定解散这个共读小组？此操作不可撤销。')) return;
    setActionLoading(true);
    setError('');
    try {
      await api.groups.delete(id);
      window.location.href = '/groups';
    } catch (err) {
      setError(err.message);
      setActionLoading(false);
    }
  };

  const handlePost = async (e) => {
    e.preventDefault();
    if (!content.trim() || !user) return;
    setPosting(true);
    setError('');
    try {
      const res = await api.groups.createPost(id, { content: content.trim() });
      setPosts((prev) => [...prev, res.data]);
      setContent('');
    } catch (err) {
      setError(err.message);
    } finally {
      setPosting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-32">
        <div className="w-8 h-8 rounded-full border-2 border-gray-200 border-t-blue-600 animate-spin" />
      </div>
    );
  }

  if (error && !group) {
    return <div className="text-center py-24 text-red-600">加载失败：{error}</div>;
  }

  if (!group) return null;

  const isCreator = user && group.created_by && String(group.created_by) === String(user.id);

  return (
    <div className="max-w-2xl mx-auto flex flex-col gap-6">
      <header className={`${APP_CLASSES.card} p-6`}>
        <p className={APP_TYPE.label}>共读小组</p>
        <h1 className={`${APP_TYPE.title} text-gray-900 mt-1`}>{group.name}</h1>
        {group.description && (
          <p className="text-gray-600 mt-2">{group.description}</p>
        )}

        <div className="flex flex-wrap items-center gap-4 mt-4 text-sm text-gray-500">
          <span className="inline-flex items-center gap-1">
            <BookOpen size={16} />
            {group.book ? (
              <Link to={`/book/${group.book_id}`} className="hover:text-blue-600">
                {group.book.title}
              </Link>
            ) : (
              '未知书籍'
            )}
          </span>
          <span className="inline-flex items-center gap-1">
            <Users size={16} />
            {group.member_count} 位书友
          </span>
        </div>

        {user && (
          <div className="flex flex-wrap gap-2 mt-6">
            {!group.is_member ? (
              <button
                type="button"
                onClick={handleJoin}
                disabled={actionLoading}
                className={APP_CLASSES.btnPrimary}
              >
                <UserPlus size={18} />
                加入共读
              </button>
            ) : (
              <>
                {group.book_id && (
                  <Link to={`/book/${group.book_id}`} className={APP_CLASSES.btnPrimary}>
                    开始阅读
                  </Link>
                )}
                {!isCreator && (
                  <button
                    type="button"
                    onClick={handleLeave}
                    disabled={actionLoading}
                    className={APP_CLASSES.btnGhost}
                  >
                    <LogOut size={18} />
                    退出小组
                  </button>
                )}
                {isCreator && (
                  <button
                    type="button"
                    onClick={handleDelete}
                    disabled={actionLoading}
                    className={`${APP_CLASSES.btnGhost} text-red-600 hover:text-red-700`}
                  >
                    <Trash2 size={18} />
                    解散小组
                  </button>
                )}
              </>
            )}
          </div>
        )}

        {!user && (
          <p className={`${APP_TYPE.caption} mt-4`}>
            <Link to="/login" className="text-blue-600 hover:underline">登录</Link>
            {' '}后加入共读、参与讨论
          </p>
        )}
      </header>

      {group.members?.length > 0 && (
        <section className={`${APP_CLASSES.card} p-6`}>
          <h2 className="font-medium text-gray-900 mb-3">成员</h2>
          <div className="flex flex-wrap gap-2">
            {group.members.map((m) => {
              const memberId = m.user?.id || m.user_id;
              const name = m.user?.display_name || '书友';
              if (memberId) {
                return (
                  <Link
                    key={m.user_id}
                    to={`/users/${memberId}`}
                    className="px-3 py-1 rounded-full bg-stone-100 text-sm text-gray-700 hover:bg-stone-200"
                  >
                    {name}
                  </Link>
                );
              }
              return (
                <span
                  key={m.user_id}
                  className="px-3 py-1 rounded-full bg-stone-100 text-sm text-gray-700"
                >
                  {name}
                </span>
              );
            })}
          </div>
        </section>
      )}

      <section className={`${APP_CLASSES.card} p-6`}>
        <h2 className="font-medium text-gray-900 mb-4">小组讨论</h2>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 text-red-700 text-sm">{error}</div>
        )}

        {posts.length === 0 ? (
          <p className={`${APP_TYPE.caption} mb-4`}>还没有讨论，来发第一条吧</p>
        ) : (
          <ul className="flex flex-col gap-4 mb-6">
            {posts.map((post) => (
              <li key={post.id} className="border-b border-gray-100 pb-4 last:border-0">
                {post.user?.id ? (
                  <Link to={`/users/${post.user.id}`} className="text-sm font-medium text-blue-600 hover:underline">
                    {post.user.display_name || '书友'}
                  </Link>
                ) : (
                  <p className="text-sm font-medium text-gray-800">
                    {post.user?.display_name || '书友'}
                  </p>
                )}
                <p className="text-gray-700 mt-1 whitespace-pre-wrap">{post.content}</p>
                <p className={`${APP_TYPE.caption} mt-1`}>
                  {new Date(post.created_at).toLocaleString('zh-CN')}
                </p>
              </li>
            ))}
          </ul>
        )}

        {user && group.is_member && (
          <form onSubmit={handlePost} className="flex flex-col gap-3">
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="分享你的阅读感受…"
              rows={3}
              className={APP_CLASSES.input}
              maxLength={2000}
            />
            <button
              type="submit"
              disabled={posting || !content.trim()}
              className={`${APP_CLASSES.btnPrimary} self-end !py-2 text-sm`}
            >
              发表
            </button>
          </form>
        )}
      </section>
    </div>
  );
}
