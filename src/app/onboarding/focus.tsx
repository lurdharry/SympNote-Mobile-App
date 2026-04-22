import React from "react";
import { ScrollView, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { makeStyles, moderateScale, typography, useTheme, verticalScale } from "../../theme";
import { SceneTransition } from "../../components/navigation/SceneTransition";
import { BackButton } from "../../components/ui/BackButton";
import { PrimaryButton } from "../../components/ui/PrimaryButton";
import { FOCUS_OPTIONS } from "../../constants/focus";
import { useProfileStore } from "../../stores/useProfileStore";
import { hapticLight } from "../../services/haptics";
import { FocusCard } from "@/components/onboarding/focus/FocusCard";

const ScreenFocus: React.FC = () => {
  const [sel, setSel] = React.useState<string | null>(null);

  const router = useRouter();
  const styles = useStyles();
  const setAnswer = useProfileStore((s) => s.setOnboardingAnswer);

  const onSelect = (id: string) => {
    hapticLight();
    setSel(id);
    setAnswer("focus", id);
  };

  return (
    <SceneTransition mode="scale-fade">
      <View style={styles.root}>
        <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
          <View style={styles.topBar}>
            <BackButton onPress={() => router.back()} />
            <Text style={styles.stageCount}>5 of 9</Text>
            <View style={{ width: moderateScale(40) }} />
          </View>

          <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
            <Text style={styles.eyebrow}>YOUR FOCUS</Text>
            <Text style={styles.headline}>What are you tracking?</Text>
            <Text style={styles.headlineSubTitle}>
              We'll tailor prompts and summaries. You can change this anytime.
            </Text>

            <View style={styles.list}>
              {FOCUS_OPTIONS.map((o, i) => (
                <FocusCard
                  key={o.id}
                  option={o}
                  selected={sel === o.id}
                  index={i}
                  onPress={() => onSelect(o.id)}
                />
              ))}
            </View>
          </ScrollView>

          <View style={styles.cta}>
            <PrimaryButton
              label={sel ? "Continue" : "Pick one to continue"}
              disabled={!sel}
              onPress={() => router.push("/onboarding/care-team")}
            />
          </View>
        </SafeAreaView>
      </View>
    </SceneTransition>
  );
}

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
    color: theme.colors.textPrimary,
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
    color: theme.colors.textSecondary,
    marginTop: moderateScale(6),
  },
}));
