import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  View,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { fetchBooks, fetchChapters } from "../api";
import { colors, radius } from "../theme";

const LANGUAGES = [
  { code: "fr", label: "French" },
  { code: "es", label: "Spanish" },
  { code: "en", label: "English" },
];

export default function HomeScreen({ onSelectLesson, onOpenLibrary }) {
  const [lang, setLang] = useState("fr");
  const [lessons, setLessons] = useState(null); // flat list of every lesson in this language
  const [error, setError] = useState(null);
  const [attempt, setAttempt] = useState(0); // bump to retry after an error

  useEffect(() => {
    let cancelled = false;
    setLessons(null);
    setError(null);

    async function run() {
      try {
        const books = await fetchBooks();
        // Ask every book for its chapters at the same time, keep only chapters' lessons.
        const perBook = await Promise.all(
          books.map(async (book) => {
            const chapters = await fetchChapters(book.id, lang);
            return chapters.flatMap((chapter) =>
              chapter.lessons.map((lesson) => ({
                ...lesson,
                bookName: book.name,
                chapterNumber: chapter.chapter_number,
              })),
            );
          }),
        );
        if (!cancelled) setLessons(perBook.flat());
      } catch (err) {
        if (!cancelled) setError(err.message);
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [lang, attempt]);

  const languageLabel = LANGUAGES.find((l) => l.code === lang).label;

  return (
    <SafeAreaView style={styles.screen}>
      <Text style={styles.title}>Learn with the Gospels</Text>

      <View style={styles.langRow}>
        {LANGUAGES.map((l) => (
          <Pressable
            key={l.code}
            onPress={() => setLang(l.code)}
            style={[
              styles.langButton,
              lang === l.code && styles.langButtonActive,
            ]}
          >
            <Text
              style={[
                styles.langText,
                lang === l.code && styles.langTextActive,
              ]}
            >
              {l.label}
            </Text>
          </Pressable>
        ))}
      </View>

      <Pressable onPress={() => onOpenLibrary(lang)} style={styles.readButton}>
        <Text style={styles.readButtonText}>Browse the Gospels</Text>
      </Pressable>

      {error ? (
        <View style={styles.center}>
          <Text style={styles.body}>Can't reach the server: {error}</Text>
          <Pressable
            onPress={() => setAttempt((n) => n + 1)}
            style={styles.retry}
          >
            <Text style={styles.retryText}>Try again</Text>
          </Pressable>
        </View>
      ) : !lessons ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.lapis} />
        </View>
      ) : lessons.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.body}>
            No {languageLabel} lessons yet. You can still read the Gospels with
            the button above.
          </Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.list}>
          {lessons.map((lesson) => (
            <Pressable
              key={lesson.id}
              onPress={() => onSelectLesson(lesson.id)}
              style={({ pressed }) => [
                styles.card,
                pressed && styles.cardPressed,
              ]}
            >
              <Text style={styles.cardChapter}>
                {lesson.bookName} {lesson.chapterNumber}
              </Text>
              <Text style={styles.cardTitle}>{lesson.title}</Text>
              <Text style={styles.cardType}>{lesson.type}</Text>
            </Pressable>
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.mist },
  title: {
    fontSize: 26,
    fontWeight: "700",
    color: colors.ink,
    textAlign: "center",
    marginTop: 12,
  },
  langRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
    marginVertical: 16,
  },
  langButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: colors.line,
    backgroundColor: colors.card,
  },
  langButtonActive: {
    borderColor: colors.lapis,
    backgroundColor: colors.lapisTint,
  },
  langText: { fontSize: 14, color: colors.muted, fontWeight: "600" },
  langTextActive: { color: colors.lapisDark },
  readButton: {
    marginHorizontal: 20,
    marginBottom: 8,
    paddingVertical: 14,
    borderRadius: radius.button,
    backgroundColor: colors.leaf,
    alignItems: "center",
  },
  readButtonText: { color: "#fff", fontWeight: "700", fontSize: 16 },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
    gap: 12,
  },
  body: { fontSize: 16, color: colors.muted, textAlign: "center" },
  retry: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: radius.button,
    backgroundColor: colors.lapis,
  },
  retryText: { color: "#fff", fontWeight: "700" },
  list: { padding: 20, gap: 12 },
  card: {
    padding: 18,
    borderRadius: radius.option,
    backgroundColor: colors.card,
    borderWidth: 2,
    borderColor: colors.line,
  },
  cardPressed: { opacity: 0.8 },
  cardChapter: { fontSize: 13, color: colors.muted, marginBottom: 4 },
  cardTitle: { fontSize: 18, fontWeight: "600", color: colors.ink },
  cardType: {
    fontSize: 13,
    color: colors.lapisDark,
    marginTop: 4,
    textTransform: "capitalize",
  },
});
