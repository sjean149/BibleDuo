import { StyleSheet, View } from 'react-native';

// Flags drawn from plain coloured boxes. (Flag emoji don't show on Windows browsers, so these
// look the same everywhere.) The US flag is simplified: stripes and a blue corner, no stars.
const FRANCE = ['#0055A4', '#FFFFFF', '#EF4135'];
const SPAIN = [
  { color: '#AA151B', flex: 1 },
  { color: '#F1BF00', flex: 2 },
  { color: '#AA151B', flex: 1 },
];

export default function Flag({ lang, height = 24 }) {
  const width = Math.round(height * 1.5);
  return (
    <View style={[styles.frame, { width, height }]} accessibilityElementsHidden importantForAccessibility="no">
      {lang === 'fr' && (
        <View style={styles.row}>
          {FRANCE.map((c) => (
            <View key={c} style={{ flex: 1, backgroundColor: c }} />
          ))}
        </View>
      )}
      {lang === 'es' && (
        <View style={styles.column}>
          {SPAIN.map((s, i) => (
            <View key={i} style={{ flex: s.flex, backgroundColor: s.color }} />
          ))}
        </View>
      )}
      {lang === 'en' && (
        <View style={styles.column}>
          {Array.from({ length: 7 }, (_, i) => (
            <View key={i} style={{ flex: 1, backgroundColor: i % 2 === 0 ? '#B22234' : '#FFFFFF' }} />
          ))}
          <View style={[styles.canton, { width: width * 0.45, height: height * (4 / 7) }]} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    borderRadius: 4,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.15)',
  },
  row: { flex: 1, flexDirection: 'row' },
  column: { flex: 1 },
  canton: { position: 'absolute', top: 0, left: 0, backgroundColor: '#3C3B6E' },
});
