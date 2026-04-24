import React, { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
  Easing,
  SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import Svg, { Path, Rect } from "react-native-svg";
import { moderateScale } from "@/theme";

interface CraftingMascotProps {
  reduced: boolean;
  size?: number;
}

/**
 * The Sympnote Sprite — a friendly clinical-note character that
 * shows up while Gemini structures the user's first transcript.
 *
 * Body: a cream rounded note card with a folded top-right corner,
 * three faint transcript lines, a small waveform smile in brand
 * teal, and a gold quill at the bottom-right. Animations: gentle
 * idle bob, periodic eye blink, a writing-motion rotation on the
 * quill, and three gold sparkles bursting around it on a stagger.
 *
 * Pure RN + react-native-svg, no Skia. Reduced-motion freezes
 * everything but leaves the static composition visible.
 */
export const CraftingMascot: React.FC<CraftingMascotProps> = ({
  reduced,
  size = moderateScale(180),
}) => {
  const bob = useSharedValue(0);
  const blink = useSharedValue(1);
  const quill = useSharedValue(0);
  const spark1 = useSharedValue(0);
  const spark2 = useSharedValue(0);
  const spark3 = useSharedValue(0);

  useEffect(() => {
    if (reduced) return;

    // Idle bob — gentle vertical breath, ~2.8s round trip.
    bob.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1400, easing: Easing.inOut(Easing.sin) }),
        withTiming(0, { duration: 1400, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
      false,
    );

    // Periodic blink — long pause at "open" (1), brief snap to closed.
    blink.value = withRepeat(
      withSequence(
        withDelay(3800, withTiming(0.1, { duration: 90 })),
        withTiming(1, { duration: 110 }),
      ),
      -1,
      false,
    );

    // Quill — writing motion. Tilts and slides slightly back and forth.
    quill.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 620, easing: Easing.inOut(Easing.sin) }),
        withTiming(0, { duration: 620, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
      false,
    );

    const sparkLoop = (sv: SharedValue<number>, delay: number) => {
      sv.value = withDelay(
        delay,
        withRepeat(
          withSequence(
            withTiming(1, { duration: 800, easing: Easing.out(Easing.cubic) }),
            withTiming(0, { duration: 800, easing: Easing.in(Easing.cubic) }),
          ),
          -1,
          false,
        ),
      );
    };
    sparkLoop(spark1, 0);
    sparkLoop(spark2, 700);
    sparkLoop(spark3, 1400);
  }, [reduced, bob, blink, quill, spark1, spark2, spark3]);

  const wrapStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: -bob.value * 6 }],
  }));
  const eyeStyle = useAnimatedStyle(() => ({
    transform: [{ scaleY: blink.value }],
  }));
  const quillStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: -3 + quill.value * 6 },
      { rotate: `${-22 + quill.value * 14}deg` },
    ],
  }));
  const sparkStyle = (sv: SharedValue<number>) =>
    useAnimatedStyle(() => ({
      opacity: sv.value,
      transform: [{ scale: 0.6 + sv.value * 0.6 }],
    }));
  const spark1Style = sparkStyle(spark1);
  const spark2Style = sparkStyle(spark2);
  const spark3Style = sparkStyle(spark3);

  const eyeSize = moderateScale(7);
  const sparkLg = moderateScale(11);
  const sparkSm = moderateScale(8);

  return (
    <View style={{ width: size, height: size, alignItems: "center", justifyContent: "center" }}>
      <Animated.View style={[styles.fill, wrapStyle]}>
        {/* Note-card body — the mascot's "face" lives on this. */}
        <Svg
          width={size * 0.72}
          height={size * 0.85}
          viewBox="0 0 100 120"
          style={styles.body}
        >
          {/* Folded-corner card */}
          <Path
            d="M 14 6 H 80 L 92 18 V 102 Q 92 110 84 110 H 16 Q 8 110 8 102 V 14 Q 8 6 16 6 Z"
            fill="#F5F1EA"
            stroke="#E0D9CC"
            strokeWidth={1.4}
          />
          {/* Fold highlight triangle */}
          <Path
            d="M 80 6 V 18 H 92 Z"
            fill="#EBE5DA"
            stroke="#E0D9CC"
            strokeWidth={1.4}
          />
          {/* Transcript lines being written — faint teal */}
          <Rect x={20} y={70} width={48} height={3} rx={1.5} fill="#2C6E6B" opacity={0.18} />
          <Rect x={20} y={80} width={56} height={3} rx={1.5} fill="#2C6E6B" opacity={0.18} />
          <Rect x={20} y={90} width={36} height={3} rx={1.5} fill="#2C6E6B" opacity={0.14} />
        </Svg>

        {/* Eyes — animated separately so blink only affects the eyes. */}
        <View style={[styles.eyesRow, { top: size * 0.32 }]}>
          <Animated.View
            style={[
              styles.eye,
              eyeStyle,
              { width: eyeSize, height: eyeSize, borderRadius: eyeSize / 2 },
            ]}
          />
          <Animated.View
            style={[
              styles.eye,
              eyeStyle,
              { width: eyeSize, height: eyeSize, borderRadius: eyeSize / 2 },
            ]}
          />
        </View>

        {/* Waveform smile — small SVG under the eyes. */}
        <View style={[styles.smileWrap, { top: size * 0.44 }]}>
          <Svg
            width={moderateScale(40)}
            height={moderateScale(14)}
            viewBox="0 0 40 14"
          >
            <Path
              d="M 2 7 L 8 7 L 10 3 L 14 11 L 18 7 L 22 11 L 26 3 L 28 7 L 38 7"
              stroke="#2C6E6B"
              strokeWidth={1.6}
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
          </Svg>
        </View>

        {/* Quill — overlay so it can rotate/translate freely. */}
        <Animated.View
          style={[
            styles.quillWrap,
            { right: size * 0.12, top: size * 0.55 },
            quillStyle,
          ]}
        >
          <Svg
            width={moderateScale(26)}
            height={moderateScale(44)}
            viewBox="0 0 26 44"
          >
            {/* Quill body — golden teardrop */}
            <Path
              d="M 12 42 Q 4 28 13 4 Q 22 14 18 34 Q 16 42 12 42 Z"
              fill="#F6C06A"
              stroke="#D9964A"
              strokeWidth={1}
            />
            {/* Inner highlight */}
            <Path
              d="M 13 6 Q 17 14 17 26"
              stroke="#FFFFFF"
              strokeOpacity={0.55}
              strokeWidth={1}
              fill="none"
            />
            {/* Inked tip */}
            <Path d="M 12 42 L 14.5 32 L 9.5 32 Z" fill="#3F2A0A" />
          </Svg>
        </Animated.View>

        {/* Sparkles — three gold 4-point stars on a stagger. */}
        <Animated.View
          pointerEvents="none"
          style={[
            styles.spark,
            spark1Style,
            { top: size * 0.08, left: size * 0.18 },
          ]}
        >
          <Sparkle size={sparkLg} />
        </Animated.View>
        <Animated.View
          pointerEvents="none"
          style={[
            styles.spark,
            spark2Style,
            { top: size * 0.16, right: size * 0.1 },
          ]}
        >
          <Sparkle size={sparkSm} />
        </Animated.View>
        <Animated.View
          pointerEvents="none"
          style={[
            styles.spark,
            spark3Style,
            { bottom: size * 0.16, right: size * 0.04 },
          ]}
        >
          <Sparkle size={sparkSm} />
        </Animated.View>
      </Animated.View>
    </View>
  );
};

// ── Sparkle dot ────────────────────────────────────────────────────

const Sparkle: React.FC<{ size: number }> = ({ size }) => (
  <Svg width={size} height={size} viewBox="0 0 12 12">
    <Path
      d="M 6 0 L 7.4 4.6 L 12 6 L 7.4 7.4 L 6 12 L 4.6 7.4 L 0 6 L 4.6 4.6 Z"
      fill="#F6C06A"
    />
  </Svg>
);

const styles = StyleSheet.create({
  fill: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  body: {
    // SVG note card sits in the middle of the wrapper.
  },
  eyesRow: {
    position: "absolute",
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "center",
    gap: moderateScale(20),
  },
  eye: {
    backgroundColor: "#1F504E",
  },
  smileWrap: {
    position: "absolute",
    left: 0,
    right: 0,
    alignItems: "center",
  },
  quillWrap: {
    position: "absolute",
  },
  spark: {
    position: "absolute",
  },
});
