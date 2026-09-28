import { Text, View, StyleSheet } from 'react-native';
import { colors } from '../../theme';

const LABELS = {
  match: 'Matching pairs',
  speak: 'Speaking practice',
  true_false: 'True or false',
};

export default function UnsupportedExercise({ exercise }) {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>{LABELS[exercise.type] || exercise.type}</Text>
      <Text style={styles.body}>This exercise type isn't built yet. Skip to keep going.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 20,
    borderRadius: 12,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: colors.line,
  },
  title: { fontSize: 20, fontWeight: '600', color: colors.ink, marginBottom: 6 },
  body: { fontSize: 16, color: colors.muted },
});
