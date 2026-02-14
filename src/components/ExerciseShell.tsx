import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, Info } from "lucide-react";

interface ExerciseShellProps {
  title: string;
  subtitle?: string;
  intro?: string;
  current: number;
  total: number;
  backTo: string;
  children: React.ReactNode;
}

export function ExerciseShell({
  title,
  subtitle,
  intro,
  current,
  total,
  backTo,
  children,
}: ExerciseShellProps) {
  const progress = total > 0 ? Math.round((current / total) * 100) : 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link to={backTo}>
            <ArrowLeft className="w-4 h-4" />
          </Link>
        </Button>
        <div className="flex-1">
          <h2 className="font-semibold text-sm">{title}</h2>
          {subtitle && (
            <p className="text-xs text-muted-foreground">{subtitle}</p>
          )}
        </div>
        <span className="text-sm text-muted-foreground tabular-nums">
          {current}/{total}
        </span>
      </div>

      <Progress value={progress} className="h-2" />

      {intro && current === 1 && (
        <div className="flex gap-2.5 rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-800 dark:border-blue-900 dark:bg-blue-950/30 dark:text-blue-300">
          <Info className="h-4 w-4 shrink-0 mt-0.5" />
          <p>{intro}</p>
        </div>
      )}

      <div className="pt-2">{children}</div>
    </div>
  );
}
