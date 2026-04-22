import { Stack } from 'expo-router';
import { useTheme } from '../../theme';

const OnboardingLayout: React.FC = () => {
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
export default OnboardingLayout;
