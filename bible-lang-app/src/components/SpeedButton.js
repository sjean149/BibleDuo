import { Pressable, StyleSheet, Text } from 'react-native';
import { colors } from '../theme';
import { nextSpeed } from '../progress/logic';
import { useProgress } from '../progress/ProgressContext';

// 0.75 -> "0.75×". Shows the listening speed; each tap moves to the next one (0.5× ... 1.5×).
export const speedLabel = (speed) => `${speed}×`;

export default function SpeedButton({ style }) {
  const { speed, setSpeed } = useProgress();
  return (
    <Pressable
      onPress={() => setSpeed(nextSpeed(speed))}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel={`Listening speed ${speed} times. Tap to change`}
      style={({ pressed }) => [styles.button, pressed && { opacity: 0.8 }, style]}
    >
      <Text style={styles.label}>{speedLabel(speed)}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minWidth: 52,
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: colors.lapis,
    backgroundColor: colors.card,
  },
  label: { fontWeight: '800', color: colors.lapisDark, fontVariant: ['tabular-nums'] },
});
