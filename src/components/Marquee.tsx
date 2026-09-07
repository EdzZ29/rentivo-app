import { useEffect, useState } from 'react';
import { Text, useWindowDimensions, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

/**
 * A continuously scrolling ticker.
 *
 * The trick to a seamless loop is translating by exactly one copy's width: at
 * the moment the first copy has slid fully out of view, the next copy sits
 * precisely where it started, so resetting to 0 is invisible. That means the
 * strip has to be wide enough that a copy is always covering the screen, hence
 * the copy count derived from the measured width below.
 *
 * Animated.View takes no className — Nativewind only rewrites react-native's
 * own components — so the moving row is styled inline.
 */
export default function Marquee({
  items,
  /** Scroll speed in points per second. */
  speed = 55,
}: {
  items: string[];
  speed?: number;
}) {
  const { width: screenWidth } = useWindowDimensions();
  const [copyWidth, setCopyWidth] = useState(0);
  const x = useSharedValue(0);

  useEffect(() => {
    if (copyWidth <= 0) return;
    x.value = 0;
    x.value = withRepeat(
      withTiming(-copyWidth, {
        // Constant speed regardless of how much text there is.
        duration: (copyWidth / speed) * 1000,
        easing: Easing.linear,
      }),
      -1,
      false,
    );
  }, [copyWidth, speed, x]);

  const style = useAnimatedStyle(() => ({
    transform: [{ translateX: x.value }],
  }));

  // One copy scrolls off while the rest cover the screen behind it.
  const copies =
    copyWidth > 0 ? Math.max(2, Math.ceil(screenWidth / copyWidth) + 1) : 2;

  return (
    <View className="overflow-hidden bg-night py-3">
      <Animated.View style={[{ flexDirection: 'row' }, style]}>
        {Array.from({ length: copies }, (_, copy) => (
          <View
            key={copy}
            className="flex-row items-center"
            // Only the first copy is measured; they're identical.
            onLayout={
              copy === 0
                ? (e) => setCopyWidth(e.nativeEvent.layout.width)
                : undefined
            }
          >
            {items.map((text, i) => (
              <View key={`${copy}-${i}`} className="flex-row items-center">
                <Text className="text-[11px] font-semibold tracking-[1.2px] text-white">
                  {text.toUpperCase()}
                </Text>
                <View className="mx-4 h-1 w-1 rounded-full bg-accent" />
              </View>
            ))}
          </View>
        ))}
      </Animated.View>
    </View>
  );
}
