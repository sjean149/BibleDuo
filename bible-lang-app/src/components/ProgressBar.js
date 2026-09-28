import { View, StyleSheet } from 'react-native';
import { colors, radius } from '../theme';

export default function ProgressBar({ value, total }) {
  const pct = total > 0 ? Math.min(100, (value / total) * 100) : 0;
  return (
    <View style={styles.track} accessibilityRole="progressbar">
      <View style={[styles.fill, { width: `${pct}%` }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    flex: 1,
    height: 12,
    borderRadius: radius.bar,
    backgroundColor: colors.line,
    overflow: 'hidden',
  },
  fill: { height: '100%', backgroundColor: colors.lapis, borderRadius: radius.bar },
});
