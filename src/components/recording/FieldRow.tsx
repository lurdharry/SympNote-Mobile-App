import React, { useEffect } from "react";
import { StyleSheet, Text, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import {
  fontScale,
  makeStyles,
  moderateScale,
  useTheme,
} from "../../theme";

type LucideIcon = React.ComponentType<{
  size?: number;
  color?: string;
  strokeWidth?: number;
}>;

type Props = {
  label: string;
  value: string;
  active?: boolean;
  /**
   * Optional Lucide glyph rendered in a tinted left tile. Field rows
   * read more cleanly with iconography — the eye lands on the symbol
   * before parsing the label/value text.
   */
  Icon?: LucideIcon;
  /** Optional tile tint. Defaults to the theme accent. */
  tint?: string;
};

export const FieldRow: React.FC<Props> = ({
  label,
  value,
  active,
  Icon,
  tint,
}) => {
  const styles = useStyles();
  const { colors } = useTheme();
  const accent = tint ?? colors.accent;
  const bg = useSharedValue(0);

  useEffect(() => {
    if (active) {
      bg.value = withSequence(
        withTiming(1, { duration: 180 }),
        withTiming(0, { duration: 420 }),
      );
    }
  }, [active, bg]);

  const flashStyle = useAnimatedStyle(() => ({
    backgroundColor: `rgba(168,196,194,${bg.value * 0.8})`,
  }));

  return (
    <Animated.View style={[styles.row, flashStyle]}>
      {Icon ? (
        <View style={[styles.iconTile, { backgroundColor: accent + "1F" }]}>
          <Icon
            size={moderateScale(15)}
            color={accent}
            strokeWidth={2.2}
          />
        </View>
      ) : null}
      <View style={styles.copy}>
        <Text style={[styles.label, { color: colors.textTertiary }]}>
          {label}
        </Text>
        <Text style={[styles.value, { color: colors.textPrimary }]}>
          {value || "—"}
        </Text>
      </View>
    </Animated.View>
  );
};

const useStyles = makeStyles((theme) => ({
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: theme.spacing.s3,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    paddingHorizontal: theme.spacing.s4,
    paddingVertical: theme.spacing.s3,
    marginBottom: theme.spacing.s3,
  },
  iconTile: {
    width: moderateScale(32),
    height: moderateScale(32),
    borderRadius: moderateScale(10),
    alignItems: "center",
    justifyContent: "center",
    marginTop: moderateScale(2),
  },
  copy: {
    flex: 1,
    minWidth: 0,
  },
  label: {
    ...theme.typography.label,
  },
  value: {
    ...theme.typography.bodyLarge,
    fontSize: fontScale(15),
    lineHeight: fontScale(21),
    marginTop: moderateScale(2),
  },
}));
