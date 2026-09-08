import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { useRouter, type Href } from 'expo-router';
import { useState, type ComponentProps, type ReactNode } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  Share,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { DURATION, stagger } from '@/lib/motion';
import PressableScale from '@/components/motion/PressableScale';
import { useAuth } from '@/lib/auth';

type IconName = ComponentProps<typeof Ionicons>['name'];

const invite = () =>
  Share.share({
    message:
      'Rent almost anything on Rentivo — vehicles, event gear, cameras and more. Take a look!',
  }).catch(() => {
    /* the sheet was dismissed */
  });

export default function AccountScreen() {
  const { user, restoring, signOut, refresh } = useAuth();
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  const insets = useSafeAreaInsets();

  // Re-reads GET /auth/me, so a profile edited elsewhere shows up here.
  const onRefresh = async () => {
    if (!user) return;
    setRefreshing(true);
    try {
      await refresh();
    } catch {
      /* keep showing the profile we already have */
    } finally {
      setRefreshing(false);
    }
  };

  if (restoring) {
    return (
      <View className="flex-1 items-center justify-center bg-surface">
        <ActivityIndicator color="#006e59" />
      </View>
    );
  }

  const isOwner = user?.role === 'owner' || user?.role === 'admin';

  return (
    <View className="flex-1 bg-surface">
      {/* Title bar with the settings shortcut, as on the reference. */}
      <StatusBar style="dark" />
      {/* Title bar carries the status-bar inset so its white runs behind it. */}
      <View
        style={{ paddingTop: insets.top + 10 }}
        className="flex-row items-center justify-between border-b border-slate-200 bg-white px-5 pb-3"
      >
        <Text className="text-2xl font-bold text-ink">Account</Text>
        <PressableScale
          onPress={() => router.push('/settings')}
          accessibilityRole="button"
          accessibilityLabel="Settings"
          hitSlop={10}
        >
          <Ionicons name="settings-outline" size={24} color="#006e59" />
        </PressableScale>
      </View>

      <ScrollView
        contentContainerClassName="pb-6"
        refreshControl={
          user ? (
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#006e59" />
          ) : undefined
        }
      >
        {user ? (
          <View className="bg-slate-100 px-5 pb-7 pt-6">
            <Text className="text-3xl font-bold text-ink" numberOfLines={1}>
              {user.fullName}
            </Text>
            <PressableScale
              onPress={() => router.push('/profile')}
              accessibilityRole="button"
              hitSlop={6}
              className="mt-1 flex-row items-center gap-1 self-start"
            >
              <Text className="text-base font-bold text-ink">View profile</Text>
              <Ionicons name="chevron-forward" size={15} color="#006e59" />
            </PressableScale>

            {/* Promo banner — role-aware copy, but always a destination that
                actually exists rather than a decorative "Learn more". */}
            <PressableScale
              onPress={() => router.push(isOwner ? '/rent' : '/find')}
              accessibilityRole="button"
              className="mt-6 overflow-hidden rounded-2xl"
            >
              <LinearGradient
                colors={['#006e59', '#006e59']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{ padding: 20 }}
              >
                <View className="flex-row items-center">
                  <View className="flex-1 pr-3">
                    <Text className="text-xl font-bold leading-7 text-white">
                      {isOwner
                        ? 'Reach more customers with the Marketplace Plan'
                        : 'Rent almost anything, near you'}
                    </Text>
                    <View className="mt-3 flex-row items-center gap-1.5">
                      <Text className="text-sm font-bold text-white">Learn more</Text>
                      <View className="h-5 w-5 items-center justify-center rounded-full bg-white/25">
                        <Ionicons name="chevron-forward" size={12} color="#ffffff" />
                      </View>
                    </View>
                  </View>
                  <Ionicons
                    name={isOwner ? 'storefront-outline' : 'pricetags-outline'}
                    size={54}
                    color="rgba(255,255,255,0.35)"
                  />
                </View>
              </LinearGradient>
            </PressableScale>

            {/* Quick shortcuts to the app's three main destinations. */}
            <View className="mt-4 flex-row gap-3">
              <Tile icon="pricetags-outline" label="Rentals" href="/rent" />
              <Tile icon="location-outline" label="Nearby" href="/find" />
              <Tile icon="options-outline" label="Settings" href="/settings" />
            </View>

            {/* Stands in for the reference's Wallet block, using the plan the
                API actually returns rather than inventing a balance. */}
            <Text className="mb-2 mt-7 text-xl font-bold text-ink">Plan</Text>
            <View className="flex-row items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-4">
              <View className="h-10 w-10 items-center justify-center rounded-xl bg-brand/10">
                <Ionicons name="card-outline" size={20} color="#006e59" />
              </View>
              <Text className="flex-1 text-base font-bold capitalize text-ink">
                {user.plan && user.plan !== 'none' ? user.plan : 'No plan'}
              </Text>
              <Text className="text-sm capitalize text-slate-500">{user.role}</Text>
            </View>
          </View>
        ) : (
          <SignInPrompt />
        )}

        <Section title="Perks for you" index={0}>
          {!user && (
            <Row
              icon="ribbon-outline"
              label="Become an owner"
              onPress={() => router.push('/sign-in?mode=register')}
            />
          )}
          <Row icon="gift-outline" label="Invite friends" onPress={() => void invite()} last />
        </Section>

        <Section title="General" index={1}>
          <Row
            icon="pricetags-outline"
            label="Browse all rentals"
            onPress={() => router.push('/rent')}
          />
          <Row
            icon="location-outline"
            label="Find a rent nearby"
            onPress={() => router.push('/find')}
          />
          <Row
            icon="settings-outline"
            label="App settings"
            onPress={() => router.push('/settings')}
            last
          />
        </Section>

        <Section title="Legal" index={2}>
          <Row
            icon="shield-checkmark-outline"
            label="Privacy Policy"
            onPress={() => router.push('/legal/privacy-policy')}
          />
          <Row
            icon="document-text-outline"
            label="Terms and Conditions"
            onPress={() => router.push('/legal/terms-and-conditions')}
          />
          <Row
            icon="cafe-outline"
            label="Cookie Policy"
            onPress={() => router.push('/legal/cookie-policy')}
          />
          <Row
            icon="cash-outline"
            label="Refund Policy"
            onPress={() => router.push('/legal/refund-policy')}
          />
          <Row
            icon="checkbox-outline"
            label="Form Consent"
            onPress={() => router.push('/legal/form-consent')}
            last
          />
        </Section>

        {user && (
          <View className="px-5 pt-7">
            <PressableScale
              onPress={() => void signOut()}
              accessibilityRole="button"
              className="h-14 items-center justify-center rounded-2xl border border-slate-400 bg-white active:bg-slate-100"
            >
              <Text className="text-base font-bold text-ink">Log out</Text>
            </PressableScale>
          </View>
        )}

        {/* Footer lockup + build, matching the reference's closing block. */}
        <View className="mt-7 items-center bg-slate-100 px-5 py-7">
          <View className="flex-row items-center gap-2">
            <Image
              source={require('@/assets/images/logo-green.png')}
              style={{ width: 26, height: 26 }}
              contentFit="contain"
            />
            <Text className="text-xl font-bold text-ink">
              Rentiv<Text className="text-brand">o</Text>
            </Text>
          </View>
          <Text className="mt-2 text-xs text-slate-400">
            Version {Constants.expoConfig?.version ?? '1.0.0'}
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

// Signed out: the pitch plus the one action that matters.
function SignInPrompt() {
  const router = useRouter();
  return (
    <View className="bg-slate-100 px-5 py-6">
      <Text className="text-xl font-bold leading-7 text-ink">
        Sign in to book faster and keep track of your rentals.
      </Text>
      <PressableScale
        onPress={() => router.push('/sign-in')}
        accessibilityRole="button"
        className="mt-5 h-14 items-center justify-center rounded-2xl bg-brand active:bg-brand-dark"
      >
        <Text className="text-base font-bold text-white">Sign up or Log in</Text>
      </PressableScale>
    </View>
  );
}

function Tile({ icon, label, href }: { icon: IconName; label: string; href: Href }) {
  const router = useRouter();
  return (
    <PressableScale
      onPress={() => router.push(href)}
      accessibilityRole="button"
      wrapperStyle={{ flex: 1 }}
      className="flex-1 items-center gap-2 rounded-2xl border border-slate-200 bg-white py-4 active:bg-slate-50"
    >
      <Ionicons name={icon} size={24} color="#006e59" />
      <Text className="text-sm text-ink">{label}</Text>
    </PressableScale>
  );
}

// ── List primitives ───────────────────────────────────────────────────────

function Section({
  title,
  index = 0,
  children,
}: {
  title: string;
  /** Position in the page, so sections arrive one after another. */
  index?: number;
  children: ReactNode;
}) {
  const delay = stagger(index);
  return (
    <Animated.View
      entering={FadeInDown.duration(DURATION.base).delay(delay)}
      style={{ marginTop: 24 }}
    >
      <Text className="mb-2 px-5 text-lg font-bold text-ink">{title}</Text>
      <View className="border-y border-slate-200 bg-white">{children}</View>
    </Animated.View>
  );
}

function Row({
  icon,
  label,
  onPress,
  last,
}: {
  icon: IconName;
  label: string;
  onPress: () => void;
  last?: boolean;
}) {
  return (
    <PressableScale
      onPress={onPress}
      accessibilityRole="button"
      className={`flex-row items-center gap-4 px-5 py-4 active:bg-slate-50 ${
        last ? '' : 'border-b border-slate-100'
      }`}
    >
      <Ionicons name={icon} size={22} color="#006e59" />
      <Text className="flex-1 text-base text-ink">{label}</Text>
      <Ionicons name="chevron-forward" size={18} color="#cbd5e1" />
    </PressableScale>
  );
}
