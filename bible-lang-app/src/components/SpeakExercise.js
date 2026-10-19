import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius } from '../theme';
import { SPEAK_PASS_SCORE, similarity } from '../utils/similarity';
import { canRecognize, listenOnce, speakText, stopSpeaking } from '../utils/speech';

// Say a sentence aloud.
//  - Web build in Chrome/Edge/Safari: the browser listens and we compare what it heard.
//  - Phones (and any browser without recognition): the learner rates themselves honestly.
export default function SpeakExercise({ exercise, lang, locked, onChange }) {
  const text = exercise.prompt.text ?? exercise.answer.value;
  const { instruction, hint } = exercise.prompt;

  const [listening, setListening] = useState(false);
  const [heard, setHeard] = useState(null);
  const [message, setMessage] = useState(null);
  const [rating, setRating] = useState(null); // 'said' | 'couldnt'
  const [fallback, setFallback] = useState(false); // mic blocked or recognition failed
  const stop = useRef(null);

  const autoCheck = canRecognize() && !fallback;

  // Stop any audio or microphone use when the learner moves on.
  useEffect(
    () => () => {
      stop.current?.();
      stopSpeaking();
    },
    []
  );

  const startListening = () => {
    if (locked || listening) return;
    stopSpeaking();
    setMessage(null);
    setListening(true);
    stop.current = listenOnce(lang, {
      onResult: (alternatives) => {
        // Use whichever alternative the browser offered that is closest to the sentence.
        const best = alternatives.reduce(
          (a, b) => (similarity(b, text) > similarity(a, text) ? b : a),
          alternatives[0]
        );
        const score = similarity(best, text);
        setHeard(best);
        onChange({ correct: score >= SPEAK_PASS_SCORE, heard: best, score });
      },
      onError: (code) => {
        if (code === 'not-allowed' || code === 'service-not-allowed') {
          setMessage('Microphone access is blocked. You can rate yourself instead.');
          setFallback(true);
        } else if (code === 'no-speech') {
          setMessage("I didn't hear anything. Tap the microphone and try again.");
        } else {
          setMessage('Speech recognition failed. Try again, or rate yourself.');
        }
      },
      onEnd: () => setListening(false),
    });
  };

  const rate = (value) => {
    if (locked) return;
    setRating(value);
    onChange({ correct: value === 'said', selfRated: true });
  };

  return (
    <View style={styles.wrap}>
      <Text style={styles.instruction}>{instruction ?? 'Say this aloud'}</Text>

      <Text style={styles.sentence}>{text}</Text>
      {hint ? <Text style={styles.hint}>{hint}</Text> : null}

      <Pressable
        onPress={() => speakText(text, lang)}
        accessibilityRole="button"
        style={({ pressed }) => [styles.secondary, pressed && { opacity: 0.85 }]}
      >
        <Text style={styles.secondaryText}>Listen first</Text>
      </Pressable>

      {autoCheck ? (
        <Pressable
          onPress={startListening}
          disabled={locked || listening}
          accessibilityRole="button"
          style={({ pressed }) => [
            styles.primary,
            listening && styles.primaryActive,
            pressed && { opacity: 0.85 },
          ]}
        >
          <Text style={styles.primaryText}>{listening ? 'Listening…' : 'Tap and speak'}</Text>
        </Pressable>
      ) : (
        <View style={styles.rateRow}>
          {[
            { key: 'said', label: 'I said it' },
            { key: 'couldnt', label: "I couldn't" },
          ].map(({ key, label }) => (
            <Pressable
              key={key}
              onPress={() => rate(key)}
              disabled={locked}
              accessibilityRole="button"
              style={[styles.rate, rating === key && styles.rateActive]}
            >
              <Text style={[styles.rateText, rating === key && { color: colors.lapisDark }]}>
                {label}
              </Text>
            </Pressable>
          ))}
        </View>
      )}

      {heard ? <Text style={styles.heard}>Heard: “{heard}”</Text> : null}
      {message ? <Text style={styles.message}>{message}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 16 },
  instruction: { fontSize: 15, color: colors.muted },
  sentence: { fontSize: 24, lineHeight: 34, color: colors.ink, fontWeight: '600' },
  hint: { fontSize: 15, lineHeight: 22, color: colors.muted, fontStyle: 'italic' },
  secondary: {
    paddingVertical: 14,
    alignItems: 'center',
    borderRadius: radius.button,
    borderWidth: 2,
    borderColor: colors.lapis,
    backgroundColor: colors.card,
  },
  secondaryText: { fontSize: 17, fontWeight: '700', color: colors.lapisDark },
  primary: {
    paddingVertical: 16,
    alignItems: 'center',
    borderRadius: radius.button,
    backgroundColor: colors.lapis,
  },
  primaryActive: { backgroundColor: colors.madder },
  primaryText: { fontSize: 17, fontWeight: '700', color: '#FFFFFF' },
  rateRow: { flexDirection: 'row', gap: 12 },
  rate: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    borderRadius: radius.option,
    borderWidth: 2,
    borderColor: colors.line,
    backgroundColor: colors.card,
  },
  rateActive: { borderColor: colors.lapis, backgroundColor: colors.lapisTint },
  rateText: { fontSize: 17, fontWeight: '600', color: colors.ink },
  heard: { fontSize: 15, color: colors.muted },
  message: { fontSize: 15, color: colors.madder },
});
