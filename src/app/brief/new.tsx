import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { format, parseISO } from "date-fns";
import { Check, Mic, X as XIcon } from "lucide-react-native";
import {
  fontScale,
  makeStyles,
  moderateScale,
  scale,
  shadows,
  spacing,
  typography,
  useTheme,
  verticalScale,
} from "@/theme";
import { Button } from "@/components/ui/Button";
import { useBriefsStore } from "@/stores/useBriefsStore";
import { useCareTeam } from "@/stores/useProfileStore";
import { useRecordingsStore } from "@/stores/useRecordingsStore";
import { unbriefedRecordings } from "@/utils/briefSource";
import { useGenerateBrief } from "@/hooks/useGenerateBrief";
import { usePaywallGate } from "@/hooks/usePaywallGate";
import { hapticLight } from "@/services/haptics";
import type { Recording } from "@/stores/types";

type DateRange = "all" | "7d" | "30d" | "90d";

const RANGE_OPTIONS: { id: DateRange; label: string; days?: number }[] = [
  { id: "7d", label: "7 days", days: 7 },
  { id: "30d", label: "30 days", days: 30 },
  { id: "90d", label: "90 days", days: 90 },
  { id: "all", label: "All time" },
];

const DAY_MS = 86_400_000;

/**
 * The compose-a-brief screen — explicit source selection. Replaces
 * the old "tap and AI guesses" flow. The user sees every recording
 * in scope, picks which ones go in, optionally tags audience, and
 * generates. Smart default: every un-briefed note is pre-selected
 * so a user who just wants "the obvious one" can hit Generate
 * without unchecking anything.
 */
const NewBrief: React.FC = () => {
  const router = useRouter();
  const { colors } = useTheme();
  const styles = useStyles();

  const allRecordings = useRecordingsStore((s) => s.recordings);
  const allBriefs = useBriefsStore((s) => s.briefs);
  const careTeam = useCareTeam();
  const generate = useGenerateBrief();
  const { requireEntitlement } = usePaywallGate();

  const [title, setTitle] = useState("");
  const [range, setRange] = useState<DateRange>("30d");
  const [selectedClinicianIds, setSelectedClinicianIds] = useState<string[]>([]);
  const [selectedRecordingIds, setSelectedRecordingIds] = useState<Set<string>>(new Set());
  const [generating, setGenerating] = useState(false);

  // Recordings that pass the date-range filter, newest-first for the
  // list (the AI receives them oldest-first, sorted by the hook).
  const visibleRecordings = useMemo(() => {
    const opt = RANGE_OPTIONS.find((r) => r.id === range);
    const startMs = opt?.days ? Date.now() - opt.days * DAY_MS : 0;
    return [...allRecordings]
      .filter((r) => parseISO(r.createdAt).getTime() >= startMs)
      .sort((a, b) => parseISO(b.createdAt).getTime() - parseISO(a.createdAt).getTime());
  }, [allRecordings, range]);

  // Pre-select every un-briefed note in the visible window on mount /
  // when the window changes. The user can deselect; this is just a
  // helpful default that means tap-Generate works for the common case.
  useEffect(() => {
    const unbriefed = new Set(unbriefedRecordings(visibleRecordings, allBriefs).map((r) => r.id));
    setSelectedRecordingIds(unbriefed);
    // Run only when the visible set or briefs change — not on every
    // selection toggle.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visibleRecordings, allBriefs]);

  const toggleRecording = (id: string) => {
    hapticLight();
    setSelectedRecordingIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleClinician = (id: string) => {
    hapticLight();
    setSelectedClinicianIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const selectAll = () => {
    hapticLight();
    setSelectedRecordingIds(new Set(visibleRecordings.map((r) => r.id)));
  };

  const clearAll = () => {
    hapticLight();
    setSelectedRecordingIds(new Set());
  };

  const onGenerate = () => {
    if (generating) return;
    const picked = visibleRecordings.filter((r) => selectedRecordingIds.has(r.id));
    if (picked.length === 0) {
      Alert.alert("Pick at least one note", "Tap a note to include it in the brief.");
      return;
    }
    // Gate at the action moment, not on screen mount — picking notes
    // is fine without entitlement; spending an AI call isn't.
    if (!requireEntitlement()) return;
    setGenerating(true);
    const trimmedTitle = title.trim();
    generate.mutate(
      {
        recordings: picked,
        clinicianIds: selectedClinicianIds,
        title: trimmedTitle.length > 0 ? trimmedTitle : undefined,
      },
      {
        onSuccess: (brief) => {
          setGenerating(false);
          // Replace this screen with the brief detail so back from
          // detail returns to Briefs tab, not the picker.
          router.replace(`/brief/${brief.id}`);
        },
        onError: (err) => {
          setGenerating(false);
          Alert.alert(
            "Couldn't generate",
            err instanceof Error ? err.message : "Something went wrong.",
          );
        },
      },
    );
  };

  const selectedCount = selectedRecordingIds.size;
  const ctaLabel = generating
    ? "Generating…"
    : selectedCount === 0
      ? "Pick at least one note"
      : `Generate brief · ${selectedCount} ${selectedCount === 1 ? "note" : "notes"}`;

  return (
    <View style={[styles.root, { backgroundColor: colors.bgPrimary }]}>
      <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
        <View style={styles.topBar}>
          <Pressable
            onPress={() => router.back()}
            hitSlop={10}
            style={[styles.iconBtn, { backgroundColor: colors.bgMuted }]}
            accessibilityRole="button"
            accessibilityLabel="Close"
          >
            <XIcon size={moderateScale(16)} color={colors.textPrimary} strokeWidth={2} />
          </Pressable>
          <View style={{ flex: 1 }} />
        </View>

        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={styles.flex}
        >
          <ScrollView
            contentContainerStyle={styles.scroll}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
          <Text style={[styles.eyebrow, { color: colors.accent }]}>NEW BRIEF</Text>
          <Text style={[styles.title, { color: colors.textPrimary }]}>
            Pick the notes to{"\n"}synthesise.
          </Text>
          <Text style={[styles.sub, { color: colors.textSecondary }]}>
            Combine several recordings into one summary. The AI reads all picked notes and
            distils them — top concerns, patterns, questions, the lot.
          </Text>

          {/* ── Title (optional) ────────────────────────────────── */}
          <View style={styles.filterBlock}>
            <Text style={[styles.filterLabel, { color: colors.textTertiary }]}>
              TITLE · OPTIONAL
            </Text>
            <View
              style={[
                styles.titleField,
                { backgroundColor: colors.bgSurface, borderColor: colors.border },
              ]}
            >
              <TextInput
                value={title}
                onChangeText={setTitle}
                placeholder="e.g. Knee flare-up · Pre-Smith visit"
                placeholderTextColor={colors.textTertiary}
                style={[styles.titleInput, { color: colors.textPrimary }]}
                returnKeyType="done"
                maxLength={60}
                accessibilityLabel="Brief title"
              />
            </View>
          </View>

          {/* ── Date range filter ───────────────────────────────── */}
          <View style={styles.filterBlock}>
            <Text style={[styles.filterLabel, { color: colors.textTertiary }]}>RANGE</Text>
            <View style={styles.chipRow}>
              {RANGE_OPTIONS.map((r) => {
                const active = range === r.id;
                return (
                  <Pressable
                    key={r.id}
                    onPress={() => {
                      hapticLight();
                      setRange(r.id);
                    }}
                    style={[
                      styles.chip,
                      {
                        backgroundColor: active ? colors.accent + "1A" : "transparent",
                        borderColor: active ? colors.accent : colors.border,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        { color: active ? colors.accent : colors.textPrimary },
                      ]}
                    >
                      {r.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* ── Audience filter ──────────────────────────────────── */}
          {careTeam.length > 0 && (
            <View style={styles.filterBlock}>
              <Text style={[styles.filterLabel, { color: colors.textTertiary }]}>SHARE WITH</Text>
              <View style={styles.chipRow}>
                <Pressable
                  onPress={() => {
                    hapticLight();
                    setSelectedClinicianIds([]);
                  }}
                  style={[
                    styles.chip,
                    {
                      backgroundColor:
                        selectedClinicianIds.length === 0 ? colors.accent + "1A" : "transparent",
                      borderColor:
                        selectedClinicianIds.length === 0 ? colors.accent : colors.border,
                      borderStyle: selectedClinicianIds.length === 0 ? "solid" : "dashed",
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.chipText,
                      {
                        color:
                          selectedClinicianIds.length === 0
                            ? colors.accent
                            : colors.textTertiary,
                      },
                    ]}
                  >
                    Everyone
                  </Text>
                </Pressable>
                {careTeam.map((c) => {
                  const active = selectedClinicianIds.includes(c.id);
                  return (
                    <Pressable
                      key={c.id}
                      onPress={() => toggleClinician(c.id)}
                      style={[
                        styles.chip,
                        {
                          backgroundColor: active ? colors.accent + "1A" : "transparent",
                          borderColor: active ? colors.accent : colors.border,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.chipText,
                          { color: active ? colors.accent : colors.textPrimary },
                        ]}
                      >
                        {c.name}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          )}

          {/* ── Notes list ──────────────────────────────────────── */}
          <View style={styles.notesBlock}>
            <View style={styles.notesHeader}>
              <Text style={[styles.filterLabel, { color: colors.textTertiary }]}>
                NOTES · {visibleRecordings.length}
              </Text>
              <View style={styles.notesQuickActions}>
                <Pressable onPress={selectAll} hitSlop={6}>
                  <Text style={[styles.quickAction, { color: colors.accent }]}>Select all</Text>
                </Pressable>
                <Text style={[styles.quickAction, { color: colors.textTertiary }]}>·</Text>
                <Pressable onPress={clearAll} hitSlop={6}>
                  <Text style={[styles.quickAction, { color: colors.accent }]}>Clear</Text>
                </Pressable>
              </View>
            </View>

            {visibleRecordings.length === 0 ? (
              <Text style={[styles.emptyHint, { color: colors.textTertiary }]}>
                No notes in this range. Try widening the window or record something first.
              </Text>
            ) : (
              visibleRecordings.map((r) => (
                <RecordingPickerRow
                  key={r.id}
                  recording={r}
                  selected={selectedRecordingIds.has(r.id)}
                  onToggle={() => toggleRecording(r.id)}
                  colors={colors}
                  styles={styles}
                />
              ))
            )}
          </View>
          </ScrollView>

          <View style={styles.ctaArea}>
            <Button
              label={ctaLabel}
              onPress={onGenerate}
              haptic="medium"
              disabled={generating || selectedCount === 0}
            />
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
};

interface RecordingPickerRowProps {
  recording: Recording;
  selected: boolean;
  onToggle: () => void;
  colors: ReturnType<typeof useTheme>["colors"];
  styles: ReturnType<typeof useStyles>;
}

const RecordingPickerRow: React.FC<RecordingPickerRowProps> = ({
  recording,
  selected,
  onToggle,
  colors,
  styles,
}) => {
  const date = parseISO(recording.createdAt);
  const dateLabel = format(date, "MMM d · h:mm a");
  const preview = recording.transcript.trim().slice(0, 120);
  return (
    <Pressable
      onPress={onToggle}
      style={[
        styles.recordingRow,
        {
          backgroundColor: colors.bgSurface,
          borderColor: selected ? colors.accent : colors.border,
          borderWidth: selected ? 1.5 : StyleSheet.hairlineWidth,
        },
        shadows.card,
      ]}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: selected }}
      accessibilityLabel={`Note from ${dateLabel}`}
    >
      <View
        style={[
          styles.checkbox,
          {
            backgroundColor: selected ? colors.accent : "transparent",
            borderColor: selected ? colors.accent : colors.border,
          },
        ]}
      >
        {selected && <Check size={moderateScale(13)} color="#FFFFFF" strokeWidth={3} />}
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <View style={styles.recordingMeta}>
          <Mic size={moderateScale(10)} color={colors.textTertiary} strokeWidth={2.2} />
          <Text style={[styles.recordingDate, { color: colors.textTertiary }]}>
            {dateLabel}
          </Text>
        </View>
        <Text
          style={[styles.recordingPreview, { color: colors.textPrimary }]}
          numberOfLines={2}
        >
          {preview || "(empty note)"}
        </Text>
      </View>
    </Pressable>
  );
};

export default NewBrief;

const useStyles = makeStyles((theme) => ({
  root: { flex: 1 },
  safe: { flex: 1 },
  flex: { flex: 1 },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: theme.spacing.s6,
    paddingTop: theme.spacing.s2,
    paddingBottom: theme.spacing.s2,
  },
  iconBtn: {
    width: moderateScale(36),
    height: moderateScale(36),
    borderRadius: moderateScale(18),
    alignItems: "center",
    justifyContent: "center",
  },
  scroll: {
    paddingHorizontal: theme.spacing.s6,
    paddingBottom: theme.spacing.s8,
  },
  eyebrow: {
    fontFamily: "DMSans_700Bold",
    fontSize: fontScale(10),
    letterSpacing: 1.4,
    marginTop: theme.spacing.s2,
  },
  title: {
    fontFamily: "Fraunces_500Medium",
    fontStyle: "italic",
    fontSize: fontScale(28),
    lineHeight: fontScale(34),
    letterSpacing: -0.4,
    marginTop: 4,
  },
  sub: {
    ...theme.typography.body,
    fontSize: fontScale(13),
    lineHeight: fontScale(19),
    marginTop: theme.spacing.s2,
  },
  filterBlock: {
    marginTop: theme.spacing.s5,
    gap: theme.spacing.s2,
  },
  filterLabel: {
    fontFamily: "DMSans_700Bold",
    fontSize: fontScale(10),
    letterSpacing: 1.4,
  },
  titleField: {
    paddingHorizontal: scale(14),
    paddingVertical: verticalScale(10),
    borderRadius: theme.radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
  },
  titleInput: {
    fontFamily: "Fraunces_400Regular",
    fontSize: fontScale(15),
    lineHeight: fontScale(20),
    padding: 0,
    margin: 0,
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: moderateScale(8),
  },
  chip: {
    paddingHorizontal: scale(12),
    paddingVertical: verticalScale(7),
    borderRadius: theme.radius.full,
    borderWidth: 1,
  },
  chipText: {
    fontFamily: "DMSans_600SemiBold",
    fontSize: fontScale(12),
  },
  notesBlock: {
    marginTop: theme.spacing.s5,
    gap: theme.spacing.s2,
  },
  notesHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  notesQuickActions: {
    flexDirection: "row",
    gap: moderateScale(8),
    alignItems: "center",
  },
  quickAction: {
    fontFamily: "DMSans_600SemiBold",
    fontSize: fontScale(11),
    letterSpacing: 0.2,
  },
  emptyHint: {
    ...theme.typography.body,
    fontSize: fontScale(12),
    fontStyle: "italic",
    paddingVertical: theme.spacing.s4,
  },
  recordingRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: moderateScale(12),
    paddingHorizontal: moderateScale(14),
    paddingVertical: moderateScale(12),
    borderRadius: theme.radius.lg,
  },
  checkbox: {
    width: moderateScale(22),
    height: moderateScale(22),
    borderRadius: moderateScale(6),
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  recordingMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: moderateScale(5),
  },
  recordingDate: {
    fontFamily: "DMSans_600SemiBold",
    fontSize: fontScale(10),
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },
  recordingPreview: {
    fontFamily: "Fraunces_400Regular",
    fontSize: fontScale(14),
    lineHeight: fontScale(20),
    marginTop: 4,
  },
  ctaArea: {
    paddingHorizontal: theme.spacing.s6,
    paddingTop: theme.spacing.s3,
    paddingBottom: theme.spacing.s4,
  },
}));
