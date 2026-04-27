import React, { useCallback, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { format, parseISO } from "date-fns";
import { ArrowLeft, X as XIcon } from "lucide-react-native";
import { fontScale, makeStyles, moderateScale, useTheme, verticalScale } from "../theme";
import { ReviewPhase } from "../components/recording/ReviewPhase";
import { ExtractingPhase } from "../components/recording/ExtractingPhase";
import { ExtractedPhase } from "../components/recording/ExtractedPhase";
import { useRecordingFlow } from "../components/recording/useRecordingFlow";
import { useProfileStore } from "../stores/useProfileStore";
import { useRecordingsStore } from "../stores/useRecordingsStore";
import { useAppointmentsStore } from "../stores/useAppointmentsStore";
import { uuid } from "../utils/uuid";
import { hapticHeavy, hapticLight } from "../services/haptics";
import { Phase } from "../components/recording/types";
import { useEntitlement } from "../contexts/EntitlementContext";
import { LockedView } from "../components/paywall/LockedView";

/**
 * Type-only compose surface for the in-app /record route. Voice
 * capture lives on the home long-press FAB; this screen is the
 * thoughtful-typing path.
 *
 * Three phases run left → right in the indicator: write → analyze
 * → confirm. Back from analyze/confirm returns to write with the
 * typed text intact, instead of exiting the screen — the previous
 * single-screen design treated back as "exit" which lost work.
 */
const RecordModal: React.FC = () => {
  const router = useRouter();
  const { colors } = useTheme();
  const styles = useStyles();
  const flow = useRecordingFlow();
  const insets = useSafeAreaInsets();
  // View-level gate. The home FAB pre-checks entitlement, but a user
  // can also land here via deep link or stack restoration after a
  // trial expiry — so the screen guards itself. The early return
  // happens after all hook calls below to satisfy rules-of-hooks.
  const { entitled } = useEntitlement();

  const careTeam = useProfileStore((s) => s.personalization?.careTeam ?? []);
  const recordingsCount = useRecordingsStore((s) => s.recordings.length);
  const nextAppointment = useAppointmentsStore((s) => {
    const now = Date.now();
    const upcoming = s.appointments
      .filter((a) => a.status === "upcoming" && parseISO(a.date).getTime() >= now)
      .sort((a, b) => parseISO(a.date).getTime() - parseISO(b.date).getTime());
    return upcoming[0];
  });

  const [selectedClinicians, setSelectedClinicians] = useState<string[]>([]);
  const toggleClinician = useCallback((name: string) => {
    setSelectedClinicians((prev) => {
      const norm = name.trim();
      const lower = norm.toLowerCase();
      const hit = prev.findIndex((s) => s.trim().toLowerCase() === lower);
      if (hit >= 0) return prev.filter((_, i) => i !== hit);
      return [...prev, norm];
    });
  }, []);

  const save = () => {
    if (!flow.structured || !flow.reviewText) return;
    const tags = Array.from(
      new Set(flow.structured.symptoms.slice(0, 2).filter(Boolean)),
    );
    useRecordingsStore.getState().add({
      id: uuid(),
      createdAt: new Date().toISOString(),
      durationSec: 0,
      transcript: flow.reviewText.trim(),
      structured: flow.structured,
      tags,
      ...(selectedClinicians.length > 0 ? { clinicianNames: selectedClinicians } : {}),
    });
    hapticHeavy();
    router.back();
  };

  const close = () => {
    hapticLight();
    router.back();
  };

  // The header back/close affordance behaves differently per phase:
  // on the compose surface it exits the screen, but on analyze/confirm
  // it returns to compose with the typed text preserved so the user
  // can refine before re-processing.
  const onTopBarBack = () => {
    if (flow.phase === "review") {
      close();
    } else {
      flow.goBackToReview();
    }
  };

  const mastheadDate = format(new Date(), "EEE · MMM d · yyyy").toUpperCase();
  const mastheadIssue = `NO. ${String(recordingsCount + 1).padStart(3, "0")}`;
  // Personalise the headline only when the next appointment is
  // actually linked to a Clinician on the care team — otherwise the
  // appointment's loose `doctorName` (e.g. legacy "hh") could
  // mismatch the chip row at the end of the flow.
  const linkedClinician =
    nextAppointment?.clinicianId !== undefined
      ? careTeam.find((c) => c.id === nextAppointment.clinicianId)
      : undefined;
  const headline = linkedClinician
    ? `A note for\nDr. ${lastName(linkedClinician.name)}.`
    : "Today's\nnote.";
  const subhead = linkedClinician
    ? "Whatever you write becomes structured fields ready for the visit."
    : "Whatever you write becomes structured fields for your record.";

  if (!entitled) {
    return (
      <LockedView
        title="Recording is paid"
        description="Capture new notes — voice or text — with a Sympnote subscription. Your existing notes stay readable."
      />
    );
  }

  return (
    <View style={[styles.root, { backgroundColor: colors.bgPrimary }]}>
      <View
        style={[
          styles.safe,
          { paddingTop: insets.top + verticalScale(6), paddingBottom: insets.bottom },
        ]}
      >
        <View style={styles.topBar}>
          <Pressable
            onPress={onTopBarBack}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel={flow.phase === "review" ? "Close" : "Back to compose"}
            style={[styles.backBtn, { backgroundColor: colors.bgMuted }]}
          >
            {flow.phase === "review" ? (
              <XIcon size={18} color={colors.textPrimary} strokeWidth={2} />
            ) : (
              <ArrowLeft size={18} color={colors.textPrimary} strokeWidth={2} />
            )}
          </Pressable>
          <PhaseIndicator phase={flow.phase} />
          <View style={{ width: moderateScale(32) }} />
        </View>

        {flow.phase === "review" && (
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : undefined}
            style={styles.flex}
          >
            <ScrollView
              contentContainerStyle={styles.bodyScroll}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              <ReviewPhase
                text={flow.reviewText}
                onChange={flow.setReviewText}
                onProcess={flow.processWithAI}
                onDiscard={flow.discardAndRetry}
                error={flow.reviewError}
                retryInSec={flow.retryInSec}
                mastheadDate={mastheadDate}
                mastheadIssue={mastheadIssue}
                headline={headline}
                subhead={subhead}
              />
            </ScrollView>
          </KeyboardAvoidingView>
        )}

        {flow.phase === "extracting" && (
          <ScrollView
            contentContainerStyle={styles.bodyScroll}
            showsVerticalScrollIndicator={false}
          >
            <ExtractingPhase
              structured={flow.structured}
              transcript={flow.reviewText}
              onDone={flow.setStructuredDone}
            />
          </ScrollView>
        )}

        {flow.phase === "extracted" && flow.structured && (
          <ScrollView
            contentContainerStyle={styles.bodyScroll}
            showsVerticalScrollIndicator={false}
          >
            <ExtractedPhase
              structured={flow.structured}
              onSave={save}
              careTeam={careTeam}
              selectedClinicians={selectedClinicians}
              onToggleClinician={toggleClinician}
            />
          </ScrollView>
        )}
      </View>
    </View>
  );
};

// ─── Phase indicator ──────────────────────────────────────────────────────

const STEP_ORDER: { label: string; phase: Phase }[] = [
  { label: "Write", phase: "review" },
  { label: "Analyze", phase: "extracting" },
  { label: "Confirm", phase: "extracted" },
];

const indexForPhase = (phase: Phase): number => {
  const idx = STEP_ORDER.findIndex((step) => step.phase === phase);
  return idx === -1 ? 0 : idx;
};

const PhaseIndicator: React.FC<{ phase: Phase }> = ({ phase }) => {
  const { colors } = useTheme();
  const styles = useStyles();
  const active = indexForPhase(phase);
  return (
    <View style={styles.stepperRow}>
      {STEP_ORDER.map((step, i) => {
        const isActive = i === active;
        const isPast = i < active;
        return (
          <View key={step.label} style={styles.stepperCell}>
            <View
              style={[
                styles.stepDot,
                {
                  backgroundColor: isActive
                    ? colors.accent
                    : isPast
                      ? colors.accent + "66"
                      : colors.border,
                  width: isActive ? moderateScale(20) : moderateScale(6),
                },
              ]}
            />
            {isActive && (
              <Text style={[styles.stepLabel, { color: colors.accent }]}>{step.label}</Text>
            )}
          </View>
        );
      })}
    </View>
  );
};

const lastName = (full: string): string => {
  const parts = full.trim().split(/\s+/);
  return parts[parts.length - 1] ?? full;
};

export default RecordModal;

const useStyles = makeStyles((theme) => ({
  root: { flex: 1 },
  safe: { flex: 1 },
  flex: { flex: 1 },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: theme.spacing.s6,
    paddingTop: theme.spacing.s2,
    paddingBottom: theme.spacing.s3,
    gap: moderateScale(12),
  },
  stepperRow: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: moderateScale(8),
  },
  stepperCell: {
    flexDirection: "row",
    alignItems: "center",
    gap: moderateScale(6),
  },
  stepDot: {
    height: moderateScale(6),
    borderRadius: moderateScale(3),
  },
  stepLabel: {
    fontFamily: "DMSans_700Bold",
    fontSize: fontScale(10),
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
  backBtn: {
    width: moderateScale(32),
    height: moderateScale(32),
    borderRadius: moderateScale(16),
    alignItems: "center",
    justifyContent: "center",
  },
  bodyScroll: {
    flexGrow: 1,
    paddingHorizontal: theme.spacing.s6,
    paddingBottom: theme.spacing.s6,
  },
}));
