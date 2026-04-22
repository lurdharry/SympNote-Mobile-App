import React, { useEffect } from 'react';
import { Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { Check } from 'lucide-react-native';
import { makeStyles, moderateScale, useTheme } from '../../../theme';
import {
  PlanItem,
  QUALIFIER_TIMINGS,
} from '../../../constants/onboarding';

type Props = {
  item: PlanItem;
  index: number;
};

/** A single unlocked row inside the plan card. Fades + slides in with a
 *  staggered delay proportional to its index. */
export function PlanRow({ item, index }: Props) {
  const { colors } = useTheme();
  const styles = useStyles();
  const opacity = useSharedValue(0);
  const ty = useSharedValue(6);
  useEffect(() => {
    const delay = index * QUALIFIER_TIMINGS.planRowStaggerMs;
    opacity.value = withDelay(
      delay,
      withTiming(1, {
        duration: QUALIFIER_TIMINGS.planRowDurationMs,
        easing: Easing.out(Easing.cubic),
      })
    );
    ty.value = withDelay(
      delay,
      withSpring(0, { damping: 18, stiffness: 140 })
    );
  }, [index, opacity, ty]);
  const animStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: ty.value }],
  }));
  return (
    <Animated.View style={[styles.row, animStyle]}>
      <View style={styles.iconSlot}>
        <item.Icon size={moderateScale(14)} color={colors.accent} strokeWidth={2} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.sub}>{item.sub}</Text>
      </View>
      <Check size={moderateScale(12)} color={colors.success} strokeWidth={3} />
    </Animated.View>
  );
}

const useStyles = makeStyles((theme) => ({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: moderateScale(8),
  },
  iconSlot: {
    width: moderateScale(20),
    height: moderateScale(20),
    marginTop: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    ...theme.typography.label,
    color: theme.colors.textPrimary,
    fontFamily: 'DMSans_600SemiBold',
  },
  sub: {
    ...theme.typography.caption,
    color: theme.colors.textTertiary,
    marginTop: 1,
  },
}));
