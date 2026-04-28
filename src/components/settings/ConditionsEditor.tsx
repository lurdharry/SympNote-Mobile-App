import React, { useEffect, useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated, {
  Easing,
  FadeIn,
  FadeOut,
  LinearTransition,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { Activity, ChevronDown } from "lucide-react-native";
import {
  fontScale,
  makeStyles,
  moderateScale,
  scale,
  shadows,
  typography,
  useTheme,
  verticalScale,
} from "@/theme";
import { useProfileStore } from "@/stores/useProfileStore";
import { hapticLight } from "@/services/haptics";
import { ConditionChip } from "./conditions/ConditionChip";
import { AddConditionRow } from "./conditions/AddConditionRow";

/**
 * Inline conditions editor. Tap the row → it expands with a smooth
 * spring (LinearTransition + chevron rotation), revealing every
 * curated condition plus any custom ones the user added during
 * onboarding. Tapping a chip toggles its membership in
 * `personalization.knownConditions`. An "Add your own" input at
 * the bottom appends new entries with a `custom:` prefix.
 *
 * No alert dialogs, no navigation away — the user can correct their
 * profile without leaving Settings.
 */

interface ConditionOption {
  /** Stable value (matches the values set during onboarding). */
  v: string;
  /** Human label. */
  t: string;
}

const CURATED: ConditionOption[] = [
  { v: "hypertension", t: "High blood pressure" },
  { v: "cholesterol", t: "High cholesterol" },
  { v: "diabetes", t: "Diabetes" },
  { v: "allergies", t: "Allergies" },
  { v: "gerd", t: "Acid reflux" },
  { v: "depression", t: "Depression / anxiety" },
  { v: "arthritis", t: "Arthritis" },
  { v: "migraines", t: "Migraines" },
  { v: "asthma", t: "Asthma" },
  { v: "thyroid", t: "Thyroid condition" },
  { v: "heart", t: "Heart condition" },
  { v: "autoimmune", t: "Autoimmune" },
  { v: "cancer", t: "Cancer (current or past)" },
  { v: "smoker", t: "Smoker / recently quit" },
];

const labelFor = (v: string): string => {
  const hit = CURATED.find((c) => c.v === v);
  if (hit) return hit.t;
  if (v.startsWith("custom:"))
    return v.slice("custom:".length).replace(/^./, (c) => c.toUpperCase());
  return v;
};

export const ConditionsEditor: React.FC = () => {
  const { colors } = useTheme();
  const styles = useStyles();
  const personalization = useProfileStore((s) => s.personalization);
  const setPersonalization = useProfileStore((s) => s.setPersonalization);

  const [expanded, setExpanded] = useState(false);
  const [draft, setDraft] = useState("");

  const selected = personalization?.knownConditions ?? [];

  // Build the visible list: curated first, then any custom values
  // from the saved set that aren't curated. Each one toggleable.
  const visible = useMemo<ConditionOption[]>(() => {
    const customs = selected
      .filter((v) => !CURATED.some((c) => c.v === v))
      .map((v) => ({ v, t: labelFor(v) }));
    return [...CURATED, ...customs];
  }, [selected]);

  const isOn = (v: string): boolean => selected.includes(v);

  const writeNext = (next: string[]) => {
    if (!personalization) return;
    setPersonalization({ ...personalization, knownConditions: next });
  };

  const toggle = (v: string) => {
    hapticLight();
    if (isOn(v)) writeNext(selected.filter((s) => s !== v));
    else writeNext([...selected, v]);
  };

  const addCustom = () => {
    const name = draft.trim();
    if (!name) return;
    const v = `custom:${name.toLowerCase()}`;
    if (selected.some((s) => s.toLowerCase() === v)) {
      setDraft("");
      return;
    }
    hapticLight();
    writeNext([...selected, v]);
    setDraft("");
  };

  // Chevron rotates 180° when expanded.
  const chev = useSharedValue(0);
  useEffect(() => {
    chev.value = withTiming(expanded ? 1 : 0, {
      duration: 220,
      easing: Easing.out(Easing.cubic),
    });
  }, [expanded, chev]);
  const chevStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${chev.value * 180}deg` }],
  }));

  const summary =
    selected.length === 0
      ? "None reported"
      : selected.length === 1
        ? labelFor(selected[0]!)
        : `${selected.length} conditions`;

  return (
    <Animated.View
      style={[
        styles.wrap,
        { backgroundColor: colors.bgSurface, borderColor: colors.border },
        shadows.card,
      ]}
      layout={LinearTransition.duration(280).easing(Easing.out(Easing.cubic))}
    >
      <Pressable
        onPress={() => {
          hapticLight();
          setExpanded((p) => !p);
        }}
        style={styles.headerRow}
        accessibilityRole="button"
        accessibilityLabel={`Known conditions, ${summary}`}
        accessibilityState={{ expanded }}
      >
        <View style={[styles.icon, { backgroundColor: colors.accent + "1A" }]}>
          <Activity size={moderateScale(18)} color={colors.accent} strokeWidth={2} />
        </View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={[typography.body, styles.label, { color: colors.textPrimary }]}>
            Known conditions
          </Text>
          <Text style={[typography.caption, { color: colors.textTertiary }]} numberOfLines={1}>
            {summary}
          </Text>
        </View>
        <Animated.View style={chevStyle}>
          <ChevronDown size={moderateScale(18)} color={colors.textTertiary} strokeWidth={2} />
        </Animated.View>
      </Pressable>

      {expanded && (
        <Animated.View
          entering={FadeIn.duration(220)}
          exiting={FadeOut.duration(160)}
          style={styles.body}
        >
          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          <Text style={[styles.sectionLabel, { color: colors.textTertiary }]}>TAP TO TOGGLE</Text>
          <View style={styles.chipGrid}>
            {visible.map((c) => (
              <ConditionChip
                key={c.v}
                label={c.t}
                active={isOn(c.v)}
                custom={c.v.startsWith("custom:")}
                onPress={() => toggle(c.v)}
              />
            ))}
          </View>

          <Text
            style={[
              styles.sectionLabel,
              { color: colors.textTertiary, marginTop: verticalScale(14) },
            ]}
          >
            ADD YOUR OWN
          </Text>
          <AddConditionRow value={draft} onChange={setDraft} onSubmit={addCustom} />
        </Animated.View>
      )}
    </Animated.View>
  );
};

const useStyles = makeStyles((theme) => ({
  wrap: {
    borderRadius: theme.radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: "hidden",
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: moderateScale(12),
    paddingHorizontal: scale(16),
    paddingVertical: verticalScale(12),
    minHeight: verticalScale(56),
  },
  icon: {
    width: moderateScale(36),
    height: moderateScale(36),
    borderRadius: moderateScale(10),
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    fontFamily: "DMSans_500Medium",
  },
  body: {
    paddingHorizontal: scale(16),
    paddingBottom: verticalScale(16),
    paddingTop: verticalScale(4),
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginBottom: verticalScale(12),
  },
  sectionLabel: {
    fontFamily: "DMSans_700Bold",
    fontSize: fontScale(10),
    letterSpacing: 1.4,
    marginBottom: verticalScale(8),
  },
  chipGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: moderateScale(6),
  },
}));
