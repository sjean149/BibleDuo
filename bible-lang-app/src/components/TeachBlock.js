import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { speak } from './SpeakerButton';
import { Mascot } from './Character';
import { colors, fonts, radius } from '../theme';

const KIND_LABEL = {
  rule: 'NEW RULE',
  example: 'IN THIS CHAPTER',
};

// Which helper explains each kind of teaching (see docs/CHARACTERS.md).
const HELPER = {
  rule: 'paul', // the letter writer teaches the rules
  example: 'fish', // spots the rule in this chapter
};

// The teaching shown above a grammar question, on the same screen (exercise.prompt.teach):
//   { kind: 'rule' | 'example' | 'tip', title, body, examples: [{ target, native }], label?,
//     rule_title?, verse?: { text, translation, ref, highlight: [start, end] } }
// A 'tip' is a one-line reminder of the rule; the others have a helper with a speech bubble.
export default function TeachBlock({ teach, lang }) {
  const { kind = 'rule', title, body, examples = [], verse, rule_title } = teach;

  if (kind === 'tip') {
    return (
      <View style={styles.tip} accessibilityLabel={`Rule: ${title}. ${body}`}>
        <Ionicons name="bulb" size={18} color={colors.lapisDark} />
        <Text style={styles.tipText}>
          <Text style={styles.tipTitle}>{title}: </Text>
          {body}
        </Text>
      </View>
    );
  }

  const label = teach.label ?? KIND_LABEL[kind] ?? 'LEARN'; // lessons in the learner's language bring their own
  return (
    <View style={styles.wrap}>
      <Text style={styles.kind}>
        {label}
        {rule_title && rule_title !== title ? <Text style={styles.ruleTitle}>{`  ·  ${rule_title}`}</Text> : null}
      </Text>
      {/* "In this chapter" would only repeat the label. */}
      {title && title.toUpperCase() !== label ? <Text style={styles.title}>{title}</Text> : null}

      {body ? (
        <Mascot name={HELPER[kind] ?? 'paul'} size={64}>
          <Text style={styles.body}>{body}</Text>
        </Mascot>
      ) : null}

      {examples.length > 0 && (
        <View style={styles.examples}>
          {examples.map((ex) => (
            <Pressable
              key={ex.target}
              onPress={() => speak(ex.target, lang)}
              accessibilityRole="button"
              accessibilityLabel={`${ex.target}, ${ex.native}. Tap to hear it`}
              style={({ pressed }) => [styles.example, pressed && { opacity: 0.8 }]}
            >
              <Text style={styles.exampleTarget}>{ex.target}</Text>
              {/* English lessons have no translation to show under their examples. */}
              {ex.native ? <Text style={styles.exampleNative}>{ex.native}</Text> : null}
            </Pressable>
          ))}
        </View>
      )}

      {verse ? <VerseBlock verse={verse} lang={lang} /> : null}
    </View>
  );
}

// A verse from the chapter with the word being taught highlighted.
function VerseBlock({ verse, lang }) {
  const [start, end] = verse.highlight ?? [0, 0];
  return (
    <Pressable
      onPress={() => speak(verse.text, lang)}
      accessibilityRole="button"
      accessibilityLabel={`${verse.ref}. Tap to hear the verse`}
      style={({ pressed }) => [styles.verse, pressed && { opacity: 0.85 }]}
    >
      <Text style={styles.verseText}>
        {verse.text.slice(0, start)}
        <Text style={styles.highlight}>{verse.text.slice(start, end)}</Text>
        {verse.text.slice(end)}
      </Text>
      {verse.translation ? <Text style={styles.translation}>{verse.translation}</Text> : null}
      <View style={styles.verseFooter}>
        <Text style={styles.ref}>{verse.ref}</Text>
        <Ionicons name="volume-medium" size={18} color={colors.lapis} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 10,
    paddingBottom: 18,
    marginBottom: 18,
    borderBottomWidth: 2,
    borderBottomColor: colors.line,
  },
  kind: { fontSize: 12, fontWeight: '800', letterSpacing: 1, color: colors.lapis },
  ruleTitle: { fontWeight: '600', letterSpacing: 0, color: colors.muted },
  title: { fontSize: 21, fontWeight: '800', color: colors.ink },
  body: { fontSize: 15, lineHeight: 21, color: colors.ink },
  examples: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  example: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: radius.option,
    backgroundColor: colors.card,
    borderWidth: 2,
    borderColor: colors.line,
  },
  exampleTarget: { fontFamily: fonts.scripture, fontSize: 16, color: colors.ink },
  exampleNative: { fontSize: 12, color: colors.muted },
  verse: {
    gap: 6,
    padding: 12,
    borderRadius: radius.option,
    backgroundColor: colors.card,
    borderLeftWidth: 4,
    borderLeftColor: colors.lapis,
  },
  verseText: { fontFamily: fonts.scripture, fontSize: 17, lineHeight: 25, color: colors.ink },
  highlight: { backgroundColor: colors.lapisTint, color: colors.lapisDark, fontWeight: '700' },
  translation: { fontSize: 14, lineHeight: 20, color: colors.muted, fontStyle: 'italic' },
  verseFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  ref: { fontSize: 12, fontWeight: '700', color: colors.muted },
  tip: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    padding: 10,
    marginBottom: 18,
    borderRadius: radius.option,
    backgroundColor: colors.lapisTint,
  },
  tipText: { flex: 1, fontSize: 14, lineHeight: 20, color: colors.lapisDark },
  tipTitle: { fontWeight: '800' },
});
