import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius } from '../theme';
import { STEPS } from '../progress/rules';
import { formatCountdown } from '../progress/logic';

const STEP_INFO = {
  vocab: { icon: 'school', title: 'Key words', blurb: 'Learn the most useful words in this chapter' },
  lesson: { icon: 'star', title: 'Practice the verses', blurb: 'Translate, fill in, reorder and speak' },
  reading: { icon: 'book', title: 'Read and listen', blurb: 'Read the chapter, hear it, tap any phrase to translate' },
};
const NEEDS_HEARTS = ['vocab', 'lesson']; // reading never costs hearts

// The panel that slides up when a level is tapped: its three steps, in order.
export default function StepSheet({
  visible,
  title,
  color,
  available,
  done,
  isUnlocked, // (step) => boolean
  hearts,
  msToNextHeart,
  onStart, // (step) => void
  onClose,
}) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel="Close">
        {/* The inner Pressable swallows taps so touching the panel doesn't close it. */}
        <Pressable style={styles.sheet} onPress={() => {}}>
          <View style={styles.handle} />
          <Text style={styles.title}>{title}</Text>

          {STEPS.map((step, i) => {
            const info = STEP_INFO[step];
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
  go: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 10 },
  goText: { color: '#FFFFFF', fontWeight: '800', fontSize: 13, letterSpacing: 0.5 },
});
