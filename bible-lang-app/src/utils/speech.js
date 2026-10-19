import { Platform } from 'react-native';
import * as Speech from 'expo-speech';

export const LANG_TAGS = { fr: 'fr-FR', es: 'es-ES', en: 'en-US' };

// Read text aloud with the phone's (or browser's) built-in voice. Free, no backend needed.
export function speakText(text, lang) {
  try {
    Speech.stop();
    Speech.speak(text, { language: LANG_TAGS[lang] ?? 'en-US', rate: 0.85 });
  } catch {
    // no voice available: the exercise still works, just silently
  }
}

export function stopSpeaking() {
  try {
    Speech.stop();
  } catch {}
}

// Read a list of texts one after another (a whole chapter, verse by verse).
//   onStart(i) is called as verse i begins; onEnd() when everything finished or was stopped.
// Returns a function that stops the reading.
export function speakSequence(texts, lang, { onStart, onEnd } = {}) {
  let stopped = false;
  const language = LANG_TAGS[lang] ?? 'en-US';

  const finish = () => {
    if (stopped) return;
    stopped = true;
    onEnd?.();
  };

  const speakAt = (i) => {
    if (stopped) return;
    if (i >= texts.length) return finish();
    onStart?.(i);
    Speech.speak(texts[i], {
      language,
      rate: 0.85,
      onDone: () => speakAt(i + 1),
      onError: finish,
    });
  };

  try {
    Speech.stop();
    speakAt(0);
  } catch {
    finish();
  }

  return () => {
    const alreadyDone = stopped;
    stopped = true;
    try {
      Speech.stop();
    } catch {}
    if (!alreadyDone) onEnd?.();
  };
}

// Speech recognition: only the web build in Chrome/Edge/Safari has it built in.
// (Phones need a paid speech service or a custom build.)
export function canRecognize() {
  return (
    Platform.OS === 'web' &&
    typeof window !== 'undefined' &&
    !!(window.SpeechRecognition || window.webkitSpeechRecognition)
  );
}

// Listen once. Calls onResult(listOfAlternativeTranscripts). Returns a function that stops it.
export function listenOnce(lang, { onResult, onError, onEnd }) {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  const rec = new SR();
  rec.lang = LANG_TAGS[lang] ?? 'en-US';
  rec.interimResults = false;
  rec.maxAlternatives = 3;
  rec.onresult = (e) => onResult(Array.from(e.results[0], (alt) => alt.transcript));
  rec.onerror = (e) => onError(e.error);
  rec.onend = onEnd;
  rec.start();
  return () => {
    try {
      rec.abort();
    } catch {}
  };
}
