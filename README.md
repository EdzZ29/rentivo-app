# Rentivo — mobile app

The Expo (React Native) client for Rentivo. It shares the Rentivo API with the
web app in `../rentflow-frontend`, and styling is Tailwind-in-React-Native via
Nativewind.

## Get started

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the API (in `../rentflow-backend`)

   ```bash
   npm run start:dev
   ```

3. Start the app

   ```bash
   npx expo start
   ```

Open it in an [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/),
an [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/), a
[development build](https://docs.expo.dev/develop/development-builds/introduction/),
or [Expo Go](https://expo.dev/go).

## Pointing the app at the API

`src/lib/api.ts` resolves the base URL in this order:

1. `EXPO_PUBLIC_API_URL`, if set — needed for staging/production builds.
2. The host Metro is served from, so a phone on the same Wi-Fi reaches the dev
   machine at its LAN IP rather than at its own `localhost`.
3. `10.0.2.2` on the Android emulator, `localhost` everywhere else.

See `.env.example`. Nothing needs setting for ordinary local development.

## Layout

- `src/app/(tabs)/` — the four tabs: Home, Rent, Settings, Profile.
- `src/app/find.tsx` — the "Find a rent" location picker, opened by the raised
  centre button in the tab bar.
- `src/components/` — shared UI (cards, loading/empty/error states).
- `src/lib/` — API client, auth context, shared rentals store, formatting.
- `global.css` — the Tailwind v4 theme. Nativewind v5 is configured in CSS, so
  there is no `tailwind.config.js`.

All four tabs read one shared fetch of `/rentals`, `/rentals/products` and
`/rentals/packages` (`RentalsProvider`), so switching tabs costs no extra
requests. Profile signs in against `POST /auth/login` and keeps the JWT in
`expo-secure-store`, sending it as `Authorization: Bearer …` — the API's
mobile auth path (`JwtStrategy` falls back to the Bearer header when there's
no cookie).

## Checks

```bash
npx tsc --noEmit   # types
npm run lint       # eslint
npx expo-doctor    # dependency / config health
```
