import React, { useEffect } from "react";
import { View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import Svg, { Circle, Defs, Ellipse, Path, RadialGradient, Stop } from "react-native-svg";
import { useReducedMotion } from "@/hooks/useReducedMotion";

/**
 * Five face mascots for the qualifier age question. Each is a small
 * round head with hair, eyes, and a smile — same anatomy, distinct
 * features that read as the corresponding life stage:
 *
 *  • TeenMascot      — spiky tuft of hair, big eager eyes
 *  • YouthMascot     — smooth swept fringe, calm half-smile
 *  • AdultMascot     — neat short hair, light stubble
 *  • ElderMascot     — gray temples, subtle smile lines
 *  • SeniorMascot    — silver hair + round glasses with a lens gleam
 *
 * All mascots share: cream face, teal eyes, blink loop, gentle bob.
 * Each adds one signature animation (e.g. senior's lens gleam slides
 * across the glasses).
 */

interface MascotProps {
  size: number;
  tint: string;
}

// ── Shared face primitives ─────────────────────────────────────────

const SKIN = "#F5E2C8";
const SKIN_SHADOW = "#E5CDA9";
const TEAL_DARK = "#1F504E";
const TEAL = "#2C6E6B";
const HAIR_DARK = "#1F3F3E";
const HAIR_GRAY = "#9DA5A2";
const HAIR_SILVER = "#CBD0CC";
const SMILE_W = 1.6;

const useBlink = () => {
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
  return useAnimatedStyle(() => ({ transform: [{ scaleY: blink.value }] }));
};

const useBob = (amplitude = 3, period = 2000) => {
  const reduced = useReducedMotion();
  const bob = useSharedValue(0);
  useEffect(() => {
    if (reduced) return;
    bob.value = withRepeat(
      withSequence(
        withTiming(1, { duration: period / 2, easing: Easing.inOut(Easing.sin) }),
        withTiming(0, { duration: period / 2, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
      false,
    );
  }, [reduced, bob, period]);
  return useAnimatedStyle(() => ({
    transform: [{ translateY: -bob.value * amplitude }],
  }));
};

const Eyes: React.FC<{ size: number; cy?: number; spread?: number; pupilColor?: string }> = ({
  size,
  cy = 0.55,
  spread = 0.2,
  pupilColor = TEAL_DARK,
}) => {
  const blinkStyle = useBlink();
  const eyeSize = size * 0.06;
  return (
    <View
      pointerEvents="none"
      style={{
        position: "absolute",
        top: cy * size - eyeSize / 2,
        left: 0,
        right: 0,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: spread * size,
      }}
    >
      <Animated.View
        style={[
          {
            width: eyeSize,
            height: eyeSize,
            borderRadius: eyeSize / 2,
            backgroundColor: pupilColor,
          },
          blinkStyle,
        ]}
      />
      <Animated.View
        style={[
          {
            width: eyeSize,
            height: eyeSize,
            borderRadius: eyeSize / 2,
            backgroundColor: pupilColor,
          },
          blinkStyle,
        ]}
      />
    </View>
  );
};

// Common helpers for the SVG body of each face: head ellipse + smile.
const Head: React.FC = () => (
  <>
    <Ellipse cx={40} cy={48} rx={24} ry={28} fill={SKIN} stroke={TEAL_DARK} strokeWidth={1.2} />
    {/* Subtle face shadow on the right cheek for shape */}
    <Path
      d="M 56 38 Q 64 56 56 70 Q 50 66 50 50 Q 52 42 56 38 Z"
      fill={SKIN_SHADOW}
      opacity={0.4}
    />
  </>
);

const SmileGentle: React.FC = () => (
  <Path d="M 30 64 Q 40 70 50 64" stroke={TEAL_DARK} strokeWidth={SMILE_W} strokeLinecap="round" fill="none" />
);

const SmileSoft: React.FC = () => (
  <Path d="M 32 64 Q 40 67 48 64" stroke={TEAL_DARK} strokeWidth={SMILE_W} strokeLinecap="round" fill="none" />
);

const SmileWarm: React.FC = () => (
  <Path d="M 28 62 Q 40 72 52 62" stroke={TEAL_DARK} strokeWidth={SMILE_W} strokeLinecap="round" fill="none" />
);

// ── 1. Teen (12 to 17) ─────────────────────────────────────────────

export const TeenMascot: React.FC<MascotProps> = ({ size }) => {
  const bobStyle = useBob(3, 1800);
  return (
    <Animated.View style={[{ width: size, height: size, alignItems: "center", justifyContent: "center" }, bobStyle]}>
      <Svg width={size * 0.92} height={size * 0.92} viewBox="0 0 80 80">
        <Head />
        {/* Spiky hair tuft — a few crests on top of the head */}
        <Path
          d="M 18 32
             C 18 22, 24 16, 30 16
             L 30 26
             L 36 14
             L 40 24
             L 44 12
             L 50 24
             L 56 16
             C 60 18, 62 26, 62 34
             Q 56 28, 48 30
             Q 40 28, 34 32
             Q 26 30, 18 32 Z"
          fill={HAIR_DARK}
          stroke={HAIR_DARK}
          strokeWidth={0.8}
          strokeLinejoin="round"
        />
        <SmileGentle />
      </Svg>
      <Eyes size={size * 0.92} cy={0.56} spread={0.18} />
    </Animated.View>
  );
};

// ── 2. Youth (18 to 29) ────────────────────────────────────────────

export const YouthMascot: React.FC<MascotProps> = ({ size }) => {
  const bobStyle = useBob(2.5, 2400);
  return (
    <Animated.View style={[{ width: size, height: size, alignItems: "center", justifyContent: "center" }, bobStyle]}>
      <Svg width={size * 0.92} height={size * 0.92} viewBox="0 0 80 80">
        <Head />
        {/* Smooth swept fringe across the forehead */}
        <Path
          d="M 16 34
             Q 22 18, 38 18
             Q 56 16, 64 32
             Q 60 34, 50 32
             Q 38 30, 26 36
             Q 20 38, 16 34 Z"
          fill={HAIR_DARK}
          stroke={HAIR_DARK}
          strokeWidth={0.8}
          strokeLinejoin="round"
        />
        {/* Confident half-smile (slightly asymmetric) */}
        <Path
          d="M 30 64 Q 38 70 52 62"
          stroke={TEAL_DARK}
          strokeWidth={SMILE_W}
          strokeLinecap="round"
          fill="none"
        />
      </Svg>
      <Eyes size={size * 0.92} cy={0.56} spread={0.2} />
    </Animated.View>
  );
};

// ── 3. Adult (30 to 49) ────────────────────────────────────────────

export const AdultMascot: React.FC<MascotProps> = ({ size }) => {
  const bobStyle = useBob(2, 2800);
  return (
    <Animated.View style={[{ width: size, height: size, alignItems: "center", justifyContent: "center" }, bobStyle]}>
      <Svg width={size * 0.92} height={size * 0.92} viewBox="0 0 80 80">
        <Head />
        {/* Neat short hair — capped, a touch above the ears */}
        <Path
          d="M 16 32
             Q 24 18, 40 18
             Q 56 18, 64 32
             Q 60 30, 56 30
             Q 50 26, 40 26
             Q 30 26, 24 30
             Q 20 30, 16 32 Z"
          fill={HAIR_DARK}
          stroke={HAIR_DARK}
          strokeWidth={0.8}
          strokeLinejoin="round"
        />
        {/* Light stubble — five faint dots along the jaw */}
        <Circle cx={30} cy={70} r={0.7} fill={TEAL_DARK} opacity={0.45} />
        <Circle cx={34} cy={73} r={0.7} fill={TEAL_DARK} opacity={0.45} />
        <Circle cx={40} cy={74} r={0.7} fill={TEAL_DARK} opacity={0.45} />
        <Circle cx={46} cy={73} r={0.7} fill={TEAL_DARK} opacity={0.45} />
        <Circle cx={50} cy={70} r={0.7} fill={TEAL_DARK} opacity={0.45} />
        <SmileSoft />
      </Svg>
      <Eyes size={size * 0.92} cy={0.55} spread={0.2} />
    </Animated.View>
  );
};

// ── 4. Elder (50 to 64) — gray temples + smile lines ──────────────

export const ElderMascot: React.FC<MascotProps> = ({ size }) => {
  const bobStyle = useBob(2, 3000);
  return (
    <Animated.View style={[{ width: size, height: size, alignItems: "center", justifyContent: "center" }, bobStyle]}>
      <Svg width={size * 0.92} height={size * 0.92} viewBox="0 0 80 80">
        <Head />
        {/* Hair base — combed back, slightly receding */}
        <Path
          d="M 18 34
             Q 24 20, 40 20
             Q 56 20, 62 34
             Q 56 30, 50 30
             Q 40 30, 30 30
             Q 24 30, 18 34 Z"
          fill={TEAL}
          stroke={TEAL}
          strokeWidth={0.8}
          strokeLinejoin="round"
        />
        {/* Gray temple streaks */}
        <Path
          d="M 16 36 Q 18 28 24 26"
          stroke={HAIR_GRAY}
          strokeWidth={2}
          strokeLinecap="round"
          fill="none"
        />
        <Path
          d="M 64 36 Q 62 28 56 26"
          stroke={HAIR_GRAY}
          strokeWidth={2}
          strokeLinecap="round"
          fill="none"
        />
        {/* Subtle smile lines beside the mouth */}
        <Path
          d="M 26 62 Q 28 64 30 64"
          stroke={TEAL_DARK}
          strokeWidth={0.8}
          strokeLinecap="round"
          fill="none"
          opacity={0.45}
        />
        <Path
          d="M 50 64 Q 52 64 54 62"
          stroke={TEAL_DARK}
          strokeWidth={0.8}
          strokeLinecap="round"
          fill="none"
          opacity={0.45}
        />
        <SmileSoft />
      </Svg>
      <Eyes size={size * 0.92} cy={0.55} spread={0.2} />
    </Animated.View>
  );
};

// ── 5. Senior (65+) — silver hair + round glasses ─────────────────

export const SeniorMascot: React.FC<MascotProps> = ({ size }) => {
  const reduced = useReducedMotion();
  const bobStyle = useBob(1.5, 3200);
  // Lens gleam slides left → right across both lenses.
  const gleam = useSharedValue(0);
  useEffect(() => {
    if (reduced) return;
    gleam.value = withRepeat(
      withSequence(
        withDelay(2400, withTiming(1, { duration: 700, easing: Easing.out(Easing.cubic) })),
        withTiming(0, { duration: 0 }),
      ),
      -1,
      false,
    );
  }, [reduced, gleam]);
  const gleamStyle = useAnimatedStyle(() => ({
    opacity: gleam.value > 0 ? 0.7 : 0,
    transform: [{ translateX: -2 + gleam.value * 4 }],
  }));

  const eyeSize = size * 0.92 * 0.05;
  // Eye positions inside each lens — derived from the SVG's lens
  // centers (cx 28, 52 in viewBox 80) scaled to the actual size.
  const faceSize = size * 0.92;
  const lensYpx = faceSize * (50 / 80);
  const leftLensXpx = faceSize * (28 / 80) - eyeSize / 2;
  const rightLensXpx = faceSize * (52 / 80) - eyeSize / 2;
  // The face SVG is centered horizontally inside the wrapper, so the
  // eye absolute positions need to account for the wrapper margin.
  const wrapPadX = (size - faceSize) / 2;

  return (
    <Animated.View
      style={[{ width: size, height: size, alignItems: "center", justifyContent: "center" }, bobStyle]}
    >
      <Svg width={faceSize} height={faceSize} viewBox="0 0 80 80">
        <Defs>
          <RadialGradient id="senior-hair" cx="50%" cy="40%" r="60%">
            <Stop offset="0" stopColor={HAIR_SILVER} />
            <Stop offset="1" stopColor={HAIR_GRAY} />
          </RadialGradient>
        </Defs>
        <Head />
        {/* Silver hair — fuller cap shape */}
        <Path
          d="M 14 32
             Q 22 14, 40 14
             Q 58 14, 66 32
             Q 58 28, 40 28
             Q 22 28, 14 32 Z"
          fill="url(#senior-hair)"
          stroke={HAIR_GRAY}
          strokeWidth={0.8}
          strokeLinejoin="round"
        />
        {/* Side hair sweeping past the temple */}
        <Path
          d="M 12 38 Q 14 50 18 56"
          stroke={HAIR_GRAY}
          strokeWidth={2.2}
          strokeLinecap="round"
          fill="none"
        />
        <Path
          d="M 68 38 Q 66 50 62 56"
          stroke={HAIR_GRAY}
          strokeWidth={2.2}
          strokeLinecap="round"
          fill="none"
        />
        {/* Round glasses */}
        <Circle cx={28} cy={50} r={9} stroke={TEAL_DARK} strokeWidth={1.4} fill={SKIN} />
        <Circle cx={52} cy={50} r={9} stroke={TEAL_DARK} strokeWidth={1.4} fill={SKIN} />
        <Path d="M 37 50 L 43 50" stroke={TEAL_DARK} strokeWidth={1.4} />
        {/* Lens highlights — static base shine */}
        <Circle cx={25} cy={47} r={2} fill="#FFFFFF" opacity={0.5} />
        <Circle cx={49} cy={47} r={2} fill="#FFFFFF" opacity={0.5} />
        <SmileWarm />
      </Svg>

      {/* Eyes inside the lenses (rendered as Views so blink works). */}
      <View
        pointerEvents="none"
        style={{
          position: "absolute",
          top: lensYpx - eyeSize / 2 + (size - faceSize) / 2,
          left: 0,
          right: 0,
        }}
      >
        <SeniorLensEye
          left={leftLensXpx + wrapPadX}
          eyeSize={eyeSize}
        />
        <SeniorLensEye
          left={rightLensXpx + wrapPadX}
          eyeSize={eyeSize}
        />
      </View>

      {/* Travelling lens gleam — a slim white streak that slides left
          to right across the lens area. */}
      <Animated.View
        pointerEvents="none"
        style={[
          {
            position: "absolute",
            top: lensYpx - eyeSize + (size - faceSize) / 2,
            left: leftLensXpx + wrapPadX - eyeSize,
            width: faceSize * (28 / 80) + eyeSize * 2,
            height: 1.4,
            backgroundColor: "#FFFFFF",
            borderRadius: 1,
          },
          gleamStyle,
        ]}
      />
    </Animated.View>
  );
};

const SeniorLensEye: React.FC<{ left: number; eyeSize: number }> = ({ left, eyeSize }) => {
  const blinkStyle = useBlink();
  return (
    <Animated.View
      style={[
        {
          position: "absolute",
          left,
          width: eyeSize,
          height: eyeSize,
          borderRadius: eyeSize / 2,
          backgroundColor: TEAL_DARK,
        },
        blinkStyle,
      ]}
    />
  );
};
