import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { parseISO } from "date-fns";
import { Mic } from "lucide-react-native";
import {
  fontScale,
  makeStyles,
  moderateScale,
  shadows,
  useTheme,
} from "@/theme";
import { hapticLight } from "@/services/haptics";

interface TodayCheckInProps {
  recordingsCount: number;
  /** ISO timestamp of the user's most recent recording, or undefined
   *  if they have none. */
  lastRecordingAt?: string;
  /** Most-common tag across the last 7 days, used to personalise the
   *  prompt. Undefined when no tagged recent history. */
  recentTopTag?: string;
  onPress: () => void;
}

type Variant =
  | { kind: "fresh" }
  | { kind: "prompt"; tag?: string }
  | { kind: "gap"; days: number };

const GAP_THRESHOLD_HOURS = 48;

function resolveVariant(
  recordingsCount: number,
  lastRecordingAt: string | undefined,
  recentTopTag: string | undefined,
): Variant {
  if (recordingsCount === 0 || !lastRecordingAt) return { kind: "fresh" };
  const hoursSince = (Date.now() - parseISO(lastRecordingAt).getTime()) / 36e5;
  if (hoursSince > GAP_THRESHOLD_HOURS) {
    return { kind: "gap", days: Math.max(2, Math.floor(hoursSince / 24)) };
  }
  return { kind: "prompt", tag: recentTopTag };
}

function copyForVariant(v: Variant): { eyebrow: string; title: string; body: string } {
  switch (v.kind) {
    case "fresh":
      return {
        eyebrow: "GET STARTED",
        title: "Your first check-in",
        body: "30 seconds is enough — tell Sympnote how you've been.",
      };
    case "prompt":
      return {
        eyebrow: "TODAY'S CHECK-IN",
        title: v.tag ? `How's your ${v.tag} today?` : "What's on your mind?",
        body: "A quick note keeps your record warm.",
      };
    case "gap":
      return {
        eyebrow: `${v.days} DAYS QUIET`,
        title: "Pick up your record",
        body: "Even a 30-second note keeps your visit briefs sharp.",
      };
  }
}

/**
 * The home screen's evergreen "what to do next" surface, shown in the
 * Today section whenever there are no entries logged today. Adaptive
 * copy keyed off recording history:
 *
 *   • fresh   — user has never recorded
 *   • prompt  — user has recent activity (<48h); prompt is
 *               personalised with their top recent tag when one
 *               exists, otherwise a generic check-in
 *   • gap     — last entry was >48h ago; nudges them back
 *
 * Tapping the card opens /record where they can pick voice or type.
 */
export const TodayCheckIn: React.FC<TodayCheckInProps> = ({
  recordingsCount,
  lastRecordingAt,
  recentTopTag,
  onPress,
}) => {
  const { colors } = useTheme();
  const styles = useStyles();

  const variant = resolveVariant(recordingsCount, lastRecordingAt, recentTopTag);
  const { eyebrow, title, body } = copyForVariant(variant);

  const isGap = variant.kind === "gap";
  const eyebrowColor = isGap ? colors.coral : colors.accent;

  return (
    <Pressable
      onPress={() => {
        hapticLight();
        onPress();
      }}
      style={[
        styles.card,
        { backgroundColor: colors.bgSurface, borderColor: colors.border },
        shadows.card,
      ]}
      accessibilityRole="button"
      accessibilityLabel={`${title}. ${body}`}
    >
      <View style={[styles.icon, { backgroundColor: eyebrowColor + "1A" }]}>
        <Mic size={moderateScale(18)} color={eyebrowColor} strokeWidth={2} />
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={[styles.eyebrow, { color: eyebrowColor }]}>{eyebrow}</Text>
        <Text style={[styles.title, { color: colors.textPrimary }]} numberOfLines={1}>
          {title}
        </Text>
        <Text
          style={[styles.body, { color: colors.textTertiary }]}
          numberOfLines={2}
        >
          {body}
        </Text>
      </View>
    </Pressable>
  );
};

const useStyles = makeStyles((theme) => ({
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: moderateScale(12),
    paddingHorizontal: moderateScale(14),
    paddingVertical: moderateScale(12),
    borderRadius: theme.radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
  },
  icon: {
    width: moderateScale(40),
    height: moderateScale(40),
    borderRadius: moderateScale(11),
    alignItems: "center",
    justifyContent: "center",
  },
  eyebrow: {
    ...theme.typography.caption,
    fontFamily: "DMSans_700Bold",
    fontSize: fontScale(10),
    letterSpacing: 1.2,
  },
  title: {
    fontFamily: "DMSans_600SemiBold",
    fontSize: fontScale(15),
    letterSpacing: -0.1,
    marginTop: 2,
  },
  body: {
    ...theme.typography.caption,
    fontSize: fontScale(12),
    marginTop: 2,
    lineHeight: fontScale(17),
  },
}));
