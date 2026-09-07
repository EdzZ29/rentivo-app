import * as Location from 'expo-location';
import { useCallback, useEffect, useRef, useState } from 'react';

export type LocationStatus = 'locating' | 'ready' | 'denied' | 'unavailable';

interface CurrentLocation {
  status: LocationStatus;
  /** "Makati, Metro Manila" — city and region, whichever the geocoder returns. */
  label: string | null;
  retry: () => void;
}

/** Build the friendliest label the reverse geocode result supports. */
function labelFor(place: Location.LocationGeocodedAddress): string | null {
  const locality = place.city ?? place.subregion ?? place.district ?? null;
  const region = place.region ?? place.country ?? null;
  if (locality && region && locality !== region) return `${locality}, ${region}`;
  return locality ?? region ?? null;
}

/**
 * Where the user is, as a readable place name.
 *
 * Permission is requested on mount — declining is a normal outcome, not an
 * error, so it gets its own status and the caller can offer a way back in.
 * Nothing here is sent anywhere: the coordinates are reverse-geocoded and then
 * dropped, and only the place name is kept.
 */
export function useCurrentLocation(): CurrentLocation {
  const [status, setStatus] = useState<LocationStatus>('locating');
  const [label, setLabel] = useState<string | null>(null);
  const cancelled = useRef(false);

  const load = useCallback(async () => {
    setStatus('locating');
    setLabel(null);
    try {
      const { granted } = await Location.requestForegroundPermissionsAsync();
      if (cancelled.current) return;
      if (!granted) {
        setStatus('denied');
        return;
      }

      // Balanced accuracy: a city name doesn't need a GPS fix, and asking for
      // one costs battery and several seconds.
      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      if (cancelled.current) return;

      const [place] = await Location.reverseGeocodeAsync({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      });
      if (cancelled.current) return;

      const name = place ? labelFor(place) : null;
      if (name) {
        setLabel(name);
        setStatus('ready');
      } else {
        // A fix with no matching address still isn't something to show.
        setStatus('unavailable');
      }
    } catch {
      if (!cancelled.current) setStatus('unavailable');
    }
  }, []);

  useEffect(() => {
    cancelled.current = false;
    void load();
    return () => {
      cancelled.current = true;
    };
  }, [load]);

  const retry = useCallback(() => void load(), [load]);

  return { status, label, retry };
}
