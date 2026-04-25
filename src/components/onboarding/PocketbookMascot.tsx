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
import Svg, { Circle, Defs, LinearGradient as SvgLinearGradient, Path, Rect, Stop } from "react-native-svg";
import { moderateScale } from "@/theme";
import { useReducedMotion } from "@/hooks/useReducedMotion";

interface PocketbookMascotProps {
  reduced?: boolean;
  /** Square size (the mascot fits in a square wrapper). */
  size?: number;
}

/**
 * The Pocketbook — a small clinical chart / wallet character that
 * lives on the paywall. The body is a folded chart held up in front
 * of the character; only their eyes peek over the top edge. A
 * shuffled stack of coloured tags rises above the chart's top — each
 * one a recorded note. A "+1" sparks in occasionally to suggest the
 * chart's growing capacity.
 *
 * Belongs to the same paper-clinical family as SympnoteSprite and
 * QuillKeeper: cream skin / teal eyes / soft halo. Different anatomy
 * (held chart instead of standing body) and different reading: this
 * one is about *capacity to hold your story*, which is what the
 * subscription unlocks.
 *
 * Animations:
 *   • idle bob — whole character rises ~4pt and settles, ~3s cycle
 *   • blink — the peeking eyes close and reopen on a long pause
 *   • shuffle — the tag stack tilts gently, as if the chart is
 *     adjusting its grip
 *   • plus-one — every ~5s a small "+1" tag fades in at the top of
 *     the stack and slides up + fades out, suggesting growth
 *   • halo — soft teal disc behind, breathing opacity + scale
 */
export const PocketbookMascot: React.FC<PocketbookMascotProps> = ({
  reduced: reducedProp,
  size = moderateScale(180),
}) => {
  const reducedSystem = useReducedMotion();
  const reduced = reducedProp ?? reducedSystem;

  const bob = useSharedValue(0);
  const blink = useSharedValue(1);
  const shuffle = useSharedValue(0);
  const plusOne = useSharedValue(0);
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
    blink.value = withRepeat(
      withSequence(
        withDelay(3800, withTiming(0.1, { duration: 90 })),
        withTiming(1, { duration: 110 }),
      ),
      -1,
      false,
    );
    shuffle.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1100, easing: Easing.inOut(Easing.sin) }),
        withTiming(-1, { duration: 1100, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
      false,
    );
    // +1 tag rises & fades. Big rest period so it doesn't spam.
    plusOne.value = withRepeat(
      withSequence(
        withDelay(2400, withTiming(1, { duration: 720, easing: Easing.out(Easing.cubic) })),
        withDelay(380, withTiming(0, { duration: 0 })),
        withDelay(2200, withTiming(0, { duration: 0 })),
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
  }, [reduced, bob, blink, shuffle, plusOne, halo]);

  const wrapStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: -bob.value * 4 }],
  }));
  const haloStyle = useAnimatedStyle(() => ({
    opacity: 0.3 + halo.value * 0.3,
    transform: [{ scale: 0.92 + halo.value * 0.1 }],
  }));
  const eyeStyle = useAnimatedStyle(() => ({
    transform: [{ scaleY: blink.value }],
  }));
  const stackStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${shuffle.value * 1.5}deg` }],
  }));
  const plusOneStyle = useAnimatedStyle(() => {
    const t = plusOne.value;
    return {
      opacity: t < 1 ? t * 1.3 : Math.max(0, 1 - (t - 1)),
      transform: [{ translateY: -t * 18 }, { scale: 0.6 + t * 0.5 }],
    };
  });

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
      {/* Halo */}
      <Animated.View
        pointerEvents="none"
        style={[
          styles.halo,
          haloStyle,
          {
            width: size * 0.9,
            height: size * 0.9,
            borderRadius: (size * 0.9) / 2,
          },
        ]}
      />

      <Animated.View style={[{ width: size, height: size }, wrapStyle]}>
        {/* Tag stack — fanned out above the chart top edge. The whole
            stack tilts gently with `shuffle`. */}
        <Animated.View
          style={[
            { position: "absolute", top: size * 0.18, left: 0, right: 0, alignItems: "center" },
            stackStyle,
          ]}
        >
          <Svg width={size * 0.62} height={size * 0.28} viewBox="0 0 100 44">
            {/* Back tag (coral) */}
            <Rect
              x={10}
              y={6}
              width={28}
              height={28}
              rx={4}
              transform="rotate(-12 24 20)"
              fill="#E07A5F"
              stroke="#C45C3F"
              strokeWidth={1.2}
            />
            {/* Mid tag (teal) — slightly offset right */}
            <Rect
              x={36}
              y={4}
              width={28}
              height={32}
              rx={4}
              transform="rotate(-2 50 20)"
              fill="#3BA79F"
              stroke="#2C6E6B"
              strokeWidth={1.2}
            />
            {/* Front tag (gold) */}
            <Rect
              x={62}
              y={8}
              width={28}
              height={28}
              rx={4}
              transform="rotate(8 76 22)"
              fill="#F6C06A"
              stroke="#D9964A"
              strokeWidth={1.2}
            />
            {/* Tiny notches at the bottom of each tag suggesting they
                slot into the chart binder. */}
            <Rect x={22} y={32} width={4} height={4} rx={1} fill="#1F504E" opacity={0.35} />
            <Rect x={48} y={34} width={4} height={4} rx={1} fill="#1F504E" opacity={0.35} />
            <Rect x={74} y={32} width={4} height={4} rx={1} fill="#1F504E" opacity={0.35} />
          </Svg>
        </Animated.View>

        {/* +1 sparkle tag — fades up periodically, suggesting capacity. */}
        <Animated.View
          pointerEvents="none"
          style={[
            { position: "absolute", top: size * 0.04, left: 0, right: 0, alignItems: "center" },
            plusOneStyle,
          ]}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: moderateScale(3),
              paddingHorizontal: moderateScale(6),
              paddingVertical: moderateScale(2),
              borderRadius: 999,
              backgroundColor: "#5A8F6E",
            }}
          >
            <View
              style={{
                width: moderateScale(3),
                height: moderateScale(3),
                borderRadius: moderateScale(2),
                backgroundColor: "#FFFFFF",
              }}
            />
            <Animated.Text
              style={{
                fontFamily: "DMSans_700Bold",
                fontSize: 9,
                color: "#FFFFFF",
                letterSpacing: 0.4,
              }}
            >
              +1 NOTE
            </Animated.Text>
          </View>
        </Animated.View>

        {/* Chart body — the held wallet/chart in front. SVG so we can
            give it a binder spine on the left + a fold line + a soft
            gradient. The eyes are RN Views layered over it just above
            the chart's top edge. */}
        <View
          style={{
            position: "absolute",
            top: size * 0.42,
            left: size * 0.14,
            width: size * 0.72,
            height: size * 0.46,
          }}
        >
          <Svg width="100%" height="100%" viewBox="0 0 130 84">
            <Defs>
              <SvgLinearGradient id="pb-body" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0" stopColor="#FFFFFF" />
                <Stop offset="0.5" stopColor="#F5F1EA" />
                <Stop offset="1" stopColor="#E5DDC8" />
              </SvgLinearGradient>
            </Defs>
            {/* Chart back card */}
            <Path
              d="M 8 8 H 122 Q 128 8 128 14 V 76 Q 128 82 122 82 H 8 Q 2 82 2 76 V 14 Q 2 8 8 8 Z"
              fill="url(#pb-body)"
              stroke="#C9BFA5"
              strokeWidth={1.4}
              strokeLinejoin="round"
            />
            {/* Binder spine — three rivets on the left side */}
            <Circle cx={10} cy={26} r={2.4} fill="#C9BFA5" />
            <Circle cx={10} cy={44} r={2.4} fill="#C9BFA5" />
            <Circle cx={10} cy={62} r={2.4} fill="#C9BFA5" />
            {/* Fold line — subtle horizontal score across the middle */}
            <Path
              d="M 22 44 L 122 44"
              stroke="#C9BFA5"
              strokeWidth={0.8}
              strokeDasharray="2 3"
              opacity={0.6}
            />
            {/* Title strip on the front upper-half — a subtle Sympnote
                pulse waveform, suggests it's a clinical chart. */}
            <Path
              d="M 28 26 L 38 26 L 42 20 L 48 32 L 52 26 L 60 26 L 64 20 L 70 32 L 74 26 L 92 26"
              stroke="#2C6E6B"
              strokeWidth={1.4}
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
              opacity={0.7}
            />
          </Svg>
        </View>

        {/* Eyes — peeking just above the chart's top edge. */}
        <View
          pointerEvents="none"
          style={{
            position: "absolute",
            top: size * 0.4,
            left: 0,
            right: 0,
            flexDirection: "row",
            justifyContent: "center",
            gap: size * 0.06,
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

const styles = StyleSheet.create({
  halo: {
    position: "absolute",
    backgroundColor: "rgba(60,167,159,0.18)",
  },
});
