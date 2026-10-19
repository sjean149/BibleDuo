import { Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme';
import { STEPS } from '../progress/rules';
import { arcPath, ringSegments } from '../utils/ring';

const SIZE = 92;
const CENTER = SIZE / 2;
const RING_RADIUS = 41;
const STROKE = 8;
const SEGMENTS = ringSegments(3, 24); // one arc per step: vocab, lesson, reading

// One chapter on the path: a button wrapped in a ring of three arcs.
// An arc lights up in the unit's colour when its step is finished.
export default function LevelCircle({ number, status, available, done, color, onPress }) {
  const locked = status === 'locked';
  const finished = status === 'done';
  const centerColor = locked ? colors.line : finished ? colors.leaf : color;

  return (
    <View style={styles.wrap}>
      {status === 'current' && (
        <View style={[styles.startTag, { borderColor: color }]}>
          <Text style={[styles.startText, { color }]}>START</Text>
        </View>
      )}
      <Pressable
        onPress={onPress}
        disabled={locked}
        accessibilityRole="button"
        accessibilityLabel={`Chapter ${number}, ${locked ? 'locked' : finished ? 'completed' : 'open'}`}
        style={({ pressed }) => [styles.pressable, pressed && { transform: [{ scale: 0.96 }] }]}
      >
        <Svg width={SIZE} height={SIZE}>
          {STEPS.map((step, i) => {
            const isDone = done.includes(step);
            const exists = available.includes(step);
            return (
              <Path
                key={step}
                d={arcPath(CENTER, CENTER, RING_RADIUS, SEGMENTS[i].start, SEGMENTS[i].end)}
                stroke={isDone ? (finished ? colors.leaf : color) : colors.line}
                strokeOpacity={exists || isDone ? 1 : 0.35}
                strokeWidth={STROKE}
                strokeLinecap="round"
                fill="none"
              />
            );
          })}
        </Svg>
        <View style={[styles.center, { backgroundColor: centerColor }]}>
          {locked ? (
            <Ionicons name="lock-closed" size={24} color={colors.muted} />
          ) : finished ? (
            <Ionicons name="checkmark" size={32} color="#FFFFFF" />
          ) : (
            <Text style={styles.number}>{number}</Text>
          )}
        </View>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', height: SIZE + 14, justifyContent: 'flex-end' },
  pressable: { width: SIZE, height: SIZE, alignItems: 'center', justifyContent: 'center' },
  center: {
    position: 'absolute',
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  number: { fontSize: 24, fontWeight: '800', color: '#FFFFFF' },
  startTag: {
    position: 'absolute',
    top: -6,
    zIndex: 2,
    backgroundColor: colors.card,
    borderWidth: 2,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  startText: { fontSize: 12, fontWeight: '800', letterSpacing: 0.5 },
});
