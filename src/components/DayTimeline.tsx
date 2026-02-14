import { useRef, useEffect } from "react";
import { useCurrentDay } from "@/hooks/useCurrentDay";
import { getAllDays } from "@/lib/curriculum";
import { DayCard } from "@/components/DayCard";

export function DayTimeline() {
  const currentDay = useCurrentDay();
  const days = getAllDays();
  const currentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    currentRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, []);

  return (
    <div className="flex flex-col gap-3">
      {days.map((plan) => (
        <div key={plan.day} ref={plan.day === currentDay ? currentRef : undefined}>
          <DayCard plan={plan} />
        </div>
      ))}
    </div>
  );
}
