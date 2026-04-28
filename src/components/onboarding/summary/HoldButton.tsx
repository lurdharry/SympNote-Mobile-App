import React, { useEffect } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import { Mic } from "lucide-react-native";
import { makeStyles, moderateScale } from "@/theme";

interface HoldButtonProps {
  onPressIn: () => void;
  onPressOut: () => void;
  isRecording: boolean;
  /** When true, a teaching halo breathes around the button until the
   *  user completes their first hold. */
  highlight: boolean;
  reduced: boolean;
}

/**
 * Hold-to-record button on /onboarding/summary. Teal gradient mic
 * tile with a teaching halo that breathes until the first successful
 * hold; goes quiet thereafter for the rest of the session.
 */
export const HoldButton: React.FC<HoldButtonProps> = ({
  onPressIn,
  onPressOut,
  isRecording,
  highlight,
  reduced,
}) => {
  const styles = useStyles();
  const halo = useSharedValue(0);

  useEffect(() => {
    if (reduced || !highlight || isRecording) {
      halo.value = 0;
      return;
    }
    halo.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1100, easing: Easing.inOut(Easing.sin) }),
        withTiming(0, { duration: 1100, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
      false,
    );
  }, [highlight, isRecording, reduced, halo]);

  const haloStyle = useAnimatedStyle(() => ({
    opacity: 0.45 + halo.value * 0.4,
    transform: [{ scale: 1 + halo.value * 0.18 }],
  }));

  return (
    <View style={styles.wrap}>
      {highlight && <Animated.View pointerEvents="none" style={[styles.halo, haloStyle]} />}
      <Pressable
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        delayLongPress={500}
        accessibilityRole="button"
        accessibilityLabel="Hold to record your voice note"
        accessibilityHint="Press and hold to record. Release to save."
        style={styles.button}
      >
        <LinearGradient
          colors={["#4DB8B0", "#2C6E6B"]}
          start={{ x: 0.3, y: 0.3 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <Mic size={moderateScale(36)} color="#FFFFFF" strokeWidth={2} />
      </Pressable>
    </View>
  );
};

const useStyles = makeStyles(() => ({
  wrap: {
    alignItems: "center",
    justifyContent: "center",
    width: moderateScale(132),
    height: moderateScale(132),
  },
  halo: {
    position: "absolute",
    width: moderateScale(132),
    height: moderateScale(132),
    borderRadius: moderateScale(66),
    backgroundColor: "rgba(246,192,106,0.32)",
  },
  button: {
    width: moderateScale(96),
    height: moderateScale(96),
    borderRadius: moderateScale(48),
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 6,
    borderColor: "rgba(255,255,255,0.95)",
    shadowColor: "#2C6E6B",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.45,
    shadowRadius: 28,
    elevation: 14,
  },
}));
