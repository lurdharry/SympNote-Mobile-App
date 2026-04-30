import React from "react";
import { Alert, Text, View } from "react-native";
import Animated, { useAnimatedScrollHandler, useSharedValue } from "react-native-reanimated";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  fontScale,
  makeStyles,
  moderateScale,
  spacing,
  typography,
  useTheme,
  verticalScale,
} from "../../theme";
import { SharedElementScene } from "../../components/navigation/SharedElementScene";
import { StaggeredList } from "../../components/animated/StaggeredList";
import { Button } from "../../components/ui/Button";
import { useRecordingsStore } from "../../stores/useRecordingsStore";
import { formatDate, formatTime, formatDuration } from "../../utils/date";
import { hapticLight, hapticMedium } from "../../services/haptics";
import { useTransition } from "../../components/navigation/TransitionContext";
import { RecordingTopBar } from "../../components/recording/RecordingTopBar";
import { RegenBanner } from "../../components/ui/RegenBanner";
import { useStructureTranscript } from "../../hooks/useStructureTranscript";
import { usePaywallGate } from "../../hooks/usePaywallGate";
import { showError, showInfo } from "../../components/ui/Toast";
import { findBodySystemMascot } from "../../constants/bodySystems";
import type { StructuredEntry, UrgencyLevel } from "../../stores/types";

const RecordingDetail: React.FC = () => {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { colors } = useTheme();
  const styles = useStyles();
  const recording = useRecordingsStore((s) => s.getById(id!));
  const remove = useRecordingsStore((s) => s.remove);
  const { closeScene } = useTransition();
  const { requireEntitlement } = usePaywallGate();

  // Refresh runs through the same React Query mutation that the
  // recording flow uses for the first-time structuring (see
  // useRecordingFlow / useOverlayRecording). Single source of truth
  // for in-flight state, error shapes, and quota handling.
  const structureMutation = useStructureTranscript();

  // Drives RecordingTopBar's scroll-triggered title swap. Updated on
  // the UI thread via a reanimated worklet — no JS bridge cost.
  const scrollY = useSharedValue(0);
  const onScroll = useAnimatedScrollHandler((evt) => {
    scrollY.value = evt.contentOffset.y;
  });

  const goBack = async () => {
    hapticLight();
    await closeScene();
    router.back();
  };

  if (!recording) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.bgPrimary }}>
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <Text style={[typography.body, { color: colors.textSecondary }]}>
            Recording not found.
          </Text>
          <View style={{ height: spacing.s4 }} />
          <Button label="Back" variant="secondary" onPress={() => router.back()} />
        </View>
      </SafeAreaView>
    );
  }

  const s = recording.structured;
  const title = s.symptoms[0] ?? "Entry";

  const confirmDelete = () => {
    Alert.alert("Delete recording?", "This cannot be undone.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => {
          remove(recording.id);
          router.back();
        },
      },
    ]);
  };

  const onRefresh = () => {
    if (structureMutation.isPending) return;
    if (!recording.transcript.trim()) {
      showInfo("Nothing to re-extract", {
        body: "This recording has no transcript yet.",
      });
      return;
    }
    if (!requireEntitlement()) return;
    hapticMedium();
    // Mutation upserts to the store on success — recording exists,
    // so this becomes an in-place patch of `transcript` + `structured`.
    structureMutation.mutate(
      { id: recording.id, transcript: recording.transcript },
      {
        onError: (e) => {
          showError("Couldn't re-extract", {
            body: e instanceof Error ? e.message : "Something went wrong.",
            actionLabel: "Retry",
            onAction: onRefresh,
          });
        },
      },
    );
  };

  return (
    <SharedElementScene style={{ backgroundColor: colors.bgPrimary }}>
      <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
        <RecordingTopBar
          onBack={goBack}
          onDelete={confirmDelete}
          onRefresh={onRefresh}
          refreshing={structureMutation.isPending}
          title={title}
          scrollY={scrollY}
        />

        <RegenBanner visible={structureMutation.isPending} label="Re-extracting…" />

        <Animated.ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          onScroll={onScroll}
          scrollEventThrottle={16}
        >
          <Text style={[styles.heroTitle, { color: colors.textPrimary }]}>{title}</Text>
          <Text style={[styles.heroMeta, { color: colors.textTertiary }]}>
            {formatDate(recording.createdAt)} · {formatTime(recording.createdAt)} ·{" "}
            {formatDuration(recording.durationSec)}
          </Text>

          <StaggeredList stagger={70} initialDelay={120}>
            <SeverityMeter severity={s.severity} />

            {(s.urgency || s.bodySystem) && (
              <View style={styles.pillRow}>
                {s.urgency ? <UrgencyPill urgency={s.urgency} /> : null}
                {s.bodySystem ? (
                  <Pill
                    label={s.bodySystem}
                    eyebrow="BODY SYSTEM"
                    tone="muted"
                    Mascot={findBodySystemMascot(s.bodySystem) ?? undefined}
                  />
                ) : null}
              </View>
            )}

            {s.redFlags.length > 0 && (
              <Section label="RED FLAGS">
                {s.redFlags.map((f, i) => (
                  <View
                    key={i}
                    style={[
                      styles.flagRow,
                      { backgroundColor: colors.coral + "12", borderColor: colors.coral + "55" },
                    ]}
                  >
                    <Text style={[styles.flagText, { color: colors.textPrimary }]}>{f}</Text>
                  </View>
                ))}
              </Section>
            )}

            {recording.transcript ? (
              <Section label="TRANSCRIPT">
                <View
                  style={[
                    styles.transcriptCard,
                    { backgroundColor: colors.bgSurface, borderColor: colors.border },
                  ]}
                >
                  <Text style={[styles.transcriptText, { color: colors.textPrimary }]}>
                    {recording.transcript}
                  </Text>
                </View>
              </Section>
            ) : null}

            {s.symptoms.length > 0 && (
              <Section label="SYMPTOMS">
                <Chips items={s.symptoms} tone="accent" />
              </Section>
            )}

            {s.triggers.length > 0 && (
              <Section label="TRIGGERS">
                <Chips items={s.triggers} tone="muted" />
              </Section>
            )}

            {s.relievers && s.relievers.length > 0 && (
              <Section label="RELIEVERS">
                <Chips items={s.relievers} tone="muted" />
              </Section>
            )}

            {s.medications.length > 0 && (
              <Section label="MEDICATIONS">
                <Chips items={s.medications} tone="muted" />
              </Section>
            )}

            {(s.location || s.duration) && (
              <View style={styles.factGrid}>
                {s.location ? <Fact label="LOCATION" value={s.location} /> : null}
                {s.duration ? <Fact label="DURATION" value={s.duration} /> : null}
              </View>
            )}

            {s.notes ? (
              <Section label="NOTES">
                <View
                  style={[
                    styles.notesCard,
                    { backgroundColor: colors.bgSurface, borderColor: colors.border },
                  ]}
                >
                  <Text style={[styles.notesText, { color: colors.textPrimary }]}>{s.notes}</Text>
                </View>
              </Section>
            ) : null}

            {recording.tags.length > 0 && (
              <Section label="TAGS">
                <Chips items={recording.tags} tone="muted" small />
              </Section>
            )}
          </StaggeredList>
        </Animated.ScrollView>
      </SafeAreaView>
    </SharedElementScene>
  );
};

interface SectionProps {
  label: string;
  children: React.ReactNode;
}

const Section: React.FC<SectionProps> = ({ label, children }) => {
  const { colors } = useTheme();
  const styles = useStyles();
  return (
    <View style={styles.section}>
      <Text style={[styles.sectionLabel, { color: colors.textTertiary }]}>{label}</Text>
      {children}
    </View>
  );
};

// Smooth intensity ramp. Each filled segment of the meter gets its
// own color computed by interpolating between five theme stops:
// success (calm) → gold → warning → coral → error (peak). The ramp
// pulls real palette tokens so it adapts cleanly to dark mode.
const hexToRgb = (hex: string): [number, number, number] => {
  const h = hex.replace("#", "");
  return [
    parseInt(h.substring(0, 2), 16),
    parseInt(h.substring(2, 4), 16),
    parseInt(h.substring(4, 6), 16),
  ];
};

const rgbToHex = ([r, g, b]: [number, number, number]): string => {
  const to = (n: number) => Math.round(n).toString(16).padStart(2, "0");
  return `#${to(r)}${to(g)}${to(b)}`;
};

const lerpColor = (c1: string, c2: string, t: number): string => {
  const [r1, g1, b1] = hexToRgb(c1);
  const [r2, g2, b2] = hexToRgb(c2);
  return rgbToHex([r1 + (r2 - r1) * t, g1 + (g2 - g1) * t, b1 + (b2 - b1) * t]);
};

interface SeverityPalette {
  success: string;
  gold: string;
  warning: string;
  coral: string;
  error: string;
}

const severityColor = (level: number, p: SeverityPalette): string => {
  const stops = [p.success, p.gold, p.warning, p.coral, p.error];
  const clamped = Math.max(1, Math.min(10, level));
  const span = 9 / (stops.length - 1);
  const idx = (clamped - 1) / span;
  const lower = Math.floor(idx);
  const upper = Math.min(lower + 1, stops.length - 1);
  return lerpColor(stops[lower]!, stops[upper]!, idx - lower);
};

const SeverityMeter: React.FC<{ severity: StructuredEntry["severity"] }> = ({ severity }) => {
  const { colors } = useTheme();
  const styles = useStyles();
  const palette: SeverityPalette = {
    success: colors.success,
    gold: colors.gold,
    warning: colors.warning,
    coral: colors.coral,
    error: colors.error,
  };
  // Number text uses the color of the *peak* segment so the value
  // and the meter's hottest end agree visually.
  const numberColor = severity > 0 ? severityColor(severity, palette) : colors.textTertiary;
  return (
    <View style={styles.section}>
      <View style={styles.severityHead}>
        <Text style={[styles.sectionLabel, { color: colors.textTertiary }]}>SEVERITY</Text>
        <Text style={[styles.severityNumber, { color: numberColor }]}>
          {severity}
          <Text style={[styles.severityNumberSuffix, { color: colors.textTertiary }]}> / 10</Text>
        </Text>
      </View>
      <View style={styles.severityMeter}>
        {Array.from({ length: 10 }).map((_, i) => {
          const filled = i < severity;
          return (
            <View
              key={i}
              style={[
                styles.severitySeg,
                {
                  backgroundColor: filled ? severityColor(i + 1, palette) : colors.bgMuted,
                },
              ]}
            />
          );
        })}
      </View>
    </View>
  );
};

const URGENCY_LABELS: Record<UrgencyLevel, string> = {
  routine: "Routine",
  "follow-up": "Follow-up",
  soon: "Soon",
  urgent: "Urgent",
};

const UrgencyPill: React.FC<{ urgency: UrgencyLevel }> = ({ urgency }) => {
  const { colors } = useTheme();
  const tone = urgency === "urgent" ? colors.error : urgency === "soon" ? colors.accent : null;
  return (
    <Pill
      label={URGENCY_LABELS[urgency]}
      eyebrow="URGENCY"
      tone={tone ? "accentColor" : "muted"}
      accentColor={tone ?? undefined}
    />
  );
};

interface PillProps {
  label: string;
  eyebrow: string;
  tone: "muted" | "accentColor";
  accentColor?: string;
  /** Optional inline mascot rendered to the left of the eyebrow + value
   *  stack. Keeps the pill's silhouette consistent whether or not a
   *  mascot is available for a given body system / urgency. */
  Mascot?: React.FC<{ size?: number }>;
}

const Pill: React.FC<PillProps> = ({ label, eyebrow, tone, accentColor, Mascot }) => {
  const { colors } = useTheme();
  const styles = useStyles();
  const bg = tone === "accentColor" && accentColor ? accentColor + "16" : colors.bgSurface;
  const border = tone === "accentColor" && accentColor ? accentColor + "55" : colors.border;
  const valueColor = tone === "accentColor" && accentColor ? accentColor : colors.textPrimary;
  return (
    <View style={[styles.pill, { backgroundColor: bg, borderColor: border }]}>
      {Mascot ? (
        <View style={styles.pillMascot}>
          <Mascot size={moderateScale(40)} />
        </View>
      ) : null}
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={[styles.pillEyebrow, { color: colors.textTertiary }]}>{eyebrow}</Text>
        <Text style={[styles.pillValue, { color: valueColor }]} numberOfLines={1}>
          {label}
        </Text>
      </View>
    </View>
  );
};

interface FactProps {
  label: string;
  value: string;
}

const Fact: React.FC<FactProps> = ({ label, value }) => {
  const { colors } = useTheme();
  const styles = useStyles();
  return (
    <View
      style={[styles.factCell, { backgroundColor: colors.bgSurface, borderColor: colors.border }]}
    >
      <Text style={[styles.factLabel, { color: colors.textTertiary }]}>{label}</Text>
      <Text style={[styles.factValue, { color: colors.textPrimary }]}>{value}</Text>
    </View>
  );
};

interface ChipsProps {
  items: string[];
  tone: "muted" | "accent";
  small?: boolean;
}

const Chips: React.FC<ChipsProps> = ({ items, tone, small }) => {
  const { colors } = useTheme();
  const styles = useStyles();
  const bg = tone === "accent" ? colors.accent + "1A" : colors.bgSurface;
  const border = tone === "accent" ? colors.accent + "44" : colors.border;
  const textColor = tone === "accent" ? colors.accent : colors.textPrimary;
  return (
    <View style={styles.chipRow}>
      {items.map((i) => (
        <View
          key={i}
          style={[
            small ? styles.chipSmall : styles.chip,
            { backgroundColor: bg, borderColor: border },
          ]}
        >
          <Text style={[small ? styles.chipSmallText : styles.chipText, { color: textColor }]}>
            {i}
          </Text>
        </View>
      ))}
    </View>
  );
};

export default RecordingDetail;

const useStyles = makeStyles((theme) => ({
  content: {
    paddingHorizontal: theme.spacing.s6,
    paddingBottom: theme.spacing.s12,
  },
  heroTitle: {
    fontFamily: "Fraunces_500Medium",
    fontSize: fontScale(30),
    lineHeight: fontScale(36),
    letterSpacing: -0.6,
    textTransform: "capitalize",
  },
  heroMeta: {
    fontFamily: "DMSans_500Medium",
    fontSize: fontScale(13),
    letterSpacing: 0.2,
    marginTop: 4,
  },
  section: {
    marginTop: theme.spacing.s5,
  },
  sectionLabel: {
    fontFamily: "DMSans_700Bold",
    fontSize: fontScale(11),
    letterSpacing: 1.4,
    marginBottom: theme.spacing.s2,
  },

  // Severity
  severityHead: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "space-between",
  },
  severityNumber: {
    fontFamily: "Fraunces_500Medium",
    fontSize: fontScale(22),
    letterSpacing: -0.4,
  },
  severityNumberSuffix: {
    fontFamily: "DMSans_500Medium",
    fontSize: fontScale(13),
    letterSpacing: 0.2,
  },
  severityMeter: {
    flexDirection: "row",
    gap: moderateScale(4),
    marginTop: theme.spacing.s2,
  },
  severitySeg: {
    flex: 1,
    height: verticalScale(6),
    borderRadius: 999,
  },

  // Pill row (urgency + body system)
  pillRow: {
    flexDirection: "row",
    gap: moderateScale(10),
    marginTop: theme.spacing.s4,
  },
  pill: {
    flex: 1,
    minWidth: 0,
    flexDirection: "row",
    alignItems: "center",
    gap: moderateScale(8),
    paddingHorizontal: moderateScale(12),
    paddingVertical: verticalScale(10),
    borderRadius: theme.radius.md,
    borderWidth: 1,
  },
  pillMascot: {
    width: moderateScale(40),
    height: moderateScale(40),
    alignItems: "center",
    justifyContent: "center",
  },
  pillEyebrow: {
    fontFamily: "DMSans_700Bold",
    fontSize: fontScale(10),
    letterSpacing: 1.2,
  },
  pillValue: {
    fontFamily: "DMSans_600SemiBold",
    fontSize: fontScale(15),
    marginTop: 2,
    textTransform: "capitalize",
  },

  // Flags
  flagRow: {
    paddingHorizontal: moderateScale(12),
    paddingVertical: verticalScale(10),
    borderRadius: theme.radius.md,
    borderWidth: 1,
    marginVertical: verticalScale(3),
  },
  flagText: {
    ...typography.body,
    fontSize: fontScale(15),
    lineHeight: fontScale(21),
  },

  // Transcript
  transcriptCard: {
    padding: moderateScale(14),
    borderRadius: theme.radius.lg,
    borderWidth: 1,
  },
  transcriptText: {
    fontFamily: "Fraunces_400Regular",
    fontSize: fontScale(16),
    lineHeight: fontScale(24),
    letterSpacing: -0.1,
  },

  // Notes
  notesCard: {
    padding: moderateScale(14),
    borderRadius: theme.radius.md,
    borderWidth: 1,
  },
  notesText: {
    ...typography.body,
    fontSize: fontScale(15),
    lineHeight: fontScale(22),
  },

  // Chips
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: moderateScale(6),
  },
  chip: {
    paddingHorizontal: moderateScale(12),
    paddingVertical: verticalScale(7),
    borderRadius: 999,
    borderWidth: 1,
  },
  chipText: {
    fontFamily: "DMSans_600SemiBold",
    fontSize: fontScale(13),
    letterSpacing: 0.1,
  },
  chipSmall: {
    paddingHorizontal: moderateScale(9),
    paddingVertical: verticalScale(4),
    borderRadius: 999,
    borderWidth: 1,
  },
  chipSmallText: {
    fontFamily: "DMSans_500Medium",
    fontSize: fontScale(11),
    letterSpacing: 0.2,
  },

  // Fact grid (location + duration)
  factGrid: {
    flexDirection: "row",
    gap: moderateScale(10),
    marginTop: theme.spacing.s4,
  },
  factCell: {
    flex: 1,
    minWidth: 0,
    padding: moderateScale(12),
    borderRadius: theme.radius.md,
    borderWidth: 1,
  },
  factLabel: {
    fontFamily: "DMSans_700Bold",
    fontSize: fontScale(10),
    letterSpacing: 1.2,
  },
  factValue: {
    fontFamily: "DMSans_600SemiBold",
    fontSize: fontScale(15),
    marginTop: 4,
  },
}));
