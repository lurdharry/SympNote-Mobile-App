import React, { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
  Easing,
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import Svg, { Path } from "react-native-svg";
import { moderateScale } from "@/theme";

interface CraftingMascotProps {
  reduced: boolean;
  size?: number;
}

/**
 * The Sympnote Sprite — a friendly clinical-note character that
 * shows up while Gemini structures the user's first transcript.
 *
 * Persistence beats novelty here: the character is a small cream
 * note-card body, but it has *behaviour* — pupils that dart like
 * it's reading, transcript lines that grow left-to-right as if
 * being written, a quill that tilts on the writing beat and drops a
 * little ink, sparkles that orbit instead of pulse, a soft teal
 * halo breathing behind it, and a subtle squash on every bob.
 *
 * Pure react-native + react-native-svg + reanimated. Reduced-motion
 * freezes everything but leaves the static composition.
 */
export const CraftingMascot: React.FC<CraftingMascotProps> = ({
  reduced,
  size = moderateScale(200),
}) => {
  // Master clock — drives orbital sparkles and any other linear motion.
  const clock = useSharedValue(0);
  // Idle bob — ~2.4s sine cycle.
  const bob = useSharedValue(0);
  // Eye blink — long pause at 1, brief snap to 0.1, snap back.
  const blink = useSharedValue(1);
  // Pupil reading scan — slow left/right with hold.
  const pupil = useSharedValue(0);
  // Quill writing motion — tilt + slide every 1.2s.
  const quill = useSharedValue(0);
  // Ink drip — released near the apex of each quill stroke.
  const ink = useSharedValue(0);
  // Transcript-line reveals — 0..1 walks the three lines in turn.
  const writeCycle = useSharedValue(0);
  // Occasional head tilt for personality (~every 8s).
  const tilt = useSharedValue(0);
  // Halo — quietly breathes the bg.
  const halo = useSharedValue(0);

  useEffect(() => {
    if (reduced) return;

    clock.value = withRepeat(
      withTiming(1, { duration: 6000, easing: Easing.linear }),
      -1,
      false,
    );
    bob.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1200, easing: Easing.inOut(Easing.sin) }),
        withTiming(0, { duration: 1200, easing: Easing.inOut(Easing.sin) }),
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
    // Pupil reading cadence: scan right, hold, scan back, hold.
    pupil.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1100, easing: Easing.out(Easing.cubic) }),
        withDelay(280, withTiming(1, { duration: 0 })),
        withTiming(-1, { duration: 1100, easing: Easing.out(Easing.cubic) }),
        withDelay(280, withTiming(-1, { duration: 0 })),
      ),
      -1,
      false,
    );
    quill.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 580, easing: Easing.inOut(Easing.sin) }),
        withTiming(0, { duration: 580, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
      false,
    );
    // Ink drip — fires at the end of each quill stroke and falls off.
    ink.value = withRepeat(
      withSequence(
        withDelay(560, withTiming(1, { duration: 80 })),
        withTiming(0, { duration: 520, easing: Easing.in(Easing.cubic) }),
      ),
      -1,
      false,
    );
    // Transcript lines — sequentially grow then reset.
    writeCycle.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 3200, easing: Easing.inOut(Easing.cubic) }),
        withDelay(700, withTiming(0, { duration: 0 })),
      ),
      -1,
      false,
    );
    // Head tilt — once every ~8s, subtle, returns to centre.
    tilt.value = withRepeat(
      withSequence(
        withDelay(7000, withTiming(1, { duration: 380, easing: Easing.out(Easing.cubic) })),
        withDelay(700, withTiming(0, { duration: 380, easing: Easing.in(Easing.cubic) })),
      ),
      -1,
      false,
    );
    halo.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 2200, easing: Easing.inOut(Easing.sin) }),
        withTiming(0, { duration: 2200, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
      false,
    );
  }, [reduced, clock, bob, blink, pupil, quill, ink, writeCycle, tilt, halo]);

  // Body bob with subtle squash + occasional tilt.
  const bodyStyle = useAnimatedStyle(() => {
    const bobOff = -bob.value * 6;
    const sx = 1 + bob.value * 0.02;
    const sy = 1 - bob.value * 0.025;
    const rot = (tilt.value - 0.5) * 5; // ±2.5° max, centered at 0.5
    return {
      transform: [
        { translateY: bobOff },
        { rotate: `${tilt.value > 0 ? rot : 0}deg` },
        { scaleX: sx },
        { scaleY: sy },
      ],
    };
  });

  const haloStyle = useAnimatedStyle(() => ({
    opacity: 0.35 + halo.value * 0.35,
    transform: [{ scale: 0.9 + halo.value * 0.12 }],
  }));

  const eyeOpenStyle = useAnimatedStyle(() => ({
    transform: [{ scaleY: blink.value }],
  }));
  const pupilStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: pupil.value * 2 }, { scaleY: blink.value }],
  }));

  const quillStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: -3 + quill.value * 6 },
      { rotate: `${-22 + quill.value * 14}deg` },
    ],
  }));
  const inkStyle = useAnimatedStyle(() => ({
    opacity: ink.value,
    transform: [
      { translateY: ink.value * 18 },
      { scale: 1 - ink.value * 0.4 },
    ],
  }));

  // Orbital sparkle factory: a sparkle at angle phase circles the
  // sprite on the master clock. radiusOffset gives variety.
  const sparkleStyle = (phase: number, radius: number) =>
    useAnimatedStyle(() => {
      const theta = (clock.value + phase) * Math.PI * 2;
      const x = Math.cos(theta) * radius;
      const y = Math.sin(theta) * radius * 0.7; // squashed orbit reads as 3D-ish
      const alpha = 0.4 + (Math.sin(theta * 2) + 1) * 0.3;
      return {
        opacity: alpha,
        transform: [{ translateX: x }, { translateY: y }, { scale: 0.85 + alpha * 0.4 }],
      };
    });
  const spark1Style = sparkleStyle(0, moderateScale(74));
  const spark2Style = sparkleStyle(0.33, moderateScale(80));
  const spark3Style = sparkleStyle(0.66, moderateScale(70));

  // Three sequential transcript lines — each grows then holds.
  const lineWidth = (start: number, end: number, full: number) =>
    useDerivedValue(() => {
      const w = interpolate(
        writeCycle.value,
        [start, end],
        [0, full],
        Extrapolation.CLAMP,
      );
      return w;
    });
  const fullLine1 = moderateScale(48);
  const fullLine2 = moderateScale(56);
  const fullLine3 = moderateScale(36);
  const w1 = lineWidth(0, 0.33, fullLine1);
  const w2 = lineWidth(0.33, 0.66, fullLine2);
  const w3 = lineWidth(0.66, 1, fullLine3);
  const line1Style = useAnimatedStyle(() => ({ width: w1.value }));
  const line2Style = useAnimatedStyle(() => ({ width: w2.value }));
  const line3Style = useAnimatedStyle(() => ({ width: w3.value }));

  const eyeSize = moderateScale(8);
  const pupilSize = moderateScale(3);
  const sparkLg = moderateScale(11);
  const sparkSm = moderateScale(8);

  return (
    <View
      style={{
        width: size,
        height: size,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {/* Halo — a soft teal disc that breathes behind the sprite. */}
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

      {/* Orbital sparkles — outside the body group so they don't squash. */}
      <Animated.View pointerEvents="none" style={[styles.spark, spark1Style]}>
        <Sparkle size={sparkLg} />
      </Animated.View>
      <Animated.View pointerEvents="none" style={[styles.spark, spark2Style]}>
        <Sparkle size={sparkSm} />
      </Animated.View>
      <Animated.View pointerEvents="none" style={[styles.spark, spark3Style]}>
        <Sparkle size={sparkSm} />
      </Animated.View>

      {/* The body group — bobs + squashes + occasional tilt. */}
      <Animated.View style={[styles.bodyWrap, bodyStyle]}>
        {/* Note-card silhouette + folded corner — static SVG. */}
        <Svg
          width={size * 0.62}
          height={size * 0.74}
          viewBox="0 0 100 120"
        >
          <Path
            d="M 14 6 H 80 L 92 18 V 102 Q 92 110 84 110 H 16 Q 8 110 8 102 V 14 Q 8 6 16 6 Z"
            fill="#F5F1EA"
            stroke="#E0D9CC"
            strokeWidth={1.4}
          />
          <Path
            d="M 80 6 V 18 H 92 Z"
            fill="#EBE5DA"
            stroke="#E0D9CC"
            strokeWidth={1.4}
          />
        </Svg>

        {/* Animated transcript lines — Views overlaid on the card body. */}
        <View
          pointerEvents="none"
          style={[
            styles.lineLayer,
            { top: size * 0.5, left: size * 0.22 },
          ]}
        >
          <Animated.View style={[styles.line, line1Style]} />
          <Animated.View style={[styles.line, styles.lineDim, line2Style]} />
          <Animated.View style={[styles.line, styles.lineFainter, line3Style]} />
        </View>

        {/* Eyes — open/close + pupils dart left and right. */}
        <View style={[styles.eyesRow, { top: size * 0.28 }]}>
          <Animated.View
            style={[
              styles.eye,
              eyeOpenStyle,
              { width: eyeSize, height: eyeSize, borderRadius: eyeSize / 2 },
            ]}
          >
            <Animated.View
              style={[
                styles.pupil,
                pupilStyle,
                { width: pupilSize, height: pupilSize, borderRadius: pupilSize / 2 },
              ]}
            />
          </Animated.View>
          <Animated.View
            style={[
              styles.eye,
              eyeOpenStyle,
              { width: eyeSize, height: eyeSize, borderRadius: eyeSize / 2 },
            ]}
          >
            <Animated.View
              style={[
                styles.pupil,
                pupilStyle,
                { width: pupilSize, height: pupilSize, borderRadius: pupilSize / 2 },
              ]}
            />
          </Animated.View>
        </View>

        {/* Waveform smile. */}
        <View style={[styles.smileWrap, { top: size * 0.4 }]}>
          <Svg width={moderateScale(38)} height={moderateScale(13)} viewBox="0 0 38 13">
            <Path
              d="M 2 6.5 L 8 6.5 L 10 2 L 14 11 L 18 6.5 L 22 11 L 26 2 L 28 6.5 L 36 6.5"
              stroke="#2C6E6B"
              strokeWidth={1.6}
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
          </Svg>
        </View>

        {/* Quill — overlay so it can rotate/slide independently. */}
        <Animated.View
          style={[
            styles.quillWrap,
            { right: size * 0.16, top: size * 0.42 },
            quillStyle,
          ]}
        >
          <Svg
            width={moderateScale(24)}
            height={moderateScale(40)}
            viewBox="0 0 26 44"
          >
            <Path
              d="M 12 42 Q 4 28 13 4 Q 22 14 18 34 Q 16 42 12 42 Z"
              fill="#F6C06A"
              stroke="#D9964A"
              strokeWidth={1}
            />
            <Path
              d="M 13 6 Q 17 14 17 26"
              stroke="#FFFFFF"
              strokeOpacity={0.55}
              strokeWidth={1}
              fill="none"
            />
            <Path d="M 12 42 L 14.5 32 L 9.5 32 Z" fill="#3F2A0A" />
          </Svg>

          {/* Ink drop — falls from the tip on the quill's downbeat. */}
          <Animated.View style={[styles.inkDrop, inkStyle]} />
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
  halo: {
    position: "absolute",
    backgroundColor: "rgba(60,167,159,0.18)",
  },
  bodyWrap: {
    alignItems: "center",
    justifyContent: "center",
  },
  lineLayer: {
    position: "absolute",
    gap: moderateScale(3),
  },
  line: {
    height: 3,
    borderRadius: 1.5,
    backgroundColor: "rgba(44,110,107,0.55)",
  },
  lineDim: {
    backgroundColor: "rgba(44,110,107,0.42)",
  },
  lineFainter: {
    backgroundColor: "rgba(44,110,107,0.32)",
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
    backgroundColor: "#F5F1EA",
    borderWidth: 1.4,
    borderColor: "#1F504E",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  pupil: {
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
    alignItems: "center",
  },
  inkDrop: {
    position: "absolute",
    bottom: -moderateScale(8),
    width: moderateScale(4),
    height: moderateScale(6),
    borderRadius: moderateScale(2),
    backgroundColor: "#3F2A0A",
  },
  spark: {
    position: "absolute",
  },
});
