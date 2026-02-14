import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { ExerciseType, ExerciseCompletion, DayProgress } from "@/lib/types";

interface ProgressState {
  days: Record<number, DayProgress>;

  recordAttempt: (day: number, type: ExerciseType, score: number) => void;
  getCompletion: (day: number, type: ExerciseType) => ExerciseCompletion | undefined;
  getDayCompletionPercent: (day: number) => number;
  isDayComplete: (day: number) => boolean;
  isExerciseComplete: (day: number, type: ExerciseType) => boolean;
  getExerciseScore: (day: number, type: ExerciseType) => number;
  canTakeQuiz: (day: number) => boolean;
  resetProgress: () => void;
}

const COMPLETION_THRESHOLD = 60;

export const useProgressStore = create<ProgressState>()(
  persist(
    (set, get) => ({
      days: {},

      recordAttempt: (day, type, score) => {
        set((state) => {
          const dayProgress = state.days[day] ?? {};
          const existing = dayProgress[type];
          const newCompletion: ExerciseCompletion = {
            type,
            bestScore: Math.max(score, existing?.bestScore ?? 0),
            attempts: (existing?.attempts ?? 0) + 1,
            completed: score >= COMPLETION_THRESHOLD || (existing?.completed ?? false),
            lastAttemptAt: Date.now(),
          };
          return {
            days: {
              ...state.days,
              [day]: {
                ...dayProgress,
                [type]: newCompletion,
              },
            },
          };
        });
      },

      getCompletion: (day, type) => {
        const dayProgress = get().days[day];
        if (!dayProgress) return undefined;
        return dayProgress[type] as ExerciseCompletion | undefined;
      },

      getDayCompletionPercent: (day) => {
        const dayProgress = get().days[day];
        if (!dayProgress) return 0;

        const exerciseTypes: ExerciseType[] = ["vocab", "cognates", "frames", "verbs", "quiz"];
        const validTypes = day === 1
          ? exerciseTypes.filter((t) => t !== "verbs") // No verbs on day 1
          : exerciseTypes;

        let completed = 0;
        for (const type of validTypes) {
          const completion = dayProgress[type] as ExerciseCompletion | undefined;
          if (completion?.completed) completed++;
        }
        return Math.round((completed / validTypes.length) * 100);
      },

      isDayComplete: (day) => {
        return get().getDayCompletionPercent(day) === 100;
      },

      isExerciseComplete: (day, type) => {
        const completion = get().getCompletion(day, type);
        return completion?.completed ?? false;
      },

      getExerciseScore: (day, type) => {
        const completion = get().getCompletion(day, type);
        return completion?.bestScore ?? 0;
      },

      canTakeQuiz: (day) => {
        const state = get();
        const exerciseTypes: ExerciseType[] = ["vocab", "cognates", "frames"];
        if (day >= 2) exerciseTypes.push("verbs");

        return exerciseTypes.every((type) => {
          const score = state.getExerciseScore(day, type);
          return score >= COMPLETION_THRESHOLD;
        });
      },

      resetProgress: () => {
        set({ days: {} });
      },
    }),
    {
      name: "spanish-speedrun-progress",
    },
  ),
);
