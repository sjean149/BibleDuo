import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import LessonScreen from './src/screens/LessonScreen';

export default function App() {
  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <LessonScreen lessonId={1} />
    </SafeAreaProvider>
  );
}
