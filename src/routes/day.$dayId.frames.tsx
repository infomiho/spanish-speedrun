import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useCallback } from "react";
import { useProgressStore } from "@/stores/progress";
import { useDayGuard } from "@/hooks/useDayGuard";
import { getFramesForDay, getCompatibleWords, getVocabUpToDay } from "@/lib/curriculum";
import { shuffle } from "@/lib/shuffle";
import { ExerciseShell } from "@/components/ExerciseShell";
import { SentenceBuilder } from "@/components/SentenceBuilder";
import { QuizResult } from "@/components/QuizResult";
import { useExercise } from "@/hooks/useExercise";
import type { SentenceFrame, VocabWord, SessionResult } from "@/lib/types";

export const Route = createFileRoute("/day/$dayId/frames")({
  component: FramesPage,
});

interface FrameExercise {
  id: string;
  frame: SentenceFrame;
  correctWord: VocabWord;
  distractors: VocabWord[];
}

const MAX_REPEATS_PER_FRAME = 3;

function FramesPage() {
  const { dayId } = Route.useParams();
  const navigate = useNavigate();
  const recordAttempt = useProgressStore((s) => s.recordAttempt);

  const dayNum = Number(dayId);
  const allowed = useDayGuard(dayNum);

  const exercises = useMemo((): FrameExercise[] => {
    const frames = getFramesForDay(dayNum);
    if (frames.length === 0) return [];

    const allDayVocab = getVocabUpToDay(dayNum);

    // Filter to frames that have at least 1 compatible word
    const usableFrames = frames.filter(
      (f) => getCompatibleWords(f, dayNum).length >= 1,
    );
    if (usableFrames.length === 0) return [];

    const items: FrameExercise[] = [];

    // Build a round-robin list so frames interleave (no back-to-back repeats)
    const shuffledFrames = shuffle(usableFrames);

    for (let round = 0; round < MAX_REPEATS_PER_FRAME; round++) {
      // Re-shuffle each round for variety, but avoid placing the same frame
      // at the boundary between rounds
      let roundOrder = shuffle(shuffledFrames);
      if (items.length > 0 && roundOrder[0].id === items[items.length - 1].frame.id) {
        const swapIdx = roundOrder.length > 1 ? 1 : 0;
        [roundOrder[0], roundOrder[swapIdx]] = [roundOrder[swapIdx], roundOrder[0]];
      }

      for (const frame of roundOrder) {
        const compatible = getCompatibleWords(frame, dayNum);
        if (compatible.length === 0) continue;

        // Pick a correct word we haven't used for this frame yet
        const usedWords = items
          .filter((item) => item.frame.id === frame.id)
          .map((item) => item.correctWord.id);

        const unusedCompatible = compatible.filter((w) => !usedWords.includes(w.id));
        const correctWord = unusedCompatible.length > 0
          ? unusedCompatible[Math.floor(Math.random() * unusedCompatible.length)]
          : compatible[Math.floor(Math.random() * compatible.length)];

        // Generate distractors: prefer words NOT in the compatible list
        const compatibleIds = new Set(frame.compatibleVocabIds);
        const nonCompatible = allDayVocab.filter(
          (w) => !compatibleIds.has(w.id) && w.id !== correctWord.id,
        );

        let distractors: VocabWord[];
        if (nonCompatible.length >= 3) {
          distractors = shuffle(nonCompatible).slice(0, 3);
        } else {
          // Fall back to compatible words that aren't the correct answer
          const fallback = compatible.filter((w) => w.id !== correctWord.id);
          distractors = shuffle([...nonCompatible, ...fallback]).slice(0, 3);
        }

        items.push({
          id: `frame-${frame.id}-${round}-${items.length}`,
          frame,
          correctWord,
          distractors,
        });
      }
    }
    return items;
  }, [dayNum]);

  const handleComplete = useCallback(
    (result: SessionResult) => {
      const score =
        result.total > 0
          ? Math.round((result.correct / result.total) * 100)
          : 0;
      recordAttempt(dayNum, "frames", score);
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

