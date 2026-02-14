import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useCallback } from "react";
import { toast } from "sonner";
import { useSettingsStore } from "@/stores/settings";
import { useProgressStore } from "@/stores/progress";
import { getVerbsForDay, getVerbsUpToDay } from "@/lib/curriculum";
import { shuffle } from "@/lib/shuffle";
import { ExerciseShell } from "@/components/ExerciseShell";
import { VerbCard } from "@/components/VerbCard";
import { QuizResult } from "@/components/QuizResult";
import { useExercise } from "@/hooks/useExercise";
import type { VerbEntry, SessionResult } from "@/lib/types";

export const Route = createFileRoute("/day/$dayId/verbs")({
  component: VerbsPage,
});

type Pronoun = "yo" | "tú" | "él";

interface VerbExercise {
  id: string;
  verb: VerbEntry;
  mode: "display" | "quiz";
  targetPronoun?: Pronoun;
}

const TARGET_EXERCISES = 14;
const PRONOUNS: Pronoun[] = ["yo", "tú", "él"];

function VerbsPage() {
  const { dayId } = Route.useParams();
  const navigate = useNavigate();
  const currentDay = useSettingsStore((s) => s.getCurrentDay());
  const recordAttempt = useProgressStore((s) => s.recordAttempt);

  const dayNum = Number(dayId);

  useEffect(() => {
    if (dayNum < 1 || dayNum > 10 || dayNum > currentDay) {
      toast("Day not available yet");
      navigate({ to: "/dashboard" });
      return;
    }
    if (dayNum < 2) {
      toast("Verb practice starts on Day 2");
      navigate({ to: "/day/$dayId", params: { dayId: String(dayNum) } });
    }
  }, [dayNum, currentDay, navigate]);

  const exercises = useMemo((): VerbExercise[] => {
    if (dayNum < 2) return [];

    const dayVerbs = getVerbsForDay(dayNum);
    const reviewVerbs = getVerbsUpToDay(dayNum - 1);
    const items: VerbExercise[] = [];

    // Display mode for new verbs first
    for (const verb of dayVerbs) {
      items.push({
        id: `display-${verb.id}`,
        verb,
        mode: "display",
      });
    }

    // Quiz mode for new verbs (each pronoun)
    for (const verb of dayVerbs) {
      const pronoun = PRONOUNS[Math.floor(Math.random() * PRONOUNS.length)];
      items.push({
        id: `quiz-new-${verb.id}`,
        verb,
        mode: "quiz",
        targetPronoun: pronoun,
      });
    }

    // Quiz mode for review verbs
    const shuffledReview = shuffle(reviewVerbs);
    for (const verb of shuffledReview) {
      if (items.length >= TARGET_EXERCISES) break;
      const pronoun = PRONOUNS[Math.floor(Math.random() * PRONOUNS.length)];
      items.push({
        id: `quiz-review-${verb.id}`,
        verb,
        mode: "quiz",
        targetPronoun: pronoun,
      });
    }

    // If still not enough, add more quiz exercises for day verbs with different pronouns
    let extra = 0;
    while (items.length < TARGET_EXERCISES && dayVerbs.length > 0) {
      const verb = dayVerbs[extra % dayVerbs.length];
      const pronoun = PRONOUNS[extra % PRONOUNS.length];
      items.push({
        id: `quiz-extra-${verb.id}-${extra}`,
        verb,
        mode: "quiz",
        targetPronoun: pronoun,
      });
      extra++;
      if (extra > TARGET_EXERCISES) break;
    }

    return items.slice(0, TARGET_EXERCISES);
  }, [dayNum]);

  const handleComplete = useCallback(
    (result: SessionResult) => {
      const score =
        result.total > 0
          ? Math.round((result.correct / result.total) * 100)
          : 0;
      recordAttempt(dayNum, "verbs", score);
    },
    [dayNum, recordAttempt],
  );

  const exercise = useExercise({
    items: exercises,
    onComplete: handleComplete,
  });

  if (dayNum < 2 || dayNum > 10 || dayNum > currentDay) {
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

