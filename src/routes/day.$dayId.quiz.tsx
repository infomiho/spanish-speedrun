import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useCallback } from "react";
import { useProgressStore } from "@/stores/progress";
import { useDayGuard } from "@/hooks/useDayGuard";
import {
  getVocabForDay,
  getVocabUpToDay,
  getCognateRulesForDay,
  getFramesForDay,
  getCompatibleWords,
  getVerbsForDay,
  getVerbsUpToDay,
} from "@/lib/curriculum";
import { shuffle } from "@/lib/shuffle";
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
import type { SessionResult, VocabWord, SentenceFrame, VerbEntry, CognateRule } from "@/lib/types";

export const Route = createFileRoute("/day/$dayId/quiz")({
  component: QuizPage,
});

type Pronoun = "yo" | "tú" | "él";

type QuizItem =
  | { id: string; kind: "vocab"; word: VocabWord; options: string[]; correctIndex: number }
  | { id: string; kind: "cognate"; english: string; spanish: string; rule: CognateRule }
  | { id: string; kind: "frame"; frame: SentenceFrame; correctWord: VocabWord; distractors: VocabWord[] }
  | { id: string; kind: "verb"; verb: VerbEntry; pronoun: Pronoun };

function QuizPage() {
  const { dayId } = Route.useParams();
  const navigate = useNavigate();
  const recordAttempt = useProgressStore((s) => s.recordAttempt);
  const canTakeQuiz = useProgressStore((s) => s.canTakeQuiz);

  const dayNum = Number(dayId);
  const allowed = useDayGuard(dayNum);

  const quizUnlocked = canTakeQuiz(dayNum);

  const exercises = useMemo((): QuizItem[] => {
    if (!quizUnlocked) return [];

    const items: QuizItem[] = [];
    const dayVocab = getVocabForDay(dayNum);
    const allVocab = getVocabUpToDay(dayNum);
    const pronouns: Pronoun[] = ["yo", "tú", "él"];

    // ~5 vocab multiple choice questions
    const vocabPool = shuffle(dayVocab).slice(0, 5);
    for (const word of vocabPool) {
      const distractors = shuffle(
        dayVocab.filter((w) => w.id !== word.id).map((w) => w.english),
      ).slice(0, 3);

      if (distractors.length < 3) {
        const extraDistractors = shuffle(
          allVocab
            .filter((w) => w.id !== word.id && !distractors.includes(w.english))
            .map((w) => w.english),
        ).slice(0, 3 - distractors.length);
        distractors.push(...extraDistractors);
      }

      const options = shuffle([word.english, ...distractors.slice(0, 3)]);
      const correctIndex = options.indexOf(word.english);

      items.push({
        id: `vocab-${word.id}`,
        kind: "vocab",
        word,
        options,
        correctIndex,
      });
    }

    // ~3 cognate transforms
    const cognateRules = getCognateRulesForDay(dayNum);
    for (const rule of shuffle(cognateRules).slice(0, 3)) {
      if (rule.examples.length > 0) {
        const example = rule.examples[Math.floor(Math.random() * rule.examples.length)];
        items.push({
          id: `cognate-${rule.id}`,
          kind: "cognate",
          english: example.english,
          spanish: example.spanish,
          rule,
        });
      }
    }

    // ~3 sentence frames
    const frames = getFramesForDay(dayNum);
    for (const frame of shuffle(frames).slice(0, 3)) {
      const compatible = getCompatibleWords(frame, dayNum);
      if (compatible.length === 0) continue;

      const correctWord = compatible[Math.floor(Math.random() * compatible.length)];

      // Generate distractors: prefer words NOT in the compatible list
      const compatibleIds = new Set(frame.compatibleVocabIds);
      const nonCompatible = allVocab.filter(
        (w) => !compatibleIds.has(w.id) && w.id !== correctWord.id,
      );

      let distractors: VocabWord[];
      if (nonCompatible.length >= 3) {
        distractors = shuffle(nonCompatible).slice(0, 3);
      } else {
        const fallback = compatible.filter((w) => w.id !== correctWord.id);
        distractors = shuffle([...nonCompatible, ...fallback]).slice(0, 3);
      }

      items.push({
        id: `frame-${frame.id}`,
        kind: "frame",
        frame,
        correctWord,
        distractors,
      });
    }

    // ~4 verb conjugations
    const dayVerbs = getVerbsForDay(dayNum);
    const reviewVerbs = dayNum > 2 ? getVerbsUpToDay(dayNum - 1) : [];
    const verbPool = shuffle([...dayVerbs, ...shuffle(reviewVerbs).slice(0, 2)]).slice(0, 4);
    for (const verb of verbPool) {
      const pronoun = pronouns[Math.floor(Math.random() * pronouns.length)];
      items.push({
        id: `verb-${verb.id}-${pronoun}`,
        kind: "verb",
        verb,
        pronoun,
      });
    }

    return shuffle(items).slice(0, 15);
  }, [dayNum, quizUnlocked]);

  const handleComplete = useCallback(
    (result: SessionResult) => {
      const score =
        result.total > 0
          ? Math.round((result.correct / result.total) * 100)
          : 0;
      recordAttempt(dayNum, "quiz", score);
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

