import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { useSrsStore } from "@/stores/srs";

const NOW = 1_000_000_000_000;

beforeEach(() => {
  vi.spyOn(Date, "now").mockReturnValue(NOW);
  useSrsStore.setState({ cards: {} });
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("addCard", () => {
  it("creates a card with correct fields", () => {
    useSrsStore.getState().addCard("c1", "vocab", "hola", "hello", "v1");
    const card = useSrsStore.getState().getCard("c1");
    expect(card).toBeDefined();
    expect(card!.id).toBe("c1");
    expect(card!.type).toBe("vocab");
    expect(card!.front).toBe("hola");
    expect(card!.back).toBe("hello");
    expect(card!.sourceId).toBe("v1");
    expect(card!.repetitions).toBe(0);
    expect(card!.dueAt).toBe(0);
  });
});

describe("addCardIfNotExists", () => {
  it("adds card when it does not exist", () => {
    useSrsStore.getState().addCardIfNotExists("c1", "vocab", "hola", "hello", "v1");
    expect(useSrsStore.getState().getCard("c1")).toBeDefined();
  });

  it("skips duplicate cards", () => {
    useSrsStore.getState().addCard("c1", "vocab", "hola", "hello", "v1");
    useSrsStore.getState().addCardIfNotExists("c1", "vocab", "adios", "goodbye", "v2");
    expect(useSrsStore.getState().getCard("c1")!.front).toBe("hola");
  });
});

describe("addCardsIfNotExist", () => {
  it("batch adds only new cards", () => {
    useSrsStore.getState().addCard("c1", "vocab", "hola", "hello", "v1");
    useSrsStore.getState().addCardsIfNotExist([
      { id: "c1", type: "vocab", front: "adios", back: "goodbye", sourceId: "v2" },
      { id: "c2", type: "cognate", front: "nación", back: "nation", sourceId: "r1" },
    ]);
    // c1 should remain unchanged
    expect(useSrsStore.getState().getCard("c1")!.front).toBe("hola");
    // c2 should be added
    expect(useSrsStore.getState().getCard("c2")).toBeDefined();
    expect(useSrsStore.getState().getCard("c2")!.type).toBe("cognate");
  });
});

describe("review", () => {
  it("delegates to reviewCard and updates state", () => {
    useSrsStore.getState().addCard("c1", "vocab", "hola", "hello", "v1");
    useSrsStore.getState().review("c1", 4);
    const card = useSrsStore.getState().getCard("c1")!;
    expect(card.repetitions).toBe(1);
    expect(card.lastReviewedAt).toBe(NOW);
    expect(card.dueAt).toBeGreaterThan(0);
  });

  it("handles non-existent card gracefully", () => {
    const before = useSrsStore.getState().cards;
    useSrsStore.getState().review("nonexistent", 4);
    expect(useSrsStore.getState().cards).toEqual(before);
  });
});

describe("getDueCards", () => {
  it("returns cards that are due", () => {
    useSrsStore.getState().addCard("c1", "vocab", "hola", "hello", "v1");
    // New cards have dueAt=0 which is < NOW, so they're due
    const due = useSrsStore.getState().getDueCards();
    expect(due.length).toBe(1);
    expect(due[0].id).toBe("c1");
  });

  it("excludes cards not yet due", () => {
    useSrsStore.getState().addCard("c1", "vocab", "hola", "hello", "v1");
    // Review to push dueAt into the future
    useSrsStore.getState().review("c1", 5);
    const due = useSrsStore.getState().getDueCards();
    expect(due.length).toBe(0);
  });
});

describe("getNewCards", () => {
  it("returns only new cards (repetitions=0, dueAt=0)", () => {
    useSrsStore.getState().addCard("c1", "vocab", "hola", "hello", "v1");
    useSrsStore.getState().addCard("c2", "vocab", "gato", "cat", "v2");
    useSrsStore.getState().review("c1", 4);

    const newCards = useSrsStore.getState().getNewCards();
    expect(newCards.length).toBe(1);
    expect(newCards[0].id).toBe("c2");
  });
});

describe("getDueCount", () => {
  it("returns count of due cards", () => {
    useSrsStore.getState().addCard("c1", "vocab", "hola", "hello", "v1");
    useSrsStore.getState().addCard("c2", "vocab", "gato", "cat", "v2");
    expect(useSrsStore.getState().getDueCount()).toBe(2);
  });
});

describe("getCardsByType", () => {
  it("filters cards by type", () => {
    useSrsStore.getState().addCard("c1", "vocab", "hola", "hello", "v1");
    useSrsStore.getState().addCard("c2", "cognate", "nación", "nation", "r1");
    useSrsStore.getState().addCard("c3", "vocab", "gato", "cat", "v2");

    const vocabCards = useSrsStore.getState().getCardsByType("vocab");
    expect(vocabCards.length).toBe(2);
    expect(vocabCards.every((c) => c.type === "vocab")).toBe(true);

    const cognateCards = useSrsStore.getState().getCardsByType("cognate");
    expect(cognateCards.length).toBe(1);
  });
});

describe("getTotalReviews", () => {
  it("sums repetitions across all cards", () => {
    useSrsStore.getState().addCard("c1", "vocab", "hola", "hello", "v1");
    useSrsStore.getState().addCard("c2", "vocab", "gato", "cat", "v2");
    useSrsStore.getState().review("c1", 4);
    useSrsStore.getState().review("c1", 4);
    useSrsStore.getState().review("c2", 4);

    expect(useSrsStore.getState().getTotalReviews()).toBe(3);
  });
});

describe("getTotalCards", () => {
  it("returns total number of cards", () => {
    useSrsStore.getState().addCard("c1", "vocab", "hola", "hello", "v1");
    useSrsStore.getState().addCard("c2", "cognate", "nación", "nation", "r1");
    expect(useSrsStore.getState().getTotalCards()).toBe(2);
  });
});

describe("getLearnedCount", () => {
  it("returns count of cards with repetitions >= 4", () => {
    useSrsStore.getState().addCard("c1", "vocab", "hola", "hello", "v1");
    useSrsStore.getState().addCard("c2", "vocab", "gato", "cat", "v2");

    // Review c1 four times
    for (let i = 0; i < 4; i++) {
      useSrsStore.getState().review("c1", 5);
    }
    // Review c2 only twice
    useSrsStore.getState().review("c2", 5);
    useSrsStore.getState().review("c2", 5);

    expect(useSrsStore.getState().getLearnedCount()).toBe(1);
  });
});

describe("resetSrs", () => {
  it("clears all cards", () => {
    useSrsStore.getState().addCard("c1", "vocab", "hola", "hello", "v1");
    useSrsStore.getState().addCard("c2", "cognate", "nación", "nation", "r1");
    useSrsStore.getState().resetSrs();
    expect(useSrsStore.getState().getTotalCards()).toBe(0);
    expect(useSrsStore.getState().cards).toEqual({});
  });
});
