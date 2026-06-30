import { Link, Outlet, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/auth';
import { Search, User, LogOut, Upload as UploadIcon, PenLine, Users, Compass, Crown, BookMarked, Rss } from 'lucide-react';
import { APP_CLASSES, APP_NAME, APP_TYPE } from '../styles/theme';

function IconButton({ to, onClick, icon: Icon, label }) {
  const className =
    'p-2 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-stone-100 transition-colors';

  if (to) {
    return (
      <Link to={to} className={className} title={label} aria-label={label}>
        <Icon size={20} strokeWidth={1.75} />
      </Link>
    );
  }

  return (
    <button type="button" onClick={onClick} className={className} title={label} aria-label={label}>
      <Icon size={20} strokeWidth={1.75} />
    </button>
  );
}

export default function Layout() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className={APP_CLASSES.page}>
      <header className="sticky top-0 z-20 bg-white/95 backdrop-blur-md border-b border-gray-200">
        <div className="max-w-[680px] lg:max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link to="/" className={`${APP_TYPE.title} text-xl text-gray-900`}>
            {APP_NAME}
          </Link>

          <nav className="flex items-center gap-1">
            <IconButton to="/discover" icon={Compass} label="发现" />
            <IconButton to="/search" icon={Search} label="搜索" />
            {user ? (
              <>
                <IconButton to="/feed" icon={Rss} label="动态" />
                <IconButton to="/shelf" icon={BookMarked} label="书架" />
                <IconButton to="/author" icon={PenLine} label="创作" />
                <IconButton to="/groups" icon={Users} label="共读" />
                <IconButton to="/vip" icon={Crown} label="VIP" />
                <IconButton to="/upload" icon={UploadIcon} label="导入" />
                <IconButton to="/profile" icon={User} label="我的" />
                <IconButton onClick={handleLogout} icon={LogOut} label="退出" />
              </>
            ) : (
              <Link to="/login" className={`${APP_CLASSES.btnPrimary} ml-2 !w-auto !py-2 text-sm`}>
                登录
              </Link>
            )}
          </nav>
        </div>
      </header>

      <main className="max-w-[680px] lg:max-w-4xl mx-auto px-4 py-6 pb-16">
        <Outlet />
      </main>

      <footer className="border-t border-gray-200 py-6 text-center">
        <Link to="/legal" className={`${APP_TYPE.caption} text-gray-400 hover:text-gray-600`}>
          内容合规与避风港说明
        </Link>
      </footer>
    </div>
  );
}
