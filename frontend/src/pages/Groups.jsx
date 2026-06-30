import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Users, Plus, ChevronRight } from 'lucide-react';
import ProtectedRoute from '../components/ProtectedRoute';
import CreateGroupModal from '../components/CreateGroupModal';
import api from '../api/config';
import { APP_CLASSES, APP_TYPE } from '../styles/theme';

function GroupsContent() {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreate, setShowCreate] = useState(false);

  const loadGroups = async () => {
    try {
      setLoading(true);
      const res = await api.groups.mine({ page: 1, page_size: 50 });
      setGroups(res.data?.groups || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGroups();
  }, []);

  return (
    <div className="max-w-2xl mx-auto">
      <header className={`${APP_CLASSES.card} p-6 mb-6`}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className={APP_TYPE.label}>M3 · 共读</p>
            <h1 className={`${APP_TYPE.title} text-gray-900 mt-1`}>我的共读小组</h1>
            <p className={`${APP_TYPE.caption} mt-2`}>同书同行，不是一个人在读</p>
          </div>
          <button
            type="button"
            onClick={() => setShowCreate(true)}
            className={`${APP_CLASSES.btnPrimary} !py-2 text-sm shrink-0`}
          >
            <Plus size={18} />
            创建
          </button>
        </div>
      </header>

      {error && (
        <div className="mb-4 p-4 rounded-lg bg-red-50 text-red-700 text-sm">{error}</div>
      )}

      {loading ? (
        <div className="flex justify-center py-24">
          <div className="w-8 h-8 rounded-full border-2 border-gray-200 border-t-blue-600 animate-spin" />
        </div>
      ) : groups.length === 0 ? (
        <div className={`${APP_CLASSES.card} p-10 text-center`}>
          <Users size={40} className="mx-auto text-gray-300 mb-4" />
          <p className="text-gray-600 mb-2">还没有加入任何共读小组</p>
          <p className={`${APP_TYPE.caption} mb-6`}>选一本书，邀请书友一起读</p>
          <button type="button" onClick={() => setShowCreate(true)} className={APP_CLASSES.btnPrimary}>
            创建第一个小组
          </button>
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {groups.map((group) => (
            <li key={group.id}>
              <Link
                to={`/groups/${group.id}`}
                className={`${APP_CLASSES.card} flex items-center gap-4 p-4 hover:border-blue-200 transition-colors`}
              >
                <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                  <Users size={20} className="text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="font-medium text-gray-900 truncate">{group.name}</h2>
                  <p className={`${APP_TYPE.caption} truncate`}>
                    {group.book?.title || '未知书籍'} · {group.member_count} 人
                  </p>
                </div>
                <ChevronRight size={18} className="text-gray-400 shrink-0" />
              </Link>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-8 text-center">
        <Link to="/" className={`${APP_TYPE.caption} hover:text-gray-700`}>
          浏览书库，找一本想共读的书 →
        </Link>
      </div>

      {showCreate && (
        <CreateGroupModal onClose={() => setShowCreate(false)} />
      )}
    </div>
  );
}

export default function Groups() {
  return (
    <ProtectedRoute>
      <GroupsContent />
    </ProtectedRoute>
  );
}
