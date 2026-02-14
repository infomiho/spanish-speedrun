import { describe, it, expect, vi, afterEach } from "vitest";
import type { CognateRule, FalseCognate } from "@/lib/types";

vi.mock("@/lib/shuffle", () => ({
  shuffle: <T>(arr: T[]): T[] => [...arr],
}));

vi.mock("@/lib/cognates", () => ({
  generateDistractors: (correct: string) => ["wrong1", "wrong2", "wrong3", correct],
}));

import { buildExerciseQueue } from "@/lib/build-cognate-exercises";

afterEach(() => {
  vi.restoreAllMocks();
});

function makeRule(
  id: string,
  exampleCount: number,
  overrides: Partial<CognateRule> = {},
): CognateRule {
  const examples = Array.from({ length: exampleCount }, (_, i) => ({
    english: `eng${i}`,
    spanish: `spa${i}`,
  }));
  return {
    id,
    englishSuffix: "-tion",
    spanishSuffix: "-ción",
    description: `rule ${id}`,
    examples,
    day: 1,
    ...overrides,
  };
}

function makeFalseCognate(id: string): FalseCognate {
  return {
    id,
    spanish: `falso-${id}`,
    looksLike: `false-${id}`,
    actualMeaning: `meaning-${id}`,
    day: 1,
  };
}

describe("buildExerciseQueue", () => {
  it("produces rule-intro -> type-answer -> multiple-choice sequence per rule", () => {
    const rule = makeRule("r1", 4);
    const queue = buildExerciseQueue([rule], [], [rule]);

    expect(queue[0].kind).toBe("rule-intro");
    const typeAnswers = queue.filter((item) => item.kind === "type-answer");
    const mcItems = queue.filter((item) => item.kind === "multiple-choice");

    // type-answers come before multiple-choice
    const firstTypeIdx = queue.findIndex((item) => item.kind === "type-answer");
    const firstMcIdx = queue.findIndex((item) => item.kind === "multiple-choice");
    expect(firstTypeIdx).toBeLessThan(firstMcIdx);

    expect(typeAnswers.length).toBeGreaterThan(0);
    expect(mcItems.length).toBeGreaterThan(0);
  });

  it("uses 3 examples per type when rule has >= 6 examples", () => {
    const rule = makeRule("r1", 8);
    const queue = buildExerciseQueue([rule], [], [rule]);

    const typeAnswers = queue.filter((item) => item.kind === "type-answer");
    const mcItems = queue.filter((item) => item.kind === "multiple-choice");

    expect(typeAnswers.length).toBe(3);
    expect(mcItems.length).toBe(3);
  });

  it("uses 2 examples per type when rule has < 6 examples", () => {
    const rule = makeRule("r1", 4);
    const queue = buildExerciseQueue([rule], [], [rule]);

    const typeAnswers = queue.filter((item) => item.kind === "type-answer");
    const mcItems = queue.filter((item) => item.kind === "multiple-choice");

    expect(typeAnswers.length).toBe(2);
    expect(mcItems.length).toBe(2);
  });

  it("non-overlapping example sets for type-answer vs MC when enough examples", () => {
    // 8 examples -> perType=3, typeExamples=[0,1,2], mcExamples=[3,4,5]
    const rule = makeRule("r1", 8);
    const queue = buildExerciseQueue([rule], [], [rule]);

    const typeEnglish = queue
      .filter((item) => item.kind === "type-answer")
      .map((item) => (item as { english: string }).english);
    const mcEnglish = queue
      .filter((item) => item.kind === "multiple-choice")
      .map((item) => (item as { english: string }).english);

    // Should be no overlap
    for (const eng of typeEnglish) {
      expect(mcEnglish).not.toContain(eng);
    }
  });

  it("overlapping example sets when not enough examples", () => {
    // 3 examples -> perType=2, shuffled.length(3) < perType*2(4)
    // so mcExamples = shuffled.slice(0, 2) = same as typeExamples
    const rule = makeRule("r1", 3);
    const queue = buildExerciseQueue([rule], [], [rule]);

    const typeEnglish = queue
      .filter((item) => item.kind === "type-answer")
      .map((item) => (item as { english: string }).english);
    const mcEnglish = queue
      .filter((item) => item.kind === "multiple-choice")
      .map((item) => (item as { english: string }).english);

    expect(typeEnglish).toEqual(mcEnglish);
  });

  it("false cognates inserted at calculated positions", () => {
    const rule = makeRule("r1", 6);
    const fc = makeFalseCognate("fc1");
    const queue = buildExerciseQueue([rule], [fc], [rule]);

    const fcItems = queue.filter((item) => item.kind === "false-cognate");
    expect(fcItems.length).toBe(1);
    expect(fcItems[0].id).toBe("fc-fc1");

    // Verify it was inserted, not appended
    const fcIndex = queue.findIndex((item) => item.kind === "false-cognate");
    // queue without FC has 1 intro + 3 type + 3 mc = 7 items
    // insertPos = min(7, max(2, floor(7 / (1+1)))) = min(7, max(2, 3)) = min(7, 3) = 3
    expect(fcIndex).toBe(3);
  });

  it("empty rules produce empty queue", () => {
    const queue = buildExerciseQueue([], [], []);
    expect(queue).toEqual([]);
  });

  it("empty rules with false cognates still produce empty queue", () => {
    const fc = makeFalseCognate("fc1");
    const queue = buildExerciseQueue([], [fc], []);
    // insertPos = min(0, max(2, floor(0 / 2))) = min(0, 2) = 0
    // FC is inserted at position 0
    expect(queue.length).toBe(1);
    expect(queue[0].kind).toBe("false-cognate");
  });

  it("multiple rules produce items in sequence", () => {
    const rule1 = makeRule("r1", 4);
    const rule2 = makeRule("r2", 4);
    const allRules = [rule1, rule2];
    const queue = buildExerciseQueue(allRules, [], allRules);

    // rule1: intro, 2 type, 2 mc = 5 items
    // rule2: intro, 2 type, 2 mc = 5 items
    expect(queue.length).toBe(10);

    // First 5 items are from rule1
    // perType=2, typeExamples=[eng0,eng1], mcExamples=[eng2,eng3] (4 >= 2*2, so non-overlapping)
    expect(queue[0]).toMatchObject({ kind: "rule-intro", id: "intro-r1" });
    expect(queue[1]).toMatchObject({ kind: "type-answer", id: "type-r1-eng0" });
    expect(queue[2]).toMatchObject({ kind: "type-answer", id: "type-r1-eng1" });
    expect(queue[3]).toMatchObject({ kind: "multiple-choice", id: "mc-r1-eng2" });
    expect(queue[4]).toMatchObject({ kind: "multiple-choice", id: "mc-r1-eng3" });

    // Next 5 items are from rule2
    expect(queue[5]).toMatchObject({ kind: "rule-intro", id: "intro-r2" });
    expect(queue[6]).toMatchObject({ kind: "type-answer", id: "type-r2-eng0" });
    expect(queue[7]).toMatchObject({ kind: "type-answer", id: "type-r2-eng1" });
    expect(queue[8]).toMatchObject({ kind: "multiple-choice", id: "mc-r2-eng2" });
    expect(queue[9]).toMatchObject({ kind: "multiple-choice", id: "mc-r2-eng3" });
  });

  it("multiple-choice items have correct correctIndex from mock", () => {
    const rule = makeRule("r1", 4);
    const queue = buildExerciseQueue([rule], [], [rule]);

    const mcItems = queue.filter((item) => item.kind === "multiple-choice");
    for (const item of mcItems) {
      const mc = item as { options: string[]; correctIndex: number };
      // Mock returns ["wrong1", "wrong2", "wrong3", correct], so correctIndex = 3
      expect(mc.correctIndex).toBe(3);
      expect(mc.options.length).toBe(4);
    }
  });

  it("type-answer items contain correct english and spanish", () => {
    const rule = makeRule("r1", 4);
    const queue = buildExerciseQueue([rule], [], [rule]);

    const typeItems = queue.filter((item) => item.kind === "type-answer");
    expect(typeItems[0]).toMatchObject({
      kind: "type-answer",
      english: "eng0",
      correctSpanish: "spa0",
    });
    expect(typeItems[1]).toMatchObject({
      kind: "type-answer",
      english: "eng1",
      correctSpanish: "spa1",
    });
  });

  it("multiple false cognates are each inserted", () => {
    const rule = makeRule("r1", 6);
    const fc1 = makeFalseCognate("fc1");
    const fc2 = makeFalseCognate("fc2");
    const queue = buildExerciseQueue([rule], [fc1, fc2], [rule]);

    const fcItems = queue.filter((item) => item.kind === "false-cognate");
    expect(fcItems.length).toBe(2);
    expect(fcItems.map((item) => item.id)).toContain("fc-fc1");
    expect(fcItems.map((item) => item.id)).toContain("fc-fc2");
  });
});
