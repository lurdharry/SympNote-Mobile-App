import React, { useEffect } from "react";
import { StyleSheet, Text, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { fontScale, makeStyles, moderateScale } from "@/theme";
import { useReducedMotion } from "@/hooks/useReducedMotion";

interface TimerPillProps {
  /** Determines the leading dot — pulsing red while recording, steady
   *  teal once captured. */
  recording: boolean;
  /** Right-hand label — "0:42" while recording, "0:42 captured" after. */
  label: string;
}

/**
 * Dark-glass timer pill that anchors the top of the hold-to-record
 * overlay. Visible across all three modes; only the leading dot and
 * label content swap.
 */
export const TimerPill: React.FC<TimerPillProps> = ({ recording, label }) => {
  const styles = useStyles();
  return (
    <View style={styles.pill}>
      {recording ? <RecordingDot /> : <View style={styles.capturedDot} />}
      <Text style={styles.text}>{label}</Text>
    </View>
  );
};

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

const useStyles = makeStyles(() => ({
  pill: {
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
  text: {
    fontFamily: "DMSans_600SemiBold",
    fontSize: fontScale(12),
    letterSpacing: 0.8,
    color: "rgba(255,255,255,0.92)",
  },
}));
