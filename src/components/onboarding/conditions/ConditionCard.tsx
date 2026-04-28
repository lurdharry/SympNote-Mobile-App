import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { Check } from "lucide-react-native";
import {
  fontScale,
  makeStyles,
  moderateScale,
  useTheme,
} from "@/theme";

interface ConditionCardProps {
  label: string;
  Icon?: React.ComponentType<{ size?: number; color?: string; strokeWidth?: number }>;
  /** Optional bespoke tint per condition; falls back to the accent. */
  tint?: string;
  active: boolean;
  /** Stagger index for the entry animation. */
  index: number;
  onPress: () => void;
}

/**
 * One row in the conditions list on /onboarding/conditions. Tap-to-
 * toggle multi-select with an icon tile, label, and right-hand check
 * pip. Fades in with a staggered delay so the list reads as composed.
 */
export const ConditionCard: React.FC<ConditionCardProps> = ({
  label,
  Icon,
  tint,
  active,
  index,
  onPress,
}) => {
  const { colors } = useTheme();
  const styles = useStyles();
  const stripeColor = tint ?? colors.accent;

  return (
    <Animated.View entering={FadeInDown.delay(40 + index * 28).duration(320)}>
      <Pressable
        onPress={onPress}
        style={[
          styles.card,
          {
            backgroundColor: active ? colors.accent + "12" : colors.bgSurface,
            borderColor: active ? colors.accent : colors.border,
            borderWidth: active ? 1.5 : StyleSheet.hairlineWidth,
          },
        ]}
        accessibilityRole="button"
        accessibilityState={{ selected: active }}
        accessibilityLabel={label}
      >
        {Icon ? (
          <View style={[styles.iconTile, { backgroundColor: stripeColor + "1F" }]}>
            <Icon size={moderateScale(16)} color={stripeColor} strokeWidth={2.2} />
          </View>
        ) : null}
        <Text
          style={[
            styles.label,
            { color: active ? colors.accent : colors.textPrimary },
          ]}
          numberOfLines={1}
        >
          {label}
        </Text>
        <View
          style={[
            styles.checkPip,
            {
              backgroundColor: active ? colors.accent : "transparent",
              borderColor: active ? colors.accent : colors.border,
            },
          ]}
        >
          {active ? <Check size={moderateScale(11)} color="#FFFFFF" strokeWidth={3} /> : null}
        </View>
      </Pressable>
    </Animated.View>
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
  },
  iconTile: {
    width: moderateScale(30),
    height: moderateScale(30),
    borderRadius: moderateScale(9),
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    flex: 1,
    fontFamily: "DMSans_700Bold",
    fontSize: fontScale(14),
    letterSpacing: -0.1,
  },
  checkPip: {
    width: moderateScale(20),
    height: moderateScale(20),
    borderRadius: moderateScale(10),
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
}));
