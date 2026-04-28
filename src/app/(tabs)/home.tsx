import React, { useCallback, useEffect, useRef, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Settings } from "lucide-react-native";
import Animated, { Easing, FadeIn, FadeOut } from "react-native-reanimated";
import { fontScale, makeStyles, moderateScale, spacing, typography, useTheme } from "@/theme";
import { SceneTransition } from "@/components/navigation/SceneTransition";
import { hapticLight } from "@/services/haptics";
import { useHomeDashboard } from "@/hooks/useHomeDashboard";
import { useHoldToRecord } from "@/hooks/useHoldToRecord";
import { usePaywallGate } from "@/hooks/usePaywallGate";
import { JournalHero } from "@/components/home/JournalHero";
import { UpNextCard } from "@/components/home/UpNextCard";
import { TimelineCard } from "@/components/home/TimelineCard";
import { TodayCheckIn } from "@/components/home/TodayCheckIn";
import { InsightNudge } from "@/components/home/InsightNudge";
import { FirstEntryHero } from "@/components/home/FirstEntryHero";
import { PostVisitPrompt } from "@/components/home/PostVisitPrompt";
import { RecordFAB } from "@/components/home/RecordFAB";
import { BriefsPeek } from "@/components/home/BriefsPeek";
import { HoldToRecordOverlay, HoldOverlayMode } from "@/components/home/HoldToRecordOverlay";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { useAppointmentsStore } from "@/stores/useAppointmentsStore";
import { useProfileStore } from "@/stores/useProfileStore";
import { useRecordingsStore } from "@/stores/useRecordingsStore";
import { useBriefsStore } from "@/stores/useBriefsStore";
import { unbriefedRecordings } from "@/utils/briefSource";
import { useOverlayRecording } from "@/hooks/useOverlayRecording";

const TabHome: React.FC = () => {
  const router = useRouter();
  const { colors } = useTheme();
  const styles = useStyles();

  const [toast, setToast] = useState<string | null>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback((text: string) => {
    setToast(text);
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => setToast(null), 1800);
  }, []);

  const {
    nextAppointment,
    todayEntries,
    nudge,
    recordingsCount,
    firstRecording,
    unresolvedVisit,
    lastRecordingAt,
    recentTopTag,
  } = useHomeDashboard();

  const {
    onSave,
    isExtracting,
    postCapture,
    onCommit,
    dismissOverlay,
    retryInSec,
    aiError,
    editValue,
    setEditValue,
  } = useOverlayRecording({ showToast });

  const allBriefs = useBriefsStore((s) => s.briefs);
  const allRecordings = useRecordingsStore((s) => s.recordings);
  const unbriefedCount = unbriefedRecordings(allRecordings, allBriefs).length;

  const markAttended = useAppointmentsStore((s) => s.markAttended);
  const markMissed = useAppointmentsStore((s) => s.markMissed);
  const markCancelled = useAppointmentsStore((s) => s.markCancelled);

  const firstEntryHeroDismissed = useProfileStore((s) => s.firstEntryHeroDismissed);
  const dismissFirstEntryHero = useProfileStore((s) => s.dismissFirstEntryHero);
  const showFirstEntryHero = recordingsCount === 1 && !!firstRecording && !firstEntryHeroDismissed;

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    };
  }, []);

  const { requireEntitlement, entitled } = usePaywallGate();

  const { state: holdState, handlers: holdHandlers } = useHoldToRecord({
    holdThresholdMs: 500,
    minCommitDurationMs: 1000,
    onShortTap: () => {
      if (!requireEntitlement()) return;
      hapticLight();
      router.push("/record");
    },
    onDiscard: (reason) => {
      hapticLight();
      showToast(reason === "too-short" ? "Hold a little longer" : "Didn't catch that");
    },
    onCommit,
  });

  const fabPressIn = useCallback(() => {
    if (!entitled) {
      requireEntitlement();
      return;
    }
    holdHandlers.onPressIn();
  }, [entitled, requireEntitlement, holdHandlers]);

  // The TodayCheckIn quick-record affordance shares the same gate.
  const onCheckInPress = useCallback(() => {
    if (!requireEntitlement()) return;
    router.push("/record");
  }, [requireEntitlement, router]);

  const onReRecord = useCallback(() => {
    hapticLight();
    dismissOverlay();
  }, [dismissOverlay]);

  const overlayMode: HoldOverlayMode = holdState.isRecording
    ? "recording"
    : isExtracting
      ? "extracting"
      : "review";
  const overlayVisible = holdState.isRecording || postCapture !== null;

  return (
    <SceneTransition mode="crossfade-parallax-up">
      <View style={{ flex: 1, backgroundColor: colors.bgPrimary }}>
        <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
          <View style={styles.topBar}>
            <Pressable
              onPress={() => {
                hapticLight();
                router.push("/settings");
              }}
              accessibilityRole="button"
              accessibilityLabel="Settings"
              hitSlop={10}
              style={styles.settingsBtn}
            >
              <Settings size={moderateScale(24)} color={colors.textPrimary} strokeWidth={2} />
            </Pressable>
          </View>

          <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
            <JournalHero />

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
              onPress={() => router.push("/(tabs)/prep")}
              onAdd={() => router.push("/appointment-new")}
            />

            <BriefsPeek
              unbriefedCount={unbriefedCount}
              onPress={() => {
                hapticLight();
                router.push("/(tabs)/prep");
              }}
            />


            <View style={{ marginTop: spacing.s5 }}>
              <View style={styles.sectionRow}>
                <SectionLabel label="Today" />
                {todayEntries.length > 0 && (
                  <Text style={[typography.label, { color: colors.textTertiary }]}>
                    {todayEntries.length} {todayEntries.length === 1 ? "entry" : "entries"}
                  </Text>
                )}
              </View>
              {todayEntries.length > 0 ? (
                <TimelineCard entries={todayEntries} />
              ) : (
                <TodayCheckIn
                  recordingsCount={recordingsCount}
                  lastRecordingAt={lastRecordingAt}
                  recentTopTag={recentTopTag}
                  onPress={onCheckInPress}
                />
              )}
            </View>

            {nudge && (
              <InsightNudge nudge={nudge} onPress={() => router.push("/(tabs)/insights")} />
            )}

            {!showFirstEntryHero && (
              <Text
                style={[
                  typography.caption,
                  {
                    color: colors.textTertiary,
                    textAlign: "center",
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
            onPressIn={fabPressIn}
            onPressOut={holdHandlers.onPressOut}
            isRecording={holdState.isRecording}
            volume={holdState.volume}
          />

          <HoldToRecordOverlay
            visible={overlayVisible}
            mode={overlayMode}
            liveTranscript={holdState.liveTranscript}
            durationSec={
              holdState.isRecording ? holdState.durationSec : (postCapture?.durationSec ?? 0)
            }
            volume={holdState.volume}
            editValue={editValue}
            onEditChange={setEditValue}
            onSave={onSave}
            onReRecord={onReRecord}
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
                <Text style={[styles.toastText, { color: colors.bgSurface }]}>{toast}</Text>
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
  topBar: {
    paddingTop: theme.spacing.s2,
    paddingHorizontal: theme.spacing.s6,
    paddingBottom: theme.spacing.s1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
  },
  settingsBtn: {
    width: moderateScale(36),
    height: moderateScale(36),
    alignItems: "center",
    justifyContent: "center",
  },
  scroll: {
    paddingHorizontal: spacing.s6,
    paddingBottom: 160,
  },
  sectionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  toastWrap: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: moderateScale(180),
    alignItems: "center",
    justifyContent: "center",
  },
  toast: {
    paddingHorizontal: moderateScale(14),
    paddingVertical: moderateScale(8),
    borderRadius: moderateScale(20),
    maxWidth: "80%",
  },
  toastText: {
    fontFamily: "DMSans_600SemiBold",
    fontSize: fontScale(12),
    letterSpacing: 0.2,
    textAlign: "center",
  },
}));
