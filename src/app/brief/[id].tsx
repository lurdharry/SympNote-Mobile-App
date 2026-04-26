import React, { useMemo, useState } from "react";
import { Alert, Pressable, ScrollView, Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { format, parseISO } from "date-fns";
import {
  ArrowLeft,
  Edit3,
  Trash2,
  Users,
} from "lucide-react-native";
import {
  fontScale,
  makeStyles,
  moderateScale,
  scale,
  spacing,
  typography,
  useTheme,
  verticalScale,
} from "@/theme";
import { Button } from "@/components/ui/Button";
import { useBriefsStore } from "@/stores/useBriefsStore";
import { useProfileStore } from "@/stores/useProfileStore";
import { hapticLight } from "@/services/haptics";

/**
 * Brief detail screen — the canonical "view this synthesised
 * snapshot" surface. Renders all sections of the brief content,
 * shows audience tag chips (clinicians), allows editing the title,
 * tag set, and deleting.
 *
 * The brief itself is immutable in spirit — we don't expose a
 * "regenerate this brief in place" affordance. Users who want a
 * fresh brief generate a new one (so the old one stays as history).
 */
const BriefDetail: React.FC = () => {
  const router = useRouter();
  const { colors } = useTheme();
  const styles = useStyles();
  const { id } = useLocalSearchParams<{ id: string }>();

  const brief = useBriefsStore((s) => s.briefs.find((b) => b.id === id));
  const careTeam = useProfileStore((s) => s.personalization?.careTeam ?? []);
  const setClinicianIds = useBriefsStore((s) => s.setClinicianIds);
  const setTitle = useBriefsStore((s) => s.setTitle);
  const remove = useBriefsStore((s) => s.remove);

  const tagged = useMemo(
    () =>
      brief
        ? brief.clinicianIds
            .map((cid) => careTeam.find((c) => c.id === cid))
            .filter((c): c is NonNullable<typeof c> => !!c)
        : [],
    [brief, careTeam],
  );

  const [tagSheetOpen, setTagSheetOpen] = useState(false);

  if (!brief) {
    return (
      <View style={[styles.root, { backgroundColor: colors.bgPrimary }]}>
        <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
          <View style={styles.topBar}>
            <BackBtn onPress={() => router.back()} />
          </View>
          <View style={styles.gone}>
            <Text style={[typography.h2, { color: colors.textPrimary, textAlign: "center" }]}>
              Brief not found
            </Text>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  const generatedDate = format(parseISO(brief.generatedAt), "MMM d, yyyy · h:mm a");
  const windowStart = format(parseISO(brief.windowStart), "MMM d");
  const windowEnd = format(parseISO(brief.windowEnd), "MMM d");

  const onDelete = () => {
    Alert.alert("Delete this brief?", "It will be removed from your library.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => {
          remove(brief.id);
          router.back();
        },
      },
    ]);
  };

  const onRenameTitle = () => {
    Alert.prompt?.(
      "Rename brief",
      "Give this brief a label that's easy to find later.",
      (next) => {
        const trimmed = (next ?? "").trim();
        if (trimmed) setTitle(brief.id, trimmed);
      },
      "plain-text",
      brief.title ?? "",
    );
  };

  const toggleTag = (clinicianId: string) => {
    const next = brief.clinicianIds.includes(clinicianId)
      ? brief.clinicianIds.filter((id) => id !== clinicianId)
      : [...brief.clinicianIds, clinicianId];
    setClinicianIds(brief.id, next);
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.bgPrimary }]}>
      <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
        <View style={styles.topBar}>
          <BackBtn onPress={() => router.back()} />
          <View style={{ flex: 1 }} />
          <Pressable
            onPress={() => {
              hapticLight();
              onRenameTitle();
            }}
            hitSlop={10}
            style={[styles.iconBtn, { backgroundColor: colors.bgMuted }]}
            accessibilityRole="button"
            accessibilityLabel="Rename brief"
          >
            <Edit3 size={moderateScale(16)} color={colors.textPrimary} strokeWidth={2} />
          </Pressable>
          <Pressable
            onPress={onDelete}
            hitSlop={10}
            style={[styles.iconBtn, { backgroundColor: colors.bgMuted }]}
            accessibilityRole="button"
            accessibilityLabel="Delete brief"
          >
            <Trash2 size={moderateScale(16)} color={colors.error} strokeWidth={2} />
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <Text style={[styles.eyebrow, { color: colors.accent }]}>
            BRIEF · {windowStart === windowEnd ? windowStart : `${windowStart} – ${windowEnd}`}
          </Text>
          <Text style={[styles.title, { color: colors.textPrimary }]}>
            {brief.title ?? "Brief"}
          </Text>

          <View style={styles.metaLine}>
            <Text style={[styles.metaText, { color: colors.textTertiary }]}>
              Generated {generatedDate} · {brief.sourceRecordingIds.length} notes
            </Text>
          </View>

          {/* Audience tag row — multi-select, "Everyone" when empty. */}
          <Pressable
            onPress={() => {
              hapticLight();
              setTagSheetOpen((v) => !v);
            }}
            style={[
              styles.tagRow,
              { backgroundColor: colors.bgSurface, borderColor: colors.border },
            ]}
            accessibilityRole="button"
            accessibilityLabel="Edit audience tags"
          >
            <Users size={moderateScale(13)} color={colors.textSecondary} strokeWidth={2} />
            <Text style={[styles.tagLabel, { color: colors.textSecondary }]}>SHARE WITH</Text>
            <View style={{ flex: 1 }} />
            <Text style={[styles.tagValue, { color: colors.textPrimary }]}>
              {tagged.length === 0
                ? "Everyone"
                : tagged.length <= 2
                  ? tagged.map((c) => c.name).join(" · ")
                  : `${tagged.length} clinicians`}
            </Text>
          </Pressable>

          {tagSheetOpen && (
            <View style={[styles.tagSheet, { backgroundColor: colors.bgSurface }]}>
              <Text style={[styles.tagSheetHint, { color: colors.textTertiary }]}>
                Pick none for "Everyone." Pick one or more to scope this brief to specific
                clinicians.
              </Text>
              <View style={styles.chipRow}>
                {careTeam.map((c) => {
                  const active = brief.clinicianIds.includes(c.id);
                  return (
                    <Pressable
                      key={c.id}
                      onPress={() => {
                        hapticLight();
                        toggleTag(c.id);
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
                        {c.name}
                      </Text>
                    </Pressable>
                  );
                })}
                {careTeam.length === 0 && (
                  <Text style={[styles.tagSheetHint, { color: colors.textTertiary }]}>
                    No clinicians on your care team yet.
                  </Text>
                )}
              </View>
            </View>
          )}

          {/* Brief content sections */}
          {brief.content.summary ? (
            <Section label="SUMMARY" colors={colors} styles={styles}>
              <Text style={[styles.summary, { color: colors.textPrimary }]}>
                {brief.content.summary}
              </Text>
            </Section>
          ) : null}

          {brief.content.topConcerns.length > 0 && (
            <Section label="TOP CONCERNS" colors={colors} styles={styles}>
              {brief.content.topConcerns.map((c, i) => (
                <View key={i} style={styles.concernRow}>
                  <View style={[styles.concernNum, { backgroundColor: colors.accent + "1A" }]}>
                    <Text style={[styles.concernNumText, { color: colors.accent }]}>
                      {i + 1}
                    </Text>
                  </View>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text style={[styles.concernLabel, { color: colors.textPrimary }]}>
                      {c.label}
                    </Text>
                    <Text style={[styles.concernDetail, { color: colors.textSecondary }]}>
                      {c.detail}
                    </Text>
                  </View>
                </View>
              ))}
            </Section>
          )}

          {brief.content.timeline.length > 0 && (
            <Section label="TIMELINE" colors={colors} styles={styles}>
              {brief.content.timeline.map((t, i) => (
                <View key={i} style={styles.timelineRow}>
                  <View style={[styles.timelineDot, { backgroundColor: colors.accent }]} />
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text style={[styles.timelineDate, { color: colors.textTertiary }]}>
                      {t.date}
                    </Text>
                    <Text style={[styles.timelineLine, { color: colors.textPrimary }]}>
                      {t.line}
                    </Text>
                  </View>
                </View>
              ))}
            </Section>
          )}

          {brief.content.patterns.length > 0 && (
            <Section label="PATTERNS" colors={colors} styles={styles}>
              {brief.content.patterns.map((p, i) => (
                <Text key={i} style={[styles.bulletLine, { color: colors.textPrimary }]}>
                  · {p}
                </Text>
              ))}
            </Section>
          )}

          {brief.content.medications.length > 0 && (
            <Section label="MEDICATIONS" colors={colors} styles={styles}>
              {brief.content.medications.map((m, i) => (
                <Text key={i} style={[styles.bulletLine, { color: colors.textPrimary }]}>
                  · {m}
                </Text>
              ))}
            </Section>
          )}

          {brief.content.questions.length > 0 && (
            <Section label="QUESTIONS TO ASK" colors={colors} styles={styles}>
              {brief.content.questions.map((q, i) => (
                <Text key={i} style={[styles.bulletLine, { color: colors.textPrimary }]}>
                  · {q}
                </Text>
              ))}
            </Section>
          )}

          {brief.content.flags.length > 0 && (
            <Section label="FLAGS" colors={colors} styles={styles}>
              {brief.content.flags.map((f, i) => (
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

          <View style={styles.footerSpace} />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
};

const BackBtn: React.FC<{ onPress: () => void }> = ({ onPress }) => {
  const { colors } = useTheme();
  const styles = useStyles();
  return (
    <Pressable
      onPress={onPress}
      hitSlop={10}
      style={[styles.iconBtn, { backgroundColor: colors.bgMuted }]}
      accessibilityRole="button"
      accessibilityLabel="Back"
    >
      <ArrowLeft size={moderateScale(16)} color={colors.textPrimary} strokeWidth={2} />
    </Pressable>
  );
};

interface SectionProps {
  label: string;
  children: React.ReactNode;
  colors: ReturnType<typeof useTheme>["colors"];
  styles: ReturnType<typeof useStyles>;
}
const Section: React.FC<SectionProps> = ({ label, children, colors, styles }) => (
  <View style={styles.section}>
    <Text style={[styles.sectionLabel, { color: colors.textTertiary }]}>{label}</Text>
    {children}
  </View>
);

const useStyles = makeStyles((theme) => ({
  root: { flex: 1 },
  safe: { flex: 1 },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: theme.spacing.s6,
    paddingTop: theme.spacing.s2,
    paddingBottom: theme.spacing.s2,
    gap: moderateScale(10),
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
  gone: { flex: 1, alignItems: "center", justifyContent: "center" },
  eyebrow: {
    fontFamily: "DMSans_700Bold",
    fontSize: fontScale(10),
    letterSpacing: 1.4,
    marginTop: theme.spacing.s4,
  },
  title: {
    fontFamily: "Fraunces_500Medium",
    fontSize: fontScale(30),
    lineHeight: fontScale(36),
    letterSpacing: -0.6,
    marginTop: 4,
  },
  metaLine: {
    marginTop: theme.spacing.s2,
  },
  metaText: {
    fontFamily: "DMSans_500Medium",
    fontSize: fontScale(11),
    letterSpacing: 0.2,
  },
  tagRow: {
    marginTop: theme.spacing.s4,
    flexDirection: "row",
    alignItems: "center",
    gap: moderateScale(8),
    paddingHorizontal: scale(14),
    paddingVertical: verticalScale(11),
    borderRadius: theme.radius.lg,
    borderWidth: 1,
  },
  tagLabel: {
    fontFamily: "DMSans_700Bold",
    fontSize: fontScale(10),
    letterSpacing: 1.2,
  },
  tagValue: {
    fontFamily: "DMSans_600SemiBold",
    fontSize: fontScale(13),
    letterSpacing: 0.1,
  },
  tagSheet: {
    marginTop: theme.spacing.s2,
    padding: theme.spacing.s4,
    borderRadius: theme.radius.lg,
    gap: theme.spacing.s2,
  },
  tagSheetHint: {
    ...theme.typography.caption,
    fontStyle: "italic",
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
  section: { marginTop: theme.spacing.s5 },
  sectionLabel: {
    fontFamily: "DMSans_700Bold",
    fontSize: fontScale(10),
    letterSpacing: 1.4,
    marginBottom: theme.spacing.s2,
  },
  summary: {
    fontFamily: "Fraunces_400Regular",
    fontSize: fontScale(16),
    lineHeight: fontScale(24),
    letterSpacing: -0.1,
  },
  concernRow: {
    flexDirection: "row",
    gap: moderateScale(10),
    paddingVertical: verticalScale(8),
  },
  concernNum: {
    width: moderateScale(28),
    height: moderateScale(28),
    borderRadius: moderateScale(14),
    alignItems: "center",
    justifyContent: "center",
  },
  concernNumText: {
    fontFamily: "DMSans_700Bold",
    fontSize: fontScale(12),
  },
  concernLabel: {
    fontFamily: "DMSans_600SemiBold",
    fontSize: fontScale(15),
    lineHeight: fontScale(20),
  },
  concernDetail: {
    ...theme.typography.body,
    fontSize: fontScale(13),
    marginTop: 2,
    lineHeight: fontScale(19),
  },
  timelineRow: {
    flexDirection: "row",
    gap: moderateScale(10),
    paddingVertical: verticalScale(6),
  },
  timelineDot: {
    width: moderateScale(7),
    height: moderateScale(7),
    borderRadius: moderateScale(4),
    marginTop: verticalScale(7),
  },
  timelineDate: {
    fontFamily: "DMSans_600SemiBold",
    fontSize: fontScale(10),
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },
  timelineLine: {
    ...theme.typography.body,
    fontSize: fontScale(13),
    marginTop: 2,
    lineHeight: fontScale(19),
  },
  bulletLine: {
    ...theme.typography.body,
    fontSize: fontScale(14),
    lineHeight: fontScale(22),
    paddingVertical: verticalScale(2),
  },
  flagRow: {
    paddingHorizontal: scale(12),
    paddingVertical: verticalScale(8),
    borderRadius: theme.radius.md,
    borderWidth: 1,
    marginVertical: verticalScale(3),
  },
  flagText: {
    ...theme.typography.body,
    fontSize: fontScale(13),
    lineHeight: fontScale(19),
  },
  footerSpace: { height: theme.spacing.s4 },
}));

export default BriefDetail;
