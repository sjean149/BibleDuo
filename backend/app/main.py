from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import Base, engine
from app.routers import auth, lessons, translate, verses, journey

# Dev convenience: auto-create tables if they don't exist.
# Swap for Alembic migrations once the schema stabilizes.
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Bible Language Learning API")
app.include_router(journey.router)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # tighten before production
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(lessons.router)
app.include_router(translate.router)
app.include_router(verses.router)


@app.get("/health")
def health_check():
    
    return {"status": "ok"}
