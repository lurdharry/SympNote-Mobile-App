import React from "react";
import { StyleSheet, Text, TextInput, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Clock, Mic, Pencil } from "lucide-react-native";
import {
  fontScale,
  makeStyles,
  moderateScale,
  scale,
  shadows,
  typography,
  useTheme,
  verticalScale,
} from "@/theme";

interface TranscriptQuoteProps {
  transcript: string;
  durationSec: number;
  onChangeText: (next: string) => void;
}

const formatDuration = (s: number): string => {
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  const rem = s % 60;
  return rem === 0 ? `${m}m` : `${m}m ${rem}s`;
};

/**
 * Editable transcript card on /onboarding/review. Visual treatment is
 * editorial: oversized opening quote glyph, Fraunces serif body, and
 * a meta row (duration + timestamp) below. Tap the text to edit.
 */
export const TranscriptQuote: React.FC<TranscriptQuoteProps> = ({
  transcript,
  durationSec,
  onChangeText,
}) => {
  const { colors } = useTheme();
  const styles = useStyles();

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: colors.bgSurface, borderColor: colors.border },
        shadows.card,
      ]}
    >
      <LinearGradient
        colors={[colors.accent + "18", colors.accent + "00"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.wash}
      />
      <Text style={[styles.glyph, { color: colors.accent + "55" }]}>&ldquo;</Text>
      <TextInput
        value={transcript}
        onChangeText={onChangeText}
        multiline
        scrollEnabled
        textAlignVertical="top"
        style={[styles.text, styles.input, { color: colors.textPrimary }]}
        placeholder="Your words will appear here…"
        placeholderTextColor={colors.textTertiary}
      />
      <View style={[styles.metaRow, { borderTopColor: colors.border }]}>
        <View style={[styles.metaChip, { backgroundColor: colors.bgMuted }]}>
          <Mic size={moderateScale(10)} color={colors.textSecondary} strokeWidth={2.2} />
          <Text style={[styles.metaChipText, { color: colors.textSecondary }]}>
            {formatDuration(durationSec)}
          </Text>
        </View>
        <View style={[styles.metaChip, { backgroundColor: colors.bgMuted }]}>
          <Clock size={moderateScale(10)} color={colors.textSecondary} strokeWidth={2.2} />
          <Text style={[styles.metaChipText, { color: colors.textSecondary }]}>Just now</Text>
        </View>
        <View style={{ flex: 1 }} />
      </View>
      <View style={styles.editHintRow}>
        <Pencil size={moderateScale(10)} color={colors.textTertiary} strokeWidth={2} />
        <Text style={[styles.editHintText, { color: colors.textTertiary }]}>
          Tap the text above to edit
        </Text>
      </View>
    </View>
  );
};

const useStyles = makeStyles((theme) => ({
  card: {
    position: "relative",
    paddingHorizontal: moderateScale(18),
    paddingTop: moderateScale(18),
    paddingBottom: moderateScale(12),
    borderRadius: theme.radius.xl,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: "hidden",
  },
  wash: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: verticalScale(70),
  },
  glyph: {
    fontFamily: "Fraunces_500Medium",
    fontSize: fontScale(64),
    lineHeight: fontScale(64),
    height: fontScale(44),
    marginTop: -moderateScale(4),
    marginLeft: -moderateScale(2),
  },
  text: {
    ...typography.body,
    fontFamily: "Fraunces_400Regular",
    fontSize: fontScale(17),
    lineHeight: fontScale(26),
    letterSpacing: -0.1,
  },
  input: {
    maxHeight: verticalScale(200),
    padding: 0,
    margin: 0,
    marginTop: moderateScale(4),
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: moderateScale(6),
    marginTop: verticalScale(14),
    paddingTop: verticalScale(12),
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  metaChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: moderateScale(4),
    paddingHorizontal: scale(8),
    paddingVertical: verticalScale(4),
    borderRadius: theme.radius.full,
  },
  metaChipText: {
    fontFamily: "DMSans_600SemiBold",
    fontSize: fontScale(11),
    letterSpacing: 0.1,
  },
  editHintRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: moderateScale(4),
    marginTop: verticalScale(8),
  },
  editHintText: {
    ...typography.caption,
    fontStyle: "italic",
  },
}));
