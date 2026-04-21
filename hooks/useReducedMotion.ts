import { useEffect, useState } from 'react';
import { AccessibilityInfo } from 'react-native';
import { useProfileStore } from '../stores/useProfileStore';

export function useReducedMotion(): boolean {
  const [systemReduced, setSystemReduced] = useState(false);
  const override = useProfileStore((s) => s.reduceMotionOverride);

  useEffect(() => {
    let mounted = true;
    AccessibilityInfo.isReduceMotionEnabled()
      .then((v) => {
        if (mounted) setSystemReduced(!!v);
      })
      .catch(() => {});
    const sub = AccessibilityInfo.addEventListener(
      'reduceMotionChanged',
      (v) => setSystemReduced(!!v)
    );
    return () => {
      mounted = false;
      sub.remove();
    };
  }, []);

  if (override === 'on') return true;
  if (override === 'off') return false;
  return systemReduced;
}
