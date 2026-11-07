"""
Builds the data the path screen needs: 27 units (one per book), each with one level per chapter,
and for every level the ids of its three steps.

Pure functions only (no FastAPI, no database session), so the logic is easy to test.
"""
from app.services.bible_import import NEW_TESTAMENT, local_book_name

# Generated lessons are tagged by their `order` number. Hand-written lessons use small numbers.
VOCAB_ORDER = 90      # "Key Words" step
PRACTICE_ORDER = 91   # "Verse Practice" step

# English is taught in the learner's language, so its lesson step has one lesson per language.
ENGLISH_ORDERS = {"es": 92, "fr": 93}


def build_journey(lang, books, chapters, lessons, text_chapter_ids, practice_order=PRACTICE_ORDER):
    """
    lang               'fr' | 'es' | 'en'
    books              rows with .id .name
    chapters           rows with .id .book_id .chapter_number
    lessons            rows with .id .chapter_id .order  (already limited to this language)
    text_chapter_ids   set of chapter ids that have verses in this language
    practice_order     which lesson is the lesson step (see ENGLISH_ORDERS)

    Always returns all 27 books, in Bible order. A book that hasn't been imported yet comes back
    with no levels and available=False, so the app can show it as "coming soon".
    """
    book_by_name = {b.name: b for b in books}

    chapters_by_book = {}
    for c in chapters:
        chapters_by_book.setdefault(c.book_id, []).append(c)

    lesson_ids = {}  # chapter_id -> {order: lesson_id}
    for lesson in lessons:
        lesson_ids.setdefault(lesson.chapter_id, {})[lesson.order] = lesson.id

    units = []
    for name, _code, order, chapter_count in NEW_TESTAMENT:
        book = book_by_name.get(name)
        rows = sorted(chapters_by_book.get(book.id, []), key=lambda c: c.chapter_number) if book else []
        levels = []
        for c in rows:
            ids = lesson_ids.get(c.id, {})
            levels.append({
                "chapter_id": c.id,
                "chapter_number": c.chapter_number,
                "vocab_lesson_id": ids.get(VOCAB_ORDER),
                "practice_lesson_id": ids.get(practice_order),
                "has_text": c.id in text_chapter_ids,
            })
        units.append({
            "book_id": book.id if book else None,
            "name": name,
            "display_name": local_book_name(name, lang),
            "order": order,
            "chapter_count": chapter_count,
            "available": any(l["has_text"] for l in levels),
            "levels": levels,
        })
    return {"lang": lang, "units": units}
