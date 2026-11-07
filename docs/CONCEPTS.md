# Concepts behind the new BibleLingo features

A study list for understanding the grammar lessons, Google sign-in, backgrounds and characters.
Each concept says what it is in one line, where it's used in this repo, and what to practice.
Roughly in the order to learn them.

---

## 1. How a lesson is built (backend, Python)

**Data-driven content.** The grammar rules are *data* (a list of dictionaries), and one function
turns any rule into a lesson. Adding a rule means adding data, not writing new code.
- Where: `backend/app/grammar_es.py` (the rules), `build_grammar()` in `backend/app/generate_lessons.py`.
- Practice: add a 13th rule (for example "tener: to have") and run the dry run below.

**Python dictionaries, lists and tuples.** Every rule is a dict; `forms` maps a word to a
`(note, wrong_options)` tuple.
- Learn: dict access, `.get()`, list comprehensions, tuple unpacking (`note, wrong = found`).

**Regular expressions.** `WORD_RE` splits a verse into words, including accented letters.
`m.start()` and `m.end()` give each word's position so it can be blanked or highlighted.
- Learn: `re.finditer`, match objects, Unicode classes like `[^\W\d_]`.

**Heuristics vs. real language analysis.** The generator guesses grammar from word lists and
a few rules of thumb. "la" before a verb is treated as a pronoun, and "el cual" is skipped. A real
NLP tool (spaCy, Stanza) would tag parts of speech properly. Heuristics are simpler but sometimes wrong.
- Where: `rule_hits()`.
- Learn: what part-of-speech tagging and lemmatization are; try `spaCy` with `es_core_news_sm`.

**Checking generated forms against a corpus.** The past-tense rule only offers "hablaron" as a
wrong option if that word really appears somewhere in the Bible text (`known_es`).
- Learn: sets in Python and why `word in some_set` is fast.

**Seeded randomness.** `random.Random(f"{seed}-{chapter}-{lang}")` gives the same "random"
lesson every time you run the script, so re-running doesn't reshuffle everything.
- Learn: pseudo-random generators and seeds.

**Spaced review.** Each lesson ends with two questions from the *previous* rule, a small
version of spaced repetition.
- Learn: the spacing effect, Leitner boxes, SM-2 (your `SRSQueueItem` table is ready for this).

**Teach-then-test lesson design (Mimo/Duolingo style).** Short explanation, then try it right away,
then mixed practice, then a recap.
- Learn: retrieval practice, "worked examples", cognitive load.

## 2. Database (SQLAlchemy and Postgres)

**ORM models.** Python classes that map to tables (`Lesson`, `Exercise`).
- Where: `backend/app/models.py`.

**JSON columns.** `Exercise.prompt` and `Exercise.answer` are JSON, so the grammar teaching
rides along inside a question's prompt (`prompt.teach`) with no new columns or exercise types.
- Learn: when JSON columns are a good idea and when they aren't (you can't easily query inside them).

**Enums in Postgres.** `ExerciseType` is a native Postgres enum. Adding a value to the Python
enum is not enough: the database type must change too (`ALTER TYPE exercisetype ADD VALUE '...'`).
- Learn: database migrations and **Alembic** (the standard tool, worth adopting before the next schema change).

**Dry runs and environments.** `--dry-run` builds everything and writes nothing. `DATABASE_URL`
picks which database you touch: your `.env` points at the *live* Supabase database.
- Practice: `DATABASE_URL=sqlite:///./copy.db python -m app.generate_lessons --dry-run --books John --langs es`.

## 3. Sign-in (OAuth and tokens)

**OAuth 2.0 / OpenID Connect.** Google proves who the user is and gives the app an **ID token**
(a signed JWT containing their email and a stable id, `sub`).
- Learn: the difference between an *ID token* (who you are) and an *access token* (what you may do).

**Client IDs and audiences.** Each platform (web, iOS, Android) has its own Google client ID.
The token's `aud` field says which one it was issued for, and the backend only accepts the IDs it knows.
- Where: `verify_google_id_token()` in `backend/app/auth.py`, `CLIENT_IDS` in `bible-lang-app/src/auth/AuthContext.js`.

**Your own session token.** After checking Google's token, the backend issues *its own* JWT
(`create_access_token`) that the app sends as `Authorization: Bearer ...`.
- Learn: JWT structure (header, payload, signature), expiry, why secrets stay on the server.

**Authorized origins and redirect URIs.** Google only returns tokens to web addresses and app
schemes you registered in Google Cloud Console (`http://localhost:8081`, your Vercel URL, `biblelingo://`).
- Learn: what CORS is and why redirect allowlists exist.

**Public vs. secret config.** Anything named `EXPO_PUBLIC_...` is baked into the app and visible
to anyone. Client IDs are fine there; secrets (JWT key, service keys) never go there.

## 4. App (React Native and Expo)

**Components and props.** `TeachBlock`, `Mascot`, `SceneBackground` are small reusable pieces
configured with props (`name="lamb"`, `scene="sea"`).
- Where: `bible-lang-app/src/components/`.

**State and effects.** `useState` for values that change, `useEffect` for loading data, and why
the linter warns about calling `setState` directly inside an effect.
- Learn: "You Might Not Need an Effect" (react.dev).

**Context.** `AuthProvider` and `ProgressProvider` share data (who's signed in, hearts) with every
screen without passing props down by hand.
- Where: `src/auth/AuthContext.js`, `src/progress/ProgressContext.js`.

**Screen state as data.** `App.js` keeps `{ name: 'lesson', lessonId, scene, back }` instead of
a navigation library; the scene travels with the screen.
- Learn: Expo Router (what AGENTS.md recommends for later).

**Async storage.** Progress and the session token are saved on the device with `AsyncStorage`.
- Learn: why device storage isn't synced between devices (the next step after sign-in).

**Expo SDK versions and config plugins.** Libraries must match the Expo SDK
(`npx expo install`), and some need entries in `app.json` (`plugins`, `scheme`). Native-only
libraries need a development build, not Expo Go.

## 5. Drawing (SVG)

**SVG basics.** `viewBox`, coordinates, `<path d="M ... Q ... Z">` (move, curve, close),
`<circle>`, `<ellipse>`, `<rect>`, `<g transform>`, gradients.
- Where: `src/art/characters.js`, `src/art/scenes.js`.
- Practice: change the camel's blanket colors, or add a star to the desert sky.

**preserveAspectRatio "slice".** Makes a scene cover any screen shape, like CSS `background-size: cover`.

**react-native-svg and SvgXml.** Draws the same SVG strings on phone and web.

**Template strings as building blocks.** Helpers like `tree(x, y, s)` and `sheep(x, y)` return
SVG snippets, so a scene is assembled from parts.

## 6. Working safely

**Git branches and commits.** Commit each feature separately so you can undo one without the others.

**Linting.** `npx expo lint` catches bugs and React mistakes. It currently reports older issues in
files from before this change; fix them gradually.

**Reading before running.** Know which database a script writes to before you run it.
