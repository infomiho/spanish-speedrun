import { describe, it, expect } from "vitest";
import {
  applyRule,
  matchesRule,
  generateDistractors,
  isFalseCognate,
} from "@/lib/cognates";
import type { CognateRule, FalseCognate } from "@/lib/types";

const tionRule: CognateRule = {
  id: "r1",
  englishSuffix: "-tion",
  spanishSuffix: "-ción",
  description: "-tion to -ción",
  examples: [{ english: "nation", spanish: "nación" }],
  day: 1,
};

const ousRule: CognateRule = {
  id: "r2",
  englishSuffix: "-ous",
  spanishSuffix: "-oso",
  description: "-ous to -oso",
  examples: [{ english: "famous", spanish: "famoso" }],
  day: 1,
};

const bleRule: CognateRule = {
  id: "r3",
  englishSuffix: "-ble",
  spanishSuffix: "-ble",
  description: "-ble stays -ble",
  examples: [{ english: "possible", spanish: "posible" }],
  day: 1,
};

const mentRule: CognateRule = {
  id: "r4",
  englishSuffix: "-ment",
  spanishSuffix: "-mento",
  description: "-ment to -mento",
  examples: [{ english: "moment", spanish: "momento" }],
  day: 2,
};

describe("applyRule", () => {
  it('transforms "nation" with -tion to -cion rule', () => {
    expect(applyRule("nation", tionRule)).toBe("nación");
  });

  it("is case-insensitive", () => {
    expect(applyRule("Nation", tionRule)).toBe("nación");
    expect(applyRule("NATION", tionRule)).toBe("nación");
  });

  it("returns word unchanged if suffix does not match", () => {
    expect(applyRule("hello", tionRule)).toBe("hello");
  });

  it("handles hyphenated suffixes correctly", () => {
    // Both "-tion" and "-ción" have leading hyphens in the rule definition
    const result = applyRule("education", tionRule);
    expect(result).toBe("educación");
  });
});

describe("matchesRule", () => {
  it("returns true for matching suffixes", () => {
    expect(matchesRule("nation", tionRule)).toBe(true);
    expect(matchesRule("Nation", tionRule)).toBe(true);
    expect(matchesRule("famous", ousRule)).toBe(true);
  });

  it("returns false for non-matching suffixes", () => {
    expect(matchesRule("hello", tionRule)).toBe(false);
    expect(matchesRule("famous", tionRule)).toBe(false);
  });
});

describe("generateDistractors", () => {
  it("returns array of length 4", () => {
    const result = generateDistractors("nación", [tionRule, ousRule, bleRule, mentRule], "nation");
    expect(result).toHaveLength(4);
  });

  it("includes the correct answer", () => {
    const result = generateDistractors("nación", [tionRule, ousRule, bleRule, mentRule], "nation");
    expect(result).toContain("nación");
  });

  it("has no duplicate options", () => {
    const result = generateDistractors("nación", [tionRule, ousRule, bleRule, mentRule], "nation");
    const unique = new Set(result);
    expect(unique.size).toBe(result.length);
  });
});

describe("isFalseCognate", () => {
  const falseCognates: FalseCognate[] = [
    {
      id: "fc1",
      spanish: "embarazada",
      looksLike: "embarrassed",
      actualMeaning: "pregnant",
      day: 1,
    },
    {
      id: "fc2",
      spanish: "éxito",
      looksLike: "exit",
      actualMeaning: "success",
      day: 1,
    },
  ];

  it("finds matching false cognate (case-insensitive)", () => {
    const result = isFalseCognate("Embarazada", falseCognates);
    expect(result).toBeDefined();
    expect(result!.id).toBe("fc1");
    expect(result!.actualMeaning).toBe("pregnant");
  });

  it("returns undefined for non-false-cognate", () => {
    expect(isFalseCognate("nación", falseCognates)).toBeUndefined();
  });
});
