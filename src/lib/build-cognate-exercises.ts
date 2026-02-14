import { generateDistractors } from "@/lib/cognates";
import { shuffle } from "@/lib/shuffle";
import type { CognateRule, FalseCognate } from "@/lib/types";

// Exercise item types for the mixed queue
export type CognateExerciseItem =
  | { kind: "rule-intro"; id: string; rule: CognateRule }
  | {
      kind: "type-answer";
      id: string;
      english: string;
      correctSpanish: string;
      rule: CognateRule;
    }
  | {
      kind: "multiple-choice";
      id: string;
      english: string;
      options: string[];
      correctIndex: number;
      rule: CognateRule;
    }
  | {
      kind: "false-cognate";
      id: string;
      falseCognate: FalseCognate;
    };

export function buildExerciseQueue(
  rules: CognateRule[],
  falseCognates: FalseCognate[],
  allRules: CognateRule[],
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
