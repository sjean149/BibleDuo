import { useState } from 'react';
import { Text, TextInput, View, StyleSheet } from 'react-native';
import { colors, fonts, radius } from '../../theme';

export default function FillBlankExercise({ exercise, locked, onChange }) {
  const { prompt } = exercise;
  const [before, after] = prompt.text_with_blank.split('___');
  const [value, setValue] = useState('');

  const update = (text) => {
    setValue(text);
    onChange(text.trim() === '' ? null : text);
  };

  return (
    <View>
      <Text style={styles.instruction}>{prompt.instruction}</Text>
      <Text style={styles.sentence}>
        {before}
        <Text style={styles.blank}>{value ? value : '      '}</Text>
        {after}
      </Text>
      {prompt.verse_ref ? <Text style={styles.ref}>{prompt.verse_ref}</Text> : null}

      <TextInput
        style={styles.input}
        value={value}
        onChangeText={update}
        editable={!locked}
        autoCapitalize="none"
        autoCorrect={false}
        placeholder="Type the missing word"
        placeholderTextColor={colors.muted}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  instruction: { fontSize: 16, color: colors.muted, marginBottom: 18 },
  sentence: {
    fontFamily: fonts.scripture,
    fontSize: 28,
    lineHeight: 40,
    color: colors.ink,
    textAlign: 'center',
  },
  blank: {
    color: colors.lapisDark,
    textDecorationLine: 'underline',
  },
  ref: { textAlign: 'center', color: colors.muted, marginTop: 8, fontSize: 14 },
  input: {
    marginTop: 32,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: radius.option,
    borderWidth: 2,
    borderColor: colors.line,
    backgroundColor: colors.card,
    fontSize: 20,
    color: colors.ink,
  },
});
