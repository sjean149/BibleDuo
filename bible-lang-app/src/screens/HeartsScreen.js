import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { APP_NAME } from '../appInfo';
import { colors, radius } from '../theme';
import { formatCountdown } from '../progress/logic';
import { useProgress } from '../progress/ProgressContext';
import { HEART_REFILL_MINUTES, MAX_HEARTS } from '../progress/rules';

const PERKS = [
  'Unlimited hearts, so a wrong answer never stops a lesson',
  'Every lesson and every book, with no waiting',
  'Supports the work of keeping the app free to read',
];

// Opened by tapping the hearts. Shows how hearts work and offers the unlimited plan.
// The payment button is a placeholder: no money is taken. When PayPal is connected, the
// button below is the one place to change (see onGetUnlimited).
export default function HeartsScreen({ onExit, onRead }) {
  const { hearts, premium, msToNextHeart, setPremium } = useProgress();
  const [notice, setNotice] = useState(null);
  const testing = typeof __DEV__ !== 'undefined' && __DEV__;

  const onGetUnlimited = () => {
    // Later: start the PayPal checkout here, and only call setPremium(true) after the
    // backend has confirmed the payment.
    setNotice("Payments aren't connected yet. Unlimited will be available soon.");
  };

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Pressable onPress={onExit} hitSlop={12} accessibilityRole="button" accessibilityLabel="Back">
          <Ionicons name="chevron-back" size={28} color={colors.ink} />
        </Pressable>
        <Text style={styles.headerTitle}>Hearts</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.hero}>
          <Ionicons name="heart" size={64} color={hearts > 0 || premium ? colors.madder : colors.line} />
          <Text style={styles.count}>{premium ? 'Unlimited' : `${hearts} of ${MAX_HEARTS}`}</Text>
          <Text style={styles.heroSub}>
            {premium
              ? 'You have unlimited hearts.'
              : hearts >= MAX_HEARTS
                ? 'Your hearts are full.'
                : msToNextHeart !== null
                  ? `Next heart in ${formatCountdown(msToNextHeart)}`
                  : ''}
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>How hearts work</Text>
          <Text style={styles.body}>
            A wrong answer in a lesson costs one heart. A heart comes back every {HEART_REFILL_MINUTES} minutes.
            Reading and listening to a chapter never costs hearts, even at zero.
          </Text>
          <Pressable onPress={onRead} style={styles.secondary} accessibilityRole="button">
            <Ionicons name="book" size={18} color={colors.lapisDark} />
            <Text style={styles.secondaryText}>Read a chapter now</Text>
          </Pressable>
        </View>

        <View style={[styles.card, styles.plan]}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{premium ? 'YOUR PLAN' : 'UNLIMITED'}</Text>
          </View>
          <Text style={styles.cardTitle}>{APP_NAME} Unlimited</Text>
          {PERKS.map((perk) => (
            <View key={perk} style={styles.perk}>
              <Ionicons name="checkmark-circle" size={20} color={colors.leaf} />
              <Text style={styles.perkText}>{perk}</Text>
            </View>
          ))}
          {!premium && (
            <Pressable onPress={onGetUnlimited} style={styles.buy} accessibilityRole="button" accessibilityLabel="Get unlimited">
              <Text style={styles.buyText}>Get unlimited</Text>
            </Pressable>
          )}
          {notice && !premium && <Text style={styles.notice}>{notice}</Text>}
        </View>

        {testing && (
          <Pressable onPress={() => setPremium(!premium)} style={styles.dev} accessibilityRole="button">
            <Text style={styles.devText}>Testing only: turn unlimited {premium ? 'off' : 'on'}</Text>
          </Pressable>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.mist },
  header: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingVertical: 12 },
  headerTitle: { fontSize: 22, fontWeight: '800', color: colors.ink },
  content: { padding: 16, paddingBottom: 32, gap: 16 },
  hero: { alignItems: 'center', gap: 6, paddingVertical: 10 },
  count: { fontSize: 32, fontWeight: '800', color: colors.ink },
  heroSub: { fontSize: 16, color: colors.muted },
  card: { backgroundColor: colors.card, borderRadius: 18, borderWidth: 2, borderColor: colors.line, padding: 18, gap: 10 },
  plan: { borderColor: colors.lapis },
  cardTitle: { fontSize: 20, fontWeight: '800', color: colors.ink },
  body: { fontSize: 16, lineHeight: 23, color: colors.ink },
  secondary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: radius.button,
    borderWidth: 2,
    borderColor: colors.lapis,
  },
  secondaryText: { fontSize: 16, fontWeight: '700', color: colors.lapisDark },
  badge: { alignSelf: 'flex-start', backgroundColor: colors.lapisTint, paddingVertical: 4, paddingHorizontal: 10, borderRadius: 999 },
  badgeText: { fontSize: 12, fontWeight: '800', letterSpacing: 1, color: colors.lapisDark },
  perk: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  perkText: { flex: 1, fontSize: 16, lineHeight: 22, color: colors.ink },
  buy: { marginTop: 6, paddingVertical: 15, borderRadius: radius.button, backgroundColor: colors.lapis, alignItems: 'center' },
  buyText: { color: '#FFFFFF', fontSize: 17, fontWeight: '800' },
  notice: { fontSize: 14, lineHeight: 20, color: colors.muted, textAlign: 'center' },
  dev: { padding: 12, alignItems: 'center' },
  devText: { color: colors.muted, textDecorationLine: 'underline' },
});
