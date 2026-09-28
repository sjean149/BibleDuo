from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload

from app.auth import get_current_user
from app.database import get_db
from app.models import Book, Chapter, Lesson, Exercise, User, UserProgress
from app.schemas import BookOut, ChapterOut, LessonOut, ExerciseSubmission, ExerciseResult

router = APIRouter(tags=["lessons"])


@router.get("/books", response_model=list[BookOut])
def list_books(db: Session = Depends(get_db)):
    return db.query(Book).order_by(Book.order).all()


@router.get("/books/{book_id}/chapters", response_model=list[ChapterOut])
def list_chapters(book_id: int, lang: str = "fr", db: Session = Depends(get_db)):
    chapters = (
        db.query(Chapter)
        .filter(Chapter.book_id == book_id)
        .options(joinedload(Chapter.lessons))
        .order_by(Chapter.chapter_number)
        .all()
    )
    # Filter each chapter's lessons down to the requested language
    for ch in chapters:
        ch.lessons = [l for l in ch.lessons if l.lang == lang]
    return chapters


@router.get("/lessons/{lesson_id}", response_model=LessonOut)
def get_lesson(lesson_id: int, db: Session = Depends(get_db)):
    lesson = (
        db.query(Lesson)
        .options(joinedload(Lesson.exercises))
        .filter(Lesson.id == lesson_id)
        .first()
    )
    if lesson is None:
        raise HTTPException(status_code=404, detail="Lesson not found")
    return lesson


@router.post("/exercises/{exercise_id}/submit", response_model=ExerciseResult)
def submit_exercise(
    exercise_id: int,
    submission: ExerciseSubmission,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Simple grading for text-based exercise types (multiple_choice, fill_blank,
    reorder, true_false, match). Speech exercises are graded via a separate
    /speech/score endpoint (see services/speech.py) since they need audio bytes.
    """
    exercise = db.query(Exercise).filter(Exercise.id == exercise_id).first()
    if exercise is None:
        raise HTTPException(status_code=404, detail="Exercise not found")

    correct_answer = exercise.answer.get("value")
    is_correct = submission.user_answer == correct_answer

    if is_correct:
        current_user.xp += 10
    else:
        current_user.hearts = max(0, current_user.hearts - 1)
    db.commit()

    return ExerciseResult(correct=is_correct, correct_answer=correct_answer)
