import React, { useEffect } from "react";
import { StyleSheet, Text, View } from "react-native";
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
  LinearGradient as SvgLinearGradient,
  Line,
  Path,
  Rect,
  Stop,
} from "react-native-svg";
import { moderateScale } from "@/theme";
import { useReducedMotion } from "@/hooks/useReducedMotion";

interface NoMatchesMascotProps {
  reduced?: boolean;
  /** Square size — the mascot fits in a square wrapper. */
  size?: number;
}

/**
 * "Lookout" — a small spyglass character that scans the empty list.
 * Bespoke for the History tab's no-matches state. Belongs to the
 * paper-clinical mascot family (cream / teal / coral) but with its
 * own anatomy: the round teal lens IS the head, with two dot eyes
 * peering out from inside and gently scanning left-right. A coral
 * dashed line under the eyes reads as a soft "found nothing" mouth.
 *
 * Animations:
 *   • idle bob — whole character lifts ~2pt and settles, ~3.2s cycle
 *   • scan — the eyes drift side to side as if searching
 *   • blink — long pause, brief close, reopen
 *   • question — coral "?" pip fades up at the top-right periodically
 *   • halo — soft teal disc breathing behind, very subtle
 */
export const NoMatchesMascot: React.FC<NoMatchesMascotProps> = ({
  reduced: reducedProp,
  size = moderateScale(72),
}) => {
  const reducedSystem = useReducedMotion();
  const reduced = reducedProp ?? reducedSystem;

  const bob = useSharedValue(0);
  const scan = useSharedValue(0);
  const blink = useSharedValue(1);
  const question = useSharedValue(0);
  const halo = useSharedValue(0);

  useEffect(() => {
    if (reduced) return;
    bob.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1600, easing: Easing.inOut(Easing.sin) }),
        withTiming(0, { duration: 1600, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
      false,
    );
    scan.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 900, easing: Easing.inOut(Easing.sin) }),
        withTiming(-1, { duration: 900, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
      false,
    );
    blink.value = withRepeat(
      withSequence(
        withDelay(3400, withTiming(0.1, { duration: 80 })),
        withTiming(1, { duration: 110 }),
      ),
      -1,
      false,
    );
    // Question pip: rest, fade up, hold, fade out, longer rest.
    question.value = withRepeat(
      withSequence(
        withDelay(1800, withTiming(1, { duration: 540, easing: Easing.out(Easing.cubic) })),
        withDelay(1100, withTiming(0, { duration: 480, easing: Easing.in(Easing.cubic) })),
        withDelay(1800, withTiming(0, { duration: 0 })),
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
  }, [reduced, bob, scan, blink, question, halo]);

  const wrapStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: -bob.value * 2 }],
  }));
  const haloStyle = useAnimatedStyle(() => ({
    opacity: 0.22 + halo.value * 0.22,
    transform: [{ scale: 0.92 + halo.value * 0.08 }],
  }));
  const eyeStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: scan.value * 1.4 }, { scaleY: blink.value }],
  }));
  const questionStyle = useAnimatedStyle(() => ({
    opacity: question.value,
    transform: [{ translateY: -question.value * 5 }, { scale: 0.55 + question.value * 0.45 }],
  }));

  const eyeSize = size * 0.07;

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

      <Animated.View style={[{ width: size, height: size }, wrapStyle]}>
        <Svg width="100%" height="100%" viewBox="0 0 100 100">
          <Defs>
            <SvgLinearGradient id="nm-lens" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor="#FFFFFF" />
              <Stop offset="0.55" stopColor="#F5F1EA" />
              <Stop offset="1" stopColor="#E5DDC8" />
            </SvgLinearGradient>
          </Defs>

          {/* Handle — teal stick angled toward the bottom-right */}
          <Rect
            x={62}
            y={62}
            width={32}
            height={10}
            rx={5}
            transform="rotate(40 78 67)"
            fill="#3BA79F"
            stroke="#1F504E"
            strokeWidth={1.5}
          />
          {/* Handle grip cap */}
          <Rect
            x={86}
            y={84}
            width={10}
            height={11}
            rx={2.4}
            transform="rotate(40 91 89)"
            fill="#1F504E"
          />

          {/* Lens outer rim (teal) */}
          <Circle cx={42} cy={42} r={32} fill="#3BA79F" stroke="#1F504E" strokeWidth={1.8} />

          {/* Lens inner glass (cream gradient) */}
          <Circle
            cx={42}
            cy={42}
            r={26}
            fill="url(#nm-lens)"
            stroke="#C9BFA5"
            strokeWidth={0.8}
          />

          {/* "Found nothing" mouth — soft coral dashed line below the eyes */}
          <Line
            x1={32}
            y1={53}
            x2={52}
            y2={53}
            stroke="#E07A5F"
            strokeWidth={1.4}
            strokeDasharray="2 2.5"
            strokeLinecap="round"
          />

          {/* Lens highlight glint — top-left arc */}
          <Path
            d="M 24 32 Q 30 22 40 22"
            stroke="#FFFFFF"
            strokeWidth={2}
            fill="none"
            strokeLinecap="round"
            opacity={0.85}
          />
        </Svg>

        {/* Eyes — RN views layered over the lens so they can scan + blink. */}
        <View
          pointerEvents="none"
          style={{
            position: "absolute",
            top: size * 0.36,
            left: size * 0.16,
            width: size * 0.52,
            flexDirection: "row",
            justifyContent: "center",
            gap: size * 0.08,
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

        {/* Floating coral "?" pip — periodic */}
        <Animated.View
          pointerEvents="none"
          style={[
            {
              position: "absolute",
              top: size * 0.02,
              right: size * 0.08,
              alignItems: "center",
              justifyContent: "center",
            },
            questionStyle,
          ]}
        >
          <View
            style={{
              width: size * 0.2,
              height: size * 0.2,
              borderRadius: (size * 0.2) / 2,
              backgroundColor: "#E07A5F",
              alignItems: "center",
              justifyContent: "center",
              borderWidth: 1.2,
              borderColor: "#C45C3F",
            }}
          >
            <Text
              style={{
                fontFamily: "Fraunces_500Medium",
                fontSize: size * 0.13,
                lineHeight: size * 0.16,
                color: "#FFFFFF",
                textAlign: "center",
              }}
            >
              ?
            </Text>
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
