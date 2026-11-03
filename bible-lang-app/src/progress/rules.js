// The game rules in one place. Change a number here and the whole app follows.

export const MAX_HEARTS = 5;

// Everyone gets unlimited hearts. Set to false to bring back losing hearts and the refill clock.
export const UNLIMITED_HEARTS = true;
export const HEART_REFILL_MINUTES = 30; // one heart comes back every 30 minutes

// Listening speeds the learner can pick (recordings and read-aloud). 1 is normal speed.
export const SPEEDS = [0.5, 0.75, 1, 1.25, 1.5];

// The three parts of every level, in the order they are done.
export const STEPS = ['vocab', 'reading', 'lesson'];

// Set to true while testing to open every level and every step from the start.
export const UNLOCK_EVERYTHING = false;

// The language a first-time visitor starts in. Spanish has real recorded audio.
export const DEFAULT_LANG = 'es';

// Demo build (EXPO_PUBLIC_DEMO_MODE=true): unlimited hearts, so nobody trying the app gets locked
// out for 30 minutes after a few wrong answers. Expo bakes this in when the app is built.
export const DEMO_MODE = process.env.EXPO_PUBLIC_DEMO_MODE === 'true';
