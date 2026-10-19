import AsyncStorage from '@react-native-async-storage/async-storage';

// Progress is saved on the device, as one small JSON value.
// To move it to the backend later (Supabase, after Google sign-in), replace these three
// functions. Nothing else in the app talks to storage.
const KEY = 'bibleduo.progress.v1';

export async function loadState() {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null; // unreadable or blocked storage: start fresh instead of crashing
  }
}

export async function saveState(state) {
  try {
    await AsyncStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    // saving is best effort; the app keeps working from memory
  }
}

export async function clearState() {
  try {
    await AsyncStorage.removeItem(KEY);
  } catch {}
}
