/** 分 → 元显示 */
export function formatPrice(cents) {
  if (!cents || cents <= 0) return '免费';
  return `¥${(cents / 100).toFixed(cents % 100 === 0 ? 0 : 2)}`;
}

export function accessLabel(accessType) {
  switch (accessType) {
    case 'vip':
      return 'VIP 专享';
    case 'paid':
      return '付费';
    default:
      return '免费';
  }
}
