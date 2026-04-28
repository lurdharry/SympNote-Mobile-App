import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from 'react';

type Origin = { x: number; y: number; width: number; height: number } | null;

type TransitionState = {
  origin: Origin;
  setOrigin: (o: Origin) => void;
  /**
   * Ref holder for the active SharedElementScene's close function.
   * The scene registers a reverse-animation function on mount;
   * detail screens can invoke closeScene() before navigating back so
   * the card appears to collapse back into its list row.
   */
  registerSceneCloser: (fn: (() => Promise<void>) | null) => void;
  closeScene: () => Promise<void>;
};

const Ctx = createContext<TransitionState | null>(null);

interface TransitionProviderProps {
  children: React.ReactNode;
}

export const TransitionProvider: React.FC<TransitionProviderProps> = ({ children }) => {
  const [origin, setOriginState] = useState<Origin>(null);
  const sceneCloser = useRef<(() => Promise<void>) | null>(null);

  // Stable identities for functions. Without useCallback, every render of
  // this provider creates new function refs — any consumer that destructures
  // these into a useEffect dep list will re-run its effect constantly,
  // which causes timer/navigation duplication.
  const setOrigin = useCallback((o: Origin) => setOriginState(o), []);

  const registerSceneCloser = useCallback(
    (fn: (() => Promise<void>) | null) => {
      sceneCloser.current = fn;
    },
    [],
  );

  const closeScene = useCallback(async () => {
    const fn = sceneCloser.current;
    if (fn) await fn();
  }, []);

  const value = useMemo<TransitionState>(
    () => ({
      origin,
      setOrigin,
      registerSceneCloser,
      closeScene,
    }),
    [origin, setOrigin, registerSceneCloser, closeScene],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
};

export function useTransition() {
  const v = useContext(Ctx);
  if (!v) throw new Error('useTransition must be used inside TransitionProvider');
  return v;
}
