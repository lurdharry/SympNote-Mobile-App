import React, { useEffect } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import { CalendarPlus, Sparkles } from "lucide-react-native";
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
import type { Appointment } from "@/stores/types";
import { daysUntil, formatDate, formatTime } from "@/utils/date";
import { NextVisitMini } from "./NextVisitMini";

interface UpNextCardProps {
  appointment: Appointment | undefined;
  onPress: () => void;
  /** Fires when the empty-state card is tapped so the user can add an appointment. */
  onAdd?: () => void;
}

export const UpNextCard: React.FC<UpNextCardProps> = ({ appointment, onPress, onAdd }) => {
  const { colors } = useTheme();
  const styles = useStyles();
  const opacity = useSharedValue(0);
  useEffect(() => {
    opacity.value = withTiming(1, {
      duration: 520,
      easing: Easing.out(Easing.cubic),
    });
  }, [opacity]);
  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: (1 - opacity.value) * 12 }],
  }));

  if (!appointment) {
    return (
      <Animated.View style={[{ marginTop: spacing.s3 }, style]}>
        <Pressable
          onPress={onAdd ?? onPress}
          accessibilityRole="button"
          accessibilityLabel="Add appointment"
          style={[
            styles.emptyCard,
            { backgroundColor: colors.bgSurface, borderColor: colors.border },
            shadows.card,
          ]}
        >
          <View style={[styles.emptyIcon, { backgroundColor: colors.accent + "1A" }]}>
            <CalendarPlus size={moderateScale(20)} color={colors.accent} strokeWidth={2} />
          </View>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={styles.emptyEyebrow}>NEXT VISIT</Text>
            <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>
              No appointment scheduled
            </Text>
            <Text style={[typography.caption, { color: colors.textTertiary, marginTop: 2 }]}>
              Add one and Sympnote will prepare a visit brief for you.
            </Text>
          </View>
        </Pressable>
      </Animated.View>
    );
  }

  const when = formatDate(appointment.date);
  const days = Math.max(0, daysUntil(appointment.date));
  const timeLabel = `${formatTime(appointment.date)} · in ${days}d`;

  return (
    <Animated.View style={[{ marginTop: spacing.s3 }, style]}>
      <Pressable onPress={onPress} accessibilityRole="button">
        <View style={[styles.card, shadows.elevated]}>
          <LinearGradient
            colors={["#2C6E6B", "#1F504E"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />

          <View style={styles.headRow}>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={styles.eyebrow}>NEXT VISIT</Text>
              <Text style={styles.doctor} numberOfLines={1}>
                {appointment.doctorName}
              </Text>
              <Text style={styles.specialty} numberOfLines={1}>
                {appointment.specialty}
              </Text>
            </View>
            <NextVisitMini size={moderateScale(52)} />
          </View>

          <View style={styles.foot}>
            <View style={{ flex: 1 }}>
              <Text style={styles.footWhen}>{when}</Text>
              <Text style={styles.footTime}>{timeLabel}</Text>
            </View>
            <View style={styles.prepReady}>
              <Sparkles size={11} color="#F6C06A" strokeWidth={2.2} />
              <Text style={styles.prepReadyText}>Prep ready</Text>
            </View>
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
};

const useStyles = makeStyles((theme) => ({
  card: {
    borderRadius: theme.radius.lg,
    paddingHorizontal: moderateScale(16),
    paddingVertical: moderateScale(14),
    overflow: "hidden",
  },
  headRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: moderateScale(12),
  },
  eyebrow: {
    ...typography.caption,
    color: "rgba(246,192,106,0.9)",
    letterSpacing: 1.4,
    fontFamily: "DMSans_600SemiBold",
    fontSize: fontScale(10),
  },
  doctor: {
    fontFamily: "Fraunces_500Medium",
    color: "#FFFFFF",
    fontSize: fontScale(20),
    lineHeight: fontScale(26),
    letterSpacing: -0.3,
    marginTop: 2,
  },
  specialty: {
    ...typography.body,
    color: "rgba(255,255,255,0.78)",
    fontSize: fontScale(13),
    marginTop: 1,
  },
  foot: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: moderateScale(10),
    gap: moderateScale(10),
  },
  footWhen: {
    ...typography.caption,
    color: "rgba(255,255,255,0.6)",
    letterSpacing: 0.8,
    textTransform: "uppercase",
    fontSize: fontScale(10),
  },
  footTime: {
    color: "#FFFFFF",
    fontFamily: "DMSans_600SemiBold",
    fontSize: fontScale(14),
    marginTop: 1,
  },
  prepReady: {
    flexDirection: "row",
    alignItems: "center",
    gap: moderateScale(5),
    paddingHorizontal: scale(10),
    paddingVertical: verticalScale(5),
    borderRadius: theme.radius.full,
    backgroundColor: "rgba(255,255,255,0.14)",
  },
  prepReadyText: {
    ...typography.label,
    color: "#FFFFFF",
    fontFamily: "DMSans_600SemiBold",
    fontSize: fontScale(11),
  },
  emptyCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: moderateScale(12),
    paddingHorizontal: moderateScale(14),
    paddingVertical: moderateScale(12),
    borderRadius: theme.radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
  },
  emptyIcon: {
    width: moderateScale(40),
    height: moderateScale(40),
    borderRadius: moderateScale(10),
    alignItems: "center",
    justifyContent: "center",
  },
  emptyEyebrow: {
    ...typography.caption,
    color: theme.colors.accent,
    letterSpacing: 1.2,
    fontFamily: "DMSans_600SemiBold",
    fontSize: fontScale(10),
  },
  emptyTitle: {
    fontFamily: "DMSans_600SemiBold",
    fontSize: fontScale(15),
    marginTop: 2,
  },
}));
