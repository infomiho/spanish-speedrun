import { getVerbsForDay, getVerbsUpToDay } from "@/lib/curriculum";
import { shuffle } from "@/lib/shuffle";
import type { VerbEntry } from "@/lib/types";

export type Pronoun = "yo" | "tú" | "él";

export interface VerbExercise {
  id: string;
  verb: VerbEntry;
  mode: "display" | "quiz";
  targetPronoun?: Pronoun;
}

export const TARGET_EXERCISES = 14;
const PRONOUNS: Pronoun[] = ["yo", "tú", "él"];

export function buildVerbExercises(dayNum: number): VerbExercise[] {
  if (dayNum < 2) return [];

  const dayVerbs = getVerbsForDay(dayNum);
  const reviewVerbs = getVerbsUpToDay(dayNum - 1);
  const items: VerbExercise[] = [];

  // Display mode for new verbs first
  for (const verb of dayVerbs) {
    items.push({
      id: `display-${verb.id}`,
      verb,
      mode: "display",
    });
  }

  // Quiz mode for new verbs (each pronoun)
  for (const verb of dayVerbs) {
    const pronoun = PRONOUNS[Math.floor(Math.random() * PRONOUNS.length)];
    items.push({
      id: `quiz-new-${verb.id}`,
      verb,
      mode: "quiz",
      targetPronoun: pronoun,
    });
  }

  // Quiz mode for review verbs
  const shuffledReview = shuffle(reviewVerbs);
  for (const verb of shuffledReview) {
    if (items.length >= TARGET_EXERCISES) break;
    const pronoun = PRONOUNS[Math.floor(Math.random() * PRONOUNS.length)];
    items.push({
      id: `quiz-review-${verb.id}`,
      verb,
      mode: "quiz",
      targetPronoun: pronoun,
    });
  }

  // If still not enough, add more quiz exercises for day verbs with different pronouns
  let extra = 0;
  while (items.length < TARGET_EXERCISES && dayVerbs.length > 0) {
    const verb = dayVerbs[extra % dayVerbs.length];
    const pronoun = PRONOUNS[extra % PRONOUNS.length];
    items.push({
      id: `quiz-extra-${verb.id}-${extra}`,
      verb,
      mode: "quiz",
      targetPronoun: pronoun,
    });
    extra++;
    if (extra > TARGET_EXERCISES) break;
  }

  return items.slice(0, TARGET_EXERCISES);
}
