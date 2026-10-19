import { useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ProgressProvider, useProgress } from './src/progress/ProgressContext';
import { colors } from './src/theme';
import ChapterReaderScreen from './src/screens/ChapterReaderScreen';
import LessonScreen from './src/screens/LessonScreen';
import PathScreen from './src/screens/PathScreen';
import StreakScreen from './src/screens/StreakScreen';

// `screen` says which screen is showing and carries what it needs:
//   { name: 'path' }
//   { name: 'streak' }
//   { name: 'lesson',  lessonId, chapterId, step, lang }
//   { name: 'reading', title, chapterId, lang }
function Root() {
  const { ready, lang, completeStep } = useProgress();
  const [screen, setScreen] = useState({ name: 'path' });
  const goPath = () => setScreen({ name: 'path' });

  // Wait until the saved progress has been read from the device.
  if (!ready) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.mist }}>
        <ActivityIndicator size="large" color={colors.lapis} />
      </View>
    );
  }

  switch (screen.name) {
    case 'streak':
      return <StreakScreen onExit={goPath} />;

    case 'lesson':
      return (
        <LessonScreen
          lessonId={screen.lessonId}
          onExit={goPath}
          onComplete={() => completeStep(screen.lang, screen.chapterId, screen.step)}
        />
      );

    case 'reading':
      return (
        <ChapterReaderScreen
          title={screen.title}
          chapterId={screen.chapterId}
          lang={screen.lang}
          onExit={goPath}
          onComplete={() => completeStep(screen.lang, screen.chapterId, 'reading')}
        />
      );

    default:
      return (
        <PathScreen
          onOpenStreak={() => setScreen({ name: 'streak' })}
          onStartStep={({ unit, level, step }) => {
            const chapterId = level.chapter_id;
            if (step === 'reading') {
              setScreen({ name: 'reading', title: `${unit.display_name} ${level.chapter_number}`, chapterId, lang });
            } else {
              const lessonId = step === 'vocab' ? level.vocab_lesson_id : level.practice_lesson_id;
              setScreen({ name: 'lesson', lessonId, chapterId, step, lang });
            }
          }}
        />
      );
  }
}

export default function App() {
  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <ProgressProvider>
        <Root />
      </ProgressProvider>
    </SafeAreaProvider>
  );
}
