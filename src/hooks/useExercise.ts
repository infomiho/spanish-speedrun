import { useState, useCallback } from "react";
import type { SessionState, SessionResult } from "@/lib/types";

interface ExerciseItem {
  id: string;
  [key: string]: unknown;
}

interface UseExerciseOptions<T extends ExerciseItem> {
  items: T[];
  onComplete?: (result: SessionResult) => void;
}

interface UseExerciseReturn<T extends ExerciseItem> {
  current: T | null;
  index: number;
  total: number;
  state: SessionState;
  result: SessionResult;
  isShowingAnswer: boolean;
  showAnswer: () => void;
  recordAnswer: (correct: boolean) => void;
  next: () => void;
  restart: () => void;
}

export function useExercise<T extends ExerciseItem>({
  items,
  onComplete,
}: UseExerciseOptions<T>): UseExerciseReturn<T> {
  const [index, setIndex] = useState(0);
  const [state, setState] = useState<SessionState>(
    items.length > 0 ? "active" : "complete",
  );
  const [isShowingAnswer, setIsShowingAnswer] = useState(false);
  const [result, setResult] = useState<SessionResult>({
    total: 0,
    correct: 0,
    incorrect: 0,
    newCards: 0,
    reviewCards: 0,
  });

  const current = items[index] ?? null;

  const showAnswer = useCallback(() => {
    setIsShowingAnswer(true);
  }, []);

  const recordAnswer = useCallback(
    (correct: boolean) => {
      setResult((prev) => ({
        ...prev,
        total: prev.total + 1,
        correct: prev.correct + (correct ? 1 : 0),
        incorrect: prev.incorrect + (correct ? 0 : 1),
      }));

      setIsShowingAnswer(false);
      const nextIndex = index + 1;
      if (nextIndex >= items.length) {
        setState("complete");
        const finalResult: SessionResult = {
          total: result.total + 1,
          correct: result.correct + (correct ? 1 : 0),
          incorrect: result.incorrect + (correct ? 0 : 1),
          newCards: result.newCards,
          reviewCards: result.reviewCards,
        };
        onComplete?.(finalResult);
      } else {
        setIndex(nextIndex);
      }
    },
    [index, items.length, onComplete, result],
  );

  const next = useCallback(() => {
    setIsShowingAnswer(false);
    const nextIndex = index + 1;
    if (nextIndex >= items.length) {
      setState("complete");
      onComplete?.(result);
    } else {
      setIndex(nextIndex);
    }
  }, [index, items.length, onComplete, result]);

  const restart = useCallback(() => {
    setIndex(0);
    setState(items.length > 0 ? "active" : "complete");
    setIsShowingAnswer(false);
    setResult({ total: 0, correct: 0, incorrect: 0, newCards: 0, reviewCards: 0 });
  }, [items.length]);

  return {
    current,
    index,
    total: items.length,
    state,
    result,
    isShowingAnswer,
    showAnswer,
    recordAnswer,
    next,
    restart,
  };
}
