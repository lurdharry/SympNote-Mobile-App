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
import Animated, { Easing, FadeInDown } from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import { parseISO } from "date-fns";
import { Clock, Mic, Pencil } from "lucide-react-native";
import {
  fontScale,
  makeStyles,
  moderateScale,
  scale,
  shadows,
  spacing,
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
        {/* Ambient aurora — ties the screen to the rest of onboarding. */}
        <View pointerEvents="none" style={styles.aurora}>
          <LinearGradient
            colors={[colors.accent + "22", colors.accent + "00"]}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
        </View>

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
            <Animated.View
              entering={FadeInDown.duration(480).easing(Easing.out(Easing.cubic))}
              style={[
                styles.eyebrow,
                {
                  backgroundColor: colors.accent + "14",
                  borderColor: colors.accent + "33",
                },
              ]}
            >
              <View style={[styles.eyebrowDot, { backgroundColor: colors.accent }]} />
              <Text style={[styles.eyebrowText, { color: colors.accent }]}>
                YOUR FIRST NOTE
              </Text>
            </Animated.View>

            <Animated.Text
              entering={FadeInDown.duration(560).delay(80).easing(Easing.out(Easing.cubic))}
              style={[styles.headline, { color: colors.textPrimary }]}
            >
              Your next visit,{"\n"}
              <Text style={{ fontStyle: "italic", color: colors.accent }}>
                already prepared
              </Text>
              .
            </Animated.Text>

            <Animated.Text
              entering={FadeInDown.duration(560).delay(160).easing(Easing.out(Easing.cubic))}
              style={[styles.sub, { color: colors.textSecondary }]}
            >
              {promiseSub}
            </Animated.Text>

            <Animated.View
              entering={FadeInDown.duration(640).delay(240).easing(Easing.out(Easing.cubic))}
            >
              <TranscriptQuote
                transcript={draft.transcript}
                durationSec={draft.durationSec}
                onChangeText={updateTranscript}
                onReRecord={onReRecord}
              />
            </Animated.View>
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
      {/* Soft accent wash across the top of the card. */}
      <LinearGradient
        colors={[colors.accent + "18", colors.accent + "00"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.quoteWash}
      />

      {/* Oversized ornamental quotation glyph. */}
      <Text style={[styles.quoteGlyph, { color: colors.accent + "55" }]}>
        &ldquo;
      </Text>

      <TextInput
        value={transcript}
        onChangeText={onChangeText}
        multiline
        scrollEnabled
        textAlignVertical="top"
        style={[styles.quoteText, styles.quoteInput, { color: colors.textPrimary }]}
      />

      <View style={[styles.metaRow, { borderTopColor: colors.border }]}>
        <View style={[styles.metaChip, { backgroundColor: colors.bgMuted }]}>
          <Mic size={moderateScale(10)} color={colors.textSecondary} strokeWidth={2.2} />
          <Text style={[styles.metaChipText, { color: colors.textSecondary }]}>
            {formatDuration(durationSec)}
          </Text>
        </View>
        <View style={[styles.metaChip, { backgroundColor: colors.bgMuted }]}>
          <Clock size={moderateScale(10)} color={colors.textSecondary} strokeWidth={2.2} />
          <Text style={[styles.metaChipText, { color: colors.textSecondary }]}>
            Just now
          </Text>
        </View>
        <View style={{ flex: 1 }} />
        <Pressable onPress={onReRecord} hitSlop={8}>
          <Text style={[styles.reRecord, { color: colors.accent }]}>Re-record</Text>
        </Pressable>
      </View>

      <View style={styles.editHintRow}>
        <Pencil size={moderateScale(10)} color={colors.textTertiary} strokeWidth={2} />
        <Text style={[styles.editHintText, { color: colors.textTertiary }]}>
          Tap the text above to edit
        </Text>
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
  aurora: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: verticalScale(320),
    overflow: "hidden",
  },
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
    paddingTop: theme.spacing.s4,
    paddingBottom: theme.spacing.s6,
  },
  eyebrow: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: moderateScale(6),
    paddingHorizontal: scale(10),
    paddingVertical: verticalScale(5),
    borderRadius: theme.radius.full,
    borderWidth: StyleSheet.hairlineWidth,
  },
  eyebrowDot: {
    width: moderateScale(6),
    height: moderateScale(6),
    borderRadius: moderateScale(3),
  },
  eyebrowText: {
    fontFamily: "DMSans_700Bold",
    fontSize: fontScale(10),
    letterSpacing: 1.4,
  },
  headline: {
    ...theme.typography.h1,
    fontFamily: "Fraunces_500Medium",
    letterSpacing: -0.8,
    fontSize: fontScale(32),
    lineHeight: fontScale(38),
    marginTop: spacing.s4,
  },
  sub: {
    ...theme.typography.body,
    marginTop: moderateScale(10),
    marginBottom: theme.spacing.s6,
    lineHeight: fontScale(22),
    maxWidth: moderateScale(340),
  },
  quoteCard: {
    position: "relative",
    paddingHorizontal: moderateScale(18),
    paddingTop: moderateScale(18),
    paddingBottom: moderateScale(12),
    borderRadius: theme.radius.xl,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: "hidden",
  },
  quoteWash: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: verticalScale(70),
  },
  quoteGlyph: {
    fontFamily: "Fraunces_500Medium",
    fontSize: fontScale(64),
    lineHeight: fontScale(64),
    height: fontScale(44),
    marginTop: -moderateScale(4),
    marginLeft: -moderateScale(2),
  },
  quoteText: {
    ...theme.typography.body,
    fontFamily: "Fraunces_400Regular",
    fontSize: fontScale(17),
    lineHeight: fontScale(26),
    letterSpacing: -0.1,
  },
  quoteInput: {
    maxHeight: verticalScale(200),
    padding: 0,
    margin: 0,
    marginTop: moderateScale(4),
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: moderateScale(6),
    marginTop: verticalScale(14),
    paddingTop: verticalScale(12),
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  metaChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: moderateScale(4),
    paddingHorizontal: scale(8),
    paddingVertical: verticalScale(4),
    borderRadius: theme.radius.full,
  },
  metaChipText: {
    fontFamily: "DMSans_600SemiBold",
    fontSize: fontScale(11),
    letterSpacing: 0.1,
  },
  reRecord: {
    fontFamily: "DMSans_600SemiBold",
    fontSize: fontScale(12),
    textDecorationLine: "underline",
  },
  editHintRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: moderateScale(4),
    marginTop: verticalScale(8),
  },
  editHintText: {
    ...theme.typography.caption,
    fontStyle: "italic",
  },
  ctaArea: {
    paddingHorizontal: theme.spacing.s6,
    paddingTop: theme.spacing.s4,
    paddingBottom: theme.spacing.s3,
  },
}));
