import React, { useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  Easing,
  FadeIn,
  SharedValue,
  useAnimatedProps,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { TextInput as RNTextInput } from 'react-native';
import { RadialGradient } from 'react-native-svg';
import Svg, {
  Circle as SvgCircle,
  Defs,
  Stop,
} from 'react-native-svg';
import { Brain, Check, Sparkles, Zap } from 'lucide-react-native';
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

/** Types `text` out one character at a time. Resets on text change. */
function useTypewriter(text: string, charMs: number, enabled: boolean) {
  const [typed, setTyped] = useState('');
  useEffect(() => {
    if (!enabled) {
      setTyped(text);
      return;
    }
    setTyped('');
    let i = 0;
    const id = setInterval(() => {
      i += 1;
      setTyped(text.slice(0, i));
      if (i >= text.length) clearInterval(id);
    }, charMs);
    return () => clearInterval(id);
  }, [text, charMs, enabled]);
  return typed;
}

const XP_PER_STEP = 10;

export default function ScreenAnalyzing() {
  const router = useRouter();
  const { colors } = useTheme();
  const styles = useStyles();
  const reduced = useReducedMotion();

  const [done, setDone] = useState([false, false, false]);
  const [activeText, setActiveText] = useState(0);
  const [ready, setReady] = useState(false);
  const [confetti, setConfetti] = useState(false);

  const completedCount = done.filter(Boolean).length;
  const xpEarned = completedCount * XP_PER_STEP;

  // Progress 0..1 and total XP, spring-animated as steps complete.
  // Drives the orb's progress arc and the XP ticker at the top.
  const progressSv = useSharedValue(0);
  const xpSv = useSharedValue(0);
  const xpPulse = useSharedValue(0);
  useEffect(() => {
    const target = completedCount / STEPS.length;
    if (reduced) {
      progressSv.value = target;
      xpSv.value = xpEarned;
      return;
    }
    progressSv.value = withTiming(target, {
      duration: 520,
      easing: Easing.out(Easing.cubic),
    });
    xpSv.value = withTiming(xpEarned, {
      duration: 520,
      easing: Easing.out(Easing.cubic),
    });
    // XP pill pops on change — bigger pop on the final step.
    const popTo = completedCount === STEPS.length ? 1.22 : 1.12;
    xpPulse.value = withSequence(
      withTiming(popTo, { duration: 160, easing: Easing.out(Easing.cubic) }),
      withSpring(1, { damping: 9, stiffness: 180 })
    );
  }, [completedCount, xpEarned, reduced, progressSv, xpSv, xpPulse]);

  const xpDisplay = useDerivedValue(() => Math.round(xpSv.value));

  // Typewriter: types the active step's label out char by char.
  const typedText = useTypewriter(STEPS[activeText]!.t, 32, !reduced);

  // Blinking caret — toggles opacity via a reanimated loop so the
  // cursor feels alive rather than pasted in.
  const caretOpacity = useSharedValue(1);
  useEffect(() => {
    if (reduced) {
      caretOpacity.value = 1;
      return;
    }
    caretOpacity.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 420, easing: Easing.inOut(Easing.quad) }),
        withTiming(0.15, { duration: 420, easing: Easing.inOut(Easing.quad) })
      ),
      -1,
      false
    );
  }, [reduced, caretOpacity]);
  const caretStyle = useAnimatedStyle(() => ({
    opacity: caretOpacity.value,
  }));

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

            <XPTicker
              xp={xpEarned}
              total={STEPS.length * XP_PER_STEP}
              pulse={xpPulse}
            />

            <OrbitOrb
              ready={ready}
              reduced={reduced}
              progress={progressSv}
              completedCount={completedCount}
            />

            <View style={styles.textSlot}>
              {ready ? (
                <Animated.Text
                  key="ready"
                  entering={FadeIn.duration(320)}
                  style={[
                    typography.h1,
                    { color: colors.textPrimary, textAlign: 'center' },
                  ]}
                >
                  Your plan is ready
                </Animated.Text>
              ) : (
                <Text
                  style={[
                    typography.h2,
                    { color: colors.textPrimary, textAlign: 'center' },
                  ]}
                >
                  {typedText}
                  <Animated.Text
                    style={[{ color: colors.accent }, caretStyle]}
                  >
                    ▍
                  </Animated.Text>
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

const ORB_SIZE = moderateScale(220);
const PROGRESS_RADIUS = (ORB_SIZE - moderateScale(20)) / 2;
const PROGRESS_CIRC = 2 * Math.PI * PROGRESS_RADIUS;
const AnimatedSvgCircle = Animated.createAnimatedComponent(SvgCircle);

function OrbitOrb({
  ready,
  reduced,
  progress,
  completedCount,
}: {
  ready: boolean;
  reduced: boolean;
  progress: SharedValue<number>;
  completedCount: number;
}) {
  const styles = useStyles();
  const spin1 = useSharedValue(0);
  const pulse = useSharedValue(0);
  const flash = useSharedValue(0);

  useEffect(() => {
    if (reduced) return;
    spin1.value = withRepeat(
      withTiming(1, { duration: 12000, easing: Easing.linear }),
      -1,
      false
    );
    pulse.value = withRepeat(
      withTiming(1, { duration: 2400, easing: Easing.inOut(Easing.quad) }),
      -1,
      true
    );
  }, [reduced, spin1, pulse]);

  // Fire a flash bump every time a step lands.
  useEffect(() => {
    if (reduced || completedCount === 0) return;
    flash.value = withSequence(
      withTiming(1, { duration: 180, easing: Easing.out(Easing.cubic) }),
      withTiming(0, { duration: 520, easing: Easing.in(Easing.cubic) })
    );
  }, [completedCount, reduced, flash]);

  const ring1Style = useAnimatedStyle(() => ({
    transform: [{ rotate: `${spin1.value * 360}deg` }],
  }));
  const orbStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: 1 + pulse.value * 0.06 + flash.value * 0.1 },
    ],
    shadowOpacity: 0.4 + pulse.value * 0.25 + flash.value * 0.35,
    shadowRadius: 24 + pulse.value * 16 + flash.value * 18,
  }));
  const haloStyle = useAnimatedStyle(() => ({
    opacity: flash.value * 0.55,
    transform: [{ scale: 1 + flash.value * 0.2 }],
  }));

  // Progress-arc stroke-dashoffset — fills CW as steps complete.
  const arcProps = useAnimatedProps(() => ({
    strokeDashoffset: PROGRESS_CIRC * (1 - progress.value),
  }));

  return (
    <View style={styles.orbFrame}>
      {/* Outer dashed ring — ambient motion. */}
      <Animated.View
        style={[
          styles.orbitRing,
          {
            width: ORB_SIZE,
            height: ORB_SIZE,
            borderColor: 'rgba(44,110,107,0.25)',
            borderStyle: 'dashed',
            borderWidth: 2,
          },
          ring1Style,
        ]}
      />

      {/* Progress arc — functional, reads 0→100%. */}
      <Svg
        width={ORB_SIZE}
        height={ORB_SIZE}
        style={{
          position: 'absolute',
          transform: [{ rotate: '-90deg' }],
        }}
      >
        <SvgCircle
          cx={ORB_SIZE / 2}
          cy={ORB_SIZE / 2}
          r={PROGRESS_RADIUS}
          stroke="rgba(246,192,106,0.18)"
          strokeWidth={moderateScale(3)}
          fill="none"
        />
        <AnimatedSvgCircle
          cx={ORB_SIZE / 2}
          cy={ORB_SIZE / 2}
          r={PROGRESS_RADIUS}
          stroke="#F6C06A"
          strokeWidth={moderateScale(3)}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={`${PROGRESS_CIRC} ${PROGRESS_CIRC}`}
          animatedProps={arcProps}
        />
      </Svg>

      {/* Flash halo — pulses when each step lands. */}
      <Animated.View
        pointerEvents="none"
        style={[
          styles.orbitRing,
          {
            width: moderateScale(170),
            height: moderateScale(170),
            backgroundColor: '#F6C06A',
          },
          haloStyle,
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
              <Check size={moderateScale(44)} color="#FFFFFF" strokeWidth={3} />
            ) : (
              <Sparkles size={moderateScale(40)} color="#FFFFFF" strokeWidth={2} />
            )}
          </View>
        </View>
      </Animated.View>
    </View>
  );
}

const AnimatedTextInput = Animated.createAnimatedComponent(RNTextInput);

function XPTicker({
  xp,
  total,
  pulse,
}: {
  xp: number;
  total: number;
  pulse: SharedValue<number>;
}) {
  const styles = useStyles();

  // Animate the counter via a shared value so the rendered string
  // actually counts up rather than snapping.
  const displayed = useSharedValue(xp);
  useEffect(() => {
    displayed.value = withTiming(xp, {
      duration: 520,
      easing: Easing.out(Easing.cubic),
    });
  }, [xp, displayed]);

  const animatedProps = useAnimatedProps(
    () => ({ text: String(Math.round(displayed.value)) } as any)
  );

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value || 1 }],
  }));

  return (
    <Animated.View style={[styles.xpPill, pulseStyle]}>
      <View style={styles.xpBolt}>
        <Sparkles
          size={moderateScale(10)}
          color="#B45309"
          fill="#B45309"
        />
      </View>
      <AnimatedTextInput
        editable={false}
        defaultValue={String(xp)}
        animatedProps={animatedProps}
        style={styles.xpNumber}
        underlineColorAndroid="transparent"
      />
      <Text style={styles.xpSlash}>/{total}</Text>
      <Text style={styles.xpSuffix}>XP</Text>
    </Animated.View>
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
  const reduced = useReducedMotion();

  // Pop the whole row forward by a hair when it transitions to done,
  // and settle back — gives a tactile "checked off" feel.
  const rowScale = useSharedValue(1);
  const tintLevel = useSharedValue(0);
  useEffect(() => {
    if (!done) return;
    if (reduced) {
      tintLevel.value = 1;
      return;
    }
    rowScale.value = withSequence(
      withTiming(1.04, { duration: 160, easing: Easing.out(Easing.cubic) }),
      withSpring(1, { damping: 10, stiffness: 200 })
    );
    tintLevel.value = withTiming(1, { duration: 280 });
  }, [done, reduced, rowScale, tintLevel]);

  // The +10 XP badge bounces in when the row lands.
  const xpScale = useSharedValue(done ? 1 : 0);
  const xpOpacity = useSharedValue(done ? 1 : 0);
  useEffect(() => {
    if (!done) return;
    if (reduced) {
      xpScale.value = 1;
      xpOpacity.value = 1;
      return;
    }
    xpOpacity.value = withTiming(1, { duration: 140 });
    xpScale.value = withSequence(
      withTiming(1.3, { duration: 170, easing: Easing.out(Easing.back(2)) }),
      withSpring(1, { damping: 9, stiffness: 220 })
    );
  }, [done, reduced, xpScale, xpOpacity]);

  const rowStyle = useAnimatedStyle(() => ({
    transform: [{ scale: rowScale.value }],
    backgroundColor: `rgba(90,143,110,${tintLevel.value * 0.08})`,
    opacity: 0.5 + tintLevel.value * 0.5,
  }));
  const xpStyle = useAnimatedStyle(() => ({
    transform: [{ scale: xpScale.value }],
    opacity: xpOpacity.value,
  }));

  return (
    <Animated.View style={[styles.checkRow, rowStyle]}>
      <View
        style={[
          styles.checkIcon,
          { backgroundColor: done ? success : colors.bgMuted },
        ]}
      >
        {done ? (
          <Check size={moderateScale(16)} color="#FFFFFF" strokeWidth={3} />
        ) : (
          <Icon size={moderateScale(16)} color={colors.textSecondary} strokeWidth={2} />
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
      <Animated.View style={[styles.xpBadge, { borderColor: success + '55' }, xpStyle]}>
        <Text style={[styles.xpBadgeText, { color: success }]}>+10 XP</Text>
      </Animated.View>
    </Animated.View>
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
  xpPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(6),
    paddingHorizontal: scale(12),
    paddingVertical: verticalScale(6),
    borderRadius: theme.radius.full,
    backgroundColor: '#FFE6B0',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#F6C06A',
    marginBottom: theme.spacing.s5,
    ...theme.shadows.card,
  },
  xpBolt: {
    width: moderateScale(18),
    height: moderateScale(18),
    borderRadius: moderateScale(9),
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  xpNumber: {
    fontFamily: 'Fraunces_500Medium',
    fontSize: moderateScale(18),
    lineHeight: moderateScale(20),
    color: '#7C2D12',
    letterSpacing: -0.3,
    minWidth: moderateScale(24),
    padding: 0,
    textAlign: 'right',
  },
  xpSlash: {
    fontFamily: 'Inter_500Medium',
    fontSize: moderateScale(13),
    color: '#B45309',
    opacity: 0.75,
  },
  xpSuffix: {
    fontFamily: 'Inter_700Bold',
    fontSize: moderateScale(11),
    letterSpacing: 1,
    color: '#7C2D12',
    marginLeft: moderateScale(2),
  },
  xpBadge: {
    paddingHorizontal: scale(8),
    paddingVertical: verticalScale(3),
    borderRadius: theme.radius.full,
    borderWidth: StyleSheet.hairlineWidth,
    backgroundColor: '#FFFFFF',
  },
  xpBadgeText: {
    ...theme.typography.caption,
    fontFamily: 'Inter_700Bold',
    fontSize: moderateScale(11),
    letterSpacing: 0.4,
  },
}));
