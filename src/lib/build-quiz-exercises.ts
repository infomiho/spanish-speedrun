import {
  getVocabForDay,
  getVocabUpToDay,
  getCognateRulesForDay,
  getFramesForDay,
  getCompatibleWords,
  getVerbsForDay,
  getVerbsUpToDay,
} from "@/lib/curriculum";
import { shuffle } from "@/lib/shuffle";
import { generateFrameDistractors } from "@/lib/distractors";
import type { VocabWord, SentenceFrame, VerbEntry, CognateRule } from "@/lib/types";

export type Pronoun = "yo" | "tú" | "él";

export type QuizItem =
  | { id: string; kind: "vocab"; word: VocabWord; options: string[]; correctIndex: number }
  | { id: string; kind: "cognate"; english: string; spanish: string; rule: CognateRule }
  | { id: string; kind: "frame"; frame: SentenceFrame; correctWord: VocabWord; distractors: VocabWord[] }
  | { id: string; kind: "verb"; verb: VerbEntry; pronoun: Pronoun };

export function buildQuizExercises(dayNum: number, quizUnlocked: boolean): QuizItem[] {
  if (!quizUnlocked) return [];

  const items: QuizItem[] = [];
  const dayVocab = getVocabForDay(dayNum);
  const allVocab = getVocabUpToDay(dayNum);
  const pronouns: Pronoun[] = ["yo", "tú", "él"];

  // ~5 vocab multiple choice questions
  const vocabPool = shuffle(dayVocab).slice(0, 5);
  for (const word of vocabPool) {
    const distractors = shuffle(
      dayVocab.filter((w) => w.id !== word.id).map((w) => w.english),
    ).slice(0, 3);

    if (distractors.length < 3) {
      const extraDistractors = shuffle(
        allVocab
          .filter((w) => w.id !== word.id && !distractors.includes(w.english))
          .map((w) => w.english),
      ).slice(0, 3 - distractors.length);
      distractors.push(...extraDistractors);
    }

    const options = shuffle([word.english, ...distractors.slice(0, 3)]);
    const correctIndex = options.indexOf(word.english);

    items.push({
      id: `vocab-${word.id}`,
      kind: "vocab",
      word,
      options,
      correctIndex,
    });
  }

  // ~3 cognate transforms
  const cognateRules = getCognateRulesForDay(dayNum);
  for (const rule of shuffle(cognateRules).slice(0, 3)) {
    if (rule.examples.length > 0) {
      const example = rule.examples[Math.floor(Math.random() * rule.examples.length)];
      items.push({
        id: `cognate-${rule.id}`,
        kind: "cognate",
        english: example.english,
        spanish: example.spanish,
        rule,
      });
    }
  }

  // ~3 sentence frames
  const frames = getFramesForDay(dayNum);
  for (const frame of shuffle(frames).slice(0, 3)) {
    const compatible = getCompatibleWords(frame, dayNum);
    if (compatible.length === 0) continue;

    const correctWord = compatible[Math.floor(Math.random() * compatible.length)];

    const distractors = generateFrameDistractors(frame, correctWord, compatible, allVocab);

    items.push({
      id: `frame-${frame.id}`,
      kind: "frame",
      frame,
      correctWord,
      distractors,
    });
  }

  // ~4 verb conjugations
  const dayVerbs = getVerbsForDay(dayNum);
  const reviewVerbs = dayNum > 2 ? getVerbsUpToDay(dayNum - 1) : [];
  const verbPool = shuffle([...dayVerbs, ...shuffle(reviewVerbs).slice(0, 2)]).slice(0, 4);
  for (const verb of verbPool) {
    const pronoun = pronouns[Math.floor(Math.random() * pronouns.length)];
    items.push({
      id: `verb-${verb.id}-${pronoun}`,
      kind: "verb",
      verb,
      pronoun,
    });
  }

  return shuffle(items).slice(0, 15);
}
