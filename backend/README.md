# Bible Language Learning: Backend

FastAPI backend for the French / Spanish / English Gospel-reading app. Data lives in
**PostgreSQL** (hosted on Supabase). Verse text covers Matthew, Mark, Luke and John in
World English Bible, Reina-Valera 1909 and Louis Segond 1910 (all public domain).

## Project structure

```
backend/
├── app/
│   ├── main.py              FastAPI app, registers the routers
│   ├── config.py            settings read from .env
│   ├── database.py          SQLAlchemy engine and session
│   ├── models.py            tables: Book, Chapter, Verse, Lesson, Exercise, User, ...
│   ├── schemas.py           request/response shapes
│   ├── auth.py              Google ID token check + our own JWT
│   ├── seed.py              loads hand-written lesson JSON from seed_data/
│   ├── import_gospels.py    downloads the Gospels and loads the verse text
│   ├── routers/
│   │   ├── auth.py          POST /auth/google, GET /auth/me
│   │   ├── lessons.py       books, chapters, lessons, exercise submit
│   │   ├── verses.py        GET /chapters/{id}/verses
│   │   └── translate.py     POST /translate
│   ├── services/
│   │   ├── bible_import.py  download, cache and parse Bible chapters
│   │   ├── translate.py     Google Cloud Translation client
│   │   └── usage_cap.py     daily character cap for translation
│   └── seed_data/           john_1_vocab_fr.json, john_1_vocab_es.json
├── requirements.txt
├── .env.example             template for your .env
├── .env                     YOUR secrets (never commit)
├── gcp-service-account.json Google key file (never commit)
└── .bible_cache/            downloaded Bible JSON (never commit)
```

Always run commands from inside the `backend` folder.

## 1. First-time setup

### Create the virtual environment

Git Bash:

```bash
python -m venv venv
source venv/Scripts/activate
pip install -r requirements.txt
```

PowerShell:

```powershell
python -m venv venv
venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

Your prompt should start with `(venv)`. **Every new terminal needs the activate line again**,
but you only install once (and again whenever `requirements.txt` changes).

`requirements.txt` must include `psycopg2-binary` (the Postgres driver) and
`google-cloud-translate`.

### Create the database (Supabase)

1. At supabase.com, create a new project and set a database password. Use **letters and
   numbers only**. Characters such as `@ : / ? # %` break the connection string unless they
   are URL-encoded.
2. Open the project and click **Connect** at the top. Copy the **Transaction pooler** URI
   (host ends in `pooler.supabase.com`, port `6543`).
3. Replace the password placeholder in that string with your real password. Remove any
   square brackets, they are placeholders and not part of the password.

Use the pooler string rather than the "direct connection" one. The direct host can fail on
networks without IPv6, and the pooler suits an app that opens a connection per request.

### Create your `.env`

```bash
cp .env.example .env        # PowerShell: copy .env.example .env
```

Then edit `.env`:

| Variable | What it is |
|---|---|
| `DATABASE_URL` | The Supabase pooler string from above |
| `JWT_SECRET_KEY` | Any long random string (used to sign login tokens) |
| `GOOGLE_CLIENT_ID` | OAuth client ID, needed only for Google Sign-In |
| `GOOGLE_APPLICATION_CREDENTIALS` | `./gcp-service-account.json`, the key file for translation |

**Check which database you're pointed at** (prints only the host, never the password):

```bash
python -c "from app.config import settings; print(settings.database_url.split('@')[-1])"
```

You should see a `...pooler.supabase.com:6543/postgres` host. If it prints
`sqlite:///./app.db`, your `.env` isn't being read. The app silently falls back to a local
SQLite file when `DATABASE_URL` is missing, so make sure you're in the `backend` folder and
the file is named exactly `.env`.

### Google Translate (for the Translate button)

1. In Google Cloud Console, create or choose a project and **enable the Cloud Translation API**
   (this needs a billing account; the free tier is 500,000 characters a month).
2. Create a **service account** with the role **Cloud Translation API User**, then create a
   **JSON key** for it.
3. Save the key as `backend/gcp-service-account.json`.

Free-trial accounts can't set Google-side quotas, so the backend enforces its own cap of
16,000 characters per day (`app/routers/translate.py`). It resets when the server restarts.

### Keep secrets out of git

`backend/.gitignore` must contain:

```
.env
gcp-service-account.json
.bible_cache/
venv/
__pycache__/
```

## 2. Load the data (once per database)

```bash
python -m app.seed               # the hand-written John 1 vocabulary lessons
python -m app.import_gospels     # all verse text for the four Gospels
```

The tables are created automatically on the first run of either command.

**Preview the verse import before running it.** This prints Matthew 1 in all three languages
and writes nothing:

```bash
python -m app.import_gospels --sample
```

Other options: `--list` shows the available translations; `--books John Mark` imports only
those books. The full import is safe to repeat. Downloads are cached and existing verses are
updated instead of duplicated.

### Editing a lesson file and reloading it

`seed.py` skips any lesson whose **title** is already in the database, so editing a JSON file
and re-running does nothing. Either change the lesson's title, or clear the lessons in the
Supabase **SQL Editor** (development only; this also deletes user progress):

```sql
TRUNCATE exercises, lessons RESTART IDENTITY CASCADE;
```

Then run `python -m app.seed` again. Verses and chapters are not affected.

### Changing the database structure

Tables are created with `create_all`, which **does not alter tables that already exist**.
Adding a column to `models.py` won't change Supabase. For now, add the column by hand in the
SQL Editor (`ALTER TABLE ... ADD COLUMN ...`). Once the schema settles, switch to Alembic
migrations.

## 3. Run the server

```bash
python -m uvicorn app.main:app --reload
```

Open **http://localhost:8000/docs** for interactive API docs. Stop the server with `Ctrl+C`.

To test from a phone on the same Wi-Fi, add `--host 0.0.0.0`:

```bash
python -m uvicorn app.main:app --reload --host 0.0.0.0
```

The Expo app runs separately (`npx expo start --web` in the app folder). Both need to be
running at once, in two terminals.

## 4. API

| Method | Path | Notes |
|---|---|---|
| GET | `/health` | `{"status": "ok"}` |
| GET | `/books` | The four Gospels |
| GET | `/books/{book_id}/chapters?lang=fr` | Chapters, with the lessons available in that language |
| GET | `/chapters/{chapter_id}/verses?lang=fr` | Verse text for one chapter |
| GET | `/lessons/{lesson_id}` | A lesson with all its exercises |
| POST | `/translate` | Body: `{"text": "...", "source_lang": "fr", "target_lang": "en"}` |
| POST | `/auth/google` | Exchange a Google ID token for our JWT |
| GET | `/auth/me` | Current user (needs the JWT) |
| POST | `/exercises/{id}/submit` | Server-side grading (needs the JWT) |

Quick check that everything works: `/books` returns four books, and
`/chapters/1/verses?lang=fr` returns verses.

## 5. Troubleshooting

| You see | Cause and fix |
|---|---|
| `No module named uvicorn` or `sqlalchemy` | The venv isn't active. Run the activate line. |
| `No module named app...` | Run from the `backend` folder, using `python -m app.something`. |
| `password authentication failed` | Wrong password, brackets left in the string, or special characters in the password. |
| `could not translate host name` / connection timeout | Use the pooler string (port 6543) instead of the direct one. |
| `/books` returns `[]` | Nothing was loaded into this database. Run the two load commands. |
| Seed prints `Skipping ...` | A lesson with that title already exists (see "Editing a lesson file"). |
| `Translation failed: ...` (502) | Google's message is included. Usual causes: key file path, API not enabled, billing not linked, missing role. |
| `Daily translation limit reached` (429) | The in-app cap was hit. Resets tomorrow or on server restart. |
| Import prints `FAILED ...` lines | Re-run the same command to retry just those chapters. |

## 6. Deploying (Render or similar)

- **Root directory:** `backend`
- **Build command:** `pip install -r requirements.txt`
- **Start command:** `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
- **Environment variables:** `DATABASE_URL`, `JWT_SECRET_KEY`, `GOOGLE_CLIENT_ID`
- **Google key file:** it can't go in git. Render has a "Secret Files" feature for uploading
  it; check Render's docs for the current steps, then point `GOOGLE_APPLICATION_CREDENTIALS`
  at the file's path.

Your Supabase database already holds the data, so a deploy doesn't need to re-run the load
commands. Notes: free Supabase projects can pause after a period of inactivity (the next
request fails until you unpause it in the dashboard), and free Render services sleep when
idle, so the first request after a break can be slow.

## 7. Known shortcuts

- Grading currently happens in the app, and lesson responses include the correct answers.
  Move grading to `POST /exercises/{id}/submit` and strip answers from the lesson response.
- Hearts and XP are not saved per user yet (Google Sign-In is built but not wired in).
- CORS allows every origin. Restrict it before production.
- Speech-to-Text (the `speak` exercise) and spaced repetition are not built.