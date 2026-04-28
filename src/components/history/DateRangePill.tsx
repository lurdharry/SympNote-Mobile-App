import React, { useState } from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { Calendar, Check, ChevronDown } from "lucide-react-native";
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
} from "@/theme";
import { hapticLight } from "@/services/haptics";
import type { FeedDateRange } from "@/hooks/useHistoryData";

interface DateRangePillProps {
  range: FeedDateRange;
  onChange: (next: FeedDateRange) => void;
}

interface OptDef {
  v: FeedDateRange;
  short: string;
  label: string;
  hint: string;
}

const OPTIONS: OptDef[] = [
  { v: "all",   short: "All",    label: "All time",     hint: "Everything you've tracked." },
  { v: "today", short: "Today",  label: "Today",        hint: "Just what happened today." },
  { v: "7d",    short: "7d",     label: "Last 7 days",  hint: "Last week of activity." },
  { v: "30d",   short: "30d",    label: "Last 30 days", hint: "Last month of activity." },
];

/**
 * Compact date-range trigger that lives next to the search bar on the
 * History tab. Replaces the redundant chip row — same surface area
 * costs less visual weight and reads as "narrow further" rather than
 * "yet another filter row."
 *
 * Tapping opens a modal action sheet with all four range options
 * (matches the share-sheet pattern from /brief/[id]). Active option
 * shows a check pip; others show their hint copy underneath.
 */
export const DateRangePill: React.FC<DateRangePillProps> = ({ range, onChange }) => {
  const { colors } = useTheme();
  const styles = useStyles();
  const [open, setOpen] = useState(false);

  const active = OPTIONS.find((o) => o.v === range) ?? OPTIONS[0]!;

  const pick = (next: FeedDateRange) => {
    hapticLight();
    onChange(next);
    setOpen(false);
  };

  return (
    <>
      <Pressable
        onPress={() => {
          hapticLight();
          setOpen(true);
        }}
        style={[
          styles.pill,
          { backgroundColor: colors.bgSurface, borderColor: colors.border },
          shadows.card,
        ]}
        accessibilityRole="button"
        accessibilityLabel={`Date range: ${active.label}. Tap to change.`}
      >
        <Calendar size={14} color={colors.accent} strokeWidth={2.2} />
        <Text style={[styles.pillLabel, { color: colors.textPrimary }]}>{active.short}</Text>
        <ChevronDown size={12} color={colors.textTertiary} strokeWidth={2.2} />
      </Pressable>

      <Modal
        visible={open}
        transparent
        animationType="fade"
        onRequestClose={() => setOpen(false)}
        statusBarTranslucent
      >
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
          <Pressable
            style={[styles.sheet, { backgroundColor: colors.bgSurface }]}
            onPress={(e) => e.stopPropagation()}
          >
            <Text style={[styles.sheetTitle, { color: colors.textPrimary }]}>
              Date range
            </Text>
            <Text style={[styles.sheetSub, { color: colors.textSecondary }]}>
              Narrow the feed to a window. Active filter clears the rest.
            </Text>

            <View style={styles.optList}>
              {OPTIONS.map((o) => {
                const isActive = o.v === range;
                return (
                  <Pressable
                    key={o.v}
                    onPress={() => pick(o.v)}
                    style={[
                      styles.optRow,
                      {
                        borderColor: isActive ? colors.accent : colors.border,
                        backgroundColor: isActive ? colors.accent + "0E" : "transparent",
                      },
                    ]}
                  >
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Text
                        style={[
                          styles.optLabel,
                          { color: isActive ? colors.accent : colors.textPrimary },
                        ]}
                      >
                        {o.label}
                      </Text>
                      <Text style={[styles.optHint, { color: colors.textTertiary }]}>
                        {o.hint}
                      </Text>
                    </View>
                    <View
                      style={[
                        styles.optCheck,
                        {
                          backgroundColor: isActive ? colors.accent : "transparent",
                          borderColor: isActive ? colors.accent : colors.border,
                        },
                      ]}
                    >
                      {isActive && (
                        <Check size={moderateScale(13)} color="#FFFFFF" strokeWidth={3} />
                      )}
                    </View>
                  </Pressable>
                );
              })}
            </View>

            <Pressable
              onPress={() => setOpen(false)}
              style={[styles.cancel, { borderColor: colors.border }]}
            >
              <Text style={[styles.cancelText, { color: colors.textSecondary }]}>
                Cancel
              </Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
};

const useStyles = makeStyles((theme) => ({
  pill: {
    height: verticalScale(44),
    paddingHorizontal: scale(12),
    borderRadius: theme.radius.full,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    alignItems: "center",
    gap: moderateScale(6),
  },
  pillLabel: {
    fontFamily: "DMSans_700Bold",
    fontSize: fontScale(13),
    letterSpacing: -0.05,
  },
  // ── Modal sheet
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },
  sheet: {
    borderTopLeftRadius: theme.radius.xl,
    borderTopRightRadius: theme.radius.xl,
    paddingHorizontal: theme.spacing.s5,
    paddingTop: theme.spacing.s5,
    paddingBottom: theme.spacing.s8,
    gap: theme.spacing.s3,
  },
  sheetTitle: {
    fontFamily: "Fraunces_500Medium",
    fontSize: fontScale(22),
    letterSpacing: -0.3,
  },
  sheetSub: {
    ...typography.body,
    fontSize: fontScale(14),
    lineHeight: fontScale(20),
    marginBottom: spacing.s2,
  },
  optList: {
    gap: moderateScale(8),
  },
  optRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: moderateScale(12),
    paddingHorizontal: scale(14),
    paddingVertical: verticalScale(12),
    borderRadius: theme.radius.lg,
    borderWidth: 1,
  },
  optLabel: {
    fontFamily: "DMSans_700Bold",
    fontSize: fontScale(15),
    letterSpacing: -0.1,
  },
  optHint: {
    ...typography.caption,
    fontSize: fontScale(12),
    lineHeight: fontScale(17),
    marginTop: 2,
  },
  optCheck: {
    width: moderateScale(24),
    height: moderateScale(24),
    borderRadius: moderateScale(12),
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  cancel: {
    alignItems: "center",
    paddingVertical: verticalScale(12),
    borderRadius: theme.radius.full,
    borderWidth: StyleSheet.hairlineWidth,
    marginTop: spacing.s2,
  },
  cancelText: {
    fontFamily: "DMSans_600SemiBold",
    fontSize: fontScale(14),
    letterSpacing: 0.2,
  },
}));
