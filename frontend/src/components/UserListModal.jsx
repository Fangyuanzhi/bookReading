import { Link } from 'react-router-dom';
import FollowButton from './FollowButton';
import { APP_CLASSES, APP_THEME } from '../styles/theme';

export default function UserListModal({ title, users, onClose }) {
  if (!users) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div
        className={`${APP_CLASSES.card} w-full max-w-md max-h-[70vh] overflow-y-auto`}
        onClick={(e) => e.stopPropagation()}
        style={{ backgroundColor: APP_THEME.bgPanel }}
      >
        <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: APP_THEME.line }}>
          <h3 className="font-medium">{title}</h3>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600">
            关闭
          </button>
        </div>
        <div className="divide-y divide-gray-100">
          {users.length === 0 ? (
            <p className="p-4 text-sm text-gray-400 text-center">暂无</p>
          ) : (
            users.map((item) => (
              <div key={item.user.id} className="flex items-center gap-3 p-4">
                <Link
                  to={`/users/${item.user.id}`}
                  onClick={onClose}
                  className="flex items-center gap-3 flex-1 min-w-0 hover:opacity-80"
                >
                  <div className="w-9 h-9 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center text-sm font-medium shrink-0">
                    {(item.user.display_name || '?').slice(0, 1)}
                  </div>
                  <span className="text-sm font-medium truncate">{item.user.display_name || '读者'}</span>
                </Link>
                <FollowButton userId={item.user.id} initialFollowing={item.is_following} size="sm" />
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
