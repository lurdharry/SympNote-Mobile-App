import React, { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
  Easing,
  SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { moderateScale, verticalScale } from "@/theme";
import { useReducedMotion } from "@/hooks/useReducedMotion";

const BAR_COUNT = 28;

interface WaveformProps {
  volume: SharedValue<number>;
}

/**
 * 28-bar waveform under the recording-mode transcript. Each bar has a
 * gentle idle breathing motion (staggered phase) layered with a live
 * scaleY driven by the smoothed mic volume — center bars amplify,
 * outer bars taper so the cluster reads as one organic pulse.
 */
export const Waveform: React.FC<WaveformProps> = ({ volume }) => {
  const smoothed = useSharedValue(0);
  useEffect(() => {
    const id = setInterval(() => {
      smoothed.value = smoothed.value + (volume.value - smoothed.value) * 0.25;
    }, 32);
    return () => clearInterval(id);
  }, [volume, smoothed]);
  return (
    <View style={styles.row}>
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
    <View style={styles.barWrap}>
      <Animated.View style={[styles.bar, style]} />
    </View>
  );
};

const styles = StyleSheet.create({
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
