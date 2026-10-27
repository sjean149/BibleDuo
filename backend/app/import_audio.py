"""
Links each chapter to its Spanish (Reina-Valera 1909) audio file in Supabase Storage.

The MP3s live in the public bucket RVA1909_NT_audio and are named like
    40_Mat001.mp3   ->  book 40 (Matthew), chapter 1
    58_Heb013.mp3   ->  book 58 (Hebrews), chapter 13
The number before the underscore is the book's position in the Bible, which is the
same number as Book.order in our database. The last three digits are the chapter.

For every file, this script saves the file's public URL in chapters.audio_url_es.
It does NOT download or copy any audio; the app will stream straight from Supabase.

Run from the backend folder with the venv active:

  python -m app.import_audio --check    list the bucket and show what WOULD be saved
                                        (writes nothing; do this first)
  python -m app.import_audio            save the URLs

Needs two lines in backend/.env (see env.example):
  SUPABASE_URL=https://phyciutjfkuekcqsqbyf.supabase.co
  SUPABASE_SERVICE_KEY=...   (Supabase dashboard > Project Settings > API Keys > secret / service_role)

Safe to run again: it only changes chapters whose URL is missing or different.
"""
import argparse
import json
import re
import urllib.error
import urllib.parse
import urllib.request

from app.config import settings

BUCKET = "RVA1909_NT_audio"
FOLDER = ""  # the files sit at the top of the bucket, not in a sub-folder
COLUMN = "audio_url_es"

# "40_Mat001.mp3" -> ("40", "Mat", "001").  The middle part can be "1Co", "Heb", ...
FILE_NAME = re.compile(r"^(\d{1,2})_([0-9A-Za-z]+?)(\d{3})\.mp3$", re.IGNORECASE)


# ---------------------------------------------------------------- step 1: ask Supabase for the file list


def _storage_headers() -> dict:
    key = settings.supabase_service_key
    if not settings.supabase_url or not key:
        raise SystemExit(
            "SUPABASE_URL and SUPABASE_SERVICE_KEY must be set in backend/.env.\n"
            "Find the key in the Supabase dashboard: Project Settings > API Keys."
        )
    headers = {"apikey": key, "Content-Type": "application/json"}
    if key.startswith("eyJ"):  # older JWT-style keys also go in the Authorization header
        headers["Authorization"] = f"Bearer {key}"
    return headers


def list_bucket() -> list[str]:
    """Every file name in the bucket folder. Supabase returns at most 1000 per request, so page through."""
    url = f"{settings.supabase_url.rstrip('/')}/storage/v1/object/list/{BUCKET}"
    headers = _storage_headers()
    names: list[str] = []
    offset, page = 0, 1000
    while True:
        body = json.dumps({
            "prefix": FOLDER,
            "limit": page,
            "offset": offset,
            "sortBy": {"column": "name", "order": "asc"},
        }).encode("utf-8")
        request = urllib.request.Request(url, data=body, headers=headers, method="POST")
        try:
            with urllib.request.urlopen(request, timeout=30) as response:
                items = json.loads(response.read().decode("utf-8"))
        except urllib.error.HTTPError as err:
            detail = err.read().decode("utf-8", "replace")
            raise SystemExit(f"Supabase refused the file list ({err.code}): {detail}")
        # Sub-folders come back as entries with no id; we only want real files.
        names += [item["name"] for item in items if item.get("id")]
        if len(items) < page:
            return names
        offset += page


def public_url(file_name: str) -> str:
    """The same link you get from 'Get URL' in the Supabase dashboard (the bucket is public)."""
    path = f"{FOLDER}/{file_name}" if FOLDER else file_name
    return f"{settings.supabase_url.rstrip('/')}/storage/v1/object/public/{BUCKET}/{urllib.parse.quote(path)}"


# ---------------------------------------------------------------- step 2: turn file names into (book, chapter)


def parse_files(names: list[str]) -> tuple[dict[tuple[int, int], str], list[str]]:
    """Returns ({(book_order, chapter): file_name}, [names that don't fit the pattern])."""
    by_key: dict[tuple[int, int], str] = {}
    skipped: list[str] = []
    for name in names:
        match = FILE_NAME.match(name)
        if not match:
            skipped.append(name)
            continue
        by_key[(int(match.group(1)), int(match.group(3)))] = name
    return by_key, skipped


# ---------------------------------------------------------------- step 3: make sure the column exists


def ensure_column(engine, write: bool) -> bool:
    """
    create_all() never adds columns to a table that already exists, so a database made before
    audio_url_es was added to models.py won't have it. Add it (only on a real run).
    """
    from sqlalchemy import inspect, text

    columns = {c["name"] for c in inspect(engine).get_columns("chapters")}
    if COLUMN in columns:
        return True
    if not write:
        print(f"Note: the chapters table has no {COLUMN} column yet. The real run will add it.")
        return False
    with engine.begin() as conn:
        conn.execute(text(f"ALTER TABLE chapters ADD COLUMN {COLUMN} VARCHAR"))
    print(f"Added the missing {COLUMN} column to the chapters table.")
    return True


# ---------------------------------------------------------------- step 4: save a URL on each matching chapter


def run(write: bool) -> None:
    from sqlalchemy import literal, update

    from app.database import SessionLocal, engine
    from app.models import Book, Chapter

    print(f"Listing files in the '{BUCKET}' bucket...")
    names = list_bucket()
    files, skipped = parse_files(names)
    print(f"  {len(names)} files, {len(files)} named like 40_Mat001.mp3\n")

    has_column = ensure_column(engine, write)

    db = SessionLocal()
    changed = unchanged = 0
    no_file: list[str] = []
    try:
        # Ask only for the columns we need, so --check still works before the column exists.
        current_url = getattr(Chapter, COLUMN) if has_column else literal(None)
        rows = (
            db.query(Chapter.id, Chapter.chapter_number, Book.name, Book.order, current_url)
            .join(Book, Chapter.book_id == Book.id)
            .order_by(Book.order, Chapter.chapter_number)
            .all()
        )
        known = set()
        for chapter_id, chapter_number, book_name, book_order, current in rows:
            key = (book_order, chapter_number)
            known.add(key)
            file_name = files.get(key)
            if file_name is None:
                no_file.append(f"{book_name} {chapter_number}")
                continue
            url = public_url(file_name)
            if current == url:
                unchanged += 1
                continue
            changed += 1
            if write:
                db.execute(update(Chapter).where(Chapter.id == chapter_id).values({COLUMN: url}))
            elif changed <= 5:  # a few examples so you can open one in the browser
                print(f"  {book_name} {chapter_number}  ->  {url}")
        if write:
            db.commit()  # one commit: either every URL is saved or none are
    finally:
        db.close()

    # Group leftover files by book so a missing book is one line, not 28: "44_Act (28 files)"
    leftover: dict[str, int] = {}
    for key, name in sorted(files.items()):
        if key not in known:
            book_part = FILE_NAME.match(name)
            label = f"{book_part.group(1)}_{book_part.group(2)}"
            leftover[label] = leftover.get(label, 0) + 1
    no_chapter = [f"{label} ({count} files)" for label, count in leftover.items()]

    print("\n=== Summary ===")
    print(f"{'Saved' if write else 'Would save'}: {changed}   already correct: {unchanged}")
    if no_file:
        print(f"\n{len(no_file)} chapters in the database have no audio file:")
        print("  " + ", ".join(no_file[:40]) + (" ..." if len(no_file) > 40 else ""))
    if no_chapter:
        print(f"\nThese files match no chapter in the database (run app.import_gospels for those books first?):")
        print("  " + ", ".join(no_chapter))
    if skipped:
        print(f"\n{len(skipped)} files were ignored because their names don't fit the pattern:")
        print("  " + ", ".join(skipped[:40]))
    if not write:
        print("\nNothing was written. Open one of the links above to check it plays, then run without --check.")


def main() -> None:
    parser = argparse.ArgumentParser(description="Save each chapter's Spanish audio URL from Supabase Storage.")
    parser.add_argument("--check", action="store_true", help="show what would be saved; write nothing")
    args = parser.parse_args()
    run(write=not args.check)


if __name__ == "__main__":
    main()
