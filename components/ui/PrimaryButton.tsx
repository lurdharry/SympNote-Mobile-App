import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { makeStyles, primaryGradient } from '../../theme';
import { hapticMedium } from '../../services/haptics';

/**
 * Primary CTA per design handoff.
 *
 *  - 56px pill, 3-stop teal gradient, accent glow shadow
 *  - Inner top highlight (subtle white inset)
 *  - 120ms press scale → 0.98, medium haptic
 */
type Props = {
  label: string;
  onPress?: () => void;
  icon?: React.ReactNode;
  disabled?: boolean;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function PrimaryButton({
  label,
  onPress,
  icon,
  disabled,
  loading,
  style,
}: Props) {
  const styles = useStyles();
  const scale = useSharedValue(1);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handle = () => {
    if (disabled || loading) return;
    hapticMedium();
    onPress?.();
  };

  return (
    <Animated.View style={[animStyle, style]}>
      <Pressable
        onPress={handle}
        onPressIn={() => {
          scale.value = withSpring(0.98, { damping: 22, stiffness: 280 });
        }}
        onPressOut={() => {
          scale.value = withSpring(1, { damping: 18, stiffness: 160 });
        }}
        disabled={disabled || loading}
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityState={{ disabled: !!disabled, busy: !!loading }}
      >
        <View style={[styles.shell, { opacity: disabled ? 0.4 : 1 }]}>
          <LinearGradient
            colors={[
              primaryGradient[0],
              primaryGradient[1],
              primaryGradient[2],
            ]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          <View pointerEvents="none" style={styles.innerHighlight} />
          <View style={styles.content}>
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <Text style={styles.label}>{label}</Text>
                {icon ? <View style={{ marginLeft: 8 }}>{icon}</View> : null}
              </>
            )}
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
}

const useStyles = makeStyles((theme) => ({
  shell: {
    height: 56,
    borderRadius: theme.radius.full,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.shadows.accentGlow,
  },
  innerHighlight: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.s6,
  },
  label: {
    color: '#FFFFFF',
    fontFamily: 'Inter_600SemiBold',
    fontSize: 17,
    letterSpacing: -0.17,
  },
}));
