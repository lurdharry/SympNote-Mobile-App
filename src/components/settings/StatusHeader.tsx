import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { ClipboardList, Mic } from "lucide-react-native";
import {
  fontScale,
  makeStyles,
  moderateScale,
  shadows,
  spacing,
  useTheme,
  verticalScale,
} from "@/theme";

interface StatusHeaderProps {
  recordingsCount: number;
  summariesCount: number;
}

/**
 * Settings landing card. The app doesn't collect a username, so the
 * header isn't an identity card — it's a *status* card, and the two
 * numbers it shows are honest reflections of value the app actually
 * delivered: recordings captured, and visit briefs prepped.
 *
 * No streak, no level, no XP — those were game-mechanic borrows
 * that implied "more is better" in a clinical context where it
 * isn't.
 */
export const StatusHeader: React.FC<StatusHeaderProps> = ({
  recordingsCount,
  summariesCount,
}) => {
  const { colors } = useTheme();
  const styles = useStyles();

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: colors.bgSurface, borderColor: colors.border },
        shadows.card,
      ]}
    >
      <LinearGradient
        colors={[colors.accent + "1F", colors.gold + "16", colors.accent + "00"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.ribbon}
        pointerEvents="none"
      />

      <Text style={[styles.eyebrow, { color: colors.textTertiary }]}>
        YOUR JOURNEY
      </Text>
      <View style={styles.statsRow}>
        <Stat
          Icon={Mic}
          tint={colors.accent}
          value={recordingsCount.toString()}
          label={recordingsCount === 1 ? "recording" : "recordings"}
        />
        <View style={[styles.divider, { backgroundColor: colors.border }]} />
        <Stat
          Icon={ClipboardList}
          tint={colors.gold}
          value={summariesCount.toString()}
          label={summariesCount === 1 ? "brief prepped" : "briefs prepped"}
        />
      </View>
    </View>
  );
};

interface StatProps {
  Icon: typeof Mic;
  tint: string;
  value: string;
  label: string;
}

const Stat: React.FC<StatProps> = ({ Icon, tint, value, label }) => {
  const { colors } = useTheme();
  const styles = useStyles();
  return (
    <View style={styles.stat}>
      <View style={[styles.statIcon, { backgroundColor: tint + "1F" }]}>
        <Icon size={moderateScale(14)} color={tint} strokeWidth={2.2} />
      </View>
      <Text style={[styles.statValue, { color: colors.textPrimary }]}>
        {value}
      </Text>
      <Text style={[styles.statLabel, { color: colors.textTertiary }]}>
        {label}
      </Text>
    </View>
  );
};

const useStyles = makeStyles((theme) => ({
  card: {
    position: "relative",
    paddingVertical: spacing.s5,
    paddingHorizontal: spacing.s5,
    borderRadius: theme.radius.xl,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: "hidden",
  },
  ribbon: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: verticalScale(80),
  },
  eyebrow: {
    fontFamily: "DMSans_700Bold",
    fontSize: fontScale(10),
    letterSpacing: 1.4,
    marginBottom: verticalScale(14),
  },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  stat: {
    flex: 1,
    alignItems: "center",
    gap: moderateScale(4),
  },
  statIcon: {
    width: moderateScale(30),
    height: moderateScale(30),
    borderRadius: moderateScale(15),
    alignItems: "center",
    justifyContent: "center",
    marginBottom: moderateScale(2),
  },
  statValue: {
    ...theme.typography.h2,
    fontFamily: "Fraunces_500Medium",
    letterSpacing: -0.5,
    fontSize: fontScale(26),
  },
  statLabel: {
    ...theme.typography.caption,
    fontFamily: "DMSans_500Medium",
  },
  divider: {
    width: StyleSheet.hairlineWidth,
    height: verticalScale(48),
    marginHorizontal: moderateScale(12),
  },
}));
