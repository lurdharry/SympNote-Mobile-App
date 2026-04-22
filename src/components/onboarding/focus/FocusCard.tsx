import { FocusOption } from "@/constants/focus";
import { useTheme, moderateScale, fontScale, makeStyles, scale, verticalScale } from "@/theme";
import { Check } from "lucide-react-native";
import { useEffect } from "react";
import { Pressable, View, StyleSheet, Text } from "react-native";
import Animated, {
  Easing,
  useSharedValue,
  withDelay,
  withTiming,
  withSpring,
  useAnimatedStyle,
  interpolateColor,
} from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";

interface FocusCardProps {
  option: FocusOption;
  selected: boolean;
  index: number;
  onPress: () => void;
}

export const FocusCard: React.FC<FocusCardProps> = ({ option, selected, index, onPress }) => {
  const { colors } = useTheme();
  const styles = useStyles();

  const opacity = useSharedValue(0);
  const ty = useSharedValue(12);
  const selected$ = useSharedValue(selected ? 1 : 0);
  const press = useSharedValue(0);

  useEffect(() => {
    opacity.value = withDelay(
      120 + index * 60,
      withTiming(1, { duration: 360, easing: Easing.out(Easing.cubic) }),
    );
    ty.value = withDelay(120 + index * 60, withSpring(0, { damping: 18, stiffness: 140 }));
  }, [index, opacity, ty]);

  useEffect(() => {
    selected$.value = withSpring(selected ? 1 : 0, {
      damping: 18,
      stiffness: 180,
    });
  }, [selected, selected$]);

  const wrapStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      { translateY: ty.value },
      { scale: 1 + selected$.value * 0.015 - press.value * 0.02 },
    ],
    shadowOpacity: 0.08 + selected$.value * 0.22,
    shadowRadius: 12 + selected$.value * 14,
  }));

  const cardStyle = useAnimatedStyle(() => ({
    borderColor: interpolateColor(selected$.value, [0, 1], [colors.border, option.grad[1]]),
    backgroundColor: interpolateColor(selected$.value, [0, 1], [colors.bgSurface, "#FFFFFF"]),
  }));

  const checkStyle = useAnimatedStyle(() => ({
    opacity: selected$.value,
    transform: [{ scale: 0.6 + selected$.value * 0.4 }],
  }));

  // Real blurred glow under the tile — uses a native shadow in the
  // option's gradient-tail color so it reads as actual light, not a
  // hard-edged rectangle. Grows as the card becomes selected.
  const tileWrapStyle = useAnimatedStyle(() => ({
    shadowOpacity: selected$.value * 0.55,
    shadowRadius: 4 + selected$.value * 18,
  }));

  return (
    <Animated.View style={[styles.cardWrap, { shadowColor: option.grad[1] }, wrapStyle]}>
      <Pressable
        onPress={onPress}
        onPressIn={() => {
          press.value = withTiming(1, { duration: 120 });
        }}
        onPressOut={() => {
          press.value = withTiming(0, { duration: 220 });
        }}
        accessibilityRole="button"
        accessibilityLabel={option.t}
        accessibilityState={{ selected }}
      >
        <Animated.View style={[styles.card, cardStyle]}>
          {/* Gradient icon tile on the left — with a native blurred
              shadow in the option's tint as the selection "glow". */}
          <Animated.View style={[styles.tileWrap, { shadowColor: option.grad[1] }, tileWrapStyle]}>
            <View style={styles.tile}>
              <LinearGradient
                colors={option.grad}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFill}
              />
              <option.Icon size={moderateScale(22)} color={option.fg} strokeWidth={2} />
            </View>
          </Animated.View>

          {/* Content */}
          <View style={styles.content2}>
            <View style={styles.titleRow}>
              <Text style={[styles.title, { color: colors.textPrimary }]} numberOfLines={1}>
                {option.t}
              </Text>
              <Animated.View
                style={[styles.checkDot, { backgroundColor: option.grad[1] }, checkStyle]}
              >
                <Check size={moderateScale(12)} color="#FFFFFF" strokeWidth={3} />
              </Animated.View>
            </View>
            <Text style={[styles.sub, { color: colors.textSecondary }]} numberOfLines={2}>
              {option.s}
            </Text>

            <View style={styles.tags}>
              {option.examples.map((t) => (
                <View
                  key={t}
                  style={[
                    styles.tag,
                    {
                      backgroundColor: option.grad[1] + "14",
                      borderColor: option.grad[1] + "33",
                    },
                  ]}
                >
                  <Text style={[styles.tagText, { color: option.grad[1] }]}>{t}</Text>
                </View>
              ))}
            </View>
          </View>
        </Animated.View>
      </Pressable>
    </Animated.View>
  );
};

const useStyles = makeStyles((theme) => ({
  cardWrap: {
    borderRadius: theme.radius.lg,
    shadowOffset: { width: 0, height: moderateScale(6) },
    elevation: 4,
  },
  card: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: moderateScale(14),
    padding: moderateScale(14),
    borderRadius: theme.radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
  },
  tileWrap: {
    borderRadius: moderateScale(14),
    // Zero offset so the shadow reads as a centered halo, not a drop.
    shadowOffset: { width: 0, height: 0 },
    elevation: 0,
  },
  tile: {
    width: moderateScale(52),
    height: moderateScale(52),
    borderRadius: moderateScale(14),
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  content2: {
    flex: 1,
    minWidth: 0,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: moderateScale(8),
  },
  title: {
    ...theme.typography.h3,
    fontFamily: "DMSans_600SemiBold",
    flex: 1,
    letterSpacing: -0.1,
  },
  checkDot: {
    width: moderateScale(22),
    height: moderateScale(22),
    borderRadius: moderateScale(11),
    alignItems: "center",
    justifyContent: "center",
  },
  sub: {
    ...theme.typography.bodySmall,
    marginTop: moderateScale(2),
    lineHeight: fontScale(18),
  },
  tags: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: moderateScale(6),
    marginTop: moderateScale(10),
  },
  tag: {
    paddingHorizontal: scale(8),
    paddingVertical: verticalScale(3),
    borderRadius: theme.radius.full,
    borderWidth: StyleSheet.hairlineWidth,
  },
  tagText: {
    fontFamily: "DMSans_600SemiBold",
    fontSize: fontScale(11),
    letterSpacing: 0.2,
  },
}));
