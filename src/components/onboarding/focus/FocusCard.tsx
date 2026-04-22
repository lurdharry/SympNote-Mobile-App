import { FocusOption } from "@/constants/focus";
import {
  fontScale,
  makeStyles,
  moderateScale,
  scale,
  useTheme,
  verticalScale,
} from "@/theme";
import { Check } from "lucide-react-native";
import { useEffect } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated, {
  Easing,
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";

interface FocusCardProps {
  option: FocusOption;
  selected: boolean;
  index: number;
  onPress: () => void;
}

export const FocusCard: React.FC<FocusCardProps> = ({
  option,
  selected,
  index,
  onPress,
}) => {
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
    ty.value = withDelay(
      120 + index * 60,
      withSpring(0, { damping: 18, stiffness: 140 }),
    );
  }, [index, opacity, ty]);

  useEffect(() => {
    selected$.value = withSpring(selected ? 1 : 0, {
      damping: 24,
      stiffness: 220,
    });
  }, [selected, selected$]);

  const wrapStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      { translateY: ty.value },
      { scale: 1 + selected$.value * 0.015 - press.value * 0.02 },
    ],
  }));

  const cardStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      selected$.value,
      [0, 1],
      [colors.bgSurface, "#FFFFFF"],
    ),
  }));

  // Selection ring rides in its own layer so the card's clip mask stays
  // border-free (hairline-on-clipped-rounded views rasterize aliased
  // outlines at the corners during transforms).
  const ringStyle = useAnimatedStyle(() => ({
    opacity: selected$.value,
  }));

  const checkStyle = useAnimatedStyle(() => ({
    opacity: selected$.value,
    transform: [{ scale: 0.6 + selected$.value * 0.4 }],
  }));

  // Tile glow — fades in/out via opacity only. shadowRadius is static
  // (see styles.tileWrap) because animating it re-runs the Gaussian
  // blur per-frame and flickers at the edges.
  const tileWrapStyle = useAnimatedStyle(() => ({
    shadowOpacity: selected$.value * 0.55,
  }));

  return (
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
      <Animated.View style={[styles.card, wrapStyle, cardStyle]}>
        <Animated.View
          style={[
            styles.tileWrap,
            { shadowColor: option.grad[1], backgroundColor: option.grad[1] },
            tileWrapStyle,
          ]}
        >
          <View style={styles.tile}>
            <LinearGradient
              colors={option.grad}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
            <option.Icon
              size={moderateScale(22)}
              color={option.fg}
              strokeWidth={2}
            />
          </View>
        </Animated.View>

        <View style={styles.content}>
          <View style={styles.titleRow}>
            <Text
              style={[styles.title, { color: colors.textPrimary }]}
              numberOfLines={1}
            >
              {option.t}
            </Text>
            <Animated.View
              style={[styles.checkDot, { backgroundColor: option.grad[1] }, checkStyle]}
            >
              <Check size={moderateScale(12)} color="#FFFFFF" strokeWidth={3} />
            </Animated.View>
          </View>
          <Text
            style={[styles.sub, { color: colors.textSecondary }]}
            numberOfLines={2}
          >
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
                <Text style={[styles.tagText, { color: option.grad[1] }]}>
                  {t}
                </Text>
              </View>
            ))}
          </View>
        </View>

        <Animated.View
          pointerEvents="none"
          style={[styles.ring, { borderColor: option.grad[1] }, ringStyle]}
        />
      </Animated.View>
    </Pressable>
  );
};

const useStyles = makeStyles((theme) => ({
  card: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: moderateScale(14),
    padding: moderateScale(14),
    borderRadius: theme.radius.lg,
    overflow: "hidden",
  },
  ring: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: theme.radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
  },
  tileWrap: {
    borderRadius: moderateScale(14),
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: moderateScale(14),
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
  content: {
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
