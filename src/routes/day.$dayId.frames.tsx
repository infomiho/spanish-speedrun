import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useCallback } from "react";
import { useProgressStore } from "@/stores/progress";
import { useDayGuard } from "@/hooks/useDayGuard";
import { buildFrameExercises } from "@/lib/build-frame-exercises";
import type { FrameExercise } from "@/lib/build-frame-exercises";
import { computeScore } from "@/lib/utils";
import { ExerciseShell } from "@/components/ExerciseShell";
import { SentenceBuilder } from "@/components/SentenceBuilder";
import { QuizResult } from "@/components/QuizResult";
import { useExercise } from "@/hooks/useExercise";
import type { SessionResult } from "@/lib/types";

export const Route = createFileRoute("/day/$dayId/frames")({
  component: FramesPage,
});

function FramesPage() {
  const { dayId } = Route.useParams();
  const navigate = useNavigate();
  const recordAttempt = useProgressStore((s) => s.recordAttempt);

  const dayNum = Number(dayId);
  const allowed = useDayGuard(dayNum);

  const exercises = useMemo((): FrameExercise[] => {
    return buildFrameExercises(dayNum);
  }, [dayNum]);

  const handleComplete = useCallback(
    (result: SessionResult) => {
      recordAttempt(dayNum, "frames", computeScore(result));
    },
    [dayNum, recordAttempt],
  );

  const exercise = useExercise({
    items: exercises,
    onComplete: handleComplete,
  });

  if (!allowed) {
    return null;
  }

  if (exercise.state === "complete") {
    return (
      <div className="space-y-4">
        <QuizResult
          result={exercise.result}
          onRestart={exercise.restart}
          onContinue={() =>
            navigate({ to: "/day/$dayId", params: { dayId: String(dayNum) } })
          }
          continueLabel="Back to Day"
        />
      </div>
    );
  }

  const current = exercise.current;
  if (!current) return null;

  return (
    <ExerciseShell
      title="Sentence Frames"
      subtitle={`Day ${dayNum}`}
      intro="Translate the English sentence by picking the correct Spanish word to fill the blank."
      current={exercise.index + 1}
      total={exercise.total}
      backTo={`/day/${dayNum}`}
    >
      <SentenceBuilder
        key={current.id}
        frame={current.frame}
        correctWord={current.correctWord}
        distractors={current.distractors}
        onAnswer={exercise.recordAnswer}
      />
    </ExerciseShell>
  );
}

