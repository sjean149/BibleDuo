import ChoiceExercise from './exercises/ChoiceExercise';
import FillBlankExercise from './exercises/FillBlankExercise';
import ReorderExercise from './exercises/ReorderExercise';
import UnsupportedExercise from './exercises/UnsupportedExercise';

// Picks the right component for an exercise's `type`.
// To add a new type: build a component in ./exercises, add a case here,
// add it to SUPPORTED_TYPES and gradeExercise in utils/grade.js.
export default function ExerciseView({ exercise, lang, locked, onChange }) {
  const props = { exercise, lang, locked, onChange };
  switch (exercise.type) {
    case 'multiple_choice':
    case 'listen_select':
      return <ChoiceExercise {...props} />;
    case 'fill_blank':
      return <FillBlankExercise {...props} />;
    case 'reorder':
      return <ReorderExercise {...props} />;
    default:
      return <UnsupportedExercise exercise={exercise} />;
  }
}
