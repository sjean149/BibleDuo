import ExerciseView from './ExerciseView';
import FillBlankChoice from './FillBlankChoice';
import MatchExercise from './MatchExercise';
import SpeakExercise from './SpeakExercise';
import TrueFalseExercise from './TrueFalseExercise';

// Picks the right screen for an exercise. The new types are handled here;
// everything else still goes to your existing ExerciseView, so nothing there changes.
export default function ExtendedExerciseView(props) {
  const { exercise } = props;

  switch (exercise.type) {
    case 'match':
      return <MatchExercise {...props} />;
    case 'true_false':
      return <TrueFalseExercise {...props} />;
    case 'speak':
      return <SpeakExercise {...props} />;
    case 'fill_blank':
      // Word bank when the exercise has wrong options, typing box otherwise.
      return exercise.answer?.distractors?.length ? (
        <FillBlankChoice {...props} />
      ) : (
        <ExerciseView {...props} />
      );
    default:
      return <ExerciseView {...props} />;
  }
}
