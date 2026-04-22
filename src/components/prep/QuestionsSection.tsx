import React, { useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { Plus, X as XIcon } from 'lucide-react-native';
import { fontScale, makeStyles, moderateScale, scale, typography, useTheme, verticalScale } from '@/theme';
import { hapticLight } from '@/services/haptics';
import { usePrepQuestions } from '@/hooks/usePrepQuestions';

interface QuestionsSectionProps {
  questions: string[];
  accent: string;
  /** Real appointment id; pass null for demo rows to hide add/remove affordances. */
  appointmentId: string | null;
}

interface QuestionRowProps {
  index: number;
  text: string;
  accent: string;
  onRemove: ((index: number) => void) | null;
}

const QuestionRow: React.FC<QuestionRowProps> = ({ index, text, accent, onRemove }) => {
  const { colors } = useTheme();
  const styles = useStyles();

  return (
    <View style={[styles.row, { backgroundColor: colors.bgPrimary }]}>
      <View style={[styles.idx, { backgroundColor: accent + '22' }]}>
        <Text style={[styles.idxText, { color: accent }]}>{index + 1}</Text>
      </View>
      <Text
        style={[
          typography.body,
          { color: colors.textPrimary, flex: 1, lineHeight: fontScale(20) },
        ]}
      >
        {text}
      </Text>
      {onRemove && (
        <Pressable hitSlop={8} onPress={() => onRemove(index)}>
          <XIcon size={14} color={colors.textTertiary} strokeWidth={2} />
        </Pressable>
      )}
    </View>
  );
};

export const QuestionsSection: React.FC<QuestionsSectionProps> = ({
  questions,
  accent,
  appointmentId,
}) => {
  const { colors } = useTheme();
  const styles = useStyles();
  const { canEdit, add, remove } = usePrepQuestions(appointmentId);
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState('');

  const commit = () => {
    const trimmed = draft.trim();
    if (trimmed) add(trimmed);
    setDraft('');
    setAdding(false);
  };

  return (
    <View style={{ gap: 6 }}>
      {questions.map((q, i) => (
        <QuestionRow
          key={`${i}-${q.slice(0, 10)}`}
          index={i}
          text={q}
          accent={accent}
          onRemove={canEdit ? remove : null}
        />
      ))}

      {canEdit && adding && (
        <View
          style={[
            styles.row,
            { backgroundColor: colors.bgPrimary, borderColor: accent, borderWidth: 1 },
          ]}
        >
          <View style={[styles.idx, { backgroundColor: accent + '22' }]}>
            <Text style={[styles.idxText, { color: accent }]}>
              {questions.length + 1}
            </Text>
          </View>
          <TextInput
            autoFocus
            value={draft}
            onChangeText={setDraft}
            onSubmitEditing={commit}
            onBlur={commit}
            placeholder="Type your question…"
            placeholderTextColor={colors.textTertiary}
            returnKeyType="done"
            style={[
              typography.body,
              {
                flex: 1,
                color: colors.textPrimary,
                padding: 0,
                lineHeight: fontScale(20),
              },
            ]}
          />
        </View>
      )}

      {canEdit && !adding && (
        <Pressable
          onPress={() => {
            hapticLight();
            setAdding(true);
          }}
          style={[styles.add, { borderColor: colors.border }]}
        >
          <Plus size={14} color={colors.textTertiary} strokeWidth={2} />
          <Text
            style={[
              typography.label,
              { color: colors.textTertiary, fontFamily: 'DMSans_600SemiBold' },
            ]}
          >
            Add question
          </Text>
        </Pressable>
      )}
    </View>
  );
};

const useStyles = makeStyles((theme) => ({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: moderateScale(10),
    paddingHorizontal: scale(12),
    paddingVertical: verticalScale(10),
    borderRadius: theme.radius.md,
  },
  idx: {
    width: moderateScale(20),
    height: moderateScale(20),
    borderRadius: moderateScale(10),
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: moderateScale(1),
  },
  idxText: {
    fontFamily: 'DMSans_700Bold',
    fontSize: fontScale(11),
  },
  add: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: moderateScale(6),
    paddingVertical: verticalScale(10),
    borderWidth: 2,
    borderStyle: 'dashed',
    borderRadius: theme.radius.md,
  },
}));
