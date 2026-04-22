import React from 'react';
import { Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeIn, useAnimatedStyle } from 'react-native-reanimated';
import {
  makeStyles,
  moderateScale,
  scale,
  spacing,
  typography,
  useTheme,
  verticalScale,
} from '@/theme';
import { SceneTransition } from '@/components/navigation/SceneTransition';
import { BackButton } from '@/components/ui/BackButton';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { Confetti } from '@/components/ui/Confetti';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { useTypewriter } from '@/hooks/useTypewriter';
import { useAnalyzingFlow } from '@/hooks/useAnalyzingFlow';
import { ANALYZING_STEPS, STEP_TINTS } from '@/constants/analyzing';
import { OrbitOrb } from '@/components/analyzing/OrbitOrb';
import { XPTicker } from '@/components/analyzing/XPTicker';
import { CheckRow } from '@/components/analyzing/CheckRow';

const ScreenAnalyzing: React.FC = () => {
  const router = useRouter();
  const { colors } = useTheme();
  const styles = useStyles();
  const reduced = useReducedMotion();

  const {
    done,
    activeText,
    ready,
    confetti,
    xpEarned,
    xpTotal,
    completedCount,
    progressSv,
    xpPulse,
    caretOpacity,
  } = useAnalyzingFlow(reduced);

  const caretStyle = useAnimatedStyle(() => ({
    opacity: caretOpacity.value,
  }));

  const typedText = useTypewriter(ANALYZING_STEPS[activeText]!.t, {
    charMs: 32,
    enabled: !reduced,
  });

  return (
    <SceneTransition mode="scale-fade">
      <View style={[styles.root, { backgroundColor: colors.bgPrimary }]}>
        <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
          <View style={styles.topBar}>
            <BackButton onPress={() => router.back()} />
          </View>

          <View style={styles.hero}>
            <Confetti show={confetti} />

            <XPTicker xp={xpEarned} total={xpTotal} pulse={xpPulse} />

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
                  <Animated.Text style={[{ color: colors.accent }, caretStyle]}>
                    ▍
                  </Animated.Text>
                </Text>
              )}
            </View>

            <View style={styles.checkList}>
              {ANALYZING_STEPS.map((s, i) => (
                <CheckRow
                  key={i}
                  label={s.t}
                  Icon={s.Icon}
                  done={done[i]!}
                  tint={STEP_TINTS[i]!}
                />
              ))}
            </View>
          </View>

          <View style={styles.ctaSlot}>
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
};

export default ScreenAnalyzing;

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
  ctaSlot: {
    paddingHorizontal: spacing.s6,
    paddingBottom: spacing.s10,
  },
}));
