import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  FlatList,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  BusinessCard,
  PackageCard,
  ProductCard,
  type Layout,
} from '@/components/RentalCards';
import { CardSkeletons, EmptyState, ErrorState } from '@/components/RentalStates';
import type { Business, Product, RentalPackage } from '@/lib/api';
import { CATEGORIES, categoryIcon } from '@/lib/categories';
import { cityOf } from '@/lib/format';
import { useRentals } from '@/lib/rentals';

type View3 = 'items' | 'packages' | 'businesses';
type Row = Product | RentalPackage | Business;

const VIEWS: { key: View3; label: string }[] = [
  { key: 'items', label: 'Items' },
  { key: 'packages', label: 'Packages' },
  { key: 'businesses', label: 'Businesses' },
];

// Sort options per view — items and packages share the price sorts, businesses
// have no price to sort on. Mirrors the website's browse page.
const SORTS: Record<View3, { key: string; label: string }[]> = {
  items: [
    { key: 'popular', label: 'Most popular' },
    { key: 'price_asc', label: 'Price: Low to High' },
    { key: 'price_desc', label: 'Price: High to Low' },
    { key: 'newest', label: 'Newest' },
    { key: 'name', label: 'Name A–Z' },
  ],
  packages: [
    { key: 'newest', label: 'Newest' },
    { key: 'price_asc', label: 'Price: Low to High' },
    { key: 'price_desc', label: 'Price: High to Low' },
    { key: 'name', label: 'Name A–Z' },
  ],
  businesses: [
    { key: 'newest', label: 'Newest' },
    { key: 'name', label: 'Name A–Z' },
  ],
};

const ALL_LABEL: Record<View3, string> = {
  items: 'All rentals',
  packages: 'All packages',
  businesses: 'All businesses',
};

const LAYOUTS: { key: Layout; icon: 'grid-outline' | 'apps-outline' | 'list-outline' }[] = [
  { key: 'grid', icon: 'grid-outline' },
  { key: 'compact', icon: 'apps-outline' },
  { key: 'list', icon: 'list-outline' },
];

const priceOf = (view: View3, row: Row): number =>
  view === 'items'
    ? Number((row as Product).pricePerDay) || 0
    : Number((row as RentalPackage).price) || 0;

export default function RentScreen() {
  const { data, loading, refreshing, error, reload, refresh, locations } = useRentals();
  // The centre "Find a rent" button and the Home shortcuts navigate here with a
  // location and/or category already chosen.
  const params = useLocalSearchParams<{ location?: string; category?: string; view?: string }>();

  const [view, setView] = useState<View3>('items');
  const [category, setCategory] = useState('');
  const [location, setLocation] = useState('');
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('popular');
  const [layout, setLayout] = useState<Layout>('grid');
  const [sortOpen, setSortOpen] = useState(false);
  const [locationOpen, setLocationOpen] = useState(false);

  // Adopt whatever the incoming link asked for. Keyed on the raw params so
  // arriving again with a different location re-applies it.
  useEffect(() => {
    if (params.location !== undefined) setLocation(params.location);
    if (params.category !== undefined) setCategory(params.category);
    if (params.view && VIEWS.some((v) => v.key === params.view)) {
      setView(params.view as View3);
    }
  }, [params.location, params.category, params.view]);

  const dataset: Row[] =
    view === 'items' ? data.products : view === 'packages' ? data.packages : data.businesses;

  const changeView = (next: View3) => {
    if (next === view) return;
    setView(next);
    setSort(next === 'items' ? 'popular' : 'newest');
  };

  // How many rows each category holds in the current view, for the chip badges.
  const counts = useMemo(() => {
    const map: Record<string, number> = {};
    dataset.forEach((row) => {
      if (row.category) map[row.category] = (map[row.category] ?? 0) + 1;
    });
    return map;
  }, [dataset]);

  const filtered = useMemo(() => {
    let list = [...dataset];
    if (category) list = list.filter((row) => row.category === category);
    if (location) list = list.filter((row) => row.location === location);

    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter((row) => {
        const business = 'businessName' in row ? (row.businessName ?? '') : '';
        return (
          row.name.toLowerCase().includes(q) ||
          business.toLowerCase().includes(q) ||
          (row.location ?? '').toLowerCase().includes(q)
        );
      });
    }

    if (sort === 'name') list.sort((a, b) => a.name.localeCompare(b.name));
    else if (sort === 'price_asc' && view !== 'businesses')
      list.sort((a, b) => priceOf(view, a) - priceOf(view, b));
    else if (sort === 'price_desc' && view !== 'businesses')
      list.sort((a, b) => priceOf(view, b) - priceOf(view, a));
    else if (sort === 'popular' && view === 'items')
      list.sort((a, b) => ((b as Product).bookings ?? 0) - ((a as Product).bookings ?? 0));
    // newest = keep API order (already newest-first)

    return list;
  }, [dataset, category, location, search, sort, view]);

  const sorts = SORTS[view];
  const sortLabel = sorts.find((s) => s.key === sort)?.label ?? sorts[0].label;
  const heading = category || ALL_LABEL[view];
  const columns = layout === 'compact' ? 2 : 1;

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-slate-50">
      <View className="bg-white px-5 pb-4 pt-2">
        <Text className="text-2xl font-bold text-ink">Rent</Text>
        <Text className="mt-1 text-sm text-slate-500">
          Browse everything available to rent.
        </Text>

        <View className="mt-4 flex-row items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3">
          <Ionicons name="search" size={18} color="#94a3b8" />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search rentals, businesses, places…"
            placeholderTextColor="#94a3b8"
            returnKeyType="search"
            autoCorrect={false}
            className="flex-1 py-3 text-sm text-ink"
          />
          {search.length > 0 && (
            <Pressable
              onPress={() => setSearch('')}
              accessibilityRole="button"
              accessibilityLabel="Clear search"
              hitSlop={8}
            >
              <Ionicons name="close-circle" size={18} color="#cbd5e1" />
            </Pressable>
          )}
        </View>

        <View className="mt-3 flex-row rounded-xl bg-slate-100 p-1">
          {VIEWS.map((tab) => {
            const active = view === tab.key;
            return (
              <Pressable
                key={tab.key}
                onPress={() => changeView(tab.key)}
                accessibilityRole="tab"
                accessibilityState={{ selected: active }}
                className={`flex-1 items-center rounded-lg py-2 ${active ? 'bg-white' : ''}`}
              >
                <Text
                  className={`text-sm font-semibold ${
                    active ? 'text-accent-dark' : 'text-slate-500'
                  }`}
                >
                  {tab.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : (
        <FlatList
          // numColumns can't change on a mounted list, so the layout keys it.
          key={layout}
          data={loading ? [] : filtered}
          numColumns={columns}
          columnWrapperStyle={columns > 1 ? { gap: 12 } : undefined}
          keyExtractor={(row) => `${view}-${row.id}`}
          contentContainerClassName="px-5 pb-10"
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={refresh}
              tintColor="#56aea1"
              colors={['#56aea1']}
            />
          }
          ListHeaderComponent={
            <ListHeader
              heading={heading}
              counts={counts}
              total={dataset.length}
              category={category}
              onCategory={setCategory}
              allLabel={ALL_LABEL[view]}
              resultCount={loading ? null : filtered.length}
              sortLabel={sortLabel}
              onOpenSort={() => setSortOpen(true)}
              location={location}
              onOpenLocation={() => setLocationOpen(true)}
              onClearLocation={() => setLocation('')}
              layout={layout}
              onLayout={setLayout}
            />
          }
          ListEmptyComponent={
            loading ? (
              <CardSkeletons />
            ) : (
              <EmptyState
                message={
                  dataset.length === 0
                    ? 'No rentals to show right now. Pull down to refresh.'
                    : 'Nothing matched. Try a different search, location or category.'
                }
              />
            )
          }
          renderItem={({ item }) => (
            <View className={columns > 1 ? 'mb-3 flex-1' : 'mb-3'}>
              {view === 'items' && <ProductCard item={item as Product} layout={layout} />}
              {view === 'packages' && (
                <PackageCard item={item as RentalPackage} layout={layout} />
              )}
              {view === 'businesses' && (
                <BusinessCard item={item as Business} layout={layout} />
              )}
            </View>
          )}
        />
      )}

      <OptionSheet
        open={sortOpen}
        title="Sort by"
        options={sorts.map((s) => ({ key: s.key, label: s.label }))}
        value={sort}
        onSelect={(key) => {
          setSort(key);
          setSortOpen(false);
        }}
        onClose={() => setSortOpen(false)}
      />

      <OptionSheet
        open={locationOpen}
        title="Location"
        options={[
          { key: '', label: 'All locations' },
          ...locations.map((l) => ({ key: l, label: l })),
        ]}
        value={location}
        onSelect={(key) => {
          setLocation(key);
          setLocationOpen(false);
        }}
        onClose={() => setLocationOpen(false)}
      />
    </SafeAreaView>
  );
}

// Scrolls with the list: the category filter, the toolbar and the result count.
// Kept as a module-level component so re-renders don't remount it.
function ListHeader({
  heading,
  counts,
  total,
  category,
  onCategory,
  allLabel,
  resultCount,
  sortLabel,
  onOpenSort,
  location,
  onOpenLocation,
  onClearLocation,
  layout,
  onLayout,
}: {
  heading: string;
  counts: Record<string, number>;
  total: number;
  category: string;
  onCategory: (name: string) => void;
  allLabel: string;
  resultCount: number | null;
  sortLabel: string;
  onOpenSort: () => void;
  location: string;
  onOpenLocation: () => void;
  onClearLocation: () => void;
  layout: Layout;
  onLayout: (l: Layout) => void;
}) {
  return (
    <View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        className="-mx-5 mt-4"
        contentContainerClassName="gap-2 px-5"
        keyboardShouldPersistTaps="handled"
      >
        <Chip label={allLabel} count={total} active={!category} onPress={() => onCategory('')} />
        {CATEGORIES.map((c) => (
          <Chip
            key={c.name}
            label={c.name}
            icon={c.name}
            count={counts[c.name] ?? 0}
            active={category === c.name}
            onPress={() => onCategory(category === c.name ? '' : c.name)}
          />
        ))}
      </ScrollView>

      {/* Toolbar: location, sort and card display — the website's controls. */}
      <View className="mt-4 flex-row items-center gap-2">
        <Pressable
          onPress={onOpenLocation}
          accessibilityRole="button"
          accessibilityLabel={`Location: ${location || 'All locations'}`}
          className={`flex-1 flex-row items-center gap-1.5 rounded-xl border px-3 py-2 ${
            location ? 'border-accent bg-accent/10' : 'border-slate-200 bg-white'
          }`}
        >
          <Ionicons name="location-outline" size={15} color={location ? '#47978b' : '#64748b'} />
          <Text
            className={`flex-1 text-xs font-medium ${
              location ? 'text-accent-dark' : 'text-slate-600'
            }`}
            numberOfLines={1}
          >
            {location ? cityOf(location) : 'All locations'}
          </Text>
          {!!location && (
            <Pressable onPress={onClearLocation} hitSlop={8} accessibilityLabel="Clear location">
              <Ionicons name="close-circle" size={15} color="#47978b" />
            </Pressable>
          )}
        </Pressable>

        <Pressable
          onPress={onOpenSort}
          accessibilityRole="button"
          accessibilityLabel={`Sort: ${sortLabel}`}
          className="flex-row items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2"
        >
          <Ionicons name="swap-vertical" size={15} color="#47978b" />
          <Text className="text-xs font-medium text-slate-600">Sort</Text>
        </Pressable>

        <View className="flex-row rounded-xl border border-slate-200 bg-white p-0.5">
          {LAYOUTS.map((l) => (
            <Pressable
              key={l.key}
              onPress={() => onLayout(l.key)}
              accessibilityRole="button"
              accessibilityLabel={`${l.key} view`}
              accessibilityState={{ selected: layout === l.key }}
              className={`rounded-lg p-1.5 ${layout === l.key ? 'bg-accent' : ''}`}
            >
              <Ionicons
                name={l.icon}
                size={15}
                color={layout === l.key ? '#ffffff' : '#64748b'}
              />
            </Pressable>
          ))}
        </View>
      </View>

      <View className="mb-4 mt-4">
        <Text className="text-base font-semibold text-ink">{heading}</Text>
        <Text className="text-xs text-slate-500">
          {resultCount === null
            ? 'Loading…'
            : `${resultCount} result${resultCount === 1 ? '' : 's'} · sorted by ${sortLabel.toLowerCase()}`}
        </Text>
      </View>
    </View>
  );
}

function Chip({
  label,
  count,
  active,
  onPress,
  icon,
}: {
  label: string;
  count: number;
  active: boolean;
  onPress: () => void;
  icon?: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      className={`flex-row items-center gap-1.5 rounded-full border px-3 py-2 ${
        active ? 'border-accent bg-accent' : 'border-slate-200 bg-white'
      }`}
    >
      {!!icon && (
        <Ionicons name={categoryIcon(icon)} size={14} color={active ? '#ffffff' : '#64748b'} />
      )}
      <Text className={`text-xs font-medium ${active ? 'text-white' : 'text-slate-600'}`}>
        {label}
      </Text>
      <Text className={`text-xs ${active ? 'text-white/80' : 'text-slate-400'}`}>{count}</Text>
    </Pressable>
  );
}

// One bottom sheet shape reused for sort and for location.
function OptionSheet({
  open,
  title,
  options,
  value,
  onSelect,
  onClose,
}: {
  open: boolean;
  title: string;
  options: { key: string; label: string }[];
  value: string;
  onSelect: (key: string) => void;
  onClose: () => void;
}) {
  return (
    <Modal
      visible={open}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <Pressable className="flex-1 justify-end bg-black/40" onPress={onClose}>
        {/* Swallow taps on the sheet itself so they don't close it. */}
        <Pressable
          onPress={(e) => e.stopPropagation()}
          className="max-h-[70%] rounded-t-3xl bg-white px-5 pb-8 pt-4"
        >
          <View className="mb-4 h-1 w-10 self-center rounded-full bg-slate-200" />
          <Text className="mb-2 text-base font-semibold text-ink">{title}</Text>
          <ScrollView>
            {options.map((opt) => {
              const active = opt.key === value;
              return (
                <Pressable
                  key={opt.key || '__all__'}
                  onPress={() => onSelect(opt.key)}
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                  className="flex-row items-center justify-between py-3.5"
                >
                  <Text
                    className={`flex-1 text-sm ${
                      active ? 'font-semibold text-accent-dark' : 'text-slate-600'
                    }`}
                  >
                    {opt.label}
                  </Text>
                  {active && <Ionicons name="checkmark" size={18} color="#47978b" />}
                </Pressable>
              );
            })}
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
