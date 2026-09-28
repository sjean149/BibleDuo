# Expo app: first lesson screen

Renders `GET /lessons/1` from your FastAPI backend and lets you play through it.

Supported exercises: multiple_choice, listen_select, fill_blank, reorder.
`match`, `speak` and `true_false` show a "not built yet" card with a Skip button.

## 1. Create the Expo project

```bash
npx create-expo-app@latest bible-lang-app --template blank
cd bible-lang-app
npx expo install expo-speech expo-constants expo-status-bar react-native-safe-area-context
```

## 2. Copy these files in

Replace the generated `App.js` with the one from this zip and copy the whole
`src/` folder next to it:

```
bible-lang-app/
├── App.js
└── src/
    ├── config.js
    ├── api.js
    ├── theme.js
    ├── screens/LessonScreen.js
    ├── components/ (ExerciseView, ProgressBar, SpeakerButton, exercises/*)
    └── utils/ (grade.js, text.js)
```

If your template uses expo-router instead of `App.js`, render
`<LessonScreen lessonId={1} />` from `app/index.js`; the `src/` files are unchanged.

## 3. Start the backend so your phone can reach it

```bash
cd backend
uvicorn app.main:app --reload --host 0.0.0.0
```

`--host 0.0.0.0` is what lets other devices on your Wi-Fi connect.
On Windows, allow Python through the firewall if prompted.

## 4. Start the app

```bash
npx expo start
```

Scan the QR code with Expo Go (phone on the same Wi-Fi as your computer).
`src/config.js` reads your computer's IP from Expo automatically and uses port 8000.
If that guess is wrong, set `API_URL_OVERRIDE` at the top of that file.

## How it fits together

- `LessonScreen` owns the lesson state: current exercise, hearts, score, Check/Continue.
- `ExerciseView` picks a component by `exercise.type`.
- Exercise components only report what the learner chose via `onChange`; grading
  lives in `utils/grade.js`.
- Adding a new exercise type: build a component in `components/exercises/`, add a
  `case` in `ExerciseView`, and add it to `SUPPORTED_TYPES` and `gradeExercise`.

## Known shortcuts (fix before real users)

- **Grading is on the phone.** The lesson endpoint sends correct answers to the
  client. Later, send answers to `POST /exercises/{id}/submit` and strip `answer`
  from the lesson response.
- **XP and hearts are local.** They reset when you restart; the backend versions
  need login (Google Sign-In) first.
- **Audio uses the phone's built-in voice** (`expo-speech`), not Google TTS. If
  a French voice isn't installed on the device, it may sound wrong or stay silent.
