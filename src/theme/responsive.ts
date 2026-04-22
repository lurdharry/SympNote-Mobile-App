import { Dimensions, PixelRatio } from 'react-native';

/**
 * Responsive scaling helpers.
 *
 * Every spec in the design system was authored against the iPhone 14
 * frame (390×844pt). The scale helpers re-project those absolutes onto
 * the running device so a card that's 48pt tall on a reference phone
 * becomes proportionally taller on an iPhone 15 Pro Max and tighter on
 * an iPhone SE — without any per-component work.
 *
 * Usage:
 * ```
 * import { scale, verticalScale, moderateScale, fontScale } from '@/theme/responsive';
 *
 * const SIZE = scale(16);            // width-proportional
 * const HEIGHT = verticalScale(48);  // height-proportional
 * const PADDING = moderateScale(16); // dampened width scale
 * const FONT = fontScale(14);        // gently scales text
 * ```
 *
 * `moderateScale` is the safer default for padding and corner radius:
 * full linear scaling on a large tablet makes everything feel like a
 * webpage; the factor dampens the growth.
 *
 * `fontScale` dampens harder still — users with large-text accessibility
 * settings drive additional scaling via the OS, so we don't want text
 * to double-grow on top of that.
 */

const REFERENCE_WIDTH = 390;
const REFERENCE_HEIGHT = 844;

const { width: rawWidth, height: rawHeight } = Dimensions.get('window');

/**
 * Cap the scale factors so tablets and tiny legacy devices don't
 * produce ridiculous results. Clamp to the iPhone SE → iPhone 15 Pro
 * Max width band; anything outside renders at the closest edge.
 */
const SCALE_WIDTH = Math.min(Math.max(rawWidth, 320), 430);
const SCALE_HEIGHT = Math.min(Math.max(rawHeight, 568), 932);

const widthRatio = SCALE_WIDTH / REFERENCE_WIDTH;
const heightRatio = SCALE_HEIGHT / REFERENCE_HEIGHT;

/** Snap to nearest pixel so rendered values don't sit on a half-pixel. */
const snap = (v: number) => PixelRatio.roundToNearestPixel(v);

/** Width-proportional scale — use for horizontal dimensions. */
export const scale = (size: number): number => snap(size * widthRatio);

/** Height-proportional scale — use for vertical dimensions. */
export const verticalScale = (size: number): number => snap(size * heightRatio);

/**
 * Dampened width scale. `factor` controls how aggressively the value
 * tracks the device width (0 = no scaling, 1 = full linear scale).
 * Default 0.5 gives a natural feel for padding, radius, gap.
 */
export const moderateScale = (size: number, factor = 0.5): number =>
  snap(size + (scale(size) - size) * factor);

/**
 * Dampened font scale. Lower factor than moderateScale so text feels
 * consistent across devices and doesn't blow up when combined with
 * OS-level large-text accessibility settings.
 */
export const fontScale = (size: number): number => moderateScale(size, 0.3);

/* -------------------------- Breakpoints -------------------------- */

export const deviceWidth = rawWidth;
export const deviceHeight = rawHeight;

/** iPhone SE and anything below — tighter padding, smaller touch targets. */
export const isSmallDevice = rawWidth < 360;

/** iPad / Android tablet territory — consider two-column layouts here. */
export const isTablet = rawWidth >= 768;
