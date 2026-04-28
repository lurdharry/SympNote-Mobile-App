import React from "react";
import { Pressable, StyleSheet, TextInput, View } from "react-native";
import { Plus } from "lucide-react-native";
import {
  fontScale,
  makeStyles,
  moderateScale,
  useTheme,
  verticalScale,
} from "@/theme";

interface AddCustomRowProps {
  value: string;
  onChange: (next: string) => void;
  onSubmit: () => void;
}

/**
 * Free-text "Add your own…" row at the bottom of the conditions list.
 * Submit on return key or tap of the trailing plus pill — both call
 * the parent which prefixes with `custom:` and pushes onto the picker
 * state.
 */
export const AddCustomRow: React.FC<AddCustomRowProps> = ({ value, onChange, onSubmit }) => {
  const { colors } = useTheme();
  const styles = useStyles();
  const ready = value.trim().length > 0;

  return (
    <View
      style={[styles.row, { backgroundColor: colors.bgSurface, borderColor: colors.border }]}
    >
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder="Add your own…"
        placeholderTextColor={colors.textTertiary}
        style={[styles.input, { color: colors.textPrimary }]}
        returnKeyType="done"
        onSubmitEditing={onSubmit}
        autoCorrect
        autoCapitalize="sentences"
      />
      <Pressable
        onPress={onSubmit}
        disabled={!ready}
        style={[
          styles.btn,
          { backgroundColor: ready ? colors.accent : colors.bgMuted },
        ]}
        accessibilityRole="button"
        accessibilityLabel="Add"
      >
        <Plus
          size={moderateScale(16)}
          color={ready ? "#FFFFFF" : colors.textTertiary}
          strokeWidth={2.5}
        />
      </Pressable>
    </View>
  );
};

const useStyles = makeStyles((theme) => ({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: moderateScale(8),
    marginTop: theme.spacing.s5,
    paddingHorizontal: moderateScale(14),
    paddingVertical: moderateScale(8),
    borderRadius: moderateScale(16),
    borderWidth: StyleSheet.hairlineWidth,
  },
  input: {
    flex: 1,
    fontFamily: "DMSans_500Medium",
    fontSize: fontScale(14),
    paddingVertical: verticalScale(8),
  },
  btn: {
    width: moderateScale(34),
    height: moderateScale(34),
    borderRadius: moderateScale(17),
    alignItems: "center",
    justifyContent: "center",
  },
}));
