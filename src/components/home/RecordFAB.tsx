import React, { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  FadeIn,
  FadeOut,
  SharedValue,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withRepeat,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Mic } from 'lucide-react-native';
import { fontScale, makeStyles, moderateScale, useTheme, verticalScale } from '@/theme';
import { useReducedMotion } from '@/hooks/useReducedMotion';

interface RecordFABProps {
  /** Invoked when a press-and-release did not commit to recording
   *  (short tap below the hold threshold). The page uses this to
   *  show a "Hold to record" toast. Required. */
  onPressIn: () => void;
  onPressOut: () => void;
  /** True while the user is actively holding and recording. Drives
   *  the FAB's expanded/pulsing visual state. */
  isRecording: boolean;
  /** Optional volume 0-1 to pulse the FAB in sync with speech. */
  volume?: SharedValue<number>;
}

const PULSE_DURATION_MS = 1800;

export const RecordFAB: React.FC<RecordFABProps> = ({
  onPressIn,
  onPressOut,
  isRecording,
  volume,
}) => {
  const styles = useStyles();
  const { colors } = useTheme();
  const reduced = useReducedMotion();
  const pulse1 = useSharedValue(0);
  const pulse2 = useSharedValue(0);

  // Ambient breathing rings (pre-record). Stopped while holding so
  // the FAB's own reactive pulse can read without competition.
  useEffect(() => {
    if (reduced || isRecording) {
      pulse1.value = 0;
      pulse2.value = 0;
      return;
    }
    pulse1.value = withRepeat(
      withTiming(1, { duration: PULSE_DURATION_MS, easing: Easing.bezier(0.4, 0, 0.6, 1) }),
      -1,
      false,
    );
    const id = setTimeout(() => {
      pulse2.value = withRepeat(
        withTiming(1, { duration: PULSE_DURATION_MS, easing: Easing.bezier(0.4, 0, 0.6, 1) }),
        -1,
        false,
      );
    }, 900);
    return () => clearTimeout(id);
  }, [reduced, isRecording, pulse1, pulse2]);

  const ring1Style = useAnimatedStyle(() => ({
    opacity: 0.45 * (1 - pulse1.value),
    transform: [{ scale: 1 + pulse1.value * 0.5 }],
    backgroundColor: 'rgba(44,110,107,0.22)',
  }));
  const ring2Style = useAnimatedStyle(() => ({
    opacity: 0.45 * (1 - pulse2.value),
    transform: [{ scale: 1 + pulse2.value * 0.5 }],
    backgroundColor: 'rgba(246,192,106,0.24)',
  }));

  // While holding, the FAB swells slightly and pulses with volume.
  const holdScale = useDerivedValue(() => {
    if (!isRecording) return 1;
    const base = 1.12;
    const bounce = volume ? volume.value * 0.08 : 0;
    return base + bounce;
  }, [isRecording]);

  const fabStyle = useAnimatedStyle(() => ({
    transform: [{ scale: withSpring(holdScale.value, { damping: 14, stiffness: 180 }) }],
  }));

  return (
    <View pointerEvents="box-none" style={styles.wrap}>
      <View style={styles.inner} pointerEvents="box-none">
        <Animated.View pointerEvents="none" style={[styles.ring, ring1Style]} />
        <Animated.View pointerEvents="none" style={[styles.ring, ring2Style]} />
        <Animated.View style={fabStyle}>
          <Pressable
            onPressIn={onPressIn}
            onPressOut={onPressOut}
            delayLongPress={500}
            accessibilityRole="button"
            accessibilityLabel="Record or type a note"
            accessibilityHint="Hold to record a voice note. Tap once to open the typing screen."
            style={styles.fab}
          >
            <LinearGradient
              colors={['#4DB8B0', '#2C6E6B']}
              start={{ x: 0.3, y: 0.3 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
            <Mic size={28} color="#FFFFFF" strokeWidth={2} />
          </Pressable>
        </Animated.View>
      </View>

      {!isRecording && (
        <Animated.View
          pointerEvents="none"
          entering={FadeIn.duration(220)}
          exiting={FadeOut.duration(140)}
          style={styles.caption}
        >
          <Text style={[styles.captionText, { color: colors.textTertiary }]}>Hold to record</Text>
          <View style={[styles.captionDot, { backgroundColor: colors.textTertiary }]} />
          <Text style={[styles.captionText, { color: colors.textTertiary }]}>Tap to type</Text>
        </Animated.View>
      )}
    </View>
  );
};

const useStyles = makeStyles(() => ({
  wrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: verticalScale(92),
    alignItems: 'center',
    justifyContent: 'center',
  },
  inner: {
    width: moderateScale(68),
    height: moderateScale(68),
    alignItems: 'center',
    justifyContent: 'center',
  },
  ring: {
    position: 'absolute',
    width: moderateScale(68),
    height: moderateScale(68),
    borderRadius: moderateScale(34),
  },
  fab: {
    width: moderateScale(68),
    height: moderateScale(68),
    borderRadius: moderateScale(34),
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 6,
    borderColor: 'rgba(255,255,255,0.9)',
    shadowColor: '#2C6E6B',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.45,
    shadowRadius: 28,
    elevation: 14,
  },
  caption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(8),
    marginTop: verticalScale(8),
  },
  captionText: {
    fontFamily: 'DMSans_500Medium',
    fontSize: fontScale(11),
    letterSpacing: 0.2,
  },
  captionDot: {
    width: 3,
    height: 3,
    borderRadius: 2,
    opacity: 0.6,
  },
}));
