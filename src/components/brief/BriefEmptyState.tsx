import React from "react";
import { Pressable, Text, View } from "react-native";
import { RotateCw, Sparkles } from "lucide-react-native";
import {
  fontScale,
  makeStyles,
  moderateScale,
  spacing,
  typography,
  useTheme,
  verticalScale,
} from "@/theme";
import { Button } from "@/components/ui/Button";
import type { Brief } from "@/stores/types";

interface BriefEmptyStateProps {
  brief: Brief;
  retrying: boolean;
  onRegenerate: () => void;
  onDelete: () => void;
}

/**
 * Recovery card shown when the AI returned a brief shell with no
 * usable content. Surfaces a clear retry path so the user isn't
 * stuck on a blank page; falls through to a delete affordance for
 * when the source notes themselves are gone.
 */
export const BriefEmptyState: React.FC<BriefEmptyStateProps> = ({
  brief,
  retrying,
  onRegenerate,
  onDelete,
}) => {
  const { colors } = useTheme();
  const styles = useStyles();

  const noSources = brief.sourceRecordingIds.length === 0;

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: colors.bgSurface, borderColor: colors.border },
      ]}
    >
      <View style={[styles.icon, { backgroundColor: colors.accent + "1A" }]}>
        <Sparkles size={moderateScale(20)} color={colors.accent} strokeWidth={2} />
      </View>
      <Text style={[styles.title, { color: colors.textPrimary }]}>
        The AI didn't have enough to work with
      </Text>
      <Text style={[styles.sub, { color: colors.textSecondary }]}>
        {noSources
          ? "This brief has no source notes. Try generating from a wider window in the Briefs tab."
          : "Sometimes the model returns an empty brief. Try regenerating — same notes, fresh attempt."}
      </Text>
      <View style={styles.actions}>
        <Button
          label={retrying ? "Regenerating…" : "Try again"}
          onPress={onRegenerate}
          haptic="medium"
          disabled={retrying || noSources}
        />
        <Pressable onPress={onDelete} hitSlop={8}>
          <View style={styles.deleteRow}>
            <RotateCw size={moderateScale(12)} color={colors.error} strokeWidth={2.2} />
            <Text style={[styles.deleteText, { color: colors.error }]}>
              Delete this brief
            </Text>
          </View>
        </Pressable>
      </View>
    </View>
  );
};

const useStyles = makeStyles((theme) => ({
  card: {
    marginTop: theme.spacing.s5,
    padding: theme.spacing.s5,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    alignItems: "flex-start",
  },
  icon: {
    width: moderateScale(44),
    height: moderateScale(44),
    borderRadius: moderateScale(12),
    alignItems: "center",
    justifyContent: "center",
    marginBottom: theme.spacing.s3,
  },
  title: {
    fontFamily: "Fraunces_500Medium",
    fontStyle: "italic",
    fontSize: fontScale(22),
    lineHeight: fontScale(28),
  },
  sub: {
    ...typography.body,
    fontSize: fontScale(15),
    lineHeight: fontScale(21),
    marginTop: theme.spacing.s2,
  },
  actions: {
    marginTop: spacing.s4,
    gap: spacing.s2,
  },
  deleteRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: moderateScale(6),
    paddingVertical: verticalScale(6),
  },
  deleteText: {
    fontFamily: "DMSans_600SemiBold",
    fontSize: fontScale(14),
    letterSpacing: 0.2,
  },
}));
