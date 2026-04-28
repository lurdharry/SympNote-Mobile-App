import React, { useState } from "react";
import { Alert, ScrollView, Share, Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { makeStyles, typography, useTheme } from "@/theme";
import { BackButton } from "@/components/ui/BackButton";
import { BriefTopBar } from "@/components/brief/BriefTopBar";
import { BriefMasthead } from "@/components/brief/BriefMasthead";
import { BriefAudienceTags } from "@/components/brief/BriefAudienceTags";
import { BriefSections } from "@/components/brief/BriefSections";
import { BriefEmptyState } from "@/components/brief/BriefEmptyState";
import { BriefShareSheet } from "@/components/brief/BriefShareSheet";
import { useBriefsStore } from "@/stores/useBriefsStore";
import { useCareTeam, useProfileStore } from "@/stores/useProfileStore";
import { useRecordingsStore } from "@/stores/useRecordingsStore";
import { usePendingRecordingStore } from "@/stores/usePendingRecordingStore";
import { generateBrief } from "@/services/ai";
import { formatBriefAsHtml, formatBriefAsText, isBriefContentEmpty } from "@/utils/briefExport";
import { hapticLight, hapticMedium } from "@/services/haptics";
import { usePaywallGate } from "@/hooks/usePaywallGate";

/**
 * Brief detail screen — the orchestrator. State + side-effects live
 * here; layout is composed from focused children:
 *
 *   BriefTopBar       — back / regen / share / rename / delete
 *   BriefMasthead     — eyebrow + title + meta
 *   BriefAudienceTags — TAG WITH CLINICIAN block
 *   BriefEmptyState   — recovery card when AI returned nothing
 *   BriefSections     — summary, top concerns, timeline, etc.
 *   BriefShareSheet   — modal: export PDF / share text / cancel
 */
const BriefDetail: React.FC = () => {
  const router = useRouter();
  const { colors } = useTheme();
  const styles = useStyles();
  const { id } = useLocalSearchParams<{ id: string }>();

  // Brief lookup: persisted store first, then onboarding draft store.
  // The latter only has content during onboarding (between
  // first-brief and the paywall), so the "See full brief" link from
  // first-brief resolves before commit.
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
          <View style={styles.topBarBare}>
            <BackButton onPress={() => router.back()} type="contained" />
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

  const onShareText = async () => {
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
      Alert.alert(
        "Couldn't regenerate",
        e instanceof Error ? e.message : "Something went wrong.",
      );
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
        Alert.alert(
          "PDF saved",
          "Your phone doesn't support sharing here, but the PDF is ready.",
        );
      }
    } catch (e) {
      Alert.alert(
        "Couldn't export PDF",
        e instanceof Error ? e.message : "Something went wrong.",
      );
    }
  };

  const empty = isBriefContentEmpty(brief);

  return (
    <View style={[styles.root, { backgroundColor: colors.bgPrimary }]}>
      <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
        <BriefTopBar
          onBack={() => router.back()}
          onRegenerate={onRegenerate}
          onShare={() => setShareSheetOpen(true)}
          onRename={onRenameTitle}
          onDelete={onDelete}
          showShare={!empty}
          retrying={retrying}
        />

        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <BriefMasthead brief={brief} />

          <BriefAudienceTags
            brief={brief}
            careTeam={careTeam}
            onSetClinicianIds={(ids) => setClinicianIds(brief.id, ids)}
          />

          {empty ? (
            <BriefEmptyState
              brief={brief}
              retrying={retrying}
              onRegenerate={onRegenerate}
              onDelete={onDelete}
            />
          ) : (
            <BriefSections content={brief.content} />
          )}

          <View style={styles.footerSpace} />
        </ScrollView>
      </SafeAreaView>

      <BriefShareSheet
        visible={shareSheetOpen}
        onClose={() => setShareSheetOpen(false)}
        onExportPdf={onExportPdf}
        onShareText={onShareText}
      />
    </View>
  );
};

export default BriefDetail;

const useStyles = makeStyles((theme) => ({
  root: { flex: 1 },
  safe: { flex: 1 },
  topBarBare: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: theme.spacing.s6,
    paddingTop: theme.spacing.s2,
    paddingBottom: theme.spacing.s2,
  },
  scroll: {
    paddingHorizontal: theme.spacing.s6,
    paddingBottom: theme.spacing.s8,
  },
  gone: { flex: 1, alignItems: "center", justifyContent: "center" },
  footerSpace: { height: theme.spacing.s4 },
}));
