import Constants from 'expo-constants';
import { Platform } from 'react-native';

// ── Where the API lives ───────────────────────────────────────────────────
//
// Order of preference:
//   1. EXPO_PUBLIC_API_URL — always wins, needed for staging/production builds.
//   2. The host Metro is served from — a phone on the same Wi-Fi can reach the
//      dev machine at that IP, whereas "localhost" would point at the phone.
//   3. Platform defaults — the Android emulator reaches the host at 10.0.2.2,
//      everything else at localhost.
const PORT = 5000;

function devHost(): string | null {
  // e.g. "192.168.1.50:8081" while running `expo start` on a LAN.
  const hostUri =
    Constants.expoConfig?.hostUri ??
    (Constants.expoGoConfig as { debuggerHost?: string } | undefined)?.debuggerHost;
  const host = hostUri?.split(':')[0];
  if (!host || host === 'localhost' || host === '127.0.0.1') return null;
  return host;
}

function resolveBaseUrl(): string {
  const fromEnv = process.env.EXPO_PUBLIC_API_URL?.trim();
  if (fromEnv) return fromEnv.replace(/\/+$/, '');

  const lan = devHost();
  if (lan) return `http://${lan}:${PORT}/api`;

  const host = Platform.OS === 'android' ? '10.0.2.2' : 'localhost';
  return `http://${host}:${PORT}/api`;
}

export const API_URL = resolveBaseUrl();

// Origin without the /api suffix, for building URLs to uploaded images.
const ORIGIN = API_URL.replace(/\/api\/?$/, '');

/** Turn a stored image path ("/uploads/x.jpg") into a URL the app can load. */
export function assetUrl(path?: string | null): string | null {
  if (!path) return null;
  if (/^https?:/i.test(path)) return path;
  return `${ORIGIN}${path}`;
}

/** An error carrying the API's own message, so the UI can show the real reason. */
export class ApiError extends Error {
  status: number;
  constructor(message: string, status = 0) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

async function toError(res: Response): Promise<ApiError> {
  const text = await res.text().catch(() => '');
  let message = `Request failed (${res.status})`;
  try {
    const json = JSON.parse(text) as { message?: string | string[] };
    if (json.message) {
      message = Array.isArray(json.message) ? json.message.join(', ') : json.message;
    }
  } catch {
    /* keep the status-based message */
  }
  return new ApiError(message, res.status);
}

// A phone on the wrong network hangs rather than failing, so every request gets
// a deadline and a message that names the actual problem.
const TIMEOUT_MS = 15000;

interface RequestOptions {
  signal?: AbortSignal;
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  body?: unknown;
  /** Sent as `Authorization: Bearer …` — the API's mobile auth path. */
  token?: string | null;
}

async function request<T>(path: string, opts: RequestOptions = {}): Promise<T> {
  const { signal, method = 'GET', body, token } = opts;
  const timeout = new AbortController();
  const timer = setTimeout(() => timeout.abort(), TIMEOUT_MS);
  const onAbort = () => timeout.abort();
  signal?.addEventListener('abort', onAbort);

  try {
    const res = await fetch(`${API_URL}${path}`, {
      method,
      headers: {
        Accept: 'application/json',
        ...(body ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
      signal: timeout.signal,
    });
    if (!res.ok) throw await toError(res);
    return (await res.json()) as T;
  } catch (err) {
    if (err instanceof ApiError) throw err;
    // The caller cancelled (screen unmounted) — let that propagate untouched.
    if (signal?.aborted) throw err;
    if (err instanceof Error && err.name === 'AbortError') {
      throw new ApiError(`The server at ${API_URL} took too long to respond.`);
    }
    throw new ApiError(
      `Can't reach the server at ${API_URL}. Check that the API is running and that ` +
        'EXPO_PUBLIC_API_URL points at it.',
    );
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener('abort', onAbort);
  }
}

// Build a "?a=b&c=d" query string, dropping empty values.
function qs(params: Record<string, string | undefined>): string {
  const entries = Object.entries(params).filter(([, v]) => v) as [string, string][];
  const s = new URLSearchParams(entries).toString();
  return s ? `?${s}` : '';
}

// ── Public shapes returned by the storefront endpoints ────────────────────

export type Availability = 'available' | 'unavailable' | string;

export interface Product {
  id: number;
  name: string;
  description: string | null;
  pricePerDay: number;
  currency: string;
  imageUrl: string | null;
  availability: Availability;
  businessId: number;
  businessName: string | null;
  category: string | null;
  location: string | null;
  bookings: number;
  rating: number;
  reviewCount: number;
}

export interface RentalPackage {
  id: number;
  name: string;
  description: string | null;
  price: number;
  currency: string;
  priceUnit: string;
  items: string[];
  itemValues: { value: number | string }[];
  availability: Availability;
  businessId: number;
  businessName: string | null;
  category: string | null;
  location: string | null;
  rating: number;
  reviewCount: number;
}

export interface Business {
  id: number;
  name: string;
  category: string | null;
  description: string | null;
  location: string | null;
  imageUrl: string | null;
  ownerName: string | null;
  rating: number;
  reviewCount: number;
  createdAt: string;
}

export type UserRole = 'admin' | 'owner' | 'customer' | string;

/** The profile shape shared by /auth/login, /auth/register and /auth/me. */
export interface Profile {
  id: number;
  fullName: string;
  email: string;
  role: UserRole;
  plan: string | null;
  avatarUrl: string | null;
}

export interface AuthResponse {
  accessToken: string;
  user: Profile;
}

type BrowseParams = { category?: string; q?: string };

export const api = {
  health: (signal?: AbortSignal) =>
    request<{ status?: string }>('/health', { signal }),

  rentals: {
    products: (p: BrowseParams = {}, signal?: AbortSignal) =>
      request<Product[]>(`/rentals/products${qs(p)}`, { signal }),
    packages: (p: BrowseParams = {}, signal?: AbortSignal) =>
      request<RentalPackage[]>(`/rentals/packages${qs(p)}`, { signal }),
    businesses: (p: BrowseParams = {}, signal?: AbortSignal) =>
      request<Business[]>(`/rentals${qs(p)}`, { signal }),
  },

  auth: {
    login: (body: { email: string; password: string }) =>
      request<AuthResponse>('/auth/login', { method: 'POST', body }),
    register: (body: { fullName: string; email: string; password: string }) =>
      request<AuthResponse>('/auth/register', { method: 'POST', body }),
    me: (token: string, signal?: AbortSignal) =>
      request<Profile>('/auth/me', { token, signal }),
    // Always resolves with a neutral message, even for unknown addresses — the
    // API deliberately won't confirm whether an email has an account.
    forgotPassword: (email: string) =>
      request<{ success: boolean; message: string }>('/auth/forgot-password', {
        method: 'POST',
        body: { email: email.trim() },
      }),
    updateMe: (token: string, body: { fullName?: string; email?: string }) =>
      request<Profile>('/auth/me', { method: 'PATCH', token, body }),
  },
};
