import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import { useSrsStore } from "@/stores/srs";
import { getDueCards as getDueCardsLib } from "@/lib/srs";
import type { SrsCard, SrsQuality, SessionResult } from "@/lib/types";
import type { VocabWord } from "@/lib/types";

const MAX_NEW_PER_SESSION = 15;
const MAX_REVIEW_PER_SESSION = 30;

interface UseSrsSessionOptions {
  newWords?: VocabWord[];
  onComplete?: (result: SessionResult) => void;
}

interface UseSrsSessionReturn {
  current: SrsCard | null;
  index: number;
  total: number;
  isComplete: boolean;
  result: SessionResult;
  answer: (quality: SrsQuality) => void;
  restart: () => void;
}

export function useSrsSession({
  newWords = [],
  onComplete,
}: UseSrsSessionOptions): UseSrsSessionReturn {
  const addCardsIfNotExist = useSrsStore((s) => s.addCardsIfNotExist);
  const review = useSrsStore((s) => s.review);
  const cards = useSrsStore((s) => s.cards);

  // Ensure new words have SRS cards (single batch update)
  useEffect(() => {
    if (newWords.length === 0) return;
    addCardsIfNotExist(
      newWords.map((word) => ({
        id: `vocab-${word.id}`,
        type: "vocab" as const,
        front: word.spanish,
        back: word.english,
        sourceId: word.id,
      })),
    );
  }, [newWords, addCardsIfNotExist]);

  // Build session queue: new cards first, then due reviews
  const [sessionCards, setSessionCards] = useState<string[]>([]);
  const [index, setIndex] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [result, setResult] = useState<SessionResult>({
    total: 0,
    correct: 0,
    incorrect: 0,
    newCards: 0,
    reviewCards: 0,
  });

  const sessionBuilt = useRef(false);

  const buildSession = useCallback(() => {
    const currentCards = useSrsStore.getState().cards;
    const newCardIds = newWords
      .slice(0, MAX_NEW_PER_SESSION)
      .map((w) => `vocab-${w.id}`)
      .filter((id) => {
        const card = currentCards[id];
        return card && card.repetitions === 0;
      });

    const allCards = Object.values(currentCards);
    const dueCards = getDueCardsLib(allCards)
      .filter((c) => !newCardIds.includes(c.id))
      .slice(0, MAX_REVIEW_PER_SESSION)
      .map((c) => c.id);

    const queue = [...newCardIds, ...dueCards];
    setSessionCards(queue);
    setIndex(0);
    setIsComplete(queue.length === 0);
    setResult({
      total: 0,
      correct: 0,
      incorrect: 0,
      newCards: newCardIds.length,
      reviewCards: dueCards.length,
    });
  }, [newWords]);

  // Build session once cards are ready
  useEffect(() => {
    if (sessionBuilt.current) return;
    // Wait until the cards have been added
    const newCardIds = newWords.map((w) => `vocab-${w.id}`);
    const allPresent = newCardIds.length === 0 || newCardIds.every((id) => cards[id]);
    if (allPresent) {
      sessionBuilt.current = true;
      buildSession();
    }
  }, [newWords, cards, buildSession]);

  const current = useMemo(() => {
    if (isComplete || index >= sessionCards.length) return null;
    return cards[sessionCards[index]] ?? null;
  }, [index, sessionCards, isComplete, cards]);

  const answer = useCallback(
    (quality: SrsQuality) => {
      const cardId = sessionCards[index];
      if (!cardId) return;

      review(cardId, quality);

      const correct = quality >= 3;
      const newResult: SessionResult = {
        ...result,
        total: result.total + 1,
        correct: result.correct + (correct ? 1 : 0),
        incorrect: result.incorrect + (correct ? 0 : 1),
      };
      setResult(newResult);

      const nextIndex = index + 1;
      if (nextIndex >= sessionCards.length) {
        setIsComplete(true);
        onComplete?.(newResult);
      } else {
        setIndex(nextIndex);
      }
    },
    [index, sessionCards, review, result, onComplete],
  );

  const restart = useCallback(() => {
    sessionBuilt.current = false;
    buildSession();
    sessionBuilt.current = true;
  }, [buildSession]);

  return {
    current,
    index,
    total: sessionCards.length,
    isComplete,
    result,
    answer,
    restart,
  };
}
