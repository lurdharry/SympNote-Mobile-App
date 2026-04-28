import React, { useEffect, useState } from "react";
import { KeyboardAvoidingView, Platform, StyleSheet, View } from "react-native";
import Animated, {
  Easing,
  Extrapolation,
  interpolate,
  SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { BlurView } from "expo-blur";
import { makeStyles, verticalScale } from "@/theme";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { TimerPill } from "./hold-overlay/TimerPill";
import { RecordingMode } from "./hold-overlay/RecordingMode";
import { ReviewMode } from "./hold-overlay/ReviewMode";

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
  const timerLabel =
    mode === "recording"
      ? formatDuration(durationSec)
      : `${formatDuration(durationSec)} captured`;

  return (
    <View pointerEvents={visible ? "auto" : "none"} style={StyleSheet.absoluteFill}>
      <Animated.View style={[StyleSheet.absoluteFill, backdropStyle]}>
        <BlurView intensity={reduced ? 30 : 80} tint="dark" style={StyleSheet.absoluteFill} />
        <View style={styles.tint} />
      </Animated.View>

      <Animated.View style={[styles.timerWrap, timerStyle]} pointerEvents="none">
        <TimerPill recording={mode === "recording"} label={timerLabel} />
      </Animated.View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.flex}
      >
        {mode === "recording" && (
          <RecordingMode liveTranscript={liveTranscript} volume={volume} />
        )}
        {(mode === "review" || mode === "extracting") && (
          <ReviewMode
            extracting={mode === "extracting"}
            liveTranscript={liveTranscript}
            editValue={editValue}
            onEditChange={onEditChange}
            onSave={onSave}
            onReRecord={onReRecord}
            error={error}
            saveLabel={saveLabel}
            blocked={blocked}
          />
        )}
      </KeyboardAvoidingView>
    </View>
  );
};

const formatDuration = (s: number): string => {
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${r.toString().padStart(2, "0")}`;
};

const useStyles = makeStyles(() => ({
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
}));
