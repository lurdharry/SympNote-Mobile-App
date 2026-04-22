import React, { useEffect } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  Easing,
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Check } from 'lucide-react-native';
import {
  fontScale,
  makeStyles,
  moderateScale,
  scale,
  typography,
  useTheme,
  verticalScale,
} from '../../theme';
import { SceneTransition } from '../../components/navigation/SceneTransition';
import { BackButton } from '../../components/ui/BackButton';
import { PrimaryButton } from '../../components/ui/PrimaryButton';
import { FOCUS_OPTIONS, FocusOption } from '../../constants/focus';
import { useProfileStore } from '../../stores/useProfileStore';
import { hapticLight } from '../../services/haptics';

/**
 * Screen 03 — Focus area.
 *
 * Stacked rich cards — each option renders a gradient icon tile, a
 * title + one-line subtitle, and 3 example tag chips so users see
 * concretely what they'd be logging. Selected state lifts the card
 * with a glow in the option's gradient tail color and surfaces a
 * checkmark on the right.
 */
type Option = FocusOption;

export default function ScreenFocus() {
  const router = useRouter();
  const { colors } = useTheme();
  const styles = useStyles();
  const setAnswer = useProfileStore((s) => s.setOnboardingAnswer);

  const [sel, setSel] = React.useState<string | null>(null);

  const onSelect = (id: string) => {
    hapticLight();
    setSel(id);
    setAnswer('focus', id);
  };

  return (
    <SceneTransition mode="scale-fade">
      <View style={[styles.root, { backgroundColor: colors.bgPrimary }]}>
        <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
          <View style={styles.topBar}>
            <BackButton onPress={() => router.back()} />
            <Text style={[typography.label, { color: colors.textTertiary }]}>
              5 of 9
            </Text>
            <View style={{ width: moderateScale(40) }} />
          </View>

          <ScrollView
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
          >
            <Text style={styles.eyebrow}>YOUR FOCUS</Text>
            <Text style={[typography.h1, styles.headline, { color: colors.textPrimary }]}>
              What are you tracking?
            </Text>
            <Text
              style={[
                typography.body,
                { color: colors.textSecondary, marginTop: moderateScale(6) },
              ]}
            >
              We'll tailor prompts and summaries. You can change this anytime.
            </Text>

            <View style={styles.list}>
              {FOCUS_OPTIONS.map((o, i) => (
                <FocusCard
                  key={o.id}
                  option={o}
                  selected={sel === o.id}
                  index={i}
                  onPress={() => onSelect(o.id)}
                />
              ))}
            </View>
          </ScrollView>

          <View style={styles.cta}>
            <PrimaryButton
              label={sel ? 'Continue' : 'Pick one to continue'}
              disabled={!sel}
              onPress={() => router.push('/onboarding/care-team')}
            />
          </View>
        </SafeAreaView>
      </View>
    </SceneTransition>
  );
}

function FocusCard({
  option,
  selected,
  index,
  onPress,
}: {
  option: Option;
  selected: boolean;
  index: number;
  onPress: () => void;
}) {
  const { colors } = useTheme();
  const styles = useStyles();

  // Entrance.
  const opacity = useSharedValue(0);
  const ty = useSharedValue(12);
  useEffect(() => {
    opacity.value = withDelay(
      120 + index * 60,
      withTiming(1, { duration: 360, easing: Easing.out(Easing.cubic) })
    );
    ty.value = withDelay(
      120 + index * 60,
      withSpring(0, { damping: 18, stiffness: 140 })
    );
  }, [index, opacity, ty]);

  // Selected-state progression (0 → 1).
  const selected$ = useSharedValue(selected ? 1 : 0);
  useEffect(() => {
    selected$.value = withSpring(selected ? 1 : 0, {
      damping: 18,
      stiffness: 180,
    });
  }, [selected, selected$]);

  // Press feedback.
  const press = useSharedValue(0);

  const wrapStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      { translateY: ty.value },
      { scale: 1 + selected$.value * 0.015 - press.value * 0.02 },
    ],
    shadowOpacity: 0.08 + selected$.value * 0.22,
    shadowRadius: 12 + selected$.value * 14,
  }));

  const cardStyle = useAnimatedStyle(() => ({
    borderColor: interpolateColor(
      selected$.value,
      [0, 1],
      [colors.border, option.grad[1]]
    ),
    backgroundColor: interpolateColor(
      selected$.value,
      [0, 1],
      [colors.bgSurface, '#FFFFFF']
    ),
  }));

  const checkStyle = useAnimatedStyle(() => ({
    opacity: selected$.value,
    transform: [{ scale: 0.6 + selected$.value * 0.4 }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: selected$.value * 0.4,
    transform: [{ scale: 1 + selected$.value * 0.2 }],
  }));

  return (
    <Animated.View style={[styles.cardWrap, { shadowColor: option.grad[1] }, wrapStyle]}>
      <Pressable
        onPress={onPress}
        onPressIn={() => {
          press.value = withTiming(1, { duration: 120 });
        }}
        onPressOut={() => {
          press.value = withTiming(0, { duration: 220 });
        }}
        accessibilityRole="button"
        accessibilityLabel={option.t}
        accessibilityState={{ selected }}
      >
        <Animated.View style={[styles.card, cardStyle]}>
          {/* Gradient icon tile on the left */}
          <View style={styles.tileWrap}>
            <Animated.View
              pointerEvents="none"
              style={[
                styles.tileGlow,
                { backgroundColor: option.grad[1] },
                glowStyle,
              ]}
            />
            <View style={styles.tile}>
              <LinearGradient
                colors={option.grad}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFill}
              />
              <option.Icon
                size={moderateScale(22)}
                color={option.fg}
                strokeWidth={2}
              />
            </View>
          </View>

          {/* Content */}
          <View style={styles.content2}>
            <View style={styles.titleRow}>
              <Text
                style={[styles.title, { color: colors.textPrimary }]}
                numberOfLines={1}
              >
                {option.t}
              </Text>
              <Animated.View
                style={[
                  styles.checkDot,
                  { backgroundColor: option.grad[1] },
                  checkStyle,
                ]}
              >
                <Check
                  size={moderateScale(12)}
                  color="#FFFFFF"
                  strokeWidth={3}
                />
              </Animated.View>
            </View>
            <Text
              style={[styles.sub, { color: colors.textSecondary }]}
              numberOfLines={2}
            >
              {option.s}
            </Text>

            <View style={styles.tags}>
              {option.examples.map((t) => (
                <View
                  key={t}
                  style={[
                    styles.tag,
                    {
                      backgroundColor: option.grad[1] + '14',
                      borderColor: option.grad[1] + '33',
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.tagText,
                      { color: option.grad[1] },
                    ]}
                  >
                    {t}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        </Animated.View>
      </Pressable>
    </Animated.View>
  );
}

const useStyles = makeStyles((theme) => ({
  root: { flex: 1 },
  safe: { flex: 1 },
  topBar: {
    paddingTop: theme.spacing.s3,
    paddingHorizontal: theme.spacing.s6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  content: {
    paddingHorizontal: theme.spacing.s6,
    paddingTop: theme.spacing.s4,
    paddingBottom: theme.spacing.s6,
  },
  eyebrow: {
    ...theme.typography.label,
    color: theme.colors.accent,
    fontFamily: 'DMSans_700Bold',
    letterSpacing: 1.1,
  },
  headline: {
    marginTop: moderateScale(4),
  },
  list: {
    marginTop: theme.spacing.s5,
    gap: moderateScale(10),
  },
  cta: {
    paddingHorizontal: theme.spacing.s6,
    paddingTop: verticalScale(8),
  },
  cardWrap: {
    borderRadius: theme.radius.lg,
    shadowOffset: { width: 0, height: moderateScale(6) },
    elevation: 4,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: moderateScale(14),
    padding: moderateScale(14),
    borderRadius: theme.radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
  },
  tileWrap: {
    position: 'relative',
  },
  tileGlow: {
    position: 'absolute',
    top: -moderateScale(6),
    left: -moderateScale(6),
    right: -moderateScale(6),
    bottom: -moderateScale(6),
    borderRadius: moderateScale(18),
  },
  tile: {
    width: moderateScale(52),
    height: moderateScale(52),
    borderRadius: moderateScale(14),
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content2: {
    flex: 1,
    minWidth: 0,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(8),
  },
  title: {
    ...theme.typography.h3,
    fontFamily: 'DMSans_600SemiBold',
    flex: 1,
    letterSpacing: -0.1,
  },
  checkDot: {
    width: moderateScale(22),
    height: moderateScale(22),
    borderRadius: moderateScale(11),
    alignItems: 'center',
    justifyContent: 'center',
  },
  sub: {
    ...theme.typography.bodySmall,
    marginTop: moderateScale(2),
    lineHeight: fontScale(18),
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: moderateScale(6),
    marginTop: moderateScale(10),
  },
  tag: {
    paddingHorizontal: scale(8),
    paddingVertical: verticalScale(3),
    borderRadius: theme.radius.full,
    borderWidth: StyleSheet.hairlineWidth,
  },
  tagText: {
    fontFamily: 'DMSans_600SemiBold',
    fontSize: fontScale(11),
    letterSpacing: 0.2,
  },
}));
