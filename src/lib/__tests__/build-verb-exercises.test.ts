import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type { VerbEntry } from "@/lib/types";

vi.mock("@/lib/shuffle", () => ({
  shuffle: <T>(arr: T[]): T[] => [...arr],
}));

const mockGetVerbsForDay = vi.fn<(day: number) => VerbEntry[]>();
const mockGetVerbsUpToDay = vi.fn<(day: number) => VerbEntry[]>();

vi.mock("@/lib/curriculum", () => ({
  getVerbsForDay: (...args: Parameters<typeof mockGetVerbsForDay>) => mockGetVerbsForDay(...args),
  getVerbsUpToDay: (...args: Parameters<typeof mockGetVerbsUpToDay>) => mockGetVerbsUpToDay(...args),
}));

import { buildVerbExercises, TARGET_EXERCISES } from "@/lib/build-verb-exercises";

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

beforeEach(() => {
  vi.spyOn(Math, "random").mockReturnValue(0);
});

afterEach(() => {
  vi.restoreAllMocks();
  mockGetVerbsForDay.mockReset();
  mockGetVerbsUpToDay.mockReset();
});

describe("buildVerbExercises", () => {
  it("returns empty array for day < 2", () => {
    expect(buildVerbExercises(1)).toEqual([]);
    expect(buildVerbExercises(0)).toEqual([]);
  });

  it("starts with display exercises for day verbs, followed by quiz exercises", () => {
    const v1 = makeVerb("v1", 2);
    const v2 = makeVerb("v2", 2);
    mockGetVerbsForDay.mockReturnValue([v1, v2]);
    mockGetVerbsUpToDay.mockReturnValue([]);

    const exercises = buildVerbExercises(2);

    // First items should be display mode
    expect(exercises[0].mode).toBe("display");
    expect(exercises[0].verb.id).toBe("v1");
    expect(exercises[1].mode).toBe("display");
    expect(exercises[1].verb.id).toBe("v2");

    // Then quiz mode
    expect(exercises[2].mode).toBe("quiz");
    expect(exercises[3].mode).toBe("quiz");
  });

  it("includes review verbs from previous days", () => {
    const dayVerb = makeVerb("v1", 3);
    const reviewVerb = makeVerb("rv1", 2);
    mockGetVerbsForDay.mockReturnValue([dayVerb]);
    mockGetVerbsUpToDay.mockReturnValue([reviewVerb]);

    const exercises = buildVerbExercises(3);

    const reviewExercises = exercises.filter((e) => e.id.startsWith("quiz-review-"));
    expect(reviewExercises.length).toBeGreaterThan(0);
    expect(reviewExercises[0].verb.id).toBe("rv1");
  });

  it("caps at TARGET_EXERCISES (14)", () => {
    const verbs = Array.from({ length: 8 }, (_, i) => makeVerb(`v${i}`, 2));
    mockGetVerbsForDay.mockReturnValue(verbs);
    mockGetVerbsUpToDay.mockReturnValue([]);

    const exercises = buildVerbExercises(2);
    expect(exercises.length).toBe(TARGET_EXERCISES);
  });

  it("fills with extras when not enough verbs", () => {
    const v1 = makeVerb("v1", 2);
    mockGetVerbsForDay.mockReturnValue([v1]);
    mockGetVerbsUpToDay.mockReturnValue([]);

    const exercises = buildVerbExercises(2);
    // 1 display + 1 quiz-new + extras to fill up to 14
    expect(exercises.length).toBe(TARGET_EXERCISES);
    const extras = exercises.filter((e) => e.id.startsWith("quiz-extra-"));
    expect(extras.length).toBeGreaterThan(0);
  });

  it("quiz exercises have valid pronouns", () => {
    const verbs = Array.from({ length: 3 }, (_, i) => makeVerb(`v${i}`, 2));
    mockGetVerbsForDay.mockReturnValue(verbs);
    mockGetVerbsUpToDay.mockReturnValue([]);

    const exercises = buildVerbExercises(2);
    const validPronouns = ["yo", "tú", "él"];
    const quizExercises = exercises.filter((e) => e.mode === "quiz");

    for (const ex of quizExercises) {
      expect(ex.targetPronoun).toBeDefined();
      expect(validPronouns).toContain(ex.targetPronoun);
    }
  });

  it("display exercises have no targetPronoun", () => {
    const v1 = makeVerb("v1", 2);
    mockGetVerbsForDay.mockReturnValue([v1]);
    mockGetVerbsUpToDay.mockReturnValue([]);

    const exercises = buildVerbExercises(2);
    const displayExercises = exercises.filter((e) => e.mode === "display");

    for (const ex of displayExercises) {
      expect(ex.targetPronoun).toBeUndefined();
    }
  });
});
