from datetime import datetime
from typing import Any, Optional

from pydantic import BaseModel


class ExerciseOut(BaseModel):
    id: int
    order: int
    type: str
    prompt: dict[str, Any]
    answer: dict[str, Any]

    class Config:
        from_attributes = True


class LessonOut(BaseModel):
    id: int
    title: str
    type: str
    lang: str
    order: int
    exercises: list[ExerciseOut] = []

    class Config:
        from_attributes = True


class LessonSummaryOut(BaseModel):
    """Lightweight version for listing lessons in a chapter, no exercises."""
    id: int
    title: str
    type: str
    lang: str
    order: int

    class Config:
        from_attributes = True


class ChapterOut(BaseModel):
    id: int
    chapter_number: int
    lessons: list[LessonSummaryOut] = []

    class Config:
        from_attributes = True


class BookOut(BaseModel):
    id: int
    name: str
    order: int

    class Config:
        from_attributes = True


class GoogleAuthRequest(BaseModel):
    id_token: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class UserOut(BaseModel):
    id: int
    email: str
    display_name: Optional[str]
    target_language: str
    streak_count: int
    xp: int
    hearts: int

    class Config:
        from_attributes = True


class ExerciseSubmission(BaseModel):
    exercise_id: int
    user_answer: Any


class ExerciseResult(BaseModel):
    correct: bool
    correct_answer: Optional[Any] = None
