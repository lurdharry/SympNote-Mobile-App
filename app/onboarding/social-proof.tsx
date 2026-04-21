import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
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
import { useTheme, spacing, typography } from '../../theme';
import { SceneTransition } from '../../components/navigation/SceneTransition';
import { Button } from '../../components/ui/Button';
import { useReducedMotion } from '../../hooks/useReducedMotion';

/**
 * Screen 2 — editorial reframe.
 * Ditches the star rating + testimonial card trope for a minimalist
 * "Hi, I'm Sympnote" intro with three numbered capability rows. The
 * layout is typography-forward: serif display headline, light-weight
 * oversized numerals, hairline dividers, single accent color.
 */

const CAPABILITIES: { title: string; body: string }[] = [
  {
    title: 'I listen.',
    body:
      "Tell me what's on your mind. I capture every concern so you can stop juggling things in your head.",
  },
  {
    title: 'I organize.',
    body:
      'Every symptom gets tagged, timed, and arranged into clean notes that read like a clinician wrote them.',
  },
  {
    title: 'I remember.',
    body:
      "When your visit comes, your doctor-ready summary is already written. You just show it.",
  },
];

export default function SocialProof() {
  const router = useRouter();
  const { colors } = useTheme();

  return (
    <SceneTransition mode="scale-fade">
      <SafeAreaView style={[styles.root, { backgroundColor: colors.bgPrimary }]}>
        <View style={styles.content}>
          <View>
            <IntroBlock />
            <View style={{ height: spacing.s10 }} />
            {CAPABILITIES.map((cap, i) => (
              <CapabilityRow
                key={cap.title}
                index={i}
                title={cap.title}
                body={cap.body}
              />
            ))}
          </View>

          <Button
            label="Continue"
            breathe
            onPress={() => router.push('/onboarding/questions')}
          />
        </View>
      </SafeAreaView>
    </SceneTransition>
  );
}

function IntroBlock() {
  const { colors } = useTheme();
  const reduced = useReducedMotion();
  const headOp = useSharedValue(0);
  const headY = useSharedValue(12);
  const subOp = useSharedValue(0);

  useEffect(() => {
    headOp.value = withTiming(1, {
      duration: 420,
      easing: Easing.out(Easing.cubic),
    });
    headY.value = reduced
      ? 0
      : withSpring(0, { damping: 18, stiffness: 110 });
    subOp.value = withDelay(
      220,
      withTiming(1, { duration: 320, easing: Easing.out(Easing.cubic) })
    );
  }, [headOp, headY, subOp, reduced]);

  const head = useAnimatedStyle(() => ({
    opacity: headOp.value,
    transform: [{ translateY: headY.value }],
  }));
  const sub = useAnimatedStyle(() => ({ opacity: subOp.value }));

  return (
    <View>
      <Animated.Text
        style={[
          typography.displaySerif,
          { color: colors.textPrimary },
          head,
        ]}
      >
        Hi, I'm{' '}
        <Text style={{ color: colors.accent }}>Sympnote</Text>.
      </Animated.Text>
      <Animated.Text
        style={[
          typography.bodyLarge,
          { color: colors.textSecondary, marginTop: spacing.s4 },
          sub,
        ]}
      >
        Here's how I'll work for you.
      </Animated.Text>
    </View>
  );
}

function CapabilityRow({
  index,
  title,
  body,
}: {
  index: number;
  title: string;
  body: string;
}) {
  const { colors } = useTheme();
  const reduced = useReducedMotion();
  const opacity = useSharedValue(0);
  const ty = useSharedValue(14);

  useEffect(() => {
    const delay = 600 + index * 140;
    opacity.value = withDelay(
      delay,
      withTiming(1, { duration: 380, easing: Easing.out(Easing.cubic) })
    );
    ty.value = withDelay(
      delay,
      reduced ? withTiming(0, { duration: 200 }) : withSpring(0, {
        damping: 18,
        stiffness: 120,
      })
    );
  }, [index, opacity, ty, reduced]);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: ty.value }],
  }));

  return (
    <Animated.View style={style}>
      <View
        style={[
          styles.row,
          {
            borderTopColor: colors.border,
            // Bottom border only on the last row for a closing hairline.
            borderBottomColor: index === CAPABILITIES.length - 1
              ? colors.border
              : 'transparent',
          },
        ]}
      >
        <Text
          style={[
            typography.numberEditorial,
            { color: colors.accent, width: 56 },
          ]}
        >
          {String(index + 1).padStart(2, '0')}
        </Text>
        <View style={{ flex: 1 }}>
          <Text
            style={[
              typography.serifHeadline,
              { color: colors.textPrimary },
            ]}
          >
            {title}
          </Text>
          <Text
            style={[
              typography.body,
              { color: colors.textSecondary, marginTop: 6 },
            ]}
          >
            {body}
          </Text>
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: {
    flex: 1,
    paddingHorizontal: spacing.s6,
    paddingVertical: spacing.s8,
    justifyContent: 'space-between',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: spacing.s5,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
});
