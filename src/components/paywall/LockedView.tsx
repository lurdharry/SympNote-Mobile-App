import React, { useEffect } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { Check, X as XIcon } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { fontScale, makeStyles, moderateScale, typography, useTheme, verticalScale } from "@/theme";
import { hapticLight } from "@/services/haptics";

type LucideIcon = React.ComponentType<{
  size?: number;
  color?: string;
  strokeWidth?: number;
}>;

export interface LockedViewProps {
  /** Screen-name eyebrow in caps (e.g. "INSIGHTS"). Optional. */
  eyebrow?: string;
  /** Aspirational headline. What this screen does, in the user's voice. */
  title: string;
  /** One-line pitch under the headline. Sell the moment, not the gate. */
  description: string;
  /** Optional 2–3 bullets — what the user will see in this screen. */
  bullets?: readonly string[];
  /** Mascot or glyph for the top of the screen. Renders at ~moderateScale(140)
   *  and animates with a gentle bob + breath. Pass a mascot, not a flat icon. */
  Icon: LucideIcon;
  /** Action label, in the screen's natural verb ("View insights",
   *  "Start recording"). Never subscription-y ("Try Plus", "Unlock"). */
  ctaLabel: string;
  /** Optional dismiss handler. When set, renders a top-right X button
   *  so modal-presented gates have an escape hatch. Tab-presented
   *  gates (insights) leave this undefined — the tab bar handles nav. */
  onClose?: () => void;
}

const MASCOT_SIZE = moderateScale(140);

export const LockedView: React.FC<LockedViewProps> = ({
  eyebrow,
  title,
  description,
  bullets,
  Icon,
  ctaLabel,
  onClose,
}) => {
  const router = useRouter();
  const { colors } = useTheme();
  const styles = useStyles();
  const insets = useSafeAreaInsets();

  // Bob: gentle vertical float, ~2s round trip.
  const bob = useSharedValue(0);
  // Breath: subtle scale, slightly faster than bob so the two cycles
  // drift in/out of sync — gives the character a more organic feel
  // than a single periodic motion.
  const breath = useSharedValue(1);

  useEffect(() => {
    bob.value = withRepeat(
      withSequence(
        withTiming(-6, { duration: 1100, easing: Easing.inOut(Easing.quad) }),
        withTiming(0, { duration: 1100, easing: Easing.inOut(Easing.quad) }),
      ),
      -1,
      false,
    );
    breath.value = withRepeat(
      withSequence(
        withTiming(1.04, { duration: 1500, easing: Easing.inOut(Easing.sin) }),
        withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
      false,
    );
  }, [bob, breath]);

  const mascotStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: bob.value }, { scale: breath.value }],
  }));

  const onPress = () => {
    hapticLight();
    router.push("/paywall");
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.bgPrimary }]}>
      <View pointerEvents="none" style={styles.aurora}>
        <LinearGradient
          colors={[colors.accent + "1A", colors.accent + "00"]}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
      </View>

      {onClose ? (
        <Pressable
          onPress={() => {
            hapticLight();
            onClose();
          }}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel="Close"
          style={[
            styles.closeBtn,
            {
              top: insets.top + moderateScale(8),
              backgroundColor: colors.bgMuted,
            },
          ]}
        >
          <XIcon size={moderateScale(18)} color={colors.textPrimary} strokeWidth={2} />
        </Pressable>
      ) : null}

      <View style={styles.center}>
        <Animated.View style={[styles.mascotSlot, mascotStyle]}>
          <Icon size={MASCOT_SIZE} color={colors.accent} strokeWidth={2} />
        </Animated.View>

        {eyebrow ? <Text style={[styles.eyebrow, { color: colors.accent }]}>{eyebrow}</Text> : null}
        <Text style={[styles.title, { color: colors.textPrimary }]}>{title}</Text>
        <Text style={[styles.description, { color: colors.textSecondary }]}>{description}</Text>

        {bullets && bullets.length > 0 && (
          <View style={styles.bullets}>
            {bullets.map((b) => (
              <View key={b} style={styles.bulletRow}>
                <View style={[styles.bulletDot, { backgroundColor: colors.accent + "26" }]}>
                  <Check size={moderateScale(11)} color={colors.accent} strokeWidth={2.6} />
                </View>
                <Text style={[styles.bulletText, { color: colors.textSecondary }]}>{b}</Text>
              </View>
            ))}
          </View>
        )}

        <Pressable
          onPress={onPress}
          style={[styles.cta, { backgroundColor: colors.accent }]}
          accessibilityRole="button"
          accessibilityLabel={ctaLabel}
        >
          <Text style={styles.ctaText}>{ctaLabel}</Text>
        </Pressable>
      </View>
    </View>
  );
};

const useStyles = makeStyles((theme) => ({
  root: {
    flex: 1,
    overflow: "hidden",
  },
  aurora: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: verticalScale(360),
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: theme.spacing.s8,
    gap: moderateScale(12),
  },
  mascotSlot: {
    width: MASCOT_SIZE,
    height: MASCOT_SIZE,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: moderateScale(4),
  },
  closeBtn: {
    position: "absolute",
    right: moderateScale(16),
    width: moderateScale(36),
    height: moderateScale(36),
    borderRadius: moderateScale(18),
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
  },
  eyebrow: {
    fontFamily: "DMSans_700Bold",
    fontSize: fontScale(10),
    letterSpacing: 1.4,
  },
  title: {
    ...typography.h1,
    fontFamily: "Fraunces_500Medium",
    fontSize: fontScale(26),
    lineHeight: fontScale(32),
    letterSpacing: -0.4,
    textAlign: "center",
    fontStyle: "italic",
  },
  description: {
    ...typography.body,
    fontSize: fontScale(14),
    lineHeight: fontScale(20),
    textAlign: "center",
    maxWidth: moderateScale(300),
  },
  bullets: {
    width: "100%",
    maxWidth: moderateScale(320),
    gap: moderateScale(10),
    marginTop: moderateScale(6),
  },
  bulletRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: moderateScale(10),
  },
  bulletDot: {
    width: moderateScale(20),
    height: moderateScale(20),
    borderRadius: moderateScale(7),
    alignItems: "center",
    justifyContent: "center",
    marginTop: moderateScale(1),
  },
  bulletText: {
    flex: 1,
    fontFamily: "DMSans_500Medium",
    fontSize: fontScale(13.5),
    lineHeight: fontScale(19),
  },
  cta: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: moderateScale(24),
    paddingVertical: moderateScale(13),
    borderRadius: theme.radius.full,
    marginTop: moderateScale(8),
    ...theme.shadows.accentGlow,
  },
  ctaText: {
    color: "#FFFFFF",
    fontFamily: "DMSans_700Bold",
    fontSize: fontScale(14),
    letterSpacing: -0.05,
  },
}));
