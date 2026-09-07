import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import type { ReactNode } from 'react';
import { Text, View } from 'react-native';
import type { Business, Product, RentalPackage } from '@/lib/api';
import { assetUrl } from '@/lib/api';
import { categoryIcon } from '@/lib/categories';
import { cityOf, formatPrice } from '@/lib/format';
import StarRating from './StarRating';

/**
 * Card display modes, mirroring the website's browse page:
 *   grid    — one full-width card per row
 *   compact — two smaller cards per row
 *   list    — a horizontal row with the image beside the details
 */
export type Layout = 'grid' | 'compact' | 'list';

// ── Shared pieces ─────────────────────────────────────────────────────────

// Cover photo, or the category glyph on a soft brand wash when there is none.
function Thumb({
  uri,
  category,
  height,
  className,
}: {
  uri: string | null;
  category?: string | null;
  height?: number;
  className?: string;
}) {
  if (uri) {
    return (
      <Image
        source={{ uri }}
        style={height ? { width: '100%', height } : { flex: 1 }}
        contentFit="cover"
        transition={180}
      />
    );
  }
  return (
    <View
      style={height ? { height } : undefined}
      className={`items-center justify-center bg-accent/10 ${className ?? 'w-full'}`}
    >
      <Ionicons name={categoryIcon(category)} size={height && height < 120 ? 28 : 40} color="#56aea1" />
    </View>
  );
}

function Pill({ label }: { label: string }) {
  return (
    <View className="self-start rounded-full bg-slate-100 px-2.5 py-1">
      <Text className="text-xs font-medium text-slate-600" numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

function AvailabilityBadge({ available }: { available: boolean }) {
  return (
    <View
      className={`absolute right-2 top-2 rounded-full px-2 py-0.5 ${
        available ? 'bg-emerald-500' : 'bg-slate-500'
      }`}
    >
      <Text className="text-xs font-semibold text-white">
        {available ? 'Available' : 'Unavailable'}
      </Text>
    </View>
  );
}

function LocationLine({ location }: { location?: string | null }) {
  const city = cityOf(location);
  if (!city) return null;
  return (
    <View className="mt-1 flex-row items-center gap-1">
      <Ionicons name="location-outline" size={13} color="#94a3b8" />
      <Text className="flex-1 text-xs text-slate-500" numberOfLines={1}>
        {city}
      </Text>
    </View>
  );
}

function Card({ children, row = false }: { children: ReactNode; row?: boolean }) {
  return (
    <View
      className={`overflow-hidden rounded-2xl border border-slate-200 bg-white ${
        row ? 'flex-row' : ''
      }`}
    >
      {children}
    </View>
  );
}

// ── Product ───────────────────────────────────────────────────────────────

export function ProductCard({ item, layout = 'grid' }: { item: Product; layout?: Layout }) {
  const available = item.availability === 'available';
  const img = assetUrl(item.imageUrl);
  const price = (
    <Text className="text-lg font-bold text-accent-dark">
      {formatPrice(item.pricePerDay, item.currency)}
      <Text className="text-sm font-normal text-slate-400">/day</Text>
    </Text>
  );

  if (layout === 'list') {
    return (
      <Card row>
        <View className="w-32 bg-slate-100">
          <Thumb uri={img} category={item.category} className="h-full w-full" />
        </View>
        <View className="flex-1 p-3">
          <Text className="text-sm font-semibold text-ink" numberOfLines={2}>
            {item.name}
          </Text>
          <LocationLine location={item.location} />
          <View className="mt-1.5 flex-row flex-wrap items-center gap-2">
            {!!item.category && <Pill label={item.category} />}
          </View>
          <StarRating value={item.rating} count={item.reviewCount} />
          <View className="mt-2 flex-row items-center justify-between">
            {price}
            <View
              className={`rounded-full px-2 py-0.5 ${
                available ? 'bg-emerald-100' : 'bg-slate-100'
              }`}
            >
              <Text
                className={`text-xs font-semibold ${
                  available ? 'text-emerald-700' : 'text-slate-500'
                }`}
              >
                {available ? 'Available' : 'Unavailable'}
              </Text>
            </View>
          </View>
        </View>
      </Card>
    );
  }

  const compact = layout === 'compact';
  return (
    <Card>
      <View>
        <Thumb uri={img} category={item.category} height={compact ? 104 : 160} />
        <AvailabilityBadge available={available} />
        {item.bookings > 0 && !compact && (
          <View className="absolute left-2 top-2 flex-row items-center gap-1 rounded-full bg-white/95 px-2 py-0.5">
            <Ionicons name="flame" size={13} color="#f59e0b" />
            <Text className="text-xs font-medium text-slate-700">
              {item.bookings} booking{item.bookings === 1 ? '' : 's'}
            </Text>
          </View>
        )}
      </View>
      <View className={compact ? 'p-3' : 'p-4'}>
        <Text
          className={`font-semibold text-ink ${compact ? 'text-sm' : 'text-base'}`}
          numberOfLines={2}
        >
          {item.name}
        </Text>
        {!!item.businessName && !compact && (
          <Text className="mt-0.5 text-xs text-slate-500" numberOfLines={1}>
            by {item.businessName}
          </Text>
        )}
        <LocationLine location={item.location} />
        <View className="mt-2 flex-row flex-wrap items-center gap-2">
          {!!item.category && !compact && <Pill label={item.category} />}
          <StarRating value={item.rating} count={item.reviewCount} />
        </View>
        <View className="mt-2.5">{price}</View>
      </View>
    </Card>
  );
}

// ── Package ───────────────────────────────────────────────────────────────

export function PackageCard({
  item,
  layout = 'grid',
}: {
  item: RentalPackage;
  layout?: Layout;
}) {
  const available = item.availability === 'available';
  const unit = item.priceUnit === 'day' ? '/day' : '';
  // What the same items would cost booked individually, so the saving is visible.
  const individualTotal = (item.itemValues ?? []).reduce(
    (sum, row) => sum + (Number(row?.value) || 0),
    0,
  );
  const savings = individualTotal - Number(item.price || 0);
  const lines = item.items ?? [];
  const compact = layout === 'compact';

  const price = (
    <Text className="text-lg font-bold text-accent-dark">
      {formatPrice(item.price, item.currency)}
      {!!unit && <Text className="text-sm font-normal text-slate-400">{unit}</Text>}
    </Text>
  );

  if (layout === 'list') {
    return (
      <Card row>
        <View className="w-28 items-center justify-center gap-1 bg-accent/10 p-3">
          <Ionicons name="cube-outline" size={26} color="#47978b" />
          <Text className="text-xs font-semibold text-accent-dark">Package</Text>
        </View>
        <View className="flex-1 p-3">
          <Text className="text-sm font-semibold text-ink" numberOfLines={2}>
            {item.name}
          </Text>
          <LocationLine location={item.location} />
          <StarRating value={item.rating} count={item.reviewCount} />
          <View className="mt-2 flex-row items-center justify-between">
            {price}
            {savings > 0 && (
              <View className="rounded-full bg-emerald-100 px-2 py-0.5">
                <Text className="text-xs font-semibold text-emerald-700">
                  Save {formatPrice(savings, item.currency)}
                </Text>
              </View>
            )}
          </View>
        </View>
      </Card>
    );
  }

  return (
    <Card>
      <View className="flex-row items-center justify-between border-b border-slate-100 bg-accent/10 px-3 py-2.5">
        <View className="flex-row items-center gap-1.5">
          <Ionicons name="cube-outline" size={16} color="#47978b" />
          <Text className="text-sm font-semibold text-accent-dark">Package</Text>
        </View>
        {!!item.category && !compact && <Pill label={item.category} />}
      </View>
      <View className={compact ? 'p-3' : 'p-4'}>
        <Text
          className={`font-semibold text-ink ${compact ? 'text-sm' : 'text-base'}`}
          numberOfLines={2}
        >
          {item.name}
        </Text>
        {!!item.businessName && !compact && (
          <Text className="mt-0.5 text-xs text-slate-500" numberOfLines={1}>
            by {item.businessName}
          </Text>
        )}
        <LocationLine location={item.location} />
        <View className="mt-2 flex-row flex-wrap items-center gap-2">
          <StarRating value={item.rating} count={item.reviewCount} />
          {!compact && (
            <View
              className={`rounded-full px-2 py-0.5 ${
                available ? 'bg-emerald-100' : 'bg-slate-100'
              }`}
            >
              <Text
                className={`text-xs font-semibold ${
                  available ? 'text-emerald-700' : 'text-slate-500'
                }`}
              >
                {available ? 'Available' : 'Unavailable'}
              </Text>
            </View>
          )}
          {savings > 0 && (
            <View className="rounded-full bg-emerald-100 px-2 py-0.5">
              <Text className="text-xs font-semibold text-emerald-700">
                Save {formatPrice(savings, item.currency)}
              </Text>
            </View>
          )}
        </View>
        {!!item.description && !compact && (
          <Text className="mt-2 text-sm text-slate-600" numberOfLines={2}>
            {item.description}
          </Text>
        )}
        {lines.length > 0 && !compact && (
          <View className="mt-3 gap-1">
            {lines.slice(0, 3).map((line, i) => (
              <View key={i} className="flex-row items-center gap-1.5">
                <Ionicons name="checkmark" size={13} color="#56aea1" />
                <Text className="flex-1 text-xs text-slate-600" numberOfLines={1}>
                  {line}
                </Text>
              </View>
            ))}
            {lines.length > 3 && (
              <Text className="text-xs text-slate-400">+{lines.length - 3} more</Text>
            )}
          </View>
        )}
        <View className="mt-2.5">{price}</View>
      </View>
    </Card>
  );
}

// ── Business ──────────────────────────────────────────────────────────────

export function BusinessCard({
  item,
  layout = 'grid',
}: {
  item: Business;
  layout?: Layout;
}) {
  const img = assetUrl(item.imageUrl);
  const compact = layout === 'compact';

  if (layout === 'list') {
    return (
      <Card row>
        <View className="w-32 bg-slate-100">
          <Thumb uri={img} category={item.category} className="h-full w-full" />
        </View>
        <View className="flex-1 p-3">
          <Text className="text-sm font-semibold text-ink" numberOfLines={2}>
            {item.name}
          </Text>
          <LocationLine location={item.location} />
          <View className="mt-1.5 flex-row flex-wrap items-center gap-2">
            {!!item.category && <Pill label={item.category} />}
          </View>
          <StarRating value={item.rating} count={item.reviewCount} />
        </View>
      </Card>
    );
  }

  return (
    <Card>
      <Thumb uri={img} category={item.category} height={compact ? 96 : 128} />
      <View className={compact ? 'p-3' : 'p-4'}>
        <Text
          className={`font-semibold text-ink ${compact ? 'text-sm' : 'text-base'}`}
          numberOfLines={2}
        >
          {item.name}
        </Text>
        <View className="mt-1 flex-row items-center gap-1">
          <Ionicons name="location-outline" size={13} color="#94a3b8" />
          <Text className="flex-1 text-xs text-slate-500" numberOfLines={1}>
            {cityOf(item.location) || 'Location on request'}
          </Text>
        </View>
        <View className="mt-2 flex-row flex-wrap items-center gap-2">
          {!!item.category && !compact && <Pill label={item.category} />}
          <StarRating value={item.rating} count={item.reviewCount} />
        </View>
        {!!item.description && !compact && (
          <Text className="mt-2.5 text-sm text-slate-600" numberOfLines={2}>
            {item.description}
          </Text>
        )}
      </View>
    </Card>
  );
}
