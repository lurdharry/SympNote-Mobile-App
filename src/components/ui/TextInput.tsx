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
import { makeStyles, moderateScale, useTheme } from '../../theme';

type Props = TextInputProps & {
  label?: string;
};

export function TextInput({ label, style, onFocus, onBlur, ...rest }: Props) {
  const { colors } = useTheme();
  const styles = useStyles();
  const [focused, setFocused] = useState(false);
  const border = useSharedValue(0);

  const anim = useAnimatedStyle(() => ({
    borderColor: focused ? colors.accent : colors.border,
    shadowOpacity: border.value * 0.1,
  }));

  return (
    <View>
      {label && <Text style={styles.label}>{label}</Text>}
      <Animated.View style={[styles.wrap, anim]}>
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
          style={[styles.input, style]}
          {...rest}
        />
      </Animated.View>
    </View>
  );
}

const useStyles = makeStyles((theme) => ({
  label: {
    ...theme.typography.label,
    color: theme.colors.textSecondary,
    marginBottom: moderateScale(6),
  },
  wrap: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.bgSurface,
  },
  input: {
    ...theme.typography.body,
    color: theme.colors.textPrimary,
    padding: theme.spacing.s4,
  },
}));
