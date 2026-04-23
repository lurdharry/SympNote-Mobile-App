import React, { useMemo, useState } from 'react';
import {
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { format, parseISO } from 'date-fns';
import { sortBy } from 'lodash';
import { Check, Mic, X as XIcon } from 'lucide-react-native';
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
import type { Recording } from '@/stores/types';
import { formatDuration } from '@/utils/date';
import { hapticLight, hapticSuccess } from '@/services/haptics';

interface RecordingPickerProps {
  visible: boolean;
  recordings: Recording[];
  initialSelected: string[];
  onClose: () => void;
  onSave: (ids: string[]) => void;
}

interface RowProps {
  recording: Recording;
  selected: boolean;
  onToggle: () => void;
}

const Row: React.FC<RowProps> = ({ recording, selected, onToggle }) => {
  const { colors } = useTheme();
  const styles = useStyles();
  const d = parseISO(recording.createdAt);

  return (
    <Pressable onPress={onToggle} style={[styles.row, { borderBottomColor: colors.border }]}>
      <View
        style={[
          styles.checkbox,
          {
            backgroundColor: selected ? colors.accent : 'transparent',
            borderColor: selected ? colors.accent : colors.border,
          },
        ]}
      >
        {selected && <Check size={moderateScale(14)} color="#FFFFFF" strokeWidth={3} />}
      </View>

      <View style={{ flex: 1, minWidth: 0 }}>
        <View style={styles.meta}>
          <Mic size={moderateScale(10)} color={colors.textTertiary} strokeWidth={2} />
          <Text style={[typography.caption, { color: colors.textTertiary }]}>
            {format(d, 'MMM d · h:mm a')}
          </Text>
          <Text style={[typography.caption, { color: colors.textTertiary }]}>·</Text>
          <Text style={[typography.caption, { color: colors.textTertiary }]}>
            {formatDuration(recording.durationSec)}
          </Text>
        </View>
        <Text
          style={[
            typography.body,
            { color: colors.textPrimary, marginTop: 2, lineHeight: fontScale(20) },
          ]}
          numberOfLines={2}
        >
          {recording.transcript}
        </Text>
      </View>
    </Pressable>
  );
};

export const RecordingPicker: React.FC<RecordingPickerProps> = ({
  visible,
  recordings,
  initialSelected,
  onClose,
  onSave,
}) => {
  const { colors } = useTheme();
  const styles = useStyles();
  const [selected, setSelected] = useState<Set<string>>(
    () => new Set(initialSelected),
  );

  // Reset to the passed-in selection when the sheet opens.
  React.useEffect(() => {
    if (visible) setSelected(new Set(initialSelected));
  }, [visible, initialSelected]);

  const ordered = useMemo(
    () => sortBy(recordings, (r) => -parseISO(r.createdAt).getTime()),
    [recordings],
  );

  const toggle = (id: string) => {
    hapticLight();
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const save = () => {
    hapticSuccess();
    onSave(Array.from(selected));
    onClose();
  };

  return (
    <Modal
      visible={visible}
      onRequestClose={onClose}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.bgPrimary }} edges={['top']}>
        <View style={styles.header}>
          <Pressable onPress={onClose} hitSlop={8} style={styles.close}>
            <XIcon size={moderateScale(18)} color={colors.textPrimary} strokeWidth={2} />
          </Pressable>
          <Text style={[typography.h3, { color: colors.textPrimary, flex: 1 }]}>
            Attach recordings
          </Text>
          <Text style={[typography.label, { color: colors.textTertiary }]}>
            {selected.size} selected
          </Text>
        </View>

        {recordings.length === 0 ? (
          <View style={styles.empty}>
            <Text style={[typography.body, { color: colors.textTertiary, textAlign: 'center' }]}>
              No recordings yet. Log an entry first and it'll show up here.
            </Text>
          </View>
        ) : (
          <FlatList
            data={ordered}
            keyExtractor={(r) => r.id}
            renderItem={({ item }) => (
              <Row
                recording={item}
                selected={selected.has(item.id)}
                onToggle={() => toggle(item.id)}
              />
            )}
            contentContainerStyle={styles.list}
          />
        )}

        <View
          style={[styles.footer, { backgroundColor: colors.bgPrimary, borderTopColor: colors.border }]}
        >
          <Pressable
            onPress={save}
            style={[styles.saveBtn, { backgroundColor: colors.accent }, shadows.accentGlow]}
          >
            <Text style={styles.saveLabel}>
              {selected.size === 0
                ? 'Clear attachments'
                : `Attach ${selected.size} ${selected.size === 1 ? 'recording' : 'recordings'}`}
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const useStyles = makeStyles((theme) => ({
  header: {
    paddingTop: theme.spacing.s3,
    paddingBottom: theme.spacing.s3,
    paddingHorizontal: theme.spacing.s6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(12),
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.border,
  },
  close: {
    width: moderateScale(36),
    height: moderateScale(36),
    borderRadius: moderateScale(18),
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.bgMuted,
  },
  list: {
    paddingBottom: verticalScale(24),
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: moderateScale(12),
    paddingHorizontal: scale(16),
    paddingVertical: verticalScale(14),
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  checkbox: {
    width: moderateScale(22),
    height: moderateScale(22),
    borderRadius: moderateScale(6),
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: moderateScale(2),
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(6),
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.s8,
  },
  footer: {
    paddingHorizontal: theme.spacing.s6,
    paddingTop: theme.spacing.s3,
    paddingBottom: theme.spacing.s4,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  saveBtn: {
    height: verticalScale(52),
    borderRadius: theme.radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveLabel: {
    color: '#FFFFFF',
    fontFamily: 'DMSans_600SemiBold',
    fontSize: fontScale(15),
    letterSpacing: -0.1,
  },
}));
