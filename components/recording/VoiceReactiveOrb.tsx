import React, { useEffect } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import {
  BlurMask,
  Canvas,
  Circle,
  Group,
  Path,
  RadialGradient,
  Skia,
  useClock,
  vec,
} from '@shopify/react-native-skia';
import { useDerivedValue } from 'react-native-reanimated';
import { useTheme } from '../../theme';
import { useReducedMotion } from '../../hooks/useReducedMotion';

/**
 * Organic, voice-reactive orb.
 *
 * Layers (back to front):
 *   - Outer halo: heavily blurred circle whose radius & opacity track the
 *     meter. Gives the "presence" of the voice in the room.
 *   - Middle glow: softer radial gradient wash, cooler than the core.
 *   - Core blob: animated 8-vertex path whose vertex radii are perturbed
 *     by a phase-shifted sine of (clock + meter). This is what makes the
 *     orb feel alive rather than geometric.
 *   - Inner highlight: small bright core that rides on meter strongly.
 *
 * While idle (active=false), the orb breathes gently from a low-amp
 * simulated meter. While active, it follows the real SharedValue<number>
 * meter written by the speech engine.
 *
 * The whole orb is a Pressable — it doubles as the record button.
 */

type Props = {
  active: boolean;
  /**
   * 0..1 current voice amplitude. Updates off the JS thread.
   * Ignored while `active` is false (orb breathes from an internal phase).
   */
  meterSv?: SharedValue<number>;
  onPress?: () => void;
  size?: number;
  disabled?: boolean;
};

const VERTEX_COUNT = 10;
const TWO_PI = Math.PI * 2;

export function VoiceReactiveOrb({
  active,
  meterSv,
  onPress,
  size = 220,
  disabled = false,
}: Props) {
  const { colors } = useTheme();
  const reduced = useReducedMotion();
  const clock = useClock();

  // Tap feedback + persistent breathing scale.
  const press = useSharedValue(1);
  const breathe = useSharedValue(1);

  useEffect(() => {
    // Subtle scale bump when recording starts so the whole orb feels
    // like it "takes a breath in" — matches the haptic.
    breathe.value = withSpring(active ? 1.08 : 1, {
      damping: 16,
      stiffness: 140,
    });
  }, [active, breathe]);

  const wrapStyle = useAnimatedStyle(() => ({
    transform: [{ scale: press.value * breathe.value }],
  }));

  const center = size / 2;
  const baseR = size * 0.3;

  // Smoothed meter. Raw meter ticks at 300ms and would look jittery;
  // easing toward the target value on every frame keeps motion buttery.
  const smoothedMeter = useSharedValue(0);
  useDerivedValue(() => {
    const target = active && meterSv ? meterSv.value : 0;
    // Idle breathing: simulated gentle amplitude so the orb never feels
    // dead when waiting for you to tap.
    const idlePhase = reduced
      ? 0
      : Math.sin(clock.value / 900) * 0.15 + 0.15;
    const effective = active ? target : idlePhase;
    // Exponential smoothing (no framerate dependency required — Skia's
    // frame callback runs at display refresh).
    smoothedMeter.value += (effective - smoothedMeter.value) * 0.15;
  });

  /** Animated organic blob path — the core shape. */
  const blobPath = useDerivedValue(() => {
    const path = Skia.Path.Make();
    const t = clock.value / 1000;
    const m = smoothedMeter.value;
    // Wobble amplitude scales with both meter and a minimum idle amount.
    const wobbleAmp = baseR * (0.02 + m * 0.12);
    // Multiple octaves of sine give the outline a non-mechanical shape.
    const pts: Array<[number, number]> = [];
    for (let i = 0; i < VERTEX_COUNT; i++) {
      const angle = (i / VERTEX_COUNT) * TWO_PI;
      const phase = i * 0.73;
      const wobble =
        Math.sin(t * 1.1 + phase) * wobbleAmp +
        Math.sin(t * 2.3 + phase * 0.6) * wobbleAmp * 0.45;
      const r = baseR + wobble + m * baseR * 0.25;
      pts.push([center + Math.cos(angle) * r, center + Math.sin(angle) * r]);
    }
    // Close the path using quadratic midpoints between consecutive
    // vertices for a smooth outline.
    const first = pts[0]!;
    path.moveTo((first[0] + pts[VERTEX_COUNT - 1]![0]) / 2, (first[1] + pts[VERTEX_COUNT - 1]![1]) / 2);
    for (let i = 0; i < VERTEX_COUNT; i++) {
      const curr = pts[i]!;
      const next = pts[(i + 1) % VERTEX_COUNT]!;
      const midX = (curr[0] + next[0]) / 2;
      const midY = (curr[1] + next[1]) / 2;
      path.quadTo(curr[0], curr[1], midX, midY);
    }
    path.close();
    return path;
  });

  /** Outer halo radius — tracks meter more dramatically than the core. */
  const haloR = useDerivedValue(
    () => baseR * 1.35 + smoothedMeter.value * baseR * 0.9
  );
  const haloOp = useDerivedValue(() => 0.2 + smoothedMeter.value * 0.4);

  /** Inner bright spot. */
  const coreR = useDerivedValue(() => baseR * 0.35 + smoothedMeter.value * 10);

  /**
   * Color progression: the radial gradient interpolates between cool and
   * warm palettes based on meter. High amplitude = warm amber; baseline =
   * teal. Skia radial gradient colors must be a plain array (can't be a
   * derived value), so we snapshot them from a derived string array.
   */
  const gradientColors = useDerivedValue<string[]>(() => {
    const m = smoothedMeter.value;
    if (m < 0.05) {
      return [colors.accentLight, colors.accent, colors.accentDark];
    }
    const warmth = Math.min(1, m * 1.4);
    // Manual hex mix — keeps us off the JS thread.
    const mix = (a: string, b: string, t: number) => {
      const ai = parseInt(a.slice(1), 16);
      const bi = parseInt(b.slice(1), 16);
      const ar = (ai >> 16) & 0xff;
      const ag = (ai >> 8) & 0xff;
      const ab = ai & 0xff;
      const br = (bi >> 16) & 0xff;
      const bg = (bi >> 8) & 0xff;
      const bb = bi & 0xff;
      const r = Math.round(ar + (br - ar) * t);
      const g = Math.round(ag + (bg - ag) * t);
      const b2 = Math.round(ab + (bb - ab) * t);
      return `#${((r << 16) | (g << 8) | b2).toString(16).padStart(6, '0')}`;
    };
    return [
      mix(colors.accentLight, '#F2B36E', warmth),
      mix(colors.accent, '#E08B3F', warmth),
      mix(colors.accentDark, '#C4701F', warmth),
    ];
  });

  const haloColor = useDerivedValue(() =>
    active && smoothedMeter.value > 0.25 ? '#E08B3F' : colors.accent
  );

  return (
    <Animated.View style={wrapStyle}>
      <Pressable
        onPress={onPress}
        disabled={disabled}
        onPressIn={() => {
          press.value = withSpring(0.96, { damping: 20, stiffness: 260 });
        }}
        onPressOut={() => {
          press.value = withSpring(1, { damping: 18, stiffness: 180 });
        }}
        style={{ width: size, height: size }}
      >
        <Canvas style={StyleSheet.absoluteFill}>
          <Group>
            {/* Outer halo — dramatically reactive */}
            <Circle cx={center} cy={center} r={haloR} opacity={haloOp} color={haloColor}>
              <BlurMask blur={22} style="normal" />
            </Circle>

            {/* Middle glow */}
            <Circle cx={center} cy={center} r={baseR * 1.08}>
              <RadialGradient
                c={vec(center, center)}
                r={baseR * 1.1}
                colors={gradientColors}
              />
              <BlurMask blur={14} style="solid" />
            </Circle>

            {/* Core organic blob */}
            <Path path={blobPath}>
              <RadialGradient
                c={vec(center, center)}
                r={baseR}
                colors={gradientColors}
              />
              <BlurMask blur={6} style="solid" />
            </Path>

            {/* Inner highlight */}
            <Circle
              cx={center - baseR * 0.2}
              cy={center - baseR * 0.25}
              r={coreR}
              color="rgba(255,255,255,0.35)"
            >
              <BlurMask blur={8} style="normal" />
            </Circle>
          </Group>
        </Canvas>
      </Pressable>
    </Animated.View>
  );
}

const _styles = StyleSheet.create({});
