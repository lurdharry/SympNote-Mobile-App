import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import Animated, {
  Easing,
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { BlurView } from "expo-blur";
import { X as XIcon } from "lucide-react-native";
import {
  fontScale,
  makeStyles,
  moderateScale,
  spacing,
  useTheme,
  verticalScale,
} from "@/theme";
import { useReducedMotion } from "@/hooks/useReducedMotion";

export type HoldReviewStatus = "analyzing" | "ready" | "saving" | "error";

interface HoldReviewSheetProps {
  visible: boolean;
  durationSec: number;
  editValue: string;
  onEditChange: (next: string) => void;
  /** Ambient AI status — drives a subtle pill under the transcript. */
  status: HoldReviewStatus;
  onSave: () => void;
  onReRecord: () => void;
  onClose: () => void;
  /** Error message shown inline when status='error'. Save button
   *  remains enabled so the user can retry. */
  error?: string | null;
  /** Seconds until retry is allowed — renders a countdown on the
   *  Save button when > 0. */
  retryInSec?: number;
}

const SCREEN_HEIGHT = Dimensions.get("window").height;

/**
 * Bottom sheet that slides up over home when the hold-to-record
 * gesture commits. Shows the captured transcript editable, an
 * ambient AI status pill, and Save / Re-record actions. AI runs
 * automatically while the sheet is open; Save waits for AI if the
 * user taps it before it finishes.
 */
export const HoldReviewSheet: React.FC<HoldReviewSheetProps> = ({
  visible,
  durationSec,
  editValue,
  onEditChange,
  status,
  onSave,
  onReRecord,
  onClose,
  error,
  retryInSec = 0,
}) => {
  const { colors } = useTheme();
  const styles = useStyles();
  const reduced = useReducedMotion();

  const progress = useSharedValue(0);
  const [mounted, setMounted] = useState(visible);
  const exitDuration = reduced ? 120 : 260;

  useEffect(() => {
    if (visible) {
      setMounted(true);
      progress.value = reduced
        ? withTiming(1, { duration: 120 })
        : withSpring(1, { damping: 22, stiffness: 170, mass: 0.85 });
      return;
    }
    progress.value = withTiming(0, {
      duration: exitDuration,
      easing: Easing.in(Easing.cubic),
    });
    const id = setTimeout(() => setMounted(false), exitDuration + 20);
    return () => clearTimeout(id);
  }, [visible, reduced, progress, exitDuration]);

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 1], [0, 0.55], Extrapolation.CLAMP),
  }));
  const sheetStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateY: interpolate(
          progress.value,
          [0, 1],
          [SCREEN_HEIGHT, 0],
          Extrapolation.CLAMP,
        ),
      },
    ],
  }));

  if (!mounted) return null;

  const blocked = retryInSec > 0;
  const busy = status === "analyzing" || status === "saving";
  const saveLabel = blocked
    ? `Try again in ${retryInSec}s`
    : status === "saving"
      ? "Saving…"
      : "Save";

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents={visible ? "auto" : "none"}>
      {/* Backdrop — tap to close only if we're not busy. */}
      <Animated.View style={[StyleSheet.absoluteFill, backdropStyle]}>
        <BlurView intensity={reduced ? 20 : 40} tint="dark" style={StyleSheet.absoluteFill} />
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={busy ? undefined : onClose}
          accessibilityLabel="Dismiss"
        />
      </Animated.View>

      <Animated.View style={[styles.sheetWrap, sheetStyle]}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={styles.sheet}
        >
          <View style={[styles.sheetInner, { backgroundColor: colors.bgSurface }]}>
            {/* Drag handle */}
            <View style={styles.handleWrap}>
              <View style={[styles.handle, { backgroundColor: colors.border }]} />
            </View>

            {/* Header row — duration + close */}
            <View style={styles.headerRow}>
              <View style={styles.headerMeta}>
                <View style={[styles.capturedDot, { backgroundColor: colors.accent }]} />
                <Text style={[styles.headerLabel, { color: colors.textSecondary }]}>
                  {formatDuration(durationSec)} captured
                </Text>
              </View>
              <Pressable
                onPress={onClose}
                disabled={busy}
                hitSlop={10}
                style={[
                  styles.closeBtn,
                  { backgroundColor: colors.bgMuted, opacity: busy ? 0.45 : 1 },
                ]}
                accessibilityRole="button"
                accessibilityLabel="Close"
              >
                <XIcon size={moderateScale(16)} color={colors.textPrimary} strokeWidth={2} />
              </Pressable>
            </View>

            {/* Editable transcript */}
            <TextInput
              value={editValue}
              onChangeText={onEditChange}
              multiline
              scrollEnabled
              textAlignVertical="top"
              editable={!busy}
              style={[styles.transcriptInput, { color: colors.textPrimary }]}
              placeholder="Your words will appear here…"
              placeholderTextColor={colors.textTertiary}
            />

            {/* AI status pill */}
            <View style={styles.statusRow}>
              <StatusPill status={status} />
            </View>

            {/* Error inline */}
            {status === "error" && error && (
              <View style={[styles.errorBox, { borderColor: colors.error }]}>
                <Text style={[styles.errorLabel, { color: colors.error }]}>
                  Couldn't process that
                </Text>
                <Text style={[styles.errorBody, { color: colors.textPrimary }]}>{error}</Text>
              </View>
            )}

            {/* Actions */}
            <View style={styles.actionsWrap}>
              <Pressable
                onPress={onSave}
                disabled={blocked || status === "saving"}
                style={({ pressed }) => [
                  styles.saveBtn,
                  {
                    backgroundColor: colors.accent,
                    opacity:
                      blocked || status === "saving"
                        ? 0.55
                        : pressed
                          ? 0.88
                          : 1,
                  },
                ]}
                accessibilityRole="button"
                accessibilityLabel={saveLabel}
              >
                {status === "saving" ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.saveLabel}>{saveLabel}</Text>
                )}
              </Pressable>
              <Pressable
                onPress={onReRecord}
                disabled={busy}
                hitSlop={8}
                style={({ pressed }) => [
                  styles.reRecordBtn,
                  { opacity: busy ? 0.4 : pressed ? 0.6 : 1 },
                ]}
                accessibilityRole="button"
                accessibilityLabel="Re-record"
              >
                <Text style={[styles.reRecordLabel, { color: colors.textSecondary }]}>
                  Re-record
                </Text>
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Animated.View>
    </View>
  );
};

// ── Status pill ────────────────────────────────────────────────────

const StatusPill: React.FC<{ status: HoldReviewStatus }> = ({ status }) => {
  const { colors } = useTheme();
  const styles = useStyles();
  if (status === "error") return null;
  const label =
    status === "analyzing"
      ? "Analyzing…"
      : status === "saving"
        ? "Saving…"
        : "Ready to save";
  const bg =
    status === "ready"
      ? colors.accent + "14"
      : colors.bgMuted;
  const fg = status === "ready" ? colors.accent : colors.textSecondary;
  return (
    <View style={[styles.statusPill, { backgroundColor: bg }]}>
      {(status === "analyzing" || status === "saving") && (
        <ActivityIndicator size="small" color={fg} />
      )}
      {status === "ready" && <View style={[styles.readyDot, { backgroundColor: fg }]} />}
      <Text style={[styles.statusLabel, { color: fg }]}>{label}</Text>
    </View>
  );
};

// ── Helpers ────────────────────────────────────────────────────────

const formatDuration = (s: number): string => {
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${r.toString().padStart(2, "0")}`;
};

const useStyles = makeStyles((theme) => ({
  sheetWrap: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    top: 0,
    justifyContent: "flex-end",
  },
  sheet: {
    width: "100%",
  },
  sheetInner: {
    borderTopLeftRadius: moderateScale(28),
    borderTopRightRadius: moderateScale(28),
    paddingHorizontal: spacing.s6,
    paddingBottom: verticalScale(28),
    paddingTop: verticalScale(10),
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.2,
    shadowRadius: 24,
    elevation: 18,
  },
  handleWrap: {
    alignItems: "center",
    paddingBottom: verticalScale(8),
  },
  handle: {
    width: moderateScale(38),
    height: 4,
    borderRadius: 2,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: verticalScale(12),
  },
  headerMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: moderateScale(8),
  },
  capturedDot: {
    width: moderateScale(7),
    height: moderateScale(7),
    borderRadius: moderateScale(4),
  },
  headerLabel: {
    fontFamily: "DMSans_600SemiBold",
    fontSize: fontScale(12),
    letterSpacing: 0.4,
  },
  closeBtn: {
    width: moderateScale(30),
    height: moderateScale(30),
    borderRadius: moderateScale(15),
    alignItems: "center",
    justifyContent: "center",
  },
  transcriptInput: {
    fontFamily: "Fraunces_400Regular",
    fontSize: fontScale(18),
    lineHeight: fontScale(28),
    letterSpacing: -0.2,
    minHeight: verticalScale(140),
    maxHeight: verticalScale(220),
    paddingVertical: verticalScale(8),
    paddingHorizontal: 0,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: verticalScale(4),
    marginBottom: verticalScale(12),
  },
  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: moderateScale(6),
    paddingHorizontal: moderateScale(10),
    paddingVertical: moderateScale(5),
    borderRadius: 999,
  },
  readyDot: {
    width: moderateScale(6),
    height: moderateScale(6),
    borderRadius: moderateScale(3),
  },
  statusLabel: {
    fontFamily: "DMSans_600SemiBold",
    fontSize: fontScale(11),
    letterSpacing: 0.6,
  },
  errorBox: {
    padding: moderateScale(12),
    borderRadius: theme.radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    backgroundColor: "rgba(184,84,80,0.08)",
    marginBottom: verticalScale(12),
  },
  errorLabel: {
    fontFamily: "DMSans_700Bold",
    fontSize: fontScale(11),
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  errorBody: {
    marginTop: 3,
    fontFamily: "DMSans_500Medium",
    fontSize: fontScale(13),
    lineHeight: fontScale(18),
  },
  actionsWrap: {
    marginTop: verticalScale(4),
    gap: moderateScale(8),
  },
  saveBtn: {
    height: verticalScale(52),
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
  },
  saveLabel: {
    color: "#FFFFFF",
    fontFamily: "DMSans_700Bold",
    fontSize: fontScale(16),
    letterSpacing: -0.15,
  },
  reRecordBtn: {
    height: verticalScale(44),
    alignItems: "center",
    justifyContent: "center",
  },
  reRecordLabel: {
    fontFamily: "DMSans_600SemiBold",
    fontSize: fontScale(13),
    letterSpacing: 0.2,
    textDecorationLine: "underline",
  },
}));
