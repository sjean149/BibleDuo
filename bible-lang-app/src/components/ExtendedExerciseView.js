import { View } from 'react-native';
import ExerciseView from './ExerciseView';
import FillBlankChoice from './FillBlankChoice';
import MatchExercise from './MatchExercise';
import SpeakExercise from './SpeakExercise';
import TeachBlock from './TeachBlock';
import TrueFalseExercise from './TrueFalseExercise';

// Picks the right screen for an exercise. The new types are handled here;
// everything else still goes to your existing ExerciseView, so nothing there changes.
// Grammar questions can carry teaching (prompt.teach), shown above the question on the same screen.
export default function ExtendedExerciseView(props) {
  const teach = props.exercise.prompt?.teach;
  if (!teach) return <Question {...props} />;
  return (
    <View>
      <TeachBlock teach={teach} lang={props.lang} />
      <Question {...props} />
    </View>
  );
}

function Question(props) {
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
