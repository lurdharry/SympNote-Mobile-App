import React from "react";
import { StyleSheet, Text, TextInput, View } from "react-native";
import {
  fontScale,
  makeStyles,
  scale,
  useTheme,
  verticalScale,
} from "@/theme";

interface TitleFieldProps {
  value: string;
  onChange: (next: string) => void;
}

/**
 * Optional title field on /brief/new. Sits above the filters so the
 * user can name a brief upfront — empty falls through to a generated
 * default title in the brief detail.
 */
export const TitleField: React.FC<TitleFieldProps> = ({ value, onChange }) => {
  const { colors } = useTheme();
  const styles = useStyles();

  return (
    <View style={styles.block}>
      <Text style={[styles.label, { color: colors.textTertiary }]}>TITLE · OPTIONAL</Text>
      <View style={[styles.field, { backgroundColor: colors.bgSurface, borderColor: colors.border }]}>
        <TextInput
          value={value}
          onChangeText={onChange}
          placeholder="e.g. Knee flare-up · Pre-Smith visit"
          placeholderTextColor={colors.textTertiary}
          style={[styles.input, { color: colors.textPrimary }]}
          returnKeyType="done"
          maxLength={60}
          accessibilityLabel="Brief title"
        />
      </View>
    </View>
  );
};

const useStyles = makeStyles((theme) => ({
  block: {
    marginTop: theme.spacing.s5,
    gap: theme.spacing.s2,
  },
  label: {
    fontFamily: "DMSans_700Bold",
    fontSize: fontScale(10),
    letterSpacing: 1.4,
  },
  field: {
    paddingHorizontal: scale(14),
    paddingVertical: verticalScale(10),
    borderRadius: theme.radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
  },
  input: {
    fontFamily: "Fraunces_400Regular",
    fontSize: fontScale(15),
    lineHeight: fontScale(20),
    padding: 0,
    margin: 0,
  },
}));
