import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Check, Users } from 'lucide-react-native';
import {
  fontScale,
  makeStyles,
  moderateScale,
  scale,
  typography,
  useTheme,
  verticalScale,
} from '../../theme';
import type { Clinician } from '../../stores/types';
import { hapticLight } from '../../services/haptics';

interface ClinicianTagRowProps {
  careTeam: Clinician[];
  /** Names of clinicians currently tagged. */
  selected: string[];
  onToggle: (name: string) => void;
}

/**
 * Multi-select row for routing a recording to specific clinicians.
 * Zero-selection is meaningful: the recording is "general" and feeds
 * every clinician's brief. Selecting one or more narrows routing to
 * just those clinicians. The row hides itself entirely when the
 * user's care team is empty — nothing to route to.
 */
export const ClinicianTagRow: React.FC<ClinicianTagRowProps> = ({
  careTeam,
  selected,
  onToggle,
}) => {
  const { colors } = useTheme();
  const styles = useStyles();
  if (careTeam.length === 0) return null;

  const isSelected = (name: string) =>
    selected.some((s) => s.trim().toLowerCase() === name.trim().toLowerCase());
  const generalActive = selected.length === 0;

  return (
    <View style={{ gap: moderateScale(8) }}>
      <Text style={[styles.label, { color: colors.textTertiary }]}>
        ROUTE TO
      </Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.row}
      >
        <View
          style={[
            styles.chip,
            {
              backgroundColor: generalActive ? colors.accent + '1A' : colors.bgSurface,
              borderColor: generalActive ? colors.accent : colors.border,
            },
          ]}
        >
          <Users
            size={moderateScale(12)}
            color={generalActive ? colors.accent : colors.textTertiary}
            strokeWidth={2.2}
          />
          <Text
            style={[
              typography.label,
              {
                color: generalActive ? colors.accent : colors.textSecondary,
                fontFamily: 'DMSans_600SemiBold',
              },
            ]}
          >
            Everyone
          </Text>
        </View>
        {careTeam.map((c) => {
          const active = isSelected(c.name);
          return (
            <Pressable
              key={`${c.name}-${c.role}`}
              onPress={() => {
                hapticLight();
                onToggle(c.name);
              }}
              style={[
                styles.chip,
                {
                  backgroundColor: active
                    ? colors.accent + '1A'
                    : colors.bgSurface,
                  borderColor: active ? colors.accent : colors.border,
                },
              ]}
            >
              {active && (
                <Check
                  size={moderateScale(12)}
                  color={colors.accent}
                  strokeWidth={2.4}
                />
              )}
              <Text
                style={[
                  typography.label,
                  {
                    color: active ? colors.accent : colors.textPrimary,
                    fontFamily: 'DMSans_600SemiBold',
                  },
                ]}
                numberOfLines={1}
              >
                {c.name}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
      <Text style={[styles.hint, { color: colors.textTertiary }]}>
        {generalActive
          ? 'Feeds every clinician brief. Tap a name to route only there.'
          : 'Only the selected clinicians will see this entry.'}
      </Text>
    </View>
  );
};

const useStyles = makeStyles(() => ({
  label: {
    fontFamily: 'DMSans_700Bold',
    fontSize: fontScale(10),
    letterSpacing: 1,
  },
  row: {
    flexDirection: 'row',
    gap: moderateScale(8),
    paddingRight: scale(4),
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(6),
    paddingHorizontal: scale(12),
    paddingVertical: verticalScale(7),
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
  },
  hint: {
    ...{ fontFamily: 'DMSans_400Regular', fontSize: fontScale(11) },
    fontStyle: 'italic',
  },
}));
