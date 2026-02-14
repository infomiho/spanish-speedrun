import { describe, it, expect, beforeEach } from "vitest";
import { useProgressStore } from "@/stores/progress";

beforeEach(() => {
  useProgressStore.getState().resetProgress();
});

describe("recordAttempt", () => {
  it("creates a new completion entry with correct fields", () => {
    useProgressStore.getState().recordAttempt(1, "vocab", 70);

    const completion = useProgressStore.getState().getCompletion(1, "vocab");
    expect(completion).toBeDefined();
    expect(completion!.type).toBe("vocab");
    expect(completion!.bestScore).toBe(70);
    expect(completion!.attempts).toBe(1);
    expect(completion!.completed).toBe(true);
    expect(completion!.lastAttemptAt).toBeDefined();
  });

  it("increments attempts and keeps best score", () => {
    const { recordAttempt } = useProgressStore.getState();
    recordAttempt(1, "vocab", 80);
    recordAttempt(1, "vocab", 50);

    const completion = useProgressStore.getState().getCompletion(1, "vocab");
    expect(completion!.bestScore).toBe(80);
    expect(completion!.attempts).toBe(2);
  });

  it("marks completed when score >= 60", () => {
    useProgressStore.getState().recordAttempt(1, "vocab", 60);
    const completion = useProgressStore.getState().getCompletion(1, "vocab");
    expect(completion!.completed).toBe(true);
  });

  it("keeps completed=true even if later score < 60", () => {
    const { recordAttempt } = useProgressStore.getState();
    recordAttempt(1, "vocab", 80);
    recordAttempt(1, "vocab", 30);

    const completion = useProgressStore.getState().getCompletion(1, "vocab");
    expect(completion!.completed).toBe(true);
  });
});

describe("getDayCompletionPercent", () => {
  it("calculates correctly for day 1 (4 exercise types, no verbs)", () => {
    const { recordAttempt } = useProgressStore.getState();
    // Complete 2 of 4 exercises for day 1
    recordAttempt(1, "vocab", 80);
    recordAttempt(1, "cognates", 70);

    const percent = useProgressStore.getState().getDayCompletionPercent(1);
    expect(percent).toBe(50); // 2/4 = 50%
  });

  it("calculates correctly for day 2 (5 exercise types, includes verbs)", () => {
    const { recordAttempt } = useProgressStore.getState();
    // Complete 1 of 5 exercises for day 2
    recordAttempt(2, "vocab", 80);

    const percent = useProgressStore.getState().getDayCompletionPercent(2);
    expect(percent).toBe(20); // 1/5 = 20%
  });
});

describe("canTakeQuiz", () => {
  it("requires vocab + cognates + frames score >= 60 for day 1", () => {
    const { recordAttempt } = useProgressStore.getState();
    expect(useProgressStore.getState().canTakeQuiz(1)).toBe(false);

    recordAttempt(1, "vocab", 60);
    recordAttempt(1, "cognates", 60);
    expect(useProgressStore.getState().canTakeQuiz(1)).toBe(false);

    recordAttempt(1, "frames", 60);
    expect(useProgressStore.getState().canTakeQuiz(1)).toBe(true);
  });

  it("also requires verbs score >= 60 for day >= 2", () => {
    const { recordAttempt } = useProgressStore.getState();
    recordAttempt(2, "vocab", 60);
    recordAttempt(2, "cognates", 60);
    recordAttempt(2, "frames", 60);
    expect(useProgressStore.getState().canTakeQuiz(2)).toBe(false);

    recordAttempt(2, "verbs", 60);
    expect(useProgressStore.getState().canTakeQuiz(2)).toBe(true);
  });
});

describe("isDayComplete", () => {
  it("returns true when all exercises are completed", () => {
    const { recordAttempt } = useProgressStore.getState();
    recordAttempt(1, "vocab", 80);
    recordAttempt(1, "cognates", 80);
    recordAttempt(1, "frames", 80);
    recordAttempt(1, "quiz", 80);

    expect(useProgressStore.getState().isDayComplete(1)).toBe(true);
  });

  it("returns false when not all exercises are completed", () => {
    const { recordAttempt } = useProgressStore.getState();
    recordAttempt(1, "vocab", 80);
    recordAttempt(1, "cognates", 80);

    expect(useProgressStore.getState().isDayComplete(1)).toBe(false);
  });
});

describe("resetProgress", () => {
  it("clears all data", () => {
    const { recordAttempt } = useProgressStore.getState();
    recordAttempt(1, "vocab", 90);
    recordAttempt(2, "cognates", 80);

    useProgressStore.getState().resetProgress();

    expect(useProgressStore.getState().days).toEqual({});
    expect(useProgressStore.getState().getCompletion(1, "vocab")).toBeUndefined();
    expect(useProgressStore.getState().getDayCompletionPercent(1)).toBe(0);
  });
});
