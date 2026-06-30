/** 是否为「资源不存在 / 已下架」类错误，适合重定向首页 */
export function isNotFoundError(err) {
  if (!err) return false;
  if (err.status === 404 || err.code === 404) return true;
  const msg = String(err.message || err).toLowerCase();
  return (
    msg.includes('not found') ||
    msg.includes('不存在') ||
    msg.includes('已下架') ||
    msg.includes('无权访问')
  );
}

export function errorMessage(err, fallback = '加载失败') {
  if (!err) return fallback;
  if (typeof err === 'string') return err;
  return err.message || fallback;
}
