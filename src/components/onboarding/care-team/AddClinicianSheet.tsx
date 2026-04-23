import React, { useEffect, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { X as XIcon } from 'lucide-react-native';
import {
  fontScale,
  makeStyles,
  moderateScale,
  scale,
  shadows,
  spacing,
  typography,
  useTheme,
  verticalScale,
} from '@/theme';
import { SPECIALTIES, Specialty } from '@/constants/specialties';
import { hapticLight, hapticSuccess } from '@/services/haptics';

interface AddClinicianSheetProps {
  visible: boolean;
  /**
   * When provided, the sheet opens pre-pointed at this specialty. Lets
   * the empty-state shortcut chips skip the picker for the user.
   */
  initialSpecialty?: Specialty | null;
  onClose: () => void;
  onAdd: (value: { name: string; role: string }) => void;
}

const DEFAULT_SPECIALTY = SPECIALTIES[0]!;

export const AddClinicianSheet: React.FC<AddClinicianSheetProps> = ({
  visible,
  initialSpecialty,
  onClose,
  onAdd,
}) => {
  const { colors } = useTheme();
  const styles = useStyles();

  const [picked, setPicked] = useState<Specialty>(
    initialSpecialty ?? DEFAULT_SPECIALTY,
  );
  const [name, setName] = useState('');
  const [customRole, setCustomRole] = useState('');

  useEffect(() => {
    if (visible) {
      setPicked(initialSpecialty ?? DEFAULT_SPECIALTY);
      setName('');
      setCustomRole('');
    }
  }, [visible, initialSpecialty]);

  const isOther = picked.id === 'other';
  const role = isOther ? customRole.trim() : picked.label;
  const canAdd = name.trim().length > 0 && role.length > 0;

  const handleAdd = () => {
    if (!canAdd) return;
    hapticSuccess();
    onAdd({ name: name.trim(), role });
    onClose();
  };

  const pickSpecialty = (s: Specialty) => {
    hapticLight();
    setPicked(s);
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView
        style={{ flex: 1, backgroundColor: colors.bgPrimary }}
        edges={['top', 'bottom']}
      >
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <Pressable
            onPress={onClose}
            hitSlop={8}
            style={[styles.close, { backgroundColor: colors.bgMuted }]}
            accessibilityRole="button"
            accessibilityLabel="Close"
          >
            <XIcon size={moderateScale(18)} color={colors.textPrimary} strokeWidth={2} />
          </Pressable>
          <Text style={[typography.h3, { color: colors.textPrimary, flex: 1 }]}>
            Add a clinician
          </Text>
        </View>

        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Specialty preview tile */}
          <View style={styles.previewWrap}>
            <View style={styles.previewTile}>
              <LinearGradient
                colors={picked.grad}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFill}
              />
              <picked.Icon size={moderateScale(28)} color={picked.fg} strokeWidth={2} />
            </View>
            <Text
              style={[
                typography.caption,
                { color: colors.textTertiary, marginTop: spacing.s2 },
              ]}
            >
              {picked.label}
            </Text>
          </View>

          {/* Specialty picker */}
          <Text style={[styles.sectionLabel, { color: colors.textTertiary }]}>
            SPECIALTY
          </Text>
          <View style={styles.chipsRow}>
            {SPECIALTIES.map((s) => {
              const active = picked.id === s.id;
              return (
                <Pressable
                  key={s.id}
                  onPress={() => pickSpecialty(s)}
                  style={[
                    styles.chip,
                    {
                      backgroundColor: active ? s.grad[1] : colors.bgSurface,
                      borderColor: active ? s.grad[1] : colors.border,
                    },
                  ]}
                >
                  <Text
                    style={[
                      typography.label,
                      {
                        color: active ? '#FFFFFF' : colors.textPrimary,
                        fontFamily: 'DMSans_600SemiBold',
                      },
                    ]}
                  >
                    {s.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {isOther && (
            <>
              <Text
                style={[
                  styles.sectionLabel,
                  { color: colors.textTertiary, marginTop: spacing.s5 },
                ]}
              >
                CUSTOM SPECIALTY
              </Text>
              <View
                style={[
                  styles.input,
                  { backgroundColor: colors.bgSurface, borderColor: colors.border },
                  shadows.card,
                ]}
              >
                <TextInput
                  value={customRole}
                  onChangeText={setCustomRole}
                  placeholder="e.g. Endocrinology"
                  placeholderTextColor={colors.textTertiary}
                  autoCapitalize="words"
                  style={[typography.bodyLarge, { color: colors.textPrimary }]}
                />
              </View>
            </>
          )}

          <Text
            style={[
              styles.sectionLabel,
              { color: colors.textTertiary, marginTop: spacing.s5 },
            ]}
          >
            CLINICIAN NAME
          </Text>
          <View
            style={[
              styles.input,
              { backgroundColor: colors.bgSurface, borderColor: colors.border },
              shadows.card,
            ]}
          >
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="e.g. Dr. Chen"
              placeholderTextColor={colors.textTertiary}
              autoCapitalize="words"
              autoFocus
              style={[typography.bodyLarge, { color: colors.textPrimary }]}
            />
          </View>
        </ScrollView>

        <View style={[styles.footer, { borderTopColor: colors.border }]}>
          <Pressable
            onPress={handleAdd}
            disabled={!canAdd}
            style={[
              styles.addBtn,
              { backgroundColor: colors.accent, opacity: canAdd ? 1 : 0.4 },
              shadows.accentGlow,
            ]}
          >
            <Text style={styles.addLabel}>Add clinician</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const useStyles = makeStyles((theme) => ({
  header: {
    paddingHorizontal: spacing.s6,
    paddingTop: spacing.s3,
    paddingBottom: spacing.s3,
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(12),
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  close: {
    width: moderateScale(36),
    height: moderateScale(36),
    borderRadius: moderateScale(18),
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    paddingHorizontal: spacing.s6,
    paddingTop: spacing.s5,
    paddingBottom: spacing.s8,
  },
  previewWrap: {
    alignItems: 'center',
    marginBottom: spacing.s5,
  },
  previewTile: {
    width: moderateScale(72),
    height: moderateScale(72),
    borderRadius: moderateScale(20),
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionLabel: {
    ...theme.typography.label,
    fontFamily: 'DMSans_600SemiBold',
    letterSpacing: 0.4,
    marginBottom: spacing.s2,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: moderateScale(8),
  },
  chip: {
    paddingHorizontal: scale(14),
    paddingVertical: verticalScale(9),
    borderRadius: theme.radius.full,
    borderWidth: StyleSheet.hairlineWidth,
  },
  input: {
    borderRadius: theme.radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: scale(14),
    paddingVertical: verticalScale(12),
  },
  footer: {
    paddingHorizontal: spacing.s6,
    paddingTop: spacing.s3,
    paddingBottom: spacing.s4,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  addBtn: {
    height: verticalScale(52),
    borderRadius: theme.radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addLabel: {
    color: '#FFFFFF',
    fontFamily: 'DMSans_600SemiBold',
    fontSize: fontScale(15),
    letterSpacing: -0.1,
  },
}));
