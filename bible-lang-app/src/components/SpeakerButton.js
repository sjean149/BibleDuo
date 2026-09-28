import { Pressable, Text, StyleSheet } from 'react-native';
import * as Speech from 'expo-speech';
import { SPEECH_LANG } from '../config';
import { colors } from '../theme';

export function speak(text, lang) {
  Speech.stop();
  Speech.speak(text, { language: SPEECH_LANG[lang] || 'en-US', rate: 0.85 });
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
