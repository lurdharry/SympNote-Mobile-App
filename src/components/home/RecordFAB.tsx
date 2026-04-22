import React, { useEffect } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Mic } from 'lucide-react-native';
import { makeStyles, moderateScale, verticalScale } from '@/theme';
import { useReducedMotion } from '@/hooks/useReducedMotion';

interface RecordFABProps {
  onPress: () => void;
}

const PULSE_DURATION_MS = 1800;

export const RecordFAB: React.FC<RecordFABProps> = ({ onPress }) => {
  const styles = useStyles();
  const reduced = useReducedMotion();
  const pulse1 = useSharedValue(0);
  const pulse2 = useSharedValue(0);

  useEffect(() => {
    if (reduced) return;
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
  }, [reduced, pulse1, pulse2]);

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

  return (
    <View pointerEvents="box-none" style={styles.wrap}>
      <View style={styles.inner} pointerEvents="box-none">
        <Animated.View pointerEvents="none" style={[styles.ring, ring1Style]} />
        <Animated.View pointerEvents="none" style={[styles.ring, ring2Style]} />
        <Pressable
          onPress={onPress}
          accessibilityRole="button"
          accessibilityLabel="Start voice log"
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
      </View>
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
}));
