import React from 'react';
import {
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  ViewStyle,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { fontScale, moderateScale, scale as scaleW, useTheme, verticalScale } from '../../theme';
import { hapticLight } from '../../services/haptics';

/**
 * Secondary CTA — 52px bg-muted pill with text-primary 600.
 */
type Props = {
  label: string;
  onPress?: () => void;
  icon?: React.ReactNode;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function SecondaryButton({
  label,
  onPress,
  icon,
  disabled,
  style,
}: Props) {
  const { colors } = useTheme();
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={[animStyle, style]}>
      <Pressable
        onPress={() => {
          if (disabled) return;
          hapticLight();
          onPress?.();
        }}
        onPressIn={() => {
          scale.value = withSpring(0.98, { damping: 22, stiffness: 280 });
        }}
        onPressOut={() => {
          scale.value = withSpring(1, { damping: 18, stiffness: 160 });
        }}
        disabled={disabled}
        accessibilityRole="button"
        accessibilityLabel={label}
        style={[
          styles.shell,
          {
            backgroundColor: colors.bgMuted,
            opacity: disabled ? 0.4 : 1,
          },
        ]}
      >
        <Text style={[styles.label, { color: colors.textPrimary }]}>
          {label}
        </Text>
        {icon}
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  shell: {
    height: verticalScale(52),
    borderRadius: 9999,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: moderateScale(8),
    paddingHorizontal: scaleW(20),
  },
  label: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: fontScale(15),
  },
});
