import React, { useEffect } from "react";
import {
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import Animated, { Easing, FadeInDown } from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import {
  fontScale,
  makeStyles,
  moderateScale,
  scale,
  spacing,
  useTheme,
  verticalScale,
} from "@/theme";
import { SceneTransition } from "@/components/navigation/SceneTransition";
import { BackButton } from "@/components/ui/BackButton";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { OnboardingProgress } from "@/components/onboarding/OnboardingProgress";
import { hapticLight } from "@/services/haptics";
import { useProfileStore } from "@/stores/useProfileStore";
import { PRIVACY_POLICY_URL } from "@/constants/legal";

/**
 * Full-screen AI data-sharing disclosure. Shown:
 *  • Once during onboarding, after the first-note review and before
 *    first-brief fires the first AI call.
 *  • Anytime from Settings → Privacy & data → AI data sharing, where
 *    it doubles as a read-only re-disclosure for users who have
 *    already accepted.
 *
 * Routing entry points pass `from=settings` when launched from the
 * Settings row so accept/dismiss returns the user there instead of
 * advancing the onboarding flow.
 *
 * Required by App Review guideline 5.1.2(i): users must explicitly
 * agree in-app before any data is sent to third-party AI providers.
 */
const ScreenAiConsent: React.FC = () => {
  const router = useRouter();
  const { colors } = useTheme();
  const styles = useStyles();
  const { from } = useLocalSearchParams<{ from?: string }>();
  const fromSettings = from === "settings";

  const aiConsentAcceptedAt = useProfileStore((s) => s.aiConsentAcceptedAt);
  const acceptAiConsent = useProfileStore((s) => s.acceptAiConsent);

  // In the onboarding flow, a user who has already granted consent
  // (e.g. they re-ran onboarding) should skip straight past this
  // step. From Settings, the same user gets the read-only view.
  useEffect(() => {
    if (!fromSettings && aiConsentAcceptedAt) {
      router.replace("/onboarding/first-brief");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onAgree = () => {
    if (!aiConsentAcceptedAt) acceptAiConsent();
    if (fromSettings) {
      router.back();
    } else {
      router.replace("/onboarding/first-brief");
    }
  };

  const onDecline = () => {
    router.back();
  };

  const onOpenPrivacy = () => {
    hapticLight();
    Linking.openURL(PRIVACY_POLICY_URL).catch(() => {});
  };

  const alreadyGranted = !!aiConsentAcceptedAt;
  const readOnlyMode = alreadyGranted && fromSettings;

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
            <BackButton onPress={onDecline} />
            <View style={{ width: 40 }} />
          </View>
          {!fromSettings && (
            <View style={styles.progressSlot}>
              <OnboardingProgress value={0.92} />
            </View>
          )}

          <ScrollView
            contentContainerStyle={styles.scroll}
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
              <Text style={[styles.eyebrowText, { color: colors.accent }]}>
                AI DATA SHARING
              </Text>
            </Animated.View>

            <Animated.Text
              entering={FadeInDown.duration(520).delay(80).easing(Easing.out(Easing.cubic))}
              style={[styles.headline, { color: colors.textPrimary }]}
            >
              Organize your notes{"\n"}
              <Text style={{ fontStyle: "italic", color: colors.accent }}>
                with AI
              </Text>
              ?
            </Animated.Text>

            <Animated.Text
              entering={FadeInDown.duration(520).delay(160).easing(Easing.out(Easing.cubic))}
              style={[styles.sub, { color: colors.textSecondary }]}
            >
              Sympnote uses Google Gemini and OpenAI to turn your notes into
              clinician-ready briefs. Here's what they receive — and what they
              don't.
            </Animated.Text>

            <Animated.View
              entering={FadeInDown.duration(540).delay(220).easing(Easing.out(Easing.cubic))}
            >
              <DisclosureCard
                tone="accent"
                title="What is sent"
                items={[
                  "The note text you typed or dictated",
                  "Age band, sex, allergies, conditions, and medications",
                  "The recipient role (e.g. cardiologist) when you pick one",
                ]}
              />
            </Animated.View>

            <Animated.View
              entering={FadeInDown.duration(540).delay(280).easing(Easing.out(Easing.cubic))}
            >
              <DisclosureCard
                tone="success"
                title="What stays private"
                items={[
                  "Your name, email, and any account ID",
                  "Audio recordings — transcription is on-device",
                  "Doctor and clinician names",
                ]}
              />
            </Animated.View>

            <Animated.Text
              entering={FadeInDown.duration(540).delay(340).easing(Easing.out(Easing.cubic))}
              style={[styles.caption, { color: colors.textSecondary }]}
            >
              Both providers process your data only to fulfill the request.
              They don't train on it and don't retain it beyond what their API
              terms allow.{" "}
              <Text
                onPress={onOpenPrivacy}
                style={{ color: colors.accent, fontFamily: "DMSans_600SemiBold" }}
              >
                Read the privacy policy
              </Text>
              .
            </Animated.Text>

            {readOnlyMode && (
              <View
                style={[
                  styles.statusPill,
                  { backgroundColor: colors.success + "1A" },
                ]}
              >
                <View style={[styles.statusDot, { backgroundColor: colors.success }]} />
                <Text style={[styles.statusText, { color: colors.textPrimary }]}>
                  You agreed on{" "}
                  {new Date(aiConsentAcceptedAt!).toLocaleDateString(undefined, {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}
                </Text>
              </View>
            )}
          </ScrollView>

          <View style={styles.ctaArea}>
            {readOnlyMode ? (
              <PrimaryButton label="Done" onPress={() => router.back()} />
            ) : (
              <>
                <PrimaryButton label="I agree" onPress={onAgree} />
                <Pressable
                  onPress={onDecline}
                  style={({ pressed }) => [
                    styles.declineLink,
                    { opacity: pressed ? 0.5 : 1 },
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel="Don't allow"
                >
                  <Text style={[styles.declineText, { color: colors.textSecondary }]}>
                    Don't allow
                  </Text>
                </Pressable>
              </>
            )}
          </View>
        </SafeAreaView>
      </View>
    </SceneTransition>
  );
};

const DisclosureCard: React.FC<{
  tone: "accent" | "success";
  title: string;
  items: string[];
}> = ({ tone, title, items }) => {
  const { colors } = useTheme();
  const tint = tone === "accent" ? colors.accent : colors.success;
  return (
    <View
      style={[
        cardStyles.shell,
        { backgroundColor: tint + "0F", borderColor: tint + "33" },
      ]}
    >
      <View style={cardStyles.header}>
        <View style={[cardStyles.headerSquare, { backgroundColor: tint }]} />
        <Text style={[cardStyles.title, { color: colors.textPrimary }]}>{title}</Text>
      </View>
      {items.map((item) => (
        <View key={item} style={cardStyles.itemRow}>
          <View style={[cardStyles.itemDot, { backgroundColor: tint }]} />
          <Text style={[cardStyles.itemText, { color: colors.textSecondary }]}>{item}</Text>
        </View>
      ))}
    </View>
  );
};

const cardStyles = StyleSheet.create({
  shell: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: moderateScale(16),
    padding: moderateScale(16),
    marginTop: verticalScale(12),
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: moderateScale(8),
    marginBottom: verticalScale(6),
  },
  headerSquare: {
    width: moderateScale(10),
    height: moderateScale(10),
    borderRadius: moderateScale(3),
  },
  title: {
    fontFamily: "DMSans_600SemiBold",
    fontSize: fontScale(15),
  },
  itemRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: moderateScale(10),
    marginTop: verticalScale(8),
  },
  itemDot: {
    width: moderateScale(5),
    height: moderateScale(5),
    borderRadius: moderateScale(3),
    marginTop: verticalScale(8),
  },
  itemText: {
    flex: 1,
    fontFamily: "DMSans_400Regular",
    fontSize: fontScale(14),
    lineHeight: fontScale(20),
  },
});

export default ScreenAiConsent;

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
  progressSlot: {
    paddingHorizontal: theme.spacing.s6,
    paddingTop: theme.spacing.s2,
  },
  scroll: {
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
    fontSize: fontScale(30),
    lineHeight: fontScale(36),
    marginTop: spacing.s4,
  },
  sub: {
    ...theme.typography.body,
    marginTop: moderateScale(10),
    marginBottom: theme.spacing.s2,
    lineHeight: fontScale(22),
    maxWidth: moderateScale(360),
  },
  caption: {
    fontFamily: "DMSans_400Regular",
    fontSize: fontScale(13),
    lineHeight: fontScale(19),
    marginTop: theme.spacing.s4,
  },
  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: moderateScale(8),
    alignSelf: "flex-start",
    paddingHorizontal: scale(12),
    paddingVertical: verticalScale(6),
    borderRadius: theme.radius.full,
    marginTop: theme.spacing.s4,
  },
  statusDot: {
    width: moderateScale(6),
    height: moderateScale(6),
    borderRadius: moderateScale(3),
  },
  statusText: {
    fontFamily: "DMSans_500Medium",
    fontSize: fontScale(13),
  },
  ctaArea: {
    paddingHorizontal: theme.spacing.s6,
    paddingTop: theme.spacing.s3,
    paddingBottom: theme.spacing.s4,
  },
  declineLink: {
    alignSelf: "center",
    paddingVertical: verticalScale(12),
    paddingHorizontal: scale(20),
    marginTop: verticalScale(4),
  },
  declineText: {
    fontFamily: "DMSans_500Medium",
    fontSize: fontScale(14),
  },
}));
