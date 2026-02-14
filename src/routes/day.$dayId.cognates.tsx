import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useCallback } from "react";
import {
  getCognateRulesForDay,
  getFalseCognatesForDay,
  getCognateRulesUpToDay,
} from "@/lib/curriculum";
import { buildExerciseQueue } from "@/lib/build-cognate-exercises";
import type { CognateExerciseItem } from "@/lib/build-cognate-exercises";
import { useProgressStore } from "@/stores/progress";
import { useDayGuard } from "@/hooks/useDayGuard";
import { useExercise } from "@/hooks/useExercise";
import { computeScore } from "@/lib/utils";
import { ExerciseShell } from "@/components/ExerciseShell";
import { CognateRule } from "@/components/CognateRule";
import { MultipleChoice } from "@/components/MultipleChoice";
import { TypeAnswer } from "@/components/TypeAnswer";
import { QuizResult } from "@/components/QuizResult";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Lightbulb, ArrowRight } from "lucide-react";
import type { SessionResult, FalseCognate } from "@/lib/types";

export const Route = createFileRoute("/day/$dayId/cognates")({
  component: CognatesPage,
});

function CognatesPage() {
  const { dayId } = Route.useParams();
  const navigate = useNavigate();
  const recordAttempt = useProgressStore((s) => s.recordAttempt);

  const dayNum = Number(dayId);
  const allowed = useDayGuard(dayNum);

  const exerciseQueue = useMemo(
    () => {
      const rulesForDay = getCognateRulesForDay(dayNum);
      const falseCognatesForDay = getFalseCognatesForDay(dayNum);
      const allRulesUpToDay = getCognateRulesUpToDay(dayNum);
      return buildExerciseQueue(rulesForDay, falseCognatesForDay, allRulesUpToDay);
    },
    [dayNum],
  );

  const handleComplete = useCallback(
    (result: SessionResult) => {
      recordAttempt(dayNum, "cognates", computeScore(result));
    },
    [dayNum, recordAttempt],
  );

  const exercise = useExercise({
    items: exerciseQueue,
    onComplete: handleComplete,
  });

  if (!allowed) {
    return null;
  }

  // No cognate rules for this day
  if (exerciseQueue.length === 0) {
    return (
      <ExerciseShell
        title="Cognates"
        subtitle={`Day ${dayNum}`}
        current={0}
        total={0}
        backTo={`/day/${dayNum}`}
      >
        <Card className="max-w-sm mx-auto">
          <CardContent className="pt-6 text-center space-y-3">
            <Lightbulb className="w-10 h-10 mx-auto text-muted-foreground" />
            <p className="text-muted-foreground">
              No new cognate rules for this day.
            </p>
            <Button
              variant="outline"
              className="min-h-[44px]"
              onClick={() => navigate({ to: `/day/${dayNum}` as string })}
            >
              Back to Day {dayNum}
            </Button>
          </CardContent>
        </Card>
      </ExerciseShell>
    );
  }

  if (exercise.state === "complete") {
    return (
      <ExerciseShell
        title="Cognates"
        subtitle={`Day ${dayNum}`}
        current={exerciseQueue.length}
        total={exerciseQueue.length}
        backTo={`/day/${dayNum}`}
      >
        <QuizResult
          result={exercise.result}
          onRestart={exercise.restart}
          onContinue={() => navigate({ to: `/day/${dayNum}` as string })}
          continueLabel="Back to Day"
        />
      </ExerciseShell>
    );
  }

  const currentItem = exercise.current;

  return (
    <ExerciseShell
      title="Cognates"
      subtitle={`Day ${dayNum}`}
      intro="Discover patterns that connect English and Spanish. Many English words transform into Spanish with simple suffix changes — learn the rules and unlock thousands of words instantly."
      current={exercise.index + 1}
      total={exercise.total}
      backTo={`/day/${dayNum}`}
    >
      {currentItem && (
        <CognateExerciseRenderer
          key={currentItem.id}
          item={currentItem}
          onAnswer={exercise.recordAnswer}
          onNext={exercise.next}
        />
      )}
    </ExerciseShell>
  );
}

// Renders the appropriate component based on exercise item kind
function CognateExerciseRenderer({
  item,
  onAnswer,
  onNext,
}: {
  item: CognateExerciseItem;
  onAnswer: (correct: boolean) => void;
  onNext: () => void;
}) {
  switch (item.kind) {
    case "rule-intro":
      return (
        <div className="space-y-4">
          <CognateRule rule={item.rule} />
          <div className="flex justify-center">
            <Button
              onClick={onNext}
              className="min-h-[44px] gap-2"
            >
              Got it
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      );

    case "type-answer":
      return (
        <TypeAnswer
          question={`What is "${item.english}" in Spanish?`}
          correctAnswer={item.correctSpanish}
          hint={`Rule: ${item.rule.englishSuffix} → ${item.rule.spanishSuffix}`}
          onAnswer={onAnswer}
          placeholder="Type the Spanish word..."
        />
      );

    case "multiple-choice":
      return (
        <MultipleChoice
          question={`What is "${item.english}" in Spanish?`}
          options={item.options}
          correctIndex={item.correctIndex}
          hint={`Rule: ${item.rule.englishSuffix} → ${item.rule.spanishSuffix}`}
          onAnswer={onAnswer}
        />
      );

    case "false-cognate":
      return <FalseCognateCard fc={item.falseCognate} onContinue={onNext} />;
  }
}

function FalseCognateCard({
  fc,
  onContinue,
}: {
  fc: FalseCognate;
  onContinue: () => void;
}) {
  return (
    <div className="space-y-4">
      <Card className="border-amber-300 dark:border-amber-700">
        <CardContent className="pt-6 space-y-3">
          <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
            <AlertTriangle className="w-5 h-5" />
            <span className="font-semibold text-sm uppercase tracking-wide">
              False Cognate Alert
            </span>
          </div>
          <p className="text-lg">
            <span className="font-bold">"{fc.spanish}"</span> does{" "}
            <span className="font-bold text-red-600 dark:text-red-400">
              NOT
            </span>{" "}
            mean <span className="italic">{fc.looksLike}</span>!
          </p>
          <p className="text-base">
            It actually means:{" "}
            <span className="font-bold text-emerald-600 dark:text-emerald-400">
              {fc.actualMeaning}
            </span>
          </p>
        </CardContent>
      </Card>
      <div className="flex justify-center">
        <Button onClick={onContinue} className="min-h-[44px] gap-2">
          Got it
          <ArrowRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
