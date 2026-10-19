"""
Builds the vocabulary files used by the "Key Words" step of every chapter.

For each chapter and language it:
  1. reads the chapter's verses from the database,
  2. lists the content words (no "le", "et", "de"... and no names),
  3. keeps only words that are ALSO common in everyday French/Spanish
     (looked up in the `wordfreq` frequency list), so learners study useful words,
     not rare biblical ones,
  4. ranks them by how often they occur in the chapter,
  5. translates the best ones to English once with Google Translate (cached on disk),
  6. writes backend/app/vocab_data/vocab_<lang>.json.

Run from the backend folder (venv active). One-time setup:  pip install wordfreq

  python -m app.build_vocab --dry-run --books John     # shows the chosen words; no Google, no files
  python -m app.build_vocab --books John               # build John (translates with Google)
  python -m app.build_vocab                            # all books, French + Spanish
  python -m app.build_vocab --refresh --books John     # redo chapters that are already in the file

Chapters already in the file are skipped, so your hand edits to the JSON are kept.
Then run `python -m app.generate_lessons` to turn the words into Key Words lessons.
"""
import argparse
import json
from pathlib import Path

from app.generate_lessons import STOPWORDS, WORD_RE, clean, strip_accents, verse_triples
from app.services.vocab_store import entries_for, load_vocab, save_vocab, set_entries

DEFAULT_MIN_ZIPF = 3.0  # Zipf scale: 3 = about 1 use per million words, 5 = very common

# Words that should never become vocabulary (compared without accents, lowercase).
# Add any name or word you don't want learners to study.
EXCLUDE_WORDS = {
    "jesus", "christ", "cristo",
}


# ---------------------------------------------------------------- choosing words (pure, testable)

def base_form(token):
    """Drop French elision: l'homme -> homme, qu'il -> il (too short, dropped later)."""
    for mark in ("'", "’"):
        if mark in token:
            return token.split(mark)[-1]
    return token


def select_candidates(lang, verses, n, min_zipf, zipf):
    """
    Words that appear in this chapter AND are common in the language.

    verses: [(verse_number, target_text, english_text)]
    zipf:   function(word, lang) -> frequency score (higher = more common)
    Returns [(word, count_in_chapter, zipf_score)], best first.
    """
    stop = STOPWORDS[lang]
    count, caps, total = {}, {}, {}
    for _, target, _ in verses:
        for i, m in enumerate(WORD_RE.finditer(target)):
            raw = m.group()
            word = base_form(raw).lower()
            if len(word) < 4 or word in stop or strip_accents(word) in EXCLUDE_WORDS:
                continue
            total[word] = total.get(word, 0) + 1
            count[word] = count.get(word, 0) + 1
            if i > 0 and raw[0].isupper():
                caps[word] = caps.get(word, 0) + 1  # capitalised mid-sentence: probably a name

    scored = []
    for word, c in count.items():
        if caps.get(word) and caps[word] == total[word]:
            continue  # always capitalised -> a name (Jean, Jérusalem)
        z = zipf(word, lang)
        if z >= min_zipf:
            scored.append((word, c, round(z, 2)))
    scored.sort(key=lambda t: (-t[1], -t[2], t[0]))
    return scored[:n]


def usable_translations(candidates, translations, keep):
    """
    Pair each candidate with its English translation and drop the bad ones:
    echoes (translation is the same word, e.g. a name) and duplicates (two words meaning
    the same thing would make a trick question).
    """
    out, seen = [], set()
    for word, count, z in candidates:
        english = translations.get(word, "")
        if not english or strip_accents(english.lower()) == strip_accents(word.lower()):
            continue
        if english.lower() in seen:
            continue
        seen.add(english.lower())
        out.append({"word": word, "translation": english, "zipf": z, "count": count})
        if len(out) == keep:
            break
    return out


# ---------------------------------------------------------------- Google Translate

class Translator:
    """Translate single words to English, with a disk cache and a character budget."""

    def __init__(self, max_chars, cache_path=".translate_cache.json"):
        self.max_chars = max_chars
        self.used = 0
        self.path = Path(cache_path)
        self.cache = json.loads(self.path.read_text("utf-8")) if self.path.exists() else {}
        self._client = None

    def _get_client(self):
        if self._client is None:
            from google.cloud import translate_v2 as translate
            from app.config import settings

            creds = settings.google_application_credentials
            self._client = (translate.Client.from_service_account_json(creds)
                            if creds else translate.Client())
        return self._client

    def many(self, lang, words):
        todo = [w for w in words if f"{lang}:{w}" not in self.cache]
        if todo:
            chars = sum(len(w) for w in todo)
            if self.used + chars > self.max_chars:
                raise RuntimeError(
                    f"Character budget reached ({self.used}+{chars} > {self.max_chars}). "
                    "Raise --max-chars if you really want to continue."
                )
            result = self._get_client().translate(
                todo, source_language=lang, target_language="en", format_="text"
            )
            for w, r in zip(todo, result):
                self.cache[f"{lang}:{w}"] = clean(r["translatedText"]).lower()
            self.used += chars
            self.path.write_text(json.dumps(self.cache, ensure_ascii=False, indent=1), "utf-8")
        return {w: self.cache[f"{lang}:{w}"] for w in words}


# ---------------------------------------------------------------- main

def get_zipf():
    try:
        from wordfreq import zipf_frequency
    except ImportError:
        raise SystemExit("This needs the frequency list package. Run:  pip install wordfreq")
    return zipf_frequency


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--books", nargs="*", help='book names, e.g. John "1 John" (default: all)')
    ap.add_argument("--langs", nargs="*", default=["fr", "es"], choices=["fr", "es"])
    ap.add_argument("--dry-run", action="store_true", help="show chosen words; no Google calls, no files written")
    ap.add_argument("--refresh", action="store_true", help="redo chapters that are already in the file")
    ap.add_argument("--min-zipf", type=float, default=DEFAULT_MIN_ZIPF, help="how common a word must be (default 3.0)")
    ap.add_argument("--per-chapter", type=int, default=10, help="words to keep per chapter (default 10)")
    ap.add_argument("--max-chars", type=int, default=150000, help="Google Translate character budget for this run")
    args = ap.parse_args()

    zipf = get_zipf()
    from app.database import SessionLocal
    from app.models import Book, Chapter, Verse

    db = SessionLocal()
    query = db.query(Book).order_by(Book.order)
    if args.books:
        wanted = {b.lower() for b in args.books}
        books = [b for b in query.all() if b.name.lower() in wanted]
    else:
        books = query.all()
    if not books:
        raise SystemExit("No matching books found. Did you run `python -m app.import_gospels`?")

    translator = None if args.dry_run else Translator(args.max_chars)
    files = {lang: load_vocab(lang) for lang in args.langs}
    built = skipped = short = 0

    try:
        for book in books:
            chapters = db.query(Chapter).filter(Chapter.book_id == book.id).order_by(Chapter.chapter_number).all()
            for ch in chapters:
                all_verses = db.query(Verse).filter(Verse.chapter_id == ch.id).all()
                for lang in args.langs:
                    if entries_for(files[lang], book.name, ch.chapter_number) and not args.refresh:
                        skipped += 1
                        continue
                    verses = verse_triples(all_verses, lang)
                    candidates = select_candidates(lang, verses, args.per_chapter + 8, args.min_zipf, zipf)
                    label = f"{book.name} {ch.chapter_number} [{lang}]"

                    if args.dry_run:
                        shown = ", ".join(f"{w} (x{c}, z{z})" for w, c, z in candidates[:args.per_chapter])
                        print(f"  {label}: {shown or 'no common words found'}")
                        continue

                    words = [w for w, _, _ in candidates]
                    entries = usable_translations(candidates, translator.many(lang, words) if words else {}, args.per_chapter)
                    set_entries(files[lang], book.name, ch.chapter_number, entries)
                    built += 1
                    if len(entries) < 5:
                        short += 1
                        print(f"  {label}: only {len(entries)} usable words (too few for a Key Words lesson)")
                    else:
                        print(f"  {label}: {len(entries)} words")
            if not args.dry_run:  # save after every book so an interruption loses little
                for lang in args.langs:
                    save_vocab(lang, files[lang])
    finally:
        db.close()

    if args.dry_run:
        print("\nDry run: nothing written, no Google calls made.")
        return
    print(f"\nBuilt {built} chapter word lists ({short} with fewer than 5 words), skipped {skipped} already in the files.")
    print(f"Google Translate characters used this run: {translator.used}")
    print("Files are in backend/app/vocab_data/. Next: python -m app.generate_lessons")


if __name__ == "__main__":
    main()
