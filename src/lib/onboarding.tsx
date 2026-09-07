import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { useAuth } from './auth';

interface OnboardingValue {
  /**
   * Whether the intro has been left during THIS run of the app — by continuing
   * as a guest, skipping, or heading to sign in / create account.
   *
   * Deliberately not persisted. The rule is "signed in goes to Home, everyone
   * else gets the intro", so remembering the dismissal across launches would
   * hide the intro from someone who never signed in — which is what happened
   * when this was written to SecureStore: one tap on Skip and it never came
   * back. Signing in is what makes it stop appearing, nothing else.
   */
  dismissed: boolean;
  dismiss: () => void;
}

const OnboardingContext = createContext<OnboardingValue | null>(null);

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const [dismissed, setDismissed] = useState(false);
  const { user } = useAuth();
  const wasSignedIn = useRef(false);

  // Signing out puts you back to "not signed in", so the intro applies again
  // even though this session had already dismissed it.
  useEffect(() => {
    if (user) {
      wasSignedIn.current = true;
      return;
    }
    if (wasSignedIn.current) {
      wasSignedIn.current = false;
      setDismissed(false);
    }
  }, [user]);

  const dismiss = useCallback(() => setDismissed(true), []);

  const value = useMemo(() => ({ dismissed, dismiss }), [dismissed, dismiss]);

  return (
    <OnboardingContext.Provider value={value}>{children}</OnboardingContext.Provider>
  );
}

export function useOnboarding(): OnboardingValue {
  const ctx = useContext(OnboardingContext);
  if (!ctx) throw new Error('useOnboarding must be used inside <OnboardingProvider>');
  return ctx;
}
