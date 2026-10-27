import { useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ProgressProvider, useProgress } from './src/progress/ProgressContext';
import { colors } from './src/theme';
import BottomNav from './src/components/BottomNav';
import WakingBanner from './src/components/WakingBanner';
import ChapterReaderScreen from './src/screens/ChapterReaderScreen';
import HeartsScreen from './src/screens/HeartsScreen';
import LessonScreen from './src/screens/LessonScreen';
import PathScreen from './src/screens/PathScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import ReadScreen from './src/screens/ReadScreen';
import StreakScreen from './src/screens/StreakScreen';

// `screen` says which screen is showing and carries what it needs. The three with the bottom
// bar are the main tabs; the rest cover the whole screen and say where "back" goes (`back`).
//   { name: 'home' }                                   the path
//   { name: 'read', bookOrder }                        books, or the chapters of one book
//   { name: 'profile' }
//   { name: 'streak', back }   { name: 'hearts', back }
//   { name: 'lesson',  lessonId, chapterId, step, lang, back }
//   { name: 'reading', title, chapterId, lang, back }
const HOME = { name: 'home' };
const TABS = ['home', 'read', 'profile'];

function Root() {
  const { ready, lang, completeStep } = useProgress();
  const [screen, setScreen] = useState(HOME);

  // Wait until the saved progress has been read from the device.
  if (!ready) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.mist }}>
        <ActivityIndicator size="large" color={colors.lapis} />
      </View>
    );
  }

  const goBack = () => setScreen(screen.back ?? HOME);
  const openStreak = () => setScreen({ name: 'streak', back: screen });
  const openHearts = () => setScreen({ name: 'hearts', back: screen });

  switch (screen.name) {
    case 'streak':
      return <StreakScreen onExit={goBack} />;

    case 'hearts':
      return <HeartsScreen onExit={goBack} onRead={() => setScreen({ name: 'read', bookOrder: null })} />;

    case 'lesson':
      return (
        <LessonScreen
          lessonId={screen.lessonId}
          onExit={goBack}
          onComplete={() => completeStep(screen.lang, screen.chapterId, screen.step)}
        />
      );

    case 'reading':
      return (
        <ChapterReaderScreen
          title={screen.title}
          chapterId={screen.chapterId}
          lang={screen.lang}
          onExit={goBack}
          onComplete={() => completeStep(screen.lang, screen.chapterId, 'reading')}
        />
      );

    default: {
      const tab = TABS.includes(screen.name) ? screen.name : 'home';
      let content;
      if (tab === 'read') {
        content = (
          <ReadScreen
            bookOrder={screen.bookOrder ?? null}
            onSelectBook={(bookOrder) => setScreen({ name: 'read', bookOrder })}
            onOpenChapter={({ title, chapterId, bookOrder }) =>
              setScreen({ name: 'reading', title, chapterId, lang, back: { name: 'read', bookOrder } })
            }
            onOpenStreak={openStreak}
            onOpenHearts={openHearts}
          />
        );
      } else if (tab === 'profile') {
        content = <ProfileScreen onOpenStreak={openStreak} onOpenHearts={openHearts} />;
      } else {
        content = (
          <PathScreen
            onOpenStreak={openStreak}
            onOpenHearts={openHearts}
            onStartStep={({ unit, level, step }) => {
              const chapterId = level.chapter_id;
              if (step === 'reading') {
                setScreen({ name: 'reading', title: `${unit.display_name} ${level.chapter_number}`, chapterId, lang, back: HOME });
              } else {
                const lessonId = step === 'vocab' ? level.vocab_lesson_id : level.practice_lesson_id;
                setScreen({ name: 'lesson', lessonId, chapterId, step, lang, back: HOME });
              }
            }}
          />
        );
      }
      return (
        <View style={{ flex: 1, backgroundColor: colors.mist }}>
          <View style={{ flex: 1 }}>{content}</View>
          <BottomNav active={tab} onSelect={(key) => setScreen(key === 'read' ? { name: 'read', bookOrder: null } : { name: key })} />
        </View>
      );
    }
  }
}

export default function App() {
  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <ProgressProvider>
        <View style={{ flex: 1 }}>
          <Root />
          <WakingBanner />
        </View>
      </ProgressProvider>
    </SafeAreaProvider>
  );
}
