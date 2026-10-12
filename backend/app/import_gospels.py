"""
Imports the four Gospels (WEB / RV1909 / LSG1910) into the verses table.

Run from the backend folder with the venv active:

  python -m app.import_gospels --list            show the translations the source offers
  python -m app.import_gospels --sample          fetch Matthew 1 in all 3 languages and PRINT it
                                                 (writes nothing; do this first)
  python -m app.import_gospels                   import all 4 Gospels in all 3 languages
  python -m app.import_gospels --books John      import just one book

Safe to run again: downloads are cached in backend/.bible_cache, and verses
that already exist are updated in place instead of duplicated.
"""
import argparse
from pathlib import Path

from app.services.bible_import import (
    GOSPELS,
    TRANSLATIONS,
    chapter_url,
    extract_verses,
    fetch_json,
    list_translations,
    resolve_translation,
)

CACHE_DIR = Path(__file__).resolve().parent.parent / ".bible_cache"


def resolve_all(translations: list[dict]) -> dict[str, dict]:
    chosen = {}
    for lang, (wanted_id, name_hint) in TRANSLATIONS.items():
        t = resolve_translation(translations, wanted_id, name_hint)
        chosen[lang] = t
        print(f"  {lang}: using '{t.get('id')}'  ({t.get('englishName') or t.get('name')})")
    return chosen


def cmd_list() -> None:
    wanted = ("english", "spanish", "french")
    for t in list_translations(CACHE_DIR):
        label = f"{t.get('languageName', '')} {t.get('languageEnglishName', '')} {t.get('language', '')}".lower()
        if any(w in label for w in wanted) or t.get("language") in ("eng", "spa", "fra"):
            print(f"{t.get('id'):<16} {t.get('englishName') or t.get('name')}")


def cmd_sample() -> None:
    print("Resolving translations...")
    chosen = resolve_all(list_translations(CACHE_DIR))
    for lang, t in chosen.items():
        data = fetch_json(chapter_url(t["id"], "MAT", 1), CACHE_DIR)
        verses = extract_verses(data)
        print(f"\n[{lang}] Matthew 1: {len(verses)} verses parsed (expect 25)")
        for number, text in verses[:3]:
            print(f"  {number}. {text}")
    print("\nIf the text above looks right in all three languages, run the full import.")


# ---------------------------------------------------------------- database part


def get_or_create_book(db, name: str, order: int):
    from app.models import Book

    book = db.query(Book).filter(Book.name == name).first()
    if book is None:
        book = Book(name=name, order=order)
        db.add(book)
        db.commit()
        db.refresh(book)
    return book


def get_or_create_chapter(db, book_id: int, chapter_number: int):
    from app.models import Chapter

    chapter = (
        db.query(Chapter)
        .filter(Chapter.book_id == book_id, Chapter.chapter_number == chapter_number)
        .first()
    )
    if chapter is None:
        chapter = Chapter(book_id=book_id, chapter_number=chapter_number)
        db.add(chapter)
        db.commit()
        db.refresh(chapter)
    return chapter


def save_verses(db, chapter_id: int, lang: str, verses: list[tuple[int, str]]) -> tuple[int, int]:
    """Insert new verses and update changed ones. Returns (added, updated)."""
    from app.models import Verse

    existing = {
        v.verse_number: v
        for v in db.query(Verse).filter(Verse.chapter_id == chapter_id, Verse.lang == lang)
    }
    added = updated = 0
    for number, text in verses:
        row = existing.get(number)
        if row is None:
            db.add(Verse(chapter_id=chapter_id, verse_number=number, lang=lang, text=text))
            added += 1
        elif row.text != text:
            row.text = text
            updated += 1
    db.commit()  # one commit per chapter: all-or-nothing, and far fewer round trips to Supabase
    return added, updated


def cmd_import(only_books: list[str] | None) -> None:
    from app.database import Base, SessionLocal, engine

    Base.metadata.create_all(bind=engine)

    print("Resolving translations...")
    chosen = resolve_all(list_translations(CACHE_DIR))

    books = [b for b in GOSPELS if not only_books or b[0].lower() in only_books]
    if not books:
        raise SystemExit(f"No matching books. Choose from: {', '.join(b[0] for b in GOSPELS)}")

    db = SessionLocal()
    seen: dict[tuple[str, int], dict[str, set[int]]] = {}  # (book, chapter) -> lang -> verse numbers
    totals = {lang: 0 for lang in chosen}
    failures: list[str] = []
    added_total = updated_total = 0

    try:
        for name, code, order, chapter_count in books:
            book = get_or_create_book(db, name, order)
            for chapter_number in range(1, chapter_count + 1):
                chapter = get_or_create_chapter(db, book.id, chapter_number)
                for lang, t in chosen.items():
                    label = f"{name} {chapter_number} [{lang}]"
                    try:
                        data = fetch_json(chapter_url(t["id"], code, chapter_number), CACHE_DIR)
                        verses = extract_verses(data)
                        added, updated = save_verses(db, chapter.id, lang, verses)
                    except Exception as err:  # keep going; report at the end
                        db.rollback()
                        failures.append(f"{label}: {err}")
                        print(f"  FAILED {label}: {err}")
                        continue
                    added_total += added
                    updated_total += updated
                    totals[lang] += len(verses)
                    seen.setdefault((name, chapter_number), {})[lang] = {n for n, _ in verses}
                print(f"  {name} {chapter_number} done")
    finally:
        db.close()

    print("\n=== Summary ===")
    print(f"Verses added: {added_total}   updated: {updated_total}")
    for lang, count in totals.items():
        print(f"  {lang}: {count} verses")

    # Cross-language check: every language should have the same verse numbers.
    mismatches = []
    for (book_name, chapter_number), by_lang in sorted(seen.items()):
        if len(by_lang) < 2:
            continue
        union = set().union(*by_lang.values())
        for lang, numbers in by_lang.items():
            missing = sorted(union - numbers)
            if missing:
                mismatches.append(f"{book_name} {chapter_number} [{lang}] lacks verses {missing}")
    if mismatches:
        print(f"\n{len(mismatches)} chapters differ between languages (translations number some verses differently):")
        for line in mismatches[:40]:
            print("  " + line)
        if len(mismatches) > 40:
            print(f"  ...and {len(mismatches) - 40} more")
    else:
        print("\nAll languages have identical verse numbers in every chapter.")

    if failures:
        print(f"\n{len(failures)} chapters failed. Re-run the same command to retry them:")
        for line in failures:
            print("  " + line)


def main() -> None:
    parser = argparse.ArgumentParser(description="Import the Gospels into the verses table.")
    parser.add_argument("--list", action="store_true", help="list available translations and exit")
    parser.add_argument("--sample", action="store_true", help="print Matthew 1 per language; write nothing")
    parser.add_argument("--books", nargs="+", help="only these books, e.g. --books John Mark")
    args = parser.parse_args()

    if args.list:
        cmd_list()
    elif args.sample:
        cmd_sample()
    else:
        cmd_import([b.lower() for b in args.books] if args.books else None)


if __name__ == "__main__":
    main()