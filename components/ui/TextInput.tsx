import React, { useState } from 'react';
import {
  StyleSheet,
  TextInput as RNTextInput,
  TextInputProps,
  View,
  Text,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import { useTheme, radius, spacing, typography } from '../../theme';

type Props = TextInputProps & {
  label?: string;
};

export function TextInput({ label, style, onFocus, onBlur, ...rest }: Props) {
  const { colors } = useTheme();
  const [focused, setFocused] = useState(false);
  const border = useSharedValue(0);

  const anim = useAnimatedStyle(() => ({
    borderColor: focused ? colors.accent : colors.border,
    shadowOpacity: border.value * 0.1,
  }));

  return (
    <View>
      {label && (
        <Text style={[typography.label, { color: colors.textSecondary, marginBottom: 6 }]}>
          {label}
        </Text>
      )}
      <Animated.View style={[styles.wrap, { backgroundColor: colors.bgSurface }, anim]}>
        <RNTextInput
          placeholderTextColor={colors.textTertiary}
          onFocus={(e) => {
            setFocused(true);
            border.value = withTiming(1, { duration: 180 });
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            border.value = withTiming(0, { duration: 180 });
            onBlur?.(e);
          }}
          style={[
            typography.body,
            { color: colors.textPrimary, padding: spacing.s4 },
            style,
          ]}
          {...rest}
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radius.md,
  },
});
