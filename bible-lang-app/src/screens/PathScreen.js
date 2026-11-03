import { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { loadJourney, peekJourney } from '../journeyStore';
import { UNIT_COLORS } from '../unitColors';
import { sceneForChapter } from '../art/scenes';
import { colors, radius } from '../theme';
import { computeStatuses, isStepUnlocked, levelProgress, unitProgress } from '../progress/logic';
import { useProgress } from '../progress/ProgressContext';
import LevelCircle from '../components/LevelCircle';
import StepSheet from '../components/StepSheet';
import TopBar from '../components/TopBar';

// Sideways shift for each level in a unit, which makes the path wind like Duolingo's.
const OFFSETS = [0, 38, 64, 38, 0, -38, -64, -38];

// How long the book list takes to fade out (React Native's "fade" Modal animation is 300 ms).
const MENU_FADE_MS = 350;

export default function PathScreen({ onStartStep, onOpenStreak, onOpenHearts }) {
  const { state, lang, hearts, msToNextHeart } = useProgress();
  const [journey, setJourney] = useState(() => peekJourney(lang));
  const [error, setError] = useState(null);
  const [attempt, setAttempt] = useState(0); // bump to retry
  const [selected, setSelected] = useState(null); // { unit, level } while the step sheet is open
  const [menuUnit, setMenuUnit] = useState(null); // unit whose title was tapped: the book list is open

  const scrollRef = useRef(null);
  const unitY = useRef({});
  const scrolled = useRef(false);

  useEffect(() => {
    let cancelled = false;
    scrolled.current = false;
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
  const { statuses } = useMemo(() => computeStatuses(state, lang, units), [state, lang, units]);

  // Jump to the level the learner is up to, once, after the layout is known.
  const scrollToCurrent = (unitOrder, rowY) => {
    if (scrolled.current) return;
    scrolled.current = true;
    setTimeout(() => {
      const y = (unitY.current[unitOrder] ?? 0) + rowY - 180;
      scrollRef.current?.scrollTo({ y: Math.max(0, y), animated: false });
    }, 80);
  };

  // Jump to the top of a book chosen from the list. The scroll waits until the list has finished
  // fading out (MENU_FADE_MS): on web the closing list puts focus back on the banner that opened
  // it, and that focus would otherwise drag the path straight back to where it was.
  const jumpToUnit = (unit) => {
    setMenuUnit(null);
    setTimeout(() => {
      const y = unitY.current[unit.order] ?? 0;
      scrollRef.current?.scrollTo({ y: Math.max(0, y - 8), animated: false });
    }, MENU_FADE_MS);
  };

  const sheetLevel = selected?.level;
  const sheetProgress = sheetLevel ? levelProgress(state, lang, sheetLevel) : { available: [], done: [] };
  const sheetColor = selected ? UNIT_COLORS[(selected.unit.order - 40) % UNIT_COLORS.length] : colors.lapis;

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
      ) : (
        <ScrollView ref={scrollRef} contentContainerStyle={styles.scroll}>
          {units.map((unit, unitIndex) => {
            const color = UNIT_COLORS[unitIndex % UNIT_COLORS.length];
            const progress = unitProgress(state, lang, unit);
            return (
              <View key={unit.name} onLayout={(e) => (unitY.current[unit.order] = e.nativeEvent.layout.y)}>
                <Pressable
                  onPress={() => setMenuUnit(unit)}
                  accessibilityRole="button"
                  accessibilityLabel={`${unit.display_name}. Choose a book`}
                  style={[styles.banner, { backgroundColor: unit.levels.length ? color : colors.line }]}
                >
                  <View style={styles.bannerText}>
                    <Text style={[styles.unitLabel, !unit.levels.length && { color: colors.muted }]}>
                      UNIT {unitIndex + 1}
                    </Text>
                    <Text style={[styles.unitTitle, !unit.levels.length && { color: colors.muted }]}>
                      {unit.display_name}
                    </Text>
                  </View>
                  <Text style={[styles.unitCount, !unit.levels.length && { color: colors.muted }]}>
                    {unit.levels.length ? `${progress.done}/${progress.total}` : ''}
                  </Text>
                  <Ionicons
                    name="chevron-down"
                    size={22}
                    color={unit.levels.length ? '#FFFFFF' : colors.muted}
                    style={styles.chevron}
                  />
                </Pressable>

                {unit.levels.length === 0 ? (
                  <Text style={styles.soon}>Coming soon. This book hasn't been added yet.</Text>
                ) : (
                  unit.levels.map((level, i) => {
                    const status = statuses[level.chapter_id] ?? 'locked';
                    const p = levelProgress(state, lang, level);
                    return (
                      <View
                        key={level.chapter_id}
                        style={[styles.levelRow, { transform: [{ translateX: OFFSETS[i % OFFSETS.length] }] }]}
                        onLayout={status === 'current' ? (e) => scrollToCurrent(unit.order, e.nativeEvent.layout.y) : undefined}
                      >
                        <LevelCircle
                          number={level.chapter_number}
                          status={status}
                          available={p.available}
                          done={p.done}
                          color={color}
                          onPress={() => setSelected({ unit, level })}
                        />
                      </View>
                    );
                  })
                )}
              </View>
            );
          })}
        </ScrollView>
      )}

      <Modal visible={!!menuUnit} transparent animationType="fade" onRequestClose={() => setMenuUnit(null)}>
        <Pressable style={styles.backdrop} onPress={() => setMenuUnit(null)} accessibilityLabel="Close book list">
          <Pressable style={styles.menu} onPress={() => {}}>
            <Text style={styles.menuTitle}>Jump to a book</Text>
            <ScrollView>
              {units.map((unit, i) => {
                const empty = unit.levels.length === 0;
                const p = unitProgress(state, lang, unit);
                const isCurrent = menuUnit && menuUnit.order === unit.order;
                return (
                  <Pressable
                    key={unit.name}
                    onPress={() => jumpToUnit(unit)}
                    accessibilityRole="button"
                    style={[styles.menuItem, isCurrent && styles.menuItemOn]}
                  >
                    <View style={[styles.dot, { backgroundColor: empty ? colors.line : UNIT_COLORS[i % UNIT_COLORS.length] }]} />
                    <Text style={[styles.menuName, empty && { color: colors.muted }]} numberOfLines={1}>
                      {i + 1}. {unit.display_name}
                    </Text>
                    <Text style={styles.menuCount}>{empty ? 'Soon' : `${p.done}/${p.total}`}</Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>

      <StepSheet
        visible={!!selected}
        title={selected ? `${selected.unit.display_name} ${selected.level.chapter_number}` : ''}
        lang={lang}
        scene={selected ? sceneForChapter(selected.unit.name, selected.level.chapter_number) : null}
        color={sheetColor}
        available={sheetProgress.available}
        done={sheetProgress.done}
        isUnlocked={(step) => (selected ? isStepUnlocked(state, lang, selected.level, step) : false)}
        hearts={hearts}
        msToNextHeart={msToNextHeart}
        onOpenHearts={() => {
          setSelected(null);
          onOpenHearts();
        }}
        onClose={() => setSelected(null)}
        onStart={(step) => {
          const { unit, level } = selected;
          setSelected(null);
          onStartStep({ unit, level, step });
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.mist },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 14 },
  message: { fontSize: 16, color: colors.muted, textAlign: 'center' },
  retry: { paddingVertical: 10, paddingHorizontal: 22, borderRadius: radius.button, backgroundColor: colors.lapis },
  retryText: { color: '#FFFFFF', fontWeight: '700' },
  scroll: { paddingBottom: 80 },
  banner: {
    marginHorizontal: 16,
    marginTop: 24,
    marginBottom: 12,
    padding: 16,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  bannerText: { flex: 1 },
  unitLabel: { fontSize: 13, fontWeight: '800', letterSpacing: 1, color: 'rgba(255,255,255,0.8)' },
  unitTitle: { fontSize: 22, fontWeight: '800', color: '#FFFFFF' },
  unitCount: { fontSize: 16, fontWeight: '800', color: '#FFFFFF' },
  chevron: { marginLeft: 8 },
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', paddingHorizontal: 16, paddingTop: 90, paddingBottom: 40 },
  menu: {
    backgroundColor: colors.card,
    borderRadius: 16,
    paddingVertical: 8,
    maxHeight: '75%',
    width: '100%',
    maxWidth: 520,
    alignSelf: 'center',
  },
  menuTitle: { fontSize: 13, fontWeight: '800', letterSpacing: 1, color: colors.muted, paddingHorizontal: 18, paddingVertical: 10 },
  menuItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 13, paddingHorizontal: 18, gap: 12 },
  menuItemOn: { backgroundColor: colors.lapisTint },
  dot: { width: 14, height: 14, borderRadius: 7 },
  menuName: { flex: 1, fontSize: 17, fontWeight: '700', color: colors.ink },
  menuCount: { fontSize: 14, fontWeight: '700', color: colors.muted },
  levelRow: { alignItems: 'center', marginVertical: 6 },
  soon: { textAlign: 'center', color: colors.muted, padding: 20 },
});
