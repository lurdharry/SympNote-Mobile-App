import { moderateScale } from './responsive';

/**
 * Corner-radius scale. Moderate-scaled so rounded corners feel tighter
 * on small phones and softer on large ones. `full` stays the sentinel
 * value — `9999` is already "always a perfect pill" on any width.
 */
export const radius = {
  sm: moderateScale(8),
  md: moderateScale(12),
  lg: moderateScale(16),
  xl: moderateScale(24),
  full: 9999,
} as const;
