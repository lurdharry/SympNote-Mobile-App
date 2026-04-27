import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { Lock, Sparkles } from "lucide-react-native";
import {
  fontScale,
  makeStyles,
  moderateScale,
  shadows,
  typography,
  useTheme,
  verticalScale,
} from "@/theme";
import { hapticLight } from "@/services/haptics";

/**
 * View-level paywall gate. Used where blocking at the action level
 * would be too late — the user has already navigated to the screen
 * and would see something they shouldn't have access to. Examples:
 *
 *   - Insights tab (entire screen is paid)
 *   - Recording surface (mounting the screen implies "you can record")
 *
 * Renders a centered lock pitch with the feature title, a one-liner
 * pitch, and a primary CTA that opens the in-app paywall modal. The
 * EntitlementContext flips `entitled` back to true on successful
 * purchase, and the consumer screen re-renders with its real content.
 *
 * Keep the surface visually distinct from the rest of the app (soft
 * accent wash, large lock glyph, editorial headline) so it reads as
 * "feature is paid" rather than "something broke."
 */
export interface LockedViewProps {
  /** Big italic Fraunces headline ("Insights are paid", "Record is paid"). */
  title: string;
  /** One-line pitch under the headline. */
  description: string;
  /** Optional CTA label override. Defaults to "Unlock with Sympnote". */
  ctaLabel?: string;
}

export const LockedView: React.FC<LockedViewProps> = ({
  title,
  description,
  ctaLabel = "Unlock with Sympnote",
}) => {
  const router = useRouter();
  const { colors } = useTheme();
  const styles = useStyles();

  const onUnlock = () => {
    hapticLight();
    router.push("/paywall");
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.bgPrimary }]}>
      <View pointerEvents="none" style={styles.aurora}>
        <LinearGradient
          colors={[colors.accent + "1A", colors.accent + "00"]}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
      </View>

      <View style={styles.center}>
        <View
          style={[
            styles.lockTile,
            { backgroundColor: colors.bgSurface, borderColor: colors.accent + "55" },
            shadows.card,
          ]}
        >
          <LinearGradient
            colors={[colors.accent + "20", colors.accent + "00"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          <Lock
            size={moderateScale(28)}
            color={colors.accent}
            strokeWidth={2}
          />
        </View>

        <Text style={[styles.eyebrow, { color: colors.accent }]}>PAID FEATURE</Text>
        <Text style={[styles.title, { color: colors.textPrimary }]}>{title}</Text>
        <Text style={[styles.description, { color: colors.textSecondary }]}>
          {description}
        </Text>

        <Pressable
          onPress={onUnlock}
          style={[styles.cta, { backgroundColor: colors.accent }]}
          accessibilityRole="button"
          accessibilityLabel={ctaLabel}
        >
          <Sparkles size={moderateScale(14)} color="#FFFFFF" strokeWidth={2.4} />
          <Text style={styles.ctaText}>{ctaLabel}</Text>
        </Pressable>
      </View>
    </View>
  );
};

const useStyles = makeStyles((theme) => ({
  root: {
    flex: 1,
    overflow: "hidden",
  },
  aurora: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: verticalScale(360),
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: theme.spacing.s8,
    gap: moderateScale(12),
  },
  lockTile: {
    width: moderateScale(72),
    height: moderateScale(72),
    borderRadius: moderateScale(20),
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    marginBottom: moderateScale(8),
  },
  eyebrow: {
    fontFamily: "DMSans_700Bold",
    fontSize: fontScale(10),
    letterSpacing: 1.4,
  },
  title: {
    ...typography.h1,
    fontFamily: "Fraunces_500Medium",
    fontSize: fontScale(26),
    lineHeight: fontScale(32),
    letterSpacing: -0.4,
    textAlign: "center",
    fontStyle: "italic",
  },
  description: {
    ...typography.body,
    fontSize: fontScale(14),
    lineHeight: fontScale(20),
    textAlign: "center",
    maxWidth: moderateScale(300),
  },
  cta: {
    flexDirection: "row",
    alignItems: "center",
    gap: moderateScale(8),
    paddingHorizontal: moderateScale(20),
    paddingVertical: moderateScale(13),
    borderRadius: theme.radius.full,
    marginTop: moderateScale(8),
    ...theme.shadows.accentGlow,
  },
  ctaText: {
    color: "#FFFFFF",
    fontFamily: "DMSans_700Bold",
    fontSize: fontScale(14),
    letterSpacing: -0.05,
  },
}));
