import { TextStyle } from 'react-native';

type TypeToken = TextStyle;

export const typography: Record<string, TypeToken> = {
  display: {
    fontFamily: 'Inter_700Bold',
    fontSize: 40,
    lineHeight: 48,
    letterSpacing: -0.4,
  },
  displaySerif: {
    fontFamily: 'Fraunces_500Medium',
    fontSize: 44,
    lineHeight: 50,
    letterSpacing: -0.8,
  },
  displaySerifLarge: {
    fontFamily: 'Fraunces_500Medium',
    fontSize: 56,
    lineHeight: 60,
    letterSpacing: -1.2,
  },
  serifHeadline: {
    fontFamily: 'Fraunces_500Medium',
    fontSize: 28,
    lineHeight: 34,
    letterSpacing: -0.4,
  },
  numberEditorial: {
    fontFamily: 'Fraunces_300Light',
    fontSize: 36,
    lineHeight: 36,
    letterSpacing: -1,
    fontVariant: ['tabular-nums'],
  },
  h1: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 28,
    lineHeight: 34,
    letterSpacing: -0.28,
  },
  h2: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 22,
    lineHeight: 28,
    letterSpacing: -0.22,
  },
  h3: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 18,
    lineHeight: 24,
    letterSpacing: -0.18,
  },
  bodyLarge: {
    fontFamily: 'Inter_400Regular',
    fontSize: 17,
    lineHeight: 24,
  },
  body: {
    fontFamily: 'Inter_400Regular',
    fontSize: 15,
    lineHeight: 22,
  },
  bodySmall: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    lineHeight: 18,
  },
  label: {
    fontFamily: 'Inter_500Medium',
    fontSize: 13,
    lineHeight: 16,
    textTransform: 'uppercase',
    letterSpacing: 0.26,
  },
  caption: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
    lineHeight: 14,
  },
  number: {
    fontFamily: 'Inter_600SemiBold',
    fontVariant: ['tabular-nums'],
  },
};

export const fontMap = {
  Inter_400Regular: 'Inter_400Regular',
  Inter_500Medium: 'Inter_500Medium',
  Inter_600SemiBold: 'Inter_600SemiBold',
  Inter_700Bold: 'Inter_700Bold',
} as const;
