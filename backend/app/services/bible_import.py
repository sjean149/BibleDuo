"""
Helpers for downloading and parsing Bible chapters.

Deliberately has NO database code, so the parsing can be tested on its own and
the download source can be swapped without touching anything else.
"""
import json
import time
import urllib.error
import urllib.request
from pathlib import Path

BASE_URL = "https://bible.helloao.org/api"

# (name in our database, book code used by the source, order in the Bible, chapter count)
# Orders 40-66 are the New Testament positions, so John stays 43 as before.
# The codes are the standard 3-character ones. Run `python -m app.import_gospels --check`
# to compare this table with what the source actually serves (it needs internet access).
NEW_TESTAMENT = [
    ("Matthew", "MAT", 40, 28),
    ("Mark", "MRK", 41, 16),
    ("Luke", "LUK", 42, 24),
    ("John", "JHN", 43, 21),
    ("Acts", "ACT", 44, 28),
    ("Romans", "ROM", 45, 16),
    ("1 Corinthians", "1CO", 46, 16),
    ("2 Corinthians", "2CO", 47, 13),
    ("Galatians", "GAL", 48, 6),
    ("Ephesians", "EPH", 49, 6),
    ("Philippians", "PHP", 50, 4),
    ("Colossians", "COL", 51, 4),
    ("1 Thessalonians", "1TH", 52, 5),
    ("2 Thessalonians", "2TH", 53, 3),
    ("1 Timothy", "1TI", 54, 6),
    ("2 Timothy", "2TI", 55, 4),
    ("Titus", "TIT", 56, 3),
    ("Philemon", "PHM", 57, 1),
    ("Hebrews", "HEB", 58, 13),
    ("James", "JAS", 59, 5),
    ("1 Peter", "1PE", 60, 5),
    ("2 Peter", "2PE", 61, 3),
    ("1 John", "1JN", 62, 5),
    ("2 John", "2JN", 63, 1),
    ("3 John", "3JN", 64, 1),
    ("Jude", "JUD", 65, 1),
    ("Revelation", "REV", 66, 22),
]
GOSPELS = NEW_TESTAMENT[:4]  # kept so older code that imports GOSPELS still works

# Book names as a learner of each language expects to see them (Louis Segond / Reina-Valera
# style). The database keeps the English name; screens and lesson titles use these.
LOCAL_BOOK_NAMES = {
    "Matthew": {"fr": "Matthieu", "es": "Mateo"},
    "Mark": {"fr": "Marc", "es": "Marcos"},
    "Luke": {"fr": "Luc", "es": "Lucas"},
    "John": {"fr": "Jean", "es": "Juan"},
    "Acts": {"fr": "Actes", "es": "Hechos"},
    "Romans": {"fr": "Romains", "es": "Romanos"},
    "1 Corinthians": {"fr": "1 Corinthiens", "es": "1 Corintios"},
    "2 Corinthians": {"fr": "2 Corinthiens", "es": "2 Corintios"},
    "Galatians": {"fr": "Galates", "es": "Gálatas"},
    "Ephesians": {"fr": "Éphésiens", "es": "Efesios"},
    "Philippians": {"fr": "Philippiens", "es": "Filipenses"},
    "Colossians": {"fr": "Colossiens", "es": "Colosenses"},
    "1 Thessalonians": {"fr": "1 Thessaloniciens", "es": "1 Tesalonicenses"},
    "2 Thessalonians": {"fr": "2 Thessaloniciens", "es": "2 Tesalonicenses"},
    "1 Timothy": {"fr": "1 Timothée", "es": "1 Timoteo"},
    "2 Timothy": {"fr": "2 Timothée", "es": "2 Timoteo"},
    "Titus": {"fr": "Tite", "es": "Tito"},
    "Philemon": {"fr": "Philémon", "es": "Filemón"},
    "Hebrews": {"fr": "Hébreux", "es": "Hebreos"},
    "James": {"fr": "Jacques", "es": "Santiago"},
    "1 Peter": {"fr": "1 Pierre", "es": "1 Pedro"},
    "2 Peter": {"fr": "2 Pierre", "es": "2 Pedro"},
    "1 John": {"fr": "1 Jean", "es": "1 Juan"},
    "2 John": {"fr": "2 Jean", "es": "2 Juan"},
    "3 John": {"fr": "3 Jean", "es": "3 Juan"},
    "Jude": {"fr": "Jude", "es": "Judas"},
    "Revelation": {"fr": "Apocalypse", "es": "Apocalipsis"},
}


def local_book_name(book_name: str, lang: str) -> str:
    """'John' -> 'Juan' for Spanish. English and unknown books keep the English name."""
    return LOCAL_BOOK_NAMES.get(book_name, {}).get(lang, book_name)


# our language code -> (preferred translation id, words to search for if that id is missing)
# All three are public domain. Run `python -m app.import_gospels --list` to see real ids.
TRANSLATIONS = {
    "en": ("eng_web", "World English Bible"),
    "es": ("spa_r09", "Reina Valera 1909"),
    "fr": ("fra_lsg", "Louis Segond"),
}


def fetch_json(url: str, cache_dir: Path, retries: int = 3) -> dict:
    """
    GET a URL and return parsed JSON. Responses are saved in cache_dir, so a
    second run reads from disk instead of hitting the server again.
    """
    cache_dir.mkdir(parents=True, exist_ok=True)
    cache_file = cache_dir / (url.replace("https://", "").replace("/", "_"))
    if cache_file.exists():
        return json.loads(cache_file.read_text(encoding="utf-8"))

    last_error = None
    for attempt in range(1, retries + 1):
        try:
            request = urllib.request.Request(url, headers={"User-Agent": "bible-lang-app-importer"})
            with urllib.request.urlopen(request, timeout=20) as response:
                body = response.read().decode("utf-8")
            data = json.loads(body)
            cache_file.write_text(body, encoding="utf-8")
            time.sleep(0.2)  # be polite to a free service
            return data
        except (urllib.error.URLError, TimeoutError, json.JSONDecodeError) as err:
            last_error = err
            time.sleep(attempt)  # wait a little longer after each failure
    raise RuntimeError(f"Could not fetch {url}: {last_error}")


def list_translations(cache_dir: Path) -> list[dict]:
    data = fetch_json(f"{BASE_URL}/available_translations.json", cache_dir)
    return data["translations"] if isinstance(data, dict) else data


def list_books(translation_id: str, cache_dir: Path) -> list[dict]:
    """The source's own list of books for one translation: [{'id': 'MAT', 'numberOfChapters': 28, ...}]."""
    data = fetch_json(f"{BASE_URL}/{translation_id}/books.json", cache_dir)
    return data["books"] if isinstance(data, dict) and "books" in data else data


def resolve_translation(translations: list[dict], wanted_id: str, name_hint: str) -> dict:
    """Use the configured id if it exists; otherwise fall back to a name search."""
    for t in translations:
        if t.get("id") == wanted_id:
            return t

    hint = name_hint.lower()
    matches = [
        t for t in translations
        if hint in f"{t.get('englishName', '')} {t.get('name', '')}".lower()
    ]
    if matches:
        return matches[0]
    raise RuntimeError(
        f"No translation with id '{wanted_id}' or name containing '{name_hint}'. "
        "Run with --list and edit TRANSLATIONS in services/bible_import.py."
    )


def _flatten(parts) -> list[str]:
    """Turn the pieces of one verse into plain strings, dropping footnote markers."""
    pieces = []
    for part in parts:
        if isinstance(part, str):
            pieces.append(part)
        elif isinstance(part, dict):
            if isinstance(part.get("text"), str):
                pieces.append(part["text"])
            elif part.get("lineBreak"):
                pieces.append(" ")
            # anything else (footnote references like {"noteId": 3}) is skipped
    return pieces


def extract_verses(data: dict) -> list[tuple[int, str]]:
    """
    Pull (verse_number, text) pairs out of one downloaded chapter.

    Expects:  {"chapter": {"content": [{"type": "verse", "number": 1, "content": [...]}, ...]}}
    Headings and other block types are ignored. Raises ValueError if the shape
    isn't what we expect, so a format change fails loudly instead of importing junk.
    """
    try:
        blocks = data["chapter"]["content"]
    except (KeyError, TypeError):
        keys = list(data.keys()) if isinstance(data, dict) else type(data).__name__
        raise ValueError(f"Unexpected response shape. Top-level keys: {keys}")

    by_number: dict[int, list[str]] = {}
    for block in blocks:
        if not isinstance(block, dict) or block.get("type") != "verse":
            continue
        number = block.get("number")
        if not isinstance(number, int):
            continue
        by_number.setdefault(number, []).extend(_flatten(block.get("content", [])))

    verses = []
    for number in sorted(by_number):
        text = " ".join(" ".join(by_number[number]).split())  # collapse extra whitespace
        if text:
            verses.append((number, text))

    if not verses:
        raise ValueError("Chapter parsed but contained no verses.")
    return verses


def chapter_url(translation_id: str, book_code: str, chapter_number: int) -> str:
    return f"{BASE_URL}/{translation_id}/{book_code}/{chapter_number}.json"
