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
import {
  api,
  ApiError,
  type Business,
  type Product,
  type RentalPackage,
} from './api';

export interface RentalsData {
  products: Product[];
  packages: RentalPackage[];
  businesses: Business[];
}

const EMPTY: RentalsData = { products: [], packages: [], businesses: [] };

interface RentalsValue {
  data: RentalsData;
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  reload: () => void;
  refresh: () => void;
  /** Every distinct location across all three datasets, sorted. */
  locations: string[];
}

const RentalsContext = createContext<RentalsValue | null>(null);

/**
 * Loads every public listing — items, packages and businesses — once, and
 * shares it across the tabs. Home, Rent and the location picker all read the
 * same three endpoints, so fetching per-screen would triple the traffic for
 * identical data.
 *
 * Each endpoint settles independently: if packages happen to fail, the items
 * that did load are still shown. `error` is only set when nothing came back at
 * all, which is the case that actually warrants taking over the screen.
 */
export function RentalsProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<RentalsData>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inFlight = useRef<AbortController | null>(null);

  const load = useCallback(async (mode: 'initial' | 'refresh') => {
    inFlight.current?.abort();
    const controller = new AbortController();
    inFlight.current = controller;

    if (mode === 'refresh') setRefreshing(true);
    else setLoading(true);

    const settled = await Promise.allSettled([
      api.rentals.products({}, controller.signal),
      api.rentals.packages({}, controller.signal),
      api.rentals.businesses({}, controller.signal),
    ]);

    // A newer load (or an unmount) superseded this one — drop the result.
    if (controller.signal.aborted) return;

    const [products, packages, businesses] = settled;
    const value = <T,>(r: PromiseSettledResult<T[]>): T[] =>
      r.status === 'fulfilled' ? r.value : [];

    if (settled.every((r) => r.status === 'rejected')) {
      const reason: unknown = (settled[0] as PromiseRejectedResult).reason;
      setError(
        reason instanceof ApiError || reason instanceof Error
          ? reason.message
          : 'Something went wrong loading rentals.',
      );
      setData(EMPTY);
    } else {
      setError(null);
      setData({
        products: value(products),
        packages: value(packages),
        businesses: value(businesses),
      });
    }

    setLoading(false);
    setRefreshing(false);
    inFlight.current = null;
  }, []);

  useEffect(() => {
    void load('initial');
    return () => inFlight.current?.abort();
  }, [load]);

  const reload = useCallback(() => void load('initial'), [load]);
  const refresh = useCallback(() => void load('refresh'), [load]);

  const locations = useMemo(() => {
    const set = new Set<string>();
    [...data.products, ...data.packages, ...data.businesses].forEach((row) => {
      if (row.location) set.add(row.location);
    });
    return [...set].sort((a, b) => a.localeCompare(b));
  }, [data]);

  const value = useMemo(
    () => ({ data, loading, refreshing, error, reload, refresh, locations }),
    [data, loading, refreshing, error, reload, refresh, locations],
  );

  return <RentalsContext.Provider value={value}>{children}</RentalsContext.Provider>;
}

export function useRentals(): RentalsValue {
  const ctx = useContext(RentalsContext);
  if (!ctx) throw new Error('useRentals must be used inside <RentalsProvider>');
  return ctx;
}
