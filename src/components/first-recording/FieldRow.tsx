import React, { useEffect } from 'react';
import { Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { makeStyles, moderateScale, scale, typography, useTheme, verticalScale } from '@/theme';

type IconRef = React.ComponentType<{ size?: number; color?: string; strokeWidth?: number }>;

interface FieldRowProps {
  label: string;
  value: string;
  Icon: IconRef;
  tint: string;
  index: number;
}

export const FieldRow: React.FC<FieldRowProps> = ({ label, value, Icon, tint, index }) => {
  const { colors } = useTheme();
  const styles = useStyles();
  const opacity = useSharedValue(0);
  const ty = useSharedValue(8);

  useEffect(() => {
    opacity.value = withTiming(1, {
      duration: 320,
      easing: Easing.out(Easing.cubic),
    });
    ty.value = withSpring(0, { damping: 18, stiffness: 140 });
  }, [index, opacity, ty]);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: ty.value }],
  }));

  return (
    <Animated.View style={[styles.row, { backgroundColor: colors.bgPrimary }, style]}>
      <View style={[styles.icon, { backgroundColor: tint + '22' }]}>
        <Icon size={16} color={tint} strokeWidth={2} />
      </View>
      <Text
        style={[typography.label, { color: colors.textTertiary, width: 64 }]}
      >
        {label}
      </Text>
      <Text
        style={[
          typography.body,
          {
            color: colors.textPrimary,
            fontFamily: 'DMSans_600SemiBold',
            flex: 1,
          },
        ]}
      >
        {value}
      </Text>
    </Animated.View>
  );
};

const useStyles = makeStyles((theme) => ({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(12),
    paddingHorizontal: scale(12),
    paddingVertical: verticalScale(8),
    borderRadius: theme.radius.sm,
  },
  icon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
}));
