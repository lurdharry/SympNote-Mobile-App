import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Flame, Mic } from "lucide-react-native";
import {
  fontScale,
  makeStyles,
  moderateScale,
  shadows,
  spacing,
  typography,
  useTheme,
  verticalScale,
} from "@/theme";

interface StatusHeaderProps {
  recordingsCount: number;
  streak: number;
  level: number;
}

/**
 * Settings landing card. The app doesn't collect a username, so the
 * header isn't an identity card — it's a *status* card. Three numbers
 * the user actually cares about: entries, streak, level. A subtle
 * teal-to-gold gradient ribbon at the top ties the card to the brand
 * without putting a fake avatar on a profile that doesn't exist.
 */
export const StatusHeader: React.FC<StatusHeaderProps> = ({
  recordingsCount,
  streak,
  level,
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
      {/* Subtle gradient ribbon — brand without fake-avatar baggage. */}
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
          label={recordingsCount === 1 ? "entry" : "entries"}
        />
        <View style={[styles.divider, { backgroundColor: colors.border }]} />
        <Stat
          Icon={Flame}
          tint={colors.coral}
          value={streak.toString()}
          label={streak === 1 ? "day streak" : "day streak"}
        />
        <View style={[styles.divider, { backgroundColor: colors.border }]} />
        <Stat
          Icon={null}
          tint={colors.gold}
          value={`Lv ${level}`}
          label="level"
        />
      </View>
    </View>
  );
};

interface StatProps {
  Icon: typeof Mic | null;
  tint: string;
  value: string;
  label: string;
}

const Stat: React.FC<StatProps> = ({ Icon, tint, value, label }) => {
  const { colors } = useTheme();
  const styles = useStyles();
  return (
    <View style={styles.stat}>
      {Icon && (
        <View style={[styles.statIcon, { backgroundColor: tint + "1F" }]}>
          <Icon size={moderateScale(13)} color={tint} strokeWidth={2.2} />
        </View>
      )}
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
    marginBottom: verticalScale(12),
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
    width: moderateScale(28),
    height: moderateScale(28),
    borderRadius: moderateScale(14),
    alignItems: "center",
    justifyContent: "center",
    marginBottom: moderateScale(2),
  },
  statValue: {
    ...theme.typography.h2,
    fontFamily: "Fraunces_500Medium",
    letterSpacing: -0.5,
    fontSize: fontScale(22),
  },
  statLabel: {
    ...theme.typography.caption,
    fontFamily: "DMSans_500Medium",
  },
  divider: {
    width: StyleSheet.hairlineWidth,
    height: verticalScale(40),
    marginHorizontal: moderateScale(8),
  },
}));
