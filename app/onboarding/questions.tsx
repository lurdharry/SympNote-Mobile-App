import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
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
import {
  Bell,
  BookOpen,
  Brain,
  Calendar,
  Check,
  Hourglass,
  MessageCircle,
  NotebookPen,
  Pin,
  Sparkles,
  Sprout,
  Target,
  Timer,
} from 'lucide-react-native';
import { makeStyles, shadows, spacing, typography, useTheme } from '../../theme';
import { SceneTransition } from '../../components/navigation/SceneTransition';
import { BackButton } from '../../components/ui/BackButton';
import { TypingDots } from '../../components/ui/TypingDots';
import { useProfileStore } from '../../stores/useProfileStore';
import { hapticLight } from '../../services/haptics';

/**
 * Screen 02 — Qualifier.
 *
 * Chat format. The assistant asks, the user answers via chips (or a
 * date card for Q4). Each answer unlocks a row in the "Your Sympnote
 * plan" card pinned below the top bar — which is the primary "work"
 * this screen communicates visually.
 *
 * Plan unlocks are keyed `questionId:value` per design handoff.
 */

type Option = { t: string; v: string };
type Question = {
  id: string;
  ask: string;
  options?: Option[];
  kind?: 'date';
};

const QUESTIONS: Question[] = [
  {
    id: 'doctor',
    ask: 'First — do you see a doctor regularly?',
    options: [
      { t: 'Yes, often', v: 'often' },
      { t: 'Sometimes', v: 'sometimes' },
      { t: 'Rarely', v: 'rarely' },
    ],
  },
  {
    id: 'pain',
    ask: "What's hardest about doctor visits for you?",
    options: [
      { t: 'Remembering symptoms', v: 'memory' },
      { t: 'Explaining clearly', v: 'clarity' },
      { t: 'Feeling rushed', v: 'time' },
      { t: 'Taking notes', v: 'notes' },
    ],
  },
  {
    id: 'forget',
    ask: 'And honestly — how often do you forget something important?',
    options: [
      { t: 'Almost always', v: 'always' },
      { t: 'Often', v: 'often' },
      { t: 'Sometimes', v: 'sometimes' },
      { t: 'Rarely', v: 'rarely' },
    ],
  },
  {
    id: 'next',
    ask: "When's your next appointment? We'll count down and prep you.",
    kind: 'date',
  },
];

type IconRef = typeof Calendar;
type PlanItem = { Icon: IconRef; title: string; sub: string };

const PLAN_UNLOCKS: Record<string, PlanItem> = {
  'doctor:often':     { Icon: Calendar,      title: 'Cross-visit timeline',  sub: 'We connect patterns between visits' },
  'doctor:sometimes': { Icon: Calendar,      title: 'Visit-ready summaries', sub: 'Ready whenever you book next' },
  'doctor:rarely':    { Icon: Sprout,        title: 'Grow-at-your-pace',     sub: 'Log when it matters, no pressure' },
  'pain:memory':      { Icon: Brain,         title: 'Daily memory nudges',   sub: 'Gentle reminders to log small things' },
  'pain:clarity':     { Icon: MessageCircle, title: 'Clear summaries',       sub: 'Your words, organized for your doctor' },
  'pain:time':        { Icon: Timer,         title: 'One-page visit brief',  sub: 'Nothing important gets rushed past' },
  'pain:notes':       { Icon: NotebookPen,   title: 'Automatic note-taking', sub: 'We capture, you focus on the doctor' },
  'forget:always':    { Icon: Target,        title: 'Gentle recall prompts', sub: "We'll jog memory before each visit" },
  'forget:often':     { Icon: Bell,          title: 'Pre-visit checklist',   sub: 'Key things to mention, ready to go' },
  'forget:sometimes': { Icon: Sparkles,      title: 'Smart highlights',      sub: 'We surface what matters most' },
  'forget:rarely':    { Icon: BookOpen,      title: 'Deep visit archive',    sub: 'Searchable history of every visit' },
  'next:scheduled':   { Icon: Hourglass,     title: 'Appointment countdown', sub: 'Prep builds as your visit approaches' },
  'next:none':        { Icon: Pin,           title: 'Ready when you book',   sub: "We'll prep the moment you schedule" },
};

export default function ScreenQualifier() {
  const router = useRouter();
  const { colors } = useTheme();
  const styles = useStyles();
  const setAnswer = useProfileStore((s) => s.setOnboardingAnswer);

  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, Option>>({});
  const [typing, setTyping] = useState(true);
  const scrollRef = useRef<ScrollView>(null);

  const cur = QUESTIONS[step]!;
  const total = QUESTIONS.length;

  // Typing indicator before each question
  useEffect(() => {
    setTyping(true);
    const id = setTimeout(() => setTyping(false), 650);
    return () => clearTimeout(id);
  }, [step]);

  // Auto-scroll on new turns
  useEffect(() => {
    scrollRef.current?.scrollToEnd({ animated: true });
  }, [step, typing, answers]);

  const onAnswer = (opt: Option) => {
    hapticLight();
    setAnswers((prev) => ({ ...prev, [cur.id]: opt }));
    // Persist the label so analyzing + paywall copy can read it.
    const answerKey = mapToProfileKey(cur.id);
    if (answerKey) setAnswer(answerKey, opt.t);
    setTimeout(() => {
      if (step < total - 1) setStep(step + 1);
      else setTimeout(() => router.push('/onboarding/focus'), 600);
    }, 450);
  };

  const planItems = useMemo<PlanItem[]>(() => {
    const items: PlanItem[] = [];
    (Object.keys(answers) as Array<keyof typeof answers>).forEach((qid) => {
      const a = answers[qid];
      if (!a) return;
      const u = PLAN_UNLOCKS[`${qid}:${a.v}`];
      if (u) items.push(u);
    });
    return items;
  }, [answers]);

  const onBack = () => {
    if (step === 0) router.back();
    else setStep(step - 1);
  };

  return (
    <SceneTransition mode="scale-fade">
      <View style={[styles.root, { backgroundColor: colors.bgPrimary }]}>
        <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
          {/* Top bar */}
          <View style={styles.topBar}>
            <BackButton onPress={onBack} />
            <ProgressBar step={step} total={total} />
            <Text
              style={[
                typography.label,
                { color: colors.textTertiary, fontVariant: ['tabular-nums'] },
              ]}
            >
              {Math.min(step + 1, total)}/{total}
            </Text>
          </View>

          <View style={{ paddingHorizontal: spacing.s5, marginTop: spacing.s3 }}>
            <PlanCard items={planItems} total={total} />
          </View>

          {/* Conversation feed */}
          <ScrollView
            ref={scrollRef}
            style={{ flex: 1 }}
            contentContainerStyle={{
              paddingHorizontal: spacing.s5,
              paddingTop: spacing.s4,
              paddingBottom: spacing.s4,
              gap: spacing.s3,
            }}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Past turns */}
            {QUESTIONS.slice(0, step).map((q) => (
              <React.Fragment key={q.id + '-turn'}>
                <AssistantBubble>{q.ask}</AssistantBubble>
                {answers[q.id] && <UserBubble>{answers[q.id]!.t}</UserBubble>}
              </React.Fragment>
            ))}

            {/* Current question */}
            {typing ? (
              <TypingBubble />
            ) : (
              <AssistantBubble>{cur.ask}</AssistantBubble>
            )}

            <View style={{ height: 8 }} />
          </ScrollView>

          {/* Answer tray */}
          <View
            style={[
              styles.tray,
              {
                borderTopColor: colors.border,
                backgroundColor: colors.bgPrimary,
              },
            ]}
          >
            {cur.kind === 'date' ? (
              <DateTray disabled={typing} onAnswer={onAnswer} />
            ) : (
              <ChipTray
                disabled={typing}
                options={cur.options ?? []}
                onAnswer={onAnswer}
              />
            )}
          </View>
        </SafeAreaView>
      </View>
    </SceneTransition>
  );
}

/** Map handoff question ids to the profile-store keys other screens expect. */
function mapToProfileKey(qid: string): string | null {
  switch (qid) {
    case 'doctor':
      return 'regularity';
    case 'pain':
      return 'hardest';
    case 'forget':
      return 'forgetting';
    case 'next':
      return 'nextAppointment';
    default:
      return null;
  }
}

/* ------------------------------ Subcomponents ------------------------------ */

function ProgressBar({ step, total }: { step: number; total: number }) {
  const { colors } = useTheme();
  const styles = useStyles();
  return (
    <View style={styles.progressRow}>
      {Array.from({ length: total }).map((_, i) => (
        <View
          key={i}
          style={[
            styles.progressSeg,
            { backgroundColor: colors.bgMuted },
          ]}
        >
          <View style={StyleSheet.absoluteFill}>
            <LinearGradient
              colors={['#3BA79F', '#2C6E6B']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{
                width: i < step ? '100%' : i === step ? '50%' : '0%',
                height: '100%',
              }}
            />
          </View>
        </View>
      ))}
    </View>
  );
}

function PlanCard({ items, total }: { items: PlanItem[]; total: number }) {
  const { colors } = useTheme();
  const styles = useStyles();
  return (
    <View
      style={[
        styles.planCard,
        {
          backgroundColor: colors.bgSurface,
          borderColor: colors.border,
        },
        shadows.card,
      ]}
    >
      <LinearGradient
        colors={[colors.bgSurface, '#FDFBF6']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.planHeader}>
        <View
          style={[
            styles.planHeaderTile,
            { backgroundColor: colors.accentDark },
          ]}
        >
          <LinearGradient
            colors={['#2C6E6B', '#1F504E']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          <Sparkles size={10} color={colors.gold} fill={colors.gold} />
        </View>
        <Text
          style={[
            typography.caption,
            {
              color: colors.accent,
              fontFamily: 'Inter_700Bold',
              letterSpacing: 1.2,
            },
          ]}
        >
          YOUR SYMPNOTE PLAN
        </Text>
        <Text
          style={[
            typography.caption,
            {
              color: colors.textTertiary,
              marginLeft: 'auto',
              fontVariant: ['tabular-nums'],
            },
          ]}
        >
          {items.length}/{total}
        </Text>
      </View>
      <View style={styles.planBody}>
        {items.length === 0 ? (
          <Text
            style={[
              typography.caption,
              {
                color: colors.textTertiary,
                fontStyle: 'italic',
              },
            ]}
          >
            Tell me a bit about you — I'll build this as we go.
          </Text>
        ) : (
          items.map((p, i) => <PlanRow key={i} item={p} index={i} />)
        )}
      </View>
    </View>
  );
}

function PlanRow({ item, index }: { item: PlanItem; index: number }) {
  const { colors } = useTheme();
  const styles = useStyles();
  const opacity = useSharedValue(0);
  const ty = useSharedValue(6);
  useEffect(() => {
    opacity.value = withDelay(
      index * 60,
      withTiming(1, { duration: 320, easing: Easing.out(Easing.cubic) })
    );
    ty.value = withDelay(
      index * 60,
      withSpring(0, { damping: 18, stiffness: 140 })
    );
  }, [index, opacity, ty]);
  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: ty.value }],
  }));
  return (
    <Animated.View style={[styles.planRow, style]}>
      <View
        style={{
          width: 20,
          height: 20,
          marginTop: 1,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <item.Icon size={14} color={colors.accent} strokeWidth={2} />
      </View>
      <View style={{ flex: 1 }}>
        <Text
          style={[
            typography.label,
            { color: colors.textPrimary, fontFamily: 'Inter_600SemiBold' },
          ]}
        >
          {item.title}
        </Text>
        <Text
          style={[
            typography.caption,
            { color: colors.textTertiary, marginTop: 1 },
          ]}
        >
          {item.sub}
        </Text>
      </View>
      <Check size={12} color={colors.success} strokeWidth={3} />
    </Animated.View>
  );
}

function AssistantAvatar() {
  const { colors } = useTheme();
  const styles = useStyles();
  return (
    <View style={styles.avatar}>
      <LinearGradient
        colors={['#3BA79F', '#1F504E']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <Sparkles size={12} color={colors.gold} fill={colors.gold} />
    </View>
  );
}

function AssistantBubble({ children }: { children: React.ReactNode }) {
  const { colors } = useTheme();
  const styles = useStyles();
  const opacity = useSharedValue(0);
  const ty = useSharedValue(6);
  useEffect(() => {
    opacity.value = withTiming(1, {
      duration: 320,
      easing: Easing.out(Easing.cubic),
    });
    ty.value = withSpring(0, { damping: 18, stiffness: 160 });
  }, [opacity, ty]);
  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: ty.value }],
  }));
  return (
    <Animated.View style={[styles.bubbleRow, style]}>
      <AssistantAvatar />
      <View
        style={[
          styles.bubble,
          styles.assistantBubble,
          {
            backgroundColor: colors.bgSurface,
            borderColor: colors.border,
          },
          shadows.card,
        ]}
      >
        <Text
          style={[
            typography.body,
            { color: colors.textPrimary, lineHeight: 20 },
          ]}
        >
          {children}
        </Text>
      </View>
    </Animated.View>
  );
}

function UserBubble({ children }: { children: React.ReactNode }) {
  const styles = useStyles();
  const opacity = useSharedValue(0);
  const ty = useSharedValue(6);
  useEffect(() => {
    opacity.value = withTiming(1, {
      duration: 280,
      easing: Easing.out(Easing.cubic),
    });
    ty.value = withSpring(0, { damping: 18, stiffness: 160 });
  }, [opacity, ty]);
  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: ty.value }],
  }));
  return (
    <Animated.View style={[styles.userRow, style]}>
      <View style={[styles.bubble, styles.userBubble]}>
        <LinearGradient
          colors={['#2C6E6B', '#1F504E']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <Text
          style={[
            typography.body,
            {
              color: '#FFFFFF',
              fontFamily: 'Inter_500Medium',
              lineHeight: 20,
            },
          ]}
        >
          {children}
        </Text>
      </View>
    </Animated.View>
  );
}

function TypingBubble() {
  const { colors } = useTheme();
  const styles = useStyles();
  return (
    <View style={styles.bubbleRow}>
      <AssistantAvatar />
      <View
        style={[
          styles.bubble,
          styles.assistantBubble,
          {
            backgroundColor: colors.bgSurface,
            borderColor: colors.border,
            paddingVertical: 12,
          },
          shadows.card,
        ]}
      >
        <TypingDots />
      </View>
    </View>
  );
}

function ChipTray({
  options,
  onAnswer,
  disabled,
}: {
  options: Option[];
  onAnswer: (o: Option) => void;
  disabled: boolean;
}) {
  const { colors } = useTheme();
  const styles = useStyles();
  return (
    <View style={styles.chipWrap}>
      {options.map((opt) => (
        <Pressable
          key={opt.v}
          onPress={() => onAnswer(opt)}
          disabled={disabled}
          style={({ pressed }) => [
            styles.chip,
            {
              backgroundColor: colors.bgSurface,
              borderColor: pressed ? colors.accent : colors.border,
              opacity: disabled ? 0.4 : 1,
            },
          ]}
          accessibilityRole="button"
          accessibilityLabel={opt.t}
        >
          <Text
            style={[
              typography.label,
              {
                color: colors.textPrimary,
                fontFamily: 'Inter_600SemiBold',
              },
            ]}
          >
            {opt.t}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

function DateTray({
  onAnswer,
  disabled,
}: {
  onAnswer: (o: Option) => void;
  disabled: boolean;
}) {
  const { colors } = useTheme();
  const styles = useStyles();

  const scheduled = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d;
  }, []);
  const dateLabel = scheduled.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
  const dayCount = 7;

  return (
    <View style={{ gap: spacing.s2 }}>
      <View
        style={[
          styles.dateCard,
          {
            backgroundColor: colors.bgSurface,
            borderColor: colors.border,
          },
          shadows.card,
        ]}
      >
        <View
          style={[
            styles.dateIconTile,
            { backgroundColor: colors.accent + '1A' },
          ]}
        >
          <Calendar size={18} color={colors.accent} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[typography.label, { color: colors.textTertiary }]}>
            Appointment date
          </Text>
          <Text
            style={[
              typography.h3,
              { color: colors.textPrimary, marginTop: 2 },
            ]}
          >
            {dateLabel}
          </Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text
            style={[typography.caption, { color: colors.textTertiary }]}
          >
            in
          </Text>
          <Text
            style={[
              typography.h3,
              { color: colors.accent, marginTop: 2 },
            ]}
          >
            {dayCount} days
          </Text>
        </View>
      </View>
      <View style={{ flexDirection: 'row', gap: spacing.s2 }}>
        <Pressable
          onPress={() =>
            onAnswer({ t: 'Not scheduled yet', v: 'none' })
          }
          disabled={disabled}
          style={({ pressed }) => [
            styles.dateBtnSecondary,
            {
              backgroundColor: colors.bgMuted,
              opacity: pressed || disabled ? 0.6 : 1,
            },
          ]}
          accessibilityRole="button"
          accessibilityLabel="Not scheduled yet"
        >
          <Text
            style={[
              typography.label,
              { color: colors.textPrimary, fontFamily: 'Inter_600SemiBold' },
            ]}
          >
            Not scheduled
          </Text>
        </Pressable>
        <Pressable
          onPress={() => onAnswer({ t: dateLabel, v: 'scheduled' })}
          disabled={disabled}
          style={({ pressed }) => [
            styles.dateBtnPrimary,
            { opacity: pressed || disabled ? 0.85 : 1 },
          ]}
          accessibilityRole="button"
          accessibilityLabel={`Use ${dateLabel}`}
        >
          <LinearGradient
            colors={['#3BA79F', '#2C6E6B']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          <Text
            style={[
              typography.body,
              { color: '#FFFFFF', fontFamily: 'Inter_600SemiBold' },
            ]}
          >
            Use this date →
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const useStyles = makeStyles((theme) => ({
  root: { flex: 1 },
  safe: { flex: 1 },
  topBar: {
    paddingTop: theme.spacing.s3,
    paddingHorizontal: theme.spacing.s5,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.s3,
  },
  progressRow: {
    flex: 1,
    flexDirection: 'row',
    gap: 4,
  },
  progressSeg: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  planCard: {
    borderRadius: theme.radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  planHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 6,
  },
  planHeaderTile: {
    width: 20,
    height: 20,
    borderRadius: 6,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  planBody: {
    paddingHorizontal: 14,
    paddingBottom: 12,
    minHeight: 60,
    gap: 6,
  },
  planRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  bubbleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  userRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bubble: {
    maxWidth: '82%',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: theme.radius.lg,
    overflow: 'hidden',
  },
  assistantBubble: {
    borderTopLeftRadius: 6,
    borderWidth: StyleSheet.hairlineWidth,
  },
  userBubble: {
    borderTopRightRadius: 6,
    maxWidth: '75%',
  },
  tray: {
    paddingHorizontal: theme.spacing.s5,
    paddingTop: 10,
    paddingBottom: theme.spacing.s4,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  chipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 9999,
    borderWidth: StyleSheet.hairlineWidth,
  },
  dateCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: theme.radius.md,
    borderWidth: StyleSheet.hairlineWidth,
  },
  dateIconTile: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateBtnSecondary: {
    flex: 1,
    height: 44,
    borderRadius: 9999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateBtnPrimary: {
    flex: 2,
    height: 44,
    borderRadius: 9999,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
}));
