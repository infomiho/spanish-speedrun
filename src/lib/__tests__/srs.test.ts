import { describe, it, expect, vi, afterEach } from "vitest";
import {
  createNewCard,
  reviewCard,
  isDue,
  getDueCards,
  getNewCards,
  buildReviewSession,
  MAX_REVIEW_PER_SESSION,
} from "@/lib/srs";
import type { SrsCard, SrsQuality } from "@/lib/types";

const NOW = 1_000_000_000_000; // fixed timestamp for tests

function makeCard(overrides: Partial<SrsCard> = {}): SrsCard {
  return {
    id: "c1",
    type: "vocab",
    front: "hello",
    back: "hola",
    sourceId: "v1",
    interval: 60,
    easeFactor: 2.5,
    repetitions: 0,
    dueAt: 0,
    ...overrides,
  };
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("createNewCard", () => {
  it("returns correct defaults", () => {
    const card = createNewCard("id1", "vocab", "hello", "hola", "src1");
    expect(card).toEqual({
      id: "id1",
      type: "vocab",
      front: "hello",
      back: "hola",
      sourceId: "src1",
      interval: 60,
      easeFactor: 2.5,
      repetitions: 0,
      dueAt: 0,
    });
  });
});

describe("reviewCard", () => {
  it("resets to first interval when quality < 3", () => {
    vi.spyOn(Date, "now").mockReturnValue(NOW);

    for (const q of [0, 1, 2] as SrsQuality[]) {
      const card = makeCard({ repetitions: 3, interval: 3600 });
      const result = reviewCard(card, q);
      expect(result.interval).toBe(60);
      expect(result.repetitions).toBe(0);
      expect(result.dueAt).toBe(NOW + 60 * 1000);
      expect(result.lastReviewedAt).toBe(NOW);
    }
  });

  it("advances through INITIAL_INTERVALS on quality >= 3", () => {
    vi.spyOn(Date, "now").mockReturnValue(NOW);
    const expectedIntervals = [60, 600, 3600, 14400];

    let card = makeCard({ repetitions: 0, interval: 60 });
    for (let i = 0; i < expectedIntervals.length; i++) {
      card = reviewCard(card, 4);
      expect(card.interval).toBe(expectedIntervals[i]);
      expect(card.repetitions).toBe(i + 1);
    }
  });

  it("uses SM-2 ease factor after graduating (repetitions > 4)", () => {
    vi.spyOn(Date, "now").mockReturnValue(NOW);

    // Start with a card that has already completed 4 initial intervals
    const card = makeCard({
      repetitions: 4,
      interval: 14400,
      easeFactor: 2.5,
    });
    const result = reviewCard(card, 4);
    // repetitions becomes 5, which is > INITIAL_INTERVALS.length (4)
    // so interval = Math.round(14400 * 2.5) = 36000
    expect(result.interval).toBe(Math.round(14400 * 2.5));
    expect(result.repetitions).toBe(5);
  });

  it("caps interval at MAX_INTERVAL (259200 seconds)", () => {
    vi.spyOn(Date, "now").mockReturnValue(NOW);

    const card = makeCard({
      repetitions: 4,
      interval: 200000,
      easeFactor: 2.5,
    });
    const result = reviewCard(card, 5);
    // 200000 * 2.5 = 500000, capped at 259200
    expect(result.interval).toBe(259200);
  });

  it("clamps easeFactor at MIN_EASE_FACTOR (1.3)", () => {
    vi.spyOn(Date, "now").mockReturnValue(NOW);

    // quality=3 decreases ease factor the most among passing grades
    // SM-2 delta for q=3: 0.1 - (5-3)*(0.08 + (5-3)*0.02) = 0.1 - 2*(0.08+0.04) = 0.1 - 0.24 = -0.14
    // With easeFactor=1.3, new = 1.3 + (-0.14) = 1.16, clamped to 1.3
    const card = makeCard({ easeFactor: 1.3 });
    const result = reviewCard(card, 3);
    expect(result.easeFactor).toBe(1.3);
  });

  it("increases easeFactor with quality=5", () => {
    vi.spyOn(Date, "now").mockReturnValue(NOW);

    const card = makeCard({ easeFactor: 2.5 });
    const result = reviewCard(card, 5);
    // delta for q=5: 0.1 - 0*(0.08+0*0.02) = 0.1
    expect(result.easeFactor).toBe(2.6);
  });

  it("decreases easeFactor with quality=3", () => {
    vi.spyOn(Date, "now").mockReturnValue(NOW);

    const card = makeCard({ easeFactor: 2.5 });
    const result = reviewCard(card, 3);
    // delta for q=3: 0.1 - 2*(0.08+2*0.02) = 0.1 - 0.24 = -0.14
    expect(result.easeFactor).toBeCloseTo(2.36);
  });
});

describe("isDue", () => {
  it("returns true when Date.now() >= card.dueAt", () => {
    vi.spyOn(Date, "now").mockReturnValue(NOW);

    expect(isDue(makeCard({ dueAt: NOW }))).toBe(true);
    expect(isDue(makeCard({ dueAt: NOW - 1000 }))).toBe(true);
    expect(isDue(makeCard({ dueAt: 0 }))).toBe(true);
  });

  it("returns false for future cards", () => {
    vi.spyOn(Date, "now").mockReturnValue(NOW);

    expect(isDue(makeCard({ dueAt: NOW + 1000 }))).toBe(false);
  });
});

describe("getDueCards", () => {
  it("filters and sorts by dueAt", () => {
    vi.spyOn(Date, "now").mockReturnValue(NOW);

    const cards = [
      makeCard({ id: "a", dueAt: NOW - 100 }),
      makeCard({ id: "b", dueAt: NOW + 9999 }), // not due
      makeCard({ id: "c", dueAt: NOW - 500 }),
      makeCard({ id: "d", dueAt: NOW }),
    ];

    const due = getDueCards(cards);
    expect(due.map((c) => c.id)).toEqual(["c", "a", "d"]);
  });
});

describe("getNewCards", () => {
  it("returns only cards with repetitions=0 and dueAt=0", () => {
    const cards = [
      makeCard({ id: "new1", repetitions: 0, dueAt: 0 }),
      makeCard({ id: "reviewed", repetitions: 1, dueAt: 0 }),
      makeCard({ id: "scheduled", repetitions: 0, dueAt: 1000 }),
      makeCard({ id: "new2", repetitions: 0, dueAt: 0 }),
    ];

    const newCards = getNewCards(cards);
    expect(newCards.map((c) => c.id)).toEqual(["new1", "new2"]);
  });
});

describe("buildReviewSession", () => {
  it("caps session at MAX_REVIEW_PER_SESSION", () => {
    vi.spyOn(Date, "now").mockReturnValue(NOW);

    const cards = Array.from({ length: 50 }, (_, i) =>
      makeCard({ id: `c${i}`, dueAt: NOW - (50 - i) }),
    );

    const session = buildReviewSession(cards);
    expect(session.sessionCards).toHaveLength(MAX_REVIEW_PER_SESSION);
    expect(session.totalDue).toBe(50);
  });

  it("returns all cards when fewer than limit", () => {
    vi.spyOn(Date, "now").mockReturnValue(NOW);

    const cards = [
      makeCard({ id: "a", dueAt: NOW - 100 }),
      makeCard({ id: "b", dueAt: NOW - 50 }),
    ];

    const session = buildReviewSession(cards);
    expect(session.sessionCards).toHaveLength(2);
    expect(session.totalDue).toBe(2);
  });

  it("excludes cards that are not yet due", () => {
    vi.spyOn(Date, "now").mockReturnValue(NOW);

    const cards = [
      makeCard({ id: "due", dueAt: NOW - 100 }),
      makeCard({ id: "not-due", dueAt: NOW + 9999 }),
    ];

    const session = buildReviewSession(cards);
    expect(session.sessionCards).toHaveLength(1);
    expect(session.sessionCards[0].id).toBe("due");
    expect(session.totalDue).toBe(1);
  });

  it("returns empty session when no cards are due", () => {
    vi.spyOn(Date, "now").mockReturnValue(NOW);

    const cards = [
      makeCard({ id: "a", dueAt: NOW + 1000 }),
      makeCard({ id: "b", dueAt: NOW + 2000 }),
    ];

    const session = buildReviewSession(cards);
    expect(session.sessionCards).toHaveLength(0);
    expect(session.totalDue).toBe(0);
  });

  it("accepts a custom limit", () => {
    vi.spyOn(Date, "now").mockReturnValue(NOW);

    const cards = Array.from({ length: 20 }, (_, i) =>
      makeCard({ id: `c${i}`, dueAt: NOW - i }),
    );

    const session = buildReviewSession(cards, 5);
    expect(session.sessionCards).toHaveLength(5);
    expect(session.totalDue).toBe(20);
  });

  it("preserves due-date ordering (most overdue first)", () => {
    vi.spyOn(Date, "now").mockReturnValue(NOW);

    const cards = [
      makeCard({ id: "recent", dueAt: NOW - 10 }),
      makeCard({ id: "oldest", dueAt: NOW - 1000 }),
      makeCard({ id: "middle", dueAt: NOW - 500 }),
    ];

    const session = buildReviewSession(cards);
    expect(session.sessionCards.map((c) => c.id)).toEqual([
      "oldest",
      "middle",
      "recent",
    ]);
  });
});
