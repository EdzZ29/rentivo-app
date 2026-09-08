import { Image, type ImageSource } from 'expo-image';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useRef, useState } from 'react';
import {
  FlatList,
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
import PressableScale from '@/components/motion/PressableScale';
import { useOnboarding } from '@/lib/onboarding';

type Photo = ImageSource | number;

// The three photographs in the project, rotated through the collage so each
// slide reads differently without needing more assets.
const VENUE: Photo = require('@/assets/images/image.jpg');
const STUDIO: Photo = require('@/assets/images/onboarding.jpg');
const EVENT: Photo = require('@/assets/images/onboarding_3.jpg');

interface Slide {
  key: string;
  /** [tall left, short right, wide bottom] */
  photos: [Photo, Photo, Photo];
  title: string;
  /** Closing words of the heading, set in the brand colour. */
  titleAccent: string;
  body: string;
}

const SLIDES: Slide[] = [
  {
    key: 'all-in-one',
    photos: [VENUE, STUDIO, EVENT],
    title: 'Rent Almost',
    titleAccent: 'Anything',
    body: 'Vehicles, event gear, cameras and tools from local businesses near you.',
  },
  {
    key: 'manage',
    photos: [STUDIO, EVENT, VENUE],
    title: 'Manage It All',
    titleAccent: 'Effortlessly',
    body: 'Keep everything organized from reservations and inventory to payments and reports.',
  },
  {
    key: 'marketplace',
    photos: [EVENT, VENUE, STUDIO],
    title: 'Reach More',
    titleAccent: 'Customers',
    body: 'Upgrade to the Marketplace Plan and let customers discover, compare, and book online.',
  },
  {
    key: 'get-started',
    photos: [VENUE, EVENT, STUDIO],
    title: 'Ready to',
    titleAccent: 'Get Started?',
    body: 'Join Rentivo today and experience a smarter way to manage and grow your rental business.',
  },
];

const LAST = SLIDES.length - 1;

// Both footer buttons are exactly this tall, so the empty second slot on the
// first three slides reserves precisely the right space.
const BUTTON_HEIGHT = 56;

/**
 * A three-photo collage: one tall tile, one short beside it, one wide beneath.
 * The bottom tile is nudged in from the left so the block reads as an
 * arrangement rather than a grid.
 */
function Collage({ photos }: { photos: [Photo, Photo, Photo] }) {
  const tile = 'overflow-hidden rounded-3xl bg-slate-100';
  return (
    <View>
      <View className="flex-row gap-3">
        <View style={{ flex: 1.15, height: 188 }} className={tile}>
          <Image source={photos[0]} style={{ flex: 1 }} contentFit="cover" transition={220} />
        </View>
        <View style={{ flex: 1 }}>
          <View style={{ height: 132 }} className={tile}>
            <Image source={photos[1]} style={{ flex: 1 }} contentFit="cover" transition={220} />
          </View>
        </View>
      </View>

      <View style={{ height: 124 }} className={`${tile} ml-7 mt-3`}>
        <Image source={photos[2]} style={{ flex: 1 }} contentFit="cover" transition={220} />
      </View>

      {/* The app mark, tucked into the corner of the arrangement. */}
      <View
        className="absolute -bottom-3 right-1 h-12 w-12 items-center justify-center rounded-2xl bg-white"
        style={{
          shadowColor: '#006e59',
          shadowOpacity: 0.18,
          shadowRadius: 10,
          shadowOffset: { width: 0, height: 4 },
          elevation: 4,
        }}
      >
        {/* The mark, not the 1024px app icon — a 34px badge shouldn't carry a
            4 MB bitmap. */}
        <Image
          source={require('@/assets/images/logo-green.png')}
          style={{ width: 26, height: 26 }}
          contentFit="contain"
        />
      </View>
    </View>
  );
}

export default function Onboarding() {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { dismiss } = useOnboarding();
  const listRef = useRef<FlatList<Slide>>(null);
  const [index, setIndex] = useState(0);
  const [pageHeight, setPageHeight] = useState(0);
  // Live scroll offset. The indicator reads this rather than `index`, so it
  // tracks the drag itself instead of snapping once the page settles.
  const scrollX = useSharedValue(0);

  // Dismissing flips the route guard in the root layout, and expo-router lands
  // on Home by itself — no navigation call needed.
  const browseAsGuest = () => dismiss();

  // Skip jumps to the closing slide rather than leaving the intro, so the
  // sign-in / guest choice is still made deliberately. `index` is left to
  // onScroll so it tracks the animation instead of jumping ahead of it.
  const skipToEnd = () =>
    listRef.current?.scrollToOffset({ offset: LAST * width, animated: true });

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
    <View className="flex-1 bg-white">
      <StatusBar style="dark" />

      {/* Skip sits above the pager so it stays put while pages move. */}
      <View
        style={{ paddingTop: insets.top + 6 }}
        className="h-11 flex-row items-center justify-end px-7"
      >
        {!isLast ? (
          <PressableScale
            onPress={skipToEnd}
            accessibilityRole="button"
            accessibilityLabel="Skip to the last step"
            hitSlop={12}
          >
            <Text className="font-sans text-sm text-slate-400">Skip</Text>
          </PressableScale>
        ) : (
          // Keeps the row's height steady once Skip goes away.
          <View style={{ height: 20 }} />
        )}
      </View>

      {/* Only this area pages. The indicator and the actions below sit outside
          the list, so swiping moves the collage and its copy while everything
          else stays exactly where it is. */}
      <View className="flex-1" onLayout={(e) => setPageHeight(e.nativeEvent.layout.height)}>
        {pageHeight > 0 && (
          <FlatList
            ref={listRef}
            data={SLIDES}
            keyExtractor={(s) => s.key}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            scrollEventThrottle={16}
            onScroll={onScroll}
            // Each page carries three photographs, so keep the mounted window
            // tight rather than rendering all four pages up front.
            initialNumToRender={1}
            maxToRenderPerBatch={1}
            windowSize={2}
            renderItem={({ item }) => (
              <View style={{ width, height: pageHeight }} className="justify-center px-7">
                <Collage photos={item.photos} />

                <View className="mt-2">
                  <Text className="text-[30px] font-display-bold mt-5 text-slate-900">
                    {item.title}
                  </Text>
                  <Text className="text-[30px] font-display-bold text-brand">
                    {item.titleAccent}
                  </Text>
                  <Text className="font-sans mt-3 text-[13px]  text-slate-500">
                    {item.body}
                  </Text>
                </View>
              </View>
            )}
          />
        )}
      </View>

      {/* Fixed footer. The second slot keeps its height on every slide even
          when empty: a footer that grew on the last page would resize the
          pager above it and shift the collage mid-swipe. */}
      <View style={{ paddingBottom: insets.bottom + 20 }} className="bg-white px-7 pt-2">
        <Dots scrollX={scrollX} width={width} className="mb-6" />
        <FilledButton
          label={isLast ? 'Sign In' : 'Create Account'}
          onPress={() => goToAuth(!isLast)}
        />
        <View className="mt-3" style={{ height: BUTTON_HEIGHT }}>
          {isLast && <OutlineButton label="Continue as Guest" onPress={browseAsGuest} />}
        </View>
      </View>
    </View>
  );
}

function FilledButton({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <PressableScale
      onPress={onPress}
      accessibilityRole="button"
      className="h-14 items-center justify-center rounded-2xl bg-brand active:bg-brand-dark"
    >
      <Text className="text-[13px] font-bold tracking-[1.5px] text-white">
        {label.toUpperCase()}
      </Text>
    </PressableScale>
  );
}

function OutlineButton({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <PressableScale
      onPress={onPress}
      accessibilityRole="button"
      className="h-14 items-center justify-center rounded-2xl border border-brand active:bg-brand/10"
    >
      <Text className="text-[13px] font-bold tracking-[1.5px] text-brand">
        {label.toUpperCase()}
      </Text>
    </PressableScale>
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
      backgroundColor: interpolateColor(distance, [0, 1], ['#006e59', '#e2e8f0']),
    };
  });

  return <Animated.View style={[{ height: DOT, borderRadius: DOT / 2 }, style]} />;
}
