// Match exercises store their pairs in more than one shape:
//   { target: "la vie", native: "life" }   (what the generator writes)
//   { fr: "la vie", en: "life" }           (the hand-written John 1 lesson)
// This turns either into { target, native } so the screen only deals with one shape.
export function normalizePair(pair, lang) {
  const target = pair.target ?? pair[lang] ?? pair.fr ?? pair.es ?? '';
  const native = pair.native ?? pair.en ?? '';
  return { target, native };
}
