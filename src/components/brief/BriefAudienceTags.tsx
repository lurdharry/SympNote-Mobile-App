import React from "react";
import { Pressable, Text, View } from "react-native";
import {
  fontScale,
  makeStyles,
  moderateScale,
  scale,
  useTheme,
  verticalScale,
} from "@/theme";
import { hapticLight } from "@/services/haptics";
import type { Brief, Clinician } from "@/stores/types";

interface BriefAudienceTagsProps {
  brief: Brief;
  careTeam: Clinician[];
  onSetClinicianIds: (ids: string[]) => void;
}

/**
 * "TAG WITH CLINICIAN" block on /brief/[id]. Always-visible chips —
 * an "Everyone" chip (active when no clinicians are tagged) plus one
 * chip per care-team member. Tap to toggle. Empty selection = the
 * brief surfaces in everyone's filtered view.
 *
 * Falls back to a hint line when the user hasn't added any
 * clinicians yet.
 */
export const BriefAudienceTags: React.FC<BriefAudienceTagsProps> = ({
  brief,
  careTeam,
  onSetClinicianIds,
}) => {
  const { colors } = useTheme();
  const styles = useStyles();

  const tagged = brief.clinicianIds
    .map((cid) => careTeam.find((c) => c.id === cid))
    .filter((c): c is Clinician => !!c);
  const everyoneActive = tagged.length === 0;

  const toggle = (clinicianId: string) => {
    hapticLight();
    const next = brief.clinicianIds.includes(clinicianId)
      ? brief.clinicianIds.filter((id) => id !== clinicianId)
      : [...brief.clinicianIds, clinicianId];
    onSetClinicianIds(next);
  };

  return (
    <View style={styles.tagBlock}>
      <Text style={[styles.tagLabel, { color: colors.textTertiary }]}>
        TAG WITH CLINICIAN
      </Text>
      {careTeam.length === 0 ? (
        <Text style={[styles.tagHint, { color: colors.textTertiary }]}>
          No clinicians on your care team yet — this brief is "for everyone."
        </Text>
      ) : (
        <>
          <View style={styles.chipRow}>
            {/* "Everyone" chip — active when no clinicians are tagged. */}
            <Pressable
              onPress={() => {
                hapticLight();
                onSetClinicianIds([]);
              }}
              style={[
                styles.chip,
                {
                  backgroundColor: everyoneActive ? colors.accent + "1A" : "transparent",
                  borderColor: everyoneActive ? colors.accent : colors.border,
                  borderStyle: everyoneActive ? "solid" : "dashed",
                },
              ]}
            >
              <Text
                style={[
                  styles.chipText,
                  { color: everyoneActive ? colors.accent : colors.textTertiary },
                ]}
              >
                Everyone
              </Text>
            </Pressable>
            {careTeam.map((c) => {
              const active = brief.clinicianIds.includes(c.id);
              return (
                <Pressable
                  key={c.id}
                  onPress={() => toggle(c.id)}
                  style={[
                    styles.chip,
                    {
                      backgroundColor: active ? colors.accent + "1A" : "transparent",
                      borderColor: active ? colors.accent : colors.border,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.chipText,
                      { color: active ? colors.accent : colors.textPrimary },
                    ]}
                  >
                    {c.name}
                  </Text>
                </Pressable>
              );
            })}
          </View>
          <Text style={[styles.tagHint, { color: colors.textTertiary }]}>
            Pick "Everyone" or one or more clinicians. Tap to toggle.
          </Text>
        </>
      )}
    </View>
  );
};

const useStyles = makeStyles((theme) => ({
  tagBlock: {
    marginTop: theme.spacing.s4,
    gap: theme.spacing.s2,
  },
  tagLabel: {
    fontFamily: "DMSans_700Bold",
    fontSize: fontScale(11),
    letterSpacing: 1.4,
  },
  tagHint: {
    ...theme.typography.caption,
    fontStyle: "italic",
    fontSize: fontScale(13),
    lineHeight: fontScale(18),
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: moderateScale(8),
  },
  chip: {
    paddingHorizontal: scale(12),
    paddingVertical: verticalScale(7),
    borderRadius: theme.radius.full,
    borderWidth: 1,
  },
  chipText: {
    fontFamily: "DMSans_600SemiBold",
    fontSize: fontScale(13),
  },
}));
