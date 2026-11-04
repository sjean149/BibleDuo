import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { APP_NAME } from '../appInfo';
import { colors, radius } from '../theme';
import { longestStreak } from '../progress/logic';
import { useProgress } from '../progress/ProgressContext';
import { GOOGLE_UNAVAILABLE_REASON, useAuth } from '../auth/AuthContext';
import Flag from '../components/Flag';
import LanguagePicker from '../components/LanguagePicker';
import SpeedButton from '../components/SpeedButton';

const LANGUAGE_NAMES = { fr: 'French', es: 'Spanish', en: 'English' };

function Stat({ icon, color, value, label }) {
  return (
    <View style={styles.stat}>
      <Ionicons name={icon} size={24} color={color} />
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

// The profile page: Google sign-in, the learner's progress and the settings. Progress is still
// saved on this device only; signing in does not sync it yet.
export default function ProfileScreen({ onOpenStreak, onOpenHearts }) {
  const { state, lang, streak, days, premium, hearts, resetProgress } = useProgress();
  const { user, ready, busy, error: authError, signIn, signOut } = useAuth();
  const [picking, setPicking] = useState(false);
  const [confirming, setConfirming] = useState(false);

  // Steps finished in the current language (each chapter has up to three).
  const steps = Object.entries(state.steps)
    .filter(([key]) => key.startsWith(`${lang}:`))
    .reduce((sum, [, list]) => sum + list.length, 0);

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.top}>
          <View style={styles.avatar}>
            <Ionicons name="person" size={44} color={colors.lapisDark} />
          </View>
          <Text style={styles.name}>{user ? user.display_name || user.email : 'Guest'}</Text>
          <Text style={styles.sub}>{user ? user.email : 'Your progress is saved on this device.'}</Text>
        </View>

        {user ? (
          <Pressable onPress={signOut} style={styles.row} accessibilityRole="button" accessibilityLabel="Sign out">
            <Ionicons name="log-out-outline" size={22} color={colors.muted} />
            <Text style={[styles.rowText, styles.rowBody]}>Sign out</Text>
          </Pressable>
        ) : (
          <Pressable
            onPress={signIn}
            disabled={!ready || busy}
            style={[styles.row, (!ready || busy) && styles.rowOff]}
            accessibilityRole="button"
            accessibilityLabel="Sign in with Google"
          >
            <Ionicons name="logo-google" size={22} color={ready ? colors.lapis : colors.muted} />
            <View style={styles.rowBody}>
              <Text style={styles.rowText}>{busy ? 'Signing in…' : 'Sign in with Google'}</Text>
              {authError ? <Text style={[styles.rowSub, { color: colors.madder }]}>{authError}</Text> : null}
              {GOOGLE_UNAVAILABLE_REASON ? <Text style={styles.rowSub}>{GOOGLE_UNAVAILABLE_REASON}</Text> : null}
            </View>
          </Pressable>
        )}

        <View style={styles.stats}>
          <Stat icon="flame" color="#FF9600" value={streak} label="Day streak" />
          <Stat icon="trophy" color={colors.lapis} value={longestStreak(days)} label="Best streak" />
          <Stat icon="calendar" color={colors.leaf} value={days.length} label="Days practiced" />
          <Stat icon="checkmark-done" color={colors.leaf} value={steps} label="Steps finished" />
        </View>

        <Pressable onPress={() => setPicking(true)} style={styles.row} accessibilityRole="button" accessibilityLabel="Change language">
          <Flag lang={lang} />
          <View style={styles.rowBody}>
            <Text style={styles.rowText}>Learning {LANGUAGE_NAMES[lang]}</Text>
            <Text style={styles.rowSub}>Tap to change</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.muted} />
        </Pressable>

        <View style={styles.row}>
          <Ionicons name="speedometer" size={24} color={colors.lapis} />
          <View style={styles.rowBody}>
            <Text style={styles.rowText}>Listening speed</Text>
            <Text style={styles.rowSub}>Recordings and read-aloud. Tap to change</Text>
          </View>
          <SpeedButton />
        </View>

        <Pressable onPress={onOpenHearts} style={styles.row} accessibilityRole="button" accessibilityLabel="Hearts and plan">
          <Ionicons name="heart" size={26} color={colors.madder} />
          <View style={styles.rowBody}>
            <Text style={styles.rowText}>{premium ? `${APP_NAME} Unlimited` : 'Free plan'}</Text>
            <Text style={styles.rowSub}>{premium ? 'Unlimited hearts' : `${hearts} hearts. Tap for unlimited`}</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.muted} />
        </Pressable>

        <Pressable onPress={onOpenStreak} style={styles.row} accessibilityRole="button" accessibilityLabel="Streak calendar">
          <Ionicons name="calendar" size={24} color={colors.lapis} />
          <Text style={[styles.rowText, styles.rowBody]}>Streak calendar</Text>
          <Ionicons name="chevron-forward" size={20} color={colors.muted} />
        </Pressable>

        <Pressable
          onPress={() => {
            if (confirming) {
              resetProgress();
              setConfirming(false);
            } else {
              setConfirming(true);
            }
          }}
          style={[styles.row, confirming && styles.rowDanger]}
          accessibilityRole="button"
          accessibilityLabel="Reset progress"
        >
          <Ionicons name="refresh" size={24} color={colors.madder} />
          <View style={styles.rowBody}>
            <Text style={[styles.rowText, { color: colors.madder }]}>{confirming ? 'Tap again to erase all progress' : 'Reset progress'}</Text>
            {confirming && <Text style={styles.rowSub}>Clears chapters, streak and hearts on this device.</Text>}
          </View>
          {confirming && (
            <Pressable onPress={() => setConfirming(false)} hitSlop={8} accessibilityRole="button" accessibilityLabel="Cancel reset">
              <Text style={styles.cancel}>Cancel</Text>
            </Pressable>
          )}
        </Pressable>
      </ScrollView>

      <LanguagePicker visible={picking} onClose={() => setPicking(false)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.mist },
  content: { padding: 16, paddingBottom: 32, gap: 12 },
  top: { alignItems: 'center', gap: 6, paddingVertical: 12 },
  avatar: { width: 92, height: 92, borderRadius: 46, backgroundColor: colors.lapisTint, alignItems: 'center', justifyContent: 'center' },
  name: { fontSize: 24, fontWeight: '800', color: colors.ink },
  sub: { fontSize: 15, color: colors.muted },
  stats: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  stat: {
    flexBasis: '47%',
    flexGrow: 1,
    backgroundColor: colors.card,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: colors.line,
    padding: 14,
    gap: 2,
  },
  statValue: { fontSize: 26, fontWeight: '800', color: colors.ink },
  statLabel: { fontSize: 14, color: colors.muted },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: colors.card,
    borderRadius: radius.option,
    borderWidth: 2,
    borderColor: colors.line,
    padding: 14,
  },
  rowOff: { opacity: 0.6 },
  rowDanger: { borderColor: colors.madder, backgroundColor: colors.madderTint },
  rowBody: { flex: 1, gap: 2 },
  rowText: { fontSize: 17, fontWeight: '700', color: colors.ink },
  rowSub: { fontSize: 14, color: colors.muted },
  cancel: { fontSize: 15, fontWeight: '700', color: colors.ink },
});
