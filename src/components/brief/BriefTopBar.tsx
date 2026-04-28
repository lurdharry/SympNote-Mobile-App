import React from "react";
import { Pressable, View } from "react-native";
import { Edit3, RotateCw, Share2, Trash2 } from "lucide-react-native";
import { makeStyles, moderateScale, useTheme } from "@/theme";
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
}

/**
 * Top-bar icon row for /brief/[id]. Six action affordances:
 * back · regenerate · share (conditional) · rename · delete.
 * Pure presentation — no state, no data fetching.
 */
export const BriefTopBar: React.FC<BriefTopBarProps> = ({
  onBack,
  onRegenerate,
  onShare,
  onRename,
  onDelete,
  showShare,
  retrying,
}) => {
  const { colors } = useTheme();
  const styles = useStyles();

  return (
    <View style={styles.topBar}>
      <BackButton onPress={onBack} />
      <View style={{ flex: 1 }} />
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
}));
