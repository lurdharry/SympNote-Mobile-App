import React, { useEffect } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { format, parseISO } from "date-fns";
import { Sparkles, X as XIcon, Microchip, Mic } from "lucide-react-native";
import {
  fontScale,
  makeStyles,
  moderateScale,
  scale,
  shadows,
  spacing,
  typography,
  useTheme,
  verticalScale,
} from "@/theme";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import type { Appointment, Recording } from "@/stores/types";
import { hapticLight } from "@/services/haptics";

interface FirstEntryHeroProps {
  recording: Recording;
  nextAppointment?: Appointment;
  onDismiss: () => void;
}

/**
 * One-time celebration card for the user's first saved recording on
 * the home screen. Reads entirely from data (next-appointment context
 * personalizes the sub). Dismissed once, then hidden forever via a
 * flag on the profile store.
 */
export const FirstEntryHero: React.FC<FirstEntryHeroProps> = ({
  recording,
  nextAppointment,
  onDismiss,
}) => {
  const { colors } = useTheme();
  const styles = useStyles();
  const reduced = useReducedMotion();

  const opacity = useSharedValue(reduced ? 1 : 0);
  const translate = useSharedValue(reduced ? 0 : 16);

  useEffect(() => {
    if (reduced) return;
    opacity.value = withDelay(
      80,
      withTiming(1, { duration: 320, easing: Easing.out(Easing.cubic) }),
    );
    translate.value = withDelay(80, withSpring(0, { damping: 16, stiffness: 130, mass: 0.7 }));
  }, [reduced, opacity, translate]);

  const enterStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translate.value }],
  }));

  const sub = nextAppointment
    ? `Prep for your visit with ${nextAppointment.doctorName} starts here.`
    : "Every entry you add makes your next visit stronger.";

  const meta = `${format(parseISO(recording.createdAt), "d MMM y, h:mm a")} · `;

  const handleDismiss = () => {
    hapticLight();
    onDismiss();
  };

  return (
    <Animated.View
      style={[
        styles.card,
        { backgroundColor: colors.bgSurface, borderColor: colors.accent + "33" },
        shadows.card,
        enterStyle,
      ]}
    >
      <LinearGradient
        colors={[colors.accent + "14", "transparent"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />

      <View style={styles.topRow}>
        <View style={[styles.pill, { backgroundColor: colors.accent + "1A" }]}>
          <Sparkles size={moderateScale(11)} color={colors.accent} strokeWidth={2.4} />
          <Text style={[styles.pillText, { color: colors.accent }]}>FIRST ENTRY · SAVED</Text>
        </View>
        <Pressable
          onPress={handleDismiss}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel="Dismiss"
        >
          <XIcon size={moderateScale(16)} color={colors.textTertiary} strokeWidth={2} />
        </Pressable>
      </View>

      <Text style={[styles.headline, { color: colors.textPrimary }]}>Your record has begun.</Text>
      <Text style={[styles.sub, { color: colors.textSecondary }]}>
        {nextAppointment ? (
          <Text>
            Prep for your visit with{" "}
            <Text style={styles.docName}>{nextAppointment.doctorName}</Text> starts here.
          </Text>
        ) : (
          "Every entry you add makes your next visit stronger."
        )}
      </Text>

      <View style={[styles.divider, { backgroundColor: colors.border }]} />

      <View style={styles.metaRow}>
        <View style={[styles.metaDot, { backgroundColor: colors.accent }]} />
        <Text style={[typography.caption, { color: colors.textTertiary }]}>{meta}</Text>
        <View style={styles.microPhone}>
          <Mic size={moderateScale(16)} color={colors.coral} strokeWidth={1} />
          <Text style={[typography.caption, { color: colors.textTertiary }]}>
            {recording.durationSec + "s"}
          </Text>
        </View>
      </View>
    </Animated.View>
  );
};

const useStyles = makeStyles((theme) => ({
  docName: {
    ...theme.typography.label,
    color: "rgba(246,192,106,0.9)",
    fontSize: fontScale(14),
  },
  microPhone: {
    flexDirection: "row",
    alignItems: "center",
  },
  card: {
    padding: moderateScale(18),
    borderRadius: theme.radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: "hidden",
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.s3,
  },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: moderateScale(6),
    paddingHorizontal: scale(10),
    paddingVertical: verticalScale(4),
    borderRadius: theme.radius.full,
  },
  pillText: {
    ...theme.typography.label,
    fontFamily: "DMSans_700Bold",
    letterSpacing: 0.9,
    fontSize: fontScale(10),
  },
  headline: {
    ...theme.typography.h2,
    fontFamily: "Fraunces_500Medium",
    fontSize: fontScale(26),
    lineHeight: fontScale(32),
    letterSpacing: -0.4,
  },
  sub: {
    ...theme.typography.body,
    marginTop: moderateScale(6),
    lineHeight: fontScale(22),
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginTop: spacing.s4,
    marginBottom: spacing.s3,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: moderateScale(6),
  },
  metaDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
}));
