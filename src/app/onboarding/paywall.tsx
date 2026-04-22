import React, { useEffect, useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Check, Flame, Mic, Trophy } from 'lucide-react-native';
import { makeStyles, moderateScale, scale, shadows, spacing, typography, useTheme, verticalScale } from '../../theme';
import { SceneTransition } from '../../components/navigation/SceneTransition';
import { BackButton } from '../../components/ui/BackButton';
import { PrimaryButton } from '../../components/ui/PrimaryButton';
import { purchase, Plan } from '../../services/subscription';
import { useProfileStore } from '../../stores/useProfileStore';
import { useRecordingsStore } from '../../stores/useRecordingsStore';
import { hapticHeavy } from '../../services/haptics';
import { computeOnboardingProgress } from '../../utils/onboarding';
import { PAYWALL_PLANS, PLAN_FEATURES, PlanDef } from '../../constants/plans';

/**
 * Screen 07 — Paywall (gamified with streak/reward framing).
 *
 *  - "SYMPNOTE PLUS" badge
 *  - XP progress strip (90/100 XP), pulls the user into the streak metaphor
 *  - Feature list (unlimited, AI summary, private, export)
 *  - 3 plan cards, annual has floating BEST VALUE · SAVE 50% badge
 *  - "Start 3-day free trial" CTA + cancel caption
 *  - __DEV__ skip link at the bottom
 */

type IconRef = typeof Mic;
const PLANS = PAYWALL_PLANS;
const FEATURES = PLAN_FEATURES;

export default function ScreenPaywall() {
  const router = useRouter();
  const { colors } = useTheme();
  const styles = useStyles();

  const [selected, setSelected] = useState<Plan['id']>('annual');
  const [loading, setLoading] = useState(false);

  const complete = useProfileStore((s) => s.completeOnboarding);

  // Real onboarding completion — each stage the user finished is worth
  // 25 XP. This replaces the hardcoded "90 / 100 XP" that implied a
  // gamification system we don't have.
  const answers = useProfileStore((s) => s.onboardingAnswers);
  const recordingCount = useRecordingsStore((s) => s.recordings.length);
  const progress = computeOnboardingProgress({
    answers,
    recordingCount,
  });

  const buy = async () => {
    setLoading(true);
    try {
      await purchase(selected);
      hapticHeavy();
      complete();
      router.replace('/(tabs)/home');
    } catch (e) {
      Alert.alert('Purchase failed', String(e));
    } finally {
      setLoading(false);
    }
  };

  const skipDev = () => {
    if (!__DEV__) return;
    complete();
    router.replace('/(tabs)/home');
  };

  return (
    <SceneTransition mode="scale-fade">
      <View style={[styles.root, { backgroundColor: colors.bgPrimary }]}>
        <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
          <View style={styles.topBar}>
            <BackButton onPress={() => router.back()} />
            <Text style={[typography.label, { color: colors.textTertiary }]}>
              9 of 9
            </Text>
            <View style={{ width: 40 }} />
          </View>

          <ScrollView
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
          >
            <PlusBadge />

            <Text
              style={[
                typography.h1,
                {
                  color: colors.textPrimary,
                  textAlign: 'center',
                  marginTop: spacing.s5,
                },
              ]}
            >
              Keep your streak alive
            </Text>
            <Text
              style={[
                typography.body,
                {
                  color: colors.textSecondary,
                  textAlign: 'center',
                  marginTop: 8,
                },
              ]}
            >
              Unlimited recordings + AI summary before every visit
            </Text>

            <ProgressStrip
              xp={progress.xp}
              total={progress.total}
              stagesComplete={progress.stagesComplete}
              stagesTotal={progress.stagesTotal}
            />

            <View style={{ marginTop: spacing.s5, gap: 10 }}>
              {FEATURES.map((f, i) => (
                <View key={i} style={styles.featureRow}>
                  <View
                    style={[
                      styles.featureIcon,
                      { backgroundColor: colors.accent + '1A' },
                    ]}
                  >
                    <f.Icon size={16} color={colors.accent} strokeWidth={2} />
                  </View>
                  <Text
                    style={[typography.body, { color: colors.textPrimary }]}
                  >
                    {f.t}
                  </Text>
                </View>
              ))}
            </View>

            <View style={{ marginTop: spacing.s5, gap: 12 }}>
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

            {__DEV__ && (
              <Pressable
                onPress={skipDev}
                style={{ marginTop: spacing.s6, alignSelf: 'center' }}
                hitSlop={12}
              >
                <Text
                  style={[
                    typography.caption,
                    {
                      color: colors.textTertiary,
                      textDecorationLine: 'underline',
                    },
                  ]}
                >
                  Dev: skip paywall
                </Text>
              </Pressable>
            )}
          </ScrollView>

          <View style={{ paddingHorizontal: spacing.s6, paddingTop: 8, gap: 8 }}>
            <PrimaryButton
              label="Start 3-day free trial"
              onPress={buy}
              loading={loading}
            />
            <Text
              style={[
                typography.caption,
                { color: colors.textTertiary, textAlign: 'center' },
              ]}
            >
              Cancel anytime. No charge during trial.
            </Text>
          </View>
        </SafeAreaView>
      </View>
    </SceneTransition>
  );
}

function PlusBadge() {
  const styles = useStyles();
  return (
    <View style={{ alignItems: 'center' }}>
      <View style={styles.plusBadge}>
        <LinearGradient
          colors={['#F6C06A', '#E07A5F']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <Trophy size={12} color="#FFFFFF" strokeWidth={2.5} />
        <Text
          style={[
            typography.label,
            {
              color: '#FFFFFF',
              fontFamily: 'Inter_700Bold',
              marginLeft: 6,
            },
          ]}
        >
          SYMPNOTE PLUS
        </Text>
      </View>
    </View>
  );
}

function ProgressStrip({
  xp,
  total,
  stagesComplete,
  stagesTotal,
}: {
  xp: number;
  total: number;
  stagesComplete: number;
  stagesTotal: number;
}) {
  const { colors } = useTheme();
  const styles = useStyles();
  const target = total > 0 ? xp / total : 0;
  const fill = useSharedValue(0);
  useEffect(() => {
    fill.value = withDelay(
      200,
      withTiming(target, { duration: 800, easing: Easing.out(Easing.cubic) })
    );
  }, [fill, target]);
  const style = useAnimatedStyle(() => ({
    width: `${fill.value * 100}%` as `${number}%`,
  }));

  const stagesRemaining = Math.max(0, stagesTotal - stagesComplete);
  const footCopy =
    stagesRemaining === 0
      ? 'Setup complete — one last step to unlock unlimited.'
      : stagesRemaining === 1
      ? `Almost there — 1 step from 100%.`
      : `${stagesComplete} of ${stagesTotal} onboarding steps complete.`;

  return (
    <View
      style={[
        styles.progress,
        { backgroundColor: colors.bgSurface, borderColor: colors.border },
        shadows.card,
      ]}
    >
      <View style={styles.progressRow}>
        <Text
          style={[
            typography.label,
            {
              color: colors.textTertiary,
              fontFamily: 'Inter_600SemiBold',
            },
          ]}
        >
          PROGRESS
        </Text>
        <Text
          style={[
            typography.label,
            {
              color: colors.accent,
              fontFamily: 'Inter_700Bold',
              fontVariant: ['tabular-nums'],
            },
          ]}
        >
          {xp} / {total} XP
        </Text>
      </View>
      <View
        style={[styles.progressTrack, { backgroundColor: colors.bgMuted }]}
      >
        <Animated.View style={[styles.progressFill, style]}>
          <LinearGradient
            colors={['#3BA79F', '#2C6E6B']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>
      </View>
      <View style={styles.progressFoot}>
        <Flame size={12} color={colors.coral} fill={colors.coral} />
        <Text
          style={[
            typography.caption,
            { color: colors.textSecondary, marginLeft: 6 },
          ]}
        >
          {footCopy}
        </Text>
      </View>
    </View>
  );
}

function PlanCard({
  plan,
  index,
  selected,
  onSelect,
}: {
  plan: PlanDef;
  index: number;
  selected: boolean;
  onSelect: () => void;
}) {
  const { colors } = useTheme();
  const styles = useStyles();
  const opacity = useSharedValue(0);
  const ty = useSharedValue(10);
  useEffect(() => {
    opacity.value = withDelay(
      240 + index * 80,
      withTiming(1, { duration: 320, easing: Easing.out(Easing.cubic) })
    );
    ty.value = withDelay(
      240 + index * 80,
      withSpring(0, { damping: 18, stiffness: 140 })
    );
  }, [index, opacity, ty]);
  const enter = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: ty.value }],
  }));

  return (
    <Animated.View style={enter}>
      <Pressable
        onPress={onSelect}
        style={[
          styles.plan,
          {
            backgroundColor: colors.bgSurface,
            borderColor: selected ? colors.accent : colors.border,
            borderWidth: 2,
          },
          shadows.card,
        ]}
      >
        {plan.badge && (
          <View style={styles.planBadge}>
            <LinearGradient
              colors={['#E07A5F', '#F6C06A']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={StyleSheet.absoluteFill}
            />
            <Text
              style={[
                typography.caption,
                {
                  color: '#FFFFFF',
                  fontFamily: 'Inter_700Bold',
                },
              ]}
            >
              {plan.badge}
            </Text>
          </View>
        )}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <View>
            <Text style={[typography.h3, { color: colors.textPrimary }]}>
              {plan.label}
            </Text>
            {plan.note && (
              <Text
                style={[
                  typography.caption,
                  { color: colors.textTertiary, marginTop: 2 },
                ]}
              >
                {plan.note}
              </Text>
            )}
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={[typography.h3, { color: colors.textPrimary }]}>
                {plan.price}
              </Text>
              <Text
                style={[
                  typography.caption,
                  { color: colors.textTertiary },
                ]}
              >
                {plan.per}
              </Text>
            </View>
            <View
              style={[
                styles.radio,
                selected
                  ? { backgroundColor: colors.accent, borderColor: colors.accent }
                  : { borderColor: colors.border },
              ]}
            >
              {selected && <Check size={12} color="#FFFFFF" strokeWidth={3} />}
            </View>
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
}

const useStyles = makeStyles((theme) => ({
  root: { flex: 1 },
  safe: { flex: 1 },
  topBar: {
    paddingTop: theme.spacing.s3,
    paddingHorizontal: theme.spacing.s6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  content: {
    paddingHorizontal: theme.spacing.s6,
    paddingTop: theme.spacing.s4,
    paddingBottom: theme.spacing.s6,
  },
  plusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: scale(10),
    paddingVertical: verticalScale(4),
    borderRadius: theme.radius.full,
    overflow: 'hidden',
  },
  progress: {
    marginTop: theme.spacing.s5,
    padding: moderateScale(16),
    borderRadius: theme.radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
  },
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: verticalScale(8),
  },
  progressTrack: {
    height: verticalScale(8),
    borderRadius: moderateScale(4),
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: moderateScale(4),
    overflow: 'hidden',
  },
  progressFoot: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: verticalScale(8),
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(12),
  },
  featureIcon: {
    width: moderateScale(28),
    height: moderateScale(28),
    borderRadius: moderateScale(8),
    alignItems: 'center',
    justifyContent: 'center',
  },
  plan: {
    padding: moderateScale(16),
    borderRadius: theme.radius.lg,
    position: 'relative',
  },
  planBadge: {
    position: 'absolute',
    top: -verticalScale(10),
    left: scale(16),
    paddingHorizontal: scale(10),
    paddingVertical: verticalScale(4),
    borderRadius: theme.radius.full,
    overflow: 'hidden',
  },
  radio: {
    width: moderateScale(24),
    height: moderateScale(24),
    borderRadius: moderateScale(12),
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
}));
