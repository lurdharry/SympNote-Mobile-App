import React, { useEffect, useState } from "react";
import {
  Alert,
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
import { LinearGradient } from "expo-linear-gradient";
import { Check, Trophy, X as XIcon } from "lucide-react-native";
import {
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
import { PAYWALL_PLANS, PLAN_FEATURES, PlanDef } from "../../constants/plans";

const PLANS = PAYWALL_PLANS;
const FEATURES = PLAN_FEATURES;

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

  const [selected, setSelected] = useState<Plan["id"]>("annual");
  const [loading, setLoading] = useState(false);
  const [crafting, setCrafting] = useState(false);

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
          <PlusBadge />

          <Text
            style={[
              typography.h1,
              {
                color: colors.textPrimary,
                textAlign: "center",
                marginTop: spacing.s4,
              },
            ]}
          >
            3 days free,{"\n"}then full access.
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
            Doctor-ready notes, visit after visit.
          </Text>

          <View style={styles.features}>
            {FEATURES.map((f, i) => (
              <View key={i} style={styles.featureRow}>
                <View
                  style={[
                    styles.featureIcon,
                    { backgroundColor: colors.accent + "1A" },
                  ]}
                >
                  <f.Icon size={16} color={colors.accent} strokeWidth={2} />
                </View>
                <Text style={[typography.body, { color: colors.textPrimary, flex: 1 }]}>
                  {f.t}
                </Text>
              </View>
            ))}
          </View>

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
          <PrimaryButton
            label="Start 3-day free trial"
            onPress={buy}
            loading={loading}
          />
          <Text
            style={[
              typography.caption,
              { color: colors.textTertiary, textAlign: "center" },
            ]}
          >
            Cancel anytime. No charge during trial.
          </Text>
        </View>
      </SafeAreaView>

      {crafting && <CraftingOverlay reduced={reduced} />}
    </View>
  );
};

const PlusBadge: React.FC = () => {
  const styles = useStyles();
  return (
    <View style={{ alignItems: "center" }}>
      <View style={styles.plusBadge}>
        <LinearGradient
          colors={["#F6C06A", "#E07A5F"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <Trophy size={12} color="#FFFFFF" strokeWidth={2.5} />
        <Text
          style={[
            typography.label,
            {
              color: "#FFFFFF",
              fontFamily: "DMSans_700Bold",
              marginLeft: 6,
            },
          ]}
        >
          SYMPNOTE PLUS
        </Text>
      </View>
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
    <Animated.View style={enter}>
      <Pressable
        onPress={onSelect}
        style={[
          styles.plan,
          {
            backgroundColor: colors.bgSurface,
            borderColor: selected ? colors.accent : colors.border,
            borderWidth: 2,
          },
          shadows.card,
        ]}
      >
        {plan.badge && (
          <View style={styles.planBadge}>
            <LinearGradient
              colors={["#E07A5F", "#F6C06A"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={StyleSheet.absoluteFill}
            />
            <Text
              style={[
                typography.caption,
                {
                  color: "#FFFFFF",
                  fontFamily: "DMSans_700Bold",
                },
              ]}
            >
              {plan.badge}
            </Text>
          </View>
        )}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <View>
            <Text style={[typography.h3, { color: colors.textPrimary }]}>
              {plan.label}
            </Text>
            {plan.note && (
              <Text
                style={[typography.caption, { color: colors.textTertiary, marginTop: 2 }]}
              >
                {plan.note}
              </Text>
            )}
          </View>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
            <View style={{ alignItems: "flex-end" }}>
              <Text style={[typography.h3, { color: colors.textPrimary }]}>
                {plan.price}
              </Text>
              <Text style={[typography.caption, { color: colors.textTertiary }]}>
                {plan.per}
              </Text>
            </View>
            <View
              style={[
                styles.radio,
                selected
                  ? { backgroundColor: colors.accent, borderColor: colors.accent }
                  : { borderColor: colors.border },
              ]}
            >
              {selected && <Check size={12} color="#FFFFFF" strokeWidth={3} />}
            </View>
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
  plusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: scale(10),
    paddingVertical: verticalScale(4),
    borderRadius: theme.radius.full,
    overflow: "hidden",
    alignSelf: "center",
  },
  features: {
    marginTop: theme.spacing.s5,
    gap: moderateScale(12),
  },
  featureRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: moderateScale(12),
  },
  featureIcon: {
    width: moderateScale(28),
    height: moderateScale(28),
    borderRadius: moderateScale(8),
    alignItems: "center",
    justifyContent: "center",
  },
  plans: {
    marginTop: theme.spacing.s5,
    gap: moderateScale(12),
  },
  plan: {
    padding: moderateScale(16),
    borderRadius: theme.radius.lg,
    position: "relative",
  },
  planBadge: {
    position: "absolute",
    top: -verticalScale(10),
    left: scale(16),
    paddingHorizontal: scale(10),
    paddingVertical: verticalScale(4),
    borderRadius: theme.radius.full,
    overflow: "hidden",
  },
  radio: {
    width: moderateScale(24),
    height: moderateScale(24),
    borderRadius: moderateScale(12),
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  ctaArea: {
    paddingHorizontal: theme.spacing.s6,
    paddingTop: theme.spacing.s2,
    paddingBottom: theme.spacing.s3,
    gap: moderateScale(6),
  },
}));
