import { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { fetchChapterAudio, fetchVerses, translateText } from '../api';
import { colors, radius } from '../theme';
import { speakSequence, speakText, stopSpeaking } from '../utils/speech';
import SceneBackground from '../components/SceneBackground';
import SpeedButton from '../components/SpeedButton';
import { useProgress } from '../progress/ProgressContext';

// Strip punctuation from the edges of a selected phrase before it is translated.
const EDGES = /^[\s.,;:!?"“”«»()¿¡'’\-—]+|[\s.,;:!?"“”«»()¿¡'’\-—]+$/g;

// 83.4 -> "1:23"
const clock = (seconds) => {
  const s = Math.max(0, Math.floor(seconds || 0));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
};

// The "Read and listen" step: the chapter in the language being learned.
//  - tap one word, then another, to select a phrase; Translate shows it in English (Google Translate)
//  - Listen plays the chapter's recording (from Supabase) when there is one,
//    otherwise the phone reads it aloud verse by verse (text-to-speech)
//  - the speed button (0.5x to 1.5x) sets how fast both of those play
//  - Finish chapter (at the bottom) marks the step as done
export default function ChapterReaderScreen({ title, chapterId, lang, scene, onExit, onComplete }) {
  const [verses, setVerses] = useState(null);
  const [error, setError] = useState(null);
  const [selection, setSelection] = useState(null); // { a, b } = first and last selected word
  const [result, setResult] = useState(null); // { status: 'loading' | 'done' | 'error', text }
  const [playing, setPlaying] = useState(null); // index of the verse being read aloud (text-to-speech)
  const [audioUrl, setAudioUrl] = useState(null); // the chapter recording, if this language has one
  const stopReading = useRef(null);
  const mounted = useRef(true);
  const { speed } = useProgress(); // listening speed, changed with the speed button

  // One audio player for the screen. It starts empty and is given the recording once we know
  // its link; it is released automatically when the screen closes.
  const player = useAudioPlayer(null);
  const status = useAudioPlayerStatus(player);
  const listening = audioUrl ? status.playing : playing !== null;

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      stopReading.current?.();
      stopSpeaking();
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetchVerses(chapterId, lang)
      .then((data) => {
        if (!cancelled) setVerses(data);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message);
      });
    return () => {
      cancelled = true;
    };
  }, [chapterId, lang]);

  // Ask the server whether this chapter has a recording. If the request fails we simply
  // keep text-to-speech, so a missing recording never stops someone reading.
  useEffect(() => {
    let cancelled = false;
    setAudioUrl(null);
    fetchChapterAudio(chapterId, lang)
      .then((data) => {
        if (!cancelled) setAudioUrl(data.audio_url ?? null);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [chapterId, lang]);

  useEffect(() => {
    if (audioUrl) player.replace(audioUrl);
  }, [audioUrl, player]);

  // Play the recording at the learner's listening speed ('high' keeps voices at their normal pitch).
  // Set again once the recording has loaded, because loading a new one resets the speed.
  useEffect(() => {
    if (audioUrl) player.setPlaybackRate(speed, 'high');
  }, [speed, audioUrl, status.isLoaded, player]);

  // Every word of the chapter in one flat list, so a selection can span verses.
  const { words, starts } = useMemo(() => {
    const list = [];
    const firstIndex = [];
    (verses ?? []).forEach((verse, vi) => {
      firstIndex.push(list.length);
      verse.text
        .split(/\s+/)
        .filter(Boolean)
        .forEach((text) => list.push({ vi, text }));
    });
    return { words: list, starts: firstIndex };
  }, [verses]);

  const selectedText = selection
    ? words
        .slice(selection.a, selection.b + 1)
        .map((w) => w.text)
        .join(' ')
        .replace(EDGES, '')
    : '';

  const tapWord = (g) => {
    setResult(null);
    setSelection((sel) => {
      if (!sel || sel.a !== sel.b) return { a: g, b: g }; // start a new selection
      return { a: Math.min(sel.a, g), b: Math.max(sel.a, g) }; // second tap makes a range
    });
  };

  const translate = async () => {
    setResult({ status: 'loading', text: '' });
    try {
      const data = await translateText(selectedText, lang);
      if (mounted.current) setResult({ status: 'done', text: data.translation });
    } catch (err) {
      // 429 = a translation limit was hit; the server's message says which one and when it resets.
      const limited = err.status === 429;
      if (mounted.current) {
        setResult({
          status: 'error',
          text: limited ? err.detail || 'Translation limit reached. Try again later.' : `Couldn't translate: ${err.message}`,
        });
      }
    }
  };

  const toggleListening = () => {
    if (audioUrl) {
      if (status.playing) {
        player.pause();
        return;
      }
      stopSpeaking();
      // At the end of the recording, Listen starts it again from the top.
      if (status.duration > 0 && status.currentTime >= status.duration - 0.5) player.seekTo(0);
      player.play();
      return;
    }
    if (playing !== null) {
      stopReading.current?.();
      return;
    }
    stopReading.current = speakSequence(
      verses.map((v) => v.text),
      lang,
      {
        onStart: (i) => mounted.current && setPlaying(i),
        onEnd: () => mounted.current && setPlaying(null),
      }
    );
  };

  const back10 = () => player.seekTo(Math.max(0, status.currentTime - 10));

  const finish = () => {
    stopReading.current?.();
    player.pause();
    onComplete();
    onExit();
  };

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
      {scene ? <SceneBackground scene={scene} height={200} /> : null}
      <View style={styles.header}>
        <Pressable onPress={onExit} hitSlop={12} accessibilityRole="button" accessibilityLabel="Back to the path">
          <Ionicons name="chevron-back" size={28} color={colors.ink} />
        </Pressable>
        <Text style={styles.headerTitle}>{title}</Text>
        <SpeedButton />
        <Pressable
          onPress={toggleListening}
          disabled={!verses}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={listening ? (audioUrl ? 'Pause' : 'Stop listening') : 'Listen to the chapter'}
          style={[styles.listen, listening && styles.listenOn]}
        >
          <Ionicons
            name={listening ? (audioUrl ? 'pause' : 'stop') : 'volume-high'}
            size={18}
            color={listening ? '#FFFFFF' : colors.lapisDark}
          />
          <Text style={[styles.listenText, listening && { color: '#FFFFFF' }]}>
            {listening ? (audioUrl ? 'Pause' : 'Stop') : 'Listen'}
          </Text>
        </Pressable>
      </View>

      {audioUrl && (status.playing || status.currentTime > 0) && (
        <View style={styles.audioBar}>
          <Pressable onPress={back10} hitSlop={8} accessibilityRole="button" accessibilityLabel="Back 10 seconds">
            <Ionicons name="play-back" size={20} color={colors.lapisDark} />
          </Pressable>
          <View style={styles.track}>
            <View
              style={[
                styles.trackFill,
                { width: `${status.duration > 0 ? Math.min(100, (status.currentTime / status.duration) * 100) : 0}%` },
              ]}
            />
          </View>
          <Text style={styles.time}>
            {status.isBuffering && !status.isLoaded ? 'Loading…' : `${clock(status.currentTime)} / ${clock(status.duration)}`}
          </Text>
        </View>
      )}

      {error ? (
        <View style={styles.center}>
          <Text style={styles.message}>Can't load this chapter: {error}</Text>
        </View>
      ) : !verses ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.lapis} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.hint}>Tap a word, then another to select a phrase and translate it.</Text>
          {verses.map((verse, vi) => {
            const end = vi + 1 < starts.length ? starts[vi + 1] : words.length;
            return (
              <View key={verse.id} style={[styles.verse, playing === vi && styles.verseActive]}>
                <Text style={styles.verseText}>
                  <Text style={styles.verseNumber}>{verse.verse_number} </Text>
                  {words.slice(starts[vi], end).map((w, k) => {
                    const g = starts[vi] + k;
                    const on = selection && g >= selection.a && g <= selection.b; 
                    return (
                      <Text key={g} onPress={() => tapWord(g)} style={on ? styles.wordOn : undefined}>
                        {w.text}{' '}
                      </Text>
                    );
                  })}
                </Text>
              </View>
            );
          })}

          <Pressable onPress={finish} style={styles.finish} accessibilityRole="button">
            <Text style={styles.finishText}>Finish chapter</Text>
          </Pressable>
        </ScrollView>
      )}

      {selection && (
        <View style={styles.panel}>
          <Text style={styles.panelText}>{selectedText}</Text>
          {result?.status === 'loading' && <ActivityIndicator color={colors.lapis} />}
          {result?.status === 'done' && <Text style={styles.panelResult}>{result.text}</Text>}
          {result?.status === 'error' && <Text style={styles.panelError}>{result.text}</Text>}
          <View style={styles.panelButtons}>
            <Pressable onPress={translate} style={[styles.panelButton, styles.panelPrimary]} accessibilityRole="button">
              <Text style={styles.panelPrimaryText}>Translate</Text>
            </Pressable>
            <Pressable
              onPress={() => {
                player.pause(); // don't talk over the recording
                speakText(selectedText, lang);
              }}
              style={styles.panelButton}
              accessibilityRole="button"
            >
              <Text style={styles.panelButtonText}>Listen</Text>
            </Pressable>
            <Pressable
              onPress={() => {
                setSelection(null);
                setResult(null);
              }}
              style={styles.panelButton}
              accessibilityRole="button"
            >
              <Text style={styles.panelButtonText}>Clear</Text>
            </Pressable>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.mist },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  headerTitle: { flex: 1, fontSize: 20, fontWeight: '800', color: colors.ink },
  listen: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: colors.lapis,
    backgroundColor: colors.card,
  },
  listenOn: { backgroundColor: colors.madder, borderColor: colors.madder },
  listenText: { fontWeight: '700', color: colors.lapisDark },
  audioBar: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingBottom: 8 },
  track: { flex: 1, height: 6, borderRadius: 3, backgroundColor: colors.line, overflow: 'hidden' },
  trackFill: { height: '100%', backgroundColor: colors.lapis },
  time: { fontSize: 13, fontWeight: '700', color: colors.muted, fontVariant: ['tabular-nums'], minWidth: 78, textAlign: 'right' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  message: { fontSize: 16, color: colors.muted, textAlign: 'center' },
  content: { padding: 16, paddingBottom: 32, gap: 6 },
  hint: { fontSize: 14, color: colors.muted, marginBottom: 6 },
  verse: { borderRadius: 12, paddingVertical: 6, paddingHorizontal: 8 },
  verseActive: { backgroundColor: colors.lapisTint },
  verseText: { fontSize: 19, lineHeight: 30, color: colors.ink },
  verseNumber: { fontSize: 12, fontWeight: '800', color: colors.lapisDark },
  wordOn: { backgroundColor: '#FFE08A' },
  finish: {
    marginTop: 20,
    paddingVertical: 16,
    borderRadius: radius.button,
    backgroundColor: colors.leaf,
    alignItems: 'center',
  },
  finishText: { color: '#FFFFFF', fontSize: 17, fontWeight: '800' },
  panel: {
    padding: 16,
    gap: 10,
    backgroundColor: colors.card,
    borderTopWidth: 2,
    borderTopColor: colors.line,
  },
  panelText: { fontSize: 17, fontWeight: '700', color: colors.ink },
  panelResult: { fontSize: 17, color: colors.lapisDark },
  panelError: { fontSize: 15, color: colors.madder },
  panelButtons: { flexDirection: 'row', gap: 8 },
  panelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: radius.option,
    borderWidth: 2,
    borderColor: colors.line,
    alignItems: 'center',
  },
  panelPrimary: { backgroundColor: colors.lapis, borderColor: colors.lapis },
  panelPrimaryText: { color: '#FFFFFF', fontWeight: '700' },
  panelButtonText: { color: colors.ink, fontWeight: '700' },
});
