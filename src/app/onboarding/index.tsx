import React, { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from "react-native-reanimated";
import { Heart, Sparkles, Zap } from "lucide-react-native";
import {
  fontScale,
  makeStyles,
  moderateScale,
  scale,
  spacing,
  typography,
  useTheme,
  verticalScale,
} from "../../theme";
import { SceneTransition } from "../../components/navigation/SceneTransition";
import { SympnoteHero } from "../../components/brand/SympnoteHero";
import { PrimaryButton } from "../../components/ui/PrimaryButton";
import { useReducedMotion } from "../../hooks/useReducedMotion";
import { FULL_HEADLINE } from "../../constants/onboarding";
import { resetAppState } from "../../utils/resetApp";
import { hapticMedium } from "../../services/haptics";
import { SympnoteMark } from "@/components/brand/SympnoteMark";

const ScreenHook: React.FC = () => {
  const router = useRouter();
  const { colors } = useTheme();
  const styles = useStyles();
  const reduced = useReducedMotion();

  const [typed, setTyped] = useState(reduced ? FULL_HEADLINE : "");

  useEffect(() => {
    if (reduced) return;
    let i = 0;
    const id = setInterval(() => {
      i += 1;
      setTyped(FULL_HEADLINE.slice(0, i));
      if (i >= FULL_HEADLINE.length) clearInterval(id);
    }, 30);
    return () => clearInterval(id);
  }, [reduced]);

  const headerOp = useSharedValue(0);
  const heroOp = useSharedValue(0);
  const subOp = useSharedValue(0);
  const chipsOp = useSharedValue(0);
  const ctaOp = useSharedValue(0);

  useEffect(() => {
    const dur = { duration: 520, easing: Easing.bezier(0.2, 0.8, 0.2, 1) };
    headerOp.value = withTiming(1, dur);
    heroOp.value = withDelay(150, withTiming(1, dur));
    subOp.value = withDelay(1200, withTiming(1, dur));
    chipsOp.value = withDelay(1400, withTiming(1, dur));
    ctaOp.value = withDelay(1600, withTiming(1, dur));
  }, [headerOp, heroOp, subOp, chipsOp, ctaOp]);

  const hero = useAnimatedStyle(() => ({
    opacity: heroOp.value,
    transform: [{ translateY: (1 - heroOp.value) * 12 }],
  }));
  const sub = useAnimatedStyle(() => ({
    opacity: subOp.value,
    transform: [{ translateY: (1 - subOp.value) * 12 }],
  }));
  const chips = useAnimatedStyle(() => ({
    opacity: chipsOp.value,
    transform: [{ translateY: (1 - chipsOp.value) * 12 }],
  }));
  const cta = useAnimatedStyle(() => ({
    opacity: ctaOp.value,
    transform: [{ translateY: (1 - ctaOp.value) * 12 }],
  }));

  const handleGetStarted = () => {
    router.push("/onboarding/questions");
  };

  const handleDevReset = () => {
    hapticMedium();
    resetAppState();
    router.replace("/onboarding");
  };

  return (
    <SceneTransition mode="crossfade-parallax-up">
      <View style={[styles.root, { backgroundColor: colors.bgPrimary }]}>
        <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
          {__DEV__ && (
            <View style={styles.devBar}>
              <Pressable
                onPress={handleDevReset}
                hitSlop={10}
                style={[styles.devPill, { borderColor: colors.border }]}
                accessibilityLabel="Dev: reset app"
              >
                <Text style={[styles.devPillText, { color: colors.textTertiary }]}>
                  DEV · Reset
                </Text>
              </Pressable>
            </View>
          )}
          <View style={styles.heroArea}>
            <Animated.View style={[{ marginBottom: spacing.s6 }, hero]}>
              <SympnoteHero size={124} />
            </Animated.View>
            <View style={styles.headlineSlot}>
              <Text
                aria-hidden
                accessibilityElementsHidden
                importantForAccessibility="no"
                style={[
                  typography.display,
                  styles.headlineGhost,
                  { paddingHorizontal: spacing.s2 },
                ]}
              >
                {FULL_HEADLINE}
              </Text>
              <Text
                style={[
                  typography.display,
                  styles.headlineLive,
                  {
                    color: colors.textPrimary,
                    paddingHorizontal: spacing.s2,
                  },
                ]}
              >
                {typed}
                {typed.length < FULL_HEADLINE.length && (
                  <Text style={{ color: colors.accent }}>▍</Text>
                )}
              </Text>
            </View>

            <Animated.Text
              style={[
                typography.bodyLarge,
                {
                  color: colors.textSecondary,
                  textAlign: "center",
                  marginTop: spacing.s4,
                },
                sub,
              ]}
            >
              Record. Organize. Walk in ready.
            </Animated.Text>

            <Animated.View style={[styles.chips, chips]}>
              <TrustChip Icon={Zap} label="Under 2 min" tint={colors.accent} />
              <TrustChip Icon={Heart} label="Private by default" tint={colors.success} />
              <TrustChip Icon={Sparkles} label="Doctor-ready notes" tint={colors.gold} />
            </Animated.View>
          </View>

          {/* CTA */}
          <Animated.View style={[styles.ctaArea, cta]}>
            <PrimaryButton label="Get started · Free" onPress={handleGetStarted} />
          </Animated.View>
        </SafeAreaView>
      </View>
    </SceneTransition>
  );
};

type LucideIcon = typeof Zap;

/**
 * Trust signal chip — a small rounded surface anchored by its own
 * tinted icon tile. Each chip carries a distinct accent color so the
 * three signals read as three different promises (speed · privacy ·
 * capability) instead of a row of identical stickers.
 */
interface TrustChipProps {
  Icon: LucideIcon;
  label: string;
  tint: string;
}

const TrustChip: React.FC<TrustChipProps> = ({ Icon, label, tint }) => {
  const { colors } = useTheme();
  const styles = useStyles();
  return (
    <View style={styles.trustChip}>
      <View style={[styles.trustTile, { backgroundColor: tint + "1F" }]}>
        <Icon size={moderateScale(11)} color={tint} strokeWidth={2.4} />
      </View>
      <Text style={[styles.trustLabel, { color: colors.textPrimary }]}>{label}</Text>
    </View>
  );
};

export default ScreenHook;

const useStyles = makeStyles((theme) => ({
  root: { flex: 1 },
  safe: { flex: 1 },
  topBar: {
    paddingHorizontal: theme.spacing.s6,
    paddingTop: theme.spacing.s4,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.s2,
  },
  heroArea: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: theme.spacing.s6,
    marginTop: -theme.spacing.s6,
  },
  headlineSlot: {
    alignSelf: "stretch",
    position: "relative",
  },
  headlineGhost: {
    color: "transparent",
    textAlign: "center",
  },
  headlineLive: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    textAlign: "center",
  },
  chips: {
    marginTop: theme.spacing.s6,
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: theme.spacing.s2,
  },
  trustChip: {
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
  trustTile: {
    width: moderateScale(22),
    height: moderateScale(22),
    borderRadius: moderateScale(7),
    alignItems: "center",
    justifyContent: "center",
  },
  trustLabel: {
    fontFamily: "DMSans_600SemiBold",
    fontSize: fontScale(12),
    letterSpacing: 0.1,
  },
  ctaArea: {
    paddingHorizontal: theme.spacing.s6,
    paddingBottom: theme.spacing.s10,
  },
  devBar: {
    paddingHorizontal: theme.spacing.s4,
    paddingTop: theme.spacing.s2,
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  devPill: {
    paddingHorizontal: scale(10),
    paddingVertical: verticalScale(4),
    borderRadius: theme.radius.full,
    borderWidth: StyleSheet.hairlineWidth,
    backgroundColor: "transparent",
  },
  devPillText: {
    fontFamily: "DMSans_700Bold",
    fontSize: fontScale(10),
    letterSpacing: 0.9,
  },
}));
