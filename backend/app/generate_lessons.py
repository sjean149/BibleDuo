"""Generate practice lessons for every chapter from the verses already in the database.

Run from the backend/ folder (venv active):

    python -m app.generate_lessons --dry-run --books John       # preview, writes nothing
    python -m app.generate_lessons --books John                 # write John's lessons
    python -m app.generate_lessons                              # all books, Spanish + French + English
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

The lesson step teaches a grammar rule instead of only quizzing (the practice above is the fallback
when no rule fits a chapter). Each chapter teaches one rule from its language's curriculum
(grammar_es.py, grammar_fr.py, grammar_en.py), Mimo style.
The teaching sits on top of the questions (prompt["teach"]), so it is read on the same screen:

  * multiple_choice  a quick concept check under an explanation, and "which word is the rule?"
  * fill_blank       the rule's word blanked out of a verse; the options are its other forms
  * review           two blanks from the previous rule, so rules keep coming back
  * comprehension    translate-a-verse and true/false questions about the passage, mixed in

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

LANG_NAMES = {"fr": "French", "es": "Spanish", "en": "English"}

# Book names per language (John -> Juan) live in services/bible_import.py so that the
# importer, this script and the API all agree on them.
from app.services.bible_import import local_book_name  # noqa: E402
from app.services.journey import PRACTICE_ORDER, VOCAB_ORDER  # noqa: E402
from app.services.vocab_store import entries_for, load_vocab  # noqa: E402
from app import grammar_en, grammar_es, grammar_fr  # noqa: E402

# Each language's grammar curriculum (one rule per chapter, cycling through the rules).
CURRICULA = {"es": grammar_es, "fr": grammar_fr, "en": grammar_en}

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


# ---------------------------------------------------------------- grammar lessons (learn, then practice)

def rule_hits(rule, verse, known, verb_endings=()):
    """
    Where a verse uses the rule: a list of {start, end, word, note, options, next}.
    The first word of a verse and capitalised words are skipped (capitals, names), and so are
    uses the rule's skip_next / pronoun_forms / verb_next_forms settings rule out (see grammar_es.py).
    verb_endings: the language's VERB_ENDINGS, used to guess whether the next word is a verb.
    """
    target = verse[1]
    tokens = list(WORD_RE.finditer(target))
    wants_next = ("{next}" in rule["example"] or rule.get("needs_next")
                  or rule.get("pronoun_forms") or rule.get("verb_next_forms") or rule.get("skip_next"))
    hits = []
    for i, m in enumerate(tokens):
        raw = m.group()
        if i == 0 or raw != raw.lower():
            continue
        nxt = tokens[i + 1].group() if i + 1 < len(tokens) else None
        found = rule["match"](raw, known) if "match" in rule else rule["forms"].get(raw)
        if not found or not found[1] or (wants_next and not nxt):
            continue
        before_verb = bool(verb_endings) and nxt is not None and nxt.lower().endswith(verb_endings)
        if nxt and nxt.lower() in rule.get("skip_next", ()):
            continue
        if raw in rule.get("pronoun_forms", ()) and (
                tokens[i - 1].group().lower() in rule.get("pronoun_prev", ()) or before_verb):
            continue
        if raw in rule.get("verb_next_forms", ()) and not before_verb:
            continue
        note, wrong = found
        hits.append({"start": m.start(), "end": m.end(), "word": raw, "note": note,
                     "options": wrong, "next": nxt})
    return hits


def is_rule_word(rule, word, known):
    return bool(rule["match"](word, known)) if "match" in rule else word in rule["forms"]


def grammar_fill(rule, ref_prefix, verse, hit, instruction=None):
    n, target, en = verse
    return {
        "type": "fill_blank",
        "prompt": {
            "text_with_blank": target[:hit["start"]] + "___" + target[hit["end"]:],
            "instruction": instruction or rule["fill"],
            "verse_ref": f"{ref_prefix}:{n}",
            "hint": en if en != target else None,  # an English lesson has no translation to show
            "rule": rule["id"],
        },
        "answer": {"value": hit["word"], "distractors": hit["options"]},
    }


def grammar_find(rng, rule, ref_prefix, verse, hit, known):
    """Show a verse and ask which of its words is the rule (the others are words from the same verse)."""
    n, target, _ = verse
    others = sorted({w for w in words(target)
                     if len(w) >= 3 and w == w.lower() and w != hit["word"] and not is_rule_word(rule, w, known)})
    if len(others) < 3:
        return None
    return {
        "type": "multiple_choice",
        "prompt": {"text": target, "instruction": rule["find"], "verse_ref": f"{ref_prefix}:{n}", "rule": rule["id"]},
        "answer": {"value": hit["word"], "distractors": rng.sample(others, 3)},
    }


def teach(title, body="", examples=(), kind="rule", **extra):
    """
    An explanation, shown above a question on the same screen (the question's prompt["teach"]).
    kind: rule (a full card), example (a verse from this chapter), tip (a one-line reminder).
    """
    block = {"kind": kind, "title": title, "body": body,
             "examples": [{"target": t, "native": n} for t, n in examples]}
    block.update(extra)
    return block


def with_teach(question, block):
    question["prompt"]["teach"] = block
    return question


def verse_card(ref_prefix, verse, start, end):
    n, target, en = verse
    return {"text": target, "translation": en if en != target else None,
            "ref": f"{ref_prefix}:{n}", "highlight": [start, end]}


def concept_check(check):
    return {
        "type": "multiple_choice",
        "prompt": {"text": check["question"], "instruction": "Quick check", "audio": False},
        "answer": {"value": check["answer"], "distractors": check["distractors"]},
    }


def build_grammar(rng, curriculum, rule_index, ref_prefix, verses, known, n_fill=4, n_review=2,
                  n_translate=2, n_true_false=2, n_reorder=2):
    """
    One rule's lesson for a chapter: (rule, exercises), or (None, []) if no rule fits the text.
    The chapter's own rule is rules[rule_index]; if fewer than 3 of its verses use it, the next
    rule is tried. Every grammar question carries its teaching on top (prompt["teach"]):

      check + card 1, blank + "in this chapter" verse, check + card 2, find + card 3,
      blanks + reminder, review blanks + reminder of the previous rule

    Comprehension questions about the passage (translate a verse, true or false) are mixed in
    after the opening explanations. An English lesson has no translation to ask about, so its
    comprehension questions put the words of a short verse back in order instead.

    curriculum: the language's grammar module (grammar_es, grammar_fr, grammar_en).
    """
    rules, endings = curriculum.RULES, curriculum.VERB_ENDINGS
    translated = any(v[1] != v[2] for v in verses)  # False for English: the verse is its own "translation"
    usable = [v for v in verses if 4 <= len(words(v[1])) <= 32 and len(words(v[2])) <= 45]
    for step in range(len(rules)):
        index = (rule_index + step) % len(rules)
        rule = rules[index]
        found = [(v, h) for v in usable if (h := rule_hits(rule, v, known, endings))]
        if len(found) >= 3:
            break
    else:
        return None, []

    rng.shuffle(found)
    used = set()
    example_verse, example_hits = found[0]
    used.add(example_verse[0])
    hit = example_hits[0]
    example = teach("In this chapter", rule["example"].format(word=hit["word"], note=hit["note"], next=hit["next"]),
                    kind="example", verse=verse_card(ref_prefix, example_verse, hit["start"], hit["end"]))

    find = None
    for v, hs in found[1:]:
        if len({h["word"] for h in hs}) == 1:
            find = grammar_find(rng, rule, ref_prefix, v, hs[0], known)
            if find:
                used.add(v[0])
                break

    fills = []
    for v, hs in found:
        if v[0] not in used and len(fills) < n_fill:
            fills.append(grammar_fill(rule, ref_prefix, v, rng.choice(hs)))
            used.add(v[0])

    # Two blanks from the rule before, so earlier rules keep coming back. The first rule has
    # nothing before it (wrapping round to the last rule would review one not taught yet).
    review = []
    previous = rules[index - 1]
    if index > 0:
        for v in usable:
            hs = rule_hits(previous, v, known, endings) if v[0] not in used else []
            if hs and len(review) < n_review:
                review.append(grammar_fill(previous, ref_prefix, v, rng.choice(hs),
                                           instruction=f"Review: {previous['fill']}"))
                used.add(v[0])

    def tip(r):
        return teach(r["title"], r["summary"], kind="tip")

    cards = [teach(c["title"], c["body"], c["examples"], rule_title=rule["title"]) for c in rule["cards"]]
    checks = [concept_check(c) for c in rule["checks"]]
    later_cards = cards[2:]  # explanations still to show once the checks have used theirs

    lesson = [with_teach(checks[0], cards[0])]
    if fills:
        lesson.append(with_teach(fills.pop(0), example))
    if len(checks) > 1:
        lesson.append(with_teach(checks[1], cards[1] if len(cards) > 1 else tip(rule)))
    elif len(cards) > 1:
        later_cards.insert(0, cards[1])
    for q in ([find] if find else []) + fills:
        lesson.append(with_teach(q, later_cards.pop(0) if later_cards else tip(rule)))

    # Comprehension questions about the passage (as in the verse practice), on verses the grammar
    # questions did not use. After the opening explanations, one comes after every two grammar questions.
    if translated:
        mc_pool = [v for v in verses if 5 <= len(words(v[1])) <= 22 and len(words(v[2])) <= 30]
        true_false = make_true_false(rng, ref_prefix, pick(rng, mc_pool, n_true_false, used), mc_pool)
        translate = make_translate(rng, ref_prefix, pick(rng, mc_pool, n_translate, used), mc_pool)
        comprehension = [q for pair in zip_longest(translate, true_false) for q in pair if q is not None]
    else:
        reorder_pool = [v for v in verses if 4 <= len(words(v[1])) <= 9]
        comprehension = make_reorder(rng, ref_prefix, pick(rng, reorder_pool, n_reorder, used))
        for q in comprehension:  # the "translation" would be the answer itself
            q["prompt"]["instruction"] = "Put the words of the verse in order"
            q["prompt"].pop("hint", None)

    mixed = lesson[:3]
    for i, q in enumerate(lesson[3:]):
        mixed.append(q)
        if i % 2 == 1 and comprehension:
            mixed.append(comprehension.pop(0))
    mixed += comprehension
    mixed += [with_teach(q, tip(previous)) for q in review]
    return rule, mixed


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
    ap.add_argument("--langs", nargs="*", default=["es", "fr", "en"], choices=["fr", "es", "en"])
    ap.add_argument("--dry-run", action="store_true", help="build and report, but write nothing")
    ap.add_argument("--replace", action="store_true", help="delete and rebuild generated lessons")
    ap.add_argument("--seed", default="1", help="change to get a different random selection")
    args = ap.parse_args()

    from app.database import SessionLocal
    from app.models import Book, Chapter, Exercise, ExerciseType, LanguageCode, Lesson, LessonType, Verse

    db = SessionLocal()
    vocab_files = {lang: load_vocab(lang) for lang in args.langs}
    missing_vocab = set()

    # Every word of the Bible in each language, so generated verb forms can be checked against real text.
    known = {lang: set() for lang in args.langs}
    for lang in args.langs:
        for (t,) in db.query(Verse.text).filter(Verse.lang == LanguageCode(lang)):
            known[lang].update(w.lower() for w in words(t))

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

                # Key Words come from the vocabulary file made by `python -m app.build_vocab`
                # (English has none: its words are already English).
                entries = entries_for(vocab_files[lang], book.name, ch.chapter_number)
                if entries:
                    kept = {e["word"]: e["translation"] for e in entries[:8]}
                    save(ch, lang, VOCAB_ORDER, f"{ref} - Key Words - {name}", "vocab", build_key_words(rng, kept))
                elif lang != "en":
                    missing_vocab.add(lang)

                # The chapter's grammar rule (rules cycle through the chapters of a book).
                curriculum = CURRICULA[lang]
                rule, exercises = build_grammar(rng, curriculum, (ch.chapter_number - 1) % len(curriculum.RULES),
                                                ref, verses, known[lang])
                if rule:
                    save(ch, lang, PRACTICE_ORDER, f"{ref} - Grammar: {rule['title']} - {name}",
                         "sentence", exercises)
                    continue
                if lang == "en":
                    continue  # verse practice is translation questions, which English can't have

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
