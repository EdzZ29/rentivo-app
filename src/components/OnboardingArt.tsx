import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps, ReactNode } from 'react';
import { Text, View } from 'react-native';

/**
 * The onboarding artwork.
 *
 * There are no photographic assets in the project, so each slide's hero is
 * composed from icons and views: dark "glass" cards over a teal glow, staged on
 * the near-black background. Vector rather than raster, so it stays crisp at
 * any density and follows the palette.
 */

type IconName = ComponentProps<typeof Ionicons>['name'];

// Glass panel: barely-there fill, hairline edge, lifted off the background.
const glass = 'rounded-2xl border border-white/10 bg-white/[0.07]';

/**
 * The bounded canvas every piece is positioned against.
 *
 * This has to be a fixed width: absolutely-positioned children resolve against
 * their parent, so a full-width stage would fling the floating badges out to
 * the screen edges instead of keeping them tucked around the artwork.
 */
function Stage({ children }: { children: ReactNode }) {
  return (
    <View className="w-full items-center">
      <View className="h-[300px] w-full max-w-[320px] items-center justify-center">
        {/* Soft teal glow standing in for a light source. */}
        <View className="absolute h-[260px] w-[260px] rounded-full bg-accent/20" />
        <View className="absolute h-[170px] w-[170px] rounded-full bg-accent/20" />
        {children}
      </View>
    </View>
  );
}

function Tile({ icon, label }: { icon: IconName; label: string }) {
  return (
    <View className={`${glass} items-center gap-1 px-2.5 py-2`}>
      <Ionicons name={icon} size={17} color="#7fd4c3" />
      <Text className="text-[9px] font-semibold text-white/90">{label}</Text>
    </View>
  );
}

function Badge({
  icon,
  className,
  color = '#7fd4c3',
}: {
  icon: IconName;
  className?: string;
  color?: string;
}) {
  return (
    <View
      className={`h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-night/80 ${className ?? ''}`}
    >
      <Ionicons name={icon} size={18} color={color} />
    </View>
  );
}

function MiniChart({ bars = [40, 64, 28, 76, 52] }: { bars?: number[] }) {
  return (
    <View className="h-[76px] flex-row items-end gap-1.5">
      {bars.map((h, i) => (
        <View
          key={i}
          style={{ height: h }}
          className={`w-3 rounded-t ${i % 2 === 0 ? 'bg-accent' : 'bg-accent/40'}`}
        />
      ))}
    </View>
  );
}

// ── 1. All in one place ───────────────────────────────────────────────────

export function ArtAllInOne() {
  return (
    <Stage>
      <View className={`${glass} w-52 p-4`}>
        <View className="mb-3 flex-row items-center gap-2">
          <View className="h-2 w-2 rounded-full bg-accent" />
          <View className="h-2 w-16 rounded-full bg-white/20" />
        </View>
        <MiniChart />
        <View className="mt-3 gap-1.5">
          <View className="h-2 w-full rounded-full bg-white/10" />
          <View className="h-2 w-2/3 rounded-full bg-white/10" />
        </View>
      </View>

      <View className={`${glass} absolute bottom-10 right-4 h-24 w-16 p-2`}>
        <View className="h-1 w-6 self-center rounded-full bg-white/20" />
        <View className="mt-2 flex-1 rounded-lg bg-accent/25" />
      </View>

      <Badge icon="car-sport" className="absolute left-0 top-8" />
      <Badge icon="bicycle" className="absolute left-2 bottom-16" />
      <Badge icon="camera" className="absolute right-1 top-6" />
      <Badge icon="musical-notes" className="absolute left-16 bottom-4" />
      <Badge icon="construct" className="absolute right-0 bottom-4" />
    </Stage>
  );
}

// ── 2. Manage your business ───────────────────────────────────────────────

export function ArtManage() {
  return (
    <Stage>
      <View className="absolute top-2 flex-row gap-12">
        <Tile icon="calendar-outline" label="Reservations" />
        <Tile icon="cube-outline" label="Inventory" />
      </View>

      <View className={`${glass} w-44 p-3.5`}>
        <View className="mb-2.5 h-2 w-14 rounded-full bg-white/20" />
        <MiniChart bars={[30, 52, 38, 68, 44]} />
        <View className="mt-2.5 h-2 w-2/3 rounded-full bg-white/10" />
      </View>

      <View className="absolute bottom-2 flex-row gap-2">
        <Tile icon="person-outline" label="Customers" />
        <Tile icon="card-outline" label="Payments" />
        <Tile icon="bar-chart-outline" label="Reports" />
      </View>
    </Stage>
  );
}

// ── 3. Reach more customers ───────────────────────────────────────────────

function PhoneRow({
  icon,
  name,
  price,
}: {
  icon: IconName;
  name: string;
  price: string;
}) {
  return (
    <View className="flex-row items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.06] p-1.5">
      <View className="h-7 w-7 items-center justify-center rounded-md bg-accent/20">
        <Ionicons name={icon} size={14} color="#7fd4c3" />
      </View>
      <View className="flex-1">
        <Text className="text-[8px] font-semibold text-white/90" numberOfLines={1}>
          {name}
        </Text>
        <Text className="text-[8px] font-bold text-accent">{price}</Text>
      </View>
      <View className="rounded bg-accent px-1.5 py-0.5">
        <Text className="text-[7px] font-semibold text-night">Book</Text>
      </View>
    </View>
  );
}

export function ArtMarketplace() {
  return (
    <Stage>
      <View
        className={`h-[260px] w-[146px] rounded-[26px] border border-white/15 bg-white/[0.07] p-2.5`}
      >
        <View className="mb-2 h-1 w-8 self-center rounded-full bg-white/20" />
        <View className="mb-2 flex-row items-center gap-1 rounded-lg bg-white/10 px-2 py-1.5">
          <Ionicons name="search" size={10} color="#94a3b8" />
          <Text className="text-[8px] text-white/50">Search rentals</Text>
        </View>
        <View className="mb-2 flex-row justify-between px-0.5">
          {(['car-sport', 'construct', 'camera', 'sparkles'] as IconName[]).map((n) => (
            <View
              key={n}
              className="h-7 w-7 items-center justify-center rounded-full bg-accent/20"
            >
              <Ionicons name={n} size={13} color="#7fd4c3" />
            </View>
          ))}
        </View>
        <View className="gap-1.5">
          <PhoneRow icon="car-sport" name="Toyota Innova" price="₱2,500 / day" />
          <PhoneRow icon="camera" name="Camera Set" price="₱900 / day" />
          <PhoneRow icon="musical-notes" name="Sound System" price="₱1,200 / day" />
        </View>
      </View>

      <View className="absolute left-0 top-16 flex-row items-center gap-1 rounded-full border border-white/10 bg-night/80 px-2.5 py-1.5">
        <Ionicons name="star" size={12} color="#f59e0b" />
        <Text className="text-[11px] font-bold text-white">4.8</Text>
      </View>
      <Badge icon="location" className="absolute right-0 top-8" />
      <Badge icon="shield-checkmark" className="absolute right-0 top-36" />
      <Badge icon="calendar" className="absolute right-2 bottom-10" />
      <Badge icon="pricetag" className="absolute left-1 bottom-14" />
    </Stage>
  );
}

// ── 4. Ready to get started ───────────────────────────────────────────────

export function ArtGetStarted() {
  return (
    <Stage>
      <View
        className={`h-32 w-32 items-center justify-center rounded-full border border-white/10 bg-white/[0.07]`}
      >
        <Ionicons name="phone-portrait-outline" size={50} color="#7fd4c3" />
      </View>

      <View className="absolute right-12 top-14 h-11 w-11 items-center justify-center rounded-full bg-accent">
        <Ionicons name="checkmark" size={22} color="#08151c" />
      </View>

      <Badge icon="car-sport" className="absolute left-2 top-10" />
      <Badge icon="camera" className="absolute right-0 top-1/2" />
      <Badge icon="construct" className="absolute right-6 bottom-8" />
      <Badge icon="bicycle" className="absolute left-0 bottom-16" />
      <Badge icon="cube" className="absolute left-16 bottom-4" />
    </Stage>
  );
}
