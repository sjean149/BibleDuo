import { normalize } from './text';
import { normalizePair } from './pairs';

// Every exercise type the app can now render and grade.
export const SUPPORTED_TYPES = [
  'multiple_choice',
  'listen_select',
  'fill_blank',
  'reorder',
  'match',
  'true_false',
  'speak',
];

// A match round still counts as correct with this many wrong taps. Set to 0 to be strict.
export const MATCH_MAX_MISTAKES = 1;

// Grades on the client for now so the lesson loop works without login.
// Later, send answers to POST /exercises/{id}/submit and stop shipping
// answers to the phone.
//
// What each screen hands back as `answer`:
//   multiple_choice / listen_select  the chosen option text
//   fill_blank                       the chosen word (options) or typed word
//   reorder                          the rebuilt sentence
//   true_false                       true or false
//   match                            { mistakes }   (sent once every pair is matched)
//   speak                            { correct, heard? }  (decided inside the screen)
export function gradeExercise(exercise, answer) {
  const expected = exercise.answer.value;
  switch (exercise.type) {
    case 'multiple_choice':
    case 'listen_select':
      return { correct: answer === expected, correctText: expected };

    case 'fill_blank':
    case 'reorder':
      return { correct: normalize(answer) === normalize(expected), correctText: expected };

    case 'true_false': {
      const isTrue = expected === true || expected === 'true';
      return { correct: answer === isTrue, correctText: isTrue ? 'True' : 'False' };
    }

    case 'match': {
      const mistakes = answer?.mistakes ?? Infinity;
      const pairs = (exercise.prompt.pairs ?? []).map((p) => {
        const { target, native } = normalizePair(p);
        return `${target} = ${native}`;
      });
      return { correct: mistakes <= MATCH_MAX_MISTAKES, correctText: pairs.join(', ') };
    }

    case 'speak':
      return { correct: answer?.correct === true, correctText: expected };

    default:
      return { correct: false, correctText: expected };
  }
}
