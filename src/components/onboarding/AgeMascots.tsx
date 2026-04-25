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
import Svg, { Circle, Defs, Path, RadialGradient, Stop } from "react-native-svg";
import { useReducedMotion } from "@/hooks/useReducedMotion";

/**
 * Small mascots for the qualifier age options. Each is its own
 * creature — different anatomy, different idle behaviour — so the
 * answer chips stop being a row of identical lucide icons and start
 * feeling like a cast of characters that match the energy of each
 * stage of life.
 *
 * Common props: `size` (square, including a bit of breathing room),
 * `tint` (currently unused — each mascot owns its palette to keep
 * personality distinct).
 */

interface MascotProps {
  size: number;
  tint: string;
}

const useFace = (eyeColor: string) => {
  const reduced = useReducedMotion();
  const blink = useSharedValue(1);
  useEffect(() => {
    if (reduced) return;
    blink.value = withRepeat(
      withSequence(
        withDelay(3800, withTiming(0.1, { duration: 90 })),
        withTiming(1, { duration: 110 }),
      ),
      -1,
      false,
    );
  }, [reduced, blink]);
  const blinkStyle = useAnimatedStyle(() => ({
    transform: [{ scaleY: blink.value }],
  }));
  return { blinkStyle, eyeColor };
};

// ── 1. Sprout — for "12 to 17" ─────────────────────────────────────

export const SproutMascot: React.FC<MascotProps> = ({ size }) => {
  const reduced = useReducedMotion();
  const sway = useSharedValue(0);
  const { blinkStyle } = useFace("#1F504E");
  useEffect(() => {
    if (reduced) return;
    sway.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.sin) }),
        withTiming(-1, { duration: 1500, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
      false,
    );
  }, [reduced, sway]);
  const swayStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${sway.value * 6}deg` }],
  }));
  const eyeSize = size * 0.06;
  return (
    <View style={{ width: size, height: size, alignItems: "center", justifyContent: "flex-end" }}>
      {/* Pot */}
      <View
        style={{
          width: size * 0.5,
          height: size * 0.18,
          backgroundColor: "#C88A4A",
          borderTopLeftRadius: size * 0.04,
          borderTopRightRadius: size * 0.04,
          borderBottomLeftRadius: size * 0.06,
          borderBottomRightRadius: size * 0.06,
        }}
      />
      {/* Plant — sways from base of pot */}
      <Animated.View
        style={[
          { position: "absolute", top: 0, transformOrigin: "50% 100%" },
          swayStyle,
        ]}
      >
        <Svg width={size} height={size * 0.84} viewBox="0 0 100 84">
          {/* Stem */}
          <Path d="M 50 84 Q 50 50 50 18" stroke="#5A8F6E" strokeWidth={4} strokeLinecap="round" fill="none" />
          {/* Left leaf */}
          <Path
            d="M 50 50 Q 24 38 18 18 Q 36 22 50 50 Z"
            fill="#7DB48F"
            stroke="#5A8F6E"
            strokeWidth={1.4}
            strokeLinejoin="round"
          />
          {/* Right leaf */}
          <Path
            d="M 50 36 Q 76 22 84 4 Q 70 6 50 36 Z"
            fill="#9CCFA8"
            stroke="#5A8F6E"
            strokeWidth={1.4}
            strokeLinejoin="round"
          />
        </Svg>
        {/* Face — tiny eyes on the upper stem */}
        <View
          style={{
            position: "absolute",
            top: size * 0.38,
            left: 0,
            right: 0,
            alignItems: "center",
            flexDirection: "row",
            justifyContent: "center",
            gap: size * 0.05,
          }}
        >
          <Animated.View style={[{ width: eyeSize, height: eyeSize, borderRadius: eyeSize / 2, backgroundColor: "#1F504E" }, blinkStyle]} />
          <Animated.View style={[{ width: eyeSize, height: eyeSize, borderRadius: eyeSize / 2, backgroundColor: "#1F504E" }, blinkStyle]} />
        </View>
      </Animated.View>
    </View>
  );
};

// ── 2. Spark — for "18 to 29" ──────────────────────────────────────

export const SparkMascot: React.FC<MascotProps> = ({ size }) => {
  const reduced = useReducedMotion();
  const flash = useSharedValue(0);
  const { blinkStyle } = useFace("#1F504E");
  useEffect(() => {
    if (reduced) return;
    flash.value = withRepeat(
      withSequence(
        withDelay(1800, withTiming(1, { duration: 120, easing: Easing.out(Easing.cubic) })),
        withTiming(0, { duration: 380, easing: Easing.in(Easing.cubic) }),
      ),
      -1,
      false,
    );
  }, [reduced, flash]);
  const haloStyle = useAnimatedStyle(() => ({
    opacity: 0.2 + flash.value * 0.55,
    transform: [{ scale: 0.9 + flash.value * 0.18 }],
  }));
  const eyeSize = size * 0.05;
  return (
    <View style={{ width: size, height: size, alignItems: "center", justifyContent: "center" }}>
      <Animated.View
        pointerEvents="none"
        style={[
          {
            position: "absolute",
            width: size * 0.78,
            height: size * 0.78,
            borderRadius: size * 0.39,
            backgroundColor: "rgba(246,192,106,0.45)",
          },
          haloStyle,
        ]}
      />
      <Svg width={size * 0.7} height={size * 0.92} viewBox="0 0 50 70">
        <Defs>
          <RadialGradient id="spark-grad" cx="40%" cy="30%" r="80%">
            <Stop offset="0" stopColor="#FFE0AE" />
            <Stop offset="0.5" stopColor="#F6C06A" />
            <Stop offset="1" stopColor="#E07A5F" />
          </RadialGradient>
        </Defs>
        {/* Bolt shape — gold/coral gradient */}
        <Path
          d="M 30 4 L 12 36 L 24 38 L 18 66 L 40 30 L 28 28 Z"
          fill="url(#spark-grad)"
          stroke="#C45C3F"
          strokeWidth={1.4}
          strokeLinejoin="round"
        />
      </Svg>
      <View
        style={{
          position: "absolute",
          top: size * 0.36,
          flexDirection: "row",
          gap: size * 0.04,
        }}
      >
        <Animated.View style={[{ width: eyeSize, height: eyeSize, borderRadius: eyeSize / 2, backgroundColor: "#1F504E" }, blinkStyle]} />
        <Animated.View style={[{ width: eyeSize, height: eyeSize, borderRadius: eyeSize / 2, backgroundColor: "#1F504E" }, blinkStyle]} />
      </View>
    </View>
  );
};

// ── 3. Flame — for "30 to 49" ──────────────────────────────────────

export const FlameMascot: React.FC<MascotProps> = ({ size }) => {
  const reduced = useReducedMotion();
  const flicker = useSharedValue(0);
  const { blinkStyle } = useFace("#1F504E");
  useEffect(() => {
    if (reduced) return;
    flicker.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 380, easing: Easing.inOut(Easing.sin) }),
        withTiming(-0.4, { duration: 320, easing: Easing.inOut(Easing.sin) }),
        withTiming(0.6, { duration: 280, easing: Easing.inOut(Easing.sin) }),
        withTiming(0, { duration: 360, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
      false,
    );
  }, [reduced, flicker]);
  const flickerStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: flicker.value * 1.5 },
      { scaleY: 1 + flicker.value * 0.06 },
      { scaleX: 1 - flicker.value * 0.04 },
    ],
  }));
  const eyeSize = size * 0.05;
  return (
    <View style={{ width: size, height: size, alignItems: "center", justifyContent: "flex-end" }}>
      {/* Wick base */}
      <View
        style={{
          width: size * 0.04,
          height: size * 0.1,
          backgroundColor: "#3F2A0A",
          borderRadius: 2,
          marginBottom: 2,
        }}
      />
      {/* Flame */}
      <Animated.View style={[{ position: "absolute", top: 0 }, flickerStyle]}>
        <Svg width={size * 0.74} height={size * 0.86} viewBox="0 0 60 70">
          <Defs>
            <RadialGradient id="flame-grad" cx="50%" cy="80%" r="90%">
              <Stop offset="0" stopColor="#FFE0AE" />
              <Stop offset="0.5" stopColor="#F6C06A" />
              <Stop offset="1" stopColor="#E07A5F" />
            </RadialGradient>
          </Defs>
          {/* Outer flame teardrop */}
          <Path
            d="M 30 4 Q 8 28 12 50 Q 14 66 30 66 Q 46 66 48 50 Q 52 28 30 4 Z"
            fill="url(#flame-grad)"
            stroke="#C45C3F"
            strokeWidth={1.4}
            strokeLinejoin="round"
          />
          {/* Inner highlight */}
          <Path
            d="M 30 22 Q 22 36 24 50 Q 28 58 32 58 Q 38 56 38 46 Q 38 30 30 22 Z"
            fill="#FFEAB7"
            opacity={0.6}
          />
        </Svg>
      </Animated.View>
      {/* Eyes */}
      <Animated.View
        style={[
          {
            position: "absolute",
            top: size * 0.42,
            flexDirection: "row",
            gap: size * 0.05,
          },
          flickerStyle,
        ]}
      >
        <Animated.View style={[{ width: eyeSize, height: eyeSize, borderRadius: eyeSize / 2, backgroundColor: "#1F504E" }, blinkStyle]} />
        <Animated.View style={[{ width: eyeSize, height: eyeSize, borderRadius: eyeSize / 2, backgroundColor: "#1F504E" }, blinkStyle]} />
      </Animated.View>
    </View>
  );
};

// ── 4. Pulse — for "50 to 64" ──────────────────────────────────────

export const PulseMascot: React.FC<MascotProps> = ({ size }) => {
  const reduced = useReducedMotion();
  const beat = useSharedValue(0);
  const { blinkStyle } = useFace("#1F504E");
  useEffect(() => {
    if (reduced) return;
    // Lub-dub heartbeat: quick bump, smaller bump, rest.
    beat.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 140, easing: Easing.out(Easing.cubic) }),
        withTiming(0, { duration: 220, easing: Easing.in(Easing.cubic) }),
        withDelay(80, withTiming(0.6, { duration: 140, easing: Easing.out(Easing.cubic) })),
        withTiming(0, { duration: 220, easing: Easing.in(Easing.cubic) }),
        withDelay(740, withTiming(0, { duration: 0 })),
      ),
      -1,
      false,
    );
  }, [reduced, beat]);
  const beatStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 1 + beat.value * 0.12 }],
  }));
  const eyeSize = size * 0.05;
  return (
    <View style={{ width: size, height: size, alignItems: "center", justifyContent: "center" }}>
      <Animated.View style={beatStyle}>
        <Svg width={size * 0.78} height={size * 0.78} viewBox="0 0 70 70">
          <Defs>
            <RadialGradient id="pulse-grad" cx="40%" cy="35%" r="75%">
              <Stop offset="0" stopColor="#F5A3A3" />
              <Stop offset="1" stopColor="#C45C3F" />
            </RadialGradient>
          </Defs>
          {/* Heart shape */}
          <Path
            d="M 35 60
               C 35 60, 6 44, 6 24
               C 6 14, 14 6, 22 6
               C 28 6, 33 10, 35 16
               C 37 10, 42 6, 48 6
               C 56 6, 64 14, 64 24
               C 64 44, 35 60, 35 60 Z"
            fill="url(#pulse-grad)"
            stroke="#8E2F2F"
            strokeWidth={1.6}
            strokeLinejoin="round"
          />
          {/* Pulse line traversing horizontally */}
          <Path
            d="M 8 40 L 22 40 L 26 32 L 30 48 L 34 40 L 62 40"
            stroke="#FFFFFF"
            strokeWidth={1.6}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
            opacity={0.85}
          />
        </Svg>
      </Animated.View>
      {/* Eyes */}
      <View
        style={{
          position: "absolute",
          top: size * 0.32,
          flexDirection: "row",
          gap: size * 0.06,
        }}
      >
        <Animated.View style={[{ width: eyeSize, height: eyeSize, borderRadius: eyeSize / 2, backgroundColor: "#1F504E" }, blinkStyle]} />
        <Animated.View style={[{ width: eyeSize, height: eyeSize, borderRadius: eyeSize / 2, backgroundColor: "#1F504E" }, blinkStyle]} />
      </View>
    </View>
  );
};

// ── 5. Star — for "65 or older" ────────────────────────────────────

export const StarMascot: React.FC<MascotProps> = ({ size }) => {
  const reduced = useReducedMotion();
  const spin = useSharedValue(0);
  const glow = useSharedValue(0);
  const { blinkStyle } = useFace("#1F504E");
  useEffect(() => {
    if (reduced) return;
    spin.value = withRepeat(
      withTiming(1, { duration: 22000, easing: Easing.linear }),
      -1,
      false,
    );
    glow.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1900, easing: Easing.inOut(Easing.sin) }),
        withTiming(0, { duration: 1900, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
      false,
    );
  }, [reduced, spin, glow]);
  const spinStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${spin.value * 360}deg` }],
  }));
  const haloStyle = useAnimatedStyle(() => ({
    opacity: 0.25 + glow.value * 0.5,
    transform: [{ scale: 0.9 + glow.value * 0.16 }],
  }));
  const eyeSize = size * 0.045;
  return (
    <View style={{ width: size, height: size, alignItems: "center", justifyContent: "center" }}>
      <Animated.View
        pointerEvents="none"
        style={[
          {
            position: "absolute",
            width: size * 0.86,
            height: size * 0.86,
            borderRadius: size * 0.43,
            backgroundColor: "rgba(108,164,160,0.35)",
          },
          haloStyle,
        ]}
      />
      <Animated.View style={spinStyle}>
        <Svg width={size * 0.78} height={size * 0.78} viewBox="0 0 80 80">
          <Defs>
            <RadialGradient id="star-grad" cx="50%" cy="40%" r="60%">
              <Stop offset="0" stopColor="#FFE0AE" />
              <Stop offset="0.6" stopColor="#A8C4C2" />
              <Stop offset="1" stopColor="#3BA79F" />
            </RadialGradient>
          </Defs>
          <Path
            d="M 40 6 L 49 30 L 74 32 L 54 48 L 62 72 L 40 58 L 18 72 L 26 48 L 6 32 L 31 30 Z"
            fill="url(#star-grad)"
            stroke="#1F504E"
            strokeWidth={1.4}
            strokeLinejoin="round"
          />
          {/* Inner highlight */}
          <Circle cx={40} cy={36} r={6} fill="#FFFFFF" opacity={0.45} />
        </Svg>
      </Animated.View>
      {/* Eyes — sit still while the star rotates around them */}
      <View
        style={{
          position: "absolute",
          top: size * 0.4,
          flexDirection: "row",
          gap: size * 0.05,
        }}
      >
        <Animated.View style={[{ width: eyeSize, height: eyeSize, borderRadius: eyeSize / 2, backgroundColor: "#1F504E" }, blinkStyle]} />
        <Animated.View style={[{ width: eyeSize, height: eyeSize, borderRadius: eyeSize / 2, backgroundColor: "#1F504E" }, blinkStyle]} />
      </View>
    </View>
  );
};

// ── Style guard — keep absolute filling consistent ────────────────

// Suppress an "unused style" warning by referencing here if RN ever
// strips inline styles. (No-op at runtime.)
StyleSheet.flatten({});
