import React from "react";
import { StyleSheet, Text, View } from "react-native";
import {
  fontScale,
  makeStyles,
  moderateScale,
  scale,
  useTheme,
  verticalScale,
} from "@/theme";

type LucideIcon = React.ComponentType<{ size?: number; color?: string; strokeWidth?: number }>;

interface TrustChipProps {
  Icon: LucideIcon;
  label: string;
  /** Distinct accent per chip so the row reads as three different
   *  promises (speed · privacy · capability) instead of identical
   *  stickers. */
  tint: string;
}

/**
 * Trust signal chip on the onboarding hook screen. Small rounded
 * surface anchored by its own tinted icon tile.
 */
export const TrustChip: React.FC<TrustChipProps> = ({ Icon, label, tint }) => {
  const { colors } = useTheme();
  const styles = useStyles();
  return (
    <View style={styles.chip}>
      <View style={[styles.tile, { backgroundColor: tint + "1F" }]}>
        <Icon size={moderateScale(11)} color={tint} strokeWidth={2.4} />
      </View>
      <Text style={[styles.label, { color: colors.textPrimary }]}>{label}</Text>
    </View>
  );
};

const useStyles = makeStyles((theme) => ({
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: moderateScale(6),
    paddingLeft: scale(6),
    paddingRight: scale(12),
    paddingVertical: verticalScale(5),
    borderRadius: theme.radius.full,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.bgSurface,
    ...theme.shadows.card,
  },
  tile: {
    width: moderateScale(22),
    height: moderateScale(22),
    borderRadius: moderateScale(7),
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    fontFamily: "DMSans_600SemiBold",
    fontSize: fontScale(12),
    letterSpacing: 0.1,
  },
}));
