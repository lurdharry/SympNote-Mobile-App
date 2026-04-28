import React from "react";
import { Alert, Pressable, ScrollView, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Plus, Sparkles } from "lucide-react-native";
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
import { SceneTransition } from "@/components/navigation/SceneTransition";
import { BriefListRow } from "@/components/briefs/BriefListRow";
import { BriefsEmpty } from "@/components/briefs/BriefsEmpty";
import { useBriefsStore } from "@/stores/useBriefsStore";
import { useCareTeam } from "@/stores/useProfileStore";
import { useRecordingsStore } from "@/stores/useRecordingsStore";
import { unbriefedRecordings } from "@/utils/briefSource";
import { hapticLight } from "@/services/haptics";

/**
 * Briefs tab — chronological list of every brief the user has
 * generated. Each row carries the brief's window, audience tag, and
 * source-note count. Tap → detail screen.
 *
 * The header `+` is the primary "Generate" CTA. It runs the
 * "since my last brief" default flow so the user gets a brief in
 * one tap.
 */
const TabBriefs: React.FC = () => {
  const router = useRouter();
  const { colors } = useTheme();
  const styles = useStyles();

  const briefs = useBriefsStore((s) => s.briefs);
  const careTeam = useCareTeam();
  const recordings = useRecordingsStore((s) => s.recordings);
  const unbriefed = unbriefedRecordings(recordings, briefs);

  const onGenerate = () => {
    if (recordings.length === 0) {
      Alert.alert(
        "Nothing to brief yet",
        "Record a note first — once you have something to synthesise, tap + to pick which notes go in.",
      );
      return;
    }
    hapticLight();
    router.push("/brief/new");
  };

  const isEmpty = briefs.length === 0;

  return (
    <SceneTransition mode="crossfade-parallax-up">
      <View style={{ flex: 1, backgroundColor: colors.bgPrimary }}>
        <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
          <View style={styles.header}>
            <View style={{ flex: 1 }}>
              <Text style={[typography.h1, { color: colors.textPrimary }]}>Briefs</Text>
              <Text style={[typography.body, { color: colors.textSecondary, marginTop: 2 }]}>
                Synthesised snapshots of your notes.
              </Text>
            </View>
            <Pressable
              onPress={onGenerate}
              hitSlop={10}
              style={[styles.headerAdd, { backgroundColor: colors.accent }]}
              accessibilityRole="button"
              accessibilityLabel="New brief"
            >
              <Plus size={moderateScale(20)} color="#FFFFFF" strokeWidth={2.4} />
            </Pressable>
          </View>

          <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
            {unbriefed.length > 0 && (
              <Pressable
                onPress={onGenerate}
                style={[
                  styles.statusPill,
                  { backgroundColor: colors.accent + "12", borderColor: colors.accent + "55" },
                ]}
                accessibilityRole="button"
                accessibilityLabel="Generate brief from new notes"
              >
                <Sparkles size={moderateScale(14)} color={colors.accent} strokeWidth={2.2} />
                <Text style={[styles.statusText, { color: colors.accent }]}>
                  {unbriefed.length} {unbriefed.length === 1 ? "note" : "notes"} not yet briefed
                </Text>
                <View style={{ flex: 1 }} />
                <Text style={[styles.statusCta, { color: colors.accent }]}>
                  Pick & generate ›
                </Text>
              </Pressable>
            )}

            {isEmpty ? (
              <BriefsEmpty />
            ) : (
              briefs.map((b) => (
                <BriefListRow
                  key={b.id}
                  brief={b}
                  careTeam={careTeam}
                  onPress={() => {
                    hapticLight();
                    router.push(`/brief/${b.id}`);
                  }}
                />
              ))
            )}

            <Text
              style={[
                typography.caption,
                {
                  color: colors.textTertiary,
                  textAlign: "center",
                  marginTop: spacing.s4,
                  paddingHorizontal: spacing.s6,
                },
              ]}
            >
              Briefs are organisational tools · not medical advice
            </Text>
          </ScrollView>
        </SafeAreaView>
      </View>
    </SceneTransition>
  );
};

export default TabBriefs;

const useStyles = makeStyles((theme) => ({
  header: {
    paddingTop: theme.spacing.s3,
    paddingHorizontal: theme.spacing.s6,
    paddingBottom: theme.spacing.s3,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: moderateScale(12),
  },
  headerAdd: {
    width: moderateScale(40),
    height: moderateScale(40),
    borderRadius: moderateScale(20),
    alignItems: "center",
    justifyContent: "center",
    ...theme.shadows.accentGlow,
  },
  content: {
    paddingHorizontal: theme.spacing.s6,
    paddingBottom: verticalScale(120),
    gap: theme.spacing.s3,
  },
  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: moderateScale(8),
    paddingHorizontal: scale(14),
    paddingVertical: verticalScale(11),
    borderRadius: theme.radius.lg,
    borderWidth: 1,
  },
  statusText: {
    fontFamily: "DMSans_600SemiBold",
    fontSize: fontScale(12),
    letterSpacing: 0.1,
  },
  statusCta: {
    fontFamily: "DMSans_700Bold",
    fontSize: fontScale(12),
    letterSpacing: 0.2,
  },
}));
