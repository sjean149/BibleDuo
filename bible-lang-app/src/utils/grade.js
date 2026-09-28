import { normalize } from './text';

// Exercise types the app can render and grade today.
// The others (match, speak, true_false) show a "coming soon" card.
export const SUPPORTED_TYPES = [
  'multiple_choice',
  'listen_select',
  'fill_blank',
  'reorder',
];

// Grades on the client for now so the lesson loop works without login.
// Later, send answers to POST /exercises/{id}/submit and stop shipping
// answers to the phone (see notes in SETUP.md).
export function gradeExercise(exercise, answer) {
  const expected = exercise.answer.value;
  switch (exercise.type) {
    case 'multiple_choice':
    case 'listen_select':
      return { correct: answer === expected, correctText: expected };
    case 'fill_blank':
    case 'reorder':
      return { correct: normalize(answer) === normalize(expected), correctText: expected };
    default:
      return { correct: false, correctText: expected };
  }
}
