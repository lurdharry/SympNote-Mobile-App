import React, { useEffect, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import {
  BookOpen,
  Brain,
  Check,
  CircleDot,
  Heart,
  Hospital,
  Search,
} from 'lucide-react-native';
import { useTheme, radius, spacing, typography } from '../../theme';
import { SceneTransition } from '../../components/navigation/SceneTransition';
import { BackButton } from '../../components/ui/BackButton';
import { PrimaryButton } from '../../components/ui/PrimaryButton';
import { useProfileStore } from '../../stores/useProfileStore';
import { hapticLight } from '../../services/haptics';

/**
 * Screen 03 — Focus area.
 *
 * 2-column grid of gradient tiles. Each tile is its own dramatic visual
 * (per design handoff: gradient bg, glossy white blobs in corners,
 * emoji above, label + sub). Selection adds a white check badge and
 * drops a colored accent-ring shadow.
 */

type IconRef = typeof CircleDot;
type Option = {
  id: string;
  t: string;
  s: string;
  Icon: IconRef;
  grad: [string, string];
  fg: string;
};

const OPTIONS: Option[] = [
  { id: 'chronic', t: 'Chronic condition',  s: 'Ongoing, recurring',    Icon: CircleDot, grad: ['#2C6E6B', '#1F504E'], fg: '#fff' },
  { id: 'new',     t: 'New symptom',         s: 'Unexplained, recent',   Icon: Search,    grad: ['#E07A5F', '#C45C3F'], fg: '#fff' },
  { id: 'mental',  t: 'Mental health',       s: 'Mood, sleep, anxiety',  Icon: Brain,     grad: ['#A8C4C2', '#6FA19E'], fg: '#1F504E' },
  { id: 'pre-op',  t: 'Procedure prep',      s: 'Before or after',       Icon: Hospital,  grad: ['#F6C06A', '#D9964A'], fg: '#5C3D12' },
  { id: 'loved',   t: 'For someone else',    s: 'Caregiver mode',        Icon: Heart,     grad: ['#F5A3A3', '#D97575'], fg: '#fff' },
  { id: 'general', t: 'General journal',     s: 'Just keeping track',    Icon: BookOpen,  grad: ['#C7B98F', '#9E8F5F'], fg: '#fff' },
];

export default function ScreenFocus() {
  const router = useRouter();
  const { colors } = useTheme();
  const setAnswer = useProfileStore((s) => s.setOnboardingAnswer);

  const [sel, setSel] = useState<string | null>(null);

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
            <View style={{ width: 40 }} />
          </View>

          <ScrollView
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
          >
            <Text
              style={[
                typography.label,
                {
                  color: colors.accent,
                  fontFamily: 'Inter_600SemiBold',
                  letterSpacing: 1.1,
                },
              ]}
            >
              YOUR FOCUS
            </Text>
            <Text
              style={[
                typography.h1,
                { color: colors.textPrimary, marginTop: 4 },
              ]}
            >
              What are you tracking?
            </Text>
            <Text
              style={[
                typography.body,
                { color: colors.textSecondary, marginTop: 6 },
              ]}
            >
              We'll tailor prompts and summaries. Change this anytime.
            </Text>

            <View style={styles.grid}>
              {OPTIONS.map((o, i) => (
                <FocusTile
                  key={o.id}
                  option={o}
                  selected={sel === o.id}
                  index={i}
                  onPress={() => onSelect(o.id)}
                />
              ))}
            </View>
          </ScrollView>

          <View style={{ paddingHorizontal: spacing.s6, paddingTop: 8 }}>
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

function FocusTile({
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
  const opacity = useSharedValue(0);
  const ty = useSharedValue(12);
  const scale = useSharedValue(1);

  useEffect(() => {
    opacity.value = withDelay(
      120 + index * 70,
      withTiming(1, { duration: 420, easing: Easing.out(Easing.cubic) })
    );
    ty.value = withDelay(
      120 + index * 70,
      withSpring(0, { damping: 18, stiffness: 140 })
    );
  }, [index, opacity, ty]);

  useEffect(() => {
    scale.value = withSpring(selected ? 1.02 : 1, {
      damping: 18,
      stiffness: 180,
    });
  }, [selected, scale]);

  const enter = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: ty.value }, { scale: scale.value }],
  }));

  return (
    <Animated.View style={[styles.tileSlot, enter]}>
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={option.t}
        accessibilityState={{ selected }}
        style={[
          styles.tile,
          selected && {
            shadowColor: option.grad[1],
            shadowOffset: { width: 0, height: 12 },
            shadowOpacity: 0.35,
            shadowRadius: 24,
            elevation: 12,
          },
          !selected && {
            shadowColor: '#1A1F1E',
            shadowOffset: { width: 0, height: 6 },
            shadowOpacity: 0.1,
            shadowRadius: 16,
            elevation: 4,
          },
        ]}
      >
        <LinearGradient
          colors={option.grad}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        {/* Glossy decorative blobs */}
        <View
          pointerEvents="none"
          style={[
            styles.blob,
            {
              width: 64,
              height: 64,
              right: -20,
              top: -20,
              backgroundColor: 'rgba(255,255,255,0.15)',
            },
          ]}
        />
        <View
          pointerEvents="none"
          style={[
            styles.blob,
            {
              width: 80,
              height: 80,
              right: -32,
              bottom: -32,
              backgroundColor: 'rgba(255,255,255,0.08)',
            },
          ]}
        />
        {/* Double ring around the outside when selected */}
        {selected && (
          <View
            pointerEvents="none"
            style={[
              styles.selectedRing,
              {
                borderColor: '#FFFFFF',
              },
            ]}
          />
        )}
        {selected && (
          <View
            pointerEvents="none"
            style={[
              styles.selectedOuterRing,
              { borderColor: option.grad[0] },
            ]}
          />
        )}

        <View style={styles.iconWrap}>
          <option.Icon size={28} color={option.fg} strokeWidth={2} />
        </View>

        <View style={{ position: 'absolute', left: 14, right: 14, bottom: 14 }}>
          <Text
            style={[
              styles.label,
              { color: option.fg, fontFamily: 'Inter_600SemiBold' },
            ]}
          >
            {option.t}
          </Text>
          <Text
            style={[
              styles.sub,
              { color: option.fg, opacity: 0.85, marginTop: 2 },
            ]}
          >
            {option.s}
          </Text>
        </View>

        {selected && (
          <View style={styles.checkBadge}>
            <Check size={14} color={option.grad[1]} strokeWidth={3} />
          </View>
        )}
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  safe: { flex: 1 },
  topBar: {
    paddingTop: spacing.s3,
    paddingHorizontal: spacing.s6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  content: {
    paddingHorizontal: spacing.s6,
    paddingTop: spacing.s4,
    paddingBottom: spacing.s6,
  },
  grid: {
    marginTop: spacing.s5,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  tileSlot: {
    width: '48.5%',
    aspectRatio: 1 / 1.05,
  },
  tile: {
    flex: 1,
    padding: 14,
    borderRadius: 18,
    overflow: 'hidden',
    position: 'relative',
  },
  blob: {
    position: 'absolute',
    borderRadius: 9999,
  },
  selectedRing: {
    position: 'absolute',
    top: -3,
    left: -3,
    right: -3,
    bottom: -3,
    borderRadius: 21,
    borderWidth: 3,
  },
  selectedOuterRing: {
    position: 'absolute',
    top: -5,
    left: -5,
    right: -5,
    bottom: -5,
    borderRadius: 23,
    borderWidth: 2,
  },
  iconWrap: {
    width: 36,
    height: 36,
    alignItems: 'flex-start',
    justifyContent: 'center',
    marginBottom: 4,
  },
  label: {
    fontSize: 15,
    lineHeight: 18,
  },
  sub: {
    fontSize: 11,
    lineHeight: 14,
    fontFamily: 'Inter_500Medium',
  },
  checkBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
});
