import { Platform, ViewStyle } from 'react-native';

/**
 * Shadow tokens from the design handoff.
 *
 * - card       → small surface elevations (cards, inputs)
 * - elevated   → hero cards, plan cards, bottom sheets
 * - accentGlow → primary CTAs, record button when active
 */
export const shadows: Record<
  'card' | 'elevated' | 'accentGlow',
  ViewStyle
> = Platform.select({
  ios: {
    card: {
      shadowColor: '#1A1F1E',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.06,
      shadowRadius: 12,
    },
    elevated: {
      shadowColor: '#1A1F1E',
      shadowOffset: { width: 0, height: 16 },
      shadowOpacity: 0.08,
      shadowRadius: 32,
    },
    accentGlow: {
      shadowColor: '#2C6E6B',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.35,
      shadowRadius: 24,
    },
  },
  default: {
    card: { elevation: 3 },
    elevated: { elevation: 10 },
    accentGlow: { elevation: 12 },
  },
})!;
