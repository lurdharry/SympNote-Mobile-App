import React from 'react';
import { Text, View } from 'react-native';
import { fontScale, makeStyles, moderateScale, verticalScale } from '@/theme';
import { DAY_COLS, ROW_LABELS } from '@/constants/insights';

interface HeatmapProps {
  grid: number[][];
}

export const Heatmap: React.FC<HeatmapProps> = ({ grid }) => {
  const styles = useStyles();

  return (
    <View>
      <View style={styles.headerRow}>
        <View style={{ width: 40 }} />
        {DAY_COLS.map((d, i) => (
          <View key={i} style={styles.col}>
            <Text style={styles.label}>{d}</Text>
          </View>
        ))}
      </View>
      {ROW_LABELS.map((row, rIdx) => (
        <View key={rIdx} style={styles.dataRow}>
          <View style={styles.rowLabel}>
            <Text style={styles.label}>{row}</Text>
          </View>
          {Array.from({ length: 7 }).map((_, col) => {
            const cell = grid[rIdx]?.[col] ?? 0;
            return (
              <View key={col} style={styles.col}>
                <View
                  style={[
                    styles.cell,
                    { backgroundColor: `rgba(44,110,107,${0.08 + cell * 0.7})` },
                  ]}
                />
              </View>
            );
          })}
        </View>
      ))}
    </View>
  );
};

const useStyles = makeStyles(() => ({
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: verticalScale(4),
  },
  dataRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: verticalScale(4),
  },
  rowLabel: {
    width: 40,
    alignItems: 'flex-end',
    paddingRight: 4,
  },
  col: {
    flex: 1,
    aspectRatio: 1,
    padding: moderateScale(2),
  },
  cell: {
    flex: 1,
    borderRadius: moderateScale(3),
  },
  label: {
    fontFamily: 'DMSans_400Regular',
    fontSize: fontScale(11),
    color: '#8A9290',
    textAlign: 'center',
  },
}));
