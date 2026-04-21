import React, { useEffect, useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme, radius, spacing, typography, shadows } from '../../theme';
import { SceneTransition } from '../../components/navigation/SceneTransition';
import { ShimmerText } from '../../components/animated/ShimmerText';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { PLANS, purchase, Plan } from '../../services/subscription';
import { useProfileStore } from '../../stores/useProfileStore';
import { useAppointmentsStore } from '../../stores/useAppointmentsStore';
import { useTransition } from '../../components/navigation/TransitionContext';
import { hapticHeavy } from '../../services/haptics';
import { getPaywallCopy } from '../../utils/onboarding';
import { ClinicalSummaryTeaser } from '../../components/clinical/ClinicalSummaryTeaser';

export default function Paywall() {
  const router = useRouter();
  const { colors } = useTheme();
  const reduced = useReducedMotion();
  const { width, height } = useWindowDimensions();
  const [selected, setSelected] = useState<Plan['id']>('annual');
  const [loading, setLoading] = useState(false);
  const { triggerRadialWipe } = useTransition();
  const complete = useProfileStore((s) => s.completeOnboarding);
  const answers = useProfileStore((s) => s.onboardingAnswers);

  const paywallCopy = getPaywallCopy(answers);

  // Poll for the background-generated summary from first-recording.save().
  // Subscribing to the store means this updates automatically when the
  // summary arrives — no prop drilling, no extra fetch.
  const appointments = useAppointmentsStore((s) => s.appointments);
  const previewSummary = React.useMemo(() => {
    const withSummary = appointments.find((a) => !!a.summary);
    return withSummary?.summary ?? null;
  }, [appointments]);

  const bgShift = useSharedValue(0);
  useEffect(() => {
    if (reduced) return;
    bgShift.value = withRepeat(
      withTiming(1, { duration: 10000, easing: Easing.inOut(Easing.quad) }),
      -1,
      true
    );
  }, [bgShift, reduced]);
  const bgStyle = useAnimatedStyle(() => ({
    opacity: 0.35 + bgShift.value * 0.2,
  }));

  const handleBuy = async (x: number, y: number) => {
    setLoading(true);
    try {
      await purchase(selected);
      hapticHeavy();
      complete();
      await triggerRadialWipe({ x, y });
      router.replace('/(tabs)/home');
    } catch (e) {
      Alert.alert('Purchase failed', String(e));
    } finally {
      setLoading(false);
    }
  };

  const skip = () => {
    if (__DEV__) {
      complete();
      router.replace('/(tabs)/home');
    }
  };

  return (
    <SceneTransition mode="scale-fade">
      <SafeAreaView style={[styles.root, { backgroundColor: colors.bgPrimary }]}>
        <Animated.View style={[StyleSheet.absoluteFill, bgStyle]}>
          <LinearGradient
            colors={[colors.bgMuted, colors.bgPrimary, colors.accentLight]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>

        <ScrollView contentContainerStyle={styles.content}>
          <View>
            <IntroText title={paywallCopy.title} sub={paywallCopy.sub} />
          </View>

          <SummaryPreview text={previewSummary} />

          <View style={{ gap: spacing.s3, marginTop: spacing.s8 }}>
            {PLANS.map((p, i) => (
              <PlanCard
                key={p.id}
                plan={p}
                index={i}
                selected={selected === p.id}
                onSelect={() => setSelected(p.id)}
              />
            ))}
          </View>

          <View style={{ marginTop: spacing.s8 }}>
            <Pressable
              onPress={(e) =>
                handleBuy(e.nativeEvent.pageX, e.nativeEvent.pageY)
              }
              style={({ pressed }) => [
                {
                  backgroundColor: colors.accent,
                  borderRadius: radius.full,
                  height: 56,
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden',
                  opacity: pressed || loading ? 0.85 : 1,
                },
              ]}
            >
              <ShimmerText
                text={loading ? 'Starting trial…' : 'Start 3-day free trial'}
                textStyle={{
                  ...typography.label,
                  color: '#FFFFFF',
                  letterSpacing: 0.3,
                }}
              />
            </Pressable>
            <Text
              style={[
                typography.caption,
                {
                  color: colors.textTertiary,
                  textAlign: 'center',
                  marginTop: spacing.s3,
                },
              ]}
            >
              Cancel anytime. No charge during trial.
            </Text>

            {__DEV__ && (
              <Pressable onPress={skip} style={{ marginTop: spacing.s6 }}>
                <Text
                  style={[
                    typography.caption,
                    {
                      color: colors.textTertiary,
                      textAlign: 'center',
                      textDecorationLine: 'underline',
                    },
                  ]}
                >
                  Dev: skip paywall
                </Text>
              </Pressable>
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    </SceneTransition>
  );
}

function IntroText({ title, sub }: { title: string; sub: string }) {
  const { colors } = useTheme();
  const op = useSharedValue(0);
  const ty = useSharedValue(-10);
  const subOp = useSharedValue(0);
  useEffect(() => {
    op.value = withTiming(1, { duration: 400, easing: Easing.out(Easing.cubic) });
    ty.value = withSpring(0, { damping: 18, stiffness: 110 });
    subOp.value = withDelay(
      150,
      withTiming(1, { duration: 400, easing: Easing.out(Easing.cubic) })
    );
  }, [op, ty, subOp]);
  const h = useAnimatedStyle(() => ({
    opacity: op.value,
    transform: [{ translateY: ty.value }],
  }));
  const s = useAnimatedStyle(() => ({ opacity: subOp.value }));
  return (
    <>
      <Animated.Text
        style={[typography.displaySerif, { color: colors.textPrimary }, h]}
      >
        {title}
      </Animated.Text>
      <Animated.Text
        style={[
          typography.bodyLarge,
          {
            color: colors.textSecondary,
            marginTop: spacing.s3,
          },
          s,
        ]}
      >
        {sub}
      </Animated.Text>
    </>
  );
}

/**
 * Editorial summary block. Shows the user's own words, structured by
 * Gemini, fully visible. One free look is a stronger conversion lever
 * than an unlock tease — the user sees concrete value, then we tell
 * them the next one's behind the trial.
 */
function SummaryPreview({ text }: { text: string | null }) {
  const { colors } = useTheme();
  const opacity = useSharedValue(0);
  const ty = useSharedValue(8);

  useEffect(() => {
    opacity.value = withDelay(
      300,
      withTiming(1, { duration: 400, easing: Easing.out(Easing.cubic) })
    );
    ty.value = withDelay(
      300,
      withSpring(0, { damping: 18, stiffness: 120 })
    );
  }, [opacity, ty]);

  const anim = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: ty.value }],
  }));

  const rule = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Animated.View style={[{ marginTop: spacing.s8 }, anim]}>
      <View style={styles.summaryHeader}>
        <Animated.View
          style={[
            styles.summaryRule,
            { backgroundColor: colors.accent },
            rule,
          ]}
        />
        <Text
          style={[
            typography.label,
            { color: colors.accent, letterSpacing: 0.3 },
          ]}
        >
          Your first summary
        </Text>
      </View>
      <Text
        style={[
          typography.serifHeadline,
          {
            color: colors.textPrimary,
            marginTop: spacing.s3,
            fontSize: 24,
            lineHeight: 30,
          },
        ]}
      >
        From your own words.
      </Text>
      <ClinicalSummaryTeaser text={text} />
    </Animated.View>
  );
}

type PlanCardProps = {
  plan: Plan;
  index: number;
  selected: boolean;
  onSelect: () => void;
};

function PlanCard({ plan, index, selected, onSelect }: PlanCardProps) {
  const { colors } = useTheme();
  const reduced = useReducedMotion();
  const op = useSharedValue(0);
  const ty = useSharedValue(20);
  const lift = useSharedValue(0);
  const badgePulse = useSharedValue(1);

  useEffect(() => {
    op.value = withDelay(
      200 * index,
      withTiming(1, { duration: 320, easing: Easing.out(Easing.cubic) })
    );
    ty.value = withDelay(
      200 * index,
      reduced
        ? withTiming(0, { duration: 200 })
        : withSpring(0, { damping: 18, stiffness: 110 })
    );
  }, [index, op, ty, reduced]);

  useEffect(() => {
    lift.value = withSpring(selected ? 1 : 0, { damping: 18, stiffness: 120 });
  }, [selected, lift]);

  useEffect(() => {
    if (!plan.badge || reduced) return;
    badgePulse.value = withRepeat(
      withSequence(
        withTiming(1.03, { duration: 1000, easing: Easing.inOut(Easing.sin) }),
        withTiming(1, { duration: 1000, easing: Easing.inOut(Easing.sin) })
      ),
      -1,
      false
    );
  }, [plan.badge, reduced, badgePulse]);

  const enter = useAnimatedStyle(() => ({
    opacity: op.value,
    transform: [{ translateY: ty.value }],
  }));

  const liftStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: -lift.value * 8 },
      { scale: 1 + lift.value * 0.02 },
    ],
    opacity: selected ? 1 : 0.6,
  }));

  const badgeStyle = useAnimatedStyle(() => ({
    transform: [{ scale: badgePulse.value }],
  }));

  return (
    <Animated.View style={enter}>
      <Pressable onPress={onSelect}>
        <Animated.View
          style={[
            styles.plan,
            shadows.card,
            {
              backgroundColor: colors.bgSurface,
              borderColor: selected ? colors.accent : colors.border,
              borderRadius: radius.xl,
              borderWidth: selected ? 2 : StyleSheet.hairlineWidth,
            },
            liftStyle,
          ]}
        >
          <View style={{ flex: 1 }}>
            <Text
              style={[
                typography.h3,
                { color: colors.textPrimary, textTransform: 'capitalize' },
              ]}
            >
              {plan.id}
            </Text>
            <Text
              style={[
                typography.bodySmall,
                { color: colors.textSecondary, marginTop: 2 },
              ]}
            >
              {plan.price} / {plan.period}
              {plan.savingsTag ? ` · ${plan.savingsTag}` : ''}
            </Text>
          </View>
          {plan.badge && (
            <Animated.View
              style={[
                styles.badge,
                {
                  backgroundColor: colors.accent,
                  borderRadius: 999,
                },
                badgeStyle,
              ]}
            >
              <Text
                style={[
                  typography.label,
                  { color: '#FFFFFF', letterSpacing: 0.3 },
                ]}
              >
                {plan.badge}
              </Text>
            </Animated.View>
          )}
        </Animated.View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: {
    paddingHorizontal: spacing.s6,
    paddingTop: spacing.s10,
    paddingBottom: spacing.s12,
  },
  plan: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.s5,
  },
  badge: {
    paddingHorizontal: spacing.s3,
    paddingVertical: 6,
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.s3,
  },
  summaryRule: {
    width: 24,
    height: 2,
    borderRadius: 1,
  },
});
