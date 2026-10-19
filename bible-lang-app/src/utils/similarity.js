// Helpers for judging what the speech recogniser heard against the sentence we asked for.

// Lowercase, strip accents and punctuation: "Lumière !" and "lumiere" compare equal.
export function loose(s) {
  return String(s ?? '')
    .toLowerCase()
    .replace(/œ/g, 'oe')
    .replace(/æ/g, 'ae')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/’/g, "'")
    .replace(/[^a-z0-9' ]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// Number of single-character edits (insert, delete, change) to turn a into b.
function levenshtein(a, b) {
  let prev = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    const row = [i];
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      row[j] = Math.min(prev[j] + 1, row[j - 1] + 1, prev[j - 1] + cost);
    }
    prev = row;
  }
  return prev[b.length];
}

// 1 = identical (ignoring accents/punctuation), 0 = nothing in common.
export function similarity(a, b) {
  const x = loose(a);
  const y = loose(b);
  if (!x && !y) return 1;
  if (!x || !y) return 0;
  return 1 - levenshtein(x, y) / Math.max(x.length, y.length);
}

// How close the spoken sentence must be to count as correct.
export const SPEAK_PASS_SCORE = 0.7;
