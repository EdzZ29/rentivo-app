import * as Location from 'expo-location';
import { useCallback, useEffect, useRef, useState } from 'react';

export type LocationStatus = 'locating' | 'ready' | 'denied' | 'unavailable';

interface CurrentLocation {
  status: LocationStatus;
  /** "Makati, Metro Manila" — city and region, whichever the geocoder returns. */
  label: string | null;
  /** Only needed to recover from a refusal or a failed lookup. */
  retry: () => void;
}

/** Build the friendliest label the reverse geocode result supports. */
function labelFor(place: Location.LocationGeocodedAddress): string | null {
  const locality = place.city ?? place.subregion ?? place.district ?? null;
  const region = place.region ?? place.country ?? null;
  if (locality && region && locality !== region) return `${locality}, ${region}`;
  return locality ?? region ?? null;
}

// Only re-read the place name once the device has actually moved somewhere
// else. Reverse geocoding on every raw position update would be wasteful and
// makes the label flicker between equivalent names.
const MOVED_METERS = 500;
const MIN_INTERVAL_MS = 30_000;

/**
 * Where the user is, as a readable place name, kept current on its own.
 *
 * After the first fix this subscribes to position updates, so moving to another
 * city updates the label without the user doing anything — no manual refresh.
 * Permission is requested on mount; declining is a normal outcome rather than
 * an error, so it gets its own status and a way back in.
 *
 * Nothing is sent anywhere: coordinates are reverse-geocoded and then dropped,
 * and only the place name is kept.
 */
export function useCurrentLocation(): CurrentLocation {
  const [status, setStatus] = useState<LocationStatus>('locating');
  const [label, setLabel] = useState<string | null>(null);
  const cancelled = useRef(false);
  const watch = useRef<Location.LocationSubscription | null>(null);

  const load = useCallback(async () => {
    setStatus('locating');

    try {
      const { granted } = await Location.requestForegroundPermissionsAsync();
      if (cancelled.current) return;
      if (!granted) {
        setStatus('denied');
        return;
      }

      const apply = async (coords: Location.LocationObjectCoords) => {
        const [place] = await Location.reverseGeocodeAsync({
          latitude: coords.latitude,
          longitude: coords.longitude,
        });
        if (cancelled.current) return;

        const name = place ? labelFor(place) : null;
        if (name) {
          // Skip identical names so the row doesn't re-render as you move
          // around within the same city.
          setLabel((prev) => (prev === name ? prev : name));
          setStatus('ready');
        } else {
          setStatus((prev) => (prev === 'ready' ? prev : 'unavailable'));
        }
      };

      // Balanced accuracy: a city name doesn't need a GPS fix, and asking for
      // one costs battery and several seconds.
      const first = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      if (cancelled.current) return;
      await apply(first.coords);
      if (cancelled.current) return;

      // Then keep it current by itself.
      watch.current?.remove();
      watch.current = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.Balanced,
          distanceInterval: MOVED_METERS,
          timeInterval: MIN_INTERVAL_MS,
        },
        (position) => {
          void apply(position.coords);
        },
      );
    } catch {
      if (!cancelled.current) setStatus('unavailable');
    }
  }, []);

  useEffect(() => {
    cancelled.current = false;
    void load();

    return () => {
      cancelled.current = true;
      watch.current?.remove();
      watch.current = null;
    };
  }, [load]);

  const retry = useCallback(() => void load(), [load]);

  return { status, label, retry };
}
