import React, { useEffect, useRef, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSpring,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { Canvas, Circle, RadialGradient, vec, BlurMask } from '@shopify/react-native-skia';
import { WaveformCanvas } from './animated/WaveformCanvas';
import { ShimmerText } from './animated/ShimmerText';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { useTheme, spacing, typography } from '../theme';
import { hapticHeavy, hapticMedium } from '../services/haptics';
import {
  ensureSpeechPermission,
  startRecognition,
  describeSpeechError,
  SpeechHandle,
} from '../services/speech';
import { structureTranscript } from '../services/ai';
import { useRecordingsStore } from '../stores/useRecordingsStore';
import { uuid } from '../utils/uuid';
import { formatDuration } from '../utils/date';

type Props = {
  onSaved?: (recordingId: string) => void;
};

type Phase = 'idle' | 'recording' | 'processing' | 'done';

export function RecordButton({ onSaved }: Props) {
  const { colors } = useTheme();
  const reduced = useReducedMotion();
  const [phase, setPhase] = useState<Phase>('idle');
  const [dur, setDur] = useState(0);
  const [liveTranscript, setLiveTranscript] = useState('');

  const meterSv = useSharedValue(0);
  const pulse = useSharedValue(0);
  const scale = useSharedValue(1);

  const speechRef = useRef<SpeechHandle | null>(null);
  const startedAtRef = useRef(0);
  const durationTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (phase !== 'idle' || reduced) return;
    pulse.value = withRepeat(
      withTiming(1, { duration: 1800, easing: Easing.inOut(Easing.sin) }),
      -1,
      false
    );
  }, [phase, reduced, pulse]);

  useEffect(() => {
    return () => {
      speechRef.current?.abort();
      if (durationTimer.current) clearInterval(durationTimer.current);
    };
  }, []);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 1 + pulse.value * 0.15 }],
    opacity: 0.4 * (1 - pulse.value),
  }));
  const coreStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const begin = async () => {
    if (speechRef.current) return;
    const perm = await ensureSpeechPermission();
    if (!perm.granted) {
      Alert.alert(
        'Permissions needed',
        perm.reason ?? 'Enable microphone and speech recognition in Settings.'
      );
      return;
    }

    hapticHeavy();
    scale.value = withSpring(1.2, { damping: 12, stiffness: 180 });
    setPhase('recording');
    setDur(0);
    setLiveTranscript('');
    startedAtRef.current = Date.now();

    try {
      speechRef.current = startRecognition({
        onPartial: (t) => setLiveTranscript(t),
        onFinal: (t) => setLiveTranscript(t),
        onVolume: (v) => {
          meterSv.value = v;
        },
        onError: (code, message) => {
          if (code === 'no-speech') return;
          console.warn('[speech]', code, message);
          Alert.alert('Speech recognition issue', describeSpeechError(code));
        },
      });
      durationTimer.current = setInterval(() => {
        setDur(Math.floor((Date.now() - startedAtRef.current) / 1000));
      }, 500);
    } catch (e) {
      speechRef.current = null;
      setPhase('idle');
      scale.value = withSpring(1);
      Alert.alert('Could not start', String(e));
    }
  };

  const end = async () => {
    hapticMedium();
    scale.value = withSpring(1, { damping: 14, stiffness: 160 });
    if (durationTimer.current) {
      clearInterval(durationTimer.current);
      durationTimer.current = null;
    }

    const speech = speechRef.current;
    speechRef.current = null;
    const duration = Math.round((Date.now() - startedAtRef.current) / 1000);
    if (!speech) {
      setPhase('idle');
      return;
    }
    speech.stop();
    await new Promise((r) => setTimeout(r, 350));
    const transcript = (speech.getTranscript() || liveTranscript || '').trim();

    if (!transcript || duration < 1) {
      setPhase('idle');
      Alert.alert('Nothing captured', 'Tap the mic, speak, then tap again to finish.');
      return;
    }

    setPhase('processing');
    try {
      const structured = await structureTranscript(transcript);
      const id = uuid();
      useRecordingsStore.getState().add({
        id,
        createdAt: new Date().toISOString(),
        durationSec: duration,
        transcript,
        structured,
        tags: structured.symptoms.slice(0, 3),
      });
      setPhase('done');
      onSaved?.(id);
      setTimeout(() => setPhase('idle'), 1200);
    } catch (e) {
      Alert.alert('Something went wrong', String(e));
      setPhase('idle');
    }
  };

  const toggle = () => {
    if (phase === 'idle') begin();
    else if (phase === 'recording') end();
  };

  return (
    <View style={{ alignItems: 'center' }}>
      <View
        style={{
          width: 160,
          height: 160,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {!reduced && phase === 'idle' && (
          <Animated.View
            style={[
              StyleSheet.absoluteFill,
              { alignItems: 'center', justifyContent: 'center' },
              pulseStyle,
            ]}
            pointerEvents="none"
          >
            <View
              style={{
                width: 160,
                height: 160,
                borderRadius: 80,
                borderWidth: 2,
                borderColor: colors.accent,
              }}
            />
          </Animated.View>
        )}
        <Animated.View style={coreStyle}>
          <Pressable
            onPress={toggle}
            disabled={phase === 'processing' || phase === 'done'}
          >
            <Canvas style={{ width: 130, height: 130 }}>
              <Circle cx={65} cy={65} r={60}>
                <RadialGradient
                  c={vec(65, 65)}
                  r={65}
                  colors={
                    phase === 'recording'
                      ? ['#F2B36E', '#E08B3F', '#C4701F']
                      : [colors.accentLight, colors.accent, colors.accentDark]
                  }
                />
                <BlurMask blur={10} style="solid" />
              </Circle>
            </Canvas>
          </Pressable>
        </Animated.View>
      </View>

      {phase === 'recording' && (
        <View style={{ alignItems: 'center', marginTop: spacing.s4 }}>
          <WaveformCanvas level={meterSv} width={260} height={60} active />
          <Text
            style={[
              typography.number,
              { color: colors.warning, marginTop: spacing.s2, fontSize: 15 },
            ]}
          >
            {formatDuration(dur)}
          </Text>
          {!!liveTranscript && (
            <Text
              numberOfLines={2}
              style={[
                typography.body,
                {
                  color: colors.textPrimary,
                  textAlign: 'center',
                  marginTop: spacing.s3,
                  paddingHorizontal: spacing.s4,
                },
              ]}
            >
              {liveTranscript}
            </Text>
          )}
        </View>
      )}

      {phase === 'processing' && (
        <ShimmerText
          text="Processing..."
          textStyle={{ ...typography.body, color: colors.textSecondary }}
          containerStyle={{ marginTop: spacing.s4 }}
        />
      )}

      {phase === 'done' && (
        <Text
          style={[typography.body, { color: colors.success, marginTop: spacing.s4 }]}
        >
          Saved
        </Text>
      )}

      {(phase === 'idle' || phase === 'recording') && (
        <Text
          style={[
            typography.caption,
            { color: colors.textTertiary, marginTop: spacing.s4 },
          ]}
        >
          {phase === 'recording' ? 'Tap to finish' : 'Tap to record'}
        </Text>
      )}
    </View>
  );
}
