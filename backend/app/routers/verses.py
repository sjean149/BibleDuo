from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Verse
from app.schemas import VerseOut

router = APIRouter(tags=["verses"])


@router.get("/chapters/{chapter_id}/verses", response_model=list[VerseOut])
def get_verses(chapter_id: int, lang: str = "fr", db: Session = Depends(get_db)):
    return (
        db.query(Verse)
        .filter(Verse.chapter_id == chapter_id, Verse.lang == lang)
        .order_by(Verse.verse_number)
        .all()
    )
