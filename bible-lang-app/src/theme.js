import { Platform } from 'react-native';

// Palette: lapis blue (the pigment of illuminated manuscripts) on a cool mist
// ground, with leaf green / madder red reserved for right / wrong feedback.
export const colors = {
  mist: '#EEF2F4',
  card: '#FFFFFF',
  ink: '#16263A',
  muted: '#5B6B7D',
  line: '#D5DCE2',
  lapis: '#2C4FB8',
  lapisDark: '#1F3A8A',
  lapisTint: '#E4EAFA',
  leaf: '#2F8F5B',
  leafTint: '#DFF1E7',
  madder: '#B5443A',
  madderTint: '#F8E3E0',
};

// The scripture word is the one memorable element: set it in a serif.
// Everything else stays in the system UI font.
export const fonts = {
  scripture: Platform.select({ ios: 'Georgia', default: 'serif' }),
};

export const radius = { button: 14, option: 12, bar: 6 };
