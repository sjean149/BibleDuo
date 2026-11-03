import { API_URL } from './config';

// The free hosting plan puts the server to sleep when nobody is using it, and waking it takes
// 30-60 seconds. So when a request times out or can't connect, we don't fail straight away:
// we tell the app the server is waking up (it shows a banner) and keep retrying for a while.
const FIRST_TRY_MS = 8000; // a server that's awake answers well within this
const RETRY_TRY_MS = 20000; // each attempt while it's waking up
const GIVE_UP_AFTER_MS = 90000; // stop retrying and show the error after this long
const PAUSE_MS = 3000; // between attempts

// ---------------------------------------------------------------- "waking up" status

const listeners = new Set();
let retrying = 0; // how many requests are currently waiting for the server

// Call fn(true/false) whenever the server starts or stops waking up. Returns an unsubscribe.
export function onServerWaking(fn) {
  listeners.add(fn);
  fn(retrying > 0);
  return () => listeners.delete(fn);
}

function changeRetrying(delta) {
  const before = retrying > 0;
  retrying += delta;
  if (before !== retrying > 0) listeners.forEach((fn) => fn(retrying > 0));
}

// ---------------------------------------------------------------- requests

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// One attempt. Errors that mean "the server may just be asleep" are marked retryable.
async function attempt(path, options, timeoutMs) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(`${API_URL}${path}`, { ...options, signal: controller.signal });
    if (!res.ok) {
      let detail = '';
      try {
        detail = (await res.json()).detail ?? '';
      } catch {}
      const err = new Error(`Server returned ${res.status}${detail ? `: ${detail}` : ''}`);
      err.status = res.status;
      err.detail = detail;
      err.retryable = res.status === 502 || res.status === 503 || res.status === 504; // host still starting
      throw err;
    }
    return await res.json();
  } catch (err) {
    if (err.status === undefined) err.retryable = true; // timeout or no connection
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

// Every call goes through here: the fetch, the timeout, the retries and the error message.
async function request(path, options = {}) {
  const started = Date.now();
  let waiting = false;
  try {
    for (;;) {
      try {
        return await attempt(path, options, waiting ? RETRY_TRY_MS : FIRST_TRY_MS);
      } catch (err) {
        if (!err.retryable) throw err;
        if (Date.now() - started > GIVE_UP_AFTER_MS) {
          throw new Error(`No response from ${API_URL}. The server may be down; try again in a minute.`);
        }
        if (!waiting) {
          waiting = true;
          changeRetrying(+1);
        }
        await sleep(PAUSE_MS);
      }
    }
  } finally {
    if (waiting) changeRetrying(-1);
  }
}

const apiGet = (path) => request(path);

const apiPost = (path, body) =>
  request(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

export function fetchLesson(lessonId) {
  return apiGet(`/lessons/${lessonId}`);
}

export function fetchBooks() {
  return apiGet('/books');
}

export function fetchChapters(bookId, lang) {
  return apiGet(`/books/${bookId}/chapters?lang=${lang}`);
}

export function fetchVerses(chapterId, lang) {
  return apiGet(`/chapters/${chapterId}/verses?lang=${lang}`);
}

// The recorded reading of a whole chapter: { audio_url: 'https://...' } or { audio_url: null }.
export function fetchChapterAudio(chapterId, lang) {
  return apiGet(`/chapters/${chapterId}/audio?lang=${lang}`);
}

// Every book with its chapters and the ids of each chapter's three steps (the path screen).
export function fetchJourney(lang) {
  return apiGet(`/journey?lang=${lang}`);
}

// Google sign-in: trade the Google ID token for our own session token ({ access_token }).
export function signInWithGoogle(idToken) {
  return apiPost('/auth/google', { id_token: idToken });
}

// The signed-in learner ({ id, email, display_name, ... }), or a 401 error if the session expired.
export function fetchMe(accessToken) {
  return request('/auth/me', { headers: { Authorization: `Bearer ${accessToken}` } });
}

export function translateText(text, sourceLang, targetLang = 'en') {
  return apiPost('/translate', { text, source_lang: sourceLang, target_lang: targetLang });
}
