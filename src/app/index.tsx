import { Redirect } from 'expo-router';
import { useProfileStore } from '../stores/useProfileStore';

export default function Index() {
  const done = useProfileStore((s) => s.onboardingComplete);
  return <Redirect href={done ? '/(tabs)/home' : '/onboarding'} />;
}
