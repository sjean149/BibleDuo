import { useEffect, useMemo, useState } from 'react';
import { Pressable, Text, View, StyleSheet } from 'react-native';
import SpeakerButton, { speak } from '../SpeakerButton';
import { colors, fonts, radius } from '../../theme';
import { shuffle } from '../../utils/text';

// Handles both "multiple_choice" (see a word, pick the meaning)
// and "listen_select" (hear a word, pick the meaning).
export default function ChoiceExercise({ exercise, lang, locked, onChange }) {
  const { prompt, answer, type } = exercise;
  const isListen = type === 'listen_select';
  const word = isListen ? prompt.audio_word : prompt.text;

  const options = useMemo(
    () => shuffle([answer.value, ...(answer.distractors || [])]),
    [exercise.id]
  );
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    if (isListen) speak(word, lang);
  }, []);

  const choose = (option) => {
    if (locked) return;
    setSelected(option);
    onChange(option);
  };

  return (
    <View>
      <Text style={styles.instruction}>{prompt.instruction}</Text>
      {isListen ? null : <Text style={[styles.word, word.length > 24 && styles.sentence]}>{word}</Text>}
      {/* Concept questions are in English, so they have no Listen button. */}
      {prompt.audio === false ? null : <SpeakerButton text={word} lang={lang} />}

      <View style={styles.options}>
        {options.map((option) => {
          const isSelected = selected === option;
          return (
            <Pressable
              key={option}
              onPress={() => choose(option)}
              accessibilityRole="button"
              accessibilityState={{ selected: isSelected }}
              style={[styles.option, isSelected && styles.optionSelected]}
            >
              <Text style={[styles.optionText, isSelected && styles.optionTextSelected]}>
                {option}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  instruction: { fontSize: 16, color: colors.muted, marginBottom: 18 },
  word: {
    fontFamily: fonts.scripture,
    fontSize: 40,
    color: colors.ink,
    textAlign: 'center',
    marginBottom: 14,
  },
  sentence: { fontSize: 22, lineHeight: 32, textAlign: 'left' }, // whole verses and questions
  options: { marginTop: 28, gap: 10 },
  option: {
    paddingVertical: 16,
    paddingHorizontal: 18,
    borderRadius: radius.option,
    borderWidth: 2,
    borderColor: colors.line,
    backgroundColor: colors.card,
  },
  optionSelected: { borderColor: colors.lapis, backgroundColor: colors.lapisTint },
  optionText: { fontSize: 18, color: colors.ink },
  optionTextSelected: { color: colors.lapisDark, fontWeight: '600' },
});
