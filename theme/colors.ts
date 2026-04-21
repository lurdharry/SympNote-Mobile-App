export type ColorPalette = {
  bgPrimary: string;
  bgSurface: string;
  bgMuted: string;
  accent: string;
  accentDark: string;
  accentLight: string;
  textPrimary: string;
  textSecondary: string;
  textTertiary: string;
  border: string;
  success: string;
  warning: string;
  error: string;
  overlay: string;
};

export const lightColors: ColorPalette = {
  bgPrimary: '#F5F1EA',
  bgSurface: '#FFFFFF',
  bgMuted: '#EBE5DA',
  accent: '#2C6E6B',
  accentDark: '#1F504E',
  accentLight: '#A8C4C2',
  textPrimary: '#1A1F1E',
  textSecondary: '#5A6361',
  textTertiary: '#8A9290',
  border: '#E0D9CC',
  success: '#5A8F6E',
  warning: '#C88A4A',
  error: '#B85450',
  overlay: 'rgba(26,31,30,0.45)',
};

export const darkColors: ColorPalette = {
  bgPrimary: '#171815',
  bgSurface: '#22231F',
  bgMuted: '#2D2E29',
  accent: '#6CA4A0',
  accentDark: '#4A8682',
  accentLight: '#2C4847',
  textPrimary: '#F0EDE5',
  textSecondary: '#A9A59B',
  textTertiary: '#6F6B62',
  border: '#2F302B',
  success: '#7BB491',
  warning: '#D9A166',
  error: '#CB6E6A',
  overlay: 'rgba(0,0,0,0.55)',
};

export const heroGradient = ['#2C6E6B', '#3E8580', '#A8C4C2'] as const;

export const recordingGradient = ['#E08B3F', '#D67A2E', '#C88A4A'] as const;
