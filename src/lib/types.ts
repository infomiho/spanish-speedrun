// ============================================================
// Core Data Types
// ============================================================

export interface VocabWord {
  id: string;
  spanish: string;
  english: string;
  category: WordCategory;
  day: number;
  frequencyRank?: number;
  tags?: string[];
}

export type WordCategory =
  | "noun"
  | "verb"
  | "adjective"
  | "adverb"
  | "pronoun"
  | "preposition"
  | "conjunction"
  | "determiner"
  | "number"
  | "phrase"
  | "question"
  | "interjection";

export interface CognateRule {
  id: string;
  englishSuffix: string;
  spanishSuffix: string;
  description: string;
  examples: CognateExample[];
  day: number;
}

export interface CognateExample {
  english: string;
  spanish: string;
}

export interface FalseCognate {
  id: string;
  spanish: string;
  looksLike: string;
  actualMeaning: string;
  day: number;
}

export interface SentenceFrame {
  id: string;
  template: string;
  english: string;
  tier: 1 | 2 | 3 | 4;
  day: number;
  slotType: SlotType;
  compatibleVocabIds: string[];
}

export type SlotType = "noun" | "verb" | "adjective" | "infinitive" | "name" | "any";

export interface VerbEntry {
  id: string;
  infinitive: string;
  english: string;
  day: number;
  isRegular: boolean;
  conjugations: VerbConjugations;
}

export interface VerbConjugations {
  yo: string;
  tú: string;
  él: string;
}

// ============================================================
// Day / Curriculum Types
// ============================================================

export interface DayPlan {
  day: number;
  title: string;
  subtitle: string;
  focusAreas: string[];
  exerciseTypes: ExerciseType[];
  newWordCount: number;
}

export type ExerciseType = "vocab" | "cognates" | "frames" | "verbs" | "quiz";

// ============================================================
// SRS Types
// ============================================================

export interface SrsCard {
  id: string;
  type: SrsCardType;
  front: string;
  back: string;
  sourceId: string;
  interval: number;       // seconds
  easeFactor: number;
  repetitions: number;
  dueAt: number;          // timestamp (ms)
  lastReviewedAt?: number; // timestamp (ms)
}

export type SrsCardType = "vocab" | "cognate" | "frame" | "verb";

export type SrsQuality = 0 | 1 | 2 | 3 | 4 | 5;

// ============================================================
// Exercise Types
// ============================================================

export interface Exercise {
  id: string;
  type: ExerciseType;
  question: ExerciseQuestion;
  answer: string;
  options?: string[];
}

export type ExerciseQuestion =
  | { kind: "translate"; word: string; from: "en" | "es" }
  | { kind: "cognateTransform"; english: string; rule: CognateRule }
  | { kind: "fillFrame"; frame: SentenceFrame }
  | { kind: "conjugate"; verb: VerbEntry; pronoun: "yo" | "tú" | "él" }
  | { kind: "multipleChoice"; prompt: string; options: string[]; correctIndex: number };

// ============================================================
// Progress Types
// ============================================================

export interface ExerciseCompletion {
  type: ExerciseType;
  bestScore: number;
  attempts: number;
  completed: boolean;
  lastAttemptAt?: number;
}

export interface DayProgress {
  [exerciseType: string]: ExerciseCompletion;
}

// ============================================================
// Session Types
// ============================================================

export type SessionState = "intro" | "active" | "review" | "complete";

export interface SessionResult {
  total: number;
  correct: number;
  incorrect: number;
  newCards: number;
  reviewCards: number;
}
