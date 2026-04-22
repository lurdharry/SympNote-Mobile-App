import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { RadialGradient } from 'react-native-svg';
import Svg, {
  Circle as SvgCircle,
  Defs,
  Stop,
} from 'react-native-svg';
import { Brain, Check, Sparkles } from 'lucide-react-native';
import { makeStyles, moderateScale, scale, spacing, typography, useTheme, verticalScale } from '../../theme';
import { SceneTransition } from '../../components/navigation/SceneTransition';
import { BackButton } from '../../components/ui/BackButton';
import { PrimaryButton } from '../../components/ui/PrimaryButton';
import { Confetti } from '../../components/ui/Confetti';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { hapticLight, hapticSuccess } from '../../services/haptics';
import { ANALYZING_STEPS } from '../../constants/analyzing';

/**
 * Screen 05 — Analyzing.
 *
 * Interstitial with:
 *  - Outer dashed orbit ring (12s linear spin)
 *  - Inner solid gold ring (8s reverse spin)
 *  - Central radial-gradient orb with soft pulse (2.4s ease-in-out)
 *  - 3 staged check rows, each with a +10 XP badge when complete
 *  - Confetti + "Your plan is ready!" + enabled CTA when all three done
 *
 * Timing (from handoff): 1100ms → 2300ms → 3500ms → 4000ms ready.
 */

type IconRef = typeof Brain;
const STEPS = ANALYZING_STEPS;

export default function ScreenAnalyzing() {
  const router = useRouter();
  const { colors } = useTheme();
  const styles = useStyles();
  const reduced = useReducedMotion();

  const [done, setDone] = useState([false, false, false]);
  const [activeText, setActiveText] = useState(0);
  const [ready, setReady] = useState(false);
  const [confetti, setConfetti] = useState(false);

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    timers.push(
      setTimeout(() => {
        setDone((d) => [true, d[1]!, d[2]!]);
        setActiveText(1);
        hapticLight();
      }, 1100)
    );
    timers.push(
      setTimeout(() => {
        setDone((d) => [d[0]!, true, d[2]!]);
        setActiveText(2);
        hapticLight();
      }, 2300)
    );
    timers.push(
      setTimeout(() => {
        setDone((d) => [d[0]!, d[1]!, true]);
        hapticLight();
      }, 3500)
    );
    timers.push(
      setTimeout(() => {
        setReady(true);
        setConfetti(true);
        hapticSuccess();
      }, 4000)
    );
    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <SceneTransition mode="scale-fade">
      <View style={[styles.root, { backgroundColor: colors.bgPrimary }]}>
        <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
          <View style={styles.topBar}>
            <BackButton onPress={() => router.back()} />
          </View>

          <View style={styles.hero}>
            <Confetti show={confetti} />
            <OrbitOrb ready={ready} reduced={reduced} />

            <View style={styles.textSlot}>
              {ready ? (
                <Text
                  style={[
                    typography.h1,
                    { color: colors.textPrimary, textAlign: 'center' },
                  ]}
                >
                  Your plan is ready
                </Text>
              ) : (
                <Text
                  key={activeText}
                  style={[
                    typography.h2,
                    { color: colors.textPrimary, textAlign: 'center' },
                  ]}
                >
                  {STEPS[activeText]!.t}
                  <Text style={{ color: colors.accent }}>▍</Text>
                </Text>
              )}
            </View>

            <View style={styles.checkList}>
              {STEPS.map((s, i) => (
                <CheckRow
                  key={i}
                  label={s.t}
                  Icon={s.Icon}
                  done={done[i]!}
                  success={colors.success}
                />
              ))}
            </View>
          </View>

          <View style={{ paddingHorizontal: spacing.s6, paddingBottom: spacing.s10 }}>
            <PrimaryButton
              label={ready ? "Let's go · +30 XP" : 'Preparing…'}
              disabled={!ready}
              onPress={() => router.push('/onboarding/first-recording')}
            />
          </View>
        </SafeAreaView>
      </View>
    </SceneTransition>
  );
}

function OrbitOrb({
  ready,
  reduced,
}: {
  ready: boolean;
  reduced: boolean;
}) {
  const styles = useStyles();
  const spin1 = useSharedValue(0);
  const spin2 = useSharedValue(0);
  const pulse = useSharedValue(0);

  useEffect(() => {
    if (reduced) return;
    spin1.value = withRepeat(
      withTiming(1, { duration: 12000, easing: Easing.linear }),
      -1,
      false
    );
    spin2.value = withRepeat(
      withTiming(-1, { duration: 8000, easing: Easing.linear }),
      -1,
      false
    );
    pulse.value = withRepeat(
      withTiming(1, { duration: 2400, easing: Easing.inOut(Easing.quad) }),
      -1,
      true
    );
  }, [reduced, spin1, spin2, pulse]);

  const ring1Style = useAnimatedStyle(() => ({
    transform: [{ rotate: `${spin1.value * 360}deg` }],
  }));
  const ring2Style = useAnimatedStyle(() => ({
    transform: [{ rotate: `${spin2.value * 360}deg` }],
  }));
  const orbStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 1 + pulse.value * 0.06 }],
    shadowOpacity: 0.4 + pulse.value * 0.25,
    shadowRadius: 24 + pulse.value * 16,
  }));

  return (
    <View style={styles.orbFrame}>
      <Animated.View
        style={[
          styles.orbitRing,
          {
            width: 220,
            height: 220,
            borderColor: 'rgba(44,110,107,0.25)',
            borderStyle: 'dashed',
            borderWidth: 2,
          },
          ring1Style,
        ]}
      />
      <Animated.View
        style={[
          styles.orbitRing,
          {
            width: 180,
            height: 180,
            borderColor: 'rgba(246,192,106,0.3)',
            borderWidth: 2,
          },
          ring2Style,
        ]}
      />
      <Animated.View
        style={[
          styles.orb,
          {
            shadowColor: '#2C6E6B',
            shadowOffset: { width: 0, height: 10 },
          },
          orbStyle,
        ]}
      >
        <OrbGradient />
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
          <View
            style={{
              flex: 1,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {ready ? (
              <Check size={44} color="#FFFFFF" strokeWidth={3} />
            ) : (
              <Sparkles size={40} color="#FFFFFF" strokeWidth={2} />
            )}
          </View>
        </View>
      </Animated.View>
    </View>
  );
}

function OrbGradient() {
  return (
    <Svg width="100%" height="100%" viewBox="0 0 140 140">
      <Defs>
        <RadialGradient id="orbGrad" cx="0.3" cy="0.3" r="0.8">
          <Stop offset="0" stopColor="#A8C4C2" />
          <Stop offset="0.7" stopColor="#2C6E6B" />
          <Stop offset="1" stopColor="#1F504E" />
        </RadialGradient>
      </Defs>
      <SvgCircle cx={70} cy={70} r={70} fill="url(#orbGrad)" />
    </Svg>
  );
}

function CheckRow({
  label,
  Icon,
  done,
  success,
}: {
  label: string;
  Icon: IconRef;
  done: boolean;
  success: string;
}) {
  const { colors } = useTheme();
  const styles = useStyles();
  return (
    <View
      style={[
        styles.checkRow,
        {
          backgroundColor: done ? success + '14' : 'transparent',
          opacity: done ? 1 : 0.5,
        },
      ]}
    >
      <View
        style={[
          styles.checkIcon,
          { backgroundColor: done ? success : colors.bgMuted },
        ]}
      >
        {done ? (
          <Check size={16} color="#FFFFFF" strokeWidth={3} />
        ) : (
          <Icon size={16} color={colors.textSecondary} strokeWidth={2} />
        )}
      </View>
      <Text
        style={[
          typography.bodyLarge,
          {
            color: done ? colors.textPrimary : colors.textTertiary,
            fontFamily: done ? 'Inter_500Medium' : 'Inter_400Regular',
            flex: 1,
          },
        ]}
      >
        {label}
      </Text>
      {done && (
        <Text
          style={[
            typography.label,
            {
              color: success,
              fontFamily: 'Inter_700Bold',
            },
          ]}
        >
          +10 XP
        </Text>
      )}
    </View>
  );
}

const useStyles = makeStyles((theme) => ({
  root: { flex: 1 },
  safe: { flex: 1 },
  topBar: {
    paddingTop: theme.spacing.s3,
    paddingHorizontal: theme.spacing.s6,
  },
  hero: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.s6,
  },
  orbFrame: {
    width: moderateScale(220),
    height: moderateScale(220),
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.s10,
  },
  orbitRing: {
    position: 'absolute',
    borderRadius: theme.radius.full,
  },
  orb: {
    width: moderateScale(140),
    height: moderateScale(140),
    borderRadius: moderateScale(70),
    overflow: 'hidden',
    elevation: 8,
  },
  textSlot: {
    height: verticalScale(40),
    marginBottom: theme.spacing.s8,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  checkList: {
    width: '100%',
    maxWidth: scale(300),
    gap: moderateScale(10),
  },
  checkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(12),
    padding: moderateScale(12),
    borderRadius: theme.radius.md,
  },
  checkIcon: {
    width: moderateScale(32),
    height: moderateScale(32),
    borderRadius: moderateScale(16),
    alignItems: 'center',
    justifyContent: 'center',
  },
}));
