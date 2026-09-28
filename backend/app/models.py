import enum

from sqlalchemy import (
    Column, Integer, String, ForeignKey, Boolean, Float, DateTime, Enum, JSON, Text
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.database import Base


class LanguageCode(str, enum.Enum):
    en = "en"
    fr = "fr"
    es = "es"


class LessonType(str, enum.Enum):
    vocab = "vocab"
    sentence = "sentence"
    reading = "reading"
    review = "review"


class ExerciseType(str, enum.Enum):
    multiple_choice = "multiple_choice"
    listen_select = "listen_select"
    speak = "speak"
    fill_blank = "fill_blank"
    reorder = "reorder"
    match = "match"
    true_false = "true_false"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True)
    google_sub = Column(String, unique=True, index=True, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    display_name = Column(String, nullable=True)
    target_language = Column(Enum(LanguageCode), default=LanguageCode.fr)

    streak_count = Column(Integer, default=0)
    xp = Column(Integer, default=0)
    hearts = Column(Integer, default=5)

    created_at = Column(DateTime(timezone=True), server_default=func.now())

    progress = relationship("UserProgress", back_populates="user")


class Book(Base):
    __tablename__ = "books"

    id = Column(Integer, primary_key=True)
    name = Column(String, nullable=False)       # e.g. "John"
    order = Column(Integer, nullable=False)      # order within NT

    chapters = relationship("Chapter", back_populates="book")


class Chapter(Base):
    __tablename__ = "chapters"

    id = Column(Integer, primary_key=True)
    book_id = Column(Integer, ForeignKey("books.id"), nullable=False)
    chapter_number = Column(Integer, nullable=False)

    book = relationship("Book", back_populates="chapters")
    verses = relationship("Verse", back_populates="chapter")
    lessons = relationship("Lesson", back_populates="chapter")


class Verse(Base):
    __tablename__ = "verses"

    id = Column(Integer, primary_key=True)
    chapter_id = Column(Integer, ForeignKey("chapters.id"), nullable=False)
    verse_number = Column(Integer, nullable=False)
    lang = Column(Enum(LanguageCode), nullable=False)
    text = Column(Text, nullable=False)
    audio_url = Column(String, nullable=True)

    chapter = relationship("Chapter", back_populates="verses")


class Word(Base):
    __tablename__ = "words"

    id = Column(Integer, primary_key=True)
    lemma = Column(String, nullable=False)        # target-language word, e.g. "lumière"
    lang = Column(Enum(LanguageCode), nullable=False)
    translation = Column(String, nullable=False)  # English gloss, e.g. "light"
    frequency_rank = Column(Integer, nullable=True)
    audio_url = Column(String, nullable=True)


class Lesson(Base):
    __tablename__ = "lessons"

    id = Column(Integer, primary_key=True)
    chapter_id = Column(Integer, ForeignKey("chapters.id"), nullable=False)
    lang = Column(Enum(LanguageCode), nullable=False)
    order = Column(Integer, nullable=False)
    title = Column(String, nullable=False)
    type = Column(Enum(LessonType), nullable=False)

    chapter = relationship("Chapter", back_populates="lessons")
    exercises = relationship("Exercise", back_populates="lesson", order_by="Exercise.order")


class Exercise(Base):
    __tablename__ = "exercises"

    id = Column(Integer, primary_key=True)
    lesson_id = Column(Integer, ForeignKey("lessons.id"), nullable=False)
    order = Column(Integer, nullable=False)
    type = Column(Enum(ExerciseType), nullable=False)

    # Flexible JSON payloads keep exercise shape data-driven rather than
    # requiring a new DB column every time you invent an exercise type.
    prompt = Column(JSON, nullable=False)
    answer = Column(JSON, nullable=False)

    lesson = relationship("Lesson", back_populates="exercises")


class UserProgress(Base):
    __tablename__ = "user_progress"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    lesson_id = Column(Integer, ForeignKey("lessons.id"), nullable=False)
    status = Column(String, default="not_started")  # not_started | in_progress | completed
    mastery_score = Column(Float, default=0.0)
    last_reviewed = Column(DateTime(timezone=True), nullable=True)

    user = relationship("User", back_populates="progress")


class SRSQueueItem(Base):
    __tablename__ = "srs_queue"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    word_id = Column(Integer, ForeignKey("words.id"), nullable=False)
    next_review_at = Column(DateTime(timezone=True), nullable=False)
    ease_factor = Column(Float, default=2.5)
    interval_days = Column(Integer, default=1)
