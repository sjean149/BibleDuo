from fastapi import Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.config import settings
from app.database import Base, engine, get_db
from app.routers import auth, lessons, translate, verses, journey

# Dev convenience: auto-create tables if they don't exist.
# Swap for Alembic migrations once the schema stabilizes.
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Bible Language Learning API")

# Which websites may call the API from a browser (set ALLOWED_ORIGINS in production).
# The phone app isn't a website, so this doesn't affect it.
origins = [o.strip().rstrip("/") for o in settings.allowed_origins.split(",") if o.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins or ["*"],
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)

app.include_router(journey.router)
app.include_router(auth.router)
app.include_router(lessons.router)
app.include_router(translate.router)
app.include_router(verses.router)


@app.get("/health")
def health_check(db: Session = Depends(get_db)):
    """
    Also runs a tiny query, so the keep-awake ping (.github/workflows/keep-awake.yml) keeps the
    free Supabase database active too, and a broken database connection shows up here.
    """
    try:
        db.execute(text("SELECT 1"))
    except Exception:
        raise HTTPException(status_code=503, detail="Database unreachable")
    return {"status": "ok"}
