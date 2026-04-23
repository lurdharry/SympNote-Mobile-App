import React, { useEffect } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { parseISO } from "date-fns";
import { Pencil } from "lucide-react-native";
import {
  fontScale,
  makeStyles,
  moderateScale,
  scale,
  shadows,
  typography,
  useTheme,
  verticalScale,
} from "@/theme";
import { SceneTransition } from "@/components/navigation/SceneTransition";
import { BackButton } from "@/components/ui/BackButton";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { usePendingRecordingStore } from "@/stores/usePendingRecordingStore";
import { useAppointmentsStore } from "@/stores/useAppointmentsStore";
import { hapticLight } from "@/services/haptics";

const ScreenSummary: React.FC = () => {
  const router = useRouter();
  const { colors } = useTheme();
  const styles = useStyles();

  const draft = usePendingRecordingStore((s) => s.draft);
  const updateTranscript = usePendingRecordingStore((s) => s.updateTranscript);
  const nextAppt = useAppointmentsStore(
    (s) =>
      [...s.appointments]
        .filter((a) => parseISO(a.date).getTime() >= Date.now())
        .sort((a, b) => parseISO(a.date).getTime() - parseISO(b.date).getTime())[0],
  );

  // Defensive: if someone lands here with no draft (deep link, refresh),
  // send them back to record.
  useEffect(() => {
    if (!draft) router.replace("/onboarding/first-recording");
  }, [draft, router]);

  if (!draft) return null;

  const promiseSub = nextAppt
    ? `We'll turn what you just said into a clinical note ${nextAppt.doctorName} can act on.`
    : "We'll turn what you just said into a clinical note your doctor can act on.";

  const onAnalyze = () => {
    hapticLight();
    router.push("/onboarding/paywall");
  };

  const onReRecord = () => {
    hapticLight();
    router.back();
  };

  return (
    <SceneTransition mode="scale-fade">
      <View style={[styles.root, { backgroundColor: colors.bgPrimary }]}>
        <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
          <View style={styles.topBar}>
            <BackButton onPress={() => router.back()} />
            <View style={{ width: 40 }} />
          </View>

          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
          >
            <Text style={[styles.headline, { color: colors.textPrimary }]}>
              Your next visit,{"\n"}already prepared.
            </Text>
            <Text style={[styles.sub, { color: colors.textSecondary }]}>
              {promiseSub}
            </Text>

            <TranscriptQuote
              transcript={draft.transcript}
              durationSec={draft.durationSec}
              onChangeText={updateTranscript}
              onReRecord={onReRecord}
            />
          </ScrollView>

          <View style={styles.ctaArea}>
            <PrimaryButton label="Make my story doctor-ready" onPress={onAnalyze} />
          </View>
        </SafeAreaView>
      </View>
    </SceneTransition>
  );
};

interface TranscriptQuoteProps {
  transcript: string;
  durationSec: number;
  onChangeText: (next: string) => void;
  onReRecord: () => void;
}

const TranscriptQuote: React.FC<TranscriptQuoteProps> = ({
  transcript,
  durationSec,
  onChangeText,
  onReRecord,
}) => {
  const { colors } = useTheme();
  const styles = useStyles();
  return (
    <View
      style={[
        styles.quoteCard,
        { backgroundColor: colors.bgSurface, borderColor: colors.border },
        shadows.card,
      ]}
    >
      <View style={[styles.quoteBar, { backgroundColor: colors.accent }]} />
      <View style={{ flex: 1 }}>
        <TextInput
          value={transcript}
          onChangeText={onChangeText}
          multiline
          scrollEnabled
          textAlignVertical="top"
          style={[styles.quoteText, styles.quoteInput, { color: colors.textPrimary }]}
        />
        <View style={styles.quoteMeta}>
          <View style={[styles.metaDot, { backgroundColor: colors.textTertiary }]} />
          <Text style={[typography.caption, { color: colors.textTertiary }]}>
            {formatDuration(durationSec)} · just now ·{" "}
          </Text>
          <Pressable onPress={onReRecord} hitSlop={8}>
            <Text
              style={[
                typography.caption,
                {
                  color: colors.textSecondary,
                  textDecorationLine: "underline",
                  fontFamily: "DMSans_600SemiBold",
                },
              ]}
            >
              Re-record
            </Text>
          </Pressable>
          <View style={{ flex: 1 }} />
          <Pencil size={moderateScale(11)} color={colors.textTertiary} strokeWidth={2} />
          <Text
            style={[
              typography.caption,
              { color: colors.textTertiary, fontStyle: "italic" },
            ]}
          >
            Tap to edit
          </Text>
        </View>
      </View>
    </View>
  );
};

const formatDuration = (s: number): string => {
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  const rem = s % 60;
  return rem === 0 ? `${m}m` : `${m}m ${rem}s`;
};

export default ScreenSummary;

const useStyles = makeStyles((theme) => ({
  root: { flex: 1 },
  safe: { flex: 1 },
  topBar: {
    paddingTop: theme.spacing.s3,
    paddingHorizontal: theme.spacing.s6,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: theme.spacing.s6,
    paddingTop: theme.spacing.s5,
    paddingBottom: theme.spacing.s6,
  },
  headline: {
    ...theme.typography.h1,
    fontFamily: "Fraunces_500Medium",
    letterSpacing: -0.6,
    textAlign: "center",
    marginTop: moderateScale(6),
    lineHeight: fontScale(36),
  },
  sub: {
    ...theme.typography.body,
    textAlign: "center",
    marginTop: moderateScale(10),
    marginBottom: theme.spacing.s5,
    paddingHorizontal: theme.spacing.s3,
  },
  quoteCard: {
    flexDirection: "row",
    padding: moderateScale(16),
    borderRadius: theme.radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
  },
  quoteBar: {
    width: 3,
    borderRadius: 2,
    marginRight: scale(12),
    alignSelf: "stretch",
  },
  quoteText: {
    ...theme.typography.body,
    fontFamily: "Fraunces_300Light",
    fontSize: fontScale(16),
    lineHeight: fontScale(24),
    letterSpacing: -0.1,
  },
  quoteInput: {
    maxHeight: verticalScale(180),
    padding: 0,
    margin: 0,
  },
  quoteMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: moderateScale(4),
    marginTop: verticalScale(12),
  },
  metaDot: {
    width: 3,
    height: 3,
    borderRadius: 2,
    opacity: 0.6,
  },
  ctaArea: {
    paddingHorizontal: theme.spacing.s6,
    paddingTop: theme.spacing.s4,
    paddingBottom: theme.spacing.s3,
  },
}));
