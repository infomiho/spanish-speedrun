import { useSettingsStore } from "@/stores/settings";
import { useProgressStore } from "@/stores/progress";

/**
 * Returns the effective current day: the first incomplete day,
 * capped by the calendar day since the user started.
 */
export function useCurrentDay(): number {
  const calendarDay = useSettingsStore((s) => s.getCurrentDay());
  const isDayComplete = useProgressStore((s) => s.isDayComplete);

  let day = 1;
  while (day < calendarDay && isDayComplete(day)) {
    day++;
  }
  return day;
}
