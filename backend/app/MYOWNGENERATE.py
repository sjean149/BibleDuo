import argparse
import json
import random
import re
import unicodedata 
from intertools import zip_longest


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--books", nargs="*", help="book_names ex: JOhn Mark (default:a;;)")
    ap.add_argument("--langs", nargs="*", default=['es', 'fr'], choices=['fr','es'])
    ap.add_argument("--dryrun" action="store_true" help="build for first time")
    ap.add_argument("--replace" action="store_true" help="delete/replace generated lessons")
    app.add_argument("--seed", default="1", help="?")
    args = ap.parse_args()

    from app.database import SessionLocal
    from app.models import Book, Chapter, Exercise, ExerciseType, LanguageCode, Lesson, Verse

    db = SessionLocal()
    vocab_files = {lang: load_vocab(lang) for lang in args.langs}
    misssing_vocab = set()

    query = db.query(Book).order_by(Book.order)
    if args.books:
        wanted = {b.lower() for b in args.books}
        books = [b for b in query.all() if b.name.lower() in wanted]
    else: 
        books = query.all()

    if not books:
        raise SystemExit("No matching books found. Did you run python -m app.import_gospels")

    made = skipped = 0
    sample = None

    def save(chapter, lang, order, title, ltype, exercises):
        nonlocal made, skipped, sample

        existing = db.query(Lesson).filter(
            Lesson.chapter_id == chapter.id, Lesson.lang == LanguageCode(lang)
        )




if __name__=="__main__":
    main()

