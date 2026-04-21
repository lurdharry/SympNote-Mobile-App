import React, { useEffect } from "react";
import { StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  withDelay,
  Easing,
} from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import { useTheme, spacing, typography } from "../../theme";
import { SceneTransition } from "../../components/navigation/SceneTransition";
import { ParticleField } from "../../components/animated/ParticleField";
import { TypewriterText } from "../../components/animated/TypewriterText";
import { Button } from "../../components/ui/Button";
import { useReducedMotion } from "../../hooks/useReducedMotion";
import { useProfileStore } from "../../stores/useProfileStore";

export default function PainHook() {
  const router = useRouter();
  const { colors } = useTheme();
  const { width, height } = useWindowDimensions();
  const reduced = useReducedMotion();
  const acknowledgePrivacy = useProfileStore((s) => s.acknowledgePrivacy);

  const gradientShift = useSharedValue(0);
  const subOpacity = useSharedValue(0);
  const subY = useSharedValue(12);
  const ctaScale = useSharedValue(0.8);

  useEffect(() => {
    if (!reduced) {
      gradientShift.value = withRepeat(
        withTiming(1, { duration: 8000, easing: Easing.inOut(Easing.quad) }),
        -1,
        true,
      );
    }
    subOpacity.value = withDelay(
      1000,
      withTiming(1, { duration: 400, easing: Easing.out(Easing.cubic) }),
    );
    subY.value = withDelay(
      1000,
      withTiming(0, { duration: 400, easing: Easing.out(Easing.cubic) }),
    );
    ctaScale.value = withDelay(
      1400,
      withTiming(1, { duration: 420, easing: Easing.out(Easing.back(1.4)) }),
    );
  }, [gradientShift, subOpacity, subY, ctaScale, reduced]);

  const gradientStyle = useAnimatedStyle(() => ({
    opacity: 0.25 + gradientShift.value * 0.2,
  }));
  const subStyle = useAnimatedStyle(() => ({
    opacity: subOpacity.value,
    transform: [{ translateY: subY.value }],
  }));
  const ctaStyle = useAnimatedStyle(() => ({
    transform: [{ scale: ctaScale.value }],
  }));

  return (
    <SceneTransition mode="scale-fade">
      <View style={[styles.root, { backgroundColor: colors.bgPrimary }]}>
        <Animated.View style={[StyleSheet.absoluteFill, gradientStyle]}>
          <LinearGradient
            colors={[colors.accentLight, colors.bgPrimary, colors.accentLight]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>
        <ParticleField
          width={width}
          height={height}
          count={20}
          color={colors.accent}
          direction="up"
          speed={11000}
        />
        <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
          <View style={styles.content}>
            <View style={{ flex: 1, justifyContent: "center" }}>
              <TypewriterText
                text="Walk into your visit prepared."
                speed={24}
                style={[
                  typography.displaySerif,
                  { color: colors.textPrimary, textAlign: 'left' },
                ]}
              />
              <Animated.View style={subStyle}>
                <Text
                  style={[
                    typography.bodyLarge,
                    {
                      color: colors.textSecondary,
                      marginTop: spacing.s4,
                    },
                  ]}
                >
                  Never forget a symptom again.
                </Text>
              </Animated.View>
            </View>
            <Animated.View style={ctaStyle}>
              <Button
                label="Get started"
                breathe
                haptic="medium"
                onPress={() => {
                  acknowledgePrivacy();
                  router.push("/onboarding/social-proof");
                }}
              />
              <Text
                style={[
                  typography.caption,
                  {
                    color: colors.textTertiary,
                    textAlign: "center",
                    marginTop: spacing.s3,
                    paddingHorizontal: spacing.s4,
                  },
                ]}
              >
                Your voice is transcribed on-device. Only text you approve is
                sent to AI. This is not medical advice.
              </Text>
            </Animated.View>
          </View>
        </SafeAreaView>
      </View>
    </SceneTransition>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  safe: { flex: 1 },
  content: {
    flex: 1,
    paddingHorizontal: spacing.s6,
    paddingVertical: spacing.s8,
  },
});
