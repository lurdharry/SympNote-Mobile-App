import React from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { FileDown, MessageSquareText } from "lucide-react-native";
import {
  fontScale,
  makeStyles,
  moderateScale,
  scale,
  spacing,
  typography,
  useTheme,
  verticalScale,
} from "@/theme";

interface BriefShareSheetProps {
  visible: boolean;
  onClose: () => void;
  onExportPdf: () => void;
  onShareText: () => void;
}

/**
 * Bottom-sheet modal triggered by the Share icon in BriefTopBar. Two
 * clear export paths: a clinician-ready PDF (expo-print → OS share
 * sheet) or plain text (RN Share for Messages / email / copy). Same
 * modal pattern as DateRangePill on the History tab.
 */
export const BriefShareSheet: React.FC<BriefShareSheetProps> = ({
  visible,
  onClose,
  onExportPdf,
  onShareText,
}) => {
  const { colors } = useTheme();
  const styles = useStyles();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <Pressable
        style={styles.backdrop}
        onPress={onClose}
        accessibilityRole="button"
        accessibilityLabel="Close share menu"
      >
        <Pressable
          style={[styles.sheet, { backgroundColor: colors.bgSurface }]}
          onPress={(e) => e.stopPropagation()}
        >
          <Text style={[styles.title, { color: colors.textPrimary }]}>Share or export</Text>
          <Text style={[styles.sub, { color: colors.textSecondary }]}>
            Pick how you'd like to send this brief.
          </Text>

          <Pressable
            onPress={() => {
              onClose();
              onExportPdf();
            }}
            style={[styles.row, { borderColor: colors.border }]}
          >
            <View style={[styles.iconTile, { backgroundColor: colors.accent + "1A" }]}>
              <FileDown size={moderateScale(18)} color={colors.accent} strokeWidth={2} />
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={[styles.rowLabel, { color: colors.textPrimary }]}>
                Export as PDF
              </Text>
              <Text style={[styles.rowSub, { color: colors.textTertiary }]}>
                A clinician-ready one-pager. Email it, AirDrop it, save it.
              </Text>
            </View>
          </Pressable>

          <Pressable
            onPress={() => {
              onClose();
              onShareText();
            }}
            style={[styles.row, { borderColor: colors.border }]}
          >
            <View style={[styles.iconTile, { backgroundColor: colors.accent + "1A" }]}>
              <MessageSquareText
                size={moderateScale(18)}
                color={colors.accent}
                strokeWidth={2}
              />
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={[styles.rowLabel, { color: colors.textPrimary }]}>
                Share as text
              </Text>
              <Text style={[styles.rowSub, { color: colors.textTertiary }]}>
                Plain text via your phone's share sheet — Messages, email, copy.
              </Text>
            </View>
          </Pressable>

          <Pressable
            onPress={onClose}
            style={[styles.cancel, { borderColor: colors.border }]}
            accessibilityRole="button"
            accessibilityLabel="Cancel"
          >
            <Text style={[styles.cancelText, { color: colors.textSecondary }]}>Cancel</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

const useStyles = makeStyles((theme) => ({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },
  sheet: {
    borderTopLeftRadius: theme.radius.xl,
    borderTopRightRadius: theme.radius.xl,
    paddingHorizontal: theme.spacing.s5,
    paddingTop: theme.spacing.s5,
    paddingBottom: theme.spacing.s8,
    gap: theme.spacing.s3,
  },
  title: {
    fontFamily: "Fraunces_500Medium",
    fontSize: fontScale(22),
    letterSpacing: -0.3,
  },
  sub: {
    ...typography.body,
    fontSize: fontScale(15),
    lineHeight: fontScale(21),
    marginBottom: spacing.s2,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: moderateScale(12),
    paddingHorizontal: scale(14),
    paddingVertical: verticalScale(14),
    borderRadius: theme.radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
  },
  iconTile: {
    width: moderateScale(44),
    height: moderateScale(44),
    borderRadius: moderateScale(12),
    alignItems: "center",
    justifyContent: "center",
  },
  rowLabel: {
    fontFamily: "DMSans_700Bold",
    fontSize: fontScale(16),
    letterSpacing: -0.1,
  },
  rowSub: {
    ...typography.caption,
    fontSize: fontScale(13),
    lineHeight: fontScale(19),
    marginTop: 2,
  },
  cancel: {
    alignItems: "center",
    paddingVertical: verticalScale(13),
    borderRadius: theme.radius.full,
    borderWidth: StyleSheet.hairlineWidth,
    marginTop: spacing.s2,
  },
  cancelText: {
    fontFamily: "DMSans_600SemiBold",
    fontSize: fontScale(14),
    letterSpacing: 0.2,
  },
}));
