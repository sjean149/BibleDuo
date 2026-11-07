import { fetchJourney } from './api';

// The path and the Read tab show the same data (every book with its chapters). It is kept here
// after the first load so switching between them is instant and the server is asked only once
// per language until the app is restarted. base: the language an English learner speaks, which
// decides their lessons, so it is part of the key.
const journeyCache = {};

const cacheKey = (lang, base) => `${lang}:${base ?? ''}`;

export const peekJourney = (lang, base) => journeyCache[cacheKey(lang, base)] ?? null;

export async function loadJourney(lang, base) {
  const data = await fetchJourney(lang, base);
  journeyCache[cacheKey(lang, base)] = data;
  return data;
}
