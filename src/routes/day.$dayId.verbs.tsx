import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useCallback } from "react";
import { toast } from "sonner";
import { useProgressStore } from "@/stores/progress";
import { useDayGuard } from "@/hooks/useDayGuard";
import { buildVerbExercises } from "@/lib/build-verb-exercises";
import type { VerbExercise } from "@/lib/build-verb-exercises";
import { computeScore } from "@/lib/utils";
import { ExerciseShell } from "@/components/ExerciseShell";
import { VerbCard } from "@/components/VerbCard";
import { QuizResult } from "@/components/QuizResult";
import { useExercise } from "@/hooks/useExercise";
import type { SessionResult } from "@/lib/types";

export const Route = createFileRoute("/day/$dayId/verbs")({
  component: VerbsPage,
});

function VerbsPage() {
  const { dayId } = Route.useParams();
  const navigate = useNavigate();
  const recordAttempt = useProgressStore((s) => s.recordAttempt);

  const dayNum = Number(dayId);
  const allowed = useDayGuard(dayNum);

  useEffect(() => {
    if (allowed && dayNum < 2) {
      toast("Verb practice starts on Day 2");
      navigate({ to: "/day/$dayId", params: { dayId: String(dayNum) } });
    }
  }, [allowed, dayNum, navigate]);

  const exercises = useMemo((): VerbExercise[] => {
    return buildVerbExercises(dayNum);
  }, [dayNum]);

  const handleComplete = useCallback(
    (result: SessionResult) => {
      recordAttempt(dayNum, "verbs", computeScore(result));
    },
    [dayNum, recordAttempt],
  );

  const exercise = useExercise({
    items: exercises,
    onComplete: handleComplete,
  });

  if (!allowed || dayNum < 2) {
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
      title="Verb Practice"
      subtitle={`Day ${dayNum}`}
      intro="Master the most important Spanish verb conjugations. Study the patterns first, then test yourself on yo, tú, and él/ella forms."
      current={exercise.index + 1}
      total={exercise.total}
      backTo={`/day/${dayNum}`}
    >
      <VerbCard
        key={current.id}
        verb={current.verb}
        mode={current.mode}
        targetPronoun={current.targetPronoun}
        onAnswer={current.mode === "quiz" ? exercise.recordAnswer : () => exercise.next()}
      />
    </ExerciseShell>
  );
}

