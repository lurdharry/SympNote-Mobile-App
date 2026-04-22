import React, { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from "react-native-reanimated";
import { Zap, Heart, Sparkles } from "lucide-react-native";
import { makeStyles, spacing, typography, useTheme } from "../../theme";
import { SceneTransition } from "../../components/navigation/SceneTransition";
import { SympnoteHero } from "../../components/brand/SympnoteHero";
import { PrimaryButton } from "../../components/ui/PrimaryButton";
import { useReducedMotion } from "../../hooks/useReducedMotion";
import { FULL_HEADLINE } from "../../constants/onboarding";

export default function ScreenHook() {
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

  return (
    <SceneTransition mode="crossfade-parallax-up">
      <View style={[styles.root, { backgroundColor: colors.bgPrimary }]}>
        <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
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
              <TrustChip icon={<Zap size={12} color={colors.accent} />} label="2-min daily" />
              <TrustChip icon={<Heart size={12} color={colors.accent} />} label="HIPAA-safe" />
              <TrustChip icon={<Sparkles size={12} color={colors.accent} />} label="AI summary" />
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
}

function TrustChip({ icon, label }: { icon: React.ReactNode; label: string }) {
  const { colors } = useTheme();
  const styles = useStyles();
  return (
    <View
      style={[
        styles.trustChip,
        {
          backgroundColor: colors.bgSurface,
          borderColor: colors.border,
        },
      ]}
    >
      {icon}
      <Text style={[typography.label, { color: colors.textSecondary, marginLeft: 6 }]}>
        {label}
      </Text>
    </View>
  );
}

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
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: theme.radius.full,
    borderWidth: StyleSheet.hairlineWidth,
  },
  ctaArea: {
    paddingHorizontal: theme.spacing.s6,
    paddingBottom: theme.spacing.s10,
  },
}));
