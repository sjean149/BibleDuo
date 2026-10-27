import { useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme';
import { shareApp } from '../utils/share';

// Home and Profile are screens. Read is the books-and-chapters screen. Share is not a screen:
// it opens the phone's share sheet.
const ITEMS = [
  { key: 'home', label: 'Home', icon: 'home', iconOff: 'home-outline' },
  { key: 'read', label: 'Read', icon: 'book', iconOff: 'book-outline' },
  { key: 'share', label: 'Share', icon: 'share-social', iconOff: 'share-social-outline', isAction: true },
  { key: 'profile', label: 'Profile', icon: 'person', iconOff: 'person-outline' },
];

// The bar along the bottom. `active` is 'home' | 'read' | 'profile'.
export default function BottomNav({ active, onSelect }) {
  const insets = useSafeAreaInsets();
  const [note, setNote] = useState(null);
  const timer = useRef(null);

  const share = async () => {
    const outcome = await shareApp();
    if (outcome === 'copied' || outcome === 'failed') {
      setNote(outcome === 'copied' ? 'Copied. Paste it to share.' : "Couldn't open sharing on this device.");
      clearTimeout(timer.current);
      timer.current = setTimeout(() => setNote(null), 2500);
    }
  };

  return (
    <View>
      {note && (
        <View style={styles.noteWrap} pointerEvents="none">
          <Text style={styles.note}>{note}</Text>
        </View>
      )}
      <View style={[styles.bar, { paddingBottom: Math.max(insets?.bottom ?? 0, 8) }]}>
        {ITEMS.map((item) => {
          const on = !item.isAction && item.key === active;
          return (
            <Pressable
              key={item.key}
              onPress={item.isAction ? share : () => onSelect(item.key)}
              accessibilityRole="button"
              accessibilityLabel={item.label}
              accessibilityState={{ selected: on }}
              style={styles.item}
              hitSlop={4}
            >
              <View style={[styles.pill, on && styles.pillOn]}>
                <Ionicons name={on ? item.icon : item.iconOff} size={26} color={on ? colors.lapisDark : colors.muted} />
              </View>
              <Text style={[styles.label, on && styles.labelOn]}>{item.label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderTopWidth: 2,
    borderTopColor: colors.line,
    paddingTop: 6,
  },
  item: { flex: 1, alignItems: 'center', gap: 2 },
  pill: { paddingVertical: 4, paddingHorizontal: 18, borderRadius: 14 },
  pillOn: { backgroundColor: colors.lapisTint },
  label: { fontSize: 12, fontWeight: '700', color: colors.muted },
  labelOn: { color: colors.lapisDark },
  noteWrap: { position: 'absolute', bottom: '100%', left: 0, right: 0, alignItems: 'center', paddingBottom: 10 },
  note: {
    backgroundColor: colors.ink,
    color: '#FFFFFF',
    fontWeight: '700',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 999,
    overflow: 'hidden',
  },
});
