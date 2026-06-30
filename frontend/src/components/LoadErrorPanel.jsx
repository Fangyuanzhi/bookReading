import { Link } from 'react-router-dom';
import { APP_CLASSES, APP_TYPE } from '../styles/theme';

/** 加载失败提示：留在 SPA 内，不整页刷新 */
export default function LoadErrorPanel({
  title = '加载失败',
  message,
  homeTo = '/',
  homeLabel = '返回首页',
  onRetry,
  retryLabel = '重试',
  className = '',
}) {
  return (
    <div className={`flex flex-col items-center justify-center gap-4 px-6 py-24 text-center ${className}`}>
      <p className={`${APP_TYPE.title} text-gray-900`}>{title}</p>
      {message && <p className={`${APP_TYPE.body} text-red-600 max-w-md`}>{message}</p>}
      <div className="flex flex-wrap items-center justify-center gap-3 mt-2">
        <Link to={homeTo} className={APP_CLASSES.btnPrimary}>
          {homeLabel}
        </Link>
        {onRetry && (
          <button type="button" onClick={onRetry} className={APP_CLASSES.btnGhost}>
            {retryLabel}
          </button>
        )}
      </div>
    </div>
  );
}
