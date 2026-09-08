import { useEffect } from 'react';
import { ScrollView, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

const BASE = '#e2e8f0';
const PULSE_MS = 900;

/**
 * A single placeholder block that breathes.
 *
 * Sized with numbers rather than utility classes: Reanimated's Animated.View
 * takes no className (Nativewind only rewrites react-native's own components),
 * so everything here has to go through `style`.
 *
 * Each block runs its own loop, but they mount together with the same duration,
 * so they stay visually in step without needing a shared clock.
 */
export function Skeleton({
  w = '100%',
  h = 12,
  r = 6,
  mt = 0,
}: {
  w?: number | `${number}%`;
  h?: number;
  r?: number;
  mt?: number;
}) {
  const opacity = useSharedValue(0.5);

  useEffect(() => {
    opacity.value = withRepeat(
      withTiming(1, { duration: PULSE_MS, easing: Easing.inOut(Easing.quad) }),
      -1,
      // Reverse, so it fades back down instead of snapping.
      true,
    );
  }, [opacity]);

  const style = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Animated.View
      style={[
        { width: w, height: h, borderRadius: r, marginTop: mt, backgroundColor: BASE },
        style,
      ]}
    />
  );
}

// One placeholder card, shaped like the cards on Home's shelves.
function ShelfCard() {
  // Mirrors the real card: a rounded photo with no chrome, then three text
  // lines. Matching it means nothing shifts when the data lands.
  return (
    <View className="w-64">
      <Skeleton w="100%" h={222} r={16} />
      <Skeleton w="70%" h={15} mt={10} />
      <Skeleton w="45%" h={13} mt={6} />
      <Skeleton w="55%" h={13} mt={6} />
    </View>
  );
}

// A section heading plus a row of cards, matching Home's real shelves so the
// layout doesn't shift when the data lands.
function ShelfSkeleton() {
  return (
    <View className="mt-6">
      <View className="mb-3 px-5">
        <Skeleton w={140} h={18} />
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        scrollEnabled={false}
        contentContainerClassName="gap-3 px-5"
      >
        <ShelfCard />
        <ShelfCard />
      </ScrollView>
    </View>
  );
}

/** Stand-in for Home's three shelves while the listings load. */
export function HomeSkeleton() {
  return (
    <View pointerEvents="none">
      <ShelfSkeleton />
      <ShelfSkeleton />
      <ShelfSkeleton />
    </View>
  );
}
