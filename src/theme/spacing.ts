import { moderateScale } from './responsive';

/**
 * 8-pt spacing scale, responsively scaled against the iPhone-14
 * reference. `moderateScale` gives small phones a tighter rhythm and
 * large phones slightly more breathing room without distorting
 * proportions.
 */
export const spacing = {
  s1: moderateScale(4),
  s2: moderateScale(8),
  s3: moderateScale(12),
  s4: moderateScale(16),
  s5: moderateScale(20),
  s6: moderateScale(24),
  s8: moderateScale(32),
  s10: moderateScale(40),
  s12: moderateScale(48),
} as const;

export const screenEdge = spacing.s6;
