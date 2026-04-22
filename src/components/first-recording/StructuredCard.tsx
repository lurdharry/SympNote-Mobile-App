import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Sparkles } from 'lucide-react-native';
import {
  makeStyles,
  moderateScale,
  scale,
  shadows,
  spacing,
  typography,
  useTheme,
  verticalScale,
} from '@/theme';
import type { StructuredEntry } from '@/stores/types';
import { FIELD_META } from '@/constants/fields';
import { fieldDisplay } from '@/utils/fieldDisplay';
import { FieldRow } from './FieldRow';

interface StructuredCardProps {
  structured: StructuredEntry;
  fieldCount: number;
  burst: boolean;
}

export const StructuredCard: React.FC<StructuredCardProps> = ({
  structured,
  fieldCount,
  burst,
}) => {
  const { colors } = useTheme();
  const styles = useStyles();

  return (
    <View
      style={[
        styles.card,
        styles.aiCard,
        { backgroundColor: colors.bgSurface, borderColor: colors.accent },
        shadows.card,
      ]}
    >
      <View
        pointerEvents="none"
        style={[styles.aiBlob, { backgroundColor: colors.gold, opacity: 0.1 }]}
      />
      <View style={[styles.header, { marginBottom: spacing.s3 }]}>
        <Sparkles size={14} color={colors.accent} />
        <Text
          style={[
            typography.label,
            {
              color: colors.accent,
              fontFamily: 'DMSans_700Bold',
              letterSpacing: 0.8,
              flex: 1,
            },
          ]}
        >
          AI SUMMARY
        </Text>
        {burst && (
          <View style={[styles.xpBadge, { backgroundColor: colors.success }]}>
            <Text
              style={[
                typography.label,
                { color: '#FFFFFF', fontFamily: 'DMSans_700Bold' },
              ]}
            >
              +50 XP
            </Text>
          </View>
        )}
      </View>
      <View style={{ gap: 10 }}>
        {FIELD_META.slice(0, fieldCount).map((f, i) => (
          <FieldRow
            key={f.key}
            label={f.label}
            value={fieldDisplay(structured, f.key)}
            Icon={f.Icon}
            tint={f.tint}
            index={i}
          />
        ))}
      </View>
    </View>
  );
};

const useStyles = makeStyles((theme) => ({
  card: {
    padding: moderateScale(16),
    borderRadius: theme.radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    marginTop: theme.spacing.s4,
  },
  aiCard: {
    borderWidth: 2,
    overflow: 'hidden',
  },
  aiBlob: {
    position: 'absolute',
    right: -scale(16),
    top: -verticalScale(16),
    width: moderateScale(96),
    height: moderateScale(96),
    borderRadius: moderateScale(48),
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(6),
    marginBottom: moderateScale(4),
  },
  xpBadge: {
    paddingHorizontal: scale(8),
    paddingVertical: verticalScale(2),
    borderRadius: theme.radius.full,
  },
}));
