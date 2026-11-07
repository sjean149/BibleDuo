# How the English lessons and Google sign-in were built

A step-by-step summary, so you can repeat this work yourself. For background on each idea, see
[CONCEPTS.md](CONCEPTS.md).

---

## Part 1: Fixing Google sign-in

### How sign-in works

```
1. Website        asks Google to sign the person in (pop-up)
2. Google         checks: is this client ID real? is this web address registered?
3. Google         sends back an ID token, a signed note saying who the person is
4. Website        sends that token to your backend: POST /auth/google
5. Backend        checks Google's signature and creates the user if new
6. Backend        replies with its own session token
7. Website        saves that token and asks GET /auth/me for the name and email
```

If sign-in fails, find the step that breaks. Don't change code until you know which one.

### How to test each step

| Step | How to test it | What we found |
|---|---|---|
| Client ID is real | Load Google's sign-in address with the ID | Real, but the sample text was in `.env` at first |
| Same ID everywhere | Compare `GOOGLE_CLIENT_ID` and `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` | They match |
| Web address registered | Same test: read Google's error | **Failed: `redirect_uri_mismatch`** |
| Backend steps 5 to 7 | Run the backend with a stand-in for Google's check | All work |
| Browser permission (CORS) | Send a test "preflight" request | Works |

The lesson: the code was fine. The missing piece was a setting in Google Cloud Console.

### The fix you need to make

1. Open [Google Cloud Console](https://console.cloud.google.com) and pick the `bible-lang-app` project.
2. Go to **APIs & Services → Credentials** and open your web client.
3. Add each address below under **both** Authorized JavaScript origins and Authorized redirect URIs:
   - `http://localhost:8081` (for testing on your computer)
   - your live site, for example `https://your-site.onrender.com`
4. Type them exactly: `https`, no `/` at the end, no extra path. Google compares letter by letter.
5. Save. It can take a few minutes to start working.
6. On the **OAuth consent screen**, if it says **Testing**, add your email as a test user or publish the app.

### Common Google errors

| Error | Meaning | Fix |
|---|---|---|
| `redirect_uri_mismatch` | This web address isn't registered | Add it exactly as shown above |
| `invalid_client` | The client ID is wrong or a placeholder | Copy the real ID into all four places |
| `access_denied` | Consent screen is in Testing | Add a test user, or publish |
| `Invalid Google ID token` (from your backend) | The backend has a different client ID | Match `GOOGLE_CLIENT_ID` on Render |

The same client ID goes in four places: `backend/.env`, `bible-lang-app/.env`, the Render backend,
and the Render website. After changing the website's value, redeploy it, because the value is
copied in when the site is built.

---

## Part 2: Teaching English from Spanish or French

### The problem

The first English lessons explained everything in English, to people still learning English. They
also had no translations, because the verse *was* the English.

### The idea

Ask which language the learner speaks, and teach in that language. Your database already has every
verse in all three languages, so the Spanish or French verse becomes the translation.

### Step 1: Separate the rules from the words

**Files:** `backend/app/grammar_en.py`, `backend/app/grammar_en_i18n.py`

The *rules* (which words count, which wrong options to offer) don't change between languages. Only
the *explanations* do. So they live apart:

- `grammar_en.py` holds the rules once.
- `grammar_en_i18n.py` holds the Spanish and French teaching text. "i18n" is short for
  "internationalization": 18 letters between the i and the n.
- `for_speakers("es")` combines them into a Spanish version of the curriculum.

`zip(..., strict=True)` makes Python stop with an error if a translation is missing, rather than
quietly showing a blank.

**Try it:** add a card to one rule in `grammar_en.py` without translating it. Run the generator and
read the error.

### Step 2: Give each language its own lesson

**Files:** `backend/app/services/journey.py`, `backend/app/generate_lessons.py`

Each lesson has an `order` number that says what it is:

| `order` | Lesson |
|---|---|
| 90 | Key Words |
| 91 | Grammar lesson (Spanish, French) |
| 92 | English for Spanish speakers |
| 93 | English for French speakers |

Using numbers meant no database change was needed. The generator asks for the verses in pairs:

```python
verses = verse_triples(all_verses, "en", native="es")   # (number, English, Spanish)
```

Everything downstream, like hints and translation questions, then works without changes, because
it only knows "the text" and "the translation". That's the benefit of writing general code.

### Step 3: Let the backend pick the right lesson

**File:** `backend/app/routers/journey.py`

The address gained one option:

```
/journey?lang=en&base=es
```

`base` is the language the learner speaks. It chooses which lesson ID each chapter returns.

**Try it:** with the backend running, open that address with `base=es`, then `base=fr`. Compare
`practice_lesson_id` for the same chapter.

### Step 4: Ask the learner

**Files:** `LanguagePicker.js`, `ProgressContext.js`, `logic.js`

- The app remembers `base` next to `lang` in the saved progress.
- Choosing English shows a second question, written in both languages, since the learner may not
  read English yet.
- `PathScreen` also shows the question if someone has English saved but no answer. Always think
  about people with old saved data when you add a new setting.

### Step 5: Pass the choice along

**Files:** `journeyStore.js`, `api.js`, `PathScreen.js`, `ReadScreen.js`, `ChapterReaderScreen.js`

- The journey cache key includes `base`, otherwise switching language would show old lessons.
- The Translate button now translates into the learner's language instead of always English.

### Step 6: Prove nothing else broke

Before and after a change, save the output and compare it:

1. Export every Spanish and French question for John.
2. Make the change and regenerate.
3. Export again and compare the two files.

They matched, all 910 questions. This is called a **regression check**.

### Step 7: Test on a copy first

Your `.env` points to the real database, so test on a copy by setting `DATABASE_URL` for one command:

```bash
DATABASE_URL=sqlite:///./copy.db python -m app.generate_lessons --replace --books John --langs en
```

Then write to the real database:

```bash
python -m app.generate_lessons --replace --langs en
```

---

## What's still in English

- **Buttons and menus** such as Check, Continue and Read and listen. Lesson content is translated,
  but the app's own labels aren't. That's a good next project: move them into one file per language.
- **No Key Words for English.** It would need each word translated, using your Translate quota.

## Practice ideas

1. Add an 11th English rule, such as `can / could`, in both files.
2. Translate the "Lesson complete" screen into Spanish and French.
3. Add a third learner language, such as Portuguese. Think about which steps you'd repeat, and what
   would be missing from your database.
