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
  /** Optional handler that clears the entire selection (resets to
   *  the implicit "everyone" default). Falls back to clearing each
   *  selected name through onToggle when not provided. */
  onClearAll?: () => void;
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
  onClearAll,
}) => {
  const { colors } = useTheme();
  const styles = useStyles();
  if (careTeam.length === 0) return null;

  const isSelected = (name: string) =>
    selected.some((s) => s.trim().toLowerCase() === name.trim().toLowerCase());
  const generalActive = selected.length === 0;

  const clearAll = () => {
    if (generalActive) return;
    hapticLight();
    if (onClearAll) {
      onClearAll();
      return;
    }
    // Fallback: toggle each currently-selected name off.
    selected.forEach((name) => onToggle(name));
  };

  return (
    <View style={{ gap: moderateScale(8) }}>
      <Text style={[styles.label, { color: colors.textTertiary }]}>ROUTE TO</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.row}
      >
        {/* "Everyone" is the implicit default when nothing else is
            picked. Use a dashed-border ghost treatment so it doesn't
            visually impersonate a manually-selected doctor — that
            mismatch was reading as "we auto-picked one for you". */}
        <Pressable
          onPress={clearAll}
          accessibilityRole="button"
          accessibilityLabel="Route to everyone"
          accessibilityState={{ selected: generalActive }}
          style={[
            styles.chip,
            styles.chipDefault,
            {
              backgroundColor: 'transparent',
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
                color: generalActive ? colors.accent : colors.textTertiary,
                fontFamily: 'DMSans_600SemiBold',
              },
            ]}
          >
            Everyone
          </Text>
        </Pressable>
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
  chipDefault: {
    // Dashed border distinguishes the implicit "everyone" default
    // from a manually-selected doctor (solid border + tinted bg).
    borderStyle: 'dashed',
    borderWidth: 1,
  },
  hint: {
    ...{ fontFamily: 'DMSans_400Regular', fontSize: fontScale(11) },
    fontStyle: 'italic',
  },
}));
