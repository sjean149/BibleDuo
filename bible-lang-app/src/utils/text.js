export function shuffle(items) {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Forgiving on case, punctuation and spacing, but strict on accents
// ("ete" is not "été"; that matters when you're learning French/Spanish).
export function normalize(value) {
  return String(value ?? '')
    .normalize('NFC')
    .toLowerCase()
    .replace(/[.,;:!?¡¿"«»“”]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}
