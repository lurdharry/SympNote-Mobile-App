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

export type SpritePose = "crafting" | "greeting" | "listening";

interface SympnoteSpriteProps {
  /**
   * Which behaviour the sprite plays:
   *  - `crafting`  — head down, eyes scan, transcript lines write,
   *                  quill tilts and drips ink, sparkles orbit.
   *  - `greeting`  — eyes look forward, gold quill waves like a
   *                  hello, occasional head tilt, sparkle pop on
   *                  loop.
   *  - `listening` — body leans toward where the FAB is, eyes look
   *                  down-right, cupped "hand" at the ear, sound
   *                  ripples coming in.
   */
  pose: SpritePose;
  reduced: boolean;
  size?: number;
}

/**
 * The Sympnote Sprite — a small clinical-note character that recurs
 * across onboarding moments. The body / eyes / smile / halo are
 * shared across every pose so the user reads the *same character*
 * doing different things — that's what makes a mascot stick rather
 * than feel like decoration.
 */
export const SympnoteSprite: React.FC<SympnoteSpriteProps> = ({
  pose,
  reduced,
  size = moderateScale(200),
}) => {
  const isCrafting = pose === "crafting";
  const isGreeting = pose === "greeting";
  const isListening = pose === "listening";

  const clock = useSharedValue(0);
  const bob = useSharedValue(0);
  const blink = useSharedValue(1);
  const halo = useSharedValue(0);
  const pupilX = useSharedValue(0);
  const pupilY = useSharedValue(0);
  const tilt = useSharedValue(0);

  const quillCraft = useSharedValue(0);
  const ink = useSharedValue(0);
  const writeCycle = useSharedValue(0);

  const wave = useSharedValue(0);
  const sparkPop = useSharedValue(0);

  const ripple = useSharedValue(0);

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
    halo.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 2200, easing: Easing.inOut(Easing.sin) }),
        withTiming(0, { duration: 2200, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
      false,
    );

    if (isCrafting) {
      pupilX.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 1100, easing: Easing.out(Easing.cubic) }),
          withDelay(280, withTiming(1, { duration: 0 })),
          withTiming(-1, { duration: 1100, easing: Easing.out(Easing.cubic) }),
          withDelay(280, withTiming(-1, { duration: 0 })),
        ),
        -1,
        false,
      );
      pupilY.value = 0.2;
      quillCraft.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 580, easing: Easing.inOut(Easing.sin) }),
          withTiming(0, { duration: 580, easing: Easing.inOut(Easing.sin) }),
        ),
        -1,
        false,
      );
      ink.value = withRepeat(
        withSequence(
          withDelay(560, withTiming(1, { duration: 80 })),
          withTiming(0, { duration: 520, easing: Easing.in(Easing.cubic) }),
        ),
        -1,
        false,
      );
      writeCycle.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 3200, easing: Easing.inOut(Easing.cubic) }),
          withDelay(700, withTiming(0, { duration: 0 })),
        ),
        -1,
        false,
      );
      tilt.value = withRepeat(
        withSequence(
          withDelay(7000, withTiming(1, { duration: 380 })),
          withDelay(700, withTiming(0, { duration: 380 })),
        ),
        -1,
        false,
      );
    }

    if (isGreeting) {
      pupilX.value = withRepeat(
        withSequence(
          withDelay(2200, withTiming(-0.5, { duration: 320 })),
          withDelay(700, withTiming(0, { duration: 320 })),
          withDelay(1800, withTiming(0.5, { duration: 320 })),
          withDelay(700, withTiming(0, { duration: 320 })),
        ),
        -1,
        false,
      );
      pupilY.value = -0.1;
      wave.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 320, easing: Easing.inOut(Easing.sin) }),
          withTiming(-1, { duration: 320, easing: Easing.inOut(Easing.sin) }),
          withTiming(1, { duration: 320, easing: Easing.inOut(Easing.sin) }),
          withTiming(-1, { duration: 320, easing: Easing.inOut(Easing.sin) }),
          withTiming(0, { duration: 280, easing: Easing.out(Easing.cubic) }),
          withDelay(2200, withTiming(0, { duration: 0 })),
        ),
        -1,
        false,
      );
      tilt.value = withRepeat(
        withSequence(
          withDelay(3400, withTiming(1, { duration: 320 })),
          withDelay(900, withTiming(0, { duration: 320 })),
        ),
        -1,
        false,
      );
      sparkPop.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 600, easing: Easing.out(Easing.cubic) }),
          withTiming(0, { duration: 600, easing: Easing.in(Easing.cubic) }),
          withDelay(1200, withTiming(0, { duration: 0 })),
        ),
        -1,
        false,
      );
    }

    if (isListening) {
      pupilX.value = withRepeat(
        withSequence(
          withTiming(0.7, { duration: 600, easing: Easing.out(Easing.cubic) }),
          withDelay(2200, withTiming(0.55, { duration: 320 })),
          withTiming(0.7, { duration: 320 }),
        ),
        -1,
        true,
      );
      pupilY.value = 0.6;
      tilt.value = withTiming(1, { duration: 400 });
      ripple.value = withRepeat(
        withTiming(1, { duration: 1600, easing: Easing.out(Easing.cubic) }),
        -1,
        false,
      );
    }
  }, [
    reduced,
    isCrafting,
    isGreeting,
    isListening,
    clock,
    bob,
    blink,
    halo,
    pupilX,
    pupilY,
    tilt,
    quillCraft,
    ink,
    writeCycle,
    wave,
    sparkPop,
    ripple,
  ]);

  const bodyStyle = useAnimatedStyle(() => {
    const bobOff = -bob.value * 6;
    const sx = 1 + bob.value * 0.02;
    const sy = 1 - bob.value * 0.025;
    const tiltDeg = isListening
      ? tilt.value * 8
      : (tilt.value - 0.5) * 5;
    const tiltActive = isListening || tilt.value > 0;
    return {
      transform: [
        { translateY: bobOff },
        { rotate: `${tiltActive ? tiltDeg : 0}deg` },
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
    transform: [
      { translateX: pupilX.value * 2 },
      { translateY: pupilY.value * 1.5 },
      { scaleY: blink.value },
    ],
  }));

  const craftQuillStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: -3 + quillCraft.value * 6 },
      { rotate: `${-22 + quillCraft.value * 14}deg` },
    ],
  }));
  const inkStyle = useAnimatedStyle(() => ({
    opacity: ink.value,
    transform: [
      { translateY: ink.value * 18 },
      { scale: 1 - ink.value * 0.4 },
    ],
  }));

  const greetQuillStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${-15 + wave.value * 30}deg` }],
  }));

  const sparkPopStyle = useAnimatedStyle(() => ({
    opacity: sparkPop.value,
    transform: [{ scale: 0.6 + sparkPop.value * 0.7 }],
  }));

  const rippleStyle = (offset: number) =>
    useAnimatedStyle(() => {
      const phase = (ripple.value + offset) % 1;
      return {
        opacity: 1 - phase,
        transform: [{ scale: 0.4 + phase * 1.6 }],
      };
    });
  const r1Style = rippleStyle(0);
  const r2Style = rippleStyle(0.33);
  const r3Style = rippleStyle(0.66);

  const orbitalStyle = (phase: number, radius: number) =>
    useAnimatedStyle(() => {
      const theta = (clock.value + phase) * Math.PI * 2;
      const x = Math.cos(theta) * radius;
      const y = Math.sin(theta) * radius * 0.7;
      const alpha = 0.4 + (Math.sin(theta * 2) + 1) * 0.3;
      return {
        opacity: alpha,
        transform: [{ translateX: x }, { translateY: y }, { scale: 0.85 + alpha * 0.4 }],
      };
    });
  const orb1Style = orbitalStyle(0, moderateScale(74));
  const orb2Style = orbitalStyle(0.33, moderateScale(80));
  const orb3Style = orbitalStyle(0.66, moderateScale(70));

  const lineWidth = (start: number, end: number, full: number) =>
    useDerivedValue(() => {
      return interpolate(
        writeCycle.value,
        [start, end],
        [0, full],
        Extrapolation.CLAMP,
      );
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

      {isCrafting && (
        <>
          <Animated.View pointerEvents="none" style={[styles.spark, orb1Style]}>
            <Sparkle size={sparkLg} />
          </Animated.View>
          <Animated.View pointerEvents="none" style={[styles.spark, orb2Style]}>
            <Sparkle size={sparkSm} />
          </Animated.View>
          <Animated.View pointerEvents="none" style={[styles.spark, orb3Style]}>
            <Sparkle size={sparkSm} />
          </Animated.View>
        </>
      )}

      {isGreeting && (
        <>
          <Animated.View
            pointerEvents="none"
            style={[styles.spark, sparkPopStyle, { top: size * 0.16, left: size * 0.18 }]}
          >
            <Sparkle size={sparkLg} />
          </Animated.View>
          <Animated.View
            pointerEvents="none"
            style={[styles.spark, sparkPopStyle, { top: size * 0.06, right: size * 0.22 }]}
          >
            <Sparkle size={sparkSm} />
          </Animated.View>
        </>
      )}

      {isListening && (
        <View
          pointerEvents="none"
          style={[styles.rippleAnchor, { left: size * 0.06, top: size * 0.32 }]}
        >
          <Animated.View style={[styles.ripple, r1Style]} />
          <Animated.View style={[styles.ripple, r2Style]} />
          <Animated.View style={[styles.ripple, r3Style]} />
        </View>
      )}

      <Animated.View style={[styles.bodyWrap, bodyStyle]}>
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

        {isCrafting && (
          <View
            pointerEvents="none"
            style={[styles.lineLayer, { top: size * 0.5, left: size * 0.22 }]}
          >
            <Animated.View style={[styles.line, line1Style]} />
            <Animated.View style={[styles.line, styles.lineDim, line2Style]} />
            <Animated.View style={[styles.line, styles.lineFainter, line3Style]} />
          </View>
        )}

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

        {isCrafting && (
          <Animated.View
            style={[
              styles.quillWrap,
              { right: size * 0.16, top: size * 0.42 },
              craftQuillStyle,
            ]}
          >
            <QuillSvg />
            <Animated.View style={[styles.inkDrop, inkStyle]} />
          </Animated.View>
        )}

        {isGreeting && (
          <Animated.View
            style={[
              styles.quillWrap,
              { right: size * 0.1, top: size * 0.18 },
              greetQuillStyle,
            ]}
          >
            <QuillSvg />
          </Animated.View>
        )}

        {isListening && (
          <View style={[styles.cuppedHand, { left: size * 0.04, top: size * 0.34 }]}>
            <Svg
              width={moderateScale(22)}
              height={moderateScale(28)}
              viewBox="0 0 22 28"
            >
              <Path
                d="M 18 4 Q 4 4 4 14 Q 4 24 18 24 Q 12 22 12 14 Q 12 6 18 4 Z"
                fill="#F5F1EA"
                stroke="#1F504E"
                strokeWidth={1.5}
                strokeLinejoin="round"
              />
            </Svg>
          </View>
        )}
      </Animated.View>
    </View>
  );
};

const QuillSvg: React.FC = () => (
  <Svg width={moderateScale(24)} height={moderateScale(40)} viewBox="0 0 26 44">
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
);

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
  lineDim: { backgroundColor: "rgba(44,110,107,0.42)" },
  lineFainter: { backgroundColor: "rgba(44,110,107,0.32)" },
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
  cuppedHand: {
    position: "absolute",
  },
  rippleAnchor: {
    position: "absolute",
    width: moderateScale(40),
    height: moderateScale(40),
    alignItems: "center",
    justifyContent: "center",
  },
  ripple: {
    position: "absolute",
    width: moderateScale(40),
    height: moderateScale(40),
    borderRadius: moderateScale(20),
    borderWidth: 1.5,
    borderColor: "rgba(60,167,159,0.6)",
  },
});
