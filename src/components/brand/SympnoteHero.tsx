import React, { useEffect } from "react";
import { Image, StyleSheet, View } from "react-native";
import Animated, {
  Easing,
  SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import { useReducedMotion } from "../../hooks/useReducedMotion";
import { moderateScale } from "../../theme";

const ICON = require("../../../assets/icon.png");

/**
 * Hero version of the brand mark with two staggered pulse rings (per
 * design handoff: 1.8s, one offset by 0.9s, scale 1 → 1.35, opacity
 * 0.45 → 0). Renders the app-icon PNG at the centre so the hero
 * matches exactly what's pinned to the home screen.
 *
 * Ring 1 uses a warm gold tint (`#F6C06A` at 35%); ring 2 uses a
 * teal tint (`#3BA79F` at 25%) so the two rings read as distinct
 * layers under the logo.
 */
type Props = { size?: number };

export const SympnoteHero: React.FC<Props> = ({ size = moderateScale(128) }) => {
  const reduced = useReducedMotion();
  const ring1 = useSharedValue(0);
  const ring2 = useSharedValue(0);

  useEffect(() => {
    if (reduced) return;
    const loop = (sv: SharedValue<number>, delay: number) => {
      sv.value = withDelay(
        delay,
        withRepeat(
          withTiming(1, {
            duration: 1800,
            easing: Easing.bezier(0.4, 0, 0.6, 1),
          }),
          -1,
          false,
        ),
      );
    };
    loop(ring1, 0);
    loop(ring2, 900);
  }, [reduced, ring1, ring2]);

  const ringStyle = (sv: SharedValue<number>) =>
    useAnimatedStyle(() => ({
      transform: [{ scale: 1 + sv.value * 0.35 }],
      opacity: 0.45 * (1 - sv.value),
    }));

  const ring1Style = ringStyle(ring1);
  const ring2Style = ringStyle(ring2);
  const radius = size * 0.22;

  return (
    <View style={{ width: size, height: size }}>
      {/* Ring 1 — gold-warm tint */}
      <Animated.View
        style={[
          StyleSheet.absoluteFill,
          styles.ring,
          { borderRadius: radius, backgroundColor: "#F6C06A" },
          ring1Style,
        ]}
        pointerEvents="none"
      />
      {/* Ring 2 — bright teal tint, offset 900ms */}
      <Animated.View
        style={[
          StyleSheet.absoluteFill,
          styles.ring,
          { borderRadius: radius, backgroundColor: "#3BA79F" },
          ring2Style,
        ]}
        pointerEvents="none"
      />
      <Image
        source={ICON}
        style={{ width: size, height: size, borderRadius: radius }}
        resizeMode="cover"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  ring: {
    opacity: 0,
  },
});
