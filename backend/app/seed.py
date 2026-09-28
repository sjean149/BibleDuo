"""
Loads hand-built lesson JSON files from app/seed_data/ into the database.

Run with:  python -m app.seed
"""
import json
from pathlib import Path

from app.database import Base, engine, SessionLocal
from app.models import Book, Chapter, Lesson, Exercise

SEED_DIR = Path(__file__).parent / "seed_data"


def load_lesson_file(db, file_path: Path):
    data = json.loads(file_path.read_text())

    # get_or_create Book
    book = db.query(Book).filter(Book.name == data["book"]["name"]).first()
    if book is None:
        book = Book(name=data["book"]["name"], order=data["book"]["order"])
        db.add(book)
        db.commit()
        db.refresh(book)

    # get_or_create Chapter
    chapter = (
        db.query(Chapter)
        .filter(
            Chapter.book_id == book.id,
            Chapter.chapter_number == data["chapter"]["chapter_number"],
        )
        .first()
    )
    if chapter is None:
        chapter = Chapter(book_id=book.id, chapter_number=data["chapter"]["chapter_number"])
        db.add(chapter)
        db.commit()
        db.refresh(chapter)

    # Create the Lesson (skip if a lesson with same title already loaded)
    existing = db.query(Lesson).filter(Lesson.title == data["lesson"]["title"]).first()
    if existing:
        print(f"Skipping '{data['lesson']['title']}' - already loaded")
        return

    lesson = Lesson(
        chapter_id=chapter.id,
        lang=data["lesson"]["lang"],
        order=data["lesson"]["order"],
        title=data["lesson"]["title"],
        type=data["lesson"]["type"],
    )
    db.add(lesson)
    db.commit()
    db.refresh(lesson)

    for ex in data["exercises"]:
        exercise = Exercise(
            lesson_id=lesson.id,
            order=ex["order"],
            type=ex["type"],
            prompt=ex["prompt"],
            answer=ex["answer"],
        )
        db.add(exercise)

    db.commit()
    print(f"Loaded lesson '{lesson.title}' with {len(data['exercises'])} exercises")


def main():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        for file_path in SEED_DIR.glob("*.json"):
            load_lesson_file(db, file_path)
    finally:
        db.close()


if __name__ == "__main__":
    main()
