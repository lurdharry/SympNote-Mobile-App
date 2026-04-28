import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { parseISO } from "date-fns";
import { X as XIcon } from "lucide-react-native";
import {
  fontScale,
  makeStyles,
  moderateScale,
  typography,
  useTheme,
} from "@/theme";
import { Button } from "@/components/ui/Button";
import { TitleField } from "@/components/brief/new/TitleField";
import { RangeChips, RANGE_OPTIONS, type DateRange } from "@/components/brief/new/RangeChips";
import { AudienceChips } from "@/components/brief/new/AudienceChips";
import { NotesPicker } from "@/components/brief/new/NotesPicker";
import { useBriefsStore } from "@/stores/useBriefsStore";
import { useCareTeam } from "@/stores/useProfileStore";
import { useRecordingsStore } from "@/stores/useRecordingsStore";
import { unbriefedRecordings } from "@/utils/briefSource";
import { useGenerateBrief } from "@/hooks/useGenerateBrief";
import { usePaywallGate } from "@/hooks/usePaywallGate";
import { hapticLight } from "@/services/haptics";

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

            <TitleField value={title} onChange={setTitle} />
            <RangeChips value={range} onChange={setRange} />
            <AudienceChips
              careTeam={careTeam}
              selected={selectedClinicianIds}
              onChange={setSelectedClinicianIds}
            />
            <NotesPicker
              recordings={visibleRecordings}
              selected={selectedRecordingIds}
              onToggle={toggleRecording}
              onSelectAll={selectAll}
              onClear={clearAll}
            />
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
    ...typography.body,
    fontSize: fontScale(13),
    lineHeight: fontScale(19),
    marginTop: theme.spacing.s2,
  },
  ctaArea: {
    paddingHorizontal: theme.spacing.s6,
    paddingTop: theme.spacing.s3,
    paddingBottom: theme.spacing.s4,
  },
}));
