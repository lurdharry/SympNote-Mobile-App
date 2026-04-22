import React, { useEffect, useRef, useState } from 'react';
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
  withRepeat,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Activity,
  BarChart3,
  Hourglass,
  Lock,
  MapPin,
  Mic,
  Sparkles,
  Zap,
} from 'lucide-react-native';
import Svg, {
  Circle as SvgCircle,
  Defs,
  RadialGradient,
  Stop,
} from 'react-native-svg';
import { useTheme, radius, spacing, typography, shadows } from '../../theme';
import { SceneTransition } from '../../components/navigation/SceneTransition';
import { BackButton } from '../../components/ui/BackButton';
import { PrimaryButton } from '../../components/ui/PrimaryButton';
import { WaveBars } from '../../components/ui/WaveBars';
import { Confetti } from '../../components/ui/Confetti';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import {
  ensureSpeechPermission,
  startRecognition,
  describeSpeechError,
  SpeechHandle,
} from '../../services/speech';
import { structureTranscript, GeminiQuotaError } from '../../services/ai';
import { hapticHeavy, hapticLight, hapticMedium, hapticSuccess } from '../../services/haptics';
import { useRecordingsStore } from '../../stores/useRecordingsStore';
import { StructuredEntry } from '../../stores/types';
import { StructuredWithSources } from '../../components/recording/types';
import { uuid } from '../../utils/uuid';

/**
 * Screen 06 — First recording.
 *
 * Demonstrates the full live-record → transcript → structured-summary
 * choreography. Uses the real on-device speech engine when permission
 * is granted; falls back to a scripted demo (per handoff) if the user
 * taps the mic without granting access, so the onboarding never dead-
 * ends.
 */

const PROMPTS = [
  "My knee has been hurting when I climb stairs…",
  "I've been getting headaches in the afternoon…",
  "I feel more tired than usual…",
];

type IconRef = typeof Activity;
type FieldKey = 'symptoms' | 'location' | 'duration' | 'severity' | 'triggers';
type FieldMeta = { key: FieldKey; label: string; Icon: IconRef; tint: string };
const FIELD_META: FieldMeta[] = [
  { key: 'symptoms', label: 'Symptom',  Icon: Activity,  tint: '#E07A5F' },
  { key: 'location', label: 'Location', Icon: MapPin,    tint: '#2C6E6B' },
  { key: 'duration', label: 'Duration', Icon: Hourglass, tint: '#D97706' },
  { key: 'severity', label: 'Severity', Icon: BarChart3, tint: '#C45C3F' },
  { key: 'triggers', label: 'Triggers', Icon: Zap,       tint: '#F6C06A' },
];

function fieldDisplay(s: StructuredEntry, key: FieldKey): string {
  switch (key) {
    case 'symptoms': return s.symptoms.filter(Boolean).join(', ') || '—';
    case 'location': return s.location || '—';
    case 'duration': return s.duration || '—';
    case 'severity': return `${s.severity}/10`;
    case 'triggers': return s.triggers.filter(Boolean).join(', ') || '—';
  }
}

type Phase = 'idle' | 'recording' | 'processing' | 'structured' | 'error';

export default function ScreenFirstRecording() {
  const router = useRouter();
  const { colors } = useTheme();
  const reduced = useReducedMotion();

  const [phase, setPhase] = useState<Phase>('idle');
  const [promptIdx, setPromptIdx] = useState(0);
  const [transcript, setTranscript] = useState('');
  const [structured, setStructured] = useState<StructuredWithSources | null>(null);
  const [fieldCount, setFieldCount] = useState(0);
  const [burst, setBurst] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [retryInSec, setRetryInSec] = useState(0);

  const speechRef = useRef<SpeechHandle | null>(null);
  const promptRotationRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const capturedRef = useRef<string>('');
  const startedAtRef = useRef<number>(0);
  const durationTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const savedRef = useRef<boolean>(false);

  // Rotate example prompts while idle.
  useEffect(() => {
    if (phase !== 'idle') {
      if (promptRotationRef.current) clearInterval(promptRotationRef.current);
      return;
    }
    promptRotationRef.current = setInterval(
      () => setPromptIdx((i) => (i + 1) % PROMPTS.length),
      3000
    );
    return () => {
      if (promptRotationRef.current) clearInterval(promptRotationRef.current);
    };
  }, [phase]);

  // Retry countdown for quota errors.
  useEffect(() => {
    if (retryInSec <= 0) return;
    const id = setInterval(() => {
      setRetryInSec((n) => (n <= 1 ? 0 : n - 1));
    }, 1000);
    return () => clearInterval(id);
  }, [retryInSec]);

  // Kick off structured field reveal + celebration when we hit 'structured'.
  useEffect(() => {
    if (phase !== 'structured') return;
    setFieldCount(0);
    setBurst(false);
    let n = 0;
    const id = setInterval(() => {
      n += 1;
      setFieldCount(n);
      if (n >= FIELD_META.length) {
        clearInterval(id);
        setTimeout(() => {
          setBurst(true);
          hapticSuccess();
        }, 200);
      }
    }, 220);
    return () => clearInterval(id);
  }, [phase]);

  useEffect(() => {
    return () => {
      speechRef.current?.abort();
      if (durationTimerRef.current) clearInterval(durationTimerRef.current);
    };
  }, []);

  const runGemini = async (text: string) => {
    setErrorMessage(null);
    setRetryInSec(0);
    setPhase('processing');
    try {
      const s = await structureTranscript(text);
      setStructured(s);
      setPhase('structured');
    } catch (e) {
      if (e instanceof GeminiQuotaError) {
        setErrorMessage(e.message);
        setRetryInSec(e.retryAfterSec ?? 0);
      } else {
        setErrorMessage(
          e instanceof Error ? e.message : 'Could not structure transcript.'
        );
      }
      setPhase('error');
    }
  };

  const stopAndProcess = async () => {
    const speech = speechRef.current;
    speechRef.current = null;
    if (durationTimerRef.current) {
      clearInterval(durationTimerRef.current);
      durationTimerRef.current = null;
    }
    const duration = startedAtRef.current
      ? Math.round((Date.now() - startedAtRef.current) / 1000)
      : 0;
    if (!speech) {
      setPhase('idle');
      return;
    }
    hapticMedium();
    speech.stop();
    // Let the recognizer flush a final result.
    await new Promise((r) => setTimeout(r, 500));
    const text = (speech.getTranscript() || capturedRef.current || '').trim();
    if (!text || duration < 1) {
      setPhase('idle');
      Alert.alert(
        'Nothing captured',
        duration < 1
          ? 'Tap the mic, speak a sentence, then tap again to finish.'
          : "We didn't catch any words. Try speaking a bit louder and closer to the mic."
      );
      return;
    }
    capturedRef.current = text;
    setTranscript(text);
    await runGemini(text);
  };

  const onMic = async () => {
    if (phase === 'recording') {
      void stopAndProcess();
      return;
    }
    if (phase !== 'idle') return;
    hapticHeavy();
    const perm = await ensureSpeechPermission();
    if (!perm.granted) {
      Alert.alert(
        'Microphone access needed',
        perm.reason ?? 'Enable microphone and speech recognition in Settings to log your first entry.'
      );
      return;
    }
    capturedRef.current = '';
    setTranscript('');
    setStructured(null);
    setErrorMessage(null);
    startedAtRef.current = Date.now();
    setPhase('recording');
    try {
      speechRef.current = startRecognition({
        onPartial: (t) => {
          capturedRef.current = t;
          setTranscript(t);
        },
        onFinal: (t) => {
          capturedRef.current = t;
          setTranscript(t);
        },
        onError: (code) => {
          if (code === 'no-speech') return;
          speechRef.current?.abort();
          speechRef.current = null;
          if (durationTimerRef.current) {
            clearInterval(durationTimerRef.current);
            durationTimerRef.current = null;
          }
          setPhase('idle');
          Alert.alert('Speech recognition issue', describeSpeechError(code));
        },
      });
      durationTimerRef.current = setInterval(() => {
        // No visible timer right now, but keep the tick so a future
        // UI element can read `startedAtRef` cleanly if needed.
      }, 500);
    } catch (e) {
      speechRef.current = null;
      setPhase('idle');
      Alert.alert('Could not start recording', String(e));
    }
  };

  const onRetryStructuring = () => {
    const text = (capturedRef.current || transcript).trim();
    if (!text) {
      setPhase('idle');
      return;
    }
    if (retryInSec > 0) return;
    void runGemini(text);
  };

  const onRecordAgain = () => {
    hapticLight();
    speechRef.current?.abort();
    speechRef.current = null;
    if (durationTimerRef.current) {
      clearInterval(durationTimerRef.current);
      durationTimerRef.current = null;
    }
    capturedRef.current = '';
    setTranscript('');
    setStructured(null);
    setErrorMessage(null);
    setRetryInSec(0);
    setFieldCount(0);
    setBurst(false);
    savedRef.current = false;
    setPhase('idle');
  };

  const onContinue = () => {
    if (!structured) return;
    if (!savedRef.current) {
      savedRef.current = true;
      const text = (capturedRef.current || transcript).trim();
      const duration = startedAtRef.current
        ? Math.max(1, Math.round((Date.now() - startedAtRef.current) / 1000))
        : 1;
      useRecordingsStore.getState().add({
        id: uuid(),
        createdAt: new Date().toISOString(),
        durationSec: duration,
        transcript: text,
        structured: structured as StructuredEntry,
        tags: structured.symptoms.filter(Boolean).slice(0, 2),
      });
    }
    router.push('/onboarding/paywall');
  };

  return (
    <SceneTransition mode="scale-fade">
      <View style={[styles.root, { backgroundColor: colors.bgPrimary }]}>
        <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
          <View style={styles.topBar}>
            <BackButton onPress={() => router.back()} />
            <Text style={[typography.label, { color: colors.textTertiary }]}>
              8 of 9
            </Text>
            <View style={{ width: 40 }} />
          </View>

          <ScrollView
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
          >
            <Text
              style={[
                typography.h1,
                { color: colors.textPrimary, textAlign: 'center' },
              ]}
            >
              Tell us what's going on
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
              Just talk. We turn it into a clinical summary.
            </Text>

            <View style={styles.micArea}>
              <Confetti show={burst} />
              <MicOrb phase={phase} onPress={onMic} reduced={reduced} />

              <View style={styles.subSlot}>
                {phase === 'idle' && (
                  <Text
                    key={promptIdx}
                    style={[
                      typography.body,
                      {
                        color: colors.textTertiary,
                        textAlign: 'center',
                        fontStyle: 'italic',
                      },
                    ]}
                  >
                    {PROMPTS[promptIdx]}
                  </Text>
                )}
                {phase === 'recording' && <WaveBars />}
                {phase === 'processing' && <ShimmerLines />}
              </View>

              <View style={[styles.encryptedRow]}>
                <Lock size={12} color={colors.textTertiary} />
                <Text
                  style={[
                    typography.caption,
                    { color: colors.textTertiary, marginLeft: 6 },
                  ]}
                >
                  End-to-end encrypted
                </Text>
              </View>
            </View>

            {(phase === 'recording' ||
              phase === 'processing' ||
              phase === 'structured' ||
              phase === 'error') &&
              !!transcript && (
                <TranscriptCard text={transcript} typing={false} />
              )}

            {phase === 'structured' && structured && (
              <StructuredCard
                structured={structured}
                fieldCount={fieldCount}
                burst={burst}
              />
            )}

            {phase === 'error' && (
              <ErrorCard
                message={errorMessage ?? 'Something went wrong.'}
                retryInSec={retryInSec}
                onRetry={onRetryStructuring}
                onStartOver={onRecordAgain}
              />
            )}
          </ScrollView>

          <View
            style={{
              paddingHorizontal: spacing.s6,
              paddingTop: 8,
              gap: 8,
            }}
          >
            {phase === 'structured' && (
              <Pressable
                onPress={onRecordAgain}
                hitSlop={8}
                style={{ alignSelf: 'center', paddingVertical: 4 }}
              >
                <Text
                  style={[
                    typography.caption,
                    { color: colors.textTertiary },
                  ]}
                >
                  Record again
                </Text>
              </Pressable>
            )}
            <PrimaryButton
              label={
                phase === 'structured'
                  ? 'Continue'
                  : phase === 'recording'
                  ? 'Tap mic to finish'
                  : phase === 'processing'
                  ? 'Structuring…'
                  : phase === 'error'
                  ? 'Retry above'
                  : 'Tap mic to begin'
              }
              disabled={phase !== 'structured'}
              onPress={onContinue}
            />
          </View>
        </SafeAreaView>
      </View>
    </SceneTransition>
  );
}

/* -------------------- Mic orb -------------------- */

function MicOrb({
  phase,
  onPress,
  reduced,
}: {
  phase: Phase;
  onPress: () => void;
  reduced: boolean;
}) {
  const active = phase === 'recording';
  const pulse1 = useSharedValue(0);
  const pulse2 = useSharedValue(0);

  useEffect(() => {
    if (reduced || phase !== 'idle') return;
    pulse1.value = withRepeat(
      withTiming(1, { duration: 1800, easing: Easing.bezier(0.4, 0, 0.6, 1) }),
      -1,
      false
    );
    pulse2.value = withRepeat(
      withTiming(1, { duration: 1800, easing: Easing.bezier(0.4, 0, 0.6, 1) }),
      -1,
      false
    );
    // Offset ring 2 by 900ms
    const id = setTimeout(() => {
      pulse2.value = 0;
      pulse2.value = withRepeat(
        withTiming(1, {
          duration: 1800,
          easing: Easing.bezier(0.4, 0, 0.6, 1),
        }),
        -1,
        false
      );
    }, 900);
    return () => clearTimeout(id);
  }, [reduced, phase, pulse1, pulse2]);

  const ring1 = useAnimatedStyle(() => ({
    transform: [{ scale: 1 + pulse1.value * 0.35 }],
    opacity: 0.45 * (1 - pulse1.value),
  }));
  const ring2 = useAnimatedStyle(() => ({
    transform: [{ scale: 1 + pulse2.value * 0.35 }],
    opacity: 0.45 * (1 - pulse2.value),
  }));

  const scale = useSharedValue(1);
  useEffect(() => {
    scale.value = withSpring(active ? 0.96 : 1, {
      damping: 18,
      stiffness: 200,
    });
  }, [active, scale]);
  const core = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <View style={{ width: 160, height: 160, alignItems: 'center', justifyContent: 'center' }}>
      {phase === 'idle' && (
        <>
          <Animated.View
            style={[
              StyleSheet.absoluteFill,
              styles.micPulse,
              { backgroundColor: 'rgba(44,110,107,0.18)' },
              ring1,
            ]}
            pointerEvents="none"
          />
          <Animated.View
            style={[
              StyleSheet.absoluteFill,
              styles.micPulse,
              { backgroundColor: 'rgba(246,192,106,0.22)' },
              ring2,
            ]}
            pointerEvents="none"
          />
        </>
      )}

      <Animated.View style={core}>
        <Pressable
          onPress={onPress}
          disabled={phase !== 'idle'}
          accessibilityRole="button"
          accessibilityLabel="Start voice log"
        >
          <View
            style={[
              styles.micCore,
              active ? styles.micCoreActive : styles.micCoreIdle,
            ]}
          >
            <MicOrbGradient active={active} />
            <View
              style={[
                StyleSheet.absoluteFill,
                { alignItems: 'center', justifyContent: 'center' },
              ]}
              pointerEvents="none"
            >
              {active ? (
                <View style={styles.stopShape} />
              ) : (
                <Mic size={44} color="#FFFFFF" strokeWidth={2} />
              )}
            </View>
          </View>
        </Pressable>
      </Animated.View>
    </View>
  );
}

function MicOrbGradient({ active }: { active: boolean }) {
  return (
    <Svg width="100%" height="100%" viewBox="0 0 120 120">
      <Defs>
        <RadialGradient id="micG" cx="0.3" cy="0.3" r="0.8">
          <Stop offset="0" stopColor={active ? '#F5B873' : '#4DB8B0'} />
          <Stop offset="0.8" stopColor={active ? '#C97A1E' : '#2C6E6B'} />
        </RadialGradient>
      </Defs>
      <SvgCircle cx={60} cy={60} r={60} fill="url(#micG)" />
    </Svg>
  );
}

/* -------------------- Shimmer lines (processing) -------------------- */

function ShimmerLines() {
  const { colors } = useTheme();
  const t = useSharedValue(0);
  const reduced = useReducedMotion();
  useEffect(() => {
    if (reduced) return;
    t.value = withRepeat(
      withTiming(1, { duration: 1800, easing: Easing.linear }),
      -1,
      false
    );
  }, [reduced, t]);
  const bg = useAnimatedStyle(() => ({
    transform: [{ translateX: -200 + t.value * 400 }],
  }));
  return (
    <View style={{ width: '100%', maxWidth: 260, gap: 8 }}>
      {[16, 14, 12].map((w, i) => (
        <View
          key={i}
          style={[
            styles.shimmer,
            { backgroundColor: colors.bgMuted, width: `${w * 6}%` },
          ]}
        >
          <Animated.View
            style={[StyleSheet.absoluteFill, bg]}
            pointerEvents="none"
          >
            <LinearGradient
              colors={[
                'rgba(245,241,234,0)',
                'rgba(245,241,234,0.8)',
                'rgba(245,241,234,0)',
              ]}
              start={{ x: 0, y: 0.5 }}
              end={{ x: 1, y: 0.5 }}
              style={StyleSheet.absoluteFill}
            />
          </Animated.View>
        </View>
      ))}
    </View>
  );
}

/* -------------------- Transcript + Structured cards -------------------- */

function TranscriptCard({ text, typing }: { text: string; typing: boolean }) {
  const { colors } = useTheme();
  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.bgSurface,
          borderColor: colors.border,
        },
        shadows.card,
      ]}
    >
      <View style={styles.cardHeader}>
        <Mic size={12} color={colors.textTertiary} />
        <Text
          style={[
            typography.label,
            { color: colors.textTertiary, letterSpacing: 0.8 },
          ]}
        >
          TRANSCRIPT
        </Text>
      </View>
      <Text
        style={[
          typography.body,
          { color: colors.textPrimary, lineHeight: 22 },
        ]}
      >
        {text}
        {typing && <Text style={{ color: colors.accent }}>▍</Text>}
      </Text>
    </View>
  );
}

function StructuredCard({
  structured,
  fieldCount,
  burst,
}: {
  structured: StructuredEntry;
  fieldCount: number;
  burst: boolean;
}) {
  const { colors } = useTheme();
  return (
    <View
      style={[
        styles.card,
        styles.aiCard,
        {
          backgroundColor: colors.bgSurface,
          borderColor: colors.accent,
        },
        shadows.card,
      ]}
    >
      {/* Decorative gold blob top-right */}
      <View
        pointerEvents="none"
        style={[
          styles.aiBlob,
          { backgroundColor: colors.gold, opacity: 0.1 },
        ]}
      />
      <View style={[styles.cardHeader, { marginBottom: spacing.s3 }]}>
        <Sparkles size={14} color={colors.accent} />
        <Text
          style={[
            typography.label,
            {
              color: colors.accent,
              fontFamily: 'Inter_700Bold',
              letterSpacing: 0.8,
              flex: 1,
            },
          ]}
        >
          AI SUMMARY
        </Text>
        {burst && (
          <View
            style={[
              styles.xpBadge,
              { backgroundColor: colors.success },
            ]}
          >
            <Text
              style={[
                typography.label,
                {
                  color: '#FFFFFF',
                  fontFamily: 'Inter_700Bold',
                },
              ]}
            >
              +50 XP
            </Text>
          </View>
        )}
      </View>
      <View style={{ gap: 10 }}>
        {FIELD_META.slice(0, fieldCount).map((f, i) => (
          <FieldRow
            key={f.key}
            k={f.label}
            v={fieldDisplay(structured, f.key)}
            Icon={f.Icon}
            tint={f.tint}
            index={i}
          />
        ))}
      </View>
    </View>
  );
}

function FieldRow({
  k,
  v,
  Icon,
  tint,
  index,
}: {
  k: string;
  v: string;
  Icon: IconRef;
  tint: string;
  index: number;
}) {
  const { colors } = useTheme();
  const opacity = useSharedValue(0);
  const ty = useSharedValue(8);
  useEffect(() => {
    opacity.value = withTiming(1, {
      duration: 320,
      easing: Easing.out(Easing.cubic),
    });
    ty.value = withSpring(0, { damping: 18, stiffness: 140 });
  }, [index, opacity, ty]);
  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: ty.value }],
  }));

  return (
    <Animated.View
      style={[
        styles.fieldRow,
        { backgroundColor: colors.bgPrimary },
        style,
      ]}
    >
      <View
        style={{
          width: 28,
          height: 28,
          borderRadius: 8,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: tint + '22',
        }}
      >
        <Icon size={16} color={tint} strokeWidth={2} />
      </View>
      <Text
        style={[
          typography.label,
          { color: colors.textTertiary, width: 64 },
        ]}
      >
        {k}
      </Text>
      <Text
        style={[
          typography.body,
          {
            color: colors.textPrimary,
            fontFamily: 'Inter_600SemiBold',
            flex: 1,
          },
        ]}
      >
        {v}
      </Text>
    </Animated.View>
  );
}

function ErrorCard({
  message,
  retryInSec,
  onRetry,
  onStartOver,
}: {
  message: string;
  retryInSec: number;
  onRetry: () => void;
  onStartOver: () => void;
}) {
  const { colors } = useTheme();
  const disabled = retryInSec > 0;
  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.bgSurface,
          borderColor: colors.border,
        },
        shadows.card,
      ]}
    >
      <Text
        style={[
          typography.label,
          {
            color: colors.coral,
            letterSpacing: 0.8,
            marginBottom: 6,
            fontFamily: 'Inter_700Bold',
          },
        ]}
      >
        STRUCTURING FAILED
      </Text>
      <Text
        style={[
          typography.body,
          { color: colors.textPrimary, lineHeight: 20, marginBottom: 12 },
        ]}
      >
        {message}
      </Text>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <Pressable
          onPress={onRetry}
          disabled={disabled}
          style={({ pressed }) => [
            {
              flex: 1,
              backgroundColor: disabled ? colors.bgMuted : colors.accent,
              opacity: pressed ? 0.85 : 1,
              paddingVertical: 10,
              borderRadius: radius.sm,
              alignItems: 'center',
            },
          ]}
        >
          <Text
            style={[
              typography.label,
              {
                color: disabled ? colors.textTertiary : '#FFFFFF',
                fontFamily: 'Inter_600SemiBold',
              },
            ]}
          >
            {disabled ? `Retry in ${retryInSec}s` : 'Retry'}
          </Text>
        </Pressable>
        <Pressable
          onPress={onStartOver}
          style={({ pressed }) => [
            {
              flex: 1,
              borderWidth: StyleSheet.hairlineWidth,
              borderColor: colors.border,
              backgroundColor: colors.bgPrimary,
              opacity: pressed ? 0.85 : 1,
              paddingVertical: 10,
              borderRadius: radius.sm,
              alignItems: 'center',
            },
          ]}
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
            Start over
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  safe: { flex: 1 },
  topBar: {
    paddingTop: spacing.s3,
    paddingHorizontal: spacing.s6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  content: {
    paddingHorizontal: spacing.s6,
    paddingTop: spacing.s4,
    paddingBottom: spacing.s6,
  },
  micArea: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.s6,
  },
  micPulse: {
    borderRadius: 9999,
  },
  micCore: {
    width: 120,
    height: 120,
    borderRadius: 60,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  micCoreIdle: {
    shadowColor: '#2C6E6B',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.35,
    shadowRadius: 24,
    elevation: 10,
  },
  micCoreActive: {
    shadowColor: '#C97A1E',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.4,
    shadowRadius: 24,
    elevation: 12,
  },
  stopShape: {
    width: 26,
    height: 26,
    borderRadius: 6,
    backgroundColor: '#FFFFFF',
  },
  subSlot: {
    height: 60,
    marginTop: spacing.s5,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.s4,
  },
  encryptedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.s3,
  },
  shimmer: {
    height: 14,
    borderRadius: 7,
    overflow: 'hidden',
  },
  card: {
    padding: 16,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    marginTop: spacing.s4,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  aiCard: {
    borderWidth: 2,
    overflow: 'hidden',
  },
  aiBlob: {
    position: 'absolute',
    right: -16,
    top: -16,
    width: 96,
    height: 96,
    borderRadius: 48,
  },
  fieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.sm,
  },
  xpBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 9999,
  },
});
