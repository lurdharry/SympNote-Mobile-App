import React, { useState } from 'react';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Lock, Plus, X as XIcon } from 'lucide-react-native';
import {
  fontScale,
  makeStyles,
  moderateScale,
  scale,
  spacing,
  typography,
  useTheme,
  verticalScale,
} from '@/theme';
import { StaggeredList } from '@/components/animated/StaggeredList';
import { ClinicianCard } from '@/components/onboarding/care-team/ClinicianCard';
import { AddClinicianSheet } from '@/components/onboarding/care-team/AddClinicianSheet';
import { CareTeamEmpty } from '@/components/onboarding/care-team/CareTeamEmpty';
import { Specialty } from '@/constants/specialties';
import { useCareTeam, useProfileStore } from '@/stores/useProfileStore';
import { useAppointmentsStore } from '@/stores/useAppointmentsStore';
import { useRecordingsStore } from '@/stores/useRecordingsStore';
import { hapticLight, hapticSuccess } from '@/services/haptics';

type EditTarget =
  | { mode: 'add'; specialty: Specialty | null }
  | { mode: 'edit'; index: number; value: { name: string; role: string } };

const ScreenCareTeamManage: React.FC = () => {
  const router = useRouter();
  const { colors } = useTheme();
  const styles = useStyles();

  const careTeam = useCareTeam();
  const addClinician = useProfileStore((s) => s.addClinician);
  const updateClinician = useProfileStore((s) => s.updateClinician);
  const removeClinician = useProfileStore((s) => s.removeClinician);

  const [target, setTarget] = useState<EditTarget | null>(null);

  const openAdd = (specialty?: Specialty) => {
    hapticLight();
    setTarget({ mode: 'add', specialty: specialty ?? null });
  };

  const openEdit = (index: number) => {
    hapticLight();
    const c = careTeam[index];
    if (!c) return;
    setTarget({ mode: 'edit', index, value: { name: c.name, role: c.role } });
  };

  const handleRemove = (index: number) => {
    const c = careTeam[index];
    if (!c) return;

    // Block removal while the clinician still has upcoming appointments
    // attached. The user has to delete or reassign those visits first
    // — keeps the data model honest (no clinician → no upcoming visit
    // makes sense) without us cascade-deleting the user's appointments
    // out from under them.
    const upcomingLinked = useAppointmentsStore
      .getState()
      .appointments.filter((a) => a.clinicianId === c.id && a.status === "upcoming");

    if (upcomingLinked.length > 0) {
      const visitWord = upcomingLinked.length === 1 ? "appointment" : "appointments";
      Alert.alert(
        `Can't remove ${c.name}`,
        `${c.name} still has ${upcomingLinked.length} upcoming ${visitWord}. Delete ${
          upcomingLinked.length === 1 ? "that appointment" : "those appointments"
        } first, then you can remove this clinician.`,
        [{ text: "OK", style: "default" }],
      );
      return;
    }

    Alert.alert(
      `Remove ${c.name}?`,
      "Past visits stay as history but will be unlinked from this clinician. Visit briefs will no longer be tailored for them.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: () => {
            // Past appointments → keep the row, drop the link.
            const pastLinked = useAppointmentsStore
              .getState()
              .appointments.filter(
                (a) => a.clinicianId === c.id && a.status !== "upcoming",
              );
            for (const a of pastLinked) {
              useAppointmentsStore
                .getState()
                .update(a.id, { clinicianId: undefined });
            }
            // Recordings → strip this clinician from the routing list.
            const linkedRecordings = useRecordingsStore
              .getState()
              .recordings.filter((r) => r.clinicianIds?.includes(c.id));
            for (const r of linkedRecordings) {
              const remaining = (r.clinicianIds ?? []).filter((id) => id !== c.id);
              useRecordingsStore.getState().update(r.id, {
                clinicianIds: remaining.length > 0 ? remaining : undefined,
              });
            }
            removeClinician(index);
            hapticSuccess();
          },
        },
      ],
    );
  };

  const handleAddSave = (value: { name: string; role: string }) => {
    addClinician(value);
    hapticSuccess();
  };

  const handleEditSave = (value: { name: string; role: string }) => {
    if (target?.mode !== 'edit') return;
    updateClinician(target.index, value);
    hapticSuccess();
  };

  const hasMembers = careTeam.length > 0;

  return (
    <View style={[styles.root, { backgroundColor: colors.bgPrimary }]}>
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <View style={styles.header}>
          <Pressable
            onPress={() => router.back()}
            hitSlop={10}
            style={[styles.close, { backgroundColor: colors.bgMuted }]}
            accessibilityRole="button"
            accessibilityLabel="Close"
          >
            <XIcon size={moderateScale(18)} color={colors.textPrimary} strokeWidth={2} />
          </Pressable>
          <Text style={[typography.h2, { color: colors.textPrimary }]}>
            Care team
          </Text>
        </View>

        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <Text style={[styles.sub, { color: colors.textSecondary }]}>
            Who takes care of you? Sympnote organizes your entries by clinician
            so each visit prep stays relevant.
          </Text>

          {hasMembers ? (
            <View style={styles.list}>
              <StaggeredList stagger={60}>
                {careTeam.map((c, i) => (
                  <Pressable
                    key={c.id}
                    onPress={() => {
                      hapticLight();
                      router.push(`/clinician/${c.id}`);
                    }}
                    onLongPress={() => openEdit(i)}
                    accessibilityRole="button"
                    accessibilityLabel={`Open brief for ${c.name}`}
                  >
                    <ClinicianCard
                      clinician={{ id: c.id, name: c.name, role: c.role }}
                      onRemove={() => handleRemove(i)}
                    />
                  </Pressable>
                ))}
              </StaggeredList>

              <Pressable
                onPress={() => openAdd()}
                style={[
                  styles.addRow,
                  { backgroundColor: colors.bgSurface, borderColor: colors.border },
                ]}
                accessibilityRole="button"
                accessibilityLabel="Add clinician"
              >
                <View
                  style={[styles.addIcon, { backgroundColor: colors.accent + '1A' }]}
                >
                  <Plus size={moderateScale(16)} color={colors.accent} strokeWidth={2.2} />
                </View>
                <Text
                  style={[
                    typography.body,
                    {
                      color: colors.accent,
                      fontFamily: 'DMSans_600SemiBold',
                      flex: 1,
                    },
                  ]}
                >
                  Add a clinician
                </Text>
              </Pressable>
            </View>
          ) : (
            <View style={{ marginTop: spacing.s5 }}>
              <CareTeamEmpty onPickSpecialty={openAdd} />
            </View>
          )}

          <View style={[styles.privacyRow, { backgroundColor: colors.bgMuted }]}>
            <Lock size={moderateScale(12)} color={colors.textTertiary} strokeWidth={2.2} />
            <Text
              style={[typography.caption, { color: colors.textTertiary, flex: 1 }]}
            >
              Private to you. Sympnote never contacts your clinicians.
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>

      <AddClinicianSheet
        visible={target !== null}
        initialSpecialty={target?.mode === 'add' ? target.specialty : null}
        initialValue={target?.mode === 'edit' ? target.value : null}
        onClose={() => setTarget(null)}
        onAdd={handleAddSave}
        onSave={handleEditSave}
      />
    </View>
  );
};

export default ScreenCareTeamManage;

const useStyles = makeStyles((theme) => ({
  root: { flex: 1 },
  safe: { flex: 1 },
  header: {
    paddingTop: theme.spacing.s3,
    paddingHorizontal: theme.spacing.s6,
    paddingBottom: theme.spacing.s3,
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(12),
  },
  close: {
    width: moderateScale(36),
    height: moderateScale(36),
    borderRadius: moderateScale(18),
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    paddingHorizontal: theme.spacing.s6,
    paddingTop: theme.spacing.s2,
    paddingBottom: theme.spacing.s8,
  },
  sub: {
    ...theme.typography.body,
    lineHeight: fontScale(22),
    marginBottom: spacing.s5,
  },
  list: {
    gap: moderateScale(10),
  },
  addRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(12),
    paddingHorizontal: scale(14),
    paddingVertical: verticalScale(14),
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderStyle: 'dashed',
    marginTop: moderateScale(4),
  },
  addIcon: {
    width: moderateScale(28),
    height: moderateScale(28),
    borderRadius: moderateScale(8),
    alignItems: 'center',
    justifyContent: 'center',
  },
  privacyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(8),
    paddingHorizontal: scale(14),
    paddingVertical: verticalScale(10),
    borderRadius: theme.radius.full,
    marginTop: spacing.s5,
  },
}));
