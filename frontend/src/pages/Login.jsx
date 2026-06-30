import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/auth';
import { APP_CLASSES, APP_NAME, APP_TAGLINE, APP_THEME, APP_TYPE } from '../styles/theme';
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
          <BookOpen size={28} className="text-blue-600" />
        </div>
        <h1 className={`${APP_TYPE.display} mb-2`}>{APP_NAME}</h1>
        <p className={APP_TYPE.caption}>{APP_TAGLINE}，不是一个人在读</p>
      </div>

      <div className={`${APP_CLASSES.card} p-6`}>
        <h2 className={`${APP_TYPE.title} text-center mb-6`}>{isLogin ? '欢迎回来' : `加入${APP_NAME}`}</h2>

        {error && (
          <div className="mb-4 p-4 rounded-xl text-sm border border-red-200 bg-red-50 text-red-600">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className={`block ${APP_TYPE.caption} mb-2`}>邮箱</label>
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
            <label className={`block ${APP_TYPE.caption} mb-2`}>密码</label>
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
              <label className={`block ${APP_TYPE.caption} mb-2`}>昵称（可选）</label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className={APP_CLASSES.input}
                placeholder="怎么称呼你"
              />
            </div>
          )}

          <button type="submit" disabled={isLoading} className={`${APP_CLASSES.btnPrimary} !w-full`}>
            {isLoading ? '请稍候...' : isLogin ? '登录' : '注册并开始阅读'}
          </button>
        </form>

        <div className={`mt-6 text-center ${APP_TYPE.caption}`}>
          {isLogin ? '还没有账号？' : '已有账号？'}
          <button
            type="button"
            onClick={() => {
              setIsLogin(!isLogin);
              setError('');
            }}
            className="ml-1 text-blue-600 hover:text-blue-700 underline underline-offset-2"
          >
            {isLogin ? '立即注册' : '去登录'}
          </button>
        </div>
      </div>
    </div>
  );
}
