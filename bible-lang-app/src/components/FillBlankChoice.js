import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius } from '../theme';
import { shuffle } from '../utils/shuffle';

// Fill in the blank by tapping one word from a word bank.
// Used when the exercise has answer.distractors; otherwise the typing version is used.
export default function FillBlankChoice({ exercise, locked, onChange }) {
  const { text_with_blank: text, instruction, hint } = exercise.prompt;
  const { value, distractors } = exercise.answer;
  const [selected, setSelected] = useState(null);

  // Shuffle once per exercise, not on every render (otherwise the buttons would jump around).
  const options = useMemo(() => shuffle([value, ...distractors]), [exercise]);

  // Split the sentence around the first ___ so the chosen word can sit in the gap.
  const at = text.indexOf('___');
  const before = at === -1 ? text : text.slice(0, at);
  const after = at === -1 ? '' : text.slice(at + 3);

  const choose = (option) => {
    if (locked) return;
    setSelected(option);
    onChange(option);
  };

  return (
    <View style={styles.wrap}>
      <Text style={styles.instruction}>{instruction ?? 'Fill in the blank'}</Text>

      <Text style={styles.sentence}>
        {before}
        <Text style={[styles.blank, selected && styles.blankFilled]}>
          {selected ? ` ${selected} ` : ' ______ '}
        </Text>
        {after}
      </Text>
      {hint ? <Text style={styles.hint}>{hint}</Text> : null}

      <View style={styles.options}>
        {options.map((option) => {
          const active = option === selected;
          return (
            <Pressable
              key={option}
              onPress={() => choose(option)}
              disabled={locked}
              accessibilityRole="button"
              style={({ pressed }) => [
                styles.option,
                active && styles.optionActive,
                pressed && !locked && { opacity: 0.85 },
              ]}
            >
              <Text style={[styles.optionText, active && styles.optionTextActive]}>{option}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 16 },
  instruction: { fontSize: 15, color: colors.muted },
  sentence: { fontSize: 22, lineHeight: 34, color: colors.ink },
  blank: { color: colors.lapisDark, fontWeight: '700' },
  blankFilled: { backgroundColor: colors.lapisTint },
  hint: { fontSize: 15, lineHeight: 22, color: colors.muted, fontStyle: 'italic' },
  options: { gap: 10, marginTop: 8 },
  option: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: radius.option,
    borderWidth: 2,
    borderColor: colors.line,
    backgroundColor: colors.card,
  },
  optionActive: { borderColor: colors.lapis, backgroundColor: colors.lapisTint },
  optionText: { fontSize: 18, color: colors.ink, fontWeight: '600' },
  optionTextActive: { color: colors.lapisDark },
});
