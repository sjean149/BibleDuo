"""
Reading and writing the vocabulary data files (backend/app/vocab_data/vocab_fr.json, vocab_es.json).

One file per language, shaped like this and safe to edit by hand:

    {
      "lang": "fr",
      "books": {
        "John": {
          "1": [
            {"word": "lumière", "translation": "light", "zipf": 4.5, "count": 6},
            ...
          ]
        }
      }
    }

`build_vocab` writes these files; `generate_lessons` reads them to make the Key Words lessons.
No database code and no third-party imports, so both can use it freely.
"""
import json
from pathlib import Path

VOCAB_DIR = Path(__file__).resolve().parent.parent / "vocab_data"


def vocab_path(lang: str) -> Path:
    return VOCAB_DIR / f"vocab_{lang}.json"


def load_vocab(lang: str) -> dict:
    """The whole file for one language, or an empty skeleton if it doesn't exist yet."""
    path = vocab_path(lang)
    if path.exists():
        return json.loads(path.read_text(encoding="utf-8"))
    return {"lang": lang, "books": {}}


def save_vocab(lang: str, data: dict) -> None:
    VOCAB_DIR.mkdir(parents=True, exist_ok=True)
    vocab_path(lang).write_text(json.dumps(data, ensure_ascii=False, indent=1), encoding="utf-8")


def entries_for(data: dict, book_name: str, chapter_number: int) -> list[dict]:
    """The word list for one chapter ([] if that chapter hasn't been built yet)."""
    return data.get("books", {}).get(book_name, {}).get(str(chapter_number), [])


def set_entries(data: dict, book_name: str, chapter_number: int, entries: list[dict]) -> None:
    data.setdefault("books", {}).setdefault(book_name, {})[str(chapter_number)] = entries
