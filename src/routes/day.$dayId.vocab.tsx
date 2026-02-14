import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useCallback } from "react";
import { getVocabForDay } from "@/lib/curriculum";
import { useProgressStore } from "@/stores/progress";
import { useDayGuard } from "@/hooks/useDayGuard";
import { useSrsSession } from "@/hooks/useSrsSession";
import { computeScore } from "@/lib/utils";
import { ExerciseShell } from "@/components/ExerciseShell";
import { FlashCard } from "@/components/FlashCard";
import { QuizResult } from "@/components/QuizResult";
import { Card, CardContent } from "@/components/ui/card";
import { BookOpen } from "lucide-react";
import { useState } from "react";
import type { SessionResult } from "@/lib/types";

export const Route = createFileRoute("/day/$dayId/vocab")({
  component: VocabPage,
});

function VocabPage() {
  const { dayId } = Route.useParams();
  const navigate = useNavigate();
  const recordAttempt = useProgressStore((s) => s.recordAttempt);

  const dayNum = Number(dayId);
  const allowed = useDayGuard(dayNum);
  const vocabForDay = getVocabForDay(dayNum);

  const handleComplete = useCallback(
    (result: SessionResult) => {
      recordAttempt(dayNum, "vocab", computeScore(result));
    },
    [dayNum, recordAttempt],
  );

  const { current, index, total, isComplete, result, answer, restart } =
    useSrsSession({
      newWords: vocabForDay,
      onComplete: handleComplete,
    });

  const [isFlipped, setIsFlipped] = useState(false);

  // Reset flip state when card changes
  useEffect(() => {
    setIsFlipped(false);
  }, [index]);

  if (!allowed) {
    return null;
  }

  // Empty state: no vocab words for this day
  if (vocabForDay.length === 0) {
    return (
      <ExerciseShell
        title="Vocabulary"
        subtitle={`Day ${dayNum}`}
        current={0}
        total={0}
        backTo={`/day/${dayNum}`}
      >
        <Card className="max-w-sm mx-auto">
          <CardContent className="pt-6 text-center space-y-3">
            <BookOpen className="w-10 h-10 mx-auto text-muted-foreground" />
            <p className="text-muted-foreground">
              No vocabulary words for this day.
            </p>
          </CardContent>
        </Card>
      </ExerciseShell>
    );
  }

  if (isComplete) {
    return (
      <ExerciseShell
        title="Vocabulary"
        subtitle={`Day ${dayNum}`}
        current={total}
        total={total}
        backTo={`/day/${dayNum}`}
      >
        <QuizResult
          result={result}
          onRestart={restart}
          onContinue={() => navigate({ to: `/day/${dayNum}` as string })}
          continueLabel="Back to Day"
        />
      </ExerciseShell>
    );
  }

  // No cards to review (all done, none due)
  if (!current && total === 0) {
    return (
      <ExerciseShell
        title="Vocabulary"
        subtitle={`Day ${dayNum}`}
        current={0}
        total={0}
        backTo={`/day/${dayNum}`}
      >
        <Card className="max-w-sm mx-auto">
          <CardContent className="pt-6 text-center space-y-3">
            <BookOpen className="w-10 h-10 mx-auto text-muted-foreground" />
            <p className="text-muted-foreground">
              No cards due for review right now. Check back later!
            </p>
          </CardContent>
        </Card>
      </ExerciseShell>
    );
  }

  return (
    <ExerciseShell
      title="Vocabulary"
      subtitle={`Day ${dayNum}`}
      intro="Learn new Spanish words with flashcards. Tap the card to reveal the English meaning, then rate your confidence. Words you struggle with will appear more often."
      current={index + 1}
      total={total}
      backTo={`/day/${dayNum}`}
    >
      {current && (
        <FlashCard
          front={current.front}
          back={current.back}
          category={
            vocabForDay.find((w) => `vocab-${w.id}` === current.id)?.category
          }
          isFlipped={isFlipped}
          onFlip={() => setIsFlipped(true)}
          onAnswer={answer}
        />
      )}
    </ExerciseShell>
  );
}
