import React from 'react';
import { View } from 'react-native';
import { makeStyles, spacing } from '@/theme';
import { FIELDS, fieldValue } from '@/components/recording/types';
import type { FieldKey, StructuredWithSources } from '@/components/recording/types';
import type { BinLayout } from '@/hooks/useExtractLayout';
import { EXTRACT_BIN_KEYS } from '@/hooks/useExtractLayout';
import { BinCell } from './BinCell';

interface BinGridProps {
  bins: BinLayout[];
  structured: StructuredWithSources | null;
  filled: Record<string, boolean>;
}

const labelFor = (key: string): string =>
  FIELDS.find((f) => f.key === key)?.label ?? key;

export const BinGrid: React.FC<BinGridProps> = ({ bins, structured, filled }) => {
  const styles = useStyles();

  if (bins.length === 0) {
    return (
      <View style={styles.row}>
        {EXTRACT_BIN_KEYS.map((key) => (
          <BinCell key={key} label={labelFor(key)} />
        ))}
      </View>
    );
  }

  return (
    <View style={styles.row}>
      {bins.map((bin) => {
        const isFlag = bin.key === 'redFlags';
        const value = structured
          ? isFlag
            ? structured.redFlags[0] ?? ''
            : fieldValue(structured, bin.key as FieldKey)
          : '';
        return (
          <BinCell
            key={bin.key}
            label={bin.label}
            value={value}
            filled={!!filled[bin.key]}
            tone={isFlag ? 'warn' : 'accent'}
          />
        );
      })}
    </View>
  );
};

const useStyles = makeStyles(() => ({
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.s3,
  },
}));
