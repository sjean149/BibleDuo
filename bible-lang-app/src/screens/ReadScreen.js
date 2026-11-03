import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { loadJourney, peekJourney } from '../journeyStore';
import { colors, radius } from '../theme';
import { isStepDone } from '../progress/logic';
import { sceneForChapter } from '../art/scenes';
import { useProgress } from '../progress/ProgressContext';
import { UNIT_COLORS } from '../unitColors';
import TopBar from '../components/TopBar';

// The Read tab, for people who only want to read and listen: every book of the New Testament,
// then its chapters. Reading never costs hearts. Finishing a chapter here also lights up the
// reading part of that chapter's circle on the path.
//   bookOrder: which book is open (null = the list of books)
export default function ReadScreen({ bookOrder, onSelectBook, onOpenChapter, onOpenStreak, onOpenHearts }) {
  const { state, lang } = useProgress();
  const [journey, setJourney] = useState(() => peekJourney(lang));
  const [error, setError] = useState(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setError(null);
    setJourney(peekJourney(lang));
    loadJourney(lang)
      .then((data) => {
        if (!cancelled) setJourney(data);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message);
      });
    return () => {
      cancelled = true;
    };
  }, [lang, attempt]);

  const units = journey?.units ?? [];
  const index = units.findIndex((u) => u.order === bookOrder);
  const book = index >= 0 ? units[index] : null;
  const color = UNIT_COLORS[(index >= 0 ? index : 0) % UNIT_COLORS.length];

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <TopBar onOpenStreak={onOpenStreak} onOpenHearts={onOpenHearts} />

      {error && !journey ? (
        <View style={styles.center}>
          <Text style={styles.message}>Can't reach the server: {error}</Text>
          <Pressable onPress={() => setAttempt((n) => n + 1)} style={styles.retry} accessibilityRole="button">
            <Text style={styles.retryText}>Try again</Text>
          </Pressable>
        </View>
      ) : !journey ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.lapis} />
        </View>
      ) : book ? (
        <ScrollView contentContainerStyle={styles.content}>
          <Pressable onPress={() => onSelectBook(null)} style={styles.back} accessibilityRole="button" accessibilityLabel="Back to all books">
            <Ionicons name="chevron-back" size={24} color={colors.ink} />
            <Text style={styles.backText}>All books</Text>
          </Pressable>
          <Text style={[styles.bookTitle, { color }]}>{book.display_name}</Text>
          <Text style={styles.sub}>Choose a chapter to read and listen. Tap any phrase to translate it.</Text>

          <View style={styles.grid}>
            {book.levels.map((level) => {
              const read = isStepDone(state, lang, level.chapter_id, 'reading');
              const ok = level.has_text;
              return (
                <Pressable
                  key={level.chapter_id}
                  disabled={!ok}
                  onPress={() => onOpenChapter({ title: `${book.display_name} ${level.chapter_number}`, chapterId: level.chapter_id, bookOrder: book.order, scene: sceneForChapter(book.name, level.chapter_number) })}
                  accessibilityRole="button"
                  accessibilityLabel={`Chapter ${level.chapter_number}${read ? ', read' : ''}`}
                  style={[styles.chapter, { borderColor: read ? colors.leaf : ok ? color : colors.line }, read && styles.chapterRead, !ok && styles.chapterOff]}
                >
                  {read ? (
                    <Ionicons name="checkmark" size={22} color={colors.leaf} />
                  ) : (
                    <Text style={[styles.chapterNumber, { color: ok ? color : colors.muted }]}>{level.chapter_number}</Text>
                  )}
                </Pressable>
              );
            })}
          </View>
        </ScrollView>
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.title}>Read</Text>
          <Text style={styles.sub}>Pick a book. Reading is always free.</Text>
          {units.map((unit, i) => {
            const ok = unit.levels.some((l) => l.has_text);
            const read = unit.levels.filter((l) => isStepDone(state, lang, l.chapter_id, 'reading')).length;
            const c = UNIT_COLORS[i % UNIT_COLORS.length];
            return (
              <Pressable
                key={unit.name}
                disabled={!ok}
                onPress={() => onSelectBook(unit.order)}
                accessibilityRole="button"
                accessibilityLabel={`${unit.display_name}${ok ? '' : ', coming soon'}`}
                style={[styles.card, !ok && styles.cardOff]}
              >
                <View style={[styles.stripe, { backgroundColor: ok ? c : colors.line }]} />
                <View style={styles.cardText}>
                  <Text style={[styles.cardTitle, !ok && { color: colors.muted }]}>{unit.display_name}</Text>
                  <Text style={styles.cardSub}>
                    {ok ? `${unit.levels.length} chapters${read ? `, ${read} read` : ''}` : 'Coming soon'}
                  </Text>
                </View>
                {ok && <Ionicons name="chevron-forward" size={22} color={colors.muted} />}
              </Pressable>
            );
          })}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.mist },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 14 },
  message: { fontSize: 16, color: colors.muted, textAlign: 'center' },
  retry: { paddingVertical: 10, paddingHorizontal: 22, borderRadius: radius.button, backgroundColor: colors.lapis },
  retryText: { color: '#FFFFFF', fontWeight: '700' },
  content: { padding: 16, paddingBottom: 32, gap: 10 },
  title: { fontSize: 28, fontWeight: '800', color: colors.ink },
  sub: { fontSize: 15, color: colors.muted, marginBottom: 6 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: colors.card,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: colors.line,
    paddingVertical: 14,
    paddingRight: 16,
    overflow: 'hidden',
  },
  cardOff: { opacity: 0.6 },
  stripe: { width: 8, alignSelf: 'stretch' },
  cardText: { flex: 1, gap: 2 },
  cardTitle: { fontSize: 19, fontWeight: '800', color: colors.ink },
  cardSub: { fontSize: 14, color: colors.muted },
  back: { flexDirection: 'row', alignItems: 'center', gap: 2, alignSelf: 'flex-start' },
  backText: { fontSize: 16, fontWeight: '700', color: colors.ink },
  bookTitle: { fontSize: 30, fontWeight: '800', marginTop: 4 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 8 },
  chapter: {
    width: 62,
    height: 62,
    borderRadius: 16,
    borderWidth: 2,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chapterRead: { backgroundColor: colors.leafTint },
  chapterOff: { opacity: 0.5 },
  chapterNumber: { fontSize: 20, fontWeight: '800' },
});
