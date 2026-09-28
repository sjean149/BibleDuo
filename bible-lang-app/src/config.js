import Constants from 'expo-constants';

// If you need to point at a specific backend, set this and it wins.
// Example: 'http://192.168.1.20:8000'
const API_URL_OVERRIDE = '';

// During development Expo already knows your computer's LAN IP (it's the host
// serving the JS bundle), so we reuse it for the backend on port 8000.
const devHost = Constants.expoConfig?.hostUri?.split(':')[0];

export const API_URL =
  API_URL_OVERRIDE || (devHost ? `http://${devHost}:8000` : 'http://localhost:8000');

// Language code -> BCP-47 tag used by text-to-speech
export const SPEECH_LANG = {
  fr: 'fr-FR',
  es: 'es-ES',
  en: 'en-US',
};
