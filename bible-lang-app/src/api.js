import { API_URL } from './config';

// One helper does the fetch, the timeout and the error handling for every call.
async function request(path, options = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);
  try {
    const res = await fetch(`${API_URL}${path}`, { ...options, signal: controller.signal });
    if (!res.ok) throw new Error(`Server returned ${res.status}`);
    return await res.json();
  } catch (err) {
    if (err.name === 'AbortError') throw new Error(`No response from ${API_URL}.`);
    throw err;
  } finally {
    clearTimeout(timer);
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

// Every book with its chapters and the ids of each chapter's three steps (the path screen).
export function fetchJourney(lang) {
  return apiGet(`/journey?lang=${lang}`);
}

export function translateText(text, sourceLang, targetLang = 'en') {
  return apiPost('/translate', { text, source_lang: sourceLang, target_lang: targetLang });
}
