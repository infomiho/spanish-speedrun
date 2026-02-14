import { Link } from "@tanstack/react-router";
import { Lock, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { ProgressRing } from "@/components/ProgressRing";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { useProgressStore } from "@/stores/progress";
import { useSettingsStore } from "@/stores/settings";
import type { DayPlan } from "@/lib/types";

interface DayCardProps {
  plan: DayPlan;
}

export function DayCard({ plan }: DayCardProps) {
  const currentDay = useSettingsStore((s) => s.getCurrentDay());
  const percent = useProgressStore((s) => s.getDayCompletionPercent(plan.day));

  const isLocked = plan.day > currentDay;
  const isCurrent = plan.day === currentDay;
  const isCompleted = percent === 100;

  const content = (
    <Card
      size="sm"
      className={cn(
        "flex-row items-center gap-4 px-4 transition-all",
        isLocked && "opacity-50",
        isCurrent && "border-primary border-2",
        isCompleted && "bg-emerald-500/5",
      )}
    >
      <div className="shrink-0">
        {isLocked ? (
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <Lock className="h-5 w-5 text-muted-foreground" />
          </div>
        ) : isCompleted ? (
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10">
            <CheckCircle className="h-6 w-6 text-emerald-500" />
          </div>
        ) : (
          <ProgressRing value={percent} size={48} strokeWidth={4}>
            <span className="text-xs font-semibold">{percent}%</span>
          </ProgressRing>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-muted-foreground">
            Day {plan.day}
          </span>
        </div>
        <p className="font-medium truncate">{plan.title}</p>
        <div className="flex flex-wrap gap-1 mt-1">
          {plan.focusAreas.map((area) => (
            <Badge key={area} variant="secondary" className="text-[10px]">
              {area}
            </Badge>
          ))}
        </div>
      </div>
    </Card>
  );

  if (isLocked) {
    return content;
  }

  return (
    <Link to="/day/$dayId" params={{ dayId: String(plan.day) }} className="block min-h-[44px]">
      {content}
    </Link>
  );
}
