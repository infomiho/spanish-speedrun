import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useCallback } from "react";
import { useProgressStore } from "@/stores/progress";
import { useDayGuard } from "@/hooks/useDayGuard";
import { buildQuizExercises } from "@/lib/build-quiz-exercises";
import type { QuizItem } from "@/lib/build-quiz-exercises";
import { computeScore } from "@/lib/utils";
import { ExerciseShell } from "@/components/ExerciseShell";
import { MultipleChoice } from "@/components/MultipleChoice";
import { TypeAnswer } from "@/components/TypeAnswer";
import { SentenceBuilder } from "@/components/SentenceBuilder";
import { VerbCard } from "@/components/VerbCard";
import { QuizResult } from "@/components/QuizResult";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useExercise } from "@/hooks/useExercise";
import { Lock, ArrowLeft } from "lucide-react";
import type { SessionResult } from "@/lib/types";

export const Route = createFileRoute("/day/$dayId/quiz")({
  component: QuizPage,
});

function QuizPage() {
  const { dayId } = Route.useParams();
  const navigate = useNavigate();
  const recordAttempt = useProgressStore((s) => s.recordAttempt);
  const canTakeQuiz = useProgressStore((s) => s.canTakeQuiz);

  const dayNum = Number(dayId);
  const allowed = useDayGuard(dayNum);

  const quizUnlocked = canTakeQuiz(dayNum);

  const exercises = useMemo((): QuizItem[] => {
    return buildQuizExercises(dayNum, quizUnlocked);
  }, [dayNum, quizUnlocked]);

  const handleComplete = useCallback(
    (result: SessionResult) => {
      recordAttempt(dayNum, "quiz", computeScore(result));
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

  if (!quizUnlocked) {
    return (
      <div className="flex flex-col items-center justify-center gap-6 py-12">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
          <Lock className="h-8 w-8 text-muted-foreground" />
        </div>
        <Card className="max-w-sm">
          <CardContent className="pt-6 text-center space-y-3">
            <h3 className="font-semibold text-lg">Complete exercises first</h3>
            <p className="text-sm text-muted-foreground">
              Finish the vocabulary, cognates, and sentence frame exercises to
              unlock the daily quiz.
            </p>
            <Button asChild className="min-h-[44px]">
              <Link to="/day/$dayId" params={{ dayId: String(dayNum) }}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Day {dayNum}
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
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
      title="Daily Quiz"
      subtitle={`Day ${dayNum}`}
      intro="Mixed review covering everything from today — vocabulary, cognates, sentence frames, and verb conjugations."
      current={exercise.index + 1}
      total={exercise.total}
      backTo={`/day/${dayNum}`}
    >
      <QuizQuestion
        key={current.id}
        item={current}
        onAnswer={exercise.recordAnswer}
      />
    </ExerciseShell>
  );
}

function QuizQuestion({
  item,
  onAnswer,
}: {
  item: QuizItem;
  onAnswer: (correct: boolean) => void;
}) {
  switch (item.kind) {
    case "vocab":
      return (
        <MultipleChoice
          question={item.word.spanish}
          options={item.options}
          correctIndex={item.correctIndex}
          onAnswer={onAnswer}
          hint="What does this word mean?"
        />
      );

    case "cognate":
      return (
        <TypeAnswer
          question={`How do you say "${item.english}" in Spanish?`}
          correctAnswer={item.spanish}
          onAnswer={onAnswer}
          hint={`Rule: ${item.rule.englishSuffix} → ${item.rule.spanishSuffix}`}
          placeholder="Type the Spanish word..."
        />
      );

    case "frame":
      return (
        <SentenceBuilder
          frame={item.frame}
          correctWord={item.correctWord}
          distractors={item.distractors}
          onAnswer={onAnswer}
        />
      );

    case "verb":
      return (
        <VerbCard
          verb={item.verb}
          mode="quiz"
          targetPronoun={item.pronoun}
          onAnswer={onAnswer}
        />
      );
  }
}

