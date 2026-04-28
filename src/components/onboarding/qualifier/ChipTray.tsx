import React, { useEffect, useState } from "react";
import { Pressable, Text, View } from "react-native";
import {
  fontScale,
  makeStyles,
  moderateScale,
  scale,
  useTheme,
  verticalScale,
} from "@/theme";
import { Option } from "@/constants/onboarding";
import { hapticLight } from "@/services/haptics";
import { Chip } from "./Chip";
import { QualifierAddRow } from "./QualifierAddRow";

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
        <QualifierAddRow
          value={draft}
          onChange={setDraft}
          onSubmit={addCustom}
          disabled={disabled}
        />
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

const useStyles = makeStyles((theme) => ({
  wrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: moderateScale(4),
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
