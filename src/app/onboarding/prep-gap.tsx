import React, { useEffect, useRef, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import Animated, { FadeInDown } from "react-native-reanimated";
import {
  fontScale,
  makeStyles,
  moderateScale,
  spacing,
  typography,
  useTheme,
} from "@/theme";
import { SceneTransition } from "@/components/navigation/SceneTransition";
import { BackButton } from "@/components/ui/BackButton";
import { OnboardingProgress } from "@/components/onboarding/OnboardingProgress";
import { usePendingRecordingStore } from "@/stores/usePendingRecordingStore";
import { hapticLight } from "@/services/haptics";
import { PREP_GAP_MASCOTS } from "@/components/onboarding/PrepGapMascots";
import type { PrepGap } from "@/stores/types";

interface Option {
  v: PrepGap;
  label: string;
}

/**
 * Problem-anchor screen — first ask after the hook. Names the pain
 * SympNote solves before we collect clinical data; the answer is
 * referenced downstream by the first-brief sub-copy and paywall hero
 * (loss framing).
 *
 * Direct + product-basic: single headline, no eyebrow, no sub. Each
 * option is an emoji + label, single-select with auto-advance.
 */
const OPTIONS: Option[] = [
  { v: "often", label: "Almost every visit" },
  { v: "sometimes", label: "About half the time" },
  { v: "occasional", label: "Now and then" },
  { v: "rare", label: "Rarely" },
];

const ScreenPrepGap: React.FC = () => {
  const router = useRouter();
  const { colors } = useTheme();
  const styles = useStyles();
  const setAnswer = usePendingRecordingStore((s) => s.setAnswer);

  const [picked, setPicked] = useState<PrepGap | null>(null);
  // Guards double-tap during auto-advance — *not* "is anything
  // picked", since the user can navigate back here from age and
  // should be allowed to change their answer.
  const navTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (navTimerRef.current) clearTimeout(navTimerRef.current);
    },
    [],
  );

  const onSelect = (v: PrepGap) => {
    if (navTimerRef.current) return;
    hapticLight();
    setPicked(v);
    setAnswer("prepGap", v);
    navTimerRef.current = setTimeout(() => {
      navTimerRef.current = null;
      router.push("/onboarding/age");
    }, 280);
  };

  return (
    <SceneTransition mode="scale-fade">
      <View style={[styles.root, { backgroundColor: colors.bgPrimary }]}>
        <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
          <View style={styles.topBar}>
            <BackButton onPress={() => router.back()} />
            <View style={{ width: moderateScale(40) }} />
          </View>
          <View style={styles.progressSlot}>
            <OnboardingProgress value={0.1} />
          </View>

          <ScrollView
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
          >
            <Text style={[styles.headline, { color: colors.textPrimary }]}>
              How often do you{"\n"}forget at the doctor?
            </Text>

            <View style={styles.list}>
              {OPTIONS.map((o, i) => {
                const active = picked === o.v;
                const Mascot = PREP_GAP_MASCOTS[o.v];
                return (
                  <Animated.View
                    key={o.v}
                    entering={FadeInDown.delay(60 + i * 50).duration(340)}
                  >
                    <Pressable
                      onPress={() => onSelect(o.v)}
                      style={[
                        styles.card,
                        {
                          backgroundColor: active
                            ? colors.accent + "12"
                            : colors.bgSurface,
                          borderColor: active ? colors.accent : colors.border,
                          borderWidth: active ? 1.5 : StyleSheet.hairlineWidth,
                        },
                      ]}
                      accessibilityRole="button"
                      accessibilityState={{ selected: active }}
                      accessibilityLabel={o.label}
                    >
                      <View style={styles.mascotSlot}>
                        <Mascot size={moderateScale(40)} />
                      </View>
                      <Text
                        style={[
                          styles.cardLabel,
                          {
                            color: active ? colors.accent : colors.textPrimary,
                          },
                        ]}
                        numberOfLines={1}
                      >
                        {o.label}
                      </Text>
                    </Pressable>
                  </Animated.View>
                );
              })}
            </View>

            <View style={{ height: spacing.s4 }} />
          </ScrollView>
        </SafeAreaView>
      </View>
    </SceneTransition>
  );
};

export default ScreenPrepGap;

const useStyles = makeStyles((theme) => ({
  root: { flex: 1 },
  safe: { flex: 1 },
  topBar: {
    paddingTop: theme.spacing.s3,
    paddingHorizontal: theme.spacing.s5,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  progressSlot: {
    paddingHorizontal: theme.spacing.s5,
    paddingTop: theme.spacing.s2,
  },
  content: {
    paddingHorizontal: theme.spacing.s6,
    paddingTop: theme.spacing.s6,
    paddingBottom: theme.spacing.s5,
  },
  headline: {
    ...typography.h1,
    fontFamily: "Fraunces_500Medium",
    fontSize: fontScale(28),
    lineHeight: fontScale(34),
    letterSpacing: -0.5,
  },
  list: {
    marginTop: theme.spacing.s6,
    gap: moderateScale(10),
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: moderateScale(12),
    paddingHorizontal: moderateScale(12),
    paddingVertical: moderateScale(10),
    borderRadius: theme.radius.lg,
  },
  mascotSlot: {
    width: moderateScale(40),
    height: moderateScale(40),
    alignItems: "center",
    justifyContent: "center",
  },
  cardLabel: {
    flex: 1,
    fontFamily: "DMSans_700Bold",
    fontSize: fontScale(15),
    letterSpacing: -0.1,
  },
}));
