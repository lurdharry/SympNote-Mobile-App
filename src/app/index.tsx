import { Redirect } from 'expo-router';
import { useProfileStore } from '../stores/useProfileStore';

const Index: React.FC = () => {
  const done = useProfileStore((s) => s.onboardingComplete);
  return <Redirect href={done ? '/(tabs)/home' : '/onboarding'} />;
}
export default Index;
