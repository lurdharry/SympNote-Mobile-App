import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';
import { X as XIcon } from 'lucide-react-native';
import {
  makeStyles,
  moderateScale,
  scale,
  typography,
  useTheme,
  verticalScale,
} from '@/theme';
import { hapticLight } from '@/services/haptics';
import type { TagOption } from '@/hooks/useHistoryData';

interface TagFilterStripProps {
  tags: TagOption[];
  active: string[];
  onToggle: (tag: string) => void;
  onClear: () => void;
}

export const TagFilterStrip: React.FC<TagFilterStripProps> = ({
  tags,
  active,
  onToggle,
  onClear,
}) => {
  const { colors } = useTheme();
  const styles = useStyles();

  const handleToggle = (tag: string) => {
    hapticLight();
    onToggle(tag);
  };

  const handleClear = () => {
    hapticLight();
    onClear();
  };

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
    >
      {active.length > 0 && (
        <Pressable
          onPress={handleClear}
          style={[styles.clearPill, { backgroundColor: colors.textPrimary }]}
        >
          <XIcon size={10} color="#FFFFFF" strokeWidth={2.5} />
          <Text
            style={[
              typography.label,
              { color: '#FFFFFF', fontFamily: 'DMSans_600SemiBold' },
            ]}
          >
            Clear
          </Text>
        </Pressable>
      )}
      {tags.map((tg) => {
        const isActive = active.includes(tg.t);
        return (
          <Pressable
            key={tg.t}
            onPress={() => handleToggle(tg.t)}
            style={[
              styles.filterPill,
              {
                backgroundColor: isActive ? tg.c : tg.c + '20',
                borderColor: isActive ? tg.c : tg.c + '55',
              },
            ]}
          >
            <Text
              style={[
                typography.label,
                {
                  color: isActive ? '#FFFFFF' : tg.c,
                  fontFamily: 'DMSans_600SemiBold',
                },
              ]}
            >
              #{tg.t}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
};

const useStyles = makeStyles((theme) => ({
  row: {
    flexDirection: 'row',
    gap: moderateScale(6),
    paddingHorizontal: theme.spacing.s6,
    paddingVertical: verticalScale(4),
  },
  filterPill: {
    height: verticalScale(32),
    paddingHorizontal: scale(12),
    borderRadius: theme.radius.full,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearPill: {
    height: verticalScale(32),
    paddingHorizontal: scale(12),
    borderRadius: theme.radius.full,
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(4),
  },
}));
