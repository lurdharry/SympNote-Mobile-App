import React, { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { Check, Plus } from "lucide-react-native";
import { fontScale, makeStyles, moderateScale, scale, useTheme, verticalScale } from "@/theme";
import { Option, QUALIFIER_TIMINGS } from "@/constants/onboarding";
import { hapticLight } from "@/services/haptics";

interface ChipTrayProps {
  options: Option[];
  disabled: boolean;
  /**
   * Single-select mode: tapping a chip fires `onAnswer` immediately.
   * Multi-select mode: tapping a chip toggles selection and a primary
   * "Continue" button commits the full set.
   */
  multi?: boolean;
  /**
   * For multi-select: called with the full Option[] when the user
   * taps Continue. For single-select: called with the Option the user
   * tapped. The screen's UserBubble + flow handles both shapes.
   */
  onAnswer: (answer: Option | Option[]) => void;
  /**
   * When provided, renders a "Skip" affordance. Advances the flow
   * without persisting an answer — the profile builder falls back
   * to a sensible default. Works in both modes.
   */
  onSkip?: () => void;
  /**
   * Multi-select only. When true, an "Add your own..." input sits
   * below the curated chips. Typed values become selectable chips
   * that commit alongside the preset selections.
   */
  allowCustom?: boolean;
}

interface ChipProps {
  option: Option;
  index: number;
  disabled: boolean;
  selected: boolean;
  onPress: () => void;
}

export const ChipTray: React.FC<ChipTrayProps> = ({
  options,
  onAnswer,
  disabled,
  multi = false,
  onSkip,
  allowCustom = false,
}) => {
  const { colors } = useTheme();
  const styles = useStyles();

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [customOptions, setCustomOptions] = useState<Option[]>([]);
  const [draft, setDraft] = useState("");

  // Reset when the question changes (options array identity flips).
  useEffect(() => {
    setSelected(new Set());
    setCustomOptions([]);
    setDraft("");
  }, [options]);

  const allOptions = [...options, ...customOptions];
  const customEnabled = multi && allowCustom;

  const toggle = (opt: Option) => {
    hapticLight();
    if (!multi) {
      onAnswer(opt);
      return;
    }
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(opt.v)) next.delete(opt.v);
      else next.add(opt.v);
      return next;
    });
  };

  const addCustom = () => {
    const name = draft.trim();
    if (!name) return;
    const v = `custom:${name.toLowerCase()}`;
    // Silently ignore duplicates (case-insensitive).
    if (allOptions.some((o) => o.v.toLowerCase() === v)) {
      setDraft("");
      return;
    }
    hapticLight();
    setCustomOptions((prev) => [...prev, { v, t: name }]);
    setSelected((prev) => {
      const next = new Set(prev);
      next.add(v);
      return next;
    });
    setDraft("");
  };

  const submitMulti = () => {
    hapticLight();
    if (selected.size === 0) {
      // No picks → treat as skip.
      if (onSkip) onSkip();
      else onAnswer([]);
      return;
    }
    // Commit ALL selected options, presets + custom, so the user
    // bubble reflects exactly what the user chose.
    onAnswer(allOptions.filter((o) => selected.has(o.v)));
  };

  const handleSkip = () => {
    hapticLight();
    onSkip?.();
  };

  const canAdd = draft.trim().length > 0 && !disabled;
  const selectedCount = selected.size;
  const continueLabel =
    selectedCount === 0
      ? "Continue"
      : selectedCount === 1
        ? "Continue · 1"
        : `Continue · ${selectedCount}`;

  return (
    <View style={{ gap: moderateScale(10) }}>
      <View style={styles.wrap}>
        {allOptions.map((opt, i) => (
          <Chip
            key={opt.v}
            option={opt}
            index={i}
            disabled={disabled}
            selected={multi && selected.has(opt.v)}
            onPress={() => toggle(opt)}
          />
        ))}
      </View>

      {customEnabled && (
        <View style={[styles.customRow, { borderColor: colors.border }]}>
          <TextInput
            value={draft}
            onChangeText={setDraft}
            placeholder="Add your own..."
            placeholderTextColor={colors.textTertiary}
            editable={!disabled}
            onSubmitEditing={addCustom}
            returnKeyType="done"
            style={[styles.customInput, { color: colors.textPrimary }]}
            accessibilityLabel="Add your own condition"
          />
          <Pressable
            onPress={addCustom}
            disabled={!canAdd}
            hitSlop={8}
            style={[
              styles.addBtn,
              {
                backgroundColor: canAdd ? colors.accent : colors.bgMuted,
                opacity: canAdd ? 1 : 0.7,
              },
            ]}
            accessibilityRole="button"
            accessibilityLabel="Add condition"
          >
            <Plus
              size={moderateScale(16)}
              color={canAdd ? "#FFFFFF" : colors.textTertiary}
              strokeWidth={2.6}
            />
          </Pressable>
        </View>
      )}

      {multi && (
        <View style={styles.actionRow}>
          {onSkip && (
            <Pressable
              onPress={handleSkip}
              disabled={disabled}
              style={[
                styles.skipBtn,
                { backgroundColor: colors.bgMuted, opacity: disabled ? 0.4 : 1 },
              ]}
              accessibilityRole="button"
              accessibilityLabel="Skip"
            >
              <Text style={[styles.skipBtnLabel, { color: colors.textPrimary }]}>Skip</Text>
            </Pressable>
          )}
          <Pressable
            onPress={submitMulti}
            disabled={disabled || selectedCount === 0}
            style={[
              styles.continueBtn,
              {
                backgroundColor: colors.accent,
                opacity: disabled || selectedCount === 0 ? 0.5 : 1,
              },
            ]}
            accessibilityRole="button"
            accessibilityLabel={continueLabel}
          >
            <Text style={styles.continueBtnLabel}>{continueLabel}</Text>
          </Pressable>
        </View>
      )}

      {!multi && onSkip && (
        <View style={styles.skipWrap}>
          <Pressable onPress={handleSkip} hitSlop={8} disabled={disabled}>
            <Text style={[styles.skipLink, { color: colors.textTertiary }]}>Skip</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
};

const Chip: React.FC<ChipProps> = ({ option, index, disabled, selected, onPress }) => {
  const { colors } = useTheme();
  const styles = useStyles();

  const tint = option.tint ?? colors.accent;

  const entryOpacity = useSharedValue(0);
  const entryTy = useSharedValue(10);
  useEffect(() => {
    const delay = index * QUALIFIER_TIMINGS.chipStaggerMs;
    entryOpacity.value = withDelay(
      delay,
      withTiming(1, {
        duration: QUALIFIER_TIMINGS.chipDurationMs,
        easing: Easing.out(Easing.cubic),
      }),
    );
    entryTy.value = withDelay(delay, withSpring(0, { damping: 18, stiffness: 160 }));
  }, [index, entryOpacity, entryTy]);

  const press = useSharedValue(0);

  const outerStyle = useAnimatedStyle(() => ({
    opacity: entryOpacity.value,
    transform: [{ translateY: entryTy.value }, { scale: 1 - press.value * 0.04 }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: selected ? 0.3 : press.value * 0.45,
  }));

  const { Icon } = option;

  return (
    <Animated.View style={[styles.outer, outerStyle]}>
      <Animated.View
        pointerEvents="none"
        style={[styles.glow, { backgroundColor: tint }, glowStyle]}
      />
      <Pressable
        onPress={onPress}
        disabled={disabled}
        onPressIn={() => {
          press.value = withTiming(1, { duration: 120 });
        }}
        onPressOut={() => {
          press.value = withTiming(0, { duration: 220 });
        }}
        style={({ pressed }) => [
          styles.chip,
          {
            borderColor: selected || pressed ? tint : colors.border,
            borderWidth: selected ? 1.5 : StyleSheet.hairlineWidth,
            backgroundColor: selected ? tint + "12" : colors.bgSurface,
            opacity: disabled ? 0.4 : 1,
          },
        ]}
        accessibilityRole="button"
        accessibilityLabel={option.t}
        accessibilityState={{ selected }}
      >
        {Icon && (
          <View style={[styles.iconTile, { backgroundColor: tint + "22" }]}>
            <Icon size={moderateScale(12)} color={tint} strokeWidth={2.4} />
          </View>
        )}
        <Text style={styles.label}>{option.t}</Text>
      </Pressable>
    </Animated.View>
  );
};

const useStyles = makeStyles((theme) => ({
  wrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: moderateScale(4),
    alignItems: "center",
    justifyContent: "center",
  },
  outer: {
    position: "relative",
  },
  glow: {
    position: "absolute",
    left: -2,
    right: -2,
    top: -2,
    bottom: -2,
    borderRadius: theme.radius.full,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: moderateScale(8),
    paddingLeft: scale(8),
    paddingRight: scale(8),
    paddingVertical: verticalScale(5),
    borderRadius: theme.radius.full,
    ...theme.shadows.card,
  },
  iconTile: {
    width: moderateScale(20),
    height: moderateScale(20),
    borderRadius: moderateScale(10),
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    ...theme.typography.label,
    color: theme.colors.textPrimary,
    fontFamily: "DMSans_600SemiBold",
    fontSize: fontScale(12),
  },
  customRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: moderateScale(8),
    paddingLeft: scale(14),
    paddingRight: scale(6),
    paddingVertical: verticalScale(4),
    borderRadius: theme.radius.full,
    borderWidth: StyleSheet.hairlineWidth,
    backgroundColor: "white",
  },
  customInput: {
    flex: 1,
    paddingVertical: verticalScale(6),
    fontFamily: "DMSans_400Regular",
    fontSize: fontScale(13),
  },
  addBtn: {
    width: moderateScale(32),
    height: moderateScale(32),
    borderRadius: moderateScale(16),
    alignItems: "center",
    justifyContent: "center",
  },
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: moderateScale(10),
    paddingTop: moderateScale(4),
  },
  skipBtn: {
    paddingHorizontal: scale(20),
    paddingVertical: verticalScale(12),
    borderRadius: theme.radius.full,
  },
  skipBtnLabel: {
    fontFamily: "DMSans_600SemiBold",
    fontSize: fontScale(13),
  },
  continueBtn: {
    flex: 1,
    alignItems: "center",
    paddingVertical: verticalScale(12),
    borderRadius: theme.radius.full,
  },
  continueBtnLabel: {
    color: "#FFFFFF",
    fontFamily: "DMSans_600SemiBold",
    fontSize: fontScale(14),
    letterSpacing: -0.1,
  },
  skipWrap: {
    alignItems: "center",
    paddingTop: moderateScale(4),
  },
  skipLink: {
    fontFamily: "DMSans_500Medium",
    fontSize: fontScale(13),
    textDecorationLine: "underline",
  },
}));
