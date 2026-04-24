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
  Defs,
  LinearGradient as SvgLinearGradient,
  Path,
  RadialGradient,
  Rect,
  Stop,
} from "react-native-svg";
import { moderateScale } from "@/theme";

interface QuillKeeperProps {
  reduced: boolean;
  /** Total height of the mascot in pt. The width is derived (≈45% of
   *  height) so the quill keeps its slender silhouette. */
  size?: number;
  /**
   * Optional reaction trigger — when this changes, the quill leans
   * forward briefly and the tip glows brighter, as if it's just
   * recorded an answer. Pass `step` from the qualifier flow.
   */
  reactionKey?: string | number;
}

/**
 * The QuillKeeper — a tall gold quill with a face, the quizmaster
 * for the qualifier "Profile Quest". Distinct from the SympnoteSprite
 * (paper note-card body) so the two read as different inhabitants of
 * the same paper-clinical universe.
 *
 * Anatomy (top → bottom):
 *   • feather plume — tear-drop curl at the top
 *   • feather rachis — a thin shaft line down the plume
 *   • barrel — the body where the face lives (eyes + smile)
 *   • inked nib — the tapered black tip at the bottom that drops ink
 *
 * Behaviour:
 *   • idle sway — ±5° rotation around the nib
 *   • plume bob — feather oscillates slightly out of phase with sway
 *   • blink — long pause, brief snap closed
 *   • tip glow — gold halo at the nib that breathes
 *   • ink drop — falls from the nib every ~4s
 *   • react — when reactionKey changes, the quill leans 10° forward
 *     and the tip glow flashes brighter for a beat
 */
export const QuillKeeper: React.FC<QuillKeeperProps> = ({
  reduced,
  size = moderateScale(150),
  reactionKey,
}) => {
  const width = size * 0.45;

  const sway = useSharedValue(0);
  const plume = useSharedValue(0);
  const blink = useSharedValue(1);
  const tipGlow = useSharedValue(0);
  const ink = useSharedValue(0);
  const react = useSharedValue(0);

  useEffect(() => {
    if (reduced) return;
    sway.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1200, easing: Easing.inOut(Easing.sin) }),
        withTiming(-1, { duration: 1200, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
      false,
    );
    // Plume oscillates faster + out of phase — extra liveliness.
    plume.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 800, easing: Easing.inOut(Easing.sin) }),
        withTiming(-1, { duration: 800, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
      false,
    );
    blink.value = withRepeat(
      withSequence(
        withDelay(4400, withTiming(0.1, { duration: 90 })),
        withTiming(1, { duration: 110 }),
      ),
      -1,
      false,
    );
    tipGlow.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.sin) }),
        withTiming(0, { duration: 1500, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
      false,
    );
    // Ink drips on a slower interval than the tip glow.
    ink.value = withRepeat(
      withSequence(
        withDelay(3200, withTiming(1, { duration: 90 })),
        withTiming(0, { duration: 720, easing: Easing.in(Easing.cubic) }),
      ),
      -1,
      false,
    );
  }, [reduced, sway, plume, blink, tipGlow, ink]);

  // Lean-forward reaction whenever the qualifier step changes.
  useEffect(() => {
    if (reduced) return;
    react.value = withSequence(
      withTiming(1, { duration: 220, easing: Easing.out(Easing.cubic) }),
      withDelay(380, withTiming(0, { duration: 320, easing: Easing.in(Easing.cubic) })),
    );
  }, [reactionKey, reduced, react]);

  // Sway pivots around the nib so the quill rocks like a real one
  // resting on its tip.
  const bodyStyle = useAnimatedStyle(() => {
    const rot = sway.value * 4 + react.value * 8;
    return {
      transform: [
        { translateY: 0 },
        { rotate: `${rot}deg` },
      ],
    };
  });
  const plumeStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${plume.value * 5}deg` }],
  }));
  const eyeStyle = useAnimatedStyle(() => ({
    transform: [{ scaleY: blink.value }],
  }));
  const inkStyle = useAnimatedStyle(() => ({
    opacity: ink.value,
    transform: [
      { translateY: ink.value * 18 },
      { scale: 1 - ink.value * 0.4 },
    ],
  }));
  const tipGlowStyle = useAnimatedStyle(() => ({
    opacity: 0.25 + tipGlow.value * 0.45 + react.value * 0.3,
    transform: [{ scale: 0.85 + tipGlow.value * 0.25 + react.value * 0.15 }],
  }));
  const haloStyle = useAnimatedStyle(() => ({
    opacity: 0.3 + tipGlow.value * 0.25,
    transform: [{ scale: 0.92 + tipGlow.value * 0.08 }],
  }));

  // Static eye/smile positions (the body group rotates around the nib).
  const eyeSize = moderateScale(7);
  const eyeOffsetY = size * 0.45; // mid-barrel, vertically
  const eyeSpacing = width * 0.35;

  return (
    <View style={{ width: width * 1.6, height: size, alignItems: "center", justifyContent: "flex-end" }}>
      {/* Soft halo behind everything. */}
      <Animated.View
        pointerEvents="none"
        style={[
          styles.halo,
          haloStyle,
          {
            width: size * 0.86,
            height: size * 0.86,
            borderRadius: size * 0.43,
            bottom: size * 0.06,
          },
        ]}
      />

      {/* Tip glow under the nib. */}
      <Animated.View
        pointerEvents="none"
        style={[
          styles.tipGlow,
          tipGlowStyle,
          {
            width: width * 1.4,
            height: width * 1.4,
            borderRadius: width * 0.7,
            bottom: -width * 0.4,
          },
        ]}
      />

      {/* Body — sways around the nib (origin set via transformOrigin). */}
      <Animated.View
        style={[
          { width, height: size, transformOrigin: "50% 100%" },
          bodyStyle,
        ]}
      >
        {/* Plume — its own animated rotation, anchored at the barrel top. */}
        <Animated.View
          style={[
            { position: "absolute", top: 0, left: 0, width, height: size * 0.34, transformOrigin: "50% 100%" },
            plumeStyle,
          ]}
        >
          <Svg width={width} height={size * 0.34} viewBox="0 0 80 70">
            <Defs>
              <SvgLinearGradient id="qk-plume" x1="0.2" y1="0" x2="0.8" y2="1">
                <Stop offset="0" stopColor="#FCD89C" />
                <Stop offset="0.55" stopColor="#F6C06A" />
                <Stop offset="1" stopColor="#D9964A" />
              </SvgLinearGradient>
            </Defs>
            <Path
              d="M 40 6
                 Q 18 14, 16 36
                 Q 22 60, 40 64
                 Q 58 60, 64 36
                 Q 62 14, 40 6 Z"
              fill="url(#qk-plume)"
              stroke="#D9964A"
              strokeWidth={1.2}
              strokeLinejoin="round"
            />
            {/* Rachis — the central shaft line on the feather. */}
            <Path
              d="M 40 10 Q 38 36 40 62"
              stroke="#5C3D12"
              strokeWidth={1}
              strokeLinecap="round"
              strokeOpacity={0.55}
              fill="none"
            />
            {/* Vane suggestion lines for texture. */}
            <Path d="M 40 18 Q 28 22 24 30" stroke="#D9964A" strokeWidth={0.8} fill="none" opacity={0.5} />
            <Path d="M 40 30 Q 26 32 22 40" stroke="#D9964A" strokeWidth={0.8} fill="none" opacity={0.5} />
            <Path d="M 40 18 Q 52 22 56 30" stroke="#D9964A" strokeWidth={0.8} fill="none" opacity={0.5} />
            <Path d="M 40 30 Q 54 32 58 40" stroke="#D9964A" strokeWidth={0.8} fill="none" opacity={0.5} />
          </Svg>
        </Animated.View>

        {/* Barrel + nib — rest of the body. */}
        <Svg
          width={width}
          height={size * 0.7}
          viewBox="0 0 80 140"
          style={{ position: "absolute", top: size * 0.32, left: 0 }}
        >
          <Defs>
            <SvgLinearGradient id="qk-barrel" x1="0" y1="0" x2="1" y2="0">
              <Stop offset="0" stopColor="#F6C06A" />
              <Stop offset="0.5" stopColor="#FFE0AE" />
              <Stop offset="1" stopColor="#D9964A" />
            </SvgLinearGradient>
            <RadialGradient id="qk-nib-glint" cx="50%" cy="35%" r="60%">
              <Stop offset="0" stopColor="#FFFFFF" stopOpacity="0.4" />
              <Stop offset="1" stopColor="#FFFFFF" stopOpacity="0" />
            </RadialGradient>
          </Defs>
          {/* Barrel */}
          <Rect x={28} y={0} width={24} height={92} rx={4} fill="url(#qk-barrel)" stroke="#D9964A" strokeWidth={1.2} />
          {/* Vertical highlight stripe */}
          <Rect x={32} y={4} width={3} height={84} rx={1.5} fill="rgba(255,255,255,0.55)" />

          {/* Nib (tapered tip) */}
          <Path d="M 28 92 L 52 92 L 40 138 Z" fill="#2A1B05" stroke="#1A0F00" strokeWidth={0.8} strokeLinejoin="round" />
          {/* Inner nib slit highlight */}
          <Path d="M 40 96 L 40 130" stroke="#5C3D12" strokeWidth={0.8} strokeOpacity={0.6} />
          {/* Glint on nib */}
          <Path d="M 33 100 L 38 96 L 40 110 Z" fill="url(#qk-nib-glint)" />
        </Svg>

        {/* Face — eyes + smile, positioned over the barrel. */}
        <View
          pointerEvents="none"
          style={[
            styles.face,
            { top: eyeOffsetY, width },
          ]}
        >
          <View style={[styles.eyesRow, { gap: eyeSpacing }]}>
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
          <View style={styles.smileWrap}>
            <Svg width={moderateScale(22)} height={moderateScale(8)} viewBox="0 0 22 8">
              <Path
                d="M 2 3 Q 6 7 11 5 Q 16 3 20 5"
                stroke="#1F504E"
                strokeWidth={1.4}
                strokeLinecap="round"
                fill="none"
              />
            </Svg>
          </View>
        </View>

        {/* Ink drop falling from the nib. */}
        <Animated.View
          pointerEvents="none"
          style={[
            styles.inkDrop,
            inkStyle,
            { left: width / 2 - moderateScale(2) },
          ]}
        />
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  halo: {
    position: "absolute",
    backgroundColor: "rgba(246,192,106,0.22)",
  },
  tipGlow: {
    position: "absolute",
    backgroundColor: "rgba(246,192,106,0.55)",
  },
  face: {
    position: "absolute",
    left: 0,
    alignItems: "center",
  },
  eyesRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  eye: {
    backgroundColor: "#1F504E",
  },
  smileWrap: {
    marginTop: moderateScale(3),
  },
  inkDrop: {
    position: "absolute",
    bottom: -moderateScale(8),
    width: moderateScale(4),
    height: moderateScale(6),
    borderRadius: moderateScale(2),
    backgroundColor: "#2A1B05",
  },
});
