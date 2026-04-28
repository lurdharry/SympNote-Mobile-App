import React from "react";
import { Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Animated, { FadeIn } from "react-native-reanimated";
import { Sparkles } from "lucide-react-native";
import {
  fontScale,
  makeStyles,
  moderateScale,
  shadows,
  typography,
  useTheme,
  verticalScale,
} from "@/theme";

/**
 * Fallback shown on /onboarding/first-brief when the live AI run
 * couldn't produce usable content. Hand-written sample so the user
 * still sees what a brief looks like before the paywall ask. Marked
 * clearly so they don't mistake the example for theirs — aha must
 * never fail silently.
 */
export const SampleBriefCard: React.FC = () => {
  const { colors } = useTheme();
  const styles = useStyles();

  return (
    <Animated.View
      entering={FadeIn.duration(280)}
      style={[
        styles.card,
        { backgroundColor: colors.bgSurface, borderColor: colors.accent + "55" },
        shadows.card,
      ]}
    >
      <LinearGradient
        colors={[colors.accent + "12", colors.accent + "00"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.wash}
        pointerEvents="none"
      />
      <View style={styles.badgeRow}>
        <Text style={[styles.eyebrow, { color: colors.accent }]}>EXAMPLE BRIEF</Text>
        <View style={[styles.badge, { borderColor: colors.accent + "55" }]} pointerEvents="none">
          <Text style={[styles.badgeText, { color: colors.accent }]}>
            What yours will look like
          </Text>
        </View>
      </View>
      <Text style={[styles.title, { color: colors.textPrimary }]}>
        Right knee pain, getting sharper
      </Text>
      <Text style={[styles.body, { color: colors.textSecondary }]}>
        Worse climbing stairs, eases with rest — started ~10 days ago. Mild swelling overnight, no
        obvious trigger.
      </Text>
      <View style={styles.foot}>
        <Sparkles size={moderateScale(11)} color={colors.accent} strokeWidth={2.2} />
        <Text style={[styles.footText, { color: colors.accent }]}>
          + 4 patterns · 3 questions · 1 flag
        </Text>
      </View>
    </Animated.View>
  );
};

const useStyles = makeStyles((theme) => ({
  card: {
    marginTop: theme.spacing.s6,
    paddingHorizontal: moderateScale(16),
    paddingVertical: moderateScale(16),
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    overflow: "hidden",
  },
  wash: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: verticalScale(60),
  },
  eyebrow: {
    fontFamily: "DMSans_700Bold",
    fontSize: fontScale(10),
    letterSpacing: 1.4,
  },
  title: {
    fontFamily: "Fraunces_500Medium",
    fontSize: fontScale(20),
    lineHeight: fontScale(26),
    letterSpacing: -0.3,
    marginTop: 4,
  },
  body: {
    ...typography.body,
    fontSize: fontScale(13),
    lineHeight: fontScale(19),
    marginTop: 6,
  },
  foot: {
    flexDirection: "row",
    alignItems: "center",
    gap: moderateScale(5),
    marginTop: theme.spacing.s3,
  },
  footText: {
    fontFamily: "DMSans_600SemiBold",
    fontSize: fontScale(11),
    letterSpacing: 0.2,
  },
  badgeRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: moderateScale(8),
  },
  badge: {
    paddingHorizontal: moderateScale(8),
    paddingVertical: verticalScale(3),
    borderRadius: theme.radius.full,
    borderWidth: 1,
  },
  badgeText: {
    fontFamily: "DMSans_700Bold",
    fontSize: fontScale(9),
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },
}));
