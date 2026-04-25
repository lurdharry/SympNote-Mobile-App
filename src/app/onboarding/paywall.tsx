import React, { useEffect, useState } from "react";
import {
  Alert,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { Check, X as XIcon } from "lucide-react-native";
import {
  fontScale,
  makeStyles,
  moderateScale,
  scale,
  shadows,
  spacing,
  typography,
  useTheme,
  verticalScale,
} from "../../theme";
import { PrimaryButton } from "../../components/ui/PrimaryButton";
import { SympnoteSprite } from "../../components/onboarding/SympnoteSprite";
import { purchase, Plan } from "../../services/subscription";
import { structureTranscript } from "../../services/ai";
import { useProfileStore } from "../../stores/useProfileStore";
import { useRecordingsStore } from "../../stores/useRecordingsStore";
import { usePendingRecordingStore } from "../../stores/usePendingRecordingStore";
import { StructuredEntry } from "../../stores/types";
import { hapticHeavy } from "../../services/haptics";
import { uuid } from "../../utils/uuid";
import { useReducedMotion } from "../../hooks/useReducedMotion";
import { PAYWALL_PLANS, PlanDef } from "../../constants/plans";

const PLANS = PAYWALL_PLANS;

const EMPTY_STRUCTURED: StructuredEntry = {
  symptoms: [],
  location: "",
  duration: "",
  severity: 0,
  triggers: [],
  medications: [],
  notes: "",
  bodySystem: "",
  redFlags: [],
  urgency: "routine",
};

const ScreenPaywall: React.FC = () => {
  const router = useRouter();
  const { colors } = useTheme();
  const styles = useStyles();
  const reduced = useReducedMotion();

  const [selected, setSelected] = useState<Plan["id"]>("monthly");
  const [loading, setLoading] = useState(false);
  const [crafting, setCrafting] = useState(false);

  const selectedPlan = PLANS.find((p) => p.id === selected);

  const onRestore = () => {
    Alert.alert(
      "Restore purchases",
      "We'll check the App Store for an active Sympnote Plus subscription tied to this Apple ID.",
    );
  };
  const onTerms = () => {
    Linking.openURL("https://sympnote.app/terms").catch(() => {
      Alert.alert("Couldn't open Terms", "Visit sympnote.app/terms in your browser.");
    });
  };
  const onPrivacy = () => {
    Linking.openURL("https://sympnote.app/privacy").catch(() => {
      Alert.alert(
        "Couldn't open Privacy",
        "Visit sympnote.app/privacy in your browser.",
      );
    });
  };

  const complete = useProfileStore((s) => s.completeOnboarding);
  const personalization = useProfileStore((s) => s.personalization);

  const commitDraft = async (): Promise<void> => {
    const pending = usePendingRecordingStore.getState().draft;
    if (!pending) return;
    let structured: StructuredEntry = EMPTY_STRUCTURED;
    let tags: string[] = [];
    try {
      const result = await structureTranscript(pending.transcript, personalization);
      structured = result as StructuredEntry;
      tags = result.symptoms.filter(Boolean).slice(0, 2);
    } catch {
      // Gemini failure post-purchase — save raw; retry later from home.
    }
    useRecordingsStore.getState().add({
      id: uuid(),
      createdAt: pending.createdAt,
      durationSec: pending.durationSec,
      transcript: pending.transcript,
      structured,
      tags,
    });
    usePendingRecordingStore.getState().clear();
  };

  const buy = async () => {
    setLoading(true);
    try {
      await purchase(selected);
      hapticHeavy();
      setCrafting(true);
      await commitDraft();
      complete();
      router.replace("/(tabs)/home");
    } catch (e) {
      setCrafting(false);
      Alert.alert("Purchase failed", String(e));
    } finally {
      setLoading(false);
    }
  };

  const skipDev = async () => {
    if (!__DEV__) return;
    setCrafting(true);
    await commitDraft();
    complete();
    router.replace("/(tabs)/home");
  };

  const onClose = () => router.back();

  return (
    <View style={[styles.root, { backgroundColor: colors.bgPrimary }]}>
      <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
        <View style={styles.topBar}>
          <View style={styles.grabber} />
          <Pressable
            onPress={onClose}
            hitSlop={10}
            style={[styles.close, { backgroundColor: colors.bgMuted }]}
            accessibilityRole="button"
            accessibilityLabel="Close"
          >
            <XIcon size={moderateScale(16)} color={colors.textPrimary} strokeWidth={2.2} />
          </Pressable>
        </View>

        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.mascotSlot}>
            <SympnoteSprite pose="greeting" reduced={reduced} size={moderateScale(160)} />
          </View>

          <Text
            style={[
              typography.h1,
              {
                color: colors.textPrimary,
                textAlign: "center",
                marginTop: spacing.s2,
              },
            ]}
          >
            Choose your plan
          </Text>
          <Text
            style={[
              typography.body,
              {
                color: colors.textSecondary,
                textAlign: "center",
                marginTop: 8,
              },
            ]}
          >
            Doctor-ready notes for every visit.
          </Text>

          <View style={styles.plans}>
            {PLANS.map((p, i) => (
              <PlanCard
                key={p.id}
                plan={p}
                index={i}
                selected={selected === p.id}
                onSelect={() => setSelected(p.id)}
              />
            ))}
          </View>

          {__DEV__ && (
            <Pressable
              onPress={skipDev}
              style={{ marginTop: spacing.s5, alignSelf: "center" }}
              hitSlop={12}
            >
              <Text
                style={[
                  typography.caption,
                  {
                    color: colors.textTertiary,
                    textDecorationLine: "underline",
                  },
                ]}
              >
                Dev: skip paywall
              </Text>
            </Pressable>
          )}
        </ScrollView>

        <View style={styles.ctaArea}>
          <Text style={[styles.todayLine, { color: colors.textPrimary }]}>
            $0 today · Then{" "}
            {selectedPlan?.price ?? ""}
            {selectedPlan ? `/${selectedPlan.per.replace("per ", "")}` : ""}
          </Text>
          <Text style={[styles.autorenewLine, { color: colors.textTertiary }]}>
            Auto-renews. Cancel anytime.
          </Text>
          <PrimaryButton
            label={selectedPlan?.trialBadge ? "Start free trial" : "Continue"}
            onPress={buy}
            loading={loading}
          />
          <View style={styles.legalRow}>
            <Pressable hitSlop={8} onPress={onRestore}>
              <Text style={[styles.legalLink, { color: colors.textTertiary }]}>
                Restore
              </Text>
            </Pressable>
            <View style={[styles.legalDot, { backgroundColor: colors.textTertiary }]} />
            <Pressable hitSlop={8} onPress={onTerms}>
              <Text style={[styles.legalLink, { color: colors.textTertiary }]}>
                Terms
              </Text>
            </Pressable>
            <View style={[styles.legalDot, { backgroundColor: colors.textTertiary }]} />
            <Pressable hitSlop={8} onPress={onPrivacy}>
              <Text style={[styles.legalLink, { color: colors.textTertiary }]}>
                Privacy
              </Text>
            </Pressable>
          </View>
        </View>
      </SafeAreaView>

      {crafting && <CraftingOverlay reduced={reduced} />}
    </View>
  );
};

interface CraftingOverlayProps {
  reduced: boolean;
}

const CraftingOverlay: React.FC<CraftingOverlayProps> = ({ reduced }) => {
  const { colors } = useTheme();

  return (
    <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.bgPrimary }]}>
      <SafeAreaView style={{ flex: 1 }} edges={["top", "bottom"]}>
        <View style={craftingStyles.body}>
          <SympnoteSprite pose="crafting" reduced={reduced} />
          <Text
            style={[
              typography.h2,
              {
                color: colors.textPrimary,
                textAlign: "center",
                marginTop: spacing.s6,
              },
            ]}
          >
            Crafting your summary…
          </Text>
          <Text
            style={[
              typography.body,
              {
                color: colors.textSecondary,
                textAlign: "center",
                marginTop: 8,
              },
            ]}
          >
            Turning your words into structured clinical fields.
          </Text>
        </View>
      </SafeAreaView>
    </View>
  );
};

const craftingStyles = StyleSheet.create({
  body: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.s6,
  },
});

interface PlanCardProps {
  plan: PlanDef;
  index: number;
  selected: boolean;
  onSelect: () => void;
}

const PlanCard: React.FC<PlanCardProps> = ({
  plan,
  index,
  selected,
  onSelect,
}) => {
  const { colors } = useTheme();
  const styles = useStyles();
  const opacity = useSharedValue(0);
  const ty = useSharedValue(10);
  useEffect(() => {
    opacity.value = withDelay(
      240 + index * 80,
      withTiming(1, { duration: 320, easing: Easing.out(Easing.cubic) }),
    );
    ty.value = withDelay(240 + index * 80, withSpring(0, { damping: 18, stiffness: 140 }));
  }, [index, opacity, ty]);
  const enter = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: ty.value }],
  }));

  return (
    <Animated.View style={[styles.planOuter, enter]}>
      {plan.saveBadge && (
        <View style={styles.saveRibbon}>
          <Text style={styles.saveRibbonText}>{plan.saveBadge}</Text>
        </View>
      )}
      <Pressable
        onPress={onSelect}
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
              <Text style={[styles.planLabel, { color: colors.textPrimary }]}>
                {plan.label}
              </Text>
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
              <Text
                style={[styles.planSubline, { color: colors.textTertiary }]}
                numberOfLines={1}
              >
                {plan.subline}
              </Text>
            )}
          </View>

          {/* Middle — price stack */}
          <View style={styles.priceStack}>
            <Text style={[styles.planPrice, { color: colors.textPrimary }]}>
              {plan.price}
            </Text>
            <Text style={[styles.planPer, { color: colors.textTertiary }]}>
              {plan.per}
            </Text>
          </View>

          {/* Right — radio / check */}
          <View
            style={[
              styles.radio,
              selected
                ? { backgroundColor: colors.accent, borderColor: colors.accent }
                : { borderColor: colors.border },
            ]}
          >
            {selected && <Check size={moderateScale(13)} color="#FFFFFF" strokeWidth={3} />}
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
};

export default ScreenPaywall;

const useStyles = makeStyles((theme) => ({
  root: { flex: 1 },
  safe: { flex: 1 },
  topBar: {
    paddingTop: theme.spacing.s2,
    paddingHorizontal: theme.spacing.s6,
    paddingBottom: theme.spacing.s2,
    alignItems: "center",
  },
  grabber: {
    width: moderateScale(36),
    height: 4,
    borderRadius: 2,
    backgroundColor: "transparent",
  },
  close: {
    position: "absolute",
    top: theme.spacing.s2,
    right: theme.spacing.s5,
    width: moderateScale(32),
    height: moderateScale(32),
    borderRadius: moderateScale(16),
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    paddingHorizontal: theme.spacing.s6,
    paddingTop: theme.spacing.s2,
    paddingBottom: theme.spacing.s6,
  },
  mascotSlot: {
    alignItems: "center",
    marginTop: theme.spacing.s2,
  },
  // ── Plan cards
  plans: {
    marginTop: theme.spacing.s5,
    gap: moderateScale(12),
  },
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
  planPrice: {
    fontFamily: "DMSans_700Bold",
    fontSize: fontScale(20),
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
    top: -verticalScale(10),
    right: scale(14),
    paddingHorizontal: scale(10),
    paddingVertical: verticalScale(3),
    borderRadius: theme.radius.full,
    backgroundColor: "#5A8F6E",
    zIndex: 2,
  },
  saveRibbonText: {
    color: "#FFFFFF",
    fontFamily: "DMSans_700Bold",
    fontSize: fontScale(10),
    letterSpacing: 0.6,
  },
  // ── CTA / footer
  ctaArea: {
    paddingHorizontal: theme.spacing.s6,
    paddingTop: theme.spacing.s2,
    paddingBottom: theme.spacing.s3,
    gap: moderateScale(6),
  },
  todayLine: {
    fontFamily: "DMSans_600SemiBold",
    fontSize: fontScale(13),
    textAlign: "center",
  },
  autorenewLine: {
    fontFamily: "DMSans_400Regular",
    fontSize: fontScale(11),
    textAlign: "center",
  },
  legalRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: moderateScale(14),
    paddingTop: verticalScale(6),
  },
  legalLink: {
    fontFamily: "DMSans_500Medium",
    fontSize: fontScale(12),
    letterSpacing: 0.1,
  },
  legalDot: {
    width: 3,
    height: 3,
    borderRadius: 2,
  },
}));
