import React from "react";
import { Text, View } from "react-native";
import Animated, { FadeIn, FadeOut, SharedValue } from "react-native-reanimated";
import {
  fontScale,
  makeStyles,
  moderateScale,
  spacing,
  verticalScale,
} from "@/theme";
import { Waveform } from "./Waveform";

interface RecordingModeProps {
  liveTranscript: string;
  volume: SharedValue<number>;
}

/**
 * Body for the "recording" mode of HoldToRecordOverlay — live interim
 * transcript centered, animated waveform under it, and a "Release to
 * save" hint at the bottom. Fully pointer-events: none; the user's
 * finger is on the home-screen mic button while this is up.
 */
export const RecordingMode: React.FC<RecordingModeProps> = ({ liveTranscript, volume }) => {
  const styles = useStyles();
  return (
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
  );
};

const useStyles = makeStyles(() => ({
  flex: { flex: 1 },
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
}));
