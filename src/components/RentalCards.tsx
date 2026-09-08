import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Text, View } from 'react-native';
import type { Business, Product, RentalPackage } from '@/lib/api';
import { assetUrl } from '@/lib/api';
import { categoryIcon } from '@/lib/categories';
import { cityOf, formatPrice } from '@/lib/format';

/**
 * Card display modes, mirroring the website's browse page:
 *   grid    — one full-width card per row
 *   compact — two smaller cards per row
 *   list    — a horizontal row with the image beside the details
 */
export type Layout = 'grid' | 'compact' | 'list';

/**
 * Listing cards.
 *
 * Image-forward: the photograph is the card, with rounded corners and no
 * surrounding chrome, and the details sit underneath as plain text. Every card
 * has the same three text lines — name, place, then price and rating — so a
 * grid keeps its baseline whatever the content.
 */

// ── Shared pieces ─────────────────────────────────────────────────────────

// Cover photo, or the category glyph on a soft brand wash when there is none.
function Photo({
  uri,
  category,
  className,
  aspectRatio,
}: {
  uri: string | null;
  category?: string | null;
  className?: string;
  aspectRatio?: number;
}) {
  return (
    <View
      style={aspectRatio ? { aspectRatio } : undefined}
      className={`overflow-hidden rounded-2xl bg-slate-100 ${className ?? ''}`}
    >
      {uri ? (
        <Image source={{ uri }} style={{ flex: 1 }} contentFit="cover" transition={200} />
      ) : (
        <View className="flex-1 items-center justify-center bg-brand/10">
          <Ionicons name={categoryIcon(category)} size={34} color="#006e59" />
        </View>
      )}
    </View>
  );
}

/**
 * The one badge a card may carry, top-left over the photo.
 *
 * Driven by data the API already returns rather than invented: a strong rating
 * with enough reviews behind it outranks raw popularity, and a card with
 * neither shows nothing at all.
 */
function Highlight({
  rating,
  reviewCount,
  bookings = 0,
}: {
  rating: number;
  reviewCount: number;
  bookings?: number;
}) {
  const label =
    rating >= 4.8 && reviewCount >= 3 ? 'Top rated' : bookings >= 3 ? 'Popular' : null;
  if (!label) return null;

  return (
    <View className="absolute left-3 top-3 rounded-full bg-white/95 px-2.5 py-1">
      <Text className="text-[11px] font-semibold text-ink">{label}</Text>
    </View>
  );
}

// Only shown when it's a problem — an "Available" badge on every card is noise.
function UnavailableVeil({ available }: { available: boolean }) {
  if (available) return null;
  return (
    <View className="absolute inset-0 items-center justify-center rounded-2xl bg-black/45">
      <View className="rounded-full bg-white/95 px-3 py-1">
        <Text className="text-[11px] font-semibold text-slate-700">Unavailable</Text>
      </View>
    </View>
  );
}

/** "★ 4.89", or nothing at all until something has been reviewed. */
function Rating({ value, count }: { value: number; count: number }) {
  if (!count) return null;
  return (
    <View className="flex-row items-center gap-1">
      <Ionicons name="star" size={11} color="#0f172a" />
      <Text className="font-sans text-[13px] text-slate-500">{value.toFixed(2)}</Text>
    </View>
  );
}

// The three-line detail block every card shares.
function Details({
  name,
  place,
  trailing,
  rating,
  reviewCount,
  compact,
}: {
  name: string;
  place: string | null;
  /** The third line's leading text: a price, or a category for a business. */
  trailing: React.ReactNode;
  rating: number;
  reviewCount: number;
  compact?: boolean;
}) {
  return (
    <View className={compact ? 'mt-2' : 'mt-2.5'}>
      <Text
        className={`font-semibold text-ink ${compact ? 'text-[13px]' : 'text-[15px]'}`}
        numberOfLines={1}
      >
        {name}
      </Text>
      <Text
        className={`font-sans text-slate-500 ${compact ? 'text-[11px]' : 'text-[13px]'}`}
        numberOfLines={1}
      >
        {place || 'Location on request'}
      </Text>
      <View className="mt-0.5 flex-row items-center gap-1.5">
        {trailing}
        {reviewCount > 0 && <Text className="font-sans text-[13px] text-slate-400">·</Text>}
        <Rating value={rating} count={reviewCount} />
      </View>
    </View>
  );
}

function Price({
  amount,
  unit,
  compact,
}: {
  amount: string;
  unit: string;
  compact?: boolean;
}) {
  return (
    <Text
      className={`font-sans text-slate-700 ${compact ? 'text-[11px]' : 'text-[13px]'}`}
      numberOfLines={1}
    >
      <Text className="font-semibold text-ink">{amount}</Text>
      {unit}
    </Text>
  );
}

// ── Product ───────────────────────────────────────────────────────────────

export function ProductCard({ item, layout = 'grid' }: { item: Product; layout?: Layout }) {
  const available = item.availability === 'available';
  const img = assetUrl(item.imageUrl);
  const price = formatPrice(item.pricePerDay, item.currency);

  if (layout === 'list') {
    return (
      <View className="flex-row gap-3">
        <View className="h-28 w-28">
          <Photo uri={img} category={item.category} className="h-full w-full" />
          <UnavailableVeil available={available} />
        </View>
        <View className="flex-1 justify-center">
          <Details
            name={item.name}
            place={cityOf(item.location)}
            trailing={<Price amount={price} unit=" / day" />}
            rating={item.rating}
            reviewCount={item.reviewCount}
          />
        </View>
      </View>
    );
  }

  const compact = layout === 'compact';
  return (
    <View>
      <View>
        <Photo uri={img} category={item.category} aspectRatio={compact ? 1 : 1.15} />
        <Highlight
          rating={item.rating}
          reviewCount={item.reviewCount}
          bookings={item.bookings}
        />
        <UnavailableVeil available={available} />
      </View>
      <Details
        name={item.name}
        place={cityOf(item.location)}
        trailing={<Price amount={price} unit=" / day" compact={compact} />}
        rating={item.rating}
        reviewCount={item.reviewCount}
        compact={compact}
      />
    </View>
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
  const unit = item.priceUnit === 'day' ? ' / day' : '';
  const price = formatPrice(item.price, item.currency);
  // What the same items would cost booked individually, so the saving is visible.
  const individualTotal = (item.itemValues ?? []).reduce(
    (sum, row) => sum + (Number(row?.value) || 0),
    0,
  );
  const savings = individualTotal - Number(item.price || 0);
  const compact = layout === 'compact';

  // Packages carry no photograph of their own, so the tile states what it is.
  const tile = (
    <View className="flex-1 items-center justify-center gap-1.5 bg-brand/10">
      <Ionicons name="cube-outline" size={30} color="#006e59" />
      <Text className="text-[11px] font-semibold text-brand">
        {item.items?.length ? `${item.items.length} items` : 'Package'}
      </Text>
    </View>
  );

  if (layout === 'list') {
    return (
      <View className="flex-row gap-3">
        <View className="h-28 w-28 overflow-hidden rounded-2xl">{tile}</View>
        <View className="flex-1 justify-center">
          <Details
            name={item.name}
            place={cityOf(item.location)}
            trailing={<Price amount={price} unit={unit} />}
            rating={item.rating}
            reviewCount={item.reviewCount}
          />
        </View>
      </View>
    );
  }

  return (
    <View>
      <View>
        <View
          style={{ aspectRatio: compact ? 1 : 1.15 }}
          className="overflow-hidden rounded-2xl"
        >
          {tile}
        </View>
        {savings > 0 ? (
          <View className="absolute left-3 top-3 rounded-full bg-accent px-2.5 py-1">
            <Text className="text-[11px] font-semibold text-ink-dark">
              Save {formatPrice(savings, item.currency)}
            </Text>
          </View>
        ) : (
          <Highlight rating={item.rating} reviewCount={item.reviewCount} />
        )}
        <UnavailableVeil available={available} />
      </View>
      <Details
        name={item.name}
        place={cityOf(item.location)}
        trailing={<Price amount={price} unit={unit} compact={compact} />}
        rating={item.rating}
        reviewCount={item.reviewCount}
        compact={compact}
      />
    </View>
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

  // A business has no price, so the third line carries its category instead.
  const details = (
    <Details
      name={item.name}
      place={cityOf(item.location)}
      trailing={
        <Text
          className={`font-sans text-slate-700 ${compact ? 'text-[11px]' : 'text-[13px]'}`}
          numberOfLines={1}
        >
          {item.category ?? 'Rentals'}
        </Text>
      }
      rating={item.rating}
      reviewCount={item.reviewCount}
      compact={compact}
    />
  );

  if (layout === 'list') {
    return (
      <View className="flex-row gap-3">
        <View className="h-28 w-28">
          <Photo uri={img} category={item.category} className="h-full w-full" />
        </View>
        <View className="flex-1 justify-center">{details}</View>
      </View>
    );
  }

  return (
    <View>
      <View>
        <Photo uri={img} category={item.category} aspectRatio={compact ? 1 : 1.15} />
        <Highlight rating={item.rating} reviewCount={item.reviewCount} />
      </View>
      {details}
    </View>
  );
}
