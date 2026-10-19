import { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius } from '../theme';
import { formatCountdown } from '../progress/logic';
import { useProgress } from '../progress/ProgressContext';
import Flag from './Flag';

const LANGUAGES = [
  { code: 'fr', label: 'French' },
  { code: 'es', label: 'Spanish' },
  { code: 'en', label: 'English' },
];
const FLAME = '#FF9600';

// The bar across the top: language flag (left), streak (middle), hearts (right).
export default function TopBar({ onOpenStreak }) {
  const { lang, setLang, hearts, msToNextHeart, streak, practicedToday } = useProgress();
  const [picking, setPicking] = useState(false);

  return (
    <View style={styles.bar}>
      <Pressable
        onPress={() => setPicking(true)}
        accessibilityRole="button"
        accessibilityLabel="Change language"
        style={styles.flagButton}
        hitSlop={8}
      >
        <Flag lang={lang} />
        <Ionicons name="chevron-down" size={16} color={colors.muted} />
      </Pressable>

      <Pressable
        onPress={onOpenStreak}
        accessibilityRole="button"
        accessibilityLabel={`${streak} day streak. Open streak calendar`}
        style={styles.stat}
        hitSlop={8}
      >
        <Ionicons name="flame" size={24} color={practicedToday ? FLAME : colors.line} />
        <Text style={[styles.statText, { color: practicedToday ? FLAME : colors.muted }]}>{streak}</Text>
      </Pressable>

      <View style={styles.stat} accessibilityLabel={`${hearts} hearts`}>
        <Ionicons name="heart" size={24} color={hearts > 0 ? colors.madder : colors.line} />
        <Text style={[styles.statText, { color: hearts > 0 ? colors.madder : colors.muted }]}>{hearts}</Text>
        {msToNextHeart !== null && <Text style={styles.countdown}>{formatCountdown(msToNextHeart)}</Text>}
      </View>

      <Modal visible={picking} transparent animationType="fade" onRequestClose={() => setPicking(false)}>
        <Pressable style={styles.backdrop} onPress={() => setPicking(false)}>
          <View style={styles.sheet}>
            <Text style={styles.sheetTitle}>I want to learn</Text>
            {LANGUAGES.map((l) => (
              <Pressable
                key={l.code}
                onPress={() => {
                  setLang(l.code);
                  setPicking(false);
                }}
                style={[styles.option, l.code === lang && styles.optionActive]}
                accessibilityRole="button"
              >
                <Flag lang={l.code} height={26} />
                <Text style={styles.optionText}>{l.label}</Text>
                {l.code === lang && <Ionicons name="checkmark" size={22} color={colors.lapisDark} />}
              </Pressable>
            ))}
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: colors.card,
    borderBottomWidth: 2,
    borderBottomColor: colors.line,
  },
  flagButton: { flexDirection: 'row', alignItems: 'center', gap: 6, minWidth: 72 },
  stat: { flexDirection: 'row', alignItems: 'center', gap: 4, minWidth: 72, justifyContent: 'flex-end' },
  statText: { fontSize: 18, fontWeight: '800' },
  countdown: { fontSize: 12, color: colors.muted, marginLeft: 2 },
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', padding: 24 },
  sheet: { backgroundColor: colors.card, borderRadius: 20, padding: 20, gap: 10 },
  sheetTitle: { fontSize: 20, fontWeight: '700', color: colors.ink, marginBottom: 6 },
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
