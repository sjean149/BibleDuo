import { Pressable, Text, StyleSheet } from 'react-native';
import { colors } from '../theme';
import { speakText } from '../utils/speech';

// Read a word or sentence aloud, at the learner's listening speed.
export function speak(text, lang) {
  speakText(text, lang);
}

export default function SpeakerButton({ text, lang }) {
  return (
    <Pressable
      onPress={() => speak(text, lang)}
      accessibilityRole="button"
      accessibilityLabel={`Hear "${text}"`}
      style={({ pressed }) => [styles.button, pressed && styles.pressed]}
    >
      <Text style={styles.label}>Listen</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignSelf: 'center',
    paddingVertical: 10,
    paddingHorizontal: 22,
    borderRadius: 999,
    backgroundColor: colors.lapisTint,
  },
  pressed: { opacity: 0.7 },
  label: { color: colors.lapisDark, fontSize: 15, fontWeight: '600' },
});
