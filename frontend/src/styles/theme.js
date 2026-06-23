/** 陪读 App 全局氛围主题（与阅读器 THEMES 同系） */
export const APP_THEME = {
  bg: '#241C1A',
  bgPanel: '#2D2320',
  bgRaised: '#352A26',
  text: '#E8DDCD',
  soft: '#B6A795',
  faint: '#8C7E70',
  accent: '#E0A24E',
  accentDark: '#B06A2C',
  glow: 'rgba(224, 162, 78, 0.16)',
  line: 'rgba(232, 221, 205, 0.12)',
};

export const APP_CLASSES = {
  page: 'min-h-screen text-[#E8DDCD]',
  card: 'rounded-2xl border backdrop-blur-sm',
  input:
    'w-full px-4 py-3 rounded-xl border bg-[#352A26] border-[rgba(232,221,205,0.12)] text-[#E8DDCD] placeholder-[#8C7E70] focus:outline-none focus:border-[#E0A24E] transition-colors',
  btnPrimary:
    'w-full py-3 rounded-xl font-medium transition-all bg-[#E0A24E] text-[#241C1A] hover:bg-[#B06A2C] disabled:opacity-50',
  btnGhost:
    'px-4 py-2 rounded-xl border border-[rgba(232,221,205,0.12)] text-[#B6A795] hover:text-[#E8DDCD] hover:border-[#E0A24E] transition-colors',
};
