import { vocabulary } from "./data/vocabulary";
import { cognateRules, falseCognates } from "./data/cognate-rules";
import { sentenceFrames } from "./data/sentence-frames";
import { verbs } from "./data/verbs";
import { days } from "./data/days";
import type {
  VocabWord,
  CognateRule,
  FalseCognate,
  SentenceFrame,
  VerbEntry,
  DayPlan,
} from "./types";

export function getDayPlan(day: number): DayPlan | undefined {
  return days.find((d) => d.day === day);
}

export function getVocabForDay(day: number): VocabWord[] {
  return vocabulary.filter((w) => w.day === day);
}

export function getVocabUpToDay(day: number): VocabWord[] {
  return vocabulary.filter((w) => w.day <= day);
}

export function getCognateRulesForDay(day: number): CognateRule[] {
  return cognateRules.filter((r) => r.day === day);
}

export function getCognateRulesUpToDay(day: number): CognateRule[] {
  return cognateRules.filter((r) => r.day <= day);
}

export function getFalseCognatesForDay(day: number): FalseCognate[] {
  return falseCognates.filter((fc) => fc.day === day);
}

export function getFalseCognatesUpToDay(day: number): FalseCognate[] {
  return falseCognates.filter((fc) => fc.day <= day);
}

export function getFramesForDay(day: number): SentenceFrame[] {
  return sentenceFrames.filter((f) => f.day === day);
}

export function getFramesUpToDay(day: number): SentenceFrame[] {
  return sentenceFrames.filter((f) => f.day <= day);
}

export function getVerbsForDay(day: number): VerbEntry[] {
  return verbs.filter((v) => v.day === day);
}

export function getVerbsUpToDay(day: number): VerbEntry[] {
  return verbs.filter((v) => v.day <= day);
}

/**
 * Get compatible vocabulary words for a sentence frame, limited to what's been taught up to `day`.
 */
export function getCompatibleWords(
  frame: SentenceFrame,
  day: number,
): VocabWord[] {
  const availableVocab = getVocabUpToDay(day);

  if (frame.compatibleVocabIds.length > 0) {
    return availableVocab.filter((w) =>
      frame.compatibleVocabIds.includes(w.id),
    );
  }

  // Fallback: filter by slot type matching word category
  return availableVocab.filter((w) => {
    if (frame.slotType === "any") return true;
    if (frame.slotType === "noun") return w.category === "noun";
    if (frame.slotType === "verb") return w.category === "verb";
    if (frame.slotType === "adjective") return w.category === "adjective";
    if (frame.slotType === "infinitive") return w.category === "verb";
    return false;
  });
}

/**
 * Get all vocabulary words (for global review).
 */
export function getAllVocab(): VocabWord[] {
  return vocabulary;
}

export function getAllDays(): DayPlan[] {
  return days;
}
