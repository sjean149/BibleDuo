import { fetchJourney } from './api';

// The path and the Read tab show the same data (every book with its chapters). It is kept here
// after the first load so switching between them is instant and the server is asked only once
// per language until the app is restarted.
const journeyCache = {};

export const peekJourney = (lang) => journeyCache[lang] ?? null;

export async function loadJourney(lang) {
  const data = await fetchJourney(lang);
  journeyCache[lang] = data;
  return data;
}
