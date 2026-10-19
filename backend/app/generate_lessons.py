"""Generate practice lessons for every chapter from the verses already in the database.

Run from the backend/ folder (venv active):

    python -m app.generate_lessons --dry-run --books John       # preview, writes nothing
    python -m app.generate_lessons --books John                 # write John's lessons
    python -m app.generate_lessons                              # all books, French + Spanish
    python -m app.build_vocab --books John                      # (first) make the vocabulary files
    python -m app.generate_lessons --replace --books John       # delete + regenerate generated lessons

How it works
------------
Your database holds the same verse in en / fr / es, matched by verse number.
That is enough to build exercises with no hand-writing:

  * multiple_choice  verse in French/Spanish -> pick the English verse
  * fill_blank       one vocabulary word removed (never a name); answer.distractors is a word bank of 4
  * reorder          scrambled words of a short verse, with the English verse shown
  * true_false       "is this the correct English translation?" (half true, half mismatched)
  * speak            say a short verse aloud (app checks with speech recognition or self-rating)

A "Key Words" lesson is also built for every chapter that has an entry in the vocabulary
files (made by `python -m app.build_vocab`). It holds word -> English questions plus one
`match` exercise (5 word pairs).

The file has two halves: pure functions that build exercises (no database needed,
easy to test) and a small database part at the bottom.
"""

import argparse
import json
import random
import re
import unicodedata
from itertools import zip_longest

LANG_NAMES = {"fr": "French", "es": "Spanish"}

# Book names per language (John -> Juan) live in services/bible_import.py so that the
# importer, this script and the API all agree on them.
from app.services.bible_import import local_book_name  # noqa: E402
from app.services.journey import PRACTICE_ORDER, VOCAB_ORDER  # noqa: E402
from app.services.vocab_store import entries_for, load_vocab  # noqa: E402

# A "word" is letters, with an apostrophe or hyphen allowed inside (l'homme, peut-être).
WORD_RE = re.compile(r"[^\W\d_]+(?:['’\-][^\W\d_]+)*", re.UNICODE)

# Common function words. They make poor blanks and poor vocabulary.
STOPWORDS = {
    "fr": set(
        """le la les un une des du de d l au aux et ou mais donc car ni que qu qui quoi dont où
        ce cet cette ces ceci cela ça se sa son ses leur leurs mon ma mes ton ta tes notre nos votre vos
        je tu il elle on nous vous ils elles me te lui y en ne pas plus point
        à a as ai avons avez ont est es suis sommes êtes sont été être avoir fut était étaient sera seront
        dans par pour sur sous avec sans vers chez entre comme si aussi alors très tout tous toute toutes
        même ainsi voici voilà""".split()
    ),
    "es": set(
        """el la los las un una unos unas de del al y e o u pero ni que quien quienes cuyo donde
        este esta esto estos estas ese esa eso esos esas aquel aquella su sus mi mis tu tus nuestro nuestra
        yo tú él ella nosotros vosotros ellos ellas me te se lo le les nos os
        a en con por para sin sobre entre hasta desde como si no sí también muy todo todos toda todas
        es son era eran fue fueron ser sido está están estaba ha han había he hay habéis hemos
        mismo así aquí allí entonces cuando mientras porque pues""".split()
    ),
}


# ---------------------------------------------------------------- small helpers

def clean(text):
    """Collapse whitespace so verses from the API read as one tidy line."""
    return re.sub(r"\s+", " ", text or "").strip()


def words(text):
    return WORD_RE.findall(text)


def strip_accents(s):
    return "".join(c for c in unicodedata.normalize("NFD", s) if unicodedata.category(c) != "Mn")


def pick(rng, pool, k, used):
    """
    Choose up to k verses from pool that have not been used yet in this lesson.
    Never repeats a verse: if fewer than k fresh ones exist, you simply get fewer.
    """
    fresh = [p for p in pool if p[0] not in used]
    chosen = rng.sample(fresh, min(k, len(fresh)))
    used.update(p[0] for p in chosen)
    return chosen


# ---------------------------------------------------------------- exercise builders
# A "verse" below is a tuple: (verse_number, target_text, english_text)

def make_translate(rng, ref_prefix, chosen, mc_pool):
    """Target-language verse -> choose the English verse."""
    out = []
    for n, target, en in chosen:
        others = [p[2] for p in mc_pool if p[2] != en]
        if len(others) < 3:
            continue
        out.append({
            "type": "multiple_choice",
            "prompt": {
                "text": target,
                "instruction": "Select the English translation",
                "verse_ref": f"{ref_prefix}:{n}",
            },
            "answer": {"value": en, "distractors": rng.sample(others, 3)},
        })
    return out


def chapter_word_pool(lang, verses):
    """Lowercase content words of the chapter, usable as wrong options. Names are left out."""
    stop = STOPWORDS[lang]
    pool = {}
    for _, target, _ in verses:
        for i, m in enumerate(WORD_RE.finditer(target)):
            w = m.group()
            if (len(w) >= 4 and w.lower() not in stop and "'" not in w and "’" not in w
                    and not (i > 0 and w[0].isupper())):
                pool[w.lower()] = True
    return list(pool)


def fill_distractors(rng, answer, pool):
    """Three wrong options, preferring words of a similar length so length is no giveaway."""
    a = answer.lower()
    others = [w for w in pool if w != a]
    close = [w for w in others if abs(len(w) - len(a)) <= 2]
    source = close if len(close) >= 3 else others
    if len(source) < 3:
        return []
    picked = rng.sample(source, 3)
    return [w.capitalize() if answer[0].isupper() else w for w in picked]


def elision_base(token):
    """l'homme -> homme (the part after the last apostrophe); other tokens are returned as is."""
    for mark in ("'", "’"):
        if mark in token:
            return token.split(mark)[-1]
    return token


def blank_candidates(lang, target, vocab_words):
    """
    Words in this verse that may be blanked, as (start, end) positions in the text.
    With a vocabulary list only those words qualify. Names are never used: a word that is
    capitalised in the middle of a sentence is skipped.
    """
    stop = STOPWORDS[lang]
    spans = []
    for i, m in enumerate(WORD_RE.finditer(target)):
        raw = m.group()
        base = elision_base(raw)
        if i > 0 and raw[0].isupper():
            continue  # probably a name
        low = base.lower()
        if len(base) < 4 or low in stop:
            continue
        if vocab_words is not None and low not in vocab_words:
            continue
        spans.append((m.end() - len(base), m.end()))
    return spans


def make_fill_blank(rng, lang, ref_prefix, chosen, pool, vocab_words=None):
    """
    Blank out one word and give a word bank of 4 options plus the English hint.
    vocab_words: the chapter's vocabulary (lowercase set). The blank is always one of these
    words, and the wrong options come from the same list, so the exercise teaches the words.
    """
    out = []
    for n, target, en in chosen:
        spans = blank_candidates(lang, target, vocab_words)
        if not spans:
            continue
        start, end = rng.choice(spans)
        shown = target[start:end]
        answer = {"value": shown}
        verse_words = {w.lower() for w in words(target)}
        options = [w for w in (vocab_words or pool) if w.lower() != shown.lower() and w.lower() not in verse_words]
        if vocab_words is not None and len(options) < 3:  # tiny vocab list: top up from the chapter text
            options += [w for w in pool if w not in options and w.lower() != shown.lower() and w.lower() not in verse_words]
        distractors = fill_distractors(rng, shown, options)
        if distractors:  # without options the app falls back to typing the word
            answer["distractors"] = distractors
        out.append({
            "type": "fill_blank",
            "prompt": {
                "text_with_blank": target[:start] + "___" + target[end:],
                "instruction": "Fill in the blank",
                "verse_ref": f"{ref_prefix}:{n}",
                "hint": en,
            },
            "answer": answer,
        })
    return out


def make_reorder(rng, ref_prefix, chosen):
    """Scramble the words of a short verse. Punctuation is dropped so grading is fair."""
    out = []
    for n, target, en in chosen:
        tokens = words(target)
        shuffled = tokens[:]
        for _ in range(10):
            rng.shuffle(shuffled)
            if shuffled != tokens:
                break
        else:
            continue  # could not produce a different order
        out.append({
            "type": "reorder",
            "prompt": {
                # The English verse is part of the instruction so every screen shows it.
                "instruction": f"Put the words in order: \u201c{en}\u201d",
                "words": shuffled,
                "verse_ref": f"{ref_prefix}:{n}",
                "hint": en,
            },
            "answer": {"value": " ".join(tokens)},
        })
    return out


def make_true_false(rng, ref_prefix, chosen, pool):
    """Show a verse with an English line; the learner says whether it is the right translation."""
    flags = [True, False][:len(chosen)]
    rng.shuffle(flags)
    out = []
    for (n, target, en), is_true in zip(chosen, flags):
        shown = en
        if not is_true:
            others = [p[2] for p in pool if p[2] != en]
            if not others:
                continue
            shown = rng.choice(others)
        out.append({
            "type": "true_false",
            "prompt": {
                "text": target,
                "translation": shown,
                "instruction": "Is this the correct translation?",
                "verse_ref": f"{ref_prefix}:{n}",
            },
            "answer": {"value": is_true},
        })
    return out


def make_speak(ref_prefix, chosen):
    """Say a short verse aloud."""
    return [{
        "type": "speak",
        "prompt": {"text": target, "instruction": "Say this aloud",
                   "verse_ref": f"{ref_prefix}:{n}", "hint": en},
        "answer": {"value": target},
    } for n, target, en in chosen]


def build_practice(rng, lang, ref_prefix, verses, vocab_words=None,
                   n_translate=3, n_reorder=3, n_fill=3, n_true_false=2, n_speak=2):
    """
    Return the exercise list (without 'order') for one chapter's practice lesson.
    Every verse is used at most once in the lesson. The types that need the most specific
    kind of verse choose first (short verses for speaking and reordering, verses that contain
    a vocabulary word for fill-in-the-blank), and the general ones take what is left.
    """
    used = set()
    mc_pool = [v for v in verses if 5 <= len(words(v[1])) <= 22 and len(words(v[2])) <= 30]
    fill_pool = [v for v in verses
                 if 6 <= len(words(v[1])) <= 16 and blank_candidates(lang, v[1], vocab_words)]
    reorder_pool = [v for v in verses if 4 <= len(words(v[1])) <= 9]
    speak_pool = [v for v in verses if 3 <= len(words(v[1])) <= 8]
    word_pool = chapter_word_pool(lang, verses)

    reorder = make_reorder(rng, ref_prefix, pick(rng, reorder_pool, n_reorder, used))
    speak = make_speak(ref_prefix, pick(rng, speak_pool, n_speak, used))
    fill = make_fill_blank(rng, lang, ref_prefix, pick(rng, fill_pool, n_fill, used), word_pool, vocab_words)
    true_false = make_true_false(rng, ref_prefix, pick(rng, mc_pool, n_true_false, used), mc_pool)
    translate = make_translate(rng, ref_prefix, pick(rng, mc_pool, n_translate, used), mc_pool)

    # Interleave the types so the lesson doesn't feel repetitive; speaking goes last.
    mixed = []
    for group in zip_longest(translate, reorder, fill, true_false):
        mixed.extend(e for e in group if e is not None)
    return mixed + speak


def build_key_words(rng, translations):
    """translations: {word: english}. Word -> English multiple choice."""
    items = [(w, e) for w, e in translations.items() if e]
    out = []
    for w, e in items:
        others = [x[1] for x in items if x[1].lower() != e.lower()]
        if len(others) < 3:
            continue
        out.append({
            "type": "multiple_choice",
            "prompt": {"text": w, "instruction": "Select the English translation"},
            "answer": {"value": e, "distractors": rng.sample(others, 3)},
        })
    rng.shuffle(out)
    if len(items) >= 5:
        pairs = rng.sample(items, 5)
        out.append({
            "type": "match",
            "prompt": {"instruction": "Match each word to its English translation",
                       "pairs": [{"target": w, "native": e} for w, e in pairs]},
            "answer": {"value": "see pairs in prompt"},
        })
    return out


# ---------------------------------------------------------------- database part

def verse_triples(verses, lang):
    """Match target-language and English verses by verse number."""
    by = {lang: {}, "en": {}}
    for v in verses:
        code = getattr(v.lang, "value", v.lang)
        if code in by:
            by[code][v.verse_number] = clean(v.text)
    return [(n, by[lang][n], by["en"][n]) for n in sorted(by[lang]) if n in by["en"] and by[lang][n]]


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--books", nargs="*", help="book names, e.g. John Mark (default: all)")
    ap.add_argument("--langs", nargs="*", default=["fr", "es"], choices=["fr", "es"])
    ap.add_argument("--dry-run", action="store_true", help="build and report, but write nothing")
    ap.add_argument("--replace", action="store_true", help="delete and rebuild generated lessons")
    ap.add_argument("--seed", default="1", help="change to get a different random selection")
    args = ap.parse_args()

    from app.database import SessionLocal
    from app.models import Book, Chapter, Exercise, ExerciseType, LanguageCode, Lesson, LessonType, Verse

    db = SessionLocal()
    vocab_files = {lang: load_vocab(lang) for lang in args.langs}
    missing_vocab = set()

    query = db.query(Book).order_by(Book.order)
    if args.books:
        wanted = {b.lower() for b in args.books}
        books = [b for b in query.all() if b.name.lower() in wanted]
    else:
        books = query.all()
    if not books:
        raise SystemExit("No matching books found. Did you run `python -m app.import_gospels`?")

    made = skipped = 0
    sample = None

    def save(chapter, lang, order, title, ltype, exercises):
        nonlocal made, skipped, sample
        # Generated lessons always use order VOCAB_ORDER (Key Words) and PRACTICE_ORDER (Verse Practice), and the
        # hand-written ones use small numbers. Matching on order, not title, means renaming a
        # title later never creates duplicates.
        existing = db.query(Lesson).filter(
            Lesson.chapter_id == chapter.id, Lesson.lang == LanguageCode(lang), Lesson.order == order
        ).first()
        if existing and not args.replace:
            skipped += 1
            return
        if len(exercises) < 4:
            print(f"  {title}: only {len(exercises)} exercises, skipped")
            skipped += 1
            return
        for i, e in enumerate(exercises, 1):
            e["order"] = i
        if sample is None:
            sample = {"book": book.name, "chapter": chapter.chapter_number,
                      "lesson": {"lang": lang, "order": order, "title": title, "type": ltype},
                      "exercises": exercises}
        print(f"  {title}: {len(exercises)} exercises")
        made += 1
        if args.dry_run:
            return
        if existing:
            db.query(Exercise).filter(Exercise.lesson_id == existing.id).delete()
            db.delete(existing)
            db.flush()
        lesson = Lesson(chapter_id=chapter.id, lang=LanguageCode(lang), order=order,
                        title=title, type=LessonType(ltype))
        db.add(lesson)
        db.flush()
        for e in exercises:
            db.add(Exercise(lesson_id=lesson.id, order=e["order"], type=ExerciseType(e["type"]),
                            prompt=e["prompt"], answer=e["answer"]))

    for book in books:
        chapters = db.query(Chapter).filter(Chapter.book_id == book.id).order_by(Chapter.chapter_number).all()
        for ch in chapters:
            all_verses = db.query(Verse).filter(Verse.chapter_id == ch.id).all()
            for lang in args.langs:
                verses = verse_triples(all_verses, lang)
                if not verses:
                    continue
                rng = random.Random(f"{args.seed}-{ch.id}-{lang}")
                ref = f"{local_book_name(book.name, lang)} {ch.chapter_number}"
                name = LANG_NAMES[lang]

                # Key Words come from the vocabulary file made by `python -m app.build_vocab`.
                entries = entries_for(vocab_files[lang], book.name, ch.chapter_number)
                if entries:
                    kept = {e["word"]: e["translation"] for e in entries[:8]}
                    save(ch, lang, VOCAB_ORDER, f"{ref} - Key Words - {name}", "vocab", build_key_words(rng, kept))
                else:
                    missing_vocab.add(lang)

                # Blanks are taken from this chapter's vocabulary when it has one.
                vocab_words = {e["word"].lower() for e in entries} or None
                save(ch, lang, PRACTICE_ORDER, f"{ref} - Verse Practice - {name}", "sentence",
                     build_practice(rng, lang, ref, verses, vocab_words))
            if not args.dry_run:
                db.commit()

    db.close()
    verb = "Would create" if args.dry_run else "Created"
    print(f"\n{verb} {made} lessons, skipped {skipped}.")
    if missing_vocab:
        print(f"No Key Words for some chapters ({', '.join(sorted(missing_vocab))}): "
              "run `python -m app.build_vocab` first, then this again.")
    if args.dry_run and sample:
        print("\nSample lesson (same shape as your seed JSON):")
        print(json.dumps(sample, ensure_ascii=False, indent=2)[:4000])


if __name__ == "__main__":
    main()
