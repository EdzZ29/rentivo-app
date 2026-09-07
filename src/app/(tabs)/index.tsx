import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useMemo } from 'react';
import { Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BusinessCard, PackageCard, ProductCard } from '@/components/RentalCards';
import { CardSkeletons, ErrorState } from '@/components/RentalStates';
import { CATEGORIES, categoryIcon } from '@/lib/categories';
import { useAuth } from '@/lib/auth';
import { useRentals } from '@/lib/rentals';

export default function HomeScreen() {
  const { data, loading, refreshing, error, reload, refresh, locations } = useRentals();
  const { user } = useAuth();
  const router = useRouter();

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

  const counts = useMemo(() => {
    const map: Record<string, number> = {};
    data.products.forEach((p) => {
      if (p.category) map[p.category] = (map[p.category] ?? 0) + 1;
    });
    return map;
  }, [data.products]);

  const goToRent = (params: Record<string, string> = {}) =>
    router.push({ pathname: '/rent', params });

  if (error) {
    return (
      <SafeAreaView edges={['top']} className="flex-1 bg-slate-50">
        <ErrorState message={error} onRetry={reload} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-slate-50">
      <ScrollView
        contentContainerClassName="pb-10"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refresh}
            tintColor="#56aea1"
            colors={['#56aea1']}
          />
        }
      >
        {/* Greeting + live totals straight from the API. */}
        <View className="bg-ink px-5 pb-6 pt-4">
          <Text className="text-sm text-white/70">
            {user ? `Welcome back, ${user.fullName.split(' ')[0]}` : 'Welcome to Rentivo'}
          </Text>
          <Text className="mt-1 text-2xl font-bold text-white">
            What do you need today?
          </Text>

          <Pressable
            onPress={() => router.push('/find')}
            accessibilityRole="button"
            className="mt-4 flex-row items-center gap-2 rounded-xl bg-white/15 px-4 py-3 active:bg-white/25"
          >
            <Ionicons name="location" size={18} color="#ffffff" />
            <Text className="flex-1 text-sm text-white/90">Find a rent near you</Text>
            <Ionicons name="chevron-forward" size={16} color="#ffffff" />
          </Pressable>

          <View className="mt-4 flex-row gap-3">
            <Stat label="Items" value={data.products.length} loading={loading} />
            <Stat label="Packages" value={data.packages.length} loading={loading} />
            <Stat label="Businesses" value={data.businesses.length} loading={loading} />
            <Stat label="Locations" value={locations.length} loading={loading} />
          </View>
        </View>

        {/* Categories */}
        <View className="mt-6">
          <SectionHeader title="Browse by category" />
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerClassName="gap-3 px-5"
          >
            {CATEGORIES.map((c) => (
              <Pressable
                key={c.name}
                onPress={() => goToRent({ category: c.name })}
                accessibilityRole="button"
                className="w-24 items-center gap-2 rounded-2xl border border-slate-200 bg-white p-3 active:bg-slate-50"
              >
                <View className="h-11 w-11 items-center justify-center rounded-full bg-accent/10">
                  <Ionicons name={categoryIcon(c.name)} size={20} color="#47978b" />
                </View>
                <Text className="text-center text-xs font-medium text-ink" numberOfLines={2}>
                  {c.name}
                </Text>
                <Text className="text-[10px] text-slate-400">{counts[c.name] ?? 0}</Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        {loading ? (
          <View className="mt-6 px-5">
            <CardSkeletons count={2} />
          </View>
        ) : (
          <>
            <Row
              title="Most booked"
              empty="No items published yet."
              onSeeAll={() => goToRent({ view: 'items' })}
              items={featured.map((p) => (
                <View key={p.id} className="w-64">
                  <ProductCard item={p} />
                </View>
              ))}
            />
            <Row
              title="Packages"
              empty="No packages published yet."
              onSeeAll={() => goToRent({ view: 'packages' })}
              items={deals.map((p) => (
                <View key={p.id} className="w-64">
                  <PackageCard item={p} />
                </View>
              ))}
            />
            <Row
              title="Top rated businesses"
              empty="No rated businesses yet."
              onSeeAll={() => goToRent({ view: 'businesses' })}
              items={topRated.map((b) => (
                <View key={b.id} className="w-64">
                  <BusinessCard item={b} />
                </View>
              ))}
            />
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function Stat({
  label,
  value,
  loading,
}: {
  label: string;
  value: number;
  loading: boolean;
}) {
  return (
    <View className="flex-1 rounded-xl bg-white/10 px-2 py-2.5">
      <Text className="text-lg font-bold text-white">{loading ? '—' : value}</Text>
      <Text className="text-[10px] text-white/70">{label}</Text>
    </View>
  );
}

function SectionHeader({ title, onSeeAll }: { title: string; onSeeAll?: () => void }) {
  return (
    <View className="mb-3 flex-row items-center justify-between px-5">
      <Text className="text-base font-semibold text-ink">{title}</Text>
      {onSeeAll && (
        <Pressable onPress={onSeeAll} accessibilityRole="button" hitSlop={8}>
          <Text className="text-xs font-semibold text-accent-dark">See all</Text>
        </Pressable>
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
        <Text className="px-5 text-sm text-slate-400">{empty}</Text>
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
