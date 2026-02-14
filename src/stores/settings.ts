import { create } from "zustand";
import { persist } from "zustand/middleware";

interface SettingsState {
  startDate: string | null;
  dayOverride: number | null;

  startJourney: () => void;
  resetJourney: () => void;
  getCurrentDay: () => number;
  setDayOverride: (day: number | null) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      startDate: null,
      dayOverride: null,

      startJourney: () => {
        set({ startDate: new Date().toISOString().split("T")[0] });
      },

      resetJourney: () => {
        set({ startDate: null, dayOverride: null });
      },

      getCurrentDay: () => {
        const { dayOverride, startDate } = get();
        if (dayOverride !== null) return dayOverride;
        if (!startDate) return 0;

        const start = new Date(startDate);
        const now = new Date();
        // Reset times to midnight for accurate day calculation
        start.setHours(0, 0, 0, 0);
        now.setHours(0, 0, 0, 0);
        const diffMs = now.getTime() - start.getTime();
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        return Math.min(10, Math.max(1, diffDays + 1));
      },

      setDayOverride: (day) => {
        set({ dayOverride: day });
      },
    }),
    {
      name: "spanish-speedrun-settings",
    },
  ),
);
