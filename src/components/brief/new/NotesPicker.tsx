import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { format, parseISO } from "date-fns";
import { Check, Mic } from "lucide-react-native";
import {
  fontScale,
  makeStyles,
  moderateScale,
  shadows,
  typography,
  useTheme,
} from "@/theme";
import type { Recording } from "@/stores/types";

interface NotesPickerProps {
  recordings: Recording[];
  selected: Set<string>;
  onToggle: (id: string) => void;
  onSelectAll: () => void;
  onClear: () => void;
}

/**
 * Multi-select list of recordings on /brief/new. Header shows the
 * count + select-all/clear shortcuts; rows render with a check tile,
 * timestamp, and the first ~120 chars of transcript so the user has
 * enough context to pick without opening each note.
 */
export const NotesPicker: React.FC<NotesPickerProps> = ({
  recordings,
  selected,
  onToggle,
  onSelectAll,
  onClear,
}) => {
  const { colors } = useTheme();
  const styles = useStyles();

  return (
    <View style={styles.block}>
      <View style={styles.header}>
        <Text style={[styles.label, { color: colors.textTertiary }]}>
          NOTES · {recordings.length}
        </Text>
        <View style={styles.quickActions}>
          <Pressable onPress={onSelectAll} hitSlop={6}>
            <Text style={[styles.quickAction, { color: colors.accent }]}>Select all</Text>
          </Pressable>
          <Text style={[styles.quickAction, { color: colors.textTertiary }]}>·</Text>
          <Pressable onPress={onClear} hitSlop={6}>
            <Text style={[styles.quickAction, { color: colors.accent }]}>Clear</Text>
          </Pressable>
        </View>
      </View>

      {recordings.length === 0 ? (
        <Text style={[styles.emptyHint, { color: colors.textTertiary }]}>
          No notes in this range. Try widening the window or record something first.
        </Text>
      ) : (
        recordings.map((r) => (
          <PickerRow
            key={r.id}
            recording={r}
            selected={selected.has(r.id)}
            onToggle={() => onToggle(r.id)}
          />
        ))
      )}
    </View>
  );
};

interface PickerRowProps {
  recording: Recording;
  selected: boolean;
  onToggle: () => void;
}

const PickerRow: React.FC<PickerRowProps> = ({ recording, selected, onToggle }) => {
  const { colors } = useTheme();
  const styles = useStyles();
  const date = parseISO(recording.createdAt);
  const dateLabel = format(date, "MMM d · h:mm a");
  const preview = recording.transcript.trim().slice(0, 120);

  return (
    <Pressable
      onPress={onToggle}
      style={[
        styles.row,
        {
          backgroundColor: colors.bgSurface,
          borderColor: selected ? colors.accent : colors.border,
          borderWidth: selected ? 1.5 : StyleSheet.hairlineWidth,
        },
        shadows.card,
      ]}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: selected }}
      accessibilityLabel={`Note from ${dateLabel}`}
    >
      <View
        style={[
          styles.checkbox,
          {
            backgroundColor: selected ? colors.accent : "transparent",
            borderColor: selected ? colors.accent : colors.border,
          },
        ]}
      >
        {selected && <Check size={moderateScale(13)} color="#FFFFFF" strokeWidth={3} />}
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <View style={styles.meta}>
          <Mic size={moderateScale(10)} color={colors.textTertiary} strokeWidth={2.2} />
          <Text style={[styles.date, { color: colors.textTertiary }]}>{dateLabel}</Text>
        </View>
        <Text style={[styles.preview, { color: colors.textPrimary }]} numberOfLines={2}>
          {preview || "(empty note)"}
        </Text>
      </View>
    </Pressable>
  );
};

const useStyles = makeStyles((theme) => ({
  block: {
    marginTop: theme.spacing.s5,
    gap: theme.spacing.s2,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  label: {
    fontFamily: "DMSans_700Bold",
    fontSize: fontScale(10),
    letterSpacing: 1.4,
  },
  quickActions: {
    flexDirection: "row",
    gap: moderateScale(8),
    alignItems: "center",
  },
  quickAction: {
    fontFamily: "DMSans_600SemiBold",
    fontSize: fontScale(11),
    letterSpacing: 0.2,
  },
  emptyHint: {
    ...typography.body,
    fontSize: fontScale(12),
    fontStyle: "italic",
    paddingVertical: theme.spacing.s4,
  },
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: moderateScale(12),
    paddingHorizontal: moderateScale(14),
    paddingVertical: moderateScale(12),
    borderRadius: theme.radius.lg,
  },
  checkbox: {
    width: moderateScale(22),
    height: moderateScale(22),
    borderRadius: moderateScale(6),
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  meta: {
    flexDirection: "row",
    alignItems: "center",
    gap: moderateScale(5),
  },
  date: {
    fontFamily: "DMSans_600SemiBold",
    fontSize: fontScale(10),
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },
  preview: {
    fontFamily: "Fraunces_400Regular",
    fontSize: fontScale(14),
    lineHeight: fontScale(20),
    marginTop: 4,
  },
}));
