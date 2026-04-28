import React, { useCallback, useEffect, useRef, useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import Animated, { Easing, FadeIn, FadeInDown, FadeOut } from "react-native-reanimated";
import { fontScale, makeStyles, moderateScale, spacing, useTheme } from "@/theme";
import { SceneTransition } from "@/components/navigation/SceneTransition";
import { hapticLight } from "@/services/haptics";
import { useHomeDashboard } from "@/hooks/useHomeDashboard";
import { useHoldToRecord } from "@/hooks/useHoldToRecord";
import { usePaywallGate } from "@/hooks/usePaywallGate";
import { ReadyStateCard } from "@/components/home/ReadyStateCard";
import { DayStrap } from "@/components/home/DayStrap";
import { CareTeamStrip } from "@/components/home/CareTeamStrip";
import { RecentNotesRail } from "@/components/home/RecentNotesRail";
import { InsightNudge } from "@/components/home/InsightNudge";
import { FirstEntryHero } from "@/components/home/FirstEntryHero";
import { PostVisitPrompt } from "@/components/home/PostVisitPrompt";
import { RecordFAB } from "@/components/home/RecordFAB";
import { HoldToRecordOverlay, HoldOverlayMode } from "@/components/home/HoldToRecordOverlay";
import { useAppointmentsStore } from "@/stores/useAppointmentsStore";
import { useProfileStore } from "@/stores/useProfileStore";
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

  const { nextAppointment, nudge, recordingsCount, firstRecording, unresolvedVisit } =
    useHomeDashboard();

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
          <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
            <Animated.View entering={FadeIn.duration(280)}>
              <DayStrap />
            </Animated.View>

            <Animated.View entering={FadeInDown.duration(420).easing(Easing.out(Easing.cubic))}>
              <ReadyStateCard />
            </Animated.View>

            {unresolvedVisit && (
              <View style={{ marginTop: spacing.s4 }}>
                <PostVisitPrompt
                  appointment={unresolvedVisit}
                  onAttended={() => markAttended(unresolvedVisit.id)}
                  onMissed={() => markMissed(unresolvedVisit.id)}
                  onCancelled={() => markCancelled(unresolvedVisit.id)}
                />
              </View>
            )}

            {showFirstEntryHero && firstRecording && (
              <View style={{ marginTop: spacing.s4 }}>
                <FirstEntryHero
                  recording={firstRecording}
                  nextAppointment={nextAppointment}
                  onDismiss={dismissFirstEntryHero}
                />
              </View>
            )}

            <Animated.View
              entering={FadeInDown.delay(140).duration(420).easing(Easing.out(Easing.cubic))}
            >
              <CareTeamStrip />
            </Animated.View>
            <Animated.View
              entering={FadeInDown.delay(260).duration(420).easing(Easing.out(Easing.cubic))}
            >
              <RecentNotesRail />
            </Animated.View>

            {nudge && (
              <Animated.View
                entering={FadeInDown.delay(380).duration(420).easing(Easing.out(Easing.cubic))}
              >
                <InsightNudge nudge={nudge} onPress={() => router.push("/(tabs)/insights")} />
              </Animated.View>
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

const useStyles = makeStyles(() => ({
  scroll: {
    paddingHorizontal: spacing.s6,
    paddingTop: spacing.s4,
    paddingBottom: 160,
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
