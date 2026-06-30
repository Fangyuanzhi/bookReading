export const theme = {
  primary: '#2563EB',
  primaryDark: '#1D4ED8',
  primaryLight: '#DBEAFE',
  bg: '#FAFAF9',
  bgPanel: '#FFFFFF',
  bgRaised: '#F5F5F4',
  text: '#111827',
  soft: '#6B7280',
  faint: '#9CA3AF',
  line: '#E5E7EB',
  danger: '#DC2626',
  dangerBg: '#FEF2F2',
} as const;

export const readingThemes = {
  paper: {
    key: 'paper',
    label: '纸白',
    bg: '#FAFAF9',
    text: '#1C1917',
    accent: '#2563EB',
  },
  cream: {
    key: 'cream',
    label: '护眼',
    bg: '#F5F0E6',
    text: '#292524',
    accent: '#B45309',
  },
  night: {
    key: 'night',
    label: '夜间',
    bg: '#1C1917',
    text: '#E7E5E4',
    accent: '#60A5FA',
  },
} as const;

export type ReadingThemeKey = keyof typeof readingThemes;
