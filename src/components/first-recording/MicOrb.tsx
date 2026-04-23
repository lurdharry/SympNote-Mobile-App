import React, { useEffect } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle as SvgCircle, Defs, RadialGradient, Stop } from 'react-native-svg';
import { Mic } from 'lucide-react-native';
import { makeStyles, moderateScale } from '@/theme';

export type MicOrbPhase = 'idle' | 'recording' | 'ready';

interface MicOrbProps {
  phase: MicOrbPhase;
  onPress: () => void;
  reduced: boolean;
}

interface MicOrbGradientProps {
  active: boolean;
}

const MicOrbGradient: React.FC<MicOrbGradientProps> = ({ active }) => (
  <Svg width="100%" height="100%" viewBox="0 0 120 120">
    <Defs>
      <RadialGradient id="micG" cx="0.3" cy="0.3" r="0.9">
        <Stop offset="0" stopColor={active ? '#F5A3A3' : '#4DB8B0'} />
        <Stop offset="0.85" stopColor={active ? '#C45C3F' : '#2C6E6B'} />
      </RadialGradient>
    </Defs>
    <SvgCircle cx={60} cy={60} r={60} fill="url(#micG)" />
  </Svg>
);

export const MicOrb: React.FC<MicOrbProps> = ({ phase, onPress, reduced }) => {
  const styles = useStyles();
  const active = phase === 'recording';
  const pulse1 = useSharedValue(0);
  const pulse2 = useSharedValue(0);

  useEffect(() => {
    if (reduced || phase !== 'idle') return;
    pulse1.value = withRepeat(
      withTiming(1, { duration: 1800, easing: Easing.bezier(0.4, 0, 0.6, 1) }),
      -1,
      false,
    );
    pulse2.value = withRepeat(
      withTiming(1, { duration: 1800, easing: Easing.bezier(0.4, 0, 0.6, 1) }),
      -1,
      false,
    );
    const id = setTimeout(() => {
      pulse2.value = 0;
      pulse2.value = withRepeat(
        withTiming(1, { duration: 1800, easing: Easing.bezier(0.4, 0, 0.6, 1) }),
        -1,
        false,
      );
    }, 900);
    return () => clearTimeout(id);
  }, [reduced, phase, pulse1, pulse2]);

  const ring1 = useAnimatedStyle(() => ({
    transform: [{ scale: 1 + pulse1.value * 0.35 }],
    opacity: 0.45 * (1 - pulse1.value),
  }));
  const ring2 = useAnimatedStyle(() => ({
    transform: [{ scale: 1 + pulse2.value * 0.35 }],
    opacity: 0.45 * (1 - pulse2.value),
  }));

  const press = useSharedValue(1);
  useEffect(() => {
    press.value = withSpring(active ? 0.96 : 1, { damping: 18, stiffness: 200 });
  }, [active, press]);
  const core = useAnimatedStyle(() => ({
    transform: [{ scale: press.value }],
  }));

  return (
    <View style={styles.frame}>
      {phase === 'idle' && (
        <>
          <Animated.View
            style={[
              StyleSheet.absoluteFill,
              styles.pulse,
              { backgroundColor: 'rgba(44,110,107,0.18)' },
              ring1,
            ]}
            pointerEvents="none"
          />
          <Animated.View
            style={[
              StyleSheet.absoluteFill,
              styles.pulse,
              { backgroundColor: 'rgba(246,192,106,0.22)' },
              ring2,
            ]}
            pointerEvents="none"
          />
        </>
      )}

      <Animated.View style={core}>
        <Pressable
          onPress={onPress}
          accessibilityRole="button"
          accessibilityLabel={
            active ? 'Stop voice log' : phase === 'ready' ? 'Record again' : 'Start voice log'
          }
        >
          <View style={[styles.core, active ? styles.coreActive : styles.coreIdle]}>
            <MicOrbGradient active={active} />
            <View style={[StyleSheet.absoluteFill, styles.iconLayer]} pointerEvents="none">
              {active ? (
                <View style={styles.stop} />
              ) : (
                <Mic size={44} color="#FFFFFF" strokeWidth={2} />
              )}
            </View>
          </View>
        </Pressable>
      </Animated.View>
    </View>
  );
};

const useStyles = makeStyles((theme) => ({
  frame: {
    width: 160,
    height: 160,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pulse: {
    borderRadius: theme.radius.full,
  },
  core: {
    width: moderateScale(120),
    height: moderateScale(120),
    borderRadius: moderateScale(60),
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  coreIdle: {
    shadowColor: '#2C6E6B',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.35,
    shadowRadius: 24,
    elevation: 10,
  },
  coreActive: {
    shadowColor: '#C45C3F',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.32,
    shadowRadius: 28,
    elevation: 12,
  },
  iconLayer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  stop: {
    width: moderateScale(26),
    height: moderateScale(26),
    borderRadius: moderateScale(6),
    backgroundColor: '#FFFFFF',
  },
}));
