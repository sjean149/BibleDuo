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

// The "I want to learn" pop-up. Used by the flag in the top bar and by the profile page.
export default function LanguagePicker({ visible, onClose }) {
  const { lang, setLang } = useProgress();
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={() => {}}>
          <Text style={styles.title}>I want to learn</Text>
          {LANGUAGES.map((l) => (
            <Pressable
              key={l.code}
              onPress={() => {
                setLang(l.code);
                onClose();
              }}
              style={[styles.option, l.code === lang && styles.optionActive]}
              accessibilityRole="button"
            >
              <Flag lang={l.code} height={26} />
              <Text style={styles.optionText}>{l.label}</Text>
              {l.code === lang && <Ionicons name="checkmark" size={22} color={colors.lapisDark} />}
            </Pressable>
          ))}
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
