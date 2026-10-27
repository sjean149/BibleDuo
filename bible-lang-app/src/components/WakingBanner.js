import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { onServerWaking } from '../api';
import { colors } from '../theme';

// Shown across the top while a request is waiting for the free-plan server to wake up, so the
// first visitor in a while sees what's happening instead of a frozen screen or an error.
export default function WakingBanner() {
  const [waking, setWaking] = useState(false);
  const insets = useSafeAreaInsets();

  useEffect(() => onServerWaking(setWaking), []);

  if (!waking) return null;
  return (
    <View
      pointerEvents="none"
      style={[styles.banner, { paddingTop: insets.top + 10 }]}
      accessibilityRole="alert"
      accessibilityLiveRegion="polite"
    >
      <ActivityIndicator color="#FFFFFF" />
      <View style={styles.texts}>
        <Text style={styles.title}>Waking up the server…</Text>
        <Text style={styles.body}>It sleeps when nobody's using it. This can take up to a minute.</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: colors.lapisDark,
  },
  texts: { flex: 1 },
  title: { color: '#FFFFFF', fontWeight: '800', fontSize: 15 },
  body: { color: '#E4EAFA', fontSize: 13, marginTop: 2 },
});
