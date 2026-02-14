import { shuffle } from "@/lib/shuffle";
import type { SentenceFrame, VocabWord } from "@/lib/types";

export function generateFrameDistractors(
  frame: SentenceFrame,
  correctWord: VocabWord,
  compatible: VocabWord[],
  allVocab: VocabWord[],
): VocabWord[] {
  const compatibleIds = new Set(frame.compatibleVocabIds);
  const nonCompatible = allVocab.filter(
    (w) => !compatibleIds.has(w.id) && w.id !== correctWord.id,
  );

  if (nonCompatible.length >= 3) {
    return shuffle(nonCompatible).slice(0, 3);
  }

  const fallback = compatible.filter((w) => w.id !== correctWord.id);
  return shuffle([...nonCompatible, ...fallback]).slice(0, 3);
}
