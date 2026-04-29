import React, { useEffect } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { Check } from "lucide-react-native";
import {
  fontScale,
  makeStyles,
  moderateScale,
  scale,
  shadows,
  useTheme,
  verticalScale,
} from "../../../theme";
import { PlanDef } from "../../../constants/plans";
import { hapticSelect } from "../../../services/haptics";

interface PlanCardProps {
  plan: PlanDef;
  index: number;
  selected: boolean;
  onSelect: () => void;
}

export const PlanCard: React.FC<PlanCardProps> = ({ plan, index, selected, onSelect }) => {
  const { colors } = useTheme();
  const styles = useStyles();
  const opacity = useSharedValue(0);
  const ty = useSharedValue(10);
  const bounce = useSharedValue(1);

  useEffect(() => {
    opacity.value = withDelay(
      240 + index * 80,
      withTiming(1, { duration: 320, easing: Easing.out(Easing.cubic) }),
    );
    ty.value = withDelay(240 + index * 80, withSpring(0, { damping: 18, stiffness: 140 }));
  }, [index, opacity, ty]);

  // Punchy spring whenever this card becomes the selected one.
  useEffect(() => {
    if (!selected) return;
    bounce.value = withSequence(
      withTiming(0.96, { duration: 80, easing: Easing.out(Easing.cubic) }),
      withSpring(1, { damping: 6, stiffness: 220, mass: 0.6 }),
    );
  }, [selected, bounce]);

  const enter = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: ty.value }, { scale: bounce.value }],
  }));

  return (
    <Animated.View style={[styles.planOuter, enter]}>
      {plan.saveBadge && (
        <View style={styles.saveRibbon}>
          <Text style={styles.saveRibbonText}>{plan.saveBadge}</Text>
        </View>
      )}
      <Pressable
        onPress={() => {
          hapticSelect();
          onSelect();
        }}
        style={[
          styles.plan,
          {
            backgroundColor: colors.bgSurface,
            borderColor: selected ? colors.accent : colors.border,
            borderWidth: selected ? 2 : StyleSheet.hairlineWidth,
          },
          shadows.card,
        ]}
        accessibilityRole="button"
        accessibilityLabel={`${plan.label} plan, ${plan.price} ${plan.per}`}
        accessibilityState={{ selected }}
      >
        <View style={styles.planRow}>
          {/* Left column — name + small badge + subline */}
          <View style={{ flex: 1, minWidth: 0 }}>
            <View style={styles.planHeadRow}>
              <Text style={[styles.planLabel, { color: colors.textPrimary }]}>{plan.label}</Text>
              {plan.trialBadge && (
                <View
                  style={[
                    styles.miniBadge,
                    {
                      backgroundColor: colors.accent + "1A",
                      borderColor: colors.accent + "33",
                    },
                  ]}
                >
                  <Text style={[styles.miniBadgeText, { color: colors.accent }]}>
                    {plan.trialBadge}
                  </Text>
                </View>
              )}
              {plan.valueBadge && (
                <View
                  style={[
                    styles.miniBadge,
                    {
                      backgroundColor: colors.success + "1A",
                      borderColor: colors.success + "33",
                    },
                  ]}
                >
                  <Text style={[styles.miniBadgeText, { color: colors.success }]}>
                    {plan.valueBadge}
                  </Text>
                </View>
              )}
            </View>
            {plan.subline && (
              <Text style={[styles.planSubline, { color: colors.textTertiary }]} numberOfLines={1}>
                {plan.subline}
              </Text>
            )}
          </View>

          {/* Middle — price stack */}
          <View style={styles.priceStack}>
            <Text>
              {plan.originalPrice ? (
                <Text
                  style={[styles.planOriginal, { color: colors.textTertiary }]}
                  accessibilityLabel={`Was ${plan.originalPrice}`}
                >
                  {plan.originalPrice}
                </Text>
              ) : null}
              <Text style={[styles.planPrice, { color: colors.textPrimary }]}> {plan.price}</Text>
            </Text>
            <Text style={[styles.planPer, { color: colors.textTertiary }]}>{plan.per}</Text>
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
};

const useStyles = makeStyles((theme) => ({
  planOuter: {
    position: "relative",
  },
  plan: {
    paddingHorizontal: moderateScale(16),
    paddingVertical: moderateScale(14),
    borderRadius: theme.radius.lg,
    position: "relative",
  },
  planRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: moderateScale(10),
  },
  planHeadRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: moderateScale(8),
    flexWrap: "wrap",
  },
  planLabel: {
    fontFamily: "DMSans_700Bold",
    fontSize: fontScale(17),
    letterSpacing: -0.2,
  },
  planSubline: {
    fontFamily: "DMSans_500Medium",
    fontSize: fontScale(12),
    marginTop: 4,
  },
  miniBadge: {
    paddingHorizontal: scale(8),
    paddingVertical: verticalScale(3),
    borderRadius: theme.radius.full,
    borderWidth: StyleSheet.hairlineWidth,
  },
  miniBadgeText: {
    fontFamily: "DMSans_700Bold",
    fontSize: fontScale(10),
    letterSpacing: 0.4,
  },
  priceStack: {
    alignItems: "flex-end",
  },
  planOriginal: {
    fontFamily: "DMSans_500Medium",
    fontSize: fontScale(12),
    textDecorationLine: "line-through",
    textDecorationStyle: "solid",
    letterSpacing: 0.1,
    marginBottom: 1,
  },
  planPrice: {
    fontFamily: "DMSans_700Bold",
    fontSize: fontScale(18),
    letterSpacing: -0.4,
  },
  planPer: {
    fontFamily: "DMSans_500Medium",
    fontSize: fontScale(11),
    marginTop: 2,
  },
  radio: {
    width: moderateScale(24),
    height: moderateScale(24),
    borderRadius: moderateScale(12),
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  saveRibbon: {
    position: "absolute",
    top: 0,
    right: 0,
    paddingHorizontal: scale(10),
    paddingVertical: verticalScale(1.5),
    borderTopRightRadius: theme.radius.lg,
    borderBottomLeftRadius: theme.radius.md,
    backgroundColor: "#5A8F6E",
    zIndex: 2,
  },
  saveRibbonText: {
    color: "#FFFFFF",
    fontFamily: "DMSans_700Bold",
    fontSize: fontScale(10),
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },
}));
