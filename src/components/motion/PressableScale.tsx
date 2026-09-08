import type { ComponentProps } from 'react';
import { Pressable, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { DURATION, PRESS_SCALE, SPRING_PRESS } from '@/lib/motion';

interface Props extends PressableProps {
  children: React.ReactNode;
  /** Utility classes for the pressable surface itself. */
  className?: string;
  /**
   * Layout for the animated wrapper. Needed because the wrapper is an
   * Animated.View, which takes no className — pass `{ flex: 1 }` here for a
   * button that has to stretch inside a row.
   */
  wrapperStyle?: StyleProp<ViewStyle>;
  /** How far to shrink. 1 disables the scale and keeps just the dim. */
  scaleTo?: number;
  /** Set false for large surfaces where dimming looks heavy-handed. */
  dim?: boolean;
  /** Entrance animation, forwarded to the wrapper so rows can stagger in. */
  entering?: ComponentProps<typeof Animated.View>['entering'];
}

/**
 * A Pressable that dips under your finger.
 *
 * The scale lives on a wrapping Animated.View rather than the Pressable, since
 * Nativewind's className polyfill and Reanimated's animated components don't
 * compose — this way the surface keeps its utility classes and the wrapper
 * carries the transform.
 *
 * Driven by a spring rather than a duration: a press is an interruptible
 * gesture, and a spring picks up mid-flight if you release early instead of
 * finishing an animation you've already abandoned.
 */
export default function PressableScale({
  children,
  className,
  wrapperStyle,
  scaleTo = PRESS_SCALE,
  dim = true,
  disabled,
  onPressIn,
  onPressOut,
  entering,
  ...rest
}: Props) {
  const pressed = useSharedValue(0);

  const animated = useAnimatedStyle(() => ({
    transform: [{ scale: 1 - pressed.value * (1 - scaleTo) }],
    opacity: dim ? 1 - pressed.value * 0.15 : 1,
  }));

  return (
    <Animated.View entering={entering} style={[wrapperStyle, animated]}>
      <Pressable
        className={className}
        disabled={disabled}
        onPressIn={(e) => {
          // A disabled Pressable still fires nothing, but guard anyway so a
          // dimmed button never appears to respond.
          if (!disabled) pressed.value = withSpring(1, SPRING_PRESS);
          onPressIn?.(e);
        }}
        onPressOut={(e) => {
          // Timing on the way back: the spring's overshoot reads as a bounce
          // when the finger has already left.
          pressed.value = withTiming(0, { duration: DURATION.fast });
          onPressOut?.(e);
        }}
        {...rest}
      >
        {children}
      </Pressable>
    </Animated.View>
  );
}
