import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { fetchLesson } from '../api';
import { API_URL } from '../config';
import { colors, radius } from '../theme';
import { gradeExercise, SUPPORTED_TYPES } from '../utils/grade';
import ExerciseView from '../components/ExtendedExerciseView';
import ProgressBar from '../components/ProgressBar';
import { useProgress } from '../progress/ProgressContext';

export default function LessonScreen({ lessonId, onExit, onComplete }) {
  // Hearts are shared by the whole app (they show in the top bar and refill over time).
  const { hearts, loseHeart } = useProgress();
  const [lesson, setLesson] = useState(null);
  const [error, setError] = useState(null);

  const [index, setIndex] = useState(0);
  const [answer, setAnswer] = useState(null); // what the learner has chosen/typed
  const [result, setResult] = useState(null); // { correct, correctText } after Check
  const [correctCount, setCorrectCount] = useState(0);
  const [gradedCount, setGradedCount] = useState(0);
  const [finished, setFinished] = useState(null); // null | 'done' | 'out_of_hearts'

  const load = useCallback(async () => {
    setError(null);
    setLesson(null);
    try {
      const data = await fetchLesson(lessonId);
      data.exercises = [...data.exercises].sort((a, b) => a.order - b.order);
      setLesson(data);
    } catch (err) {
      setError(err.message);
    }
  }, [lessonId]);

  useEffect(() => {
    load();
  }, [load]);

  // Tell the path screen the lesson was finished (the step then lights up).
  useEffect(() => {
    if (finished === 'done') onComplete?.({ correct: correctCount, total: gradedCount });
  }, [finished]); // eslint-disable-line react-hooks/exhaustive-deps

  const restart = () => {
    setIndex(0);
    setAnswer(null);
    setResult(null);
    setCorrectCount(0);
    setGradedCount(0);
    setFinished(null);
  };

  if (error) {
    return (
      <Centered>
        <Text style={styles.title}>Can't reach the lesson server</Text>
        <Text style={styles.body}>{error}</Text>
        <Text style={styles.body}>
          Tried {API_URL}. Check that the backend is running with{' '}
          <Text style={styles.mono}>--host 0.0.0.0</Text> and that your phone is on the same
          Wi-Fi as your computer.
        </Text>
        <PrimaryButton label="Try again" onPress={load} />
        <Pressable onPress={onExit}>
          <Text style={[styles.body, { textAlign: 'center' }]}>Back to the path</Text>
        </Pressable>
      </Centered>
    );
  }

  if (!lesson) {
    return (
      <Centered>
        <ActivityIndicator size="large" color={colors.lapis} />
      </Centered>
    );
  }

  if (finished) {
    const outOfHearts = finished === 'out_of_hearts';
    return (
      <Centered>
        <Text style={styles.title}>{outOfHearts ? 'Out of hearts' : 'Lesson complete'}</Text>
        <Text style={styles.body}>
          {outOfHearts
            ? 'A heart comes back every 30 minutes. You can still read and listen in the meantime.'
            : `${correctCount} of ${gradedCount} answered correctly.`}
        </Text>
        {!outOfHearts && <PrimaryButton label="Do it again" onPress={restart} />}
        <PrimaryButton label="Back to the path" onPress={onExit} tone={outOfHearts ? undefined : 'good'} />
      </Centered>
    );
  }

  const exercises = lesson.exercises;
  const exercise = exercises[index];
  const supported = SUPPORTED_TYPES.includes(exercise.type);

  const advance = () => {
    if (hearts === 0) return setFinished('out_of_hearts');
    if (index + 1 >= exercises.length) return setFinished('done');
    setIndex(index + 1);
    setAnswer(null);
    setResult(null);
  };

  const check = () => {
    const graded = gradeExercise(exercise, answer);
    setResult(graded);
    setGradedCount((n) => n + 1);
    if (graded.correct) setCorrectCount((n) => n + 1);
    else loseHeart();
  };

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.header}>
        <Pressable onPress={onExit} hitSlop={12} accessibilityLabel="Back to the path">
          <Text style={styles.back}>‹</Text>
        </Pressable>
        <ProgressBar value={index + (result ? 1 : 0)} total={exercises.length} />
        <View style={styles.heartsBox} accessibilityLabel={`${hearts} hearts left`}>
          <Ionicons name="heart" size={22} color={colors.madder} />
          <Text style={styles.hearts}>{hearts}</Text>
        </View>
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          <ExerciseView
            key={exercise.id}
            exercise={exercise}
            lang={lesson.lang}
            locked={result !== null}
            onChange={setAnswer}
          />
        </ScrollView>

        <View
          style={[
            styles.footer,
            result && (result.correct ? styles.footerCorrect : styles.footerWrong),
          ]}
        >
          {result ? (
            <>
              <Text style={[styles.feedback, result.correct ? styles.good : styles.bad]}>
                {result.correct ? 'Correct' : `Correct answer: ${result.correctText}`}
              </Text>
              <PrimaryButton
                label="Continue"
                onPress={advance}
                tone={result.correct ? 'good' : 'bad'}
              />
            </>
          ) : supported ? (
            <PrimaryButton label="Check" onPress={check} disabled={answer === null} />
          ) : (
            <PrimaryButton label="Skip" onPress={advance} />
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Centered({ children }) {
  return (
    <SafeAreaView style={[styles.screen, styles.centered]}>
      <View style={styles.centerBox}>{children}</View>
    </SafeAreaView>
  );
}

function PrimaryButton({ label, onPress, disabled, tone }) {
  const bg =
    tone === 'good' ? colors.leaf : tone === 'bad' ? colors.madder : colors.lapis;
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: disabled ? colors.line : bg },
        pressed && { opacity: 0.85 },
      ]}
    >
      <Text style={[styles.buttonLabel, disabled && { color: colors.muted }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  screen: { flex: 1, backgroundColor: colors.mist },
  centered: { justifyContent: 'center' },
  centerBox: { padding: 28, gap: 14 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
  },
  heartsBox: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  hearts: { fontSize: 17, fontWeight: '800', color: colors.madder },
  back: { fontSize: 28, color: colors.ink, paddingHorizontal: 4 },
  content: { padding: 20, paddingTop: 28, flexGrow: 1 },
  footer: { padding: 20, gap: 12, backgroundColor: colors.mist },
  footerCorrect: { backgroundColor: colors.leafTint },
  footerWrong: { backgroundColor: colors.madderTint },
  feedback: { fontSize: 18, fontWeight: '700' },
  good: { color: colors.leaf },
  bad: { color: colors.madder },
  title: { fontSize: 26, fontWeight: '700', color: colors.ink },
  body: { fontSize: 16, lineHeight: 23, color: colors.muted },
  mono: { fontFamily: Platform.select({ ios: 'Menlo', default: 'monospace' }), color: colors.ink },
  button: {
    paddingVertical: 16,
    borderRadius: radius.button,
    alignItems: 'center',
  },
  buttonLabel: { fontSize: 17, fontWeight: '700', color: '#FFFFFF' },
});
