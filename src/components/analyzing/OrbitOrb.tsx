import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  SharedValue,
  useAnimatedProps,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle as SvgCircle } from 'react-native-svg';
import { Check, Sparkles } from 'lucide-react-native';
import { makeStyles, moderateScale, useTheme } from '@/theme';
import { OrbGradient } from './OrbGradient';

interface OrbitOrbProps {
  ready: boolean;
  reduced: boolean;
  progress: SharedValue<number>;
  completedCount: number;
}

const ORB_SIZE = moderateScale(220);
const PROGRESS_RADIUS = (ORB_SIZE - moderateScale(20)) / 2;
const PROGRESS_CIRC = 2 * Math.PI * PROGRESS_RADIUS;
const AnimatedSvgCircle = Animated.createAnimatedComponent(SvgCircle);

export const OrbitOrb: React.FC<OrbitOrbProps> = ({
  ready,
  reduced,
  progress,
  completedCount,
}) => {
  useTheme();
  const styles = useStyles();
  const spin1 = useSharedValue(0);
  const pulse = useSharedValue(0);
  const flash = useSharedValue(0);

  useEffect(() => {
    if (reduced) return;
    spin1.value = withRepeat(
      withTiming(1, { duration: 12000, easing: Easing.linear }),
      -1,
      false,
    );
    pulse.value = withRepeat(
      withTiming(1, { duration: 2400, easing: Easing.inOut(Easing.quad) }),
      -1,
      true,
    );
  }, [reduced, spin1, pulse]);

  useEffect(() => {
    if (reduced || completedCount === 0) return;
    flash.value = withSequence(
      withTiming(1, { duration: 180, easing: Easing.out(Easing.cubic) }),
      withTiming(0, { duration: 520, easing: Easing.in(Easing.cubic) }),
    );
  }, [completedCount, reduced, flash]);

  const ring1Style = useAnimatedStyle(() => ({
    transform: [{ rotate: `${spin1.value * 360}deg` }],
  }));
  const orbStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 1 + pulse.value * 0.06 + flash.value * 0.1 }],
    shadowOpacity: 0.4 + pulse.value * 0.25 + flash.value * 0.35,
    shadowRadius: 24 + pulse.value * 16 + flash.value * 18,
  }));
  const haloStyle = useAnimatedStyle(() => ({
    opacity: flash.value * 0.55,
    transform: [{ scale: 1 + flash.value * 0.2 }],
  }));

  const arcProps = useAnimatedProps(() => ({
    strokeDashoffset: PROGRESS_CIRC * (1 - progress.value),
  }));

  return (
    <View style={styles.orbFrame}>
      <Animated.View
        style={[
          styles.orbitRing,
          {
            width: ORB_SIZE,
            height: ORB_SIZE,
            borderColor: 'rgba(44,110,107,0.25)',
            borderStyle: 'dashed',
            borderWidth: 2,
          },
          ring1Style,
        ]}
      />

      <Svg
        width={ORB_SIZE}
        height={ORB_SIZE}
        style={{
          position: 'absolute',
          transform: [{ rotate: '-90deg' }],
        }}
      >
        <SvgCircle
          cx={ORB_SIZE / 2}
          cy={ORB_SIZE / 2}
          r={PROGRESS_RADIUS}
          stroke="rgba(246,192,106,0.18)"
          strokeWidth={moderateScale(3)}
          fill="none"
        />
        <AnimatedSvgCircle
          cx={ORB_SIZE / 2}
          cy={ORB_SIZE / 2}
          r={PROGRESS_RADIUS}
          stroke="#F6C06A"
          strokeWidth={moderateScale(3)}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={`${PROGRESS_CIRC} ${PROGRESS_CIRC}`}
          animatedProps={arcProps}
        />
      </Svg>

      <Animated.View
        pointerEvents="none"
        style={[
          styles.orbitRing,
          {
            width: moderateScale(170),
            height: moderateScale(170),
            backgroundColor: '#F6C06A',
          },
          haloStyle,
        ]}
      />

      <Animated.View
        style={[
          styles.orb,
          { shadowColor: '#2C6E6B', shadowOffset: { width: 0, height: 10 } },
          orbStyle,
        ]}
      >
        <OrbGradient />
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
          <View style={styles.orbCenter}>
            {ready ? (
              <Check size={moderateScale(44)} color="#FFFFFF" strokeWidth={3} />
            ) : (
              <Sparkles size={moderateScale(40)} color="#FFFFFF" strokeWidth={2} />
            )}
          </View>
        </View>
      </Animated.View>
    </View>
  );
};

const useStyles = makeStyles((theme) => ({
  orbFrame: {
    width: moderateScale(220),
    height: moderateScale(220),
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.s10,
  },
  orbitRing: {
    position: 'absolute',
    borderRadius: theme.radius.full,
  },
  orb: {
    width: moderateScale(140),
    height: moderateScale(140),
    borderRadius: moderateScale(70),
    overflow: 'hidden',
    elevation: 8,
  },
  orbCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
}));
