import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { loadState, saveState } from '../storage';
import {
  completeStep as completeStepLogic,
  createInitialState,
  currentStreak,
  dateKey,
  loseHeart as loseHeartLogic,
  msToNextHeart,
  refillHearts,
  resetProgress as resetProgressLogic,
} from './logic';
import { DEFAULT_LANG, DEMO_MODE, MAX_HEARTS, UNLIMITED_HEARTS } from './rules';
import { setSpeechSpeed } from '../utils/speech';

const ProgressContext = createContext(null);

// Holds the saved progress for the whole app. Screens read it with useProgress().
export function ProgressProvider({ children }) {
  const [state, setState] = useState(null); // null until the saved copy has been read
  const [now, setNow] = useState(Date.now());

  // Read the saved progress once, when the app opens.
  useEffect(() => {
    let alive = true;
    loadState().then((saved) => {
      if (!alive) return;
      const t = Date.now();
      const fresh = { ...createInitialState(t), lang: DEFAULT_LANG }; // used only by first-time visitors
      // Unlimited hearts for everyone (UNLIMITED_HEARTS) or in a demo build.
      const demo = DEMO_MODE || UNLIMITED_HEARTS ? { premium: true } : {};
      setState(refillHearts({ ...fresh, ...(saved ?? {}), ...demo }, t));
    });
    return () => {
      alive = false;
    };
  }, []);

  // Save after every change.
  useEffect(() => {
    if (state) saveState(state);
  }, [state]);

  // Every read-aloud voice in the app follows the chosen listening speed.
  const speed = state?.speed ?? 1;
  useEffect(() => {
    setSpeechSpeed(speed);
  }, [speed]);

  // A slow clock: gives back hearts and keeps the countdown fresh while the app is open.
  useEffect(() => {
    const id = setInterval(() => {
      const t = Date.now();
      setNow(t);
      setState((s) => (s ? refillHearts(s, t) : s));
    }, 5000);
    return () => clearInterval(id);
  }, []);

  const actions = useMemo(
    () => ({
      setLang: (lang, base) => setState((s) => ({ ...s, lang, base: base ?? s.base ?? null })),
      loseHeart: () => setState((s) => loseHeartLogic(s, Date.now())),
      completeStep: (lang, chapterId, step) =>
        setState((s) => completeStepLogic(s, lang, chapterId, step, Date.now())),
      setPremium: (premium) => setState((s) => ({ ...s, premium: UNLIMITED_HEARTS || !!premium })),
      setSpeed: (speed) => setState((s) => ({ ...s, speed })),
      resetProgress: () => setState((s) => resetProgressLogic(s, Date.now())),
    }),
    []
  );

  const value = useMemo(() => {
    if (!state) return { ready: false };
    const today = dateKey(new Date(now));
    return {
      ready: true,
      state,
      lang: state.lang,
      base: state.lang === 'en' ? (state.base ?? null) : null, // only English uses it
      premium: !!state.premium,
      speed: state.speed ?? 1, // listening speed (older saves have none: normal speed)
      hearts: state.premium ? MAX_HEARTS : state.hearts, // unlimited plan: always full
      msToNextHeart: msToNextHeart(state, now),
      days: state.days,
      today,
      streak: currentStreak(state.days, today),
      practicedToday: state.days.includes(today),
      ...actions,
    };
  }, [state, now, actions]);

  return <ProgressContext.Provider value={value}>{children}</ProgressContext.Provider>;
}

export function useProgress() {
  const value = useContext(ProgressContext);
  if (!value) throw new Error('useProgress must be used inside <ProgressProvider>');
  return value;
}
