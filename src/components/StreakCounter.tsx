import { useCurrentDay } from "@/hooks/useCurrentDay";

function getSubtitle(day: number): string {
  if (day <= 1) return "Let's get started!";
  if (day <= 3) return "Building momentum!";
  if (day <= 5) return "Halfway there!";
  if (day <= 7) return "You're on fire!";
  if (day <= 9) return "Almost fluent!";
  return "Final day — you've got this!";
}

export function StreakCounter() {
  const currentDay = useCurrentDay();

  return (
    <div className="text-center py-4">
      <p className="text-3xl font-bold tracking-tight">
        Day {currentDay}{" "}
        <span className="text-muted-foreground font-normal text-lg">of 10</span>
      </p>
      <p className="text-sm text-muted-foreground mt-1">{getSubtitle(currentDay)}</p>
    </div>
  );
}
