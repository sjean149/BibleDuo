import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius } from '../theme';
import { STEPS } from '../progress/rules';
import { formatCountdown } from '../progress/logic';
import { SCENE_NAMES } from '../art/scenes';
import { SceneBanner } from './SceneBackground';

const STEP_INFO = {
  vocab: { icon: 'school', title: 'Key words', blurb: 'Learn the most useful words in this chapter' },
  reading: { icon: 'book', title: 'Read and listen', blurb: 'Read the chapter, hear it, tap any phrase to translate' },
  lesson: { icon: 'star', title: 'Practice the verses', blurb: 'Translate, fill in, reorder and speak' },
};
// Languages whose lesson step teaches a grammar rule (the others are still verse practice).
const GRAMMAR_INFO = {
  icon: 'star',
  title: 'Grammar lesson',
  blurb: 'Optional: learn a rule, then use it in the verses you just read',
};
const GRAMMAR_LANGS = ['es', 'fr', 'en'];
const NEEDS_HEARTS = ['vocab', 'lesson']; // reading never costs hearts

// The panel that slides up when a level is tapped: its three steps, in order.
export default function StepSheet({
  visible,
  title,
  lang,
  scene, // the chapter's setting, shown as a banner (src/art/scenes.js)
  color,
  available,
  done,
  isUnlocked, // (step) => boolean
  hearts,
  msToNextHeart,
  onStart, // (step) => void
  onOpenHearts, // () => void: the hearts / unlimited page
  onClose,
}) {
  const outOfHearts = hearts <= 0 && available.some((s) => NEEDS_HEARTS.includes(s));
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel="Close">
        {/* The inner Pressable swallows taps so touching the panel doesn't close it. */}
        <Pressable style={styles.sheet} onPress={() => {}}>
          <View style={styles.handle} />
          {scene ? (
            <View style={styles.banner}>
              <SceneBanner scene={scene} height={96} />
              <Text style={styles.bannerLabel}>{SCENE_NAMES[scene]}</Text>
            </View>
          ) : null}
          <Text style={styles.title}>{title}</Text>

          {STEPS.map((step, i) => {
            const info = step === 'lesson' && GRAMMAR_LANGS.includes(lang) ? GRAMMAR_INFO : STEP_INFO[step];
            const exists = available.includes(step);
            const finished = done.includes(step);
            const open = exists && isUnlocked(step);
            const noHearts = NEEDS_HEARTS.includes(step) && hearts <= 0;
            const canStart = open && !noHearts;

            let note = info.blurb;
            if (!exists) note = 'Coming soon';
            else if (!open) note = 'Finish the step before this one first';
            else if (noHearts) {
              note = msToNextHeart !== null ? `Out of hearts. Next one in ${formatCountdown(msToNextHeart)}` : 'Out of hearts';
            }

            return (
              <Pressable
                key={step}
                disabled={!canStart}
                onPress={() => onStart(step)}
                accessibilityRole="button"
                accessibilityLabel={`${info.title}. ${finished ? 'Completed. ' : ''}${note}`}
                style={({ pressed }) => [styles.row, !canStart && !finished && styles.rowDisabled, pressed && { opacity: 0.85 }]}
              >
                <View style={[styles.icon, { backgroundColor: finished ? colors.leaf : canStart ? color : colors.line }]}>
                  <Ionicons
                    name={finished ? 'checkmark' : open ? info.icon : 'lock-closed'}
                    size={22}
                    color={canStart || finished ? '#FFFFFF' : colors.muted}
                  />
                </View>
                <View style={styles.text}>
                  <Text style={styles.stepTitle}>
                    {i + 1}. {info.title}
                  </Text>
                  <Text style={styles.note}>{note}</Text>
                </View>
                {canStart && (
                  <View style={[styles.go, { backgroundColor: color }]}>
                    <Text style={styles.goText}>{finished ? 'REDO' : 'START'}</Text>
                  </View>
                )}
              </Pressable>
            );
          })}

          {outOfHearts && (
            <Pressable
              onPress={onOpenHearts}
              accessibilityRole="button"
              accessibilityLabel="Out of hearts. See your options"
              style={styles.hearts}
            >
              <Ionicons name="heart-dislike" size={20} color={colors.madder} />
              <Text style={styles.heartsText}>Out of hearts. Reading is still free, or see your options.</Text>
              <Ionicons name="chevron-forward" size={18} color={colors.madder} />
            </Pressable>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: colors.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 32,
    gap: 12,
  },
  handle: { alignSelf: 'center', width: 44, height: 5, borderRadius: 3, backgroundColor: colors.line },
  banner: { borderRadius: 16, overflow: 'hidden' },
  bannerLabel: {
    position: 'absolute',
    left: 10,
    bottom: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.85)',
    fontSize: 12,
    fontWeight: '800',
    color: colors.ink,
  },
  title: { fontSize: 22, fontWeight: '800', color: colors.ink, marginBottom: 4 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 14,
    borderRadius: radius.option,
    borderWidth: 2,
    borderColor: colors.line,
    backgroundColor: colors.card,
  },
  rowDisabled: { opacity: 0.6 },
  icon: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  text: { flex: 1, gap: 2 },
  stepTitle: { fontSize: 17, fontWeight: '700', color: colors.ink },
  note: { fontSize: 14, lineHeight: 19, color: colors.muted },
  hearts: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderRadius: radius.option,
    backgroundColor: colors.madderTint,
  },
  heartsText: { flex: 1, fontSize: 14, lineHeight: 19, fontWeight: '600', color: colors.madder },
  go: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 10 },
  goText: { color: '#FFFFFF', fontWeight: '800', fontSize: 13, letterSpacing: 0.5 },
});
