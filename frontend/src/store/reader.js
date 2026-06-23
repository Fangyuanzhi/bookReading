import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/** 阅读主题（参考 Readest / Koodo Reader / 微信读书护眼模式） */
export const READING_THEMES = {
  eyeGreen: {
    name: '护眼绿',
    desc: '豆沙绿，减轻眼疲劳',
    swatch: '#C7EDCC',
    bg: '#C7EDCC',
    bgPanel: '#D4F0D8',
    bgRaised: '#E2F5E5',
    text: '#2C3E2D',
    soft: '#5A6F5C',
    line: 'rgba(44, 62, 45, 0.12)',
    accent: '#3D8B40',
    glow: 'rgba(61, 139, 64, 0.15)',
  },
  eyeYellow: {
    name: '护眼黄',
    desc: '暖黄底，夜间也柔和',
    swatch: '#F5F0DC',
    bg: '#F5F0DC',
    bgPanel: '#FAF6E8',
    bgRaised: '#FFFDF5',
    text: '#4A4335',
    soft: '#7A7260',
    line: 'rgba(74, 67, 53, 0.12)',
    accent: '#B8860B',
    glow: 'rgba(184, 134, 11, 0.12)',
  },
  sepia: {
    name: '羊皮',
    desc: '经典电子书暖色',
    swatch: '#F4ECD8',
    bg: '#F4ECD8',
    bgPanel: '#FAF3E4',
    bgRaised: '#FFFBF2',
    text: '#5B4636',
    soft: '#8B7355',
    line: 'rgba(91, 70, 54, 0.12)',
    accent: '#A0522D',
    glow: 'rgba(160, 82, 45, 0.12)',
  },
  paper: {
    name: '纸白',
    desc: '温和米白',
    swatch: '#F1E9DA',
    bg: '#F1E9DA',
    bgPanel: '#FBF6EC',
    bgRaised: '#FFFDF8',
    text: '#3B332B',
    soft: '#7C7164',
    line: 'rgba(59, 51, 43, 0.12)',
    accent: '#B06A2C',
    glow: 'rgba(176, 106, 44, 0.12)',
  },
  white: {
    name: '纯白',
    desc: '高对比日间',
    swatch: '#FFFFFF',
    bg: '#FFFFFF',
    bgPanel: '#F8F8F8',
    bgRaised: '#F0F0F0',
    text: '#1A1A1A',
    soft: '#666666',
    line: 'rgba(0, 0, 0, 0.08)',
    accent: '#2563EB',
    glow: 'rgba(37, 99, 235, 0.1)',
  },
  dusk: {
    name: '暮',
    desc: '陪读默认氛围',
    swatch: '#241C1A',
    bg: '#241C1A',
    bgPanel: '#2D2320',
    bgRaised: '#352A26',
    text: '#E8DDCD',
    soft: '#B6A795',
    line: 'rgba(232, 221, 205, 0.12)',
    accent: '#E0A24E',
    glow: 'rgba(224, 162, 78, 0.16)',
  },
  night: {
    name: '夜间',
    desc: '深色 OLED 友好',
    swatch: '#0D0F12',
    bg: '#0D0F12',
    bgPanel: '#15171C',
    bgRaised: '#1C1F26',
    text: '#C9CEDA',
    soft: '#838B9A',
    line: 'rgba(201, 206, 218, 0.1)',
    accent: '#D9A85C',
    glow: 'rgba(217, 168, 92, 0.15)',
  },
};

export const FONT_FAMILIES = {
  serif: { name: '宋体', value: "'Noto Serif SC', 'Songti SC', Georgia, serif" },
  sans: { name: '黑体', value: "'Noto Sans SC', system-ui, sans-serif" },
  kai: { name: '楷体', value: "'KaiTi', 'STKaiti', 'Noto Serif SC', serif" },
};

export const READING_MODES = {
  scroll: { name: '滚动', desc: '连续上下滚动' },
  page: { name: '翻页', desc: '左右点击或滑动翻页' },
};

// 兼容旧引用
export const THEMES = READING_THEMES;

export const useReaderStore = create(
  persist(
    (set) => ({
      theme: 'eyeGreen',
      fontSize: 19,
      lineHeight: 2.0,
      fontFamily: 'serif',
      readingMode: 'page',
      isCompanionMode: true,
      showChrome: true,
      showSettings: false,

      setTheme: (theme) => set({ theme }),
      setFontSize: (size) => set({ fontSize: Math.max(14, Math.min(28, size)) }),
      increaseFontSize: () => set((s) => ({ fontSize: Math.min(28, s.fontSize + 1) })),
      decreaseFontSize: () => set((s) => ({ fontSize: Math.max(14, s.fontSize - 1) })),
      setLineHeight: (lineHeight) => set({ lineHeight: Math.max(1.5, Math.min(2.6, lineHeight)) }),
      setFontFamily: (fontFamily) => set({ fontFamily }),
      setReadingMode: (readingMode) => set({ readingMode }),
      toggleCompanionMode: () => set((s) => ({ isCompanionMode: !s.isCompanionMode })),
      setCompanionMode: (mode) => set({ isCompanionMode: mode }),
      setShowChrome: (showChrome) => set({ showChrome }),
      toggleChrome: () => set((s) => ({ showChrome: !s.showChrome })),
      setShowSettings: (showSettings) => set({ showSettings }),
      toggleSettings: () => set((s) => ({ showSettings: !s.showSettings })),
    }),
    {
      name: 'peidu-reader-settings',
      partialize: (s) => ({
        theme: s.theme,
        fontSize: s.fontSize,
        lineHeight: s.lineHeight,
        fontFamily: s.fontFamily,
        readingMode: s.readingMode,
        isCompanionMode: s.isCompanionMode,
      }),
    },
  ),
);

export function getTheme(key) {
  return READING_THEMES[key] || READING_THEMES.eyeGreen;
}

export function getFontFamily(key) {
  return FONT_FAMILIES[key]?.value || FONT_FAMILIES.serif.value;
}
