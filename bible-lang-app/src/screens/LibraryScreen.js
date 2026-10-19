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

export default function LibraryScreen({ lang, onOpenChapter, onExit }) {
  const [books, setBooks] = useState(null);
  const [bookId, setBookId] = useState(null);
  const [chapters, setChapters] = useState(null);
  const [error, setError] = useState(null);

  // Load the list of books once, then select the first one.
  useEffect(() => {
    fetchBooks()
      .then((list) => {
        setBooks(list);
        setBookId(list[0]?.id ?? null);
      })
      .catch((err) => setError(err.message));
  }, []);

  // Reload the chapter list whenever the selected book (or language) changes.
  useEffect(() => {
    if (bookId === null) return;
    let cancelled = false; // ignore a slow response if the user has already picked another book
    setChapters(null);
    fetchChapters(bookId, lang)
      .then((data) => {
        if (!cancelled) setChapters(data);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message);
      });
    return () => {
      cancelled = true;
    };
  }, [bookId, lang]);

  const book = books?.find((b) => b.id === bookId);

  if (error) {
    return (
      <SafeAreaView style={[styles.screen, styles.centered]}>
        <Text style={styles.body}>Can't load the library: {error}</Text>
        <Pressable onPress={onExit}>
          <Text style={styles.body}>Back</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  if (!books) {
    return (
      <SafeAreaView style={[styles.screen, styles.centered]}>
        <ActivityIndicator size="large" color={colors.lapis} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.header}>
        <Pressable onPress={onExit} hitSlop={12}>
          <Text style={styles.back}>‹</Text>
        </Pressable>
        <Text style={styles.title}>The Gospels</Text>
        <View style={{ width: 28 }} />
      </View>

      <View style={styles.tabs}>
        {books.map((b) => (
          <Pressable
            key={b.id}
            onPress={() => setBookId(b.id)}
            style={[styles.tab, b.id === bookId && styles.tabActive]}
          >
            <Text
              style={[styles.tabText, b.id === bookId && styles.tabTextActive]}
            >
              {b.name}
            </Text>
          </Pressable>
        ))}
      </View>

      {!chapters ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.lapis} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.grid}>
          {chapters.map((c, i) => (
            <Pressable
              key={c.id}
              onPress={() =>
                onOpenChapter({ bookName: book.name, chapters, index: i })
              }
              style={({ pressed }) => [
                styles.cell,
                pressed && { opacity: 0.8 },
              ]}
            >
              <Text style={styles.cellText}>{c.chapter_number}</Text>
            </Pressable>
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.mist },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
  },
  body: { fontSize: 16, color: colors.muted, textAlign: "center", padding: 24 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  back: { fontSize: 28, color: colors.ink, paddingHorizontal: 4 },
  title: { fontSize: 18, fontWeight: "700", color: colors.ink },
  tabs: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
    marginVertical: 12,
    flexWrap: "wrap",
  },
  tab: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: colors.line,
    backgroundColor: colors.card,
  },
  tabActive: { borderColor: colors.lapis, backgroundColor: colors.lapisTint },
  tabText: { fontSize: 14, fontWeight: "600", color: colors.muted },
  tabTextActive: { color: colors.lapisDark },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    padding: 20,
    justifyContent: "center",
  },
  cell: {
    width: 56,
    height: 56,
    borderRadius: radius.option,
    borderWidth: 2,
    borderColor: colors.line,
    backgroundColor: colors.card,
    alignItems: "center",
    justifyContent: "center",
  },
  cellText: { fontSize: 18, fontWeight: "600", color: colors.ink },
});
