import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  type SharedValue,
} from "react-native-reanimated";
import { RotateCw, Trash2 } from "lucide-react-native";
import { fontScale, makeStyles, moderateScale, useTheme } from "@/theme";
import { BackButton } from "@/components/ui/BackButton";
import { hapticLight } from "@/services/haptics";

interface RecordingTopBarProps {
  onBack: () => void;
  onDelete: () => void;
  /** Re-run AI structuring on the recording's transcript. */
  onRefresh: () => void;
  /** Disables the refresh button + dims the icon while a refresh
   *  is in flight. */
  refreshing: boolean;
  /** Recording title for the scroll-triggered header. Optional —
   *  when absent, no header title is rendered. */
  title?: string | null;
  /** Scroll position from the parent's Animated.ScrollView. Drives
   *  the fade/slide of the header title and the divider hairline.
   *  Optional — when absent, header title stays hidden. */
  scrollY?: SharedValue<number>;
}

// Mirror BriefTopBar's thresholds so the two screens feel like one app.
const SCROLL_START = 60;
const SCROLL_END = 100;

/**
 * Top-bar for /recording/[id]. Two action affordances: back and
 * delete. Mirrors BriefTopBar's pattern — when `scrollY` and `title`
 * are wired, the bar gains a centered-ish header title that fades +
 * slides in once the masthead title scrolls past, with a hairline
 * divider for elevation.
 */
export const RecordingTopBar: React.FC<RecordingTopBarProps> = ({
  onBack,
  onDelete,
  onRefresh,
  refreshing,
  title,
  scrollY,
}) => {
  const { colors } = useTheme();
  const styles = useStyles();

  const headerTitleStyle = useAnimatedStyle(() => {
    if (!scrollY) return { opacity: 0, transform: [{ translateY: 6 }] };
    const opacity = interpolate(
      scrollY.value,
      [SCROLL_START, SCROLL_END],
      [0, 1],
      Extrapolation.CLAMP,
    );
    const translateY = interpolate(
      scrollY.value,
      [SCROLL_START, SCROLL_END],
      [6, 0],
      Extrapolation.CLAMP,
    );
    return { opacity, transform: [{ translateY }] };
  });

  const dividerStyle = useAnimatedStyle(() => {
    if (!scrollY) return { opacity: 0 };
    return {
      opacity: interpolate(
        scrollY.value,
        [SCROLL_START, SCROLL_END],
        [0, 1],
        Extrapolation.CLAMP,
      ),
    };
  });

  return (
    <View style={styles.topBar}>
      <BackButton onPress={onBack} />

      {title ? (
        <Animated.View pointerEvents="none" style={[styles.headerTitleSlot, headerTitleStyle]}>
          <Text numberOfLines={1} style={[styles.headerTitle, { color: colors.textPrimary }]}>
            {title}
          </Text>
        </Animated.View>
      ) : (
        <View style={{ flex: 1 }} />
      )}

      <Pressable
        onPress={() => {
          if (refreshing) return;
          hapticLight();
          onRefresh();
        }}
        disabled={refreshing}
        hitSlop={10}
        style={[styles.iconBtn, { backgroundColor: colors.bgMuted }]}
        accessibilityRole="button"
        accessibilityLabel="Re-run AI structuring"
      >
        <RotateCw
          size={moderateScale(16)}
          color={refreshing ? colors.textTertiary : colors.textPrimary}
          strokeWidth={2}
        />
      </Pressable>
      <Pressable
        onPress={() => {
          hapticLight();
          onDelete();
        }}
        hitSlop={10}
        style={[styles.iconBtn, { backgroundColor: colors.bgMuted }]}
        accessibilityRole="button"
        accessibilityLabel="Delete recording"
      >
        <Trash2 size={moderateScale(16)} color={colors.error} strokeWidth={2} />
      </Pressable>

      <Animated.View
        pointerEvents="none"
        style={[styles.divider, { backgroundColor: colors.border }, dividerStyle]}
      />
    </View>
  );
};

const useStyles = makeStyles((theme) => ({
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: theme.spacing.s6,
    paddingTop: theme.spacing.s2,
    paddingBottom: theme.spacing.s2,
    gap: moderateScale(10),
  },
  iconBtn: {
    width: moderateScale(36),
    height: moderateScale(36),
    borderRadius: moderateScale(18),
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitleSlot: {
    flex: 1,
    justifyContent: "center",
    paddingLeft: moderateScale(6),
    paddingRight: moderateScale(8),
  },
  headerTitle: {
    fontFamily: "Fraunces_500Medium",
    fontSize: fontScale(18),
    lineHeight: fontScale(24),
    letterSpacing: -0.3,
    textAlign: "left",
  },
  divider: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: StyleSheet.hairlineWidth,
  },
}));
