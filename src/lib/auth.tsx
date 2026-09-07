import * as SecureStore from 'expo-secure-store';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { Platform } from 'react-native';
import { api, ApiError, type Profile } from './api';

const TOKEN_KEY = 'rentivo.accessToken';

// SecureStore is native-only. On web the token goes to localStorage instead,
// which is the same trade-off the web app already makes.
const storage = {
  async get(): Promise<string | null> {
    try {
      if (Platform.OS === 'web') return globalThis.localStorage?.getItem(TOKEN_KEY) ?? null;
      return await SecureStore.getItemAsync(TOKEN_KEY);
    } catch {
      return null;
    }
  },
  async set(token: string): Promise<void> {
    try {
      if (Platform.OS === 'web') globalThis.localStorage?.setItem(TOKEN_KEY, token);
      else await SecureStore.setItemAsync(TOKEN_KEY, token);
    } catch {
      /* a failed write just means the session won't survive a restart */
    }
  },
  async clear(): Promise<void> {
    try {
      if (Platform.OS === 'web') globalThis.localStorage?.removeItem(TOKEN_KEY);
      else await SecureStore.deleteItemAsync(TOKEN_KEY);
    } catch {
      /* nothing to clean up */
    }
  },
};

interface AuthValue {
  user: Profile | null;
  token: string | null;
  /** True until the stored token has been read and checked on startup. */
  restoring: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  register: (fullName: string, email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Profile | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [restoring, setRestoring] = useState(true);

  // On startup, re-validate any stored token against /auth/me. A token that the
  // API rejects is dropped; one we simply couldn't check (server unreachable)
  // is kept, so a flaky network doesn't sign the user out.
  useEffect(() => {
    let cancelled = false;

    (async () => {
      const stored = await storage.get();
      if (!stored) {
        if (!cancelled) setRestoring(false);
        return;
      }
      try {
        const profile = await api.auth.me(stored);
        if (cancelled) return;
        setToken(stored);
        setUser(profile);
      } catch (err) {
        if (cancelled) return;
        if (err instanceof ApiError && (err.status === 401 || err.status === 403)) {
          await storage.clear();
        } else {
          setToken(stored);
        }
      } finally {
        if (!cancelled) setRestoring(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const adopt = useCallback(async (accessToken: string, profile: Profile) => {
    await storage.set(accessToken);
    setToken(accessToken);
    setUser(profile);
  }, []);

  const signIn = useCallback(
    async (email: string, password: string) => {
      const res = await api.auth.login({ email: email.trim(), password });
      await adopt(res.accessToken, res.user);
    },
    [adopt],
  );

  const register = useCallback(
    async (fullName: string, email: string, password: string) => {
      const res = await api.auth.register({
        fullName: fullName.trim(),
        email: email.trim(),
        password,
      });
      await adopt(res.accessToken, res.user);
    },
    [adopt],
  );

  const signOut = useCallback(async () => {
    await storage.clear();
    setToken(null);
    setUser(null);
  }, []);

  const refresh = useCallback(async () => {
    if (!token) return;
    setUser(await api.auth.me(token));
  }, [token]);

  const value = useMemo(
    () => ({ user, token, restoring, signIn, register, signOut, refresh }),
    [user, token, restoring, signIn, register, signOut, refresh],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
