import { describe, it, expect, vi } from "vitest";
import type { SentenceFrame, VocabWord } from "@/lib/types";

vi.mock("@/lib/shuffle", () => ({
  shuffle: <T>(arr: T[]): T[] => [...arr],
}));

import { generateFrameDistractors } from "@/lib/distractors";

function makeFrame(id: string, compatibleVocabIds: string[]): SentenceFrame {
  return {
    id,
    template: "This is ___",
    english: "This is blank",
    tier: 1,
    day: 1,
    slotType: "noun",
    compatibleVocabIds,
  };
}

function makeVocab(id: string): VocabWord {
  return {
    id,
    spanish: `spa-${id}`,
    english: `eng-${id}`,
    category: "noun",
    day: 1,
  };
}

describe("generateFrameDistractors", () => {
  it("returns 3 non-compatible words when enough exist", () => {
    const frame = makeFrame("f1", ["w1"]);
    const correct = makeVocab("w1");
    const compatible = [correct];
    const allVocab = [correct, makeVocab("d1"), makeVocab("d2"), makeVocab("d3")];

    const distractors = generateFrameDistractors(frame, correct, compatible, allVocab);
    expect(distractors.length).toBe(3);
    expect(distractors.map((d) => d.id)).toEqual(["d1", "d2", "d3"]);
  });

  it("falls back to compatible words when < 3 non-compatible", () => {
    const frame = makeFrame("f1", ["w1", "w2", "w3", "w4"]);
    const correct = makeVocab("w1");
    const w2 = makeVocab("w2");
    const w3 = makeVocab("w3");
    const w4 = makeVocab("w4");
    const compatible = [correct, w2, w3, w4];
    const allVocab = [correct, w2, w3, w4];

    const distractors = generateFrameDistractors(frame, correct, compatible, allVocab);
    expect(distractors.length).toBe(3);
    // All are compatible fallbacks (no non-compatible exist)
    expect(distractors.map((d) => d.id)).toEqual(["w2", "w3", "w4"]);
  });

  it("mixes non-compatible + fallback when 1-2 non-compatible", () => {
    const frame = makeFrame("f1", ["w1", "w2", "w3"]);
    const correct = makeVocab("w1");
    const w2 = makeVocab("w2");
    const w3 = makeVocab("w3");
    const d1 = makeVocab("d1");
    const compatible = [correct, w2, w3];
    const allVocab = [correct, w2, w3, d1];

    const distractors = generateFrameDistractors(frame, correct, compatible, allVocab);
    expect(distractors.length).toBe(3);
    // nonCompatible = [d1], fallback = [w2, w3] -> [...[d1], ...[w2, w3]].slice(0, 3)
    expect(distractors.map((d) => d.id)).toEqual(["d1", "w2", "w3"]);
  });

  it("excludes correct word from all pools", () => {
    const frame = makeFrame("f1", ["w1"]);
    const correct = makeVocab("w1");
    const d1 = makeVocab("d1");
    const d2 = makeVocab("d2");
    const d3 = makeVocab("d3");
    const compatible = [correct];
    const allVocab = [correct, d1, d2, d3];

    const distractors = generateFrameDistractors(frame, correct, compatible, allVocab);
    expect(distractors.every((d) => d.id !== correct.id)).toBe(true);
  });

  it("returns empty when no distractors available", () => {
    const frame = makeFrame("f1", ["w1"]);
    const correct = makeVocab("w1");
    const compatible = [correct];
    const allVocab = [correct];

    const distractors = generateFrameDistractors(frame, correct, compatible, allVocab);
    expect(distractors).toEqual([]);
  });
});
