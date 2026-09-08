import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useMemo } from 'react';
import { Linking, RefreshControl, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { DURATION, stagger } from '@/lib/motion';
import PressableScale from '@/components/motion/PressableScale';
import { BusinessCard, PackageCard, ProductCard } from '@/components/RentalCards';
import Marquee from '@/components/Marquee';
import { ErrorState } from '@/components/RentalStates';
import { HomeSkeleton } from '@/components/Skeleton';
import { CATEGORIES, categoryIcon } from '@/lib/categories';
import { useRentals } from '@/lib/rentals';
import { useCurrentLocation } from '@/lib/useCurrentLocation';

// Ticker copy. Kept to things the app actually does — browsing, comparing and
// booking against real listings — rather than claims nothing here can back up.
const TICKER = [
  'Browse vehicles, event gear, cameras and more',
  'Book directly with local rental businesses',
  'Compare prices and ratings',
  'Rent by the day',
  'Find rentals near you',
];

export default function HomeScreen() {
  const { data, loading, refreshing, error, reload, refresh } = useRentals();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // Everything on this screen is a slice of the same three listings the Rent
  // tab shows — no extra requests.
  const featured = useMemo(
    () => [...data.products].sort((a, b) => (b.bookings ?? 0) - (a.bookings ?? 0)).slice(0, 5),
    [data.products],
  );
  const topRated = useMemo(
    () =>
      [...data.businesses]
        .filter((b) => b.reviewCount > 0)
        .sort((a, b) => b.rating - a.rating)
        .slice(0, 5),
    [data.businesses],
  );
  const deals = useMemo(() => data.packages.slice(0, 5), [data.packages]);

  const goToRent = (params: Record<string, string> = {}) =>
    router.push({ pathname: '/rent', params });

  if (error) {
    return (
      <View style={{ paddingTop: insets.top }} className="flex-1 bg-surface">
        <ErrorState message={error} onRetry={reload} />
      </View>
    );
  }

  return (
    // No SafeAreaView frame: the hero's colour runs edge to edge and behind the
    // status bar, and the inset is applied to the content inside it instead.
    <View className="flex-1 bg-surface">
      <StatusBar style="light" />
      <ScrollView
        contentContainerClassName="pb-10"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refresh}
            tintColor="#006e59"
            colors={['#006e59']}
          />
        }
      >
        <View className="bg-ink px-5 pb-6" style={{ paddingTop: insets.top + 14 }}>
          <LocationBar />

          <Text className="mt-5 text-2xl font-display-bold text-white">
            What do you need today?
          </Text>

          <PressableScale
            onPress={() => router.push('/find')}
            accessibilityRole="button"
            className="mt-4 flex-row items-center gap-2 rounded-xl bg-white/15 px-4 py-3 active:bg-white/25"
          >
            <Ionicons name="location" size={18} color="#ffffff" />
            <Text className="font-sans flex-1 text-sm text-white/90">Find a rent near you</Text>
            <Ionicons name="chevron-forward" size={16} color="#ffffff" />
          </PressableScale>

        </View>

        <Marquee items={TICKER} />

        {/* Categories */}
        <View className="mt-6">
          <SectionHeader title="Browse by category" onSeeAll={() => goToRent()} />
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerClassName="gap-3 px-5"
          >
            {CATEGORIES.map((c, i) => (
              <PressableScale
                key={c.name}
                entering={FadeInDown.duration(DURATION.base).delay(stagger(i))}
                onPress={() => goToRent({ category: c.name })}
                accessibilityRole="button"
                className="w-[76px] items-center"
              >
                {/* Fixed square, and a fixed-height label box below it, so every
                    tile is identical whether its name wraps to one line or two.

                    A photograph where the category has one, the glyph on a brand
                    wash where it doesn't — the wash stays behind the image as
                    the placeholder while it decodes, so the row never flashes
                    empty squares. */}
                <View className="h-[76px] w-[76px] items-center justify-center overflow-hidden rounded-2xl border border-black/5 bg-brand/10">
                  {c.image ? (
                    <Image
                      source={c.image}
                      style={{ width: '100%', height: '100%' }}
                      contentFit="cover"
                      transition={200}
                    />
                  ) : (
                    <Ionicons name={categoryIcon(c.name)} size={30} color="#006e59" />
                  )}
                </View>
                <Text
                  style={{ height: 30 }}
                  className="mt-2 text-center text-[11px] font-medium leading-[15px] text-ink"
                  numberOfLines={2}
                >
                  {c.name}
                </Text>
              </PressableScale>
            ))}
          </ScrollView>
        </View>

        {loading ? (
          <HomeSkeleton />
        ) : (
          <>
            <Row
              title="Most booked"
              empty="No items published yet."
              onSeeAll={() => goToRent({ view: 'items' })}
              items={featured.map((p, i) => (
                <Animated.View
                  key={p.id}
                  entering={FadeInDown.duration(DURATION.base).delay(stagger(i))}
                  style={{ width: 256 }}
                >
                  <ProductCard item={p} />
                </Animated.View>
              ))}
            />
            <Row
              title="Packages"
              empty="No packages published yet."
              onSeeAll={() => goToRent({ view: 'packages' })}
              items={deals.map((p, i) => (
                <Animated.View
                  key={p.id}
                  entering={FadeInDown.duration(DURATION.base).delay(stagger(i))}
                  style={{ width: 256 }}
                >
                  <PackageCard item={p} />
                </Animated.View>
              ))}
            />
            <Row
              title="Top rated businesses"
              empty="No rated businesses yet."
              onSeeAll={() => goToRent({ view: 'businesses' })}
              items={topRated.map((b, i) => (
                <Animated.View
                  key={b.id}
                  entering={FadeInDown.duration(DURATION.base).delay(stagger(i))}
                  style={{ width: 256 }}
                >
                  <BusinessCard item={b} />
                </Animated.View>
              ))}
            />
          </>
        )}
      </ScrollView>
    </View>
  );
}

/**
 * Where the user is.
 *
 * Once a place is known this is plain text with nothing to tap — the hook keeps
 * it current on its own as the device moves, so there's no refresh to offer.
 * It only becomes actionable when something needs fixing: declining permission
 * is a normal outcome, and tapping then opens the OS settings, since a second
 * in-app prompt won't be shown once it's been refused.
 */
/**
 * The marker beside the location text.
 *
 * White on a translucent chip, not the brand colour: the hero's background IS
 * the brand colour now, so a green icon on it was invisible.
 */
function LocationPin({ filled }: { filled: boolean }) {
  return (
    <View className="h-9 w-9 items-center justify-center rounded-full bg-white/15">
      <Ionicons
        name={filled ? 'location' : 'location-outline'}
        size={18}
        color="#ffffff"
      />
    </View>
  );
}

// Module scope, not defined inside LocationBar: a component declared during
// render is a new type every time, which remounts its children on each pass.
function LocationRow({
  filled,
  children,
  trailing,
}: {
  filled: boolean;
  children: React.ReactNode;
  trailing?: React.ReactNode;
}) {
  return (
    <View className="flex-row items-center gap-3">
      <LocationPin filled={filled} />
      <View className="flex-1">
        <Text className="font-sans text-[11px] uppercase tracking-wider text-white/50">
          Your location
        </Text>
        {children}
      </View>
      {trailing}
    </View>
  );
}

function LocationBar() {
  const { status, label, retry } = useCurrentLocation();

  if (status === 'ready') {
    return (
      <LocationRow filled>
        <Text className="text-[15px] font-semibold text-white" numberOfLines={1}>
          {label}
        </Text>
      </LocationRow>
    );
  }

  if (status === 'locating') {
    return (
      <LocationRow filled={false}>
        <Text className="text-[15px] font-semibold text-white/70">
          Finding your location…
        </Text>
      </LocationRow>
    );
  }

  // Denied or unavailable — the only states worth a tap.
  return (
    <PressableScale
      onPress={() => (status === 'denied' ? void Linking.openSettings() : retry())}
      accessibilityRole="button"
      accessibilityLabel="Set your location"
    >
      <LocationRow
        filled={false}
        trailing={
          <Ionicons name="chevron-forward" size={16} color="rgba(255,255,255,0.6)" />
        }
      >
        <Text className="text-[15px] font-semibold text-white" numberOfLines={1}>
          {status === 'denied' ? 'Turn on location' : 'Location unavailable'}
        </Text>
      </LocationRow>
    </PressableScale>
  );
}

function SectionHeader({ title, onSeeAll }: { title: string; onSeeAll?: () => void }) {
  return (
    <View className="mb-3 flex-row items-center justify-between px-5">
      <Text className="text-base font-semibold text-ink">{title}</Text>
      {onSeeAll && (
        <PressableScale onPress={onSeeAll} accessibilityRole="button" hitSlop={8}>
          <Text className="text-xs font-semibold text-brand">See All</Text>
        </PressableScale>
      )}
    </View>
  );
}

// A horizontally scrolling shelf, or a one-line note when the API returned
// nothing for it.
function Row({
  title,
  items,
  empty,
  onSeeAll,
}: {
  title: string;
  items: React.ReactNode[];
  empty: string;
  onSeeAll: () => void;
}) {
  return (
    <View className="mt-6">
      <SectionHeader title={title} onSeeAll={items.length > 0 ? onSeeAll : undefined} />
      {items.length === 0 ? (
        <Text className="font-sans px-5 text-sm text-slate-400">{empty}</Text>
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerClassName="gap-3 px-5"
        >
          {items}
        </ScrollView>
      )}
    </View>
  );
}
