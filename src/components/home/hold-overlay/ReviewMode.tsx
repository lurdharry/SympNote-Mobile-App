import React from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";
import {
  fontScale,
  makeStyles,
  moderateScale,
  spacing,
  verticalScale,
} from "@/theme";

interface ReviewModeProps {
  /** "review" allows editing; "extracting" locks the field and shows
   *  a spinner on the save button. */
  extracting: boolean;
  liveTranscript: string;
  editValue?: string;
  onEditChange?: (next: string) => void;
  onSave?: () => void;
  onReRecord?: () => void;
  /** Error message after an AI failure on review. */
  error?: string | null;
  /** Save-button label — caller computes (e.g. "Save", "Analyzing…",
   *  "Try again in 12s"). */
  saveLabel: string;
  /** True when the save action is currently rate-limited. */
  blocked: boolean;
}

/**
 * Body for the "review" and "extracting" modes of HoldToRecordOverlay.
 * Editable transcript at the top (locked while extracting), an inline
 * error box on AI failure, and the Save / Re-record actions pinned to
 * the bottom safe area.
 */
export const ReviewMode: React.FC<ReviewModeProps> = ({
  extracting,
  liveTranscript,
  editValue,
  onEditChange,
  onSave,
  onReRecord,
  error,
  saveLabel,
  blocked,
}) => {
  const styles = useStyles();
  return (
    <Animated.View
      key="review"
      entering={FadeIn.duration(260)}
      exiting={FadeOut.duration(180)}
      style={styles.flex}
    >
      <View style={styles.editWrap}>
        <Text style={styles.editCaption}>Check what we heard — tap to edit</Text>
        <TextInput
          value={editValue ?? liveTranscript}
          onChangeText={onEditChange}
          multiline
          scrollEnabled
          textAlignVertical="top"
          editable={!extracting}
          style={styles.editInput}
          placeholder="Your words will appear here…"
          placeholderTextColor="rgba(255,255,255,0.45)"
        />
        {error && !extracting && (
          <View style={styles.errorBox}>
            <Text style={styles.errorLabel}>Couldn't process that</Text>
            <Text style={styles.errorBody}>{error}</Text>
          </View>
        )}
      </View>

      <View style={styles.actionsWrap}>
        <Pressable
          onPress={onSave}
          disabled={extracting || blocked}
          style={({ pressed }) => [
            styles.saveBtn,
            { opacity: extracting || blocked ? 0.7 : pressed ? 0.88 : 1 },
          ]}
          accessibilityRole="button"
          accessibilityLabel={saveLabel}
        >
          {extracting ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.saveLabel}>{saveLabel}</Text>
          )}
        </Pressable>
        <Pressable
          onPress={onReRecord}
          disabled={extracting}
          style={({ pressed }) => [
            styles.secondaryBtn,
            { opacity: extracting ? 0.4 : pressed ? 0.7 : 1 },
          ]}
          accessibilityRole="button"
          accessibilityLabel="Re-record"
        >
          <Text style={styles.secondaryLabel}>Re-record</Text>
        </Pressable>
      </View>
    </Animated.View>
  );
};

const useStyles = makeStyles((theme) => ({
  flex: { flex: 1 },
  editWrap: {
    position: "absolute",
    top: verticalScale(130),
    bottom: verticalScale(320),
    left: 0,
    right: 0,
    paddingHorizontal: spacing.s6,
  },
  editCaption: {
    fontFamily: "DMSans_600SemiBold",
    fontSize: fontScale(11),
    letterSpacing: 1.2,
    textTransform: "uppercase",
    color: "rgba(255,255,255,0.55)",
    textAlign: "center",
    marginBottom: verticalScale(12),
  },
  editInput: {
    flex: 1,
    fontFamily: "Fraunces_400Regular",
    fontSize: fontScale(20),
    lineHeight: fontScale(30),
    letterSpacing: -0.3,
    color: "rgba(255,255,255,0.96)",
    textAlign: "center",
    padding: 0,
    margin: 0,
  },
  errorBox: {
    marginTop: verticalScale(12),
    padding: moderateScale(12),
    borderRadius: theme.radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(240,120,95,0.55)",
    backgroundColor: "rgba(240,120,95,0.14)",
  },
  errorLabel: {
    fontFamily: "DMSans_700Bold",
    fontSize: fontScale(11),
    letterSpacing: 0.8,
    color: "#F4A99A",
    textTransform: "uppercase",
  },
  errorBody: {
    marginTop: 3,
    fontFamily: "DMSans_500Medium",
    fontSize: fontScale(13),
    color: "rgba(255,255,255,0.9)",
  },
  actionsWrap: {
    position: "absolute",
    bottom: verticalScale(104),
    left: 0,
    right: 0,
    paddingHorizontal: spacing.s6,
    gap: moderateScale(10),
  },
  saveBtn: {
    height: verticalScale(54),
    borderRadius: 999,
    backgroundColor: "#3BA79F",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#3BA79F",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 10,
  },
  saveLabel: {
    color: "#FFFFFF",
    fontFamily: "DMSans_700Bold",
    fontSize: fontScale(16),
    letterSpacing: -0.15,
  },
  secondaryBtn: {
    height: verticalScale(48),
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.22)",
    backgroundColor: "rgba(255,255,255,0.04)",
  },
  secondaryLabel: {
    color: "rgba(255,255,255,0.88)",
    fontFamily: "DMSans_600SemiBold",
    fontSize: fontScale(14),
    letterSpacing: 0.2,
  },
}));
