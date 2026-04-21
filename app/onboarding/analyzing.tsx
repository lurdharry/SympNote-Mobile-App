import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import {
  Canvas,
  Circle,
  Group,
  RadialGradient,
  vec,
  BlurMask,
} from '@shopify/react-native-skia';
import { useTheme, spacing, typography } from '../../theme';
import { SceneTransition } from '../../components/navigation/SceneTransition';
import { TypewriterText } from '../../components/animated/TypewriterText';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { hapticLight, hapticMedium } from '../../services/haptics';
import { useTransition } from '../../components/navigation/TransitionContext';
import { useProfileStore } from '../../stores/useProfileStore';
import { getSympnoteReply } from '../../utils/onboarding';

/**
 * Screen 4 — Sympnote reflects back what it heard.
 * Instead of fake "Analyzing..." theater, we echo back real interpretations
 * of the user's answers one by one. Editorial layout: soft orb, single-line
 * lines streaming in, serif closing line.
 */
export default function Analyzing() {
  const router = useRouter();
  const { colors } = useTheme();
  const { width, height } = useWindowDimensions();
  const { triggerRadialWipe } = useTransition();
  const answers = useProfileStore((s) => s.onboardingAnswers);

  // Build reflection lines from the user's qualifier answers.
  // Only include answers we have — users can land here with fewer than 4
  // if a future iteration adds skips.
  const lines = (['hardest', 'forgetting', 'nextAppointment'] as const)
    .map((key) => {
      const v = answers[key];
      if (typeof v !== 'string' || !v) return null;
      return getSympnoteReply(key, v);
    })
    .filter((x): x is string => !!x)
    .slice(0, 3);

  const [visibleCount, setVisibleCount] = useState(0);
  const [closing, setClosing] = useState(false);

  const inhale = useSharedValue(1);

  const routerRef = useRef(router);
  routerRef.current = router;
  const wipeRef = useRef(triggerRadialWipe);
  wipeRef.current = triggerRadialWipe;
  const dimsRef = useRef({ width, height });
  dimsRef.current = { width, height };
  const navigatedRef = useRef(false);

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    // Reveal each line with a beat between them.
    lines.forEach((_, i) => {
      timers.push(
        setTimeout(() => {
          setVisibleCount(i + 1);
          hapticLight();
        }, 500 + i * 900)
      );
    });

    const closeAt = 500 + lines.length * 900 + 200;
    timers.push(
      setTimeout(() => {
        setClosing(true);
        hapticMedium();
        inhale.value = withSpring(0.97, { damping: 18, stiffness: 160 });
      }, closeAt)
    );

    timers.push(
      setTimeout(async () => {
        if (navigatedRef.current) return;
        navigatedRef.current = true;
        const { width: w, height: h } = dimsRef.current;
        await wipeRef.current({ x: w / 2, y: h / 2 });
        routerRef.current.replace('/onboarding/first-recording');
      }, closeAt + 1100)
    );

    return () => timers.forEach(clearTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const inhaleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: inhale.value }],
  }));

  return (
    <SceneTransition mode="scale-fade">
      <SafeAreaView style={[styles.root, { backgroundColor: colors.bgPrimary }]}>
        <Animated.View style={[styles.inner, inhaleStyle]}>
          <View style={styles.header}>
            <Orb size={80} />
            <View style={{ marginTop: spacing.s4 }}>
              <Text style={[typography.label, { color: colors.textSecondary }]}>
                Sympnote
              </Text>
              <Text style={[typography.caption, { color: colors.textTertiary }]}>
                {closing ? 'Ready' : 'Reflecting'}
              </Text>
            </View>
          </View>

          <View style={styles.body}>
            {lines.map((line, i) => (
              <ReflectionLine
                key={`${i}-${line}`}
                text={line}
                visible={i < visibleCount}
              />
            ))}
            {closing && (
              <View style={{ marginTop: spacing.s6 }}>
                <TypewriterText
                  text="Let's get you on record."
                  speed={26}
                  style={[
                    typography.displaySerif,
                    { color: colors.accent, fontSize: 32, lineHeight: 40 },
                  ]}
                />
              </View>
            )}
          </View>
        </Animated.View>
      </SafeAreaView>
    </SceneTransition>
  );
}

function ReflectionLine({ text, visible }: { text: string; visible: boolean }) {
  const { colors } = useTheme();
  const reduced = useReducedMotion();
  const opacity = useSharedValue(0);
  const ty = useSharedValue(8);

  useEffect(() => {
    if (!visible) return;
    opacity.value = withTiming(1, {
      duration: 300,
      easing: Easing.out(Easing.cubic),
    });
    ty.value = reduced
      ? withTiming(0, { duration: 200 })
      : withSpring(0, { damping: 18, stiffness: 140 });
  }, [visible, opacity, ty, reduced]);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: ty.value }],
  }));

  return (
    <Animated.View
      style={[
        {
          borderLeftWidth: 2,
          borderLeftColor: colors.accent,
          paddingLeft: spacing.s4,
          paddingVertical: spacing.s2,
          marginTop: spacing.s4,
        },
        style,
      ]}
    >
      <Text
        style={[
          typography.bodyLarge,
          { color: colors.textPrimary, fontSize: 19, lineHeight: 26 },
        ]}
      >
        {text}
      </Text>
    </Animated.View>
  );
}

function Orb({ size }: { size: number }) {
  const { colors } = useTheme();
  const r = size / 2;
  return (
    <Canvas style={{ width: size, height: size }}>
      <Group>
        <Circle cx={r} cy={r} r={r - 4}>
          <RadialGradient
            c={vec(r, r)}
            r={r}
            colors={[colors.accentLight, colors.accent, colors.accentDark]}
          />
          <BlurMask blur={8} style="solid" />
        </Circle>
      </Group>
    </Canvas>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  inner: {
    flex: 1,
    paddingHorizontal: spacing.s6,
    paddingTop: spacing.s10,
  },
  header: {
    flexDirection: 'column',
    alignItems: 'flex-start',
  },
  body: {
    marginTop: spacing.s10,
  },
});
