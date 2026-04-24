import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  Easing,
  FadeIn,
  FadeOut,
} from 'react-native-reanimated';
import {
  fontScale,
  makeStyles,
  moderateScale,
  spacing,
  typography,
  useTheme,
} from '@/theme';
import { SceneTransition } from '@/components/navigation/SceneTransition';
import { hapticHeavy, hapticLight } from '@/services/haptics';
import { useHomeDashboard } from '@/hooks/useHomeDashboard';
import { useHoldToRecord } from '@/hooks/useHoldToRecord';
import { useStructureTranscript } from '@/hooks/useStructureTranscript';
import { UpNextCard } from '@/components/home/UpNextCard';
import { QuickLogRow } from '@/components/home/QuickLogRow';
import { TimelineCard } from '@/components/home/TimelineCard';
import { TodayEmpty } from '@/components/home/TodayEmpty';
import { InsightNudge } from '@/components/home/InsightNudge';
import { FirstEntryHero } from '@/components/home/FirstEntryHero';
import { PostVisitPrompt } from '@/components/home/PostVisitPrompt';
import { RecordFAB } from '@/components/home/RecordFAB';
import { HoldToRecordOverlay } from '@/components/home/HoldToRecordOverlay';
import { HoldReviewSheet, HoldReviewStatus } from '@/components/home/HoldReviewSheet';
import { SectionLabel } from '@/components/ui/SectionLabel';
import { useAppointmentsStore } from '@/stores/useAppointmentsStore';
import { useProfileStore } from '@/stores/useProfileStore';
import { useRecordingsStore } from '@/stores/useRecordingsStore';
import { GeminiQuotaError } from '@/services/ai';
import type { StructuredWithSources } from '@/services/ai';
import { uuid } from '@/utils/uuid';

const TabHome: React.FC = () => {
  const router = useRouter();
  const { colors } = useTheme();
  const styles = useStyles();

  const {
    nextAppointment,
    todayEntries,
    nudge,
    dateEyebrow,
    greeting,
    recordingsCount,
    firstRecording,
    unresolvedVisit,
  } = useHomeDashboard();

  const markAttended = useAppointmentsStore((s) => s.markAttended);
  const markMissed = useAppointmentsStore((s) => s.markMissed);
  const markCancelled = useAppointmentsStore((s) => s.markCancelled);

  const firstEntryHeroDismissed = useProfileStore(
    (s) => s.firstEntryHeroDismissed,
  );
  const dismissFirstEntryHero = useProfileStore(
    (s) => s.dismissFirstEntryHero,
  );
  const showFirstEntryHero =
    recordingsCount === 1 &&
    !!firstRecording &&
    !firstEntryHeroDismissed;

  // ── Hold-to-record on the FAB ──────────────────────────────────
  // Short-tap → hint toast ("Hold to record").
  // Held ≥500ms → start recognition with theatrical overlay.
  // Released with a usable transcript → store as pending draft and
  // open /record in review phase via source=home-hold.
  const [toast, setToast] = useState<string | null>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const showToast = useCallback((text: string) => {
    setToast(text);
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => setToast(null), 1800);
  }, []);
  useEffect(() => {
    return () => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    };
  }, []);

  // Post-release review state. Null = no sheet open.
  const [postCapture, setPostCapture] = useState<
    { transcript: string; durationSec: number; createdAt: string } | null
  >(null);
  const [editValue, setEditValue] = useState('');
  // Last completed AI analysis — remembered with its input so we can
  // tell if the user's current editValue is stale vs. it.
  const [aiResult, setAiResult] = useState<
    { text: string; structured: StructuredWithSources } | null
  >(null);
  const [aiError, setAiError] = useState<string | null>(null);
  const [retryInSec, setRetryInSec] = useState(0);
  const [saving, setSaving] = useState(false);

  const structureMutation = useStructureTranscript();

  // Retry countdown tick for quota errors.
  useEffect(() => {
    if (retryInSec <= 0) return;
    const id = setInterval(() => {
      setRetryInSec((n) => (n <= 1 ? 0 : n - 1));
    }, 1000);
    return () => clearInterval(id);
  }, [retryInSec]);

  const runAnalysis = useCallback(
    (text: string) => {
      setAiError(null);
      structureMutation.mutate(text, {
        onSuccess: (structured) => {
          setAiResult({ text, structured });
        },
        onError: (e) => {
          if (e instanceof GeminiQuotaError) {
            setAiError(e.message);
            setRetryInSec(e.retryAfterSec ?? 0);
          } else {
            setAiError(e instanceof Error ? e.message : 'Could not structure transcript.');
          }
        },
      });
    },
    [structureMutation],
  );

  const { state: holdState, handlers: holdHandlers } = useHoldToRecord({
    holdThresholdMs: 500,
    minCommitDurationMs: 1000,
    onShortTap: () => {
      hapticLight();
      showToast('Hold to record');
    },
    onDiscard: (reason) => {
      hapticLight();
      showToast(reason === 'too-short' ? 'Hold a little longer' : "Didn't catch that");
    },
    onCommit: ({ transcript, durationSec }) => {
      // Open the review sheet; AI kicks off ambiently in the effect
      // below the moment `postCapture` is set.
      setPostCapture({ transcript, durationSec, createdAt: new Date().toISOString() });
      setEditValue(transcript);
      setAiResult(null);
      setAiError(null);
      setRetryInSec(0);
      setSaving(false);
    },
  });

  // Ambient analysis: kicks the moment the sheet opens, so by the
  // time the user finishes reading the transcript the structured
  // result is usually ready and Save is instant.
  useEffect(() => {
    if (!postCapture) return;
    if (aiResult?.text === postCapture.transcript) return;
    runAnalysis(postCapture.transcript);
    // Intentionally only watch the initial transcript — edits are
    // handled by the debounced effect below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [postCapture?.transcript]);

  // Debounced re-analysis on edit: when the user types, re-kick AI
  // after 800ms of quiet so Save stays fresh without hammering the
  // endpoint on every keystroke.
  useEffect(() => {
    if (!postCapture) return;
    const text = editValue.trim();
    if (!text) return;
    if (aiResult?.text === text) return;
    if (text === postCapture.transcript) return;
    const id = setTimeout(() => runAnalysis(text), 800);
    return () => clearTimeout(id);
  }, [editValue, postCapture, aiResult, runAnalysis]);

  const dismissSheet = useCallback(() => {
    setPostCapture(null);
    setEditValue('');
    setAiResult(null);
    setAiError(null);
    setRetryInSec(0);
    setSaving(false);
  }, []);

  const commitRecording = useCallback(
    (text: string, structured: StructuredWithSources, createdAt: string, durationSec: number) => {
      const tags = Array.from(
        new Set(structured.symptoms.slice(0, 2).filter(Boolean)),
      );
      useRecordingsStore.getState().add({
        id: uuid(),
        createdAt,
        durationSec,
        transcript: text,
        structured,
        tags,
      });
      hapticHeavy();
      dismissSheet();
    },
    [dismissSheet],
  );

  const onReRecord = useCallback(() => {
    hapticLight();
    dismissSheet();
  }, [dismissSheet]);

  const onSave = useCallback(() => {
    if (!postCapture) return;
    const text = editValue.trim();
    if (!text) {
      showToast('Nothing to save');
      return;
    }
    // Fresh analysis already available for this exact text — commit
    // immediately, no spinner needed.
    if (aiResult?.text === text) {
      commitRecording(text, aiResult.structured, postCapture.createdAt, postCapture.durationSec);
      return;
    }
    // Otherwise kick (or wait for) analysis, then commit.
    setSaving(true);
    structureMutation.mutate(text, {
      onSuccess: (structured) => {
        setAiResult({ text, structured });
        commitRecording(text, structured, postCapture.createdAt, postCapture.durationSec);
      },
      onError: (e) => {
        setSaving(false);
        if (e instanceof GeminiQuotaError) {
          setAiError(e.message);
          setRetryInSec(e.retryAfterSec ?? 0);
        } else {
          setAiError(e instanceof Error ? e.message : 'Could not structure transcript.');
        }
      },
    });
  }, [postCapture, editValue, aiResult, structureMutation, showToast, commitRecording]);

  const sheetVisible = !!postCapture && !holdState.isRecording;
  const sheetStatus: HoldReviewStatus = saving
    ? 'saving'
    : aiError
      ? 'error'
      : structureMutation.isPending
        ? 'analyzing'
        : aiResult?.text === editValue.trim()
          ? 'ready'
          : 'analyzing';

  return (
    <SceneTransition mode="crossfade-parallax-up">
      <View style={{ flex: 1, backgroundColor: colors.bgPrimary }}>
        <SafeAreaView style={{ flex: 1 }} edges={['top']}>
          <View style={styles.header}>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={[typography.label, { color: colors.textTertiary }]}>
                {dateEyebrow}
              </Text>
              <Text
                style={[typography.h1, { color: colors.textPrimary, marginTop: 2 }]}
                numberOfLines={1}
              >
                {greeting}
              </Text>
            </View>
            <Pressable
              onPress={() => {
                hapticLight();
                router.push('/settings');
              }}
              accessibilityRole="button"
              accessibilityLabel="Settings"
              style={styles.avatar}
            >
              <LinearGradient
                colors={['#2C6E6B', '#1F504E']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFill}
              />
              <Text style={styles.avatarLetter}>Y</Text>
            </Pressable>
          </View>

          <ScrollView
            contentContainerStyle={styles.scroll}
            showsVerticalScrollIndicator={false}
          >
            {unresolvedVisit && (
              <View style={{ marginBottom: spacing.s4 }}>
                <PostVisitPrompt
                  appointment={unresolvedVisit}
                  onAttended={() => markAttended(unresolvedVisit.id)}
                  onMissed={() => markMissed(unresolvedVisit.id)}
                  onCancelled={() => markCancelled(unresolvedVisit.id)}
                />
              </View>
            )}

            {showFirstEntryHero && firstRecording && (
              <View style={{ marginBottom: spacing.s4 }}>
                <FirstEntryHero
                  recording={firstRecording}
                  nextAppointment={nextAppointment}
                  onDismiss={dismissFirstEntryHero}
                />
              </View>
            )}

            <UpNextCard
              appointment={nextAppointment}
              onPress={() => router.push('/(tabs)/prep')}
              onAdd={() => router.push('/appointment-new')}
            />

            <View style={{ marginTop: spacing.s4 }}>
              <QuickLogRow />
            </View>

            <View style={{ marginTop: spacing.s5 }}>
              <View style={styles.sectionRow}>
                <SectionLabel label="Today" />
                {todayEntries.length > 0 && (
                  <Text style={[typography.label, { color: colors.textTertiary }]}>
                    {todayEntries.length}{' '}
                    {todayEntries.length === 1 ? 'entry' : 'entries'}
                  </Text>
                )}
              </View>
              {todayEntries.length > 0 ? (
                <TimelineCard entries={todayEntries} />
              ) : (
                <TodayEmpty onPress={() => router.push('/record')} />
              )}
            </View>

            {nudge && (
              <InsightNudge
                nudge={nudge}
                onPress={() => router.push('/(tabs)/insights')}
              />
            )}

            {!showFirstEntryHero && (
              <Text
                style={[
                  typography.caption,
                  {
                    color: colors.textTertiary,
                    textAlign: 'center',
                    marginTop: spacing.s5,
                    paddingHorizontal: spacing.s6,
                  },
                ]}
              >
                Logging little and often makes your prep summaries sharper.
              </Text>
            )}
          </ScrollView>

          <RecordFAB
            onPressIn={holdHandlers.onPressIn}
            onPressOut={holdHandlers.onPressOut}
            isRecording={holdState.isRecording}
            volume={holdState.volume}
          />

          <HoldToRecordOverlay
            visible={holdState.isRecording}
            liveTranscript={holdState.liveTranscript}
            durationSec={holdState.durationSec}
            volume={holdState.volume}
          />

          <HoldReviewSheet
            visible={sheetVisible}
            durationSec={postCapture?.durationSec ?? 0}
            editValue={editValue}
            onEditChange={setEditValue}
            status={sheetStatus}
            onSave={onSave}
            onReRecord={onReRecord}
            onClose={onReRecord}
            error={aiError}
            retryInSec={retryInSec}
          />

          {toast && (
            <Animated.View
              pointerEvents="none"
              entering={FadeIn.duration(160).easing(Easing.out(Easing.cubic))}
              exiting={FadeOut.duration(220)}
              style={styles.toastWrap}
            >
              <View style={[styles.toast, { backgroundColor: colors.textPrimary }]}>
                <Text style={[styles.toastText, { color: colors.bgSurface }]}>
                  {toast}
                </Text>
              </View>
            </Animated.View>
          )}
        </SafeAreaView>
      </View>
    </SceneTransition>
  );
};

export default TabHome;

const useStyles = makeStyles((theme) => ({
  header: {
    paddingTop: theme.spacing.s3,
    paddingHorizontal: theme.spacing.s6,
    paddingBottom: theme.spacing.s3,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: moderateScale(12),
  },
  avatar: {
    width: moderateScale(40),
    height: moderateScale(40),
    borderRadius: moderateScale(20),
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLetter: {
    color: '#FFFFFF',
    fontFamily: 'DMSans_700Bold',
    fontSize: fontScale(16),
  },
  scroll: {
    paddingHorizontal: spacing.s6,
    paddingBottom: 160,
  },
  sectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  toastWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: moderateScale(180),
    alignItems: 'center',
    justifyContent: 'center',
  },
  toast: {
    paddingHorizontal: moderateScale(14),
    paddingVertical: moderateScale(8),
    borderRadius: moderateScale(20),
    maxWidth: '80%',
  },
  toastText: {
    fontFamily: 'DMSans_600SemiBold',
    fontSize: fontScale(12),
    letterSpacing: 0.2,
    textAlign: 'center',
  },
}));
