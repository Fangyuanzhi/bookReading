/**
 * 前端轻量日志工具
 * 开发环境输出到 console；生产环境仅 warn/error
 */

const PREFIX = '[读书会]';
const isDev = import.meta.env.DEV;

function formatMeta(meta) {
  if (!meta || Object.keys(meta).length === 0) return '';
  try {
    return JSON.stringify(meta);
  } catch {
    return String(meta);
  }
}

function log(level, message, meta = {}) {
  const line = `${PREFIX} ${message}${formatMeta(meta) ? ` ${formatMeta(meta)}` : ''}`;

  switch (level) {
    case 'debug':
      if (isDev) console.debug(line, meta);
      break;
    case 'info':
      if (isDev) console.info(line, meta);
      break;
    case 'warn':
      console.warn(line, meta);
      break;
    case 'error':
      console.error(line, meta);
      break;
    default:
      console.log(line, meta);
  }
}

/** API 请求失败日志（含 request_id 便于与后端对照） */
export function logApiError(message, meta = {}) {
  log('error', message, meta);
}

/** API 请求成功（仅开发环境） */
export function logApiDebug(message, meta = {}) {
  log('debug', message, meta);
}

/** WebSocket / 实时连接日志 */
export function logWs(level, message, meta = {}) {
  log(level, message, meta);
}

export default { log, logApiError, logApiDebug, logWs };
