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
// The last profile we saw, cached so startup doesn't need the network to know
// who is signed in. See the restore effect for why that matters.
const PROFILE_KEY = 'rentivo.profile';

// SecureStore is native-only. On web these go to localStorage instead, which
// is the same trade-off the web app already makes.
async function read(key: string): Promise<string | null> {
  try {
    if (Platform.OS === 'web') return globalThis.localStorage?.getItem(key) ?? null;
    return await SecureStore.getItemAsync(key);
  } catch {
    return null;
  }
}

async function write(key: string, value: string): Promise<void> {
  try {
    if (Platform.OS === 'web') globalThis.localStorage?.setItem(key, value);
    else await SecureStore.setItemAsync(key, value);
  } catch {
    /* a failed write just means the session won't survive a restart */
  }
}

async function remove(key: string): Promise<void> {
  try {
    if (Platform.OS === 'web') globalThis.localStorage?.removeItem(key);
    else await SecureStore.deleteItemAsync(key);
  } catch {
    /* nothing to clean up */
  }
}

const storage = {
  get: () => read(TOKEN_KEY),
  set: (token: string) => write(TOKEN_KEY, token),
  async getProfile(): Promise<Profile | null> {
    const raw = await read(PROFILE_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as Profile;
    } catch {
      return null;
    }
  },
  setProfile: (profile: Profile) => write(PROFILE_KEY, JSON.stringify(profile)),
  async clear(): Promise<void> {
    await Promise.all([remove(TOKEN_KEY), remove(PROFILE_KEY)]);
  },
};

interface AuthValue {
  user: Profile | null;
  token: string | null;
  /** True until the stored token has been read and checked on startup. */
  restoring: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  register: (
    fullName: string,
    email: string,
    password: string,
    acceptedTerms?: boolean,
  ) => Promise<void>;
  signOut: () => Promise<void>;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Profile | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [restoring, setRestoring] = useState(true);

  /**
   * Restore the session from the device, then re-validate in the background.
   *
   * Startup deliberately does NOT await the network. It used to call /auth/me
   * before clearing `restoring`, which meant an unreachable API held the splash
   * for the full request timeout — fifteen seconds of green screen before the
   * app would show anything. Reading the cached profile makes launch instant
   * and works offline; the token is still checked, just not in the way.
   */
  useEffect(() => {
    let cancelled = false;

    (async () => {
      const [stored, cached] = await Promise.all([
        storage.get(),
        storage.getProfile(),
      ]);
      if (cancelled) return;

      if (stored) {
        setToken(stored);
        if (cached) setUser(cached);
      }
      // Everything the first render needs is known — let the app start.
      setRestoring(false);

      if (!stored) return;

      // Now confirm the token is still good. A rejection signs the user out; a
      // network failure changes nothing, so a flaky connection or a stopped API
      // doesn't lose the session.
      try {
        const fresh = await api.auth.me(stored);
        if (cancelled) return;
        setUser(fresh);
        await storage.setProfile(fresh);
      } catch (err) {
        if (cancelled) return;
        if (err instanceof ApiError && (err.status === 401 || err.status === 403)) {
          await storage.clear();
          setToken(null);
          setUser(null);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const adopt = useCallback(async (accessToken: string, profile: Profile) => {
    await Promise.all([storage.set(accessToken), storage.setProfile(profile)]);
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
    async (
      fullName: string,
      email: string,
      password: string,
      acceptedTerms?: boolean,
    ) => {
      const res = await api.auth.register({
        fullName: fullName.trim(),
        email: email.trim(),
        password,
        acceptedTerms,
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
    const fresh = await api.auth.me(token);
    setUser(fresh);
    await storage.setProfile(fresh);
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
