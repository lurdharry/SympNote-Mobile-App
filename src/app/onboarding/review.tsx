import React, { useEffect, useState } from "react";
import {
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
import Animated, { Easing, FadeInDown } from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
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
import { OnboardingProgress } from "@/components/onboarding/OnboardingProgress";
import { usePendingRecordingStore } from "@/stores/usePendingRecordingStore";
import { hapticLight } from "@/services/haptics";

/**
 * Post-recording review for the onboarding first-note flow. Reads the
 * pending draft set by the prior summary screen, lets the user edit
 * the transcript, then advances to the paywall. Re-recording navigates
 * back to summary where the hold mic lives.
 *
 * Split out from summary.tsx so the back button on this screen returns
 * to the recording surface (and back from analyzing/paywall returns to
 * this screen) instead of conditionally rendering both states inside
 * one route.
 */
const ScreenFirstRecordingReview: React.FC = () => {
  const router = useRouter();
  const { colors } = useTheme();
  const styles = useStyles();

  const draft = usePendingRecordingStore((s) => s.draft);
  const [editValue, setEditValue] = useState(draft?.transcript ?? "");

  // Defensive: if the user lands here without a draft (deep-link, hot
  // reload, etc.), bounce back to the recording surface rather than
  // showing an empty screen.
  useEffect(() => {
    if (!draft) router.back();
  }, [draft, router]);

  if (!draft) return null;

  const onContinue = () => {
    const text = editValue.trim() || draft.transcript;
    usePendingRecordingStore.getState().setDraft({
      transcript: text,
      durationSec: draft.durationSec,
      createdAt: draft.createdAt,
    });
    router.push("/onboarding/paywall");
  };

  const onReRecord = () => {
    hapticLight();
    usePendingRecordingStore.getState().clear();
    router.back();
  };

  return (
    <SceneTransition mode="scale-fade">
      <View style={[styles.root, { backgroundColor: colors.bgPrimary }]}>
        <View pointerEvents="none" style={styles.aurora}>
          <LinearGradient
            colors={[colors.accent + "1E", colors.accent + "00"]}
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
          <View style={styles.progressSlot}>
            <OnboardingProgress value={1} />
          </View>

          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : undefined}
            style={styles.flex}
          >
            <ScrollView
              contentContainerStyle={styles.reviewScroll}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              <Animated.View
                entering={FadeInDown.duration(420).easing(Easing.out(Easing.cubic))}
                style={[
                  styles.eyebrow,
                  { backgroundColor: colors.accent + "14", borderColor: colors.accent + "33" },
                ]}
              >
                <View style={[styles.eyebrowDot, { backgroundColor: colors.accent }]} />
                <Text style={[styles.eyebrowText, { color: colors.accent }]}>YOUR FIRST NOTE</Text>
              </Animated.View>

              <Animated.Text
                entering={FadeInDown.duration(520).delay(80).easing(Easing.out(Easing.cubic))}
                style={[styles.headline, { color: colors.textPrimary }]}
              >
                Your next visit,{"\n"}
                <Text style={{ fontStyle: "italic", color: colors.accent }}>already prepared</Text>.
              </Animated.Text>

              <Animated.Text
                entering={FadeInDown.duration(520).delay(160).easing(Easing.out(Easing.cubic))}
                style={[styles.sub, { color: colors.textSecondary }]}
              >
                We'll turn what you just said into a clinical note your doctor can act on.
              </Animated.Text>

              <Animated.View
                entering={FadeInDown.duration(560).delay(240).easing(Easing.out(Easing.cubic))}
              >
                <TranscriptQuote
                  transcript={editValue}
                  durationSec={draft.durationSec}
                  onChangeText={setEditValue}
                  onReRecord={onReRecord}
                />
              </Animated.View>
            </ScrollView>
          </KeyboardAvoidingView>

          <View style={styles.ctaArea}>
            <PrimaryButton label="Make my story doctor-ready" onPress={onContinue} />
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
      <LinearGradient
        colors={[colors.accent + "18", colors.accent + "00"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.quoteWash}
      />
      <Text style={[styles.quoteGlyph, { color: colors.accent + "55" }]}>&ldquo;</Text>
      <TextInput
        value={transcript}
        onChangeText={onChangeText}
        multiline
        scrollEnabled
        textAlignVertical="top"
        style={[styles.quoteText, styles.quoteInput, { color: colors.textPrimary }]}
        placeholder="Your words will appear here…"
        placeholderTextColor={colors.textTertiary}
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
          <Text style={[styles.metaChipText, { color: colors.textSecondary }]}>Just now</Text>
        </View>
        <View style={{ flex: 1 }} />
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

export default ScreenFirstRecordingReview;

const useStyles = makeStyles((theme) => ({
  root: { flex: 1 },
  safe: { flex: 1 },
  flex: { flex: 1 },
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
  progressSlot: {
    paddingHorizontal: theme.spacing.s6,
    paddingTop: theme.spacing.s2,
  },
  reviewScroll: {
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
    paddingTop: theme.spacing.s3,
    paddingBottom: theme.spacing.s4,
  },
}));
