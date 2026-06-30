/** 读书会设计规范（Tailwind 对齐） */
export const APP_NAME = '读书会';
export const APP_TAGLINE = '氛围陪伴式读书';
export const APP_THEME = {
  primary: '#2563EB', // blue-600
  accent: '#2563EB', // 同 primary，兼容旧引用
  primaryDark: '#1D4ED8', // blue-700
  bg: '#FAFAF9', // stone-50
  bgPanel: '#FFFFFF', // white
  bgRaised: '#F5F5F4', // stone-100
  text: '#111827', // gray-900
  soft: '#6B7280', // gray-500
  faint: '#9CA3AF', // gray-400
  line: '#E5E7EB', // gray-200
  glow: 'rgba(37, 99, 235, 0.08)',
};

/** 字体梯度：UI 无衬线；阅读正文在 Reader 内单独用 serif */
export const APP_TYPE = {
  body: 'text-base leading-relaxed', // 16px
  title: 'text-2xl font-semibold leading-snug tracking-tight', // 24px
  display: 'text-4xl font-bold leading-tight tracking-tight', // 36px
  caption: 'text-sm text-gray-500',
  label: 'text-xs font-medium uppercase tracking-wide text-gray-500',
};

export const APP_CLASSES = {
  page: 'min-h-screen text-gray-900 bg-stone-50 font-sans text-base',
  card: 'rounded-xl border border-gray-200 bg-white',
  input:
    'w-full px-4 py-3 rounded-lg border border-gray-200 bg-white text-gray-900 text-base placeholder-gray-400 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-colors',
  btnPrimary:
    'inline-flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium text-base transition-colors bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50',
  btnGhost:
    'inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-gray-200 text-gray-500 hover:text-gray-900 hover:border-gray-300 transition-colors text-base',
};

/** 阅读页文章栏最大宽度 */
export const ARTICLE_MAX = 'max-w-[680px]';
