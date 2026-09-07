import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import {
  FlatList,
  Pressable,
  Text,
  useWindowDimensions,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import Animated, {
  interpolate,
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  type SharedValue,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ArtAllInOne,
  ArtGetStarted,
  ArtManage,
  ArtMarketplace,
} from '@/components/OnboardingArt';
import { useOnboarding } from '@/lib/onboarding';

interface Slide {
  key: string;
  art: () => React.ReactElement;
  title: string;
  body: string;
}

const SLIDES: Slide[] = [
  {
    key: 'all-in-one',
    art: ArtAllInOne,
    title: 'All in One Place',
    body: 'Manage bookings, inventory, customers, payments and more with Rentivo.',
  },
  {
    key: 'manage',
    art: ArtManage,
    title: 'Manage Effortlessly',
    body: 'Keep everything organized — from reservations and inventory to payments and reports.',
  },
  {
    key: 'marketplace',
    art: ArtMarketplace,
    title: 'Reach More Customers',
    body: 'Upgrade to the Marketplace Plan and let customers discover, compare, and book online.',
  },
  {
    key: 'get-started',
    art: ArtGetStarted,
    title: 'Ready to Get Started?',
    body: 'Join Rentivo today and experience a smarter way to manage and grow your rental business.',
  },
];

const LAST = SLIDES.length - 1;

export default function Onboarding() {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { dismiss } = useOnboarding();
  const [index, setIndex] = useState(0);
  const [pageHeight, setPageHeight] = useState(0);
  // Live scroll offset. The indicator reads this rather than `index`, so it
  // tracks the drag itself instead of snapping once the page settles.
  const scrollX = useSharedValue(0);

  // Guest and Skip: dismissing flips the route guard in the root layout, and
  // expo-router lands on Home by itself — no navigation call needed.
  const browseAsGuest = () => dismiss();

  // Sign in / create account: push the credentials screen and deliberately do
  // NOT dismiss. The intro stays mounted underneath, so backing out of the form
  // returns here instead of dumping the user into the tabs. A successful sign
  // in flips the guard on its own, because `user` is what it reads.
  const goToAuth = (register = false) =>
    router.push(register ? '/sign-in?mode=register' : '/sign-in');

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const x = e.nativeEvent.contentOffset.x;
    scrollX.value = x;
    // Flip the footer's label as the halfway point is crossed, so the button
    // already reads correctly by the time the page settles.
    const next = Math.round(x / width);
    if (next !== index) setIndex(next);
  };

  const isLast = index === LAST;

  return (
    // Full-bleed: the artwork runs edge to edge and under the status bar, so
    // insets are applied to the content rather than to a SafeAreaView frame.
    <View className="flex-1 bg-night">
      <StatusBar style="light" />

      {/* Only this area pages. The indicator and the actions below sit outside
          the list, so swiping moves the artwork and its copy while everything
          else stays exactly where it is. */}
      <View className="flex-1" onLayout={(e) => setPageHeight(e.nativeEvent.layout.height)}>
        {pageHeight > 0 && (
          <FlatList
            data={SLIDES}
            keyExtractor={(s) => s.key}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            scrollEventThrottle={16}
            onScroll={onScroll}
            renderItem={({ item }) => {
              const Art = item.art;
              return (
                <View style={{ width, height: pageHeight }}>
                  <View
                    style={{ paddingTop: insets.top + 56 }}
                    className="absolute inset-x-0 top-0 items-center"
                  >
                    <Art />
                  </View>
                  {/* Styled inline, not with className: Nativewind's polyfill
                      only covers react-native's own components plus
                      safe-area-context, so a className here would be dropped
                      and the scrim would never position. */}
                  <LinearGradient
                    colors={['transparent', 'rgba(8,21,28,0.75)', '#08151c']}
                    locations={[0, 0.45, 0.72]}
                    style={{
                      position: 'absolute',
                      left: 0,
                      right: 0,
                      bottom: 0,
                      top: '30%',
                    }}
                  />
                  <View className="absolute inset-x-0 bottom-0 px-7">
                    <Text className="text-[32px] font-bold leading-10 text-white">
                      {item.title}
                    </Text>
                    <Text className="mt-3 text-[15px] leading-6 text-white/60">
                      {item.body}
                    </Text>
                  </View>
                </View>
              );
            }}
          />
        )}
      </View>

      {/* Fixed footer. Two slots on every slide so its height never changes —
          a footer that grew on the last page would resize the pager above it
          and shift the artwork mid-swipe. */}
      <View style={{ paddingBottom: insets.bottom + 20 }} className="bg-night px-7 pt-7">
        <Dots scrollX={scrollX} width={width} className="mb-6" />
        <FilledButton
          label={isLast ? 'Sign In' : 'Create Account'}
          onPress={() => goToAuth(!isLast)}
        />
        <View className="mt-3">
          <OutlineButton label="Continue as Guest" onPress={browseAsGuest} />
        </View>
      </View>

      {/* Skip sits above the pager so it stays put while pages move. */}
      {!isLast && (
        <Pressable
          onPress={browseAsGuest}
          accessibilityRole="button"
          accessibilityLabel="Skip onboarding"
          hitSlop={12}
          style={{ top: insets.top + 8 }}
          className="absolute right-6"
        >
          <Text className="text-xs font-semibold tracking-[2px] text-white/70">SKIP</Text>
        </Pressable>
      )}
    </View>
  );
}

function FilledButton({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      className="items-center rounded-2xl bg-white py-[18px] active:bg-white/80"
    >
      <Text className="text-[13px] font-bold tracking-[1.5px] text-night">
        {label.toUpperCase()}
      </Text>
    </Pressable>
  );
}

function OutlineButton({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      className="items-center rounded-2xl border border-white/40 py-[18px] active:bg-white/10"
    >
      <Text className="text-[13px] font-bold tracking-[1.5px] text-white">
        {label.toUpperCase()}
      </Text>
    </Pressable>
  );
}

// Active page is a stretched pill, the rest stay dots.
function Dots({
  scrollX,
  width,
  className,
}: {
  scrollX: SharedValue<number>;
  width: number;
  className?: string;
}) {
  return (
    <View className={`flex-row items-center justify-center gap-2 ${className ?? ''}`}>
      {SLIDES.map((s, i) => (
        <Dot key={s.key} i={i} scrollX={scrollX} width={width} />
      ))}
    </View>
  );
}

const DOT = 8;
const PILL = 32;

/**
 * One step marker, sized and tinted by how far the pager currently is from its
 * page. Because it interpolates a continuous distance rather than switching on
 * a settled index, the pill stretches and fades across the whole swipe — and
 * unwinds just as smoothly if the gesture is dragged back.
 *
 * Reanimated's Animated.View takes no className (Nativewind only rewrites
 * react-native's own components), so this is styled inline.
 */
function Dot({
  i,
  scrollX,
  width,
}: {
  i: number;
  scrollX: SharedValue<number>;
  width: number;
}) {
  const style = useAnimatedStyle(() => {
    // 0 while this page fills the screen, 1 once a full page away.
    const distance =
      width > 0 ? Math.min(Math.abs(scrollX.value / width - i), 1) : i === 0 ? 0 : 1;

    return {
      width: interpolate(distance, [0, 1], [PILL, DOT]),
      backgroundColor: interpolateColor(
        distance,
        [0, 1],
        ['#ffffff', 'rgba(255,255,255,0.3)'],
      ),
    };
  });

  return <Animated.View style={[{ height: DOT, borderRadius: DOT / 2 }, style]} />;
}
