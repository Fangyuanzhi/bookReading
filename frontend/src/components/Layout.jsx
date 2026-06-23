import { Link, Outlet, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/auth';
import { BookOpen, Search, User, LogOut, Upload as UploadIcon } from 'lucide-react';
import { APP_THEME, APP_CLASSES } from '../styles/theme';

function NavLink({ to, icon: Icon, label, mobileIconOnly }) {
  return (
    <Link
      to={to}
      className="flex items-center gap-1.5 px-2.5 py-2 rounded-xl opacity-80 hover:opacity-100 hover:bg-white/5 transition-all"
      style={{ color: APP_THEME.soft }}
    >
      <Icon size={17} />
      <span className={mobileIconOnly ? 'hidden sm:inline max-w-[80px] truncate' : 'hidden sm:inline'}>{label}</span>
    </Link>
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
    <div className={`${APP_CLASSES.page} font-sans min-h-[100dvh]`} style={{ backgroundColor: APP_THEME.bg, color: APP_THEME.text }}>
      <div className="fixed inset-0 pointer-events-none overflow-hidden" aria-hidden>
        <div
          className="absolute -top-32 -right-32 w-96 h-96 rounded-full blur-3xl opacity-20"
          style={{ backgroundColor: APP_THEME.accent }}
        />
        <div
          className="absolute top-1/2 -left-48 w-80 h-80 rounded-full blur-3xl opacity-10"
          style={{ backgroundColor: APP_THEME.accentDark }}
        />
      </div>

      <header
        className="sticky top-0 z-20 backdrop-blur-xl border-b"
        style={{ backgroundColor: `${APP_THEME.bg}cc`, borderColor: APP_THEME.line }}
      >
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5 group">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center transition-transform group-hover:scale-105"
              style={{ backgroundColor: APP_THEME.glow }}
            >
              <BookOpen size={18} style={{ color: APP_THEME.accent }} />
            </div>
            <div>
              <span className="text-lg font-serif font-semibold tracking-wide block leading-tight">陪读</span>
              <span className="text-[10px] opacity-50 hidden sm:block">氛围陪伴式读书</span>
            </div>
          </Link>

          <nav className="flex items-center gap-1 sm:gap-2 text-sm">
            <NavLink to="/search" icon={Search} label="搜索" />
            {user ? (
              <>
                <NavLink to="/upload" icon={UploadIcon} label="导入" />
                <NavLink to="/profile" icon={User} label={user.display_name || '我的'} mobileIconOnly />
                <button
                  type="button"
                  onClick={handleLogout}
                  className="p-2.5 rounded-xl opacity-70 hover:opacity-100 hover:bg-white/5 transition-all"
                  style={{ color: APP_THEME.soft }}
                  title="退出"
                >
                  <LogOut size={17} />
                </button>
              </>
            ) : (
              <Link
                to="/login"
                className="ml-1 px-4 py-2 rounded-xl text-sm font-medium transition-all hover:brightness-110"
                style={{ backgroundColor: APP_THEME.accent, color: APP_THEME.bg }}
              >
                登录
              </Link>
            )}
          </nav>
        </div>
      </header>

      <main className="relative max-w-6xl mx-auto px-4 py-8 pb-16">
        <Outlet />
      </main>
    </div>
  );
}
