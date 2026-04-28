import React, { useState } from "react";
import { Alert, Modal, Pressable, ScrollView, Share, StyleSheet, Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { format, parseISO } from "date-fns";
import {
  ArrowLeft,
  Edit3,
  FileDown,
  MessageSquareText,
  RotateCw,
  Share2,
  Sparkles,
  Trash2,
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
import { useCareTeam, useProfileStore } from "@/stores/useProfileStore";
import { useRecordingsStore } from "@/stores/useRecordingsStore";
import { usePendingRecordingStore } from "@/stores/usePendingRecordingStore";
import { generateBrief } from "@/services/ai";
import { formatBriefAsHtml, formatBriefAsText, isBriefContentEmpty } from "@/utils/briefExport";
import { hapticLight, hapticMedium } from "@/services/haptics";
import { usePaywallGate } from "@/hooks/usePaywallGate";
import { BackButton } from "@/components/ui/BackButton";

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

  // Brief lookup: persisted store first, then onboarding draft store.
  // The latter only has content during onboarding (between first-brief
  // and the paywall), so the "See full brief" link from first-brief
  // resolves before commit.
  const persistedBrief = useBriefsStore((s) => s.briefs.find((b) => b.id === id));
  const pendingBrief = usePendingRecordingStore((s) =>
    s.pendingBrief?.id === id ? s.pendingBrief : null,
  );
  const brief = persistedBrief ?? pendingBrief;
  const careTeam = useCareTeam();
  const profile = useProfileStore((s) => s.personalization);
  const setClinicianIds = useBriefsStore((s) => s.setClinicianIds);
  const setTitle = useBriefsStore((s) => s.setTitle);
  const setContent = useBriefsStore((s) => s.setContent);
  const remove = useBriefsStore((s) => s.remove);
  const recordings = useRecordingsStore((s) => s.recordings);

  const [retrying, setRetrying] = useState(false);
  const [shareSheetOpen, setShareSheetOpen] = useState(false);
  const { requireEntitlement } = usePaywallGate();

  if (!brief) {
    return (
      <View style={[styles.root, { backgroundColor: colors.bgPrimary }]}>
        <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
          <View style={styles.topBar}>
            <BackButton onPress={() => router.back()} />
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

  const onShare = async () => {
    hapticLight();
    try {
      await Share.share({ message: formatBriefAsText(brief, careTeam) });
    } catch {
      // User cancelled or platform error — nothing to do.
    }
  };

  const onRegenerate = async () => {
    if (retrying) return;
    if (!requireEntitlement()) return;
    hapticMedium();
    setRetrying(true);
    try {
      const sources = recordings.filter((r) => brief.sourceRecordingIds.includes(r.id));
      if (sources.length === 0) {
        Alert.alert(
          "No notes to brief",
          "The notes that fed this brief were removed. Generate a new brief from the Briefs tab.",
        );
        return;
      }
      const taggedNow = brief.clinicianIds
        .map((cid) => careTeam.find((c) => c.id === cid))
        .filter((c): c is NonNullable<typeof c> => !!c);
      const content = await generateBrief({
        recordings: sources,
        windowLabel: brief.title ?? "Selected window",
        clinicians: taggedNow.length > 0 ? taggedNow : undefined,
        profile,
      });
      setContent(brief.id, content, brief.sourceRecordingIds);
    } catch (e) {
      Alert.alert("Couldn't regenerate", e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setRetrying(false);
    }
  };

  const onExportPdf = async () => {
    if (!requireEntitlement()) return;
    hapticLight();
    try {
      const html = formatBriefAsHtml(brief, careTeam);
      const { uri } = await Print.printToFileAsync({ html });
      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(uri, {
          mimeType: "application/pdf",
          dialogTitle: brief.title ?? "Brief",
          UTI: "com.adobe.pdf",
        });
      } else {
        Alert.alert("PDF saved", "Your phone doesn't support sharing here, but the PDF is ready.");
      }
    } catch (e) {
      Alert.alert("Couldn't export PDF", e instanceof Error ? e.message : "Something went wrong.");
    }
  };

  const tagged = brief.clinicianIds
    .map((cid) => careTeam.find((c) => c.id === cid))
    .filter((c): c is NonNullable<typeof c> => !!c);
  const empty = isBriefContentEmpty(brief);

  return (
    <View style={[styles.root, { backgroundColor: colors.bgPrimary }]}>
      <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
        <View style={styles.topBar}>
          <BackButton onPress={() => router.back()} />
          <View style={{ flex: 1 }} />
          <Pressable
            onPress={onRegenerate}
            disabled={retrying}
            hitSlop={10}
            style={[styles.iconBtn, { backgroundColor: colors.bgMuted }]}
            accessibilityRole="button"
            accessibilityLabel="Regenerate brief"
          >
            <RotateCw
              size={moderateScale(16)}
              color={retrying ? colors.textTertiary : colors.textPrimary}
              strokeWidth={2}
            />
          </Pressable>
          {!empty && (
            <Pressable
              onPress={() => {
                hapticLight();
                setShareSheetOpen(true);
              }}
              hitSlop={10}
              style={[styles.iconBtn, { backgroundColor: colors.bgMuted }]}
              accessibilityRole="button"
              accessibilityLabel="Share or export brief"
            >
              <Share2 size={moderateScale(16)} color={colors.textPrimary} strokeWidth={2} />
            </Pressable>
          )}
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

          {/* Audience tag — always-visible chips. Tap each to toggle.
              Empty selection = "Everyone." */}
          <View style={styles.tagBlock}>
            <Text style={[styles.tagLabel, { color: colors.textTertiary }]}>
              TAG WITH CLINICIAN
            </Text>
            {careTeam.length === 0 ? (
              <Text style={[styles.tagHint, { color: colors.textTertiary }]}>
                No clinicians on your care team yet — this brief is "for everyone."
              </Text>
            ) : (
              <>
                <View style={styles.chipRow}>
                  {/* Everyone chip — active when no clinicians are tagged. */}
                  <Pressable
                    onPress={() => {
                      hapticLight();
                      setClinicianIds(brief.id, []);
                    }}
                    style={[
                      styles.chip,
                      {
                        backgroundColor: tagged.length === 0 ? colors.accent + "1A" : "transparent",
                        borderColor: tagged.length === 0 ? colors.accent : colors.border,
                        borderStyle: tagged.length === 0 ? "solid" : "dashed",
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        {
                          color: tagged.length === 0 ? colors.accent : colors.textTertiary,
                        },
                      ]}
                    >
                      Everyone
                    </Text>
                  </Pressable>
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
                </View>
                <Text style={[styles.tagHint, { color: colors.textTertiary }]}>
                  Pick "Everyone" or one or more clinicians. Tap to toggle.
                </Text>
              </>
            )}
          </View>

          {/* Empty-content state — when AI returned a brief shell with
              nothing in it, surface a clear retry path instead of a
              blank page. */}
          {empty ? (
            <View
              style={[
                styles.emptyCard,
                { backgroundColor: colors.bgSurface, borderColor: colors.border },
              ]}
            >
              <View style={[styles.emptyIcon, { backgroundColor: colors.accent + "1A" }]}>
                <Sparkles size={moderateScale(20)} color={colors.accent} strokeWidth={2} />
              </View>
              <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>
                The AI didn't have enough to work with
              </Text>
              <Text style={[styles.emptySub, { color: colors.textSecondary }]}>
                {brief.sourceRecordingIds.length === 0
                  ? "This brief has no source notes. Try generating from a wider window in the Briefs tab."
                  : "Sometimes the model returns an empty brief. Try regenerating — same notes, fresh attempt."}
              </Text>
              <View style={{ marginTop: spacing.s4, gap: spacing.s2 }}>
                <Button
                  label={retrying ? "Regenerating…" : "Try again"}
                  onPress={onRegenerate}
                  haptic="medium"
                  disabled={retrying || brief.sourceRecordingIds.length === 0}
                />
                <Pressable onPress={onDelete} hitSlop={8}>
                  <View style={styles.retryRow}>
                    <RotateCw size={moderateScale(12)} color={colors.error} strokeWidth={2.2} />
                    <Text style={[styles.retryText, { color: colors.error }]}>
                      Delete this brief
                    </Text>
                  </View>
                </Pressable>
              </View>
            </View>
          ) : null}

          {/* Brief content sections — only render when there's something */}
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
                    <Text style={[styles.concernNumText, { color: colors.accent }]}>{i + 1}</Text>
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

      {/* Share / export action sheet — two clear options. PDF reads
          as a clinician-facing report; text share opens the OS share
          sheet for email / messages / copy. */}
      <Modal
        visible={shareSheetOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setShareSheetOpen(false)}
        statusBarTranslucent
      >
        <Pressable
          style={styles.sheetBackdrop}
          onPress={() => setShareSheetOpen(false)}
          accessibilityRole="button"
          accessibilityLabel="Close share menu"
        >
          <Pressable
            style={[styles.sheet, { backgroundColor: colors.bgSurface }]}
            onPress={(e) => e.stopPropagation()}
          >
            <Text style={[styles.sheetTitle, { color: colors.textPrimary }]}>Share or export</Text>
            <Text style={[styles.sheetSub, { color: colors.textSecondary }]}>
              Pick how you'd like to send this brief.
            </Text>

            <Pressable
              onPress={() => {
                setShareSheetOpen(false);
                onExportPdf();
              }}
              style={[styles.sheetRow, { borderColor: colors.border }]}
            >
              <View style={[styles.sheetIconTile, { backgroundColor: colors.accent + "1A" }]}>
                <FileDown size={moderateScale(18)} color={colors.accent} strokeWidth={2} />
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={[styles.sheetRowLabel, { color: colors.textPrimary }]}>
                  Export as PDF
                </Text>
                <Text style={[styles.sheetRowSub, { color: colors.textTertiary }]}>
                  A clinician-ready one-pager. Email it, AirDrop it, save it.
                </Text>
              </View>
            </Pressable>

            <Pressable
              onPress={() => {
                setShareSheetOpen(false);
                onShare();
              }}
              style={[styles.sheetRow, { borderColor: colors.border }]}
            >
              <View style={[styles.sheetIconTile, { backgroundColor: colors.accent + "1A" }]}>
                <MessageSquareText size={moderateScale(18)} color={colors.accent} strokeWidth={2} />
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={[styles.sheetRowLabel, { color: colors.textPrimary }]}>
                  Share as text
                </Text>
                <Text style={[styles.sheetRowSub, { color: colors.textTertiary }]}>
                  Plain text via your phone's share sheet — Messages, email, copy.
                </Text>
              </View>
            </Pressable>

            <Pressable
              onPress={() => setShareSheetOpen(false)}
              style={[styles.sheetCancel, { borderColor: colors.border }]}
              accessibilityRole="button"
              accessibilityLabel="Cancel"
            >
              <Text style={[styles.sheetCancelText, { color: colors.textSecondary }]}>Cancel</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
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
    fontSize: fontScale(11),
    letterSpacing: 1.4,
    marginTop: theme.spacing.s4,
  },
  title: {
    fontFamily: "Fraunces_500Medium",
    fontSize: fontScale(32),
    lineHeight: fontScale(38),
    letterSpacing: -0.6,
    marginTop: 4,
  },
  metaLine: {
    marginTop: theme.spacing.s2,
  },
  metaText: {
    fontFamily: "DMSans_500Medium",
    fontSize: fontScale(13),
    letterSpacing: 0.2,
  },
  tagBlock: {
    marginTop: theme.spacing.s4,
    gap: theme.spacing.s2,
  },
  tagLabel: {
    fontFamily: "DMSans_700Bold",
    fontSize: fontScale(11),
    letterSpacing: 1.4,
  },
  tagHint: {
    ...theme.typography.caption,
    fontStyle: "italic",
    fontSize: fontScale(13),
    lineHeight: fontScale(18),
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
    fontSize: fontScale(13),
  },
  section: { marginTop: theme.spacing.s5 },
  sectionLabel: {
    fontFamily: "DMSans_700Bold",
    fontSize: fontScale(11),
    letterSpacing: 1.4,
    marginBottom: theme.spacing.s2,
  },
  summary: {
    fontFamily: "Fraunces_400Regular",
    fontSize: fontScale(18),
    lineHeight: fontScale(26),
    letterSpacing: -0.1,
  },
  concernRow: {
    flexDirection: "row",
    gap: moderateScale(10),
    paddingVertical: verticalScale(8),
  },
  concernNum: {
    width: moderateScale(30),
    height: moderateScale(30),
    borderRadius: moderateScale(15),
    alignItems: "center",
    justifyContent: "center",
  },
  concernNumText: {
    fontFamily: "DMSans_700Bold",
    fontSize: fontScale(13),
  },
  concernLabel: {
    fontFamily: "DMSans_600SemiBold",
    fontSize: fontScale(16),
    lineHeight: fontScale(22),
  },
  concernDetail: {
    ...theme.typography.body,
    fontSize: fontScale(15),
    marginTop: 3,
    lineHeight: fontScale(21),
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
    fontSize: fontScale(11),
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },
  timelineLine: {
    ...theme.typography.body,
    fontSize: fontScale(15),
    marginTop: 3,
    lineHeight: fontScale(21),
  },
  bulletLine: {
    ...theme.typography.body,
    fontSize: fontScale(16),
    lineHeight: fontScale(24),
    paddingVertical: verticalScale(3),
  },
  flagRow: {
    paddingHorizontal: scale(12),
    paddingVertical: verticalScale(10),
    borderRadius: theme.radius.md,
    borderWidth: 1,
    marginVertical: verticalScale(3),
  },
  flagText: {
    ...theme.typography.body,
    fontSize: fontScale(15),
    lineHeight: fontScale(21),
  },
  footerSpace: { height: theme.spacing.s4 },
  // ── Share / export modal sheet
  sheetBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },
  sheet: {
    borderTopLeftRadius: theme.radius.xl,
    borderTopRightRadius: theme.radius.xl,
    paddingHorizontal: theme.spacing.s5,
    paddingTop: theme.spacing.s5,
    paddingBottom: theme.spacing.s8,
    gap: theme.spacing.s3,
  },
  sheetTitle: {
    fontFamily: "Fraunces_500Medium",
    fontSize: fontScale(22),
    letterSpacing: -0.3,
  },
  sheetSub: {
    ...theme.typography.body,
    fontSize: fontScale(15),
    lineHeight: fontScale(21),
    marginBottom: theme.spacing.s2,
  },
  sheetRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: moderateScale(12),
    paddingHorizontal: scale(14),
    paddingVertical: verticalScale(14),
    borderRadius: theme.radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
  },
  sheetIconTile: {
    width: moderateScale(44),
    height: moderateScale(44),
    borderRadius: moderateScale(12),
    alignItems: "center",
    justifyContent: "center",
  },
  sheetRowLabel: {
    fontFamily: "DMSans_700Bold",
    fontSize: fontScale(16),
    letterSpacing: -0.1,
  },
  sheetRowSub: {
    ...theme.typography.caption,
    fontSize: fontScale(13),
    lineHeight: fontScale(19),
    marginTop: 2,
  },
  sheetCancel: {
    alignItems: "center",
    paddingVertical: verticalScale(13),
    borderRadius: theme.radius.full,
    borderWidth: StyleSheet.hairlineWidth,
    marginTop: theme.spacing.s2,
  },
  sheetCancelText: {
    fontFamily: "DMSans_600SemiBold",
    fontSize: fontScale(14),
    letterSpacing: 0.2,
  },
  emptyCard: {
    marginTop: theme.spacing.s5,
    padding: theme.spacing.s5,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    alignItems: "flex-start",
  },
  emptyIcon: {
    width: moderateScale(44),
    height: moderateScale(44),
    borderRadius: moderateScale(12),
    alignItems: "center",
    justifyContent: "center",
    marginBottom: theme.spacing.s3,
  },
  emptyTitle: {
    fontFamily: "Fraunces_500Medium",
    fontStyle: "italic",
    fontSize: fontScale(22),
    lineHeight: fontScale(28),
  },
  emptySub: {
    ...theme.typography.body,
    fontSize: fontScale(15),
    lineHeight: fontScale(21),
    marginTop: theme.spacing.s2,
  },
  retryRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: moderateScale(6),
    paddingVertical: verticalScale(6),
  },
  retryText: {
    fontFamily: "DMSans_600SemiBold",
    fontSize: fontScale(14),
    letterSpacing: 0.2,
  },
}));

export default BriefDetail;
