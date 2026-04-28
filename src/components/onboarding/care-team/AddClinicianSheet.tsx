import React, { useEffect, useState } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { X as XIcon } from "lucide-react-native";
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
} from "@/theme";
import { SPECIALTIES, Specialty } from "@/constants/specialties";
import { hapticLight, hapticSuccess } from "@/services/haptics";

interface AddClinicianSheetProps {
  visible: boolean;
  /**
   * When provided, the sheet opens pre-pointed at this specialty. Lets
   * the empty-state shortcut chips skip the picker for the user.
   */
  initialSpecialty?: Specialty | null;
  /**
   * When provided AND no `initialSpecialty` is set, the sheet lands on
   * the "other" specialty with this string pre-populated in the custom
   * role input. Path used when the care-team screen has the user type
   * a specialty inline before opening the sheet.
   */
  initialCustomRole?: string;
  /**
   * When provided, the sheet is in edit mode: fields pre-populate from
   * the existing clinician, header copy flips to "Edit clinician", and
   * the save button calls `onSave` instead of `onAdd`. One of onAdd or
   * onSave must be provided.
   */
  initialValue?: { name: string; role: string } | null;
  onClose: () => void;
  onAdd?: (value: { name: string; role: string }) => void;
  onSave?: (value: { name: string; role: string }) => void;
}

const DEFAULT_SPECIALTY = SPECIALTIES[0]!;
const OTHER_SPECIALTY =
  SPECIALTIES.find((s) => s.id === "other") ?? DEFAULT_SPECIALTY;

/**
 * Match an arbitrary role string back to a Specialty so the picker
 * pre-selects correctly when editing. Falls back to "other" with the
 * role text in customRole.
 */
const matchSpecialty = (role: string): Specialty => {
  const target = role.trim().toLowerCase();
  const hit = SPECIALTIES.find((s) => s.label.toLowerCase() === target);
  return hit ?? SPECIALTIES.find((s) => s.id === "other")! ?? DEFAULT_SPECIALTY;
};

export const AddClinicianSheet: React.FC<AddClinicianSheetProps> = ({
  visible,
  initialSpecialty,
  initialCustomRole,
  initialValue,
  onClose,
  onAdd,
  onSave,
}) => {
  const { colors } = useTheme();
  const styles = useStyles();
  const isEdit = !!initialValue;

  // Initial specialty rules:
  //  - Explicit initialSpecialty wins.
  //  - No preset + initialCustomRole → "other" with the custom role
  //    pre-filled (the care-team screen's inline-input path).
  //  - No preset, no custom role → leave empty/"other" so the picker
  //    forces the user to choose. Never silently pre-select Primary
  //    care, which was the old bug.
  const resolveInitialPicked = (): Specialty => {
    if (initialSpecialty) return initialSpecialty;
    return OTHER_SPECIALTY;
  };

  const [picked, setPicked] = useState<Specialty>(resolveInitialPicked());
  const [name, setName] = useState("");
  const [customRole, setCustomRole] = useState(initialCustomRole ?? "");

  useEffect(() => {
    if (!visible) return;
    if (initialValue) {
      const matched = matchSpecialty(initialValue.role);
      setPicked(matched);
      setName(initialValue.name);
      setCustomRole(matched.id === "other" ? initialValue.role : "");
    } else if (initialSpecialty) {
      setPicked(initialSpecialty);
      setName("");
      setCustomRole("");
    } else {
      // No preset — land on "other" so the custom role input shows.
      setPicked(OTHER_SPECIALTY);
      setName("");
      setCustomRole(initialCustomRole ?? "");
    }
  }, [visible, initialSpecialty, initialCustomRole, initialValue]);

  const isOther = picked.id === "other";
  const role = isOther ? customRole.trim() : picked.label;
  const canAdd = name.trim().length > 0 && role.length > 0;

  const handleAdd = () => {
    if (!canAdd) return;
    hapticSuccess();
    const payload = { name: name.trim(), role };
    if (isEdit) {
      onSave?.(payload);
    } else {
      onAdd?.(payload);
    }
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
        edges={["top", "bottom"]}
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
            {isEdit ? "Edit clinician" : "Add a clinician"}
          </Text>
        </View>

        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Specialty preview — shows the picked specialty's mascot
              big at the top so the user sees the character they're
              about to give this clinician. */}
          <View style={styles.previewWrap}>
            <picked.Mascot size={moderateScale(96)} />
            <Text
              style={[typography.caption, { color: colors.textTertiary, marginTop: spacing.s2 }]}
            >
              {picked.label}
            </Text>
          </View>

          {/* Specialty picker — each chip carries its own mini mascot
              so the user can scan by character recognition, not just
              text. Active chip: accent border + tinted background. */}
          <Text style={[styles.sectionLabel, { color: colors.textTertiary }]}>SPECIALTY</Text>
          <View style={styles.chipsRow}>
            {SPECIALTIES.map((s) => {
              const active = picked.id === s.id;
              const SpecMascot = s.Mascot;
              return (
                <Pressable
                  key={s.id}
                  onPress={() => pickSpecialty(s)}
                  style={[
                    styles.chip,
                    {
                      backgroundColor: active ? colors.accent + "1A" : colors.bgSurface,
                      borderColor: active ? colors.accent : colors.border,
                      borderWidth: active ? 1.5 : StyleSheet.hairlineWidth,
                    },
                  ]}
                >
                  <SpecMascot size={moderateScale(22)} />
                  <Text
                    style={[
                      typography.label,
                      {
                        color: active ? colors.accent : colors.textPrimary,
                        fontFamily: "DMSans_600SemiBold",
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
                style={[styles.sectionLabel, { color: colors.textTertiary, marginTop: spacing.s5 }]}
              >
                SPECIALTY
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
            style={[styles.sectionLabel, { color: colors.textTertiary, marginTop: spacing.s5 }]}
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
            <Text style={styles.addLabel}>{isEdit ? "Save changes" : "Add clinician"}</Text>
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
    flexDirection: "row",
    alignItems: "center",
    gap: moderateScale(12),
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  close: {
    width: moderateScale(36),
    height: moderateScale(36),
    borderRadius: moderateScale(18),
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    paddingHorizontal: spacing.s6,
    paddingTop: spacing.s5,
    paddingBottom: spacing.s8,
  },
  previewWrap: {
    alignItems: "center",
    marginBottom: spacing.s5,
  },
  sectionLabel: {
    ...theme.typography.label,
    fontFamily: "DMSans_600SemiBold",
    letterSpacing: 0.4,
    marginBottom: spacing.s2,
  },
  chipsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: moderateScale(8),
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: moderateScale(6),
    paddingLeft: scale(8),
    paddingRight: scale(14),
    paddingVertical: verticalScale(6),
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
    alignItems: "center",
    justifyContent: "center",
  },
  addLabel: {
    color: "#FFFFFF",
    fontFamily: "DMSans_600SemiBold",
    fontSize: fontScale(15),
    letterSpacing: -0.1,
  },
}));
