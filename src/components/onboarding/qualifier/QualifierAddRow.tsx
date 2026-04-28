import React from "react";
import { Pressable, StyleSheet, TextInput, View } from "react-native";
import { Plus } from "lucide-react-native";
import {
  fontScale,
  makeStyles,
  moderateScale,
  scale,
  useTheme,
  verticalScale,
} from "@/theme";

interface QualifierAddRowProps {
  value: string;
  onChange: (next: string) => void;
  onSubmit: () => void;
  disabled: boolean;
}

/**
 * "Add your own…" pill below a multi-select ChipTray. Submit either
 * via return key or the trailing plus pip — both go through the
 * parent's addCustom handler which prefixes with `custom:` and
 * appends to the chip set.
 */
export const QualifierAddRow: React.FC<QualifierAddRowProps> = ({
  value,
  onChange,
  onSubmit,
  disabled,
}) => {
  const { colors } = useTheme();
  const styles = useStyles();
  const canAdd = value.trim().length > 0 && !disabled;

  return (
    <View style={[styles.row, { borderColor: colors.border }]}>
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder="Add your own..."
        placeholderTextColor={colors.textTertiary}
        editable={!disabled}
        onSubmitEditing={onSubmit}
        returnKeyType="done"
        style={[styles.input, { color: colors.textPrimary }]}
        accessibilityLabel="Add your own condition"
      />
      <Pressable
        onPress={onSubmit}
        disabled={!canAdd}
        hitSlop={8}
        style={[
          styles.btn,
          {
            backgroundColor: canAdd ? colors.accent : colors.bgMuted,
            opacity: canAdd ? 1 : 0.7,
          },
        ]}
        accessibilityRole="button"
        accessibilityLabel="Add condition"
      >
        <Plus
          size={moderateScale(16)}
          color={canAdd ? "#FFFFFF" : colors.textTertiary}
          strokeWidth={2.6}
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
    paddingLeft: scale(14),
    paddingRight: scale(6),
    paddingVertical: verticalScale(4),
    borderRadius: theme.radius.full,
    borderWidth: StyleSheet.hairlineWidth,
    backgroundColor: "white",
  },
  input: {
    flex: 1,
    paddingVertical: verticalScale(6),
    fontFamily: "DMSans_400Regular",
    fontSize: fontScale(13),
  },
  btn: {
    width: moderateScale(32),
    height: moderateScale(32),
    borderRadius: moderateScale(16),
    alignItems: "center",
    justifyContent: "center",
  },
}));
