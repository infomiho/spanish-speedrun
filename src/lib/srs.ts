import type { SrsCard, SrsQuality } from "./types";

// Compressed intervals for 10-day intensive program
// 1min → 10min → 1hr → 4hr
const INITIAL_INTERVALS = [60, 600, 3600, 14400];

// Max interval: 3 days (adequate for 10-day program)
const MAX_INTERVAL = 3 * 24 * 3600;

const MIN_EASE_FACTOR = 1.3;
const DEFAULT_EASE_FACTOR = 2.5;

export function createNewCard(
  id: string,
  type: SrsCard["type"],
  front: string,
  back: string,
  sourceId: string,
): SrsCard {
  return {
    id,
    type,
    front,
    back,
    sourceId,
    interval: INITIAL_INTERVALS[0],
    easeFactor: DEFAULT_EASE_FACTOR,
    repetitions: 0,
    dueAt: 0, // immediately due
  };
}

/**
 * Modified SM-2 algorithm compressed for 10-day intensive learning.
 *
 * Quality scale:
 *   0 = complete blackout
 *   1 = incorrect, but recognized answer
 *   2 = incorrect, but easy to recall once shown
 *   3 = correct with serious difficulty
 *   4 = correct with some hesitation
 *   5 = perfect response
 *
 * Simplified for flashcard UI:
 *   "Still learning" → quality 1
 *   "I knew it" → quality 4
 */
export function reviewCard(card: SrsCard, quality: SrsQuality): SrsCard {
  const now = Date.now();

  if (quality < 3) {
    // Failed: reset to first interval
    return {
      ...card,
      interval: INITIAL_INTERVALS[0],
      repetitions: 0,
      dueAt: now + INITIAL_INTERVALS[0] * 1000,
      lastReviewedAt: now,
    };
  }

  // Passed: advance through intervals
  const newRepetitions = card.repetitions + 1;
  let newInterval: number;

  if (newRepetitions <= INITIAL_INTERVALS.length) {
    // Still in compressed initial phase
    newInterval = INITIAL_INTERVALS[newRepetitions - 1];
  } else {
    // Graduated: use SM-2 ease factor
    newInterval = Math.round(card.interval * card.easeFactor);
  }

  // Cap interval
  newInterval = Math.min(newInterval, MAX_INTERVAL);

  // Update ease factor (SM-2 formula)
  const newEaseFactor = Math.max(
    MIN_EASE_FACTOR,
    card.easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02)),
  );

  return {
    ...card,
    interval: newInterval,
    easeFactor: newEaseFactor,
    repetitions: newRepetitions,
    dueAt: now + newInterval * 1000,
    lastReviewedAt: now,
  };
}

export function isDue(card: SrsCard): boolean {
  return Date.now() >= card.dueAt;
}

export function getDueCards(cards: SrsCard[]): SrsCard[] {
  return cards.filter(isDue).sort((a, b) => a.dueAt - b.dueAt);
}

export function getNewCards(cards: SrsCard[]): SrsCard[] {
  return cards.filter((c) => c.repetitions === 0 && c.dueAt === 0);
}

export const MAX_REVIEW_PER_SESSION = 30;

export interface ReviewSession {
  sessionCards: SrsCard[];
  totalDue: number;
}

export function buildReviewSession(
  cards: SrsCard[],
  limit = MAX_REVIEW_PER_SESSION,
): ReviewSession {
  const allDue = getDueCards(cards);
  return {
    sessionCards: allDue.slice(0, limit),
    totalDue: allDue.length,
  };
}
