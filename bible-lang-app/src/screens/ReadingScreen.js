import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  View,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { fetchVerses, translateText } from "../api";
import { colors, fonts, radius } from "../theme";

// Props:
//   bookName   e.g. "John"
//   chapters   the book's chapter list from the API: [{ id, chapter_number, ... }]
//   startIndex which entry of `chapters` to open first
//   lang       'fr' | 'es' | 'en'
//   onExit     called by the back arrow
export default function ReadingScreen({
  bookName,
  chapters,
  startIndex,
  lang,
  onExit,
}) {
  const [index, setIndex] = useState(startIndex);
  const chapter = chapters[index];

  const [verses, setVerses] = useState(null);
  const [error, setError] = useState(null);

  // The highlighted phrase: { verseId, anchorIndex, focusIndex } or null
  const [selection, setSelection] = useState(null);
  const [translation, setTranslation] = useState(null);
  const [translating, setTranslating] = useState(false);
  const [translateError, setTranslateError] = useState(null);

  const canTranslate = lang !== "en"; // translating English into English is pointless

  // Load the verses whenever the chapter or language changes.
  useEffect(() => {
    let cancelled = false; // set to true by the cleanup below if this request goes stale
    setVerses(null);
    setError(null);
    setSelection(null);
    setTranslation(null);
    setTranslateError(null);

    fetchVerses(chapter.id, lang)
      .then((data) => {
        if (!cancelled) setVerses(data);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message);
      });

    return () => {
      cancelled = true;
    };
  }, [chapter.id, lang]);

  const tapWord = (verseId, wordIndex) => {
    setTranslation(null);
    setTranslateError(null);
    if (!selection || selection.verseId !== verseId) {
      setSelection({ verseId, anchorIndex: wordIndex, focusIndex: wordIndex });
    } else {
      setSelection({ ...selection, focusIndex: wordIndex });
    }
  };

  const clearSelection = () => {
    setSelection(null);
    setTranslation(null);
    setTranslateError(null);
  };

  const selectedVerse = verses?.find((v) => v.id === selection?.verseId);

  const range = useMemo(() => {
    if (!selection) return null;
    return [
      Math.min(selection.anchorIndex, selection.focusIndex),
      Math.max(selection.anchorIndex, selection.focusIndex),
    ];
  }, [selection]);

  const selectedPhrase = useMemo(() => {
    if (!selectedVerse || !range) return null;
    return selectedVerse.text
      .split(" ")
      .slice(range[0], range[1] + 1)
      .join(" ");
  }, [selectedVerse, range]);

  const runTranslate = async () => {
    if (!selectedPhrase) return;
    setTranslating(true);
    setTranslateError(null);
    try {
      const result = await translateText(selectedPhrase, lang, "en");
      setTranslation(result.translation);
    } catch (err) {
      setTranslateError(err.message);
    } finally {
      setTranslating(false);
    }
  };

  if (error) {
    return (
      <SafeAreaView style={[styles.screen, styles.centered]}>
        <Text style={styles.body}>Can't load this chapter: {error}</Text>
        <Pressable onPress={onExit}>
          <Text style={styles.body}>Back</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  if (!verses) {
    return (
      <SafeAreaView style={[styles.screen, styles.centered]}>
        <ActivityIndicator size="large" color={colors.lapis} />
      </SafeAreaView>
    );
  }

  const isFirst = index === 0;
  const isLast = index === chapters.length - 1;

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.header}>
        <Pressable onPress={onExit} hitSlop={12}>
          <Text style={styles.back}>‹</Text>
        </Pressable>
        <Text style={styles.title}>
          {bookName} {chapter.chapter_number}
        </Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {verses.length === 0 ? (
          <Text style={styles.body}>
            No verses for this chapter in this language yet.
          </Text>
        ) : (
          verses.map((verse) => {
            const words = verse.text.split(" ");
            return (
              <View key={verse.id} style={styles.verseRow}>
                <Text style={styles.verseNum}>{verse.verse_number}</Text>
                <View style={styles.wordWrap}>
                  {words.map((word, i) => {
                    const isSelected =
                      selection?.verseId === verse.id &&
                      range &&
                      i >= range[0] &&
                      i <= range[1];
                    return (
                      <Pressable key={i} onPress={() => tapWord(verse.id, i)}>
                        <Text
                          style={[
                            styles.word,
                            isSelected && styles.wordSelected,
                          ]}
                        >
                          {word}{" "}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            );
          })
        )}

        <View style={styles.pager}>
          <Pressable
            disabled={isFirst}
            onPress={() => setIndex(index - 1)}
            style={[styles.pagerButton, isFirst && styles.pagerDisabled]}
          >
            <Text style={styles.pagerText}>‹ Previous</Text>
          </Pressable>
          <Pressable
            disabled={isLast}
            onPress={() => setIndex(index + 1)}
            style={[styles.pagerButton, isLast && styles.pagerDisabled]}
          >
            <Text style={styles.pagerText}>Next ›</Text>
          </Pressable>
        </View>
      </ScrollView>

      {selection && (
        <View style={styles.panel}>
          <Text style={styles.panelPhrase}>{selectedPhrase}</Text>

          {translating ? (
            <ActivityIndicator color={colors.lapis} />
          ) : translation ? (
            <Text style={styles.panelTranslation}>{translation}</Text>
          ) : translateError ? (
            <Text style={styles.panelError}>{translateError}</Text>
          ) : null}

          <View style={styles.panelButtons}>
            <Pressable onPress={clearSelection} style={styles.panelSecondary}>
              <Text style={styles.panelSecondaryText}>Clear</Text>
            </Pressable>
            {canTranslate && (
              <Pressable onPress={runTranslate} style={styles.panelPrimary}>
                <Text style={styles.panelPrimaryText}>
                  {translation ? "Translate again" : "Translate"}
                </Text>
              </Pressable>
            )}
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.mist },
  centered: { justifyContent: "center", alignItems: "center" },
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
  content: { padding: 20, paddingBottom: 180 },
  verseRow: {
    flexDirection: "row",
    marginBottom: 16,
    alignItems: "flex-start",
  },
  verseNum: { fontSize: 13, color: colors.muted, width: 22, marginTop: 6 },
  wordWrap: { flex: 1, flexDirection: "row", flexWrap: "wrap" },
  word: {
    fontFamily: fonts.scripture,
    fontSize: 20,
    lineHeight: 30,
    color: colors.ink,
  },
  wordSelected: { backgroundColor: colors.lapisTint, color: colors.lapisDark },
  pager: { flexDirection: "row", gap: 10, marginTop: 8 },
  pagerButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: radius.button,
    borderWidth: 2,
    borderColor: colors.line,
    backgroundColor: colors.card,
    alignItems: "center",
  },
  pagerDisabled: { opacity: 0.4 },
  pagerText: { fontWeight: "600", color: colors.ink },
  panel: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.card,
    borderTopWidth: 2,
    borderColor: colors.line,
    padding: 20,
    gap: 10,
  },
  panelPhrase: { fontFamily: fonts.scripture, fontSize: 18, color: colors.ink },
  panelTranslation: {
    fontSize: 17,
    color: colors.lapisDark,
    fontWeight: "600",
  },
  panelError: { fontSize: 15, color: colors.madder },
  panelButtons: { flexDirection: "row", gap: 10, marginTop: 4 },
  panelSecondary: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: radius.button,
    borderWidth: 2,
    borderColor: colors.line,
    alignItems: "center",
  },
  panelSecondaryText: { color: colors.muted, fontWeight: "600" },
  panelPrimary: {
    flex: 2,
    paddingVertical: 14,
    borderRadius: radius.button,
    backgroundColor: colors.lapis,
    alignItems: "center",
  },
  panelPrimaryText: { color: "#fff", fontWeight: "700" },
});
