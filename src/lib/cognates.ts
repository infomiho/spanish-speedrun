import type { CognateRule, FalseCognate } from "./types";

/** Strip leading hyphen from a suffix (e.g. "-tion" -> "tion") */
function stripHyphen(s: string): string {
  return s.startsWith("-") ? s.slice(1) : s;
}

/**
 * Apply a cognate rule to transform an English word to Spanish.
 */
export function applyRule(englishWord: string, rule: CognateRule): string {
  const lower = englishWord.toLowerCase();
  const engSuffix = stripHyphen(rule.englishSuffix).toLowerCase();
  const spaSuffix = stripHyphen(rule.spanishSuffix);
  if (!lower.endsWith(engSuffix)) {
    return englishWord;
  }
  const stem = lower.slice(0, -engSuffix.length);
  return stem + spaSuffix;
}

/**
 * Check if an English word matches a cognate rule's suffix pattern.
 */
export function matchesRule(englishWord: string, rule: CognateRule): boolean {
  return englishWord.toLowerCase().endsWith(stripHyphen(rule.englishSuffix).toLowerCase());
}

/**
 * Generate distractor options for a multiple-choice cognate quiz.
 * Returns 3 wrong answers plus the correct one, shuffled.
 */
export function generateDistractors(
  correctSpanish: string,
  rules: CognateRule[],
  englishWord: string,
): string[] {
  const distractors: string[] = [];
  const lower = englishWord.toLowerCase();

  // Strategy 1: Apply wrong rules to the same word
  for (const rule of rules) {
    if (distractors.length >= 3) break;
    const wrongAnswer = applyWrongRule(lower, rule);
    if (wrongAnswer && wrongAnswer !== correctSpanish && !distractors.includes(wrongAnswer)) {
      distractors.push(wrongAnswer);
    }
  }

  // Strategy 2: Mangle the correct answer
  if (distractors.length < 3) {
    const mangledOptions = [
      correctSpanish.slice(0, -1) + "e",
      correctSpanish.slice(0, -2) + "ar",
      correctSpanish + "s",
      correctSpanish.slice(0, -1) + "a",
    ];
    for (const opt of mangledOptions) {
      if (distractors.length >= 3) break;
      if (opt !== correctSpanish && !distractors.includes(opt)) {
        distractors.push(opt);
      }
    }
  }

  // Shuffle all options together
  const options = [...distractors, correctSpanish];
  return shuffleArray(options);
}

function applyWrongRule(word: string, rule: CognateRule): string | null {
  // Find common English suffixes and replace with this rule's Spanish suffix
  const commonSuffixes = ["tion", "sion", "ment", "ous", "ble", "al", "ive", "ty", "ence", "ance"];
  for (const suffix of commonSuffixes) {
    if (word.endsWith(suffix)) {
      return word.slice(0, -suffix.length) + stripHyphen(rule.spanishSuffix);
    }
  }
  return null;
}

/**
 * Check if a word is a known false cognate.
 */
export function isFalseCognate(
  spanishWord: string,
  falseCognates: FalseCognate[],
): FalseCognate | undefined {
  return falseCognates.find(
    (fc) => fc.spanish.toLowerCase() === spanishWord.toLowerCase(),
  );
}

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}
