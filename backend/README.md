# Bible Language Learning — Backend

FastAPI backend for the French/Spanish/English New Testament learning app.
Ships with SQLite for zero-setup local dev; swap to Postgres later by
changing one env var.

## Project structure

```
backend/
├── app/
│   ├── main.py            # FastAPI app + router registration
│   ├── config.py          # env var settings (pydantic-settings)
│   ├── database.py        # SQLAlchemy engine/session
│   ├── models.py          # ORM models: User, Book, Chapter, Lesson, Exercise, Word...
│   ├── schemas.py         # Pydantic request/response shapes
│   ├── auth.py             # Google ID token verification + our own JWT issuing
│   ├── seed.py             # loads hand-built lesson JSON into the DB
│   ├── routers/
│   │   ├── auth.py         # POST /auth/google, GET /auth/me
│   │   └── lessons.py      # GET /books, /books/{id}/chapters, /lessons/{id}, POST /exercises/{id}/submit
│   ├── services/            # (empty scaffold) speech.py + srs.py go here next
│   └── seed_data/
│       └── john_1_vocab_fr.json   # the hand-built lesson from our planning
├── requirements.txt
└── .env.example
```

## 1. Setup

```bash
cd backend
python -m venv venv
source venv/bin/activate          # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
```

For now you can leave `.env` mostly as-is (SQLite needs no config). You'll
fill in `GOOGLE_CLIENT_ID` once you set up Google Sign-In (Step 3 below).

## 2. Seed the database with the John 1 vocab lesson

```bash
python -m app.seed
```

This creates `app.db` (SQLite file) and loads the Book → Chapter → Lesson →
Exercises structure from `app/seed_data/john_1_vocab_fr.json` — the same
lesson we designed by hand, now sitting in a real database.

## 3. Run the API

```bash
uvicorn app.main:app --reload
```

Visit **http://localhost:8000/docs** — FastAPI's auto-generated Swagger UI.
Try it immediately without writing any client code:

```bash
# List books
curl http://localhost:8000/books

# List chapters (+ lessons) for book id 1, French track
curl "http://localhost:8000/books/1/chapters?lang=fr"

# Fetch the full lesson with exercises
curl http://localhost:8000/lessons/1
```

That last call is what your Expo app will hit to render a lesson screen.

## 4. Auth (Google Sign-In) — do this once the app skeleton exists

1. In Google Cloud Console, create OAuth 2.0 credentials (Web + iOS/Android
   client IDs as needed for Expo).
2. Put the **Web** client ID in `.env` as `GOOGLE_CLIENT_ID` — this is what
   the backend uses to verify tokens regardless of which platform the user
   signed in from.
3. From the Expo app, after Google Sign-In succeeds, POST the resulting
   `id_token` to `/auth/google`. The backend verifies it against Google,
   creates the user if new, and returns your own JWT.
4. Send that JWT as `Authorization: Bearer <token>` on subsequent requests
   (e.g. `/exercises/{id}/submit`, `/auth/me`).

## 5. What's NOT built yet (intentionally, per the phased plan)

- **Speech-to-Text scoring** — `services/speech.py` is scaffolded but empty.
  Add an endpoint that accepts uploaded audio, calls Google Cloud
  Speech-to-Text, and compares the transcript to the expected word/phrase.
- **SRS review queue** — `services/srs.py` scaffold; implement SM-2 style
  scheduling once the core lesson loop is proven in the app.
- **Automated content pipeline** — right now lessons are hand-written JSON
  (`seed_data/*.json`). Once you've hand-built a few more lessons and are
  confident in the format, build the spaCy-based generator to scale this up.
- **Postgres** — just change `DATABASE_URL` in `.env` and
  `pip install psycopg2-binary` is already in requirements.txt.

## Next step

Point an Expo app at `GET /lessons/1` and render the `multiple_choice` and
`fill_blank` exercises from the response. That's your first end-to-end
milestone (Step 5 from the project plan).
