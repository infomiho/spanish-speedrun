import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useCallback, useState, useRef } from "react";
import {
  getCognateRulesForDay,
  getFalseCognatesForDay,
  getCognateRulesUpToDay,
} from "@/lib/curriculum";
import { generateDistractors } from "@/lib/cognates";
import { shuffle } from "@/lib/shuffle";
import { useProgressStore } from "@/stores/progress";
import { useDayGuard } from "@/hooks/useDayGuard";
import { ExerciseShell } from "@/components/ExerciseShell";
import { CognateRule } from "@/components/CognateRule";
import { MultipleChoice } from "@/components/MultipleChoice";
import { TypeAnswer } from "@/components/TypeAnswer";
import { QuizResult } from "@/components/QuizResult";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Lightbulb, ArrowRight } from "lucide-react";
import type { SessionResult, CognateRule as CognateRuleType, FalseCognate } from "@/lib/types";

export const Route = createFileRoute("/day/$dayId/cognates")({
  component: CognatesPage,
});

// Exercise item types for the mixed queue
type CognateExerciseItem =
  | { kind: "rule-intro"; id: string; rule: CognateRuleType }
  | {
      kind: "type-answer";
      id: string;
      english: string;
      correctSpanish: string;
      rule: CognateRuleType;
    }
  | {
      kind: "multiple-choice";
      id: string;
      english: string;
      options: string[];
      correctIndex: number;
      rule: CognateRuleType;
    }
  | {
      kind: "false-cognate";
      id: string;
      falseCognate: FalseCognate;
    };

function buildExerciseQueue(
  rules: CognateRuleType[],
  falseCognates: FalseCognate[],
  allRules: CognateRuleType[],
): CognateExerciseItem[] {
  const queue: CognateExerciseItem[] = [];

  for (const rule of rules) {
    // 1. Rule introduction card
    queue.push({ kind: "rule-intro", id: `intro-${rule.id}`, rule });

    // Shuffle examples so users see different words each session
    const shuffled = shuffle(rule.examples);

    // Use 3 examples per type when enough exist, otherwise 2
    const perType = shuffled.length >= 6 ? 3 : 2;

    // Split into non-overlapping sets for type-answer vs multiple-choice
    const typeExamples = shuffled.slice(0, perType);
    const mcExamples = shuffled.length >= perType * 2
      ? shuffled.slice(perType, perType * 2)
      : shuffled.slice(0, perType);

    // 2. TypeAnswer exercises
    for (const ex of typeExamples) {
      queue.push({
        kind: "type-answer",
        id: `type-${rule.id}-${ex.english}`,
        english: ex.english,
        correctSpanish: ex.spanish,
        rule,
      });
    }

    // 3. Multiple-choice exercises (different examples from type-answer)
    for (const ex of mcExamples) {
      const correctSpanish = ex.spanish;
      const options = generateDistractors(correctSpanish, allRules, ex.english);
      const correctIndex = options.indexOf(correctSpanish);

      queue.push({
        kind: "multiple-choice",
        id: `mc-${rule.id}-${ex.english}`,
        english: ex.english,
        options,
        correctIndex: correctIndex >= 0 ? correctIndex : 0,
        rule,
      });
    }
  }

  // 4. Intersperse false cognate warnings
  for (const fc of falseCognates) {
    // Insert after the first few exercises if possible
    const insertPos = Math.min(
      queue.length,
      Math.max(2, Math.floor(queue.length / (falseCognates.length + 1))),
    );
    queue.splice(insertPos, 0, {
      kind: "false-cognate",
      id: `fc-${fc.id}`,
      falseCognate: fc,
    });
  }

  return queue;
}

function CognatesPage() {
  const { dayId } = Route.useParams();
  const navigate = useNavigate();
  const recordAttempt = useProgressStore((s) => s.recordAttempt);

  const dayNum = Number(dayId);
  const allowed = useDayGuard(dayNum);

  const rulesForDay = getCognateRulesForDay(dayNum);
  const falseCognatesForDay = getFalseCognatesForDay(dayNum);
  const allRulesUpToDay = getCognateRulesUpToDay(dayNum);

  const exerciseQueue = useMemo(
    () => buildExerciseQueue(rulesForDay, falseCognatesForDay, allRulesUpToDay),
    [rulesForDay, falseCognatesForDay, allRulesUpToDay],
  );

  const [index, setIndex] = useState(0);
  const [result, setResult] = useState<SessionResult>({
    total: 0,
    correct: 0,
    incorrect: 0,
    newCards: 0,
    reviewCards: 0,
  });
  const [isComplete, setIsComplete] = useState(false);
  const resultRef = useRef(result);
  resultRef.current = result;

  const currentItem = exerciseQueue[index] ?? null;

  const advance = useCallback(() => {
    const nextIndex = index + 1;
    if (nextIndex >= exerciseQueue.length) {
      setIsComplete(true);
      const latestResult = resultRef.current;
      const score =
        latestResult.total > 0
          ? Math.round((latestResult.correct / latestResult.total) * 100)
          : 0;
      recordAttempt(dayNum, "cognates", score);
    } else {
      setIndex(nextIndex);
    }
  }, [index, exerciseQueue.length, dayNum, recordAttempt]);

  const handleAnswer = useCallback(
    (correct: boolean) => {
      setResult((prev) => ({
        ...prev,
        total: prev.total + 1,
        correct: prev.correct + (correct ? 1 : 0),
        incorrect: prev.incorrect + (correct ? 0 : 1),
      }));
      // advance happens after a short delay via the child components
    },
    [],
  );

  const restart = useCallback(() => {
    setIndex(0);
    setResult({ total: 0, correct: 0, incorrect: 0, newCards: 0, reviewCards: 0 });
    setIsComplete(false);
  }, []);

  if (!allowed) {
    return null;
  }

  // No cognate rules for this day
  if (rulesForDay.length === 0 && falseCognatesForDay.length === 0) {
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

  if (isComplete) {
    return (
      <ExerciseShell
        title="Cognates"
        subtitle={`Day ${dayNum}`}
        current={exerciseQueue.length}
        total={exerciseQueue.length}
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

  return (
    <ExerciseShell
      title="Cognates"
      subtitle={`Day ${dayNum}`}
      intro="Discover patterns that connect English and Spanish. Many English words transform into Spanish with simple suffix changes — learn the rules and unlock thousands of words instantly."
      current={index + 1}
      total={exerciseQueue.length}
      backTo={`/day/${dayNum}`}
    >
      {currentItem && (
        <CognateExerciseRenderer
          key={currentItem.id}
          item={currentItem}
          onAnswer={handleAnswer}
          onAdvance={advance}
        />
      )}
    </ExerciseShell>
  );
}

// Renders the appropriate component based on exercise item kind
function CognateExerciseRenderer({
  item,
  onAnswer,
  onAdvance,
}: {
  item: CognateExerciseItem;
  onAnswer: (correct: boolean) => void;
  onAdvance: () => void;
}) {
  switch (item.kind) {
    case "rule-intro":
      return (
        <div className="space-y-4">
          <CognateRule rule={item.rule} />
          <div className="flex justify-center">
            <Button
              onClick={onAdvance}
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
          onAnswer={(correct) => {
            onAnswer(correct);
            setTimeout(onAdvance, 0);
          }}
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
          onAnswer={(correct) => {
            onAnswer(correct);
          }}
          onNext={onAdvance}
        />
      );

    case "false-cognate":
      return <FalseCognateCard fc={item.falseCognate} onContinue={onAdvance} />;
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
