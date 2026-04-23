import React, { useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  makeStyles,
  moderateScale,
  typography,
  useTheme,
  verticalScale,
} from "@/theme";
import { SceneTransition } from "@/components/navigation/SceneTransition";
import { BackButton } from "@/components/ui/BackButton";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { FOCUS_OPTIONS } from "@/constants/focus";
import type { FocusArea } from "@/stores/types";
import { useProfileStore } from "@/stores/useProfileStore";
import { hapticLight } from "@/services/haptics";
import { FocusCard } from "@/components/onboarding/focus/FocusCard";

const ctaLabel = (count: number): string => {
  if (count === 0) return "Pick at least one to continue";
  if (count === 1) return "Continue";
  return `Continue · ${count} selected`;
};

const ScreenFocus: React.FC = () => {
  const router = useRouter();
  const { colors } = useTheme();
  const styles = useStyles();
  const setAnswer = useProfileStore((s) => s.setOnboardingAnswer);

  const [selected, setSelected] = useState<Set<FocusArea>>(new Set());

  const toggle = (id: FocusArea) => {
    hapticLight();
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const onContinue = () => {
    setAnswer("focus", Array.from(selected));
    router.push("/onboarding/care-team");
  };

  const count = selected.size;

  return (
    <SceneTransition mode="scale-fade">
      <View style={styles.root}>
        <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
          <View style={styles.topBar}>
            <BackButton onPress={() => router.back()} />
            <Text style={styles.stageCount}>5 of 9</Text>
            <View style={{ width: moderateScale(40) }} />
          </View>

          <ScrollView
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
          >
            <Text style={styles.eyebrow}>YOUR GOAL</Text>
            <Text style={[styles.headline, { color: colors.textPrimary }]}>
              What's this tracking for?
            </Text>
            <Text style={[styles.headlineSubTitle, { color: colors.textSecondary }]}>
              Pick any that apply. You can change these anytime.
            </Text>

            <View style={styles.list}>
              {FOCUS_OPTIONS.map((o, i) => (
                <FocusCard
                  key={o.id}
                  option={o}
                  selected={selected.has(o.id)}
                  index={i}
                  onPress={() => toggle(o.id)}
                />
              ))}
            </View>
          </ScrollView>

          <View style={styles.cta}>
            <PrimaryButton
              label={ctaLabel(count)}
              disabled={count === 0}
              onPress={onContinue}
            />
          </View>
        </SafeAreaView>
      </View>
    </SceneTransition>
  );
};

export default ScreenFocus;

const useStyles = makeStyles((theme) => ({
  root: {
    flex: 1,
    backgroundColor: theme.colors.bgPrimary,
  },
  safe: { flex: 1 },
  topBar: {
    paddingTop: theme.spacing.s3,
    paddingHorizontal: theme.spacing.s6,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  content: {
    paddingHorizontal: theme.spacing.s6,
    paddingTop: theme.spacing.s4,
    paddingBottom: theme.spacing.s6,
  },
  eyebrow: {
    ...theme.typography.label,
    color: theme.colors.accent,
    fontFamily: "DMSans_700Bold",
    letterSpacing: 1.1,
  },
  headline: {
    ...theme.typography.h1,
    marginTop: moderateScale(4),
  },
  list: {
    marginTop: theme.spacing.s5,
    gap: moderateScale(10),
  },
  cta: {
    paddingHorizontal: theme.spacing.s6,
    paddingTop: verticalScale(8),
  },
  stageCount: {
    ...typography.label,
    color: theme.colors.textTertiary,
  },
  headlineSubTitle: {
    ...typography.body,
    marginTop: moderateScale(6),
  },
}));
