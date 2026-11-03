import { StyleSheet, View } from 'react-native';
import { SvgXml } from 'react-native-svg';
import { CHARACTERS } from '../art/characters';
import { colors, radius } from '../theme';

// One of the five helpers (paul, jesus, camel, lamb, fish) at the given size.
export default function Character({ name, size = 96 }) {
  const xml = CHARACTERS[name];
  if (!xml) return null;
  return <SvgXml xml={xml} width={size} height={size} />;
}

// A helper with a speech bubble beside it, the way lesson characters talk in Duolingo-style apps.
// children is what goes in the bubble.
export function Mascot({ name, size = 88, children }) {
  return (
    <View style={styles.row}>
      <Character name={name} size={size} />
      <View style={styles.bubbleWrap}>
        <View style={styles.tail} />
        <View style={styles.bubble}>{children}</View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-end', gap: 4 },
  bubbleWrap: { flex: 1, marginBottom: 18 },
  bubble: {
    padding: 14,
    gap: 6,
    borderRadius: radius.option + 4,
    borderWidth: 2,
    borderColor: colors.line,
    backgroundColor: colors.card,
  },
  // A small diamond poking out of the bubble's left edge, towards the character.
  tail: {
    position: 'absolute',
    left: -7,
    bottom: 18,
    width: 14,
    height: 14,
    backgroundColor: colors.card,
    borderLeftWidth: 2,
    borderBottomWidth: 2,
    borderColor: colors.line,
    transform: [{ rotate: '45deg' }],
    zIndex: 1,
  },
});
