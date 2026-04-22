import React from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import { Search, X as XIcon } from 'lucide-react-native';
import {
  makeStyles,
  moderateScale,
  scale,
  shadows,
  typography,
  useTheme,
  verticalScale,
} from '@/theme';

interface SearchBarProps {
  value: string;
  onChangeText: (next: string) => void;
  placeholder?: string;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  value,
  onChangeText,
  placeholder = 'Search notes…',
}) => {
  const { colors } = useTheme();
  const styles = useStyles();

  return (
    <View
      style={[
        styles.row,
        { backgroundColor: colors.bgSurface, borderColor: colors.border },
        shadows.card,
      ]}
    >
      <Search size={16} color={colors.textTertiary} strokeWidth={2} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textTertiary}
        style={[typography.body, { flex: 1, color: colors.textPrimary }]}
      />
      {!!value && (
        <Pressable onPress={() => onChangeText('')} hitSlop={8}>
          <XIcon size={14} color={colors.textTertiary} strokeWidth={2} />
        </Pressable>
      )}
    </View>
  );
};

const useStyles = makeStyles((theme) => ({
  row: {
    height: verticalScale(44),
    borderRadius: theme.radius.full,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: scale(16),
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(8),
  },
}));
