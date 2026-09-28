import { useMemo, useState } from 'react';
import { Pressable, Text, View, StyleSheet } from 'react-native';
import { colors, fonts, radius } from '../../theme';
import { shuffle } from '../../utils/text';

export default function ReorderExercise({ exercise, locked, onChange }) {
  const { prompt } = exercise;
  const words = useMemo(() => shuffle(prompt.words), [exercise.id]);
  // indices into `words`, in the order the learner tapped them
  const [picked, setPicked] = useState([]);

  const commit = (next) => {
    setPicked(next);
    onChange(next.length === words.length ? next.map((i) => words[i]).join(' ') : null);
  };

  const add = (i) => !locked && commit([...picked, i]);
  const remove = (i) => !locked && commit(picked.filter((p) => p !== i));

  return (
    <View>
      <Text style={styles.instruction}>{prompt.instruction}</Text>

      <View style={styles.answerArea}>
        {picked.map((i) => (
          <Chip key={`p-${i}`} label={words[i]} onPress={() => remove(i)} />
        ))}
      </View>

      <View style={styles.bank}>
        {words.map((w, i) =>
          picked.includes(i) ? (
            <View key={`b-${i}`} style={[styles.chip, styles.ghost]}>
              <Text style={[styles.chipText, styles.ghostText]}>{w}</Text>
            </View>
          ) : (
            <Chip key={`b-${i}`} label={w} onPress={() => add(i)} />
          )
        )}
      </View>
    </View>
  );
}

function Chip({ label, onPress }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" style={styles.chip}>
      <Text style={styles.chipText}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  instruction: { fontSize: 16, color: colors.muted, marginBottom: 18 },
  answerArea: {
    minHeight: 96,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    padding: 12,
    borderBottomWidth: 2,
    borderTopWidth: 2,
    borderColor: colors.line,
    alignContent: 'flex-start',
  },
  bank: { marginTop: 28, flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center' },
  chip: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: radius.option,
    borderWidth: 2,
    borderColor: colors.line,
    backgroundColor: colors.card,
  },
  chipText: { fontFamily: fonts.scripture, fontSize: 20, color: colors.ink },
  ghost: { backgroundColor: colors.line, borderColor: colors.line },
  ghostText: { color: 'transparent' },
});
