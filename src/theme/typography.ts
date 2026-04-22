import { TextStyle } from 'react-native';
import { fontScale } from './responsive';

type TypeToken = TextStyle;

/**
 * Every font size + line height is passed through `fontScale` so the
 * text rhythm matches the running device. Line-height is scaled with
 * the same ratio as font-size to keep the visual baseline grid stable.
 *
 * Letter-spacing stays absolute because sub-pixel kerning doesn't need
 * to track device width — it's a function of the glyphs.
 */
export const typography: Record<string, TypeToken> = {
  display: {
    fontFamily: 'Inter_700Bold',
    fontSize: fontScale(40),
    lineHeight: fontScale(48),
    letterSpacing: -0.4,
  },
  displaySerif: {
    fontFamily: 'Fraunces_500Medium',
    fontSize: fontScale(44),
    lineHeight: fontScale(50),
    letterSpacing: -0.8,
  },
  displaySerifLarge: {
    fontFamily: 'Fraunces_500Medium',
    fontSize: fontScale(56),
    lineHeight: fontScale(60),
    letterSpacing: -1.2,
  },
  serifHeadline: {
    fontFamily: 'Fraunces_500Medium',
    fontSize: fontScale(28),
    lineHeight: fontScale(34),
    letterSpacing: -0.4,
  },
  numberEditorial: {
    fontFamily: 'Fraunces_300Light',
    fontSize: fontScale(36),
    lineHeight: fontScale(36),
    letterSpacing: -1,
    fontVariant: ['tabular-nums'],
  },
  h1: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: fontScale(28),
    lineHeight: fontScale(34),
    letterSpacing: -0.28,
  },
  h2: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: fontScale(22),
    lineHeight: fontScale(28),
    letterSpacing: -0.22,
  },
  h3: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: fontScale(18),
    lineHeight: fontScale(24),
    letterSpacing: -0.18,
  },
  bodyLarge: {
    fontFamily: 'Inter_400Regular',
    fontSize: fontScale(17),
    lineHeight: fontScale(24),
  },
  body: {
    fontFamily: 'Inter_400Regular',
    fontSize: fontScale(15),
    lineHeight: fontScale(22),
  },
  bodySmall: {
    fontFamily: 'Inter_400Regular',
    fontSize: fontScale(13),
    lineHeight: fontScale(18),
  },
  label: {
    fontFamily: 'Inter_500Medium',
    fontSize: fontScale(13),
    lineHeight: fontScale(16),
    textTransform: 'uppercase',
    letterSpacing: 0.26,
  },
  caption: {
    fontFamily: 'Inter_400Regular',
    fontSize: fontScale(11),
    lineHeight: fontScale(14),
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
