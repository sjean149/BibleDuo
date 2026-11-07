import { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius } from '../theme';
import { useProgress } from '../progress/ProgressContext';
import Flag from './Flag';

const LANGUAGES = [
  { code: 'fr', label: 'French' },
  { code: 'es', label: 'Spanish' },
  { code: 'en', label: 'English' },
];

// English is taught in the learner's own language, so these labels are written in that language.
const SPOKEN = [
  { code: 'es', label: 'Español', question: '¿Qué idioma hablas?' },
  { code: 'fr', label: 'Français', question: 'Quelle langue parles-tu ?' },
];

// The "I want to learn" pop-up. Used by the flag in the top bar and by the profile page.
// Choosing English then asks which language the learner speaks.
// askSpoken: open straight on that question, and require an answer (saved progress without one).
export default function LanguagePicker({ visible, onClose, askSpoken = false }) {
  const { lang, base, setLang } = useProgress();
  const [choosingSpoken, setChoosingSpoken] = useState(false);
  const showSpoken = askSpoken || choosingSpoken;

  const close = () => {
    setChoosingSpoken(false);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={askSpoken ? undefined : close}>
      <Pressable style={styles.backdrop} onPress={askSpoken ? undefined : close}>
        <Pressable style={styles.sheet} onPress={() => {}}>
          {showSpoken ? (
            <>
              {SPOKEN.map((s) => (
                <Text key={s.code} style={styles.title}>
                  {s.question}
                </Text>
              ))}
              {SPOKEN.map((s) => (
                <Pressable
                  key={s.code}
                  onPress={() => {
                    setLang('en', s.code);
                    close();
                  }}
                  style={[styles.option, s.code === base && styles.optionActive]}
                  accessibilityRole="button"
                >
                  <Flag lang={s.code} height={26} />
                  <Text style={styles.optionText}>{s.label}</Text>
                  {s.code === base && <Ionicons name="checkmark" size={22} color={colors.lapisDark} />}
                </Pressable>
              ))}
            </>
          ) : (
            <>
              <Text style={styles.title}>I want to learn</Text>
              {LANGUAGES.map((l) => (
                <Pressable
                  key={l.code}
                  onPress={() => {
                    if (l.code === 'en') {
                      setChoosingSpoken(true);
                      return;
                    }
                    setLang(l.code);
                    close();
                  }}
                  style={[styles.option, l.code === lang && styles.optionActive]}
                  accessibilityRole="button"
                >
                  <Flag lang={l.code} height={26} />
                  <Text style={styles.optionText}>{l.label}</Text>
                  {l.code === lang && <Ionicons name="checkmark" size={22} color={colors.lapisDark} />}
                </Pressable>
              ))}
            </>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', padding: 24 },
  sheet: { backgroundColor: colors.card, borderRadius: 20, padding: 20, gap: 10 },
  title: { fontSize: 20, fontWeight: '700', color: colors.ink, marginBottom: 6 },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 14,
    borderRadius: radius.option,
    borderWidth: 2,
    borderColor: colors.line,
  },
  optionActive: { borderColor: colors.lapis, backgroundColor: colors.lapisTint },
  optionText: { flex: 1, fontSize: 18, fontWeight: '600', color: colors.ink },
});
