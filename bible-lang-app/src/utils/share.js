import { Platform, Share } from 'react-native';
import { SHARE_TEXT, SHARE_URL } from '../appInfo';

// Opens the phone's share sheet. Where there is none (a desktop browser) the text is copied
// to the clipboard instead. Returns 'shared', 'copied' or 'failed' so the caller can say so.
export async function shareApp() {
  const message = SHARE_URL ? `${SHARE_TEXT} ${SHARE_URL}` : SHARE_TEXT;
  try {
    await Share.share(Platform.OS === 'ios' && SHARE_URL ? { message: SHARE_TEXT, url: SHARE_URL } : { message });
    return 'shared';
  } catch {
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(message);
        return 'copied';
      }
    } catch {
      // fall through
    }
    return 'failed';
  }
}
