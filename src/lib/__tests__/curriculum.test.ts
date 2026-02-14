import { describe, it, expect } from "vitest";
import {
  getVocabForDay,
  getVocabUpToDay,
  getCognateRulesForDay,
  getCognateRulesUpToDay,
  getCompatibleWords,
} from "@/lib/curriculum";
import type { SentenceFrame } from "@/lib/types";

describe("getVocabForDay", () => {
  it("returns only words for the given day", () => {
    const day1Words = getVocabForDay(1);
    expect(day1Words.length).toBeGreaterThan(0);
    expect(day1Words.every((w) => w.day === 1)).toBe(true);
  });

  it("returns empty array for nonexistent day", () => {
    const words = getVocabForDay(999);
    expect(words).toEqual([]);
  });
});

describe("getCognateRulesForDay", () => {
  it("returns rules for day 1 with correct day", () => {
    const rules = getCognateRulesForDay(1);
    expect(rules.length).toBeGreaterThan(0);
    expect(rules.every((r) => r.day === 1)).toBe(true);
  });
});

describe("getCognateRulesUpToDay", () => {
  it("returns cumulative rules up to day 2", () => {
    const day1Rules = getCognateRulesForDay(1);
    const day2Rules = getCognateRulesForDay(2);
    const upToDay2 = getCognateRulesUpToDay(2);

    expect(upToDay2.length).toBe(day1Rules.length + day2Rules.length);
    expect(upToDay2.every((r) => r.day <= 2)).toBe(true);
  });
});

describe("getCompatibleWords", () => {
  it("filters by explicit compatibleVocabIds", () => {
    const frame: SentenceFrame = {
      id: "sf-quiero",
      template: "Quiero ___",
      english: "I want ___",
      tier: 1,
      day: 1,
      slotType: "any",
      compatibleVocabIds: ["v-algo", "v-eso", "v-esto", "v-mas", "v-todo"],
    };

    const words = getCompatibleWords(frame, 1);
    expect(words.length).toBe(5);
    expect(words.every((w) => frame.compatibleVocabIds.includes(w.id))).toBe(true);
  });

  it("falls back to slotType matching when compatibleVocabIds is empty", () => {
    const frame: SentenceFrame = {
      id: "test-noun-frame",
      template: "Test ___",
      english: "Test ___",
      tier: 1,
      day: 2,
      slotType: "noun",
      compatibleVocabIds: [],
    };

    const words = getCompatibleWords(frame, 2);
    expect(words.length).toBeGreaterThan(0);
    expect(words.every((w) => w.category === "noun")).toBe(true);
  });

  it("respects day boundary for vocab availability", () => {
    const frame: SentenceFrame = {
      id: "sf-quiero",
      template: "Quiero ___",
      english: "I want ___",
      tier: 1,
      day: 1,
      slotType: "any",
      // v-casa is a day 2 word, so it should not appear when day=1
      compatibleVocabIds: ["v-algo", "v-casa"],
    };

    const day1Words = getCompatibleWords(frame, 1);
    expect(day1Words.some((w) => w.id === "v-algo")).toBe(true);
    expect(day1Words.some((w) => w.id === "v-casa")).toBe(false);

    const day2Words = getCompatibleWords(frame, 2);
    expect(day2Words.some((w) => w.id === "v-algo")).toBe(true);
    expect(day2Words.some((w) => w.id === "v-casa")).toBe(true);
  });
});
