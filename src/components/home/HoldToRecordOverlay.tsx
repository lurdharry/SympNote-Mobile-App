import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import Animated, {
  Easing,
  Extrapolation,
  FadeIn,
  FadeOut,
  interpolate,
  SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { BlurView } from "expo-blur";
import { Check, Users } from "lucide-react-native";
import {
  fontScale,
  makeStyles,
  moderateScale,
  scale,
  spacing,
  verticalScale,
} from "@/theme";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import type { Clinician } from "@/stores/types";
import { hapticLight } from "@/services/haptics";

/**
 * Three modes:
 *  - `recording`   — mic is live; waveform + "release to save" hint
 *  - `review`      — transcript editable, Save / Re-record actions
 *  - `extracting`  — AI running; spinner + gentle reassurance
 * The overlay never unmounts between modes (unless the user cancels);
 * content fades between them so the whole post-release ritual feels
 * like one continuous surface.
 */
export type HoldOverlayMode = "recording" | "review" | "extracting";

interface HoldToRecordOverlayProps {
  visible: boolean;
  mode: HoldOverlayMode;
  /** Live interim transcript (recording mode) or locked transcript
   *  (review/extracting). */
  liveTranscript: string;
  /** Seconds elapsed — either live while recording, or the captured
   *  duration afterwards. */
  durationSec: number;
  volume: SharedValue<number>;
  /** Editable value used by the review-mode TextInput. */
  editValue?: string;
  onEditChange?: (next: string) => void;
  onSave?: () => void;
  onReRecord?: () => void;
  /** Error message to show in review mode (AI failure). Caller owns
   *  dismissing it on the next try. */
  error?: string | null;
  /** Seconds until retry is allowed — renders a countdown on the
   *  save button when > 0. */
  retryInSec?: number;
  /** Optional clinician routing in review mode. The row hides itself
   *  entirely when careTeam is empty. */
  careTeam?: Clinician[];
  selectedClinicians?: string[];
  onToggleClinician?: (name: string) => void;
}

export const HoldToRecordOverlay: React.FC<HoldToRecordOverlayProps> = ({
  visible,
  mode,
  liveTranscript,
  durationSec,
  volume,
  editValue,
  onEditChange,
  onSave,
  onReRecord,
  error,
  retryInSec = 0,
  careTeam = [],
  selectedClinicians = [],
  onToggleClinician,
}) => {
  const styles = useStyles();
  const reduced = useReducedMotion();

  const progress = useSharedValue(0);
  const [mounted, setMounted] = useState(visible);
  const exitDuration = reduced ? 100 : 240;

  useEffect(() => {
    if (visible) {
      setMounted(true);
      progress.value = reduced
        ? withTiming(1, { duration: 90 })
        : withSpring(1, { damping: 20, stiffness: 160, mass: 0.8 });
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
    opacity: interpolate(progress.value, [0, 1], [0, 1], Extrapolation.CLAMP),
  }));

  const timerStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 0.4, 1], [0, 0, 1]),
    transform: [{ translateY: interpolate(progress.value, [0, 1], [-12, 0]) }],
  }));

  if (!mounted) return null;

  const blocked = retryInSec > 0;
  const saveLabel = blocked
    ? `Try again in ${retryInSec}s`
    : mode === "extracting"
      ? "Analyzing…"
      : "Save";

  return (
    <View pointerEvents={visible ? "auto" : "none"} style={StyleSheet.absoluteFill}>
      <Animated.View style={[StyleSheet.absoluteFill, backdropStyle]}>
        <BlurView intensity={reduced ? 30 : 80} tint="dark" style={StyleSheet.absoluteFill} />
        <View style={styles.tint} />
      </Animated.View>

      {/* Timer pill — consistent across modes; only the label content
          swaps (live duration vs. captured duration). */}
      <Animated.View style={[styles.timerWrap, timerStyle]} pointerEvents="none">
        <View style={styles.timerPill}>
          {mode === "recording" ? (
            <RecordingDot />
          ) : (
            <View style={styles.capturedDot} />
          )}
          <Text style={styles.timerText}>
            {mode === "recording"
              ? formatDuration(durationSec)
              : `${formatDuration(durationSec)} captured`}
          </Text>
        </View>
      </Animated.View>

      {/* Mode-specific body */}
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.flex}
      >
        {mode === "recording" && (
          <Animated.View
            key="recording"
            entering={FadeIn.duration(220)}
            exiting={FadeOut.duration(160)}
            style={styles.flex}
            pointerEvents="none"
          >
            <View style={styles.transcriptWrap}>
              <Text style={styles.transcript} numberOfLines={5}>
                {liveTranscript || "Listening…"}
              </Text>
            </View>
            <View style={styles.waveformWrap}>
              <Waveform volume={volume} />
            </View>
            <View style={styles.hintWrap}>
              <Text style={styles.hintText}>Release to save</Text>
            </View>
          </Animated.View>
        )}

        {(mode === "review" || mode === "extracting") && (
          <Animated.View
            key="review"
            entering={FadeIn.duration(260)}
            exiting={FadeOut.duration(180)}
            style={styles.flex}
          >
            <View style={styles.editWrap}>
              <Text style={styles.editCaption}>Check what we heard — tap to edit</Text>
              <TextInput
                value={editValue ?? liveTranscript}
                onChangeText={onEditChange}
                multiline
                scrollEnabled
                textAlignVertical="top"
                editable={mode === "review"}
                style={styles.editInput}
                placeholder="Your words will appear here…"
                placeholderTextColor="rgba(255,255,255,0.45)"
              />
              {error && mode === "review" && (
                <View style={styles.errorBox}>
                  <Text style={styles.errorLabel}>Couldn't process that</Text>
                  <Text style={styles.errorBody}>{error}</Text>
                </View>
              )}
            </View>

            {mode === "review" && careTeam.length > 0 && (
              <View style={styles.clinicianWrap}>
                <Text style={styles.clinicianLabel}>ROUTE TO</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.clinicianChips}
                >
                  {(() => {
                    const generalActive = selectedClinicians.length === 0;
                    return (
                      <View
                        style={[
                          styles.chip,
                          generalActive ? styles.chipActive : styles.chipIdle,
                        ]}
                      >
                        <Users
                          size={moderateScale(12)}
                          color={
                            generalActive
                              ? "#7FE0D6"
                              : "rgba(255,255,255,0.55)"
                          }
                          strokeWidth={2.2}
                        />
                        <Text
                          style={[
                            styles.chipLabel,
                            {
                              color: generalActive
                                ? "#7FE0D6"
                                : "rgba(255,255,255,0.78)",
                            },
                          ]}
                        >
                          Everyone
                        </Text>
                      </View>
                    );
                  })()}
                  {careTeam.map((c) => {
                    const active = selectedClinicians.some(
                      (s) => s.trim().toLowerCase() === c.name.trim().toLowerCase(),
                    );
                    return (
                      <Pressable
                        key={`${c.name}-${c.role}`}
                        onPress={() => {
                          hapticLight();
                          onToggleClinician?.(c.name);
                        }}
                        style={[
                          styles.chip,
                          active ? styles.chipActive : styles.chipIdle,
                        ]}
                      >
                        {active && (
                          <Check
                            size={moderateScale(12)}
                            color="#7FE0D6"
                            strokeWidth={2.4}
                          />
                        )}
                        <Text
                          style={[
                            styles.chipLabel,
                            {
                              color: active
                                ? "#7FE0D6"
                                : "rgba(255,255,255,0.88)",
                            },
                          ]}
                          numberOfLines={1}
                        >
                          {c.name}
                        </Text>
                      </Pressable>
                    );
                  })}
                </ScrollView>
              </View>
            )}

            <View style={styles.actionsWrap}>
              <Pressable
                onPress={onSave}
                disabled={mode === "extracting" || blocked}
                style={({ pressed }) => [
                  styles.saveBtn,
                  {
                    opacity: mode === "extracting" || blocked ? 0.7 : pressed ? 0.88 : 1,
                  },
                ]}
                accessibilityRole="button"
                accessibilityLabel={saveLabel}
              >
                {mode === "extracting" ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.saveLabel}>{saveLabel}</Text>
                )}
              </Pressable>
              <Pressable
                onPress={onReRecord}
                disabled={mode === "extracting"}
                style={({ pressed }) => [
                  styles.secondaryBtn,
                  { opacity: mode === "extracting" ? 0.4 : pressed ? 0.7 : 1 },
                ]}
                accessibilityRole="button"
                accessibilityLabel="Re-record"
              >
                <Text style={styles.secondaryLabel}>Re-record</Text>
              </Pressable>
            </View>
          </Animated.View>
        )}
      </KeyboardAvoidingView>
    </View>
  );
};

// ── Recording dot ──────────────────────────────────────────────────

const RecordingDot: React.FC = () => {
  const reduced = useReducedMotion();
  const pulse = useSharedValue(1);
  useEffect(() => {
    if (reduced) return;
    pulse.value = withRepeat(
      withSequence(
        withTiming(0.45, { duration: 720, easing: Easing.out(Easing.sin) }),
        withTiming(1, { duration: 720, easing: Easing.in(Easing.sin) }),
      ),
      -1,
      false,
    );
  }, [reduced, pulse]);
  const style = useAnimatedStyle(() => ({ opacity: pulse.value }));
  return <Animated.View style={[dotStyles.dot, style]} />;
};

const dotStyles = StyleSheet.create({
  dot: {
    width: moderateScale(7),
    height: moderateScale(7),
    borderRadius: moderateScale(4),
    backgroundColor: "#F06060",
  },
});

// ── Waveform ────────────────────────────────────────────────────────

const BAR_COUNT = 28;

interface WaveformProps {
  volume: SharedValue<number>;
}

const Waveform: React.FC<WaveformProps> = ({ volume }) => {
  const smoothed = useSharedValue(0);
  useEffect(() => {
    const id = setInterval(() => {
      smoothed.value = smoothed.value + (volume.value - smoothed.value) * 0.25;
    }, 32);
    return () => clearInterval(id);
  }, [volume, smoothed]);
  return (
    <View style={waveStyles.row}>
      {Array.from({ length: BAR_COUNT }, (_, i) => (
        <WaveBar key={i} index={i} volume={smoothed} />
      ))}
    </View>
  );
};

interface WaveBarProps {
  index: number;
  volume: SharedValue<number>;
}

const WaveBar: React.FC<WaveBarProps> = ({ index, volume }) => {
  const reduced = useReducedMotion();
  const t = useSharedValue(0);

  useEffect(() => {
    if (reduced) return;
    const dur = 900 + (index % 4) * 140;
    const startDelay = (index * 70) % 900;
    const id = setTimeout(() => {
      t.value = withRepeat(
        withSequence(
          withTiming(1, { duration: dur / 2, easing: Easing.inOut(Easing.sin) }),
          withTiming(0, { duration: dur / 2, easing: Easing.inOut(Easing.sin) }),
        ),
        -1,
        false,
      );
    }, startDelay);
    return () => clearTimeout(id);
  }, [index, reduced, t]);

  const distFromCenter = Math.abs(index - (BAR_COUNT - 1) / 2) / ((BAR_COUNT - 1) / 2);
  const envelope = 1 - distFromCenter * 0.55;

  const style = useAnimatedStyle(() => {
    const idleAmp = 0.18 + t.value * 0.22;
    const liveAmp = volume.value * 1.1;
    const h = Math.min(1, (idleAmp + liveAmp) * envelope);
    return { transform: [{ scaleY: 0.15 + h }] };
  });

  return (
    <View style={waveStyles.barWrap}>
      <Animated.View style={[waveStyles.bar, style]} />
    </View>
  );
};

const waveStyles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: verticalScale(56),
    gap: moderateScale(3),
  },
  barWrap: {
    height: verticalScale(56),
    justifyContent: "center",
    alignItems: "center",
  },
  bar: {
    width: moderateScale(3),
    height: verticalScale(56),
    borderRadius: moderateScale(2),
    backgroundColor: "rgba(255,255,255,0.85)",
  },
});

// ── Helpers ────────────────────────────────────────────────────────

const formatDuration = (s: number): string => {
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${r.toString().padStart(2, "0")}`;
};

const useStyles = makeStyles((theme) => ({
  flex: { flex: 1 },
  tint: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(8, 14, 14, 0.42)",
  },
  timerWrap: {
    position: "absolute",
    top: verticalScale(78),
    left: 0,
    right: 0,
    alignItems: "center",
    zIndex: 2,
  },
  timerPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: moderateScale(8),
    paddingHorizontal: moderateScale(14),
    paddingVertical: moderateScale(7),
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.18)",
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  capturedDot: {
    width: moderateScale(7),
    height: moderateScale(7),
    borderRadius: moderateScale(4),
    backgroundColor: "#6FBDB6",
  },
  timerText: {
    fontFamily: "DMSans_600SemiBold",
    fontSize: fontScale(12),
    letterSpacing: 0.8,
    color: "rgba(255,255,255,0.92)",
  },
  // ── Recording mode
  transcriptWrap: {
    position: "absolute",
    top: "28%",
    bottom: "32%",
    left: 0,
    right: 0,
    paddingHorizontal: spacing.s6,
    alignItems: "center",
    justifyContent: "center",
  },
  transcript: {
    fontFamily: "Fraunces_400Regular",
    fontSize: fontScale(26),
    lineHeight: fontScale(36),
    letterSpacing: -0.4,
    textAlign: "center",
    color: "rgba(255,255,255,0.96)",
    maxWidth: moderateScale(340),
  },
  waveformWrap: {
    position: "absolute",
    bottom: verticalScale(170),
    left: 0,
    right: 0,
    alignItems: "center",
  },
  hintWrap: {
    position: "absolute",
    bottom: verticalScale(124),
    left: 0,
    right: 0,
    alignItems: "center",
  },
  hintText: {
    fontFamily: "DMSans_600SemiBold",
    fontSize: fontScale(11),
    letterSpacing: 1.4,
    textTransform: "uppercase",
    color: "rgba(255,255,255,0.65)",
  },
  // ── Review / extracting modes
  editWrap: {
    position: "absolute",
    top: verticalScale(130),
    bottom: verticalScale(290),
    left: 0,
    right: 0,
    paddingHorizontal: spacing.s6,
  },
  clinicianWrap: {
    position: "absolute",
    bottom: verticalScale(208),
    left: 0,
    right: 0,
    gap: moderateScale(8),
  },
  clinicianLabel: {
    fontFamily: "DMSans_700Bold",
    fontSize: fontScale(10),
    letterSpacing: 1.2,
    color: "rgba(255,255,255,0.55)",
    paddingHorizontal: spacing.s6,
  },
  clinicianChips: {
    flexDirection: "row",
    gap: moderateScale(8),
    paddingHorizontal: spacing.s6,
    paddingRight: scale(20),
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: moderateScale(6),
    paddingHorizontal: scale(12),
    paddingVertical: verticalScale(7),
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
  },
  chipIdle: {
    backgroundColor: "rgba(255,255,255,0.06)",
    borderColor: "rgba(255,255,255,0.18)",
  },
  chipActive: {
    backgroundColor: "rgba(127,224,214,0.16)",
    borderColor: "#7FE0D6",
  },
  chipLabel: {
    fontFamily: "DMSans_600SemiBold",
    fontSize: fontScale(12),
    letterSpacing: 0.2,
  },
  editCaption: {
    fontFamily: "DMSans_600SemiBold",
    fontSize: fontScale(11),
    letterSpacing: 1.2,
    textTransform: "uppercase",
    color: "rgba(255,255,255,0.55)",
    textAlign: "center",
    marginBottom: verticalScale(12),
  },
  editInput: {
    flex: 1,
    fontFamily: "Fraunces_400Regular",
    fontSize: fontScale(20),
    lineHeight: fontScale(30),
    letterSpacing: -0.3,
    color: "rgba(255,255,255,0.96)",
    textAlign: "center",
    padding: 0,
    margin: 0,
  },
  errorBox: {
    marginTop: verticalScale(12),
    padding: moderateScale(12),
    borderRadius: theme.radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(240,120,95,0.55)",
    backgroundColor: "rgba(240,120,95,0.14)",
  },
  errorLabel: {
    fontFamily: "DMSans_700Bold",
    fontSize: fontScale(11),
    letterSpacing: 0.8,
    color: "#F4A99A",
    textTransform: "uppercase",
  },
  errorBody: {
    marginTop: 3,
    fontFamily: "DMSans_500Medium",
    fontSize: fontScale(13),
    color: "rgba(255,255,255,0.9)",
  },
  actionsWrap: {
    position: "absolute",
    bottom: verticalScale(104),
    left: 0,
    right: 0,
    paddingHorizontal: spacing.s6,
    gap: moderateScale(10),
  },
  saveBtn: {
    height: verticalScale(54),
    borderRadius: 999,
    backgroundColor: "#3BA79F",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#3BA79F",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 10,
  },
  saveLabel: {
    color: "#FFFFFF",
    fontFamily: "DMSans_700Bold",
    fontSize: fontScale(16),
    letterSpacing: -0.15,
  },
  secondaryBtn: {
    height: verticalScale(48),
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.22)",
    backgroundColor: "rgba(255,255,255,0.04)",
  },
  secondaryLabel: {
    color: "rgba(255,255,255,0.88)",
    fontFamily: "DMSans_600SemiBold",
    fontSize: fontScale(14),
    letterSpacing: 0.2,
  },
}));
