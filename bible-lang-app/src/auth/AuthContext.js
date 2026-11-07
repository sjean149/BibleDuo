import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { fetchMe, signInWithGoogle } from '../api';

// Closes the Google pop-up on web once it redirects back to the app.
WebBrowser.maybeCompleteAuthSession();

// Keeps the app's old name on purpose: renaming this key would sign everyone out.
const KEY = 'bibleduo.session.v1';

// Google OAuth client ids (Google Cloud Console > APIs & Services > Credentials). The web id must
// be the same one the backend checks (GOOGLE_CLIENT_ID); iOS and Android ids are only needed for
// installed builds, and the backend must list them too.
const CLIENT_IDS = {
  webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
  iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
  androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
};

// The id this platform needs. Google's helper throws if it is missing, which would crash the
// whole app, so without one the helper is never loaded and the button says why.
const PLATFORM_CLIENT_ID = Platform.select({
  ios: CLIENT_IDS.iosClientId,
  android: CLIENT_IDS.androidClientId,
  default: CLIENT_IDS.webClientId,
});
// The sample value from .env.example counts as missing: Google would only reject it.
export const GOOGLE_CONFIGURED = !!PLATFORM_CLIENT_ID && !PLATFORM_CLIENT_ID.startsWith('your-');
export const GOOGLE_UNAVAILABLE_REASON = GOOGLE_CONFIGURED
  ? null
  : Platform.OS === 'web'
    ? 'Not set up: add EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID'
    : 'Not available in this app yet. Sign in on the website';

const AuthContext = createContext(null);

// Who is signed in. Sign-in flow: Google pop-up -> Google ID token -> POST /auth/google -> our
// own session token, saved on the device -> GET /auth/me for the name and email.
export function AuthProvider({ children }) {
  const [session, setSession] = useState(null); // { token, user } | null
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [prompt, setPrompt] = useState(null); // opens Google's sign-in; null until it is ready

  // Restore a saved session (if its token still works).
  useEffect(() => {
    (async () => {
      try {
        const saved = JSON.parse((await AsyncStorage.getItem(KEY)) ?? 'null');
        if (!saved?.token) return;
        const user = await fetchMe(saved.token);
        setSession({ token: saved.token, user });
      } catch (err) {
        if (err.status === 401) await AsyncStorage.removeItem(KEY).catch(() => {});
      }
    })();
  }, []);

  // Open Google, then hand its ID token to the backend.
  const signIn = useCallback(async () => {
    if (!prompt) return;
    setError(null);
    setBusy(true);
    try {
      const result = await prompt.run();
      if (result.type !== 'success') {
        if (result.type !== 'dismiss' && result.type !== 'cancel') {
          setError(result.error?.message || result.params?.error || 'Google sign-in failed');
        }
        return;
      }
      const idToken = result.params?.id_token ?? result.authentication?.idToken;
      const { access_token: token } = await signInWithGoogle(idToken);
      const user = await fetchMe(token);
      await AsyncStorage.setItem(KEY, JSON.stringify({ token }));
      setSession({ token, user });
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }, [prompt]);

  const signOut = useCallback(async () => {
    setSession(null);
    await AsyncStorage.removeItem(KEY).catch(() => {});
  }, []);

  const value = useMemo(
    () => ({
      user: session?.user ?? null,
      token: session?.token ?? null,
      ready: !!prompt,
      busy,
      error,
      signIn,
      signOut,
    }),
    [session, prompt, busy, error, signIn, signOut]
  );
  return (
    <AuthContext.Provider value={value}>
      {GOOGLE_CONFIGURED ? <GoogleRequest onReady={setPrompt} /> : null}
      {children}
    </AuthContext.Provider>
  );
}

// Loads Google's sign-in helper (only when this platform has a client id) and hands its
// "open the pop-up" function to the provider once the request is prepared.
function GoogleRequest({ onReady }) {
  const [request, , promptAsync] = Google.useIdTokenAuthRequest(CLIENT_IDS);
  useEffect(() => {
    onReady(request ? { run: () => promptAsync() } : null);
  }, [request, promptAsync, onReady]);
  return null;
}

export function useAuth() {
  return useContext(AuthContext);
}
