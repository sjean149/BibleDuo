import Constants from 'expo-constants';

// Where the backend lives.
//  - Deployed build: set EXPO_PUBLIC_API_URL (in bible-lang-app/.env, or in your web host's
//    environment settings). Expo copies it into the app when it builds, so change it and rebuild.
//  - Development: Expo already knows your computer's LAN IP (it's the host serving the JS
//    bundle), so we reuse it for the backend on port 8000.
const devHost = Constants.expoConfig?.hostUri?.split(':')[0];

export const API_URL = (
  process.env.EXPO_PUBLIC_API_URL || (devHost ? `http://${devHost}:8000` : 'http://localhost:8000')
).replace(/\/+$/, '');

// Language code -> BCP-47 tag used by text-to-speech
export const SPEECH_LANG = {
  fr: 'fr-FR',
  es: 'es-ES',
  en: 'en-US',
};
