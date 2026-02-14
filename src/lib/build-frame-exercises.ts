import { getFramesForDay, getCompatibleWords, getVocabUpToDay } from "@/lib/curriculum";
import { shuffle } from "@/lib/shuffle";
import { generateFrameDistractors } from "@/lib/distractors";
import type { SentenceFrame, VocabWord } from "@/lib/types";

export interface FrameExercise {
  id: string;
  frame: SentenceFrame;
  correctWord: VocabWord;
  distractors: VocabWord[];
}

export const MAX_REPEATS_PER_FRAME = 3;

export function buildFrameExercises(dayNum: number): FrameExercise[] {
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

      const distractors = generateFrameDistractors(frame, correctWord, compatible, allDayVocab);

      items.push({
        id: `frame-${frame.id}-${round}-${items.length}`,
        frame,
        correctWord,
        distractors,
      });
    }
  }
  return items;
}
