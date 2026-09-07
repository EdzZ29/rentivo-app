import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { EmptyState, ErrorState } from '@/components/RentalStates';
import { cityOf } from '@/lib/format';
import { useRentals } from '@/lib/rentals';

/**
 * "Find a rent" — the centre action in the tab bar.
 *
 * Locations aren't a backend resource of their own; owners type them as free
 * text on a business. So the list here is derived from the listings already
 * loaded, along with a count of what's actually available in each place.
 */
export default function FindScreen() {
  const { data, loading, error, reload, locations } = useRentals();
  const router = useRouter();
  const [query, setQuery] = useState('');

  const rows = useMemo(() => {
    const counts: Record<string, { items: number; packages: number; businesses: number }> = {};
    const bump = (loc: string | null, key: 'items' | 'packages' | 'businesses') => {
      if (!loc) return;
      counts[loc] ??= { items: 0, packages: 0, businesses: 0 };
      counts[loc][key] += 1;
    };
    data.products.forEach((p) => bump(p.location, 'items'));
    data.packages.forEach((p) => bump(p.location, 'packages'));
    data.businesses.forEach((b) => bump(b.location, 'businesses'));

    const q = query.trim().toLowerCase();
    return locations
      .filter((l) => !q || l.toLowerCase().includes(q))
      .map((l) => ({ location: l, ...(counts[l] ?? { items: 0, packages: 0, businesses: 0 }) }));
  }, [data, locations, query]);

  const pick = (location: string) => {
    // Replace rather than push: the picker shouldn't sit in the back stack
    // between the tab bar and the results.
    router.replace({ pathname: '/rent', params: location ? { location } : {} });
  };

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-white">
      <View className="flex-row items-center gap-3 px-5 pb-3 pt-2">
        <Pressable
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Close"
          hitSlop={8}
          className="h-9 w-9 items-center justify-center rounded-full bg-slate-100"
        >
          <Ionicons name="close" size={18} color="#135776" />
        </Pressable>
        <View className="flex-1">
          <Text className="text-lg font-bold text-ink">Find a rent</Text>
          <Text className="text-xs text-slate-500">Pick a location to browse</Text>
        </View>
      </View>

      <View className="mx-5 flex-row items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3">
        <Ionicons name="search" size={18} color="#94a3b8" />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search a city or area…"
          placeholderTextColor="#94a3b8"
          autoCorrect={false}
          className="flex-1 py-3 text-sm text-ink"
        />
        {query.length > 0 && (
          <Pressable onPress={() => setQuery('')} hitSlop={8} accessibilityLabel="Clear">
            <Ionicons name="close-circle" size={18} color="#cbd5e1" />
          </Pressable>
        )}
      </View>

      {error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : (
        <ScrollView contentContainerClassName="px-5 pb-10 pt-4" keyboardShouldPersistTaps="handled">
          <Pressable
            onPress={() => pick('')}
            accessibilityRole="button"
            className="mb-3 flex-row items-center gap-3 rounded-2xl border border-accent bg-accent/10 p-4 active:bg-accent/20"
          >
            <Ionicons name="globe-outline" size={20} color="#47978b" />
            <View className="flex-1">
              <Text className="text-sm font-semibold text-accent-dark">Anywhere</Text>
              <Text className="text-xs text-slate-500">Browse every location</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#47978b" />
          </Pressable>

          {loading ? (
            <Text className="py-10 text-center text-sm text-slate-400">Loading locations…</Text>
          ) : rows.length === 0 ? (
            <EmptyState
              message={
                locations.length === 0
                  ? 'No locations yet — no rentals have been published.'
                  : 'No location matched that search.'
              }
            />
          ) : (
            rows.map((row) => (
              <Pressable
                key={row.location}
                onPress={() => pick(row.location)}
                accessibilityRole="button"
                className="mb-3 flex-row items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 active:bg-slate-50"
              >
                <View className="h-10 w-10 items-center justify-center rounded-full bg-accent/10">
                  <Ionicons name="location" size={18} color="#47978b" />
                </View>
                <View className="flex-1">
                  <Text className="text-sm font-semibold text-ink">{cityOf(row.location)}</Text>
                  <Text className="text-xs text-slate-500" numberOfLines={1}>
                    {row.location}
                  </Text>
                  <Text className="mt-0.5 text-xs text-slate-400">
                    {row.items} item{row.items === 1 ? '' : 's'} · {row.packages} package
                    {row.packages === 1 ? '' : 's'} · {row.businesses} business
                    {row.businesses === 1 ? '' : 'es'}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color="#cbd5e1" />
              </Pressable>
            ))
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
