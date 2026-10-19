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
} from './logic';

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
      setState(refillHearts({ ...createInitialState(t), ...(saved ?? {}) }, t));
    });
    return () => {
      alive = false;
    };
  }, []);

  // Save after every change.
  useEffect(() => {
    if (state) saveState(state);
  }, [state]);

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
      setLang: (lang) => setState((s) => ({ ...s, lang })),
      loseHeart: () => setState((s) => loseHeartLogic(s, Date.now())),
      completeStep: (lang, chapterId, step) =>
        setState((s) => completeStepLogic(s, lang, chapterId, step, Date.now())),
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
      hearts: state.hearts,
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
