import { Platform, ViewStyle } from 'react-native';

export const shadows: Record<'card' | 'elevated', ViewStyle> = Platform.select({
  ios: {
    card: {
      shadowColor: '#1A1F1E',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.08,
      shadowRadius: 12,
    },
    elevated: {
      shadowColor: '#1A1F1E',
      shadowOffset: { width: 0, height: 16 },
      shadowOpacity: 0.1,
      shadowRadius: 32,
    },
  },
  default: {
    card: { elevation: 3 },
    elevated: { elevation: 10 },
  },
})!;
