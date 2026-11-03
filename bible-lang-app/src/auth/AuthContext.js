import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { fetchMe, signInWithGoogle } from '../api';

// Closes the Google pop-up on web once it redirects back to the app.
WebBrowser.maybeCompleteAuthSession();

const KEY = 'bibleduo.session.v1';

// Google OAuth client ids (Google Cloud Console > APIs & Services > Credentials). The web id must
// be the same one the backend checks (GOOGLE_CLIENT_ID); iOS and Android ids are only needed for
// installed builds, and the backend must list them too.
const CLIENT_IDS = {
  webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
  iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
  androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
};
export const GOOGLE_CONFIGURED = !!CLIENT_IDS.webClientId;

const AuthContext = createContext(null);

// Who is signed in. Sign-in flow: Google pop-up -> Google ID token -> POST /auth/google -> our
// own session token, saved on the device -> GET /auth/me for the name and email.
export function AuthProvider({ children }) {
  const [session, setSession] = useState(null); // { token, user } | null
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  // The hook needs some client id even when none is configured; the button is disabled then.
  const [request, , promptAsync] = Google.useIdTokenAuthRequest({
    ...CLIENT_IDS,
    webClientId: CLIENT_IDS.webClientId ?? 'not-configured',
  });

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
    setError(null);
    setBusy(true);
    try {
      const result = await promptAsync();
      if (result.type !== 'success') {
        if (result.type !== 'dismiss' && result.type !== 'cancel') setError('Google sign-in failed');
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
  }, [promptAsync]);

  const signOut = useCallback(async () => {
    setSession(null);
    await AsyncStorage.removeItem(KEY).catch(() => {});
  }, []);

  const value = useMemo(
    () => ({
      user: session?.user ?? null,
      token: session?.token ?? null,
      ready: GOOGLE_CONFIGURED && !!request,
      busy,
      error,
      signIn,
      signOut,
    }),
    [session, request, busy, error, signIn, signOut]
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
