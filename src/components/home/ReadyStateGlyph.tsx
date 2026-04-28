import React from "react";
import { View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Sparkles } from "lucide-react-native";
import { makeStyles, moderateScale, useTheme } from "@/theme";

type LucideIcon = React.ComponentType<{
  size?: number;
  color?: string;
  strokeWidth?: number;
}>;

interface ReadyStateGlyphProps {
  /** Primary icon for this state — varies per kind (Calendar, Mic,
   *  Sparkles, etc.). */
  Icon: LucideIcon;
  /** Tint color for the glyph and the accent sparkles. Drives the
   *  brand voice for this state — coral for urgency, gold for ready,
   *  accent for routine. */
  tint: string;
}

/**
 * Stylized corner illustration for the home `ReadyStateCard`. Reads
 * as "the brand character of this moment" — a soft accent blob
 * holding a state-specific icon, with two sparkle accents floating
 * around it. Lighter weight than a full mascot but still feels
 * illustrated, not a stock UI tile.
 */
export const ReadyStateGlyph: React.FC<ReadyStateGlyphProps> = ({ Icon, tint }) => {
  const { colors } = useTheme();
  const styles = useStyles();
  return (
    <View style={styles.wrap} pointerEvents="none">
      {/* Outer halo */}
      <View style={[styles.halo, { backgroundColor: tint + "1A" }]}>
        {/* Inner blob with gradient */}
        <LinearGradient
          colors={[tint + "33", tint + "00"]}
          start={{ x: 0.2, y: 0.1 }}
          end={{ x: 1, y: 1 }}
          style={styles.blob}
        />
        <View style={styles.iconWrap}>
          <Icon size={moderateScale(28)} color={tint} strokeWidth={2.2} />
        </View>
      </View>
      {/* Sparkle accents */}
      <View style={[styles.spark, styles.sparkA]}>
        <Sparkles size={moderateScale(11)} color={tint} strokeWidth={2.4} />
      </View>
      <View style={[styles.spark, styles.sparkB]}>
        <Sparkles size={moderateScale(8)} color={tint} strokeWidth={2.4} />
      </View>
      {/* Soft cream shadow disc behind for depth (light mode only — uses
          surface color which adapts in dark). */}
      <View
        pointerEvents="none"
        style={[
          styles.shadowDisc,
          { backgroundColor: colors.bgSurface, opacity: 0 },
        ]}
      />
    </View>
  );
};

const useStyles = makeStyles(() => ({
  wrap: {
    width: moderateScale(82),
    height: moderateScale(82),
    alignItems: "center",
    justifyContent: "center",
  },
  halo: {
    width: moderateScale(74),
    height: moderateScale(74),
    borderRadius: moderateScale(40),
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  blob: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  iconWrap: {
    alignItems: "center",
    justifyContent: "center",
  },
  spark: {
    position: "absolute",
  },
  sparkA: {
    top: moderateScale(2),
    right: moderateScale(2),
  },
  sparkB: {
    bottom: moderateScale(6),
    left: moderateScale(2),
  },
  shadowDisc: {
    position: "absolute",
    width: moderateScale(74),
    height: moderateScale(74),
    borderRadius: moderateScale(40),
  },
}));
