import React, { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { X as XIcon } from "lucide-react-native";
import {
  makeStyles,
  moderateScale,
  spacing,
  typography,
  useTheme,
} from "../../theme";
import { PocketbookMascot } from "../../components/onboarding/PocketbookMascot";
import { PlanCard } from "../../components/onboarding/paywall/PlanCard";
import { CraftingOverlay } from "../../components/onboarding/paywall/CraftingOverlay";
import { PaywallFooter } from "../../components/onboarding/paywall/PaywallFooter";
import { Plan } from "../../services/subscription";
import { useReducedMotion } from "../../hooks/useReducedMotion";
import { usePaywallPurchase } from "../../hooks/usePaywallPurchase";
import { PAYWALL_PLANS } from "../../constants/plans";

const ScreenPaywall: React.FC = () => {
  const router = useRouter();
  const { colors } = useTheme();
  const styles = useStyles();
  const reduced = useReducedMotion();

  const [selected, setSelected] = useState<Plan["id"]>("monthly");
  const { loading, crafting, buy, skipDev } = usePaywallPurchase();

  const selectedPlan = PAYWALL_PLANS.find((p) => p.id === selected);

  return (
    <View style={[styles.root, { backgroundColor: colors.bgPrimary }]}>
      <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
        <View style={styles.topBar}>
          <View style={styles.grabber} />
          <Pressable
            onPress={() => router.back()}
            hitSlop={10}
            style={[styles.close, { backgroundColor: colors.bgMuted }]}
            accessibilityRole="button"
            accessibilityLabel="Close"
          >
            <XIcon size={moderateScale(16)} color={colors.textPrimary} strokeWidth={2.2} />
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.mascotSlot}>
            <PocketbookMascot reduced={reduced} size={moderateScale(180)} />
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
                paddingHorizontal: spacing.s4,
              },
            ]}
          >
            Unlimited voice notes, structured into clinical fields every time, with visit briefs
            ready before you walk in.
          </Text>

          <View style={styles.plans}>
            {PAYWALL_PLANS.map((p, i) => (
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

        <PaywallFooter
          selectedPlan={selectedPlan}
          loading={loading}
          onBuy={() => buy(selected)}
        />
      </SafeAreaView>

      {crafting && <CraftingOverlay reduced={reduced} />}
    </View>
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
  plans: {
    marginTop: theme.spacing.s5,
    gap: moderateScale(12),
  },
}));
