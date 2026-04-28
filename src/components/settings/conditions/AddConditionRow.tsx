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

interface AddConditionRowProps {
  value: string;
  onChange: (next: string) => void;
  onSubmit: () => void;
}

/**
 * "Add your own" pill at the bottom of the inline conditions editor.
 * Submit on return key or via the trailing plus button — both go
 * through the parent's addCustom handler.
 */
export const AddConditionRow: React.FC<AddConditionRowProps> = ({ value, onChange, onSubmit }) => {
  const { colors } = useTheme();
  const styles = useStyles();
  const ready = value.trim().length > 0;

  return (
    <View style={[styles.row, { backgroundColor: colors.bgMuted, borderColor: colors.border }]}>
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder="e.g. Eczema"
        placeholderTextColor={colors.textTertiary}
        onSubmitEditing={onSubmit}
        returnKeyType="done"
        autoCapitalize="words"
        style={[styles.input, { color: colors.textPrimary }]}
        accessibilityLabel="Add a condition"
      />
      <Pressable
        onPress={onSubmit}
        disabled={!ready}
        hitSlop={6}
        style={[
          styles.btn,
          {
            backgroundColor: ready ? colors.accent : colors.bgMuted,
            opacity: ready ? 1 : 0.5,
          },
        ]}
        accessibilityRole="button"
        accessibilityLabel="Add condition"
      >
        <Plus
          size={moderateScale(14)}
          color={ready ? "#FFFFFF" : colors.textTertiary}
          strokeWidth={2.6}
        />
      </Pressable>
    </View>
  );
};

const useStyles = makeStyles(() => ({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: moderateScale(8),
    paddingLeft: scale(12),
    paddingRight: scale(4),
    paddingVertical: verticalScale(4),
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
  },
  input: {
    flex: 1,
    paddingVertical: verticalScale(8),
    fontFamily: "DMSans_500Medium",
    fontSize: fontScale(13),
  },
  btn: {
    width: moderateScale(30),
    height: moderateScale(30),
    borderRadius: moderateScale(15),
    alignItems: "center",
    justifyContent: "center",
  },
}));
