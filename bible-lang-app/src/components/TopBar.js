import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme';
import { formatCountdown } from '../progress/logic';
import { useProgress } from '../progress/ProgressContext';
import Flag from './Flag';
import LanguagePicker from './LanguagePicker';

const FLAME = '#FF9600';

// The bar across the top: language flag (left), streak (middle), hearts (right).
// Tapping the streak opens the calendar; tapping the hearts opens the hearts / unlimited page.
export default function TopBar({ onOpenStreak, onOpenHearts }) {
  const { lang, hearts, premium, msToNextHeart, streak, practicedToday } = useProgress();
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

      <Pressable
        onPress={onOpenHearts}
        accessibilityRole="button"
        accessibilityLabel={premium ? 'Unlimited hearts. Open hearts' : `${hearts} hearts. Open hearts`}
        style={styles.stat}
        hitSlop={8}
      >
        <Ionicons name="heart" size={24} color={hearts > 0 ? colors.madder : colors.line} />
        <Text style={[styles.statText, { color: hearts > 0 ? colors.madder : colors.muted }]}>
          {premium ? '\u221E' : hearts}
        </Text>
        {msToNextHeart !== null && <Text style={styles.countdown}>{formatCountdown(msToNextHeart)}</Text>}
      </Pressable>

      <LanguagePicker visible={picking} onClose={() => setPicking(false)} />
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
});
