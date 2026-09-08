import { Easing } from 'react-native-reanimated';

/**
 * Motion tokens.
 *
 * Everything animated in the app pulls its timing from here, so screens,
 * lists and buttons share one feel rather than each inventing its own.
 * Durations are deliberately short — this is interface feedback, not
 * decoration, and anything slower starts to feel laggy.
 */

export const DURATION = {
  /** Press feedback and other immediate responses. */
  fast: 140,
  /** The default for entrances. */
  base: 240,
  /** Larger surfaces that travel further. */
  slow: 340,
} as const;

/** Decelerating: fast to start, settles gently. Right for things arriving. */
export const EASE_OUT = Easing.out(Easing.cubic);

/** Press in/out. Slightly over-damped so it settles without wobbling. */
export const SPRING_PRESS = {
  damping: 18,
  stiffness: 320,
  mass: 0.6,
} as const;

/** How far an entering element travels, in points. */
export const TRAVEL = 14;

/** How much a pressed surface shrinks. */
export const PRESS_SCALE = 0.97;

// Gap between staggered siblings. Capped so a long list doesn't leave the last
// rows waiting seconds to appear.
const STEP_MS = 45;
const MAX_STEPS = 8;

/** Delay for the i-th element in a staggered group. */
export function stagger(index: number): number {
  return Math.min(index, MAX_STEPS) * STEP_MS;
}
