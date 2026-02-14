import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { useSettingsStore } from "@/stores/settings";

beforeEach(() => {
  useSettingsStore.setState({ startDate: null, dayOverride: null });
});

afterEach(() => {
  vi.useRealTimers();
});

describe("getCurrentDay", () => {
  it("returns 0 when no startDate set", () => {
    expect(useSettingsStore.getState().getCurrentDay()).toBe(0);
  });

  it("returns 1 on same day as start", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2025-03-15T10:00:00"));
    useSettingsStore.getState().startJourney();
    expect(useSettingsStore.getState().getCurrentDay()).toBe(1);
  });

  it("returns correct day number based on elapsed days", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2025-03-15T12:00:00"));
    useSettingsStore.getState().startJourney();

    // Move 4 days ahead (15 -> 19 = 4 days elapsed, day = 5)
    vi.setSystemTime(new Date("2025-03-19T12:00:00"));
    expect(useSettingsStore.getState().getCurrentDay()).toBe(5);
  });

  it("clamps to max 10", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2025-03-01T00:00:00"));
    useSettingsStore.getState().startJourney();

    // Move 30 days ahead
    vi.setSystemTime(new Date("2025-03-31T00:00:00"));
    expect(useSettingsStore.getState().getCurrentDay()).toBe(10);
  });

  it("returns dayOverride when set, ignoring calculation", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2025-03-15T00:00:00"));
    useSettingsStore.getState().startJourney();
    useSettingsStore.getState().setDayOverride(7);
    expect(useSettingsStore.getState().getCurrentDay()).toBe(7);
  });
});

describe("startJourney", () => {
  it("sets startDate to today", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2025-06-01T14:30:00"));
    useSettingsStore.getState().startJourney();
    expect(useSettingsStore.getState().startDate).toBe("2025-06-01");
  });
});

describe("resetJourney", () => {
  it("clears startDate and dayOverride", () => {
    useSettingsStore.setState({ startDate: "2025-01-01", dayOverride: 5 });
    useSettingsStore.getState().resetJourney();
    expect(useSettingsStore.getState().startDate).toBeNull();
    expect(useSettingsStore.getState().dayOverride).toBeNull();
  });
});

describe("setDayOverride", () => {
  it("sets the dayOverride value", () => {
    useSettingsStore.getState().setDayOverride(3);
    expect(useSettingsStore.getState().dayOverride).toBe(3);
  });

  it("clears dayOverride when set to null", () => {
    useSettingsStore.getState().setDayOverride(5);
    useSettingsStore.getState().setDayOverride(null);
    expect(useSettingsStore.getState().dayOverride).toBeNull();
  });
});
