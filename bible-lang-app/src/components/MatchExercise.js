import { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius } from '../theme';
import { normalizePair } from '../utils/pairs';
import { shuffle } from '../utils/shuffle';

// Two columns. Tap a word on the left, then its translation on the right.
// Right guesses lock green; wrong guesses flash red and count as a mistake.
// When every pair is matched the screen reports { mistakes } and the Check button unlocks.
export default function MatchExercise({ exercise, lang, locked, onChange }) {
  const pairs = useMemo(
    () => exercise.prompt.pairs.map((p, id) => ({ id, ...normalizePair(p, lang) })),
    [exercise, lang]
  );
  // The left column keeps the original order; only the right column is shuffled.
  const rightColumn = useMemo(() => shuffle(pairs), [pairs]);

  const [selected, setSelected] = useState(null); // id picked on the left
  const [matched, setMatched] = useState([]); // ids already matched
  const [wrong, setWrong] = useState(null); // { left, right } while a red flash is showing
  const [mistakes, setMistakes] = useState(0);
  const timer = useRef(null);

  useEffect(() => () => clearTimeout(timer.current), []);

  const pickLeft = (id) => {
    if (locked || wrong || matched.includes(id)) return;
    setSelected(id);
  };

  const pickRight = (id) => {
    if (locked || wrong || selected === null || matched.includes(id)) return;

    if (id === selected) {
      const next = [...matched, id];
      setMatched(next);
      setSelected(null);
      if (next.length === pairs.length) onChange({ mistakes });
    } else {
      setMistakes((m) => m + 1);
      setWrong({ left: selected, right: id });
      timer.current = setTimeout(() => {
        setWrong(null);
        setSelected(null);
      }, 600);
    }
  };

  const stateOf = (side, id) => {
    if (matched.includes(id)) return 'matched';
    if (wrong && wrong[side] === id) return 'wrong';
    if (side === 'left' && selected === id) return 'selected';
    return 'idle';
  };

  return (
    <View style={styles.wrap}>
      <Text style={styles.instruction}>
        {exercise.prompt.instruction ?? 'Match each word to its translation'}
      </Text>
      <View style={styles.columns}>
        <View style={styles.column}>
          {pairs.map((p) => (
            <Tile
              key={`l${p.id}`}
              label={p.target}
              state={stateOf('left', p.id)}
              onPress={() => pickLeft(p.id)}
            />
          ))}
        </View>
        <View style={styles.column}>
          {rightColumn.map((p) => (
            <Tile
              key={`r${p.id}`}
              label={p.native}
              state={stateOf('right', p.id)}
              onPress={() => pickRight(p.id)}
            />
          ))}
        </View>
      </View>
    </View>
  );
}

function Tile({ label, state, onPress }) {
  return (
    <Pressable
      onPress={onPress}
      disabled={state === 'matched'}
      accessibilityRole="button"
      style={[styles.tile, tileStyles[state]]}
    >
      <Text style={[styles.tileText, state === 'matched' && { color: colors.leaf }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 16 },
  instruction: { fontSize: 15, color: colors.muted },
  columns: { flexDirection: 'row', gap: 12 },
  column: { flex: 1, gap: 10 },
  tile: {
    minHeight: 56,
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: radius.option,
    borderWidth: 2,
  },
  tileText: { fontSize: 17, fontWeight: '600', color: colors.ink, textAlign: 'center' },
});

const tileStyles = StyleSheet.create({
  idle: { borderColor: colors.line, backgroundColor: colors.card },
  selected: { borderColor: colors.lapis, backgroundColor: colors.lapisTint },
  matched: { borderColor: colors.leaf, backgroundColor: colors.leafTint, opacity: 0.7 },
  wrong: { borderColor: colors.madder, backgroundColor: colors.madderTint },
});
