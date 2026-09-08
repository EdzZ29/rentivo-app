import {
  Urbanist_400Regular,
  Urbanist_500Medium,
  Urbanist_600SemiBold,
  Urbanist_700Bold,
  useFonts,
} from '@expo-google-fonts/urbanist';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import SplashScreenView from '@/components/SplashScreenView';
import { AuthProvider, useAuth } from '@/lib/auth';
import { OnboardingProvider, useOnboarding } from '@/lib/onboarding';
import { RentalsProvider } from '@/lib/rentals';
import '../../global.css';

// Keep the native splash up until we've drawn our own matching one, so there's
// no white flash between the two. Must be called in the global scope.
SplashScreen.preventAutoHideAsync();

// Expo Go ships its own splash and can't be reconfigured, so calling this there
// only logs a warning on every reload. The fade matters in a real build, which
// is where it takes effect.
if (Constants.executionEnvironment !== ExecutionEnvironment.StoreClient) {
  SplashScreen.setOptions({ duration: 400, fade: true });
}

// How long the branded splash stays once the app is ready.
const SPLASH_MS = 1200;

export default function RootLayout() {
  const [ready, setReady] = useState(false);
  // Urbanist ships one file per weight, so each is registered under its own
  // family name; global.css maps the weight utilities onto them.
  const [fontsLoaded] = useFonts({
    Urbanist_400Regular,
    Urbanist_500Medium,
    Urbanist_600SemiBold,
    Urbanist_700Bold,
    // ClashDisplay, the headline face. TTF rather than the bundle's OTF:
    // Android's support for OTF is patchy.
    ClashDisplay_Semibold: require('@/assets/fonts/ClashDisplay-Semibold.ttf'),
    ClashDisplay_Bold: require('@/assets/fonts/ClashDisplay-Bold.ttf'),
  });

  useEffect(() => {
    // Hand over from the native splash to ours right away — they're identical,
    // so the cut is invisible — then hold ours briefly.
    SplashScreen.hideAsync().catch(() => {
      /* already hidden */
    });
    const timer = setTimeout(() => setReady(true), SPLASH_MS);
    return () => clearTimeout(timer);
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        {/* The providers stay mounted behind the splash, so the listings and the
            stored session are already loading while it's on screen. */}
        <AuthProvider>
          <OnboardingProvider>
            <RentalsProvider>
              <Root ready={ready && fontsLoaded} />
            </RentalsProvider>
          </OnboardingProvider>
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

// Splits out so it can read auth and the intro flag from inside their providers.
function Root({ ready }: { ready: boolean }) {
  const { user, restoring } = useAuth();
  const { dismissed } = useOnboarding();

  // Hold the splash until we know who this is. Deciding early would show the
  // intro for a beat to someone who turns out to be signed in — and the stored
  // session resolves well inside the splash hold in practice.
  if (!ready || restoring) {
    return (
      <>
        <StatusBar style="light" />
        <SplashScreenView />
      </>
    );
  }

  // A signed-in user goes straight to the tabs. The intro is for people who
  // aren't signed in, and only until they choose one of its three exits.
  const showIntro = !user && !dismissed;

  return (
    <>
      <StatusBar style="dark" />
      {/* Exactly one branch is reachable at a time, so expo-router redirects
          to it on its own — no navigate-on-mount effect, no flash. */}
      {/* Screens slide in from the right; the legal/auth pushes and the modal
          keep their own transitions below. */}
      <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
        <Stack.Protected guard={showIntro}>
          {/* The intro is a destination, not a push — fade rather than slide. */}
          <Stack.Screen name="onboarding" options={{ animation: 'fade' }} />
        </Stack.Protected>
        <Stack.Protected guard={!showIntro}>
          <Stack.Screen name="(tabs)" options={{ animation: 'fade' }} />
          <Stack.Screen name="find" options={{ presentation: 'modal' }} />
        </Stack.Protected>
        {/* Outside both guards on purpose: it has to be reachable from the
            intro (not signed in) and from the Profile tab (signed out but past
            the intro). Guarding it either way would strand one of them. */}
        <Stack.Screen name="sign-in" />
        <Stack.Screen name="profile" />
        {/* Unguarded too: registration asks you to agree to these, so they have
            to be readable before an account exists. */}
        <Stack.Screen name="legal/privacy-policy" />
        <Stack.Screen name="legal/terms-and-conditions" />
        <Stack.Screen name="legal/cookie-policy" />
        <Stack.Screen name="legal/refund-policy" />
        <Stack.Screen name="legal/form-consent" />
      </Stack>
    </>
  );
}
