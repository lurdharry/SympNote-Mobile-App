import { useProfileStore } from '../stores/useProfileStore';
import { isEntitled } from '../services/subscription';

export function useSubscription() {
  const status = useProfileStore((s) => s.subscriptionStatus);
  const trialEndsAt = useProfileStore((s) => s.trialEndsAt);
  return {
    status,
    trialEndsAt,
    entitled: isEntitled(),
  };
}
