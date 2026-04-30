import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  type SharedValue,
} from "react-native-reanimated";
import { Edit3, RotateCw, Share2, Trash2 } from "lucide-react-native";
import { fontScale, makeStyles, moderateScale, useTheme } from "@/theme";
import { BackButton } from "@/components/ui/BackButton";
import { hapticLight } from "@/services/haptics";

interface BriefTopBarProps {
  onBack: () => void;
  onRegenerate: () => void;
  onShare: () => void;
  onRename: () => void;
  onDelete: () => void;
  /** Hide the share button when the brief content is empty —
   *  there's nothing to share until regen succeeds. */
  showShare: boolean;
  retrying: boolean;
  /** Brief title for the scroll-triggered header. Optional — when
   *  absent, no header title is rendered. */
  title?: string | null;
  /** Scroll position from the parent's Animated.ScrollView. Drives
   *  the fade/slide of the header title and the divider hairline.
   *  Optional — when absent, header title stays hidden. */
  scrollY?: SharedValue<number>;
}

// Scroll thresholds (in screen points) for the title transition.
// Below SCROLL_START the masthead title is still on screen; above
// SCROLL_END the masthead is fully scrolled past and the header
// title is fully visible. Tuned so the swap reads as "the title
// followed me up" rather than as a sudden cut.
const SCROLL_START = 60;
const SCROLL_END = 100;

/**
 * Top-bar icon row for /brief/[id]. Five action affordances:
 * back · regenerate · share (conditional) · rename · delete.
 *
 * When `scrollY` and `title` are provided, the bar gains an
 * ambient header behavior: a centered title fades + slides in once
 * the masthead title scrolls past, and a hairline divider fades in
 * to give the bar elevation against the content.
 */
export const BriefTopBar: React.FC<BriefTopBarProps> = ({
  onBack,
  onRegenerate,
  onShare,
  onRename,
  onDelete,
  showShare,
  retrying,
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
      opacity: interpolate(scrollY.value, [SCROLL_START, SCROLL_END], [0, 1], Extrapolation.CLAMP),
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
        onPress={onRegenerate}
        disabled={retrying}
        hitSlop={10}
        style={[styles.iconBtn, { backgroundColor: colors.bgMuted }]}
        accessibilityRole="button"
        accessibilityLabel="Regenerate brief"
      >
        <RotateCw
          size={moderateScale(16)}
          color={retrying ? colors.textTertiary : colors.textPrimary}
          strokeWidth={2}
        />
      </Pressable>
      {showShare && (
        <Pressable
          onPress={() => {
            hapticLight();
            onShare();
          }}
          hitSlop={10}
          style={[styles.iconBtn, { backgroundColor: colors.bgMuted }]}
          accessibilityRole="button"
          accessibilityLabel="Share or export brief"
        >
          <Share2 size={moderateScale(16)} color={colors.textPrimary} strokeWidth={2} />
        </Pressable>
      )}
      <Pressable
        onPress={() => {
          hapticLight();
          onRename();
        }}
        hitSlop={10}
        style={[styles.iconBtn, { backgroundColor: colors.bgMuted }]}
        accessibilityRole="button"
        accessibilityLabel="Rename brief"
      >
        <Edit3 size={moderateScale(16)} color={colors.textPrimary} strokeWidth={2} />
      </Pressable>
      <Pressable
        onPress={onDelete}
        hitSlop={10}
        style={[styles.iconBtn, { backgroundColor: colors.bgMuted }]}
        accessibilityRole="button"
        accessibilityLabel="Delete brief"
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
