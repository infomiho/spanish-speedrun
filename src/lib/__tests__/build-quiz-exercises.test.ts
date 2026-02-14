import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type { VocabWord, CognateRule, SentenceFrame, VerbEntry } from "@/lib/types";

vi.mock("@/lib/shuffle", () => ({
  shuffle: <T>(arr: T[]): T[] => [...arr],
}));

// -- Test data helpers --

function makeVocab(id: string, day: number, english?: string): VocabWord {
  return {
    id,
    spanish: `es_${id}`,
    english: english ?? `en_${id}`,
    category: "noun",
    day,
  };
}

function makeRule(id: string, day: number, examples?: { english: string; spanish: string }[]): CognateRule {
  return {
    id,
    englishSuffix: "-tion",
    spanishSuffix: "-ción",
    description: `rule ${id}`,
    examples: examples ?? [{ english: `eng_${id}`, spanish: `spa_${id}` }],
    day,
  };
}

function makeFrame(id: string, day: number, compatibleVocabIds: string[]): SentenceFrame {
  return {
    id,
    template: `I ___ ${id}`,
    english: `I blank ${id}`,
    tier: 1,
    day,
    slotType: "noun",
    compatibleVocabIds,
  };
}

function makeVerb(id: string, day: number): VerbEntry {
  return {
    id,
    infinitive: `inf_${id}`,
    english: `en_${id}`,
    day,
    isRegular: true,
    conjugations: { yo: `yo_${id}`, tú: `tu_${id}`, él: `el_${id}` },
  };
}

// -- Shared test data --

const dayVocab = [
  makeVocab("v1", 1, "cat"),
  makeVocab("v2", 1, "dog"),
  makeVocab("v3", 1, "fish"),
  makeVocab("v4", 1, "bird"),
  makeVocab("v5", 1, "frog"),
  makeVocab("v6", 1, "bear"),
];

const extraVocab = [
  makeVocab("v7", 0, "lion"),
  makeVocab("v8", 0, "wolf"),
  makeVocab("v9", 0, "deer"),
];

const allVocab = [...dayVocab, ...extraVocab];

const cognateRules = [
  makeRule("r1", 1),
  makeRule("r2", 1),
  makeRule("r3", 1),
  makeRule("r4", 1),
];

const frames = [
  makeFrame("f1", 1, ["v1", "v2"]),
  makeFrame("f2", 1, ["v3"]),
  makeFrame("f3", 1, ["v4", "v5"]),
];

const dayVerbs = [
  makeVerb("vb1", 1),
  makeVerb("vb2", 1),
  makeVerb("vb3", 1),
  makeVerb("vb4", 1),
  makeVerb("vb5", 1),
];

vi.mock("@/lib/curriculum", () => ({
  getVocabForDay: vi.fn(() => dayVocab),
  getVocabUpToDay: vi.fn(() => allVocab),
  getCognateRulesForDay: vi.fn(() => cognateRules),
  getFramesForDay: vi.fn(() => frames),
  getCompatibleWords: vi.fn((frame: SentenceFrame) => {
    return allVocab.filter((w) => frame.compatibleVocabIds.includes(w.id));
  }),
  getVerbsForDay: vi.fn(() => dayVerbs),
  getVerbsUpToDay: vi.fn(() => []),
}));

import { buildQuizExercises, type QuizItem } from "@/lib/build-quiz-exercises";

let mathRandomSpy: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  mathRandomSpy = vi.spyOn(Math, "random").mockReturnValue(0);
});

afterEach(() => {
  mathRandomSpy.mockRestore();
});

describe("buildQuizExercises", () => {
  it("returns empty array when quizUnlocked is false", () => {
    expect(buildQuizExercises(1, false)).toEqual([]);
  });

  it("returns max 15 items", () => {
    const items = buildQuizExercises(1, true);
    expect(items.length).toBeLessThanOrEqual(15);
  });

  it("produces vocab items with kind 'vocab' and 4 options with correct answer present", () => {
    const items = buildQuizExercises(1, true);
    const vocabItems = items.filter((i): i is Extract<QuizItem, { kind: "vocab" }> => i.kind === "vocab");
    expect(vocabItems.length).toBeGreaterThan(0);

    for (const item of vocabItems) {
      expect(item.kind).toBe("vocab");
      expect(item.options).toHaveLength(4);
      expect(item.options).toContain(item.word.english);
    }
  });

  it("produces cognate items with kind 'cognate'", () => {
    const items = buildQuizExercises(1, true);
    const cognateItems = items.filter((i): i is Extract<QuizItem, { kind: "cognate" }> => i.kind === "cognate");
    expect(cognateItems.length).toBeGreaterThan(0);

    for (const item of cognateItems) {
      expect(item.kind).toBe("cognate");
      expect(item.english).toBeDefined();
      expect(item.spanish).toBeDefined();
      expect(item.rule).toBeDefined();
    }
  });

  it("produces frame items with kind 'frame' with correct word and distractors", () => {
    const items = buildQuizExercises(1, true);
    const frameItems = items.filter((i): i is Extract<QuizItem, { kind: "frame" }> => i.kind === "frame");
    expect(frameItems.length).toBeGreaterThan(0);

    for (const item of frameItems) {
      expect(item.kind).toBe("frame");
      expect(item.correctWord).toBeDefined();
      expect(item.frame.compatibleVocabIds).toContain(item.correctWord.id);
      expect(item.distractors.length).toBeGreaterThan(0);
      expect(item.distractors.length).toBeLessThanOrEqual(3);
      expect(item.distractors.every((d) => d.id !== item.correctWord.id)).toBe(true);
    }
  });

  it("produces verb items with kind 'verb' with a valid pronoun", () => {
    const items = buildQuizExercises(1, true);
    const verbItems = items.filter((i): i is Extract<QuizItem, { kind: "verb" }> => i.kind === "verb");
    expect(verbItems.length).toBeGreaterThan(0);

    const validPronouns = ["yo", "tú", "él"];
    for (const item of verbItems) {
      expect(item.kind).toBe("verb");
      expect(validPronouns).toContain(item.pronoun);
      expect(item.verb).toBeDefined();
    }
  });

  it("mixes vocab, cognate, frame, and verb items in the output", () => {
    const items = buildQuizExercises(1, true);
    const kinds = new Set(items.map((i) => i.kind));
    expect(kinds.has("vocab")).toBe(true);
    expect(kinds.has("cognate")).toBe(true);
    expect(kinds.has("frame")).toBe(true);
    expect(kinds.has("verb")).toBe(true);
  });

  it("vocab items have correct answer at the right index", () => {
    const items = buildQuizExercises(1, true);
    const vocabItems = items.filter((i): i is Extract<QuizItem, { kind: "vocab" }> => i.kind === "vocab");

    for (const item of vocabItems) {
      expect(item.options[item.correctIndex]).toBe(item.word.english);
    }
  });
});
