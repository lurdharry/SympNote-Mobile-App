import React, { useEffect, useRef, useState } from 'react';
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
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { useTheme, radius, spacing, typography } from '../../theme';
import { SceneTransition } from '../../components/navigation/SceneTransition';
import { ProgressBar } from '../../components/ui/ProgressBar';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { useProfileStore } from '../../stores/useProfileStore';
import { hapticLight } from '../../services/haptics';
import { getSympnoteReply } from '../../utils/onboarding';

/**
 * Screen 3 — conversational questions.
 * Each turn is a Sympnote bubble (left) + options, which collapse into a
 * user bubble (right) and a Sympnote reply once answered. The thread
 * accumulates so the user feels the AI listening across questions.
 */

type Question = {
  key: string;
  prompt: string;
  options: string[];
};

const QUESTIONS: Question[] = [
  {
    key: 'regularity',
    prompt: 'Do you see a doctor regularly?',
    options: ['Yes, often', 'Sometimes', 'Rarely'],
  },
  {
    key: 'hardest',
    prompt: "What's the hardest part about doctor visits?",
    options: [
      'Remembering symptoms',
      'Explaining clearly',
      'Feeling rushed',
      'Taking notes',
    ],
  },
  {
    key: 'forgetting',
    prompt: 'How often do you forget something important?',
    options: ['Always', 'Often', 'Sometimes', 'Rarely'],
  },
  {
    key: 'nextAppointment',
    prompt: "When's your next appointment?",
    options: [
      'Within a week',
      'Within a month',
      'Later this year',
      'Not scheduled yet',
    ],
  },
];

type Turn = {
  qKey: string;
  prompt: string;
  answer: string | null;
  reply: string | null;
};

export default function Questions() {
  const router = useRouter();
  const { colors } = useTheme();
  const setAnswer = useProfileStore((s) => s.setOnboardingAnswer);
  const scrollRef = useRef<ScrollView>(null);

  const [turns, setTurns] = useState<Turn[]>([
    { qKey: QUESTIONS[0]!.key, prompt: QUESTIONS[0]!.prompt, answer: null, reply: null },
  ]);
  const [currentIndex, setCurrentIndex] = useState(0);

  const current = QUESTIONS[currentIndex]!;

  const handleSelect = (val: string) => {
    hapticLight();
    setAnswer(current.key, val);
    const reply = getSympnoteReply(current.key, val);

    // Fill in the current turn's answer + reply.
    setTurns((prev) =>
      prev.map((t, i) =>
        i === prev.length - 1 ? { ...t, answer: val, reply } : t
      )
    );

    // After a beat, advance to the next question or analyzing.
    setTimeout(() => {
      if (currentIndex < QUESTIONS.length - 1) {
        const nextQ = QUESTIONS[currentIndex + 1]!;
        setTurns((prev) => [
          ...prev,
          { qKey: nextQ.key, prompt: nextQ.prompt, answer: null, reply: null },
        ]);
        setCurrentIndex(currentIndex + 1);
        // Give the new bubble time to mount, then scroll.
        setTimeout(
          () => scrollRef.current?.scrollToEnd({ animated: true }),
          60
        );
      } else {
        router.push('/onboarding/analyzing');
      }
    }, 1100);
  };

  const answered = turns[turns.length - 1]?.answer != null;

  return (
    <SceneTransition mode="scale-fade">
      <SafeAreaView style={[styles.root, { backgroundColor: colors.bgPrimary }]}>
        <View style={{ paddingHorizontal: spacing.s6, paddingTop: spacing.s4 }}>
          <Header />
          <View style={{ marginTop: spacing.s3 }}>
            <ProgressBar total={QUESTIONS.length} current={currentIndex + 1} />
          </View>
        </View>

        <ScrollView
          ref={scrollRef}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() =>
            scrollRef.current?.scrollToEnd({ animated: true })
          }
        >
          {turns.map((turn, i) => (
            <TurnBlock key={`${turn.qKey}-${i}`} turn={turn} index={i} />
          ))}

          {!answered && (
            <OptionBlock
              key={`opts-${currentIndex}`}
              options={current.options}
              onSelect={handleSelect}
            />
          )}
        </ScrollView>
      </SafeAreaView>
    </SceneTransition>
  );
}

function Header() {
  const { colors } = useTheme();
  return (
    <View style={styles.header}>
      <View
        style={[
          styles.avatar,
          { backgroundColor: colors.accent },
        ]}
      >
        <Text
          style={{
            color: '#FFFFFF',
            fontFamily: 'Fraunces_500Medium',
            fontSize: 14,
            lineHeight: 16,
          }}
        >
          S
        </Text>
      </View>
      <View>
        <Text style={[typography.label, { color: colors.textSecondary }]}>
          Sympnote
        </Text>
        <Text style={[typography.caption, { color: colors.textTertiary }]}>
          Listening
        </Text>
      </View>
    </View>
  );
}

function TurnBlock({ turn, index }: { turn: Turn; index: number }) {
  const { colors } = useTheme();
  return (
    <View style={{ marginTop: index === 0 ? spacing.s6 : spacing.s8 }}>
      <Bubble side="left" delay={0} variant="sympnote">
        {turn.prompt}
      </Bubble>
      {turn.answer && (
        <>
          <View style={{ height: spacing.s3 }} />
          <Bubble
            side="right"
            delay={0}
            variant="user"
            accent={colors.accent}
          >
            {turn.answer}
          </Bubble>
        </>
      )}
      {turn.reply && (
        <>
          <View style={{ height: spacing.s2 }} />
          <Bubble side="left" delay={350} variant="sympnoteSoft">
            {turn.reply}
          </Bubble>
        </>
      )}
    </View>
  );
}

function Bubble({
  children,
  side,
  delay,
  variant,
  accent,
}: {
  children: React.ReactNode;
  side: 'left' | 'right';
  delay: number;
  variant: 'sympnote' | 'sympnoteSoft' | 'user';
  accent?: string;
}) {
  const { colors } = useTheme();
  const reduced = useReducedMotion();
  const opacity = useSharedValue(0);
  const ty = useSharedValue(6);

  useEffect(() => {
    opacity.value = withDelay(
      delay,
      withTiming(1, { duration: 280, easing: Easing.out(Easing.cubic) })
    );
    ty.value = withDelay(
      delay,
      reduced
        ? withTiming(0, { duration: 200 })
        : withSpring(0, { damping: 18, stiffness: 160 })
    );
  }, [delay, opacity, ty, reduced]);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: ty.value }],
  }));

  const bg =
    variant === 'user'
      ? accent ?? colors.accent
      : variant === 'sympnoteSoft'
      ? 'transparent'
      : colors.bgSurface;
  const fg = variant === 'user' ? '#FFFFFF' : colors.textPrimary;
  const borderColor =
    variant === 'sympnoteSoft' ? 'transparent' : colors.border;

  return (
    <Animated.View
      style={[
        {
          alignSelf: side === 'left' ? 'flex-start' : 'flex-end',
          maxWidth: '85%',
        },
        style,
      ]}
    >
      <View
        style={[
          styles.bubble,
          {
            backgroundColor: bg,
            borderColor,
            borderTopLeftRadius: side === 'left' ? 4 : radius.lg,
            borderTopRightRadius: side === 'right' ? 4 : radius.lg,
          },
        ]}
      >
        <Text
          style={[
            variant === 'sympnoteSoft'
              ? typography.body
              : typography.bodyLarge,
            {
              color:
                variant === 'sympnoteSoft' ? colors.textSecondary : fg,
              fontStyle: variant === 'sympnoteSoft' ? 'italic' : 'normal',
            },
          ]}
        >
          {children}
        </Text>
      </View>
    </Animated.View>
  );
}

function OptionBlock({
  options,
  onSelect,
}: {
  options: string[];
  onSelect: (v: string) => void;
}) {
  const { colors } = useTheme();
  return (
    <View style={{ marginTop: spacing.s6, gap: spacing.s2 }}>
      {options.map((opt, i) => (
        <OptionPill
          key={opt}
          label={opt}
          delay={160 + i * 70}
          onPress={() => onSelect(opt)}
          borderColor={colors.border}
          surface={colors.bgSurface}
          textColor={colors.textPrimary}
        />
      ))}
    </View>
  );
}

function OptionPill({
  label,
  delay,
  onPress,
  surface,
  borderColor,
  textColor,
}: {
  label: string;
  delay: number;
  onPress: () => void;
  surface: string;
  borderColor: string;
  textColor: string;
}) {
  const reduced = useReducedMotion();
  const opacity = useSharedValue(0);
  const ty = useSharedValue(10);
  const scale = useSharedValue(1);

  useEffect(() => {
    opacity.value = withDelay(
      delay,
      withTiming(1, { duration: 260, easing: Easing.out(Easing.cubic) })
    );
    ty.value = withDelay(
      delay,
      reduced ? withTiming(0, { duration: 200 }) : withSpring(0, {
        damping: 18,
        stiffness: 140,
      })
    );
  }, [delay, opacity, ty, reduced]);

  const s = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: ty.value }, { scale: scale.value }],
  }));

  return (
    <Animated.View style={[{ alignSelf: 'flex-end' }, s]}>
      <Pressable
        onPressIn={() => {
          scale.value = withSpring(0.96, { damping: 20, stiffness: 240 });
        }}
        onPressOut={() => {
          scale.value = withSpring(1, { damping: 18, stiffness: 160 });
        }}
        onPress={onPress}
        style={[
          styles.pill,
          {
            backgroundColor: surface,
            borderColor,
          },
        ]}
      >
        <Text style={[typography.bodyLarge, { color: textColor }]}>
          {label}
        </Text>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: {
    paddingHorizontal: spacing.s6,
    paddingBottom: spacing.s12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.s3,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bubble: {
    paddingHorizontal: spacing.s4,
    paddingVertical: spacing.s3,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
  },
  pill: {
    paddingHorizontal: spacing.s5,
    paddingVertical: spacing.s3,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
  },
});
