import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  BookOpen,
  Lightbulb,
  MessageSquare,
  Repeat,
  Trophy,
  Lock,
  CheckCircle,
  ChevronLeft,
} from "lucide-react";
import { toast } from "sonner";
import { useEffect } from "react";
import { cn } from "@/lib/utils";
import { getDayPlan } from "@/lib/curriculum";
import { useSettingsStore } from "@/stores/settings";
import { useProgressStore } from "@/stores/progress";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { ExerciseType } from "@/lib/types";

export const Route = createFileRoute("/day/$dayId/")({
  component: DayHubPage,
});

const exerciseMeta: Record<
  ExerciseType,
  { label: string; icon: typeof BookOpen; route: string }
> = {
  vocab: { label: "Vocabulary", icon: BookOpen, route: "vocab" },
  cognates: { label: "Cognates", icon: Lightbulb, route: "cognates" },
  frames: { label: "Sentence Frames", icon: MessageSquare, route: "frames" },
  verbs: { label: "Verb Practice", icon: Repeat, route: "verbs" },
  quiz: { label: "Daily Quiz", icon: Trophy, route: "quiz" },
};

function DayHubPage() {
  const { dayId } = Route.useParams();
  const navigate = useNavigate();
  const currentDay = useSettingsStore((s) => s.getCurrentDay());
  const getCompletion = useProgressStore((s) => s.getCompletion);
  const canTakeQuiz = useProgressStore((s) => s.canTakeQuiz);

  const dayNum = Number(dayId);
  const plan = getDayPlan(dayNum);

  useEffect(() => {
    if (!plan || dayNum < 1 || dayNum > 10 || dayNum > currentDay) {
      toast("Day not available yet");
      navigate({ to: "/dashboard" });
    }
  }, [plan, dayNum, currentDay, navigate]);

  if (!plan || dayNum > currentDay) {
    return null;
  }

  const quizUnlocked = canTakeQuiz(dayNum);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Button asChild variant="ghost" size="sm" className="mb-2 -ml-2 min-h-[44px]">
          <Link to="/dashboard">
            <ChevronLeft className="h-4 w-4" />
            Back
          </Link>
        </Button>
        <h2 className="text-2xl font-bold">
          Day {plan.day}: {plan.title}
        </h2>
        <p className="text-muted-foreground mt-1">{plan.subtitle}</p>
      </div>

      <div className="flex flex-col gap-3">
        {plan.exerciseTypes.map((type) => {
          const meta = exerciseMeta[type];
          const Icon = meta.icon;
          const completion = getCompletion(dayNum, type);
          const isQuiz = type === "quiz";
          const locked = isQuiz && !quizUnlocked;

          const badge = locked ? (
            <Badge variant="outline" className="gap-1">
              <Lock className="h-3 w-3" />
              Locked
            </Badge>
          ) : completion?.completed ? (
            <Badge variant="secondary" className="gap-1 bg-emerald-500/10 text-emerald-600">
              <CheckCircle className="h-3 w-3" />
              Done
            </Badge>
          ) : completion?.attempts ? (
            <Badge variant="secondary">{completion.bestScore}%</Badge>
          ) : (
            <Badge variant="outline">New</Badge>
          );

          const card = (
            <Card
              className={cn(
                "flex-row items-center gap-4 px-4 transition-all",
                locked && "opacity-50",
              )}
            >
              <div
                className={cn(
                  "flex h-11 w-11 shrink-0 items-center justify-center rounded-lg",
                  completion?.completed
                    ? "bg-emerald-500/10 text-emerald-600"
                    : "bg-muted text-muted-foreground",
                )}
              >
                {locked ? (
                  <Lock className="h-5 w-5" />
                ) : (
                  <Icon className="h-5 w-5" />
                )}
              </div>
              <CardContent className="flex-1 p-0">
                <p className="font-medium">{meta.label}</p>
              </CardContent>
              <div className="shrink-0">{badge}</div>
            </Card>
          );

          if (locked) {
            return <div key={type}>{card}</div>;
          }

          return (
            <Link
              key={type}
              to={`/day/$dayId/${meta.route}` as string}
              params={{ dayId: String(dayNum) }}
              className="block min-h-[44px]"
            >
              {card}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
