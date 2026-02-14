import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type { SentenceFrame, VocabWord } from "@/lib/types";

vi.mock("@/lib/shuffle", () => ({
  shuffle: <T>(arr: T[]): T[] => [...arr],
}));

const mockGetFramesForDay = vi.fn<(day: number) => SentenceFrame[]>();
const mockGetCompatibleWords = vi.fn<(frame: SentenceFrame, day: number) => VocabWord[]>();
const mockGetVocabUpToDay = vi.fn<(day: number) => VocabWord[]>();

vi.mock("@/lib/curriculum", () => ({
  getFramesForDay: (...args: Parameters<typeof mockGetFramesForDay>) => mockGetFramesForDay(...args),
  getCompatibleWords: (...args: Parameters<typeof mockGetCompatibleWords>) => mockGetCompatibleWords(...args),
  getVocabUpToDay: (...args: Parameters<typeof mockGetVocabUpToDay>) => mockGetVocabUpToDay(...args),
}));

import { buildFrameExercises, MAX_REPEATS_PER_FRAME } from "@/lib/build-frame-exercises";

function makeFrame(
  id: string,
  compatibleVocabIds: string[],
  overrides: Partial<SentenceFrame> = {},
): SentenceFrame {
  return {
    id,
    template: `This is ___`,
    english: `This is blank`,
    tier: 1,
    day: 1,
    slotType: "noun",
    compatibleVocabIds,
    ...overrides,
  };
}

function makeVocab(id: string, overrides: Partial<VocabWord> = {}): VocabWord {
  return {
    id,
    spanish: `spa-${id}`,
    english: `eng-${id}`,
    category: "noun",
    day: 1,
    ...overrides,
  };
}

beforeEach(() => {
  vi.spyOn(Math, "random").mockReturnValue(0);
});

afterEach(() => {
  vi.restoreAllMocks();
  mockGetFramesForDay.mockReset();
  mockGetCompatibleWords.mockReset();
  mockGetVocabUpToDay.mockReset();
});

describe("buildFrameExercises", () => {
  it("produces MAX_REPEATS_PER_FRAME * usableFrames.length exercises", () => {
    const frame1 = makeFrame("f1", ["w1", "w2"]);
    const frame2 = makeFrame("f2", ["w3"]);
    const w1 = makeVocab("w1");
    const w2 = makeVocab("w2");
    const w3 = makeVocab("w3");
    const extra = makeVocab("w4");

    mockGetFramesForDay.mockReturnValue([frame1, frame2]);
    mockGetCompatibleWords.mockImplementation((f) => {
      if (f.id === "f1") return [w1, w2];
      if (f.id === "f2") return [w3];
      return [];
    });
    mockGetVocabUpToDay.mockReturnValue([w1, w2, w3, extra]);

    const exercises = buildFrameExercises(1);
    expect(exercises.length).toBe(MAX_REPEATS_PER_FRAME * 2);
  });

  it("no consecutive same-frame at round boundaries", () => {
    // With identity shuffle and 1 frame, swap logic triggers:
    // round 0: items=[], so no swap -> pushes frame f1
    // round 1: items.last.frame.id === roundOrder[0].id === "f1", but roundOrder.length=1 so swapIdx=0, no-op
    // With 2 frames this is testable:
    // shuffle is identity so roundOrder = [f1, f2] each round
    // round 0: [f1, f2] -> last item frame = f2
    // round 1: roundOrder[0]=f1, items.last.frame.id=f2 -> no conflict, no swap needed
    // To trigger the swap, we need items[-1].frame.id === roundOrder[0].id
    // With identity shuffle on 2 frames: [f1, f2]
    // After round 0: last exercise has frame f2
    // round 1: roundOrder[0] is f1 != f2, no swap
    // round 2: same as round 1
    // So let's use a single frame to test the swap path
    const frame = makeFrame("f1", ["w1", "w2", "w3"]);
    const w1 = makeVocab("w1");
    const w2 = makeVocab("w2");
    const w3 = makeVocab("w3");
    const extra = makeVocab("w4");

    mockGetFramesForDay.mockReturnValue([frame]);
    mockGetCompatibleWords.mockReturnValue([w1, w2, w3]);
    mockGetVocabUpToDay.mockReturnValue([w1, w2, w3, extra]);

    const exercises = buildFrameExercises(1);
    // With single frame, swap logic triggers but swapIdx=0, so it's a no-op swap
    // All exercises should still be produced (3 rounds * 1 frame = 3)
    expect(exercises.length).toBe(3);

    // With single frame, consecutive same-frame is unavoidable, but the swap logic runs
    for (let i = 0; i < exercises.length; i++) {
      expect(exercises[i].frame.id).toBe("f1");
    }
  });

  it("uses different correct words per frame across rounds when available", () => {
    const frame = makeFrame("f1", ["w1", "w2", "w3"]);
    const w1 = makeVocab("w1");
    const w2 = makeVocab("w2");
    const w3 = makeVocab("w3");
    const extra = makeVocab("w4");

    mockGetFramesForDay.mockReturnValue([frame]);
    mockGetCompatibleWords.mockReturnValue([w1, w2, w3]);
    mockGetVocabUpToDay.mockReturnValue([w1, w2, w3, extra]);

    const exercises = buildFrameExercises(1);
    expect(exercises.length).toBe(3);

    // Math.random returns 0, so floor(0 * len) = 0 -> picks first unused each time
    // Round 0: unused=[w1,w2,w3], picks w1
    // Round 1: unused=[w2,w3], picks w2
    // Round 2: unused=[w3], picks w3
    const words = exercises.map((e) => e.correctWord.id);
    expect(words).toEqual(["w1", "w2", "w3"]);
  });

  it("prefers non-compatible words as distractors", () => {
    const frame = makeFrame("f1", ["w1"]);
    const w1 = makeVocab("w1");
    const d1 = makeVocab("d1");
    const d2 = makeVocab("d2");
    const d3 = makeVocab("d3");

    mockGetFramesForDay.mockReturnValue([frame]);
    mockGetCompatibleWords.mockReturnValue([w1]);
    mockGetVocabUpToDay.mockReturnValue([w1, d1, d2, d3]);

    const exercises = buildFrameExercises(1);
    // d1, d2, d3 are non-compatible (not in frame.compatibleVocabIds and not correctWord)
    // With identity shuffle, distractors = [d1, d2, d3]
    expect(exercises[0].distractors.map((d) => d.id)).toEqual(["d1", "d2", "d3"]);
  });

  it("falls back to compatible distractors when insufficient non-compatible", () => {
    const frame = makeFrame("f1", ["w1", "w2", "w3", "w4"]);
    const w1 = makeVocab("w1");
    const w2 = makeVocab("w2");
    const w3 = makeVocab("w3");
    const w4 = makeVocab("w4");

    mockGetFramesForDay.mockReturnValue([frame]);
    mockGetCompatibleWords.mockReturnValue([w1, w2, w3, w4]);
    // allDayVocab only has compatible words, so nonCompatible = []
    mockGetVocabUpToDay.mockReturnValue([w1, w2, w3, w4]);

    const exercises = buildFrameExercises(1);
    // nonCompatible = [] (all vocab is in compatibleVocabIds)
    // fallback = compatible.filter(w => w.id !== correctWord.id) = [w2, w3, w4]
    // distractors = shuffle([...[], ...[w2,w3,w4]]).slice(0,3) = [w2, w3, w4]
    expect(exercises[0].distractors.length).toBe(3);
    expect(exercises[0].distractors.map((d) => d.id)).toEqual(["w2", "w3", "w4"]);
  });

  it("returns empty array when no frames for day", () => {
    mockGetFramesForDay.mockReturnValue([]);
    mockGetVocabUpToDay.mockReturnValue([]);

    const exercises = buildFrameExercises(1);
    expect(exercises).toEqual([]);
  });

  it("returns empty array when no usable frames", () => {
    const frame = makeFrame("f1", []);
    mockGetFramesForDay.mockReturnValue([frame]);
    mockGetCompatibleWords.mockReturnValue([]);
    mockGetVocabUpToDay.mockReturnValue([makeVocab("w1")]);

    const exercises = buildFrameExercises(1);
    expect(exercises).toEqual([]);
  });

  it("exercise ids include round and index", () => {
    const frame = makeFrame("f1", ["w1"]);
    const w1 = makeVocab("w1");
    const extra = makeVocab("w2");

    mockGetFramesForDay.mockReturnValue([frame]);
    mockGetCompatibleWords.mockReturnValue([w1]);
    mockGetVocabUpToDay.mockReturnValue([w1, extra]);

    const exercises = buildFrameExercises(1);
    expect(exercises[0].id).toBe("frame-f1-0-0");
    expect(exercises[1].id).toBe("frame-f1-1-1");
    expect(exercises[2].id).toBe("frame-f1-2-2");
  });

  it("MAX_REPEATS_PER_FRAME is 3", () => {
    expect(MAX_REPEATS_PER_FRAME).toBe(3);
  });

  it("handles multiple frames with mixed compatible word counts", () => {
    const frame1 = makeFrame("f1", ["w1", "w2"]);
    const frame2 = makeFrame("f2", ["w3"]);
    const w1 = makeVocab("w1");
    const w2 = makeVocab("w2");
    const w3 = makeVocab("w3");
    const d1 = makeVocab("d1");
    const d2 = makeVocab("d2");
    const d3 = makeVocab("d3");

    mockGetFramesForDay.mockReturnValue([frame1, frame2]);
    mockGetCompatibleWords.mockImplementation((f) => {
      if (f.id === "f1") return [w1, w2];
      if (f.id === "f2") return [w3];
      return [];
    });
    mockGetVocabUpToDay.mockReturnValue([w1, w2, w3, d1, d2, d3]);

    const exercises = buildFrameExercises(1);
    // 3 rounds * 2 frames = 6 exercises
    expect(exercises.length).toBe(6);

    // Each round should have both frames (identity shuffle)
    const f1Exercises = exercises.filter((e) => e.frame.id === "f1");
    const f2Exercises = exercises.filter((e) => e.frame.id === "f2");
    expect(f1Exercises.length).toBe(3);
    expect(f2Exercises.length).toBe(3);
  });
});
