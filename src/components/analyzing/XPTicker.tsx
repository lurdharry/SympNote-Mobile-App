import React, { useEffect } from 'react';
import { StyleSheet, Text, TextInput as RNTextInput, View } from 'react-native';
import Animated, {
  Easing,
  SharedValue,
  useAnimatedProps,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { Sparkles } from 'lucide-react-native';
import { makeStyles, moderateScale, scale, verticalScale } from '@/theme';

interface XPTickerProps {
  xp: number;
  total: number;
  pulse: SharedValue<number>;
}

const AnimatedTextInput = Animated.createAnimatedComponent(RNTextInput);

export const XPTicker: React.FC<XPTickerProps> = ({ xp, total, pulse }) => {
  const styles = useStyles();

  const displayed = useSharedValue(xp);
  useEffect(() => {
    displayed.value = withTiming(xp, {
      duration: 520,
      easing: Easing.out(Easing.cubic),
    });
  }, [xp, displayed]);

  const animatedProps = useAnimatedProps(
    () => ({ text: String(Math.round(displayed.value)) } as any),
  );

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value || 1 }],
  }));

  return (
    <Animated.View style={[styles.xpPill, pulseStyle]}>
      <View style={styles.xpBolt}>
        <Sparkles size={moderateScale(10)} color="#B45309" fill="#B45309" />
      </View>
      <AnimatedTextInput
        editable={false}
        defaultValue={String(xp)}
        animatedProps={animatedProps}
        style={styles.xpNumber}
        underlineColorAndroid="transparent"
      />
      <Text style={styles.xpSlash}>/{total}</Text>
      <Text style={styles.xpSuffix}>XP</Text>
    </Animated.View>
  );
};

const useStyles = makeStyles((theme) => ({
  xpPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(6),
    paddingHorizontal: scale(12),
    paddingVertical: verticalScale(6),
    borderRadius: theme.radius.full,
    backgroundColor: '#FFE6B0',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#F6C06A',
    marginBottom: theme.spacing.s5,
    ...theme.shadows.card,
  },
  xpBolt: {
    width: moderateScale(18),
    height: moderateScale(18),
    borderRadius: moderateScale(9),
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  xpNumber: {
    fontFamily: 'Fraunces_500Medium',
    fontSize: moderateScale(18),
    lineHeight: moderateScale(20),
    color: '#7C2D12',
    letterSpacing: -0.3,
    minWidth: moderateScale(24),
    padding: 0,
    textAlign: 'right',
  },
  xpSlash: {
    fontFamily: 'DMSans_500Medium',
    fontSize: moderateScale(13),
    color: '#B45309',
    opacity: 0.75,
  },
  xpSuffix: {
    fontFamily: 'DMSans_700Bold',
    fontSize: moderateScale(11),
    letterSpacing: 1,
    color: '#7C2D12',
    marginLeft: moderateScale(2),
  },
}));
