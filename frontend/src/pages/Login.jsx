import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/auth';
import { APP_THEME, APP_CLASSES } from '../styles/theme';
import { BookOpen } from 'lucide-react';

export default function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { login, register } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (isLogin) {
        await login(email, password);
      } else {
        await register(email, password, displayName);
      }
      navigate('/');
    } catch (err) {
      setError(err.message || '操作失败，请重试');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-6 sm:mt-12">
      <div className="text-center mb-8">
        <div
          className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-4"
          style={{ backgroundColor: APP_THEME.glow }}
        >
          <BookOpen size={28} style={{ color: APP_THEME.accent }} />
        </div>
        <h1 className="text-3xl font-serif font-semibold mb-2">陪读</h1>
        <p className="text-sm opacity-70">氛围陪伴式读书，不是一个人在读</p>
      </div>

      <div className={`${APP_CLASSES.card} p-8`} style={{ backgroundColor: APP_THEME.bgPanel, borderColor: APP_THEME.line }}>
        <h2 className="text-xl font-serif text-center mb-6">{isLogin ? '欢迎回来' : '加入陪读'}</h2>

        {error && (
          <div
            className="mb-4 p-3 rounded-xl text-sm border"
            style={{ backgroundColor: 'rgba(220, 38, 38, 0.1)', borderColor: 'rgba(220, 38, 38, 0.3)', color: '#fca5a5' }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm mb-1.5 opacity-80">邮箱</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className={APP_CLASSES.input}
              placeholder="your@email.com"
            />
          </div>

          <div>
            <label className="block text-sm mb-1.5 opacity-80">密码</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              className={APP_CLASSES.input}
              placeholder={isLogin ? '输入密码' : '至少 8 位，含字母和数字'}
            />
          </div>

          {!isLogin && (
            <div>
              <label className="block text-sm mb-1.5 opacity-80">昵称（可选）</label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className={APP_CLASSES.input}
                placeholder="怎么称呼你"
              />
            </div>
          )}

          <button type="submit" disabled={isLoading} className={APP_CLASSES.btnPrimary}>
            {isLoading ? '请稍候...' : isLogin ? '登录' : '注册并开始阅读'}
          </button>
        </form>

        <div className="mt-6 text-center text-sm opacity-70">
          {isLogin ? '还没有账号？' : '已有账号？'}
          <button
            type="button"
            onClick={() => {
              setIsLogin(!isLogin);
              setError('');
            }}
            className="ml-1 underline underline-offset-2 hover:opacity-100"
            style={{ color: APP_THEME.accent }}
          >
            {isLogin ? '立即注册' : '去登录'}
          </button>
        </div>
      </div>
    </div>
  );
}
