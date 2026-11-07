from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Book, Chapter, Lesson, Verse
from app.services.journey import ENGLISH_ORDERS, PRACTICE_ORDER, VOCAB_ORDER, build_journey

router = APIRouter(tags=["journey"])


class LevelOut(BaseModel):
    chapter_id: int
    chapter_number: int
    vocab_lesson_id: Optional[int]
    practice_lesson_id: Optional[int]
    has_text: bool


class UnitOut(BaseModel):
    book_id: Optional[int]
    name: str
    display_name: str
    order: int
    chapter_count: int
    available: bool
    levels: list[LevelOut]


class JourneyOut(BaseModel):
    lang: str
    units: list[UnitOut]


@router.get("/journey", response_model=JourneyOut)
def get_journey(lang: str = "fr", base: Optional[str] = None, db: Session = Depends(get_db)):
    """
    Every book (unit) with its chapters (levels) and the ids of each level's three steps.
    base: the language an English learner speaks ("es" or "fr"), which picks their lessons.
    """
    if lang not in ("fr", "es", "en"):
        raise HTTPException(status_code=400, detail="lang must be fr, es or en")

    practice_order = ENGLISH_ORDERS.get(base, PRACTICE_ORDER) if lang == "en" else PRACTICE_ORDER

    books = db.query(Book).all()
    chapters = db.query(Chapter).all()
    lessons = (
        db.query(Lesson)
        .filter(Lesson.lang == lang, Lesson.order.in_([VOCAB_ORDER, practice_order]))
        .all()
    )
    text_ids = {row[0] for row in db.query(Verse.chapter_id).filter(Verse.lang == lang).distinct().all()}
    return build_journey(lang, books, chapters, lessons, text_ids, practice_order)
