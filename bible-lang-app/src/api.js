import { API_URL } from './config';

export async function fetchLesson(lessonId) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);
  try {
    const res = await fetch(`${API_URL}/lessons/${lessonId}`, {
      signal: controller.signal,
    });
    if (!res.ok) throw new Error(`Server returned ${res.status}`);
    return await res.json();
  } catch (err) {
    if (err.name === 'AbortError') {
      throw new Error(`No response from ${API_URL}.`);
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}
