import { Stack } from 'expo-router';
import { useTheme } from '../../theme';

export default function OnboardingLayout() {
  const { colors } = useTheme();
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'fade',
        animationDuration: 350,
        contentStyle: { backgroundColor: colors.bgPrimary },
      }}
    />
  );
}
