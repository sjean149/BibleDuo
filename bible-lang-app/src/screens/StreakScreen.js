import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme';
import { longestStreak } from '../progress/logic';
import { useProgress } from '../progress/ProgressContext';
import { MONTH_NAMES, WEEKDAYS, monthGrid, shiftMonth } from '../utils/calendar';

const FLAME = '#FF9600';

// The streak page: current and best streak, and a calendar with every practice day marked.
export default function StreakScreen({ onExit }) {
  const { streak, days, today, practicedToday } = useProgress();
  const best = useMemo(() => longestStreak(days), [days]);
  const practiced = useMemo(() => new Set(days), [days]);

  const now = new Date();
  const [view, setView] = useState({ year: now.getFullYear(), month: now.getMonth() });
  const weeks = monthGrid(view.year, view.month);
  const thisMonth = weeks.flat().filter((c) => c && practiced.has(c.key)).length;

  const message = practicedToday
    ? "You practiced today. Come back tomorrow to keep it going."
    : streak > 0
    ? 'Finish any step today to keep your streak alive.'
    : 'Finish any step to start your streak.';

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={onExit} hitSlop={12} accessibilityRole="button" accessibilityLabel="Back to the path">
          <Ionicons name="chevron-back" size={28} color={colors.ink} />
        </Pressable>
        <Text style={styles.headerTitle}>Streak</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.hero}>
          <Ionicons name="flame" size={72} color={practicedToday ? FLAME : colors.line} />
          <Text style={styles.heroNumber}>{streak}</Text>
          <Text style={styles.heroLabel}>day streak</Text>
          <Text style={styles.heroMessage}>{message}</Text>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Text style={styles.statNumber}>{best}</Text>
            <Text style={styles.statLabel}>Longest streak</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statNumber}>{days.length}</Text>
            <Text style={styles.statLabel}>Days practiced</Text>
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.monthRow}>
            <Pressable
              onPress={() => setView((v) => shiftMonth(v.year, v.month, -1))}
              hitSlop={12}
              accessibilityRole="button"
              accessibilityLabel="Previous month"
            >
              <Ionicons name="chevron-back" size={24} color={colors.ink} />
            </Pressable>
            <Text style={styles.monthTitle}>
              {MONTH_NAMES[view.month]} {view.year}
            </Text>
            <Pressable
              onPress={() => setView((v) => shiftMonth(v.year, v.month, 1))}
              hitSlop={12}
              accessibilityRole="button"
              accessibilityLabel="Next month"
            >
              <Ionicons name="chevron-forward" size={24} color={colors.ink} />
            </Pressable>
          </View>

          <View style={styles.week}>
            {WEEKDAYS.map((d, i) => (
              <Text key={i} style={styles.weekday}>
                {d}
              </Text>
            ))}
          </View>

          {weeks.map((week, wi) => (
            <View key={wi} style={styles.week}>
              {week.map((cell, ci) => {
                if (!cell) return <View key={ci} style={styles.cell} />;
                const on = practiced.has(cell.key);
                const isToday = cell.key === today;
                return (
                  <View key={ci} style={styles.cell}>
                    <View style={[styles.day, on && styles.dayOn, isToday && styles.dayToday]}>
                      <Text style={[styles.dayText, on && styles.dayTextOn]}>{cell.day}</Text>
                    </View>
                  </View>
                );
              })}
            </View>
          ))}

          <Text style={styles.monthNote}>
            {thisMonth} {thisMonth === 1 ? 'day' : 'days'} practiced in {MONTH_NAMES[view.month]}
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.mist },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerTitle: { fontSize: 20, fontWeight: '800', color: colors.ink },
  content: { padding: 16, gap: 16, paddingBottom: 48 },
  hero: { alignItems: 'center', paddingVertical: 12 },
  heroNumber: { fontSize: 56, fontWeight: '900', color: colors.ink, lineHeight: 64 },
  heroLabel: { fontSize: 18, fontWeight: '700', color: colors.muted },
  heroMessage: { marginTop: 10, fontSize: 15, color: colors.muted, textAlign: 'center' },
  statsRow: { flexDirection: 'row', gap: 12 },
  stat: {
    flex: 1,
    padding: 16,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: colors.line,
    backgroundColor: colors.card,
    alignItems: 'center',
  },
  statNumber: { fontSize: 28, fontWeight: '800', color: colors.ink },
  statLabel: { fontSize: 13, color: colors.muted, marginTop: 2 },
  card: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: colors.line,
    backgroundColor: colors.card,
    gap: 6,
  },
  monthRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  monthTitle: { fontSize: 18, fontWeight: '800', color: colors.ink },
  week: { flexDirection: 'row' },
  weekday: { flex: 1, textAlign: 'center', fontSize: 13, fontWeight: '700', color: colors.muted, paddingBottom: 4 },
  cell: { flex: 1, aspectRatio: 1, alignItems: 'center', justifyContent: 'center', padding: 2 },
  day: { flex: 1, aspectRatio: 1, borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
  dayOn: { backgroundColor: FLAME },
  dayToday: { borderWidth: 2, borderColor: colors.lapis },
  dayText: { fontSize: 15, color: colors.ink },
  dayTextOn: { color: '#FFFFFF', fontWeight: '800' },
  monthNote: { marginTop: 10, textAlign: 'center', fontSize: 14, color: colors.muted },
});
