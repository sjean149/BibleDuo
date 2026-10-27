// All the progress rules as plain functions: state in, new state out. No React, no storage,
// so they are easy to test and easy to reason about.
//
// The saved state looks like this:
//   {
//     lang: 'fr',
//     hearts: 5,
//     heartsUpdatedAt: 1760000000000,         // when the refill clock last started or ticked
//     steps: { 'fr:123': ['vocab', 'lesson'] }, // finished steps, per language and chapter id
//     days: ['2026-10-17', '2026-10-18'],       // every day the learner finished a step
//     last: { fr: 123 },                        // chapter the learner last worked on, per language
//     premium: false                            // unlimited hearts (set once payments are connected)
//   }
import { HEART_REFILL_MINUTES, MAX_HEARTS, STEPS, UNLOCK_EVERYTHING } from './rules';

const REFILL_MS = HEART_REFILL_MINUTES * 60 * 1000;

export function createInitialState(now) {
  return { lang: 'fr', hearts: MAX_HEARTS, heartsUpdatedAt: now, steps: {}, days: [], last: {}, premium: false };
}

// ---------------------------------------------------------------- dates

const pad = (n) => String(n).padStart(2, '0');

// A calendar day as 'YYYY-MM-DD' in the learner's own time zone.
export function dateKey(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function addDays(key, n) {
  const [y, m, d] = key.split('-').map(Number);
  return dateKey(new Date(y, m - 1, d + n));
}

// ---------------------------------------------------------------- hearts

// Give back any hearts earned while the app was closed. Returns the same object if nothing changed.
export function refillHearts(state, now) {
  if (state.hearts >= MAX_HEARTS) {
    return state.heartsUpdatedAt === now ? state : { ...state, hearts: MAX_HEARTS, heartsUpdatedAt: now };
  }
  const gained = Math.floor((now - state.heartsUpdatedAt) / REFILL_MS);
  if (gained <= 0) return state;
  const hearts = Math.min(MAX_HEARTS, state.hearts + gained);
  return { ...state, hearts, heartsUpdatedAt: hearts >= MAX_HEARTS ? now : state.heartsUpdatedAt + gained * REFILL_MS };
}

export function loseHeart(state, now) {
  if (state.premium) return state; // unlimited hearts
  const fresh = refillHearts(state, now);
  if (fresh.hearts <= 0) return fresh;
  // Losing a heart from a full set starts the refill clock; otherwise the clock keeps running.
  const startClock = fresh.hearts >= MAX_HEARTS;
  return { ...fresh, hearts: fresh.hearts - 1, heartsUpdatedAt: startClock ? now : fresh.heartsUpdatedAt };
}

// Milliseconds until the next heart, or null when the hearts are full.
export function msToNextHeart(state, now) {
  if (state.premium || state.hearts >= MAX_HEARTS) return null;
  return Math.max(0, state.heartsUpdatedAt + REFILL_MS - now);
}

export function formatCountdown(ms) {
  const total = Math.ceil(ms / 1000);
  return `${Math.floor(total / 60)}:${pad(total % 60)}`;
}

// ---------------------------------------------------------------- steps and levels

const stepsKey = (lang, chapterId) => `${lang}:${chapterId}`;

export function isStepDone(state, lang, chapterId, step) {
  return (state.steps[stepsKey(lang, chapterId)] ?? []).includes(step);
}

// Finishing a step also counts today as a practice day (that is what keeps the streak alive).
export function completeStep(state, lang, chapterId, step, now) {
  const key = stepsKey(lang, chapterId);
  const done = state.steps[key] ?? [];
  const today = dateKey(new Date(now));
  const days = state.days.includes(today) ? state.days : [...state.days, today].sort();
  const sameLast = state.last?.[lang] === chapterId;
  if (done.includes(step) && days === state.days && sameLast) return state;
  return {
    ...state,
    steps: { ...state.steps, [key]: done.includes(step) ? done : [...done, step] },
    days,
    last: { ...(state.last ?? {}), [lang]: chapterId }, // so the path can lead on from here
  };
}

// Start over: progress, streak and hearts are cleared; the chosen language and any
// unlimited plan are kept.
export function resetProgress(state, now) {
  return { ...createInitialState(now), lang: state.lang, premium: !!state.premium };
}

// Which of the three steps exist for this level (a level only has what the data provides).
export function availableSteps(level) {
  const out = [];
  if (level.vocab_lesson_id) out.push('vocab');
  if (level.practice_lesson_id) out.push('lesson');
  if (level.has_text) out.push('reading');
  return out;
}

export function levelProgress(state, lang, level) {
  const available = availableSteps(level);
  const done = available.filter((s) => isStepDone(state, lang, level.chapter_id, s));
  return { available, done, complete: available.length > 0 && done.length === available.length };
}

// Key words come first, then the verse practice. Reading is always open, so a learner who is
// out of hearts can still read and listen.
export function isStepUnlocked(state, lang, level, step, unlockAll = UNLOCK_EVERYTHING) {
  if (unlockAll) return true;
  if (step === 'reading') return true; // reading is free and never waits for the other steps
  const available = availableSteps(level);
  const before = STEPS.slice(0, STEPS.indexOf(step)).filter((s) => available.includes(s));
  return before.every((s) => isStepDone(state, lang, level.chapter_id, s));
}

// Status of every level on the path:
//   'done'    all its steps are finished
//   'current' the level to continue with (highlighted with a START tag)
//   'open'    playable now: the first unfinished chapter of any other book
//   'locked'  not reachable yet: an earlier chapter of the same book is not finished
// Every book is its own track, so a learner can start anywhere. Within a book the chapters are
// chained: finishing Matthew 1 opens Matthew 2, and so on.
// The 'current' level is the next one in the book the learner last worked on. If that book is
// finished (or nothing has been played yet) it is the first book started, else the first book.
export function computeStatuses(state, lang, units, unlockAll = UNLOCK_EVERYTHING) {
  const statuses = {};
  const frontiers = []; // one per book: its first unfinished playable chapter
  const lastChapter = state.last?.[lang];
  for (const unit of units) {
    let frontier = null;
    let started = false;
    let hasLast = false;
    for (const level of unit.levels) {
      const { available, done, complete } = levelProgress(state, lang, level);
      if (level.chapter_id === lastChapter) hasLast = true;
      if (available.length === 0) {
        statuses[level.chapter_id] = 'locked';
        continue;
      }
      if (done.length > 0) started = true;
      if (complete) {
        statuses[level.chapter_id] = 'done';
      } else if (frontier === null) {
        frontier = level.chapter_id;
        statuses[level.chapter_id] = 'open';
      } else {
        statuses[level.chapter_id] = unlockAll ? 'open' : 'locked';
      }
    }
    if (frontier !== null) frontiers.push({ chapterId: frontier, started, hasLast });
  }
  const current = frontiers.find((f) => f.hasLast) ?? frontiers.find((f) => f.started) ?? frontiers[0];
  if (current) statuses[current.chapterId] = 'current';
  return { statuses, currentChapterId: current ? current.chapterId : null };
}

export function unitProgress(state, lang, unit) {
  const done = unit.levels.filter((l) => levelProgress(state, lang, l).complete).length;
  return { done, total: unit.levels.length };
}

// ---------------------------------------------------------------- streaks

// Days in a row ending today. If today has no practice yet the streak is still alive
// until the end of tomorrow, so it counts back from yesterday.
export function currentStreak(days, todayKey) {
  const set = new Set(days);
  let cursor = set.has(todayKey) ? todayKey : addDays(todayKey, -1);
  let count = 0;
  while (set.has(cursor)) {
    count += 1;
    cursor = addDays(cursor, -1);
  }
  return count;
}

export function longestStreak(days) {
  const sorted = [...new Set(days)].sort();
  let best = 0;
  let run = 0;
  let previous = null;
  for (const day of sorted) {
    run = previous !== null && addDays(previous, 1) === day ? run + 1 : 1;
    best = Math.max(best, run);
    previous = day;
  }
  return best;
}
