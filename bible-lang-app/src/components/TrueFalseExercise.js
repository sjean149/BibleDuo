import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius } from '../theme';

// A sentence in the language being learned plus an English line.
// The learner says whether the English line is the right translation.
export default function TrueFalseExercise({ exercise, locked, onChange }) {
  const { text, translation, instruction } = exercise.prompt;
  const [choice, setChoice] = useState(null); // true | false | null

  const choose = (value) => {
    if (locked) return;
    setChoice(value);
    onChange(value); // false is a real answer, so the lesson screen only treats null as "no answer"
  };

  return (
    <View style={styles.wrap}>
      <Text style={styles.instruction}>{instruction ?? 'True or false?'}</Text>

      <Text style={styles.sentence}>{text}</Text>
      <View style={styles.translation}>
        <Text style={styles.translationText}>{translation}</Text>
      </View>

      <View style={styles.row}>
        {[
          { value: true, label: 'True' },
          { value: false, label: 'False' },
        ].map(({ value, label }) => {
          const active = choice === value;
          return (
            <Pressable
              key={label}
              onPress={() => choose(value)}
              disabled={locked}
              accessibilityRole="button"
              style={({ pressed }) => [
                styles.button,
                active && styles.buttonActive,
                pressed && !locked && { opacity: 0.85 },
              ]}
            >
              <Text style={[styles.buttonText, active && styles.buttonTextActive]}>{label}</Text>
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
  sentence: { fontSize: 22, lineHeight: 32, color: colors.ink },
  translation: {
    padding: 16,
    borderRadius: radius.option,
    backgroundColor: colors.card,
    borderWidth: 2,
    borderColor: colors.line,
  },
  translationText: { fontSize: 17, lineHeight: 25, color: colors.ink },
  row: { flexDirection: 'row', gap: 12, marginTop: 8 },
  button: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
    borderRadius: radius.option,
    borderWidth: 2,
    borderColor: colors.line,
    backgroundColor: colors.card,
  },
  buttonActive: { borderColor: colors.lapis, backgroundColor: colors.lapisTint },
  buttonText: { fontSize: 18, fontWeight: '700', color: colors.ink },
  buttonTextActive: { color: colors.lapisDark },
});
