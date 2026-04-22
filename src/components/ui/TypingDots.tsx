import React, { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { moderateScale, useTheme } from "../../theme";
import { useReducedMotion } from "../../hooks/useReducedMotion";

export function TypingDots() {
  const { colors } = useTheme();
  return (
    <View style={styles.row}>
      {[0, 160, 320].map((delay) => (
        <Dot key={delay} delay={delay} color={colors.textTertiary} />
      ))}
    </View>
  );
}

function Dot({ delay, color }: { delay: number; color: string }) {
  const reduced = useReducedMotion();
  const t = useSharedValue(0);
  useEffect(() => {
    if (reduced) return;
    t.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 330, easing: Easing.out(Easing.quad) }),
          withTiming(0, { duration: 770, easing: Easing.inOut(Easing.quad) }),
        ),
        -1,
        false,
      ),
    );
  }, [delay, reduced, t]);
  const style = useAnimatedStyle(() => ({
    transform: [{ translateY: -moderateScale(4) * t.value }],
    opacity: 0.5 + t.value * 0.5,
  }));
  return <Animated.View style={[styles.dot, { backgroundColor: color }, style]} />;
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: moderateScale(6) },
  dot: {
    width: moderateScale(6),
    height: moderateScale(6),
    borderRadius: moderateScale(3),
  },
});
