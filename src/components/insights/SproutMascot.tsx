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
import Svg, {
  Circle,
  Defs,
  Ellipse,
  LinearGradient as SvgLinearGradient,
  Path,
  Rect,
  Stop,
} from "react-native-svg";
import { moderateScale } from "@/theme";
import { useReducedMotion } from "@/hooks/useReducedMotion";

interface SproutMascotProps {
  reduced?: boolean;
  /** Square size — the mascot fits in a square wrapper. */
  size?: number;
}

/**
 * "Sprout" — a small potted seedling reaching for a coral berry just
 * out of reach. Bespoke for the Insights tab's empty/almost-there
 * state where a threshold of entries unlocks pattern detection.
 *
 * Belongs to the paper-clinical mascot family (cream / dark teal
 * #2C6E6B / coral #E07A5F / gold #F6C06A): cream pot, teal stem +
 * leaves, coral goal dot, soft teal halo behind. The sprout has a
 * tiny cream face at the top with teal dot eyes peeking up.
 *
 * Reading: each logged entry feeds it, and the goal — the coral
 * berry — hovers just above the head. Almost there.
 *
 * Animations:
 *   • sway — whole plant rotates ±2° on a ~3s cycle
 *   • stretch — stem subtly extends on a slower cycle, reading
 *     as growth toward the berry
 *   • blink — long pause, brief close, reopen
 *   • berry — coral goal floats up and down, always just out of
 *     reach
 *   • halo — soft teal disc breathing behind, very subtle
 */
export const SproutMascot: React.FC<SproutMascotProps> = ({
  reduced: reducedProp,
  size = moderateScale(96),
}) => {
  const reducedSystem = useReducedMotion();
  const reduced = reducedProp ?? reducedSystem;

  const sway = useSharedValue(0);
  const stretch = useSharedValue(0);
  const blink = useSharedValue(1);
  const berry = useSharedValue(0);
  const halo = useSharedValue(0);

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
    // Stem stretches up and settles back, slow cycle.
    stretch.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 2200, easing: Easing.inOut(Easing.sin) }),
        withTiming(0, { duration: 2200, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
      false,
    );
    blink.value = withRepeat(
      withSequence(
        withDelay(3600, withTiming(0.1, { duration: 80 })),
        withTiming(1, { duration: 110 }),
      ),
      -1,
      false,
    );
    // Berry floats up and back, slightly out of phase with stretch
    // so the gap between head and berry never closes.
    berry.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1900, easing: Easing.inOut(Easing.sin) }),
        withTiming(0, { duration: 1900, easing: Easing.inOut(Easing.sin) }),
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
  }, [reduced, sway, stretch, blink, berry, halo]);

  const wrapStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${sway.value * 2}deg` }],
  }));
  const headStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: -stretch.value * 3 }],
  }));
  const eyeStyle = useAnimatedStyle(() => ({
    transform: [{ scaleY: blink.value }],
  }));
  const berryStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: -berry.value * 4 - 2 }],
  }));
  const haloStyle = useAnimatedStyle(() => ({
    opacity: 0.22 + halo.value * 0.22,
    transform: [{ scale: 0.9 + halo.value * 0.1 }],
  }));

  const eyeSize = size * 0.045;

  return (
    <View
      style={{
        width: size,
        height: size,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Animated.View
        pointerEvents="none"
        style={[
          styles.halo,
          haloStyle,
          {
            width: size * 0.92,
            height: size * 0.92,
            borderRadius: (size * 0.92) / 2,
          },
        ]}
      />

      {/* Berry — outside the swaying group so it reads as a separate,
          out-of-reach goal. */}
      <Animated.View
        pointerEvents="none"
        style={[
          {
            position: "absolute",
            top: size * 0.06,
            alignItems: "center",
            justifyContent: "center",
          },
          berryStyle,
        ]}
      >
        <View
          style={{
            width: size * 0.13,
            height: size * 0.13,
            borderRadius: (size * 0.13) / 2,
            backgroundColor: "#E07A5F",
            borderWidth: 1.4,
            borderColor: "#C45C3F",
          }}
        />
        {/* Tiny coral leaf on the berry */}
        <View
          style={{
            position: "absolute",
            top: -size * 0.02,
            left: size * 0.075,
            width: size * 0.04,
            height: size * 0.025,
            borderRadius: size * 0.02,
            backgroundColor: "#3BA79F",
            transform: [{ rotate: "-22deg" }],
          }}
        />
      </Animated.View>

      <Animated.View style={[{ width: size, height: size }, wrapStyle]}>
        <Svg width="100%" height="100%" viewBox="0 0 100 100">
          <Defs>
            <SvgLinearGradient id="sp-pot" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor="#F5F1EA" />
              <Stop offset="1" stopColor="#E5DDC8" />
            </SvgLinearGradient>
          </Defs>

          {/* Pot body — trapezoid with rounded bottom, cream gradient */}
          <Path
            d="M 32 70 L 36 92 Q 38 96 42 96 H 58 Q 62 96 64 92 L 68 70 Z"
            fill="url(#sp-pot)"
            stroke="#C9BFA5"
            strokeWidth={1.4}
            strokeLinejoin="round"
          />
          {/* Pot rim — chunky teal band */}
          <Rect
            x={28}
            y={64}
            width={44}
            height={9}
            rx={2}
            fill="#3BA79F"
            stroke="#1F504E"
            strokeWidth={1.4}
          />
          {/* Soil sliver inside the pot */}
          <Rect x={32} y={70} width={36} height={3} rx={1} fill="#1F504E" opacity={0.7} />

          {/* Stem — gentle S-curve from soil up to where the head sits */}
          <Path
            d="M 50 70 Q 46 60 50 50 Q 54 40 50 30"
            stroke="#3BA79F"
            strokeWidth={3}
            strokeLinecap="round"
            fill="none"
          />

          {/* Lower leaf — left side */}
          <Path
            d="M 47 56 Q 38 52 36 58 Q 40 62 47 60 Z"
            fill="#5AB3AB"
            stroke="#2C6E6B"
            strokeWidth={1}
            strokeLinejoin="round"
          />
          {/* Upper leaf — right side */}
          <Path
            d="M 53 44 Q 62 40 64 46 Q 60 50 53 48 Z"
            fill="#5AB3AB"
            stroke="#2C6E6B"
            strokeWidth={1}
            strokeLinejoin="round"
          />

          {/* Pot stripe accent */}
          <Path
            d="M 32 78 L 68 78"
            stroke="#C9BFA5"
            strokeWidth={0.8}
            strokeDasharray="2 2"
            opacity={0.7}
          />
        </Svg>

        {/* Head — small cream oval at the top of the stem with eyes.
            Sits in its own animated wrapper that subtly stretches up. */}
        <Animated.View
          pointerEvents="none"
          style={[
            {
              position: "absolute",
              top: size * 0.18,
              left: 0,
              right: 0,
              alignItems: "center",
            },
            headStyle,
          ]}
        >
          <Svg width={size * 0.22} height={size * 0.2} viewBox="0 0 22 20">
            <Ellipse cx={11} cy={10} rx={9} ry={8} fill="#F5F1EA" stroke="#C9BFA5" strokeWidth={1} />
            {/* Subtle blush */}
            <Circle cx={6} cy={12.5} r={1.4} fill="#F5A3A3" opacity={0.7} />
            <Circle cx={16} cy={12.5} r={1.4} fill="#F5A3A3" opacity={0.7} />
          </Svg>
          {/* Eyes — RN views layered on the head so they can blink */}
          <View
            pointerEvents="none"
            style={{
              position: "absolute",
              top: size * 0.085,
              left: 0,
              right: 0,
              flexDirection: "row",
              justifyContent: "center",
              gap: size * 0.04,
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
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  halo: {
    position: "absolute",
    backgroundColor: "rgba(60,167,159,0.14)",
  },
});
