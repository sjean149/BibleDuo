from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Chapter, Verse
from app.schemas import ChapterAudioOut, VerseOut

router = APIRouter(tags=["verses"])

# Which column holds the chapter recording for each language (filled by app.import_audio).
AUDIO_COLUMNS = {
    "es": Chapter.audio_url_es,
    "fr": Chapter.audio_url_fr,
    "en": Chapter.audio_url_en,
}


@router.get("/chapters/{chapter_id}/verses", response_model=list[VerseOut])
def get_verses(chapter_id: int, lang: str = "fr", db: Session = Depends(get_db)):
    return (
        db.query(Verse)
        .filter(Verse.chapter_id == chapter_id, Verse.lang == lang)
        .order_by(Verse.verse_number)
        .all()
    )


@router.get("/chapters/{chapter_id}/audio", response_model=ChapterAudioOut)
def get_chapter_audio(chapter_id: int, lang: str = "fr", db: Session = Depends(get_db)):
    """The chapter's recording in one language: {"audio_url": "https://..."} or {"audio_url": null}."""
    column = AUDIO_COLUMNS.get(lang)
    if column is None:
        raise HTTPException(status_code=400, detail="lang must be fr, es or en")
    # Select just this one column, so a language whose column hasn't been added yet can't break the others.
    row = db.query(column).filter(Chapter.id == chapter_id).first()
    if row is None:
        raise HTTPException(status_code=404, detail="Chapter not found")
    return {"audio_url": row[0]}
