import React, { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
  Easing,
  type SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import Svg, {
  Circle,
  Defs,
  LinearGradient as SvgLinearGradient,
  Path,
  Rect,
  Stop,
} from "react-native-svg";
import { moderateScale } from "@/theme";
import { useReducedMotion } from "@/hooks/useReducedMotion";

interface VaultMascotProps {
  reduced?: boolean;
  /** Square size — the mascot fits a square wrapper. */
  size?: number;
}

/**
 * The Vault — a cream padlock-shaped character mid-opening. Body
 * is a rounded rectangle in cream/cream-gradient with teal trim,
 * face has two eyes above a keyhole that doubles as a smile-shaped
 * mouth. The shackle on top rotates open ~28° on a loop, paused
 * at each end, with two gold sparkles popping at the open-peak.
 * A soft gold light pulses inside the body, suggesting value
 * being unlocked.
 *
 * Anchors the paywall as a kin to PocketbookMascot — same
 * paper-clinical palette + halo + blink language, different
 * anatomy + reading: this one says "unlock," Pocketbook says
 * "capacity to hold." Caller picks one.
 */
export const VaultMascot: React.FC<VaultMascotProps> = ({
  reduced: reducedProp,
  size = moderateScale(180),
}) => {
  const reducedSystem = useReducedMotion();
  const reduced = reducedProp ?? reducedSystem;

  const bob = useSharedValue(0);
  const shackle = useSharedValue(0); // 0 = closed, 1 = open
  const glow = useSharedValue(0);
  const blink = useSharedValue(1);
  const sparkleA = useSharedValue(0);
  const sparkleB = useSharedValue(0);
  const halo = useSharedValue(0);

  useEffect(() => {
    if (reduced) return;
    bob.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.sin) }),
        withTiming(0, { duration: 1500, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
      false,
    );
    shackle.value = withRepeat(
      withSequence(
        withDelay(800, withTiming(1, { duration: 520, easing: Easing.out(Easing.cubic) })),
        withDelay(900, withTiming(0, { duration: 460, easing: Easing.in(Easing.cubic) })),
      ),
      -1,
      false,
    );
    glow.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1300, easing: Easing.inOut(Easing.sin) }),
        withTiming(0.3, { duration: 1300, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
      false,
    );
    blink.value = withRepeat(
      withSequence(
        withDelay(3800, withTiming(0.1, { duration: 90 })),
        withTiming(1, { duration: 110 }),
      ),
      -1,
      false,
    );
    // Sparkles fire near the apex of the shackle's open swing.
    sparkleA.value = withRepeat(
      withSequence(
        withDelay(1100, withTiming(1, { duration: 360, easing: Easing.out(Easing.cubic) })),
        withTiming(0, { duration: 440 }),
        withDelay(820, withTiming(0, { duration: 0 })),
      ),
      -1,
      false,
    );
    sparkleB.value = withRepeat(
      withSequence(
        withDelay(1280, withTiming(1, { duration: 360, easing: Easing.out(Easing.cubic) })),
        withTiming(0, { duration: 440 }),
        withDelay(820, withTiming(0, { duration: 0 })),
      ),
      -1,
      false,
    );
    halo.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 2400, easing: Easing.inOut(Easing.sin) }),
        withTiming(0, { duration: 2400, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
      false,
    );
  }, [reduced, bob, shackle, glow, blink, sparkleA, sparkleB, halo]);

  const wrapStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: -bob.value * 4 }],
  }));
  const haloStyle = useAnimatedStyle(() => ({
    opacity: 0.3 + halo.value * 0.32,
    transform: [{ scale: 0.92 + halo.value * 0.1 }],
  }));
  // Shackle rotates around its right base (transformOrigin: "100% 100%").
  const shackleStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${-shackle.value * 28}deg` }],
  }));
  const glowInsideStyle = useAnimatedStyle(() => ({
    opacity: 0.35 + glow.value * 0.5,
    transform: [{ scale: 0.85 + glow.value * 0.2 }],
  }));
  const eyeStyle = useAnimatedStyle(() => ({
    transform: [{ scaleY: blink.value }],
  }));
  const sparkleStyle = (sv: SharedValue<number>) =>
    useAnimatedStyle(() => ({
      opacity: sv.value,
      transform: [{ scale: 0.5 + sv.value * 0.7 }],
    }));
  const sparkleAStyle = sparkleStyle(sparkleA);
  const sparkleBStyle = sparkleStyle(sparkleB);

  const eyeSize = size * 0.05;

  return (
    <View
      style={{
        width: size,
        height: size,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {/* Halo behind everything — gold tint to match the unlock vibe. */}
      <Animated.View
        pointerEvents="none"
        style={[
          styles.halo,
          haloStyle,
          {
            width: size * 0.88,
            height: size * 0.88,
            borderRadius: (size * 0.88) / 2,
          },
        ]}
      />

      <Animated.View
        style={[
          { width: size, height: size, alignItems: "center", justifyContent: "center" },
          wrapStyle,
        ]}
      >
        {/* Shackle — pivots from its right base so it lifts on the
            left side when "opening." The whole assembly is a small
            SVG inside an Animated.View whose transformOrigin sits at
            its right-bottom. */}
        <Animated.View
          style={[
            {
              position: "absolute",
              top: size * 0.16,
              width: size * 0.44,
              height: size * 0.32,
              transformOrigin: "100% 100%",
            },
            shackleStyle,
          ]}
        >
          <Svg width="100%" height="100%" viewBox="0 0 80 60">
            <Path
              d="M 12 60 V 28 C 12 14, 22 4, 40 4 C 58 4, 68 14, 68 28 V 60"
              stroke="#1F504E"
              strokeWidth={9}
              strokeLinecap="round"
              fill="none"
            />
            {/* Highlight — small white slip on the curve for sheen. */}
            <Path
              d="M 28 12 C 24 16, 22 22, 22 28"
              stroke="#FFFFFF"
              strokeOpacity={0.45}
              strokeWidth={2}
              strokeLinecap="round"
              fill="none"
            />
          </Svg>
        </Animated.View>

        {/* Sparkles — fire when the shackle is most open. */}
        <Animated.View
          pointerEvents="none"
          style={[styles.spark, sparkleAStyle, { top: size * 0.06, left: size * 0.18 }]}
        >
          <Sparkle size={moderateScale(11)} />
        </Animated.View>
        <Animated.View
          pointerEvents="none"
          style={[styles.spark, sparkleBStyle, { top: size * 0.12, left: size * 0.36 }]}
        >
          <Sparkle size={moderateScale(7)} />
        </Animated.View>

        {/* Lock body — cream gradient with teal trim. */}
        <View
          style={{
            position: "absolute",
            top: size * 0.42,
            width: size * 0.66,
            height: size * 0.5,
          }}
        >
          <Svg width="100%" height="100%" viewBox="0 0 100 80">
            <Defs>
              <SvgLinearGradient id="vault-body" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0" stopColor="#FFFFFF" />
                <Stop offset="1" stopColor="#E5DDC8" />
              </SvgLinearGradient>
            </Defs>
            <Rect
              x={6}
              y={4}
              width={88}
              height={72}
              rx={12}
              fill="url(#vault-body)"
              stroke="#1F504E"
              strokeWidth={2.4}
            />
            {/* Subtle accent stripe across the upper third — picks up
                the brand teal without competing with the face. */}
            <Path d="M 14 22 H 86" stroke="#2C6E6B" strokeWidth={0.8} strokeOpacity={0.25} />
          </Svg>

          {/* Inner gold light — pulses behind the keyhole, suggesting
              value being unlocked. */}
          <Animated.View
            pointerEvents="none"
            style={[
              styles.innerGlow,
              glowInsideStyle,
              {
                top: "30%",
                left: "22%",
                width: "56%",
                height: "60%",
                borderRadius: 999,
              },
            ]}
          />

          {/* Keyhole — the lock's "mouth," sits below the eyes. */}
          <Svg
            width="100%"
            height="100%"
            viewBox="0 0 100 80"
            style={StyleSheet.absoluteFillObject}
            pointerEvents="none"
          >
            <Circle cx={50} cy={50} r={5.5} fill="#1F504E" />
            <Path d="M 47 50 L 53 50 L 51.5 66 L 48.5 66 Z" fill="#1F504E" />
          </Svg>
        </View>

        {/* Eyes — sit above the keyhole on the upper face. */}
        <View
          pointerEvents="none"
          style={{
            position: "absolute",
            top: size * 0.55,
            left: 0,
            right: 0,
            flexDirection: "row",
            justifyContent: "center",
            gap: size * 0.07,
          }}
        >
          <Animated.View
            style={[
              {
                width: eyeSize,
                height: eyeSize,
                borderRadius: eyeSize / 2,
                backgroundColor: "#1F504E",
              },
              eyeStyle,
            ]}
          />
          <Animated.View
            style={[
              {
                width: eyeSize,
                height: eyeSize,
                borderRadius: eyeSize / 2,
                backgroundColor: "#1F504E",
              },
              eyeStyle,
            ]}
          />
        </View>
      </Animated.View>
    </View>
  );
};

const Sparkle: React.FC<{ size: number }> = ({ size }) => (
  <Svg width={size} height={size} viewBox="0 0 12 12">
    <Path d="M 6 0 L 7.4 4.6 L 12 6 L 7.4 7.4 L 6 12 L 4.6 7.4 L 0 6 L 4.6 4.6 Z" fill="#F6C06A" />
  </Svg>
);

const styles = StyleSheet.create({
  halo: {
    position: "absolute",
    backgroundColor: "rgba(246,192,106,0.22)",
  },
  innerGlow: {
    position: "absolute",
    backgroundColor: "rgba(246,192,106,0.55)",
  },
  spark: {
    position: "absolute",
  },
});
