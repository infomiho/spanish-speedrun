import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { BarChart3, Brain, RefreshCcw, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useSrsStore } from "@/stores/srs";
import { useProgressStore } from "@/stores/progress";
import { useSettingsStore } from "@/stores/settings";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";

export const Route = createFileRoute("/stats")({
  component: StatsPage,
});

function StatsPage() {
  const cards = useSrsStore((s) => s.cards);
  const resetSrs = useSrsStore((s) => s.resetSrs);
  const resetProgress = useProgressStore((s) => s.resetProgress);
  const resetJourney = useSettingsStore((s) => s.resetJourney);
  const progressDays = useProgressStore((s) => s.days);

  const [confirmReset, setConfirmReset] = useState(false);

  const allCards = Object.values(cards);
  const learnedCount = allCards.filter((c) => c.repetitions >= 4).length;
  const totalReviews = allCards.reduce((sum, c) => sum + c.repetitions, 0);
  const totalCards = allCards.length;

  const sortedCards = [...allCards].sort((a, b) => {
    const aRate = a.repetitions > 0 ? a.easeFactor : 0;
    const bRate = b.repetitions > 0 ? b.easeFactor : 0;
    return aRate - bRate;
  });

  const getDayCompletionPercent = useProgressStore((s) => s.getDayCompletionPercent);

  function handleReset() {
    if (!confirmReset) {
      setConfirmReset(true);
      return;
    }
    resetSrs();
    resetProgress();
    resetJourney();
    setConfirmReset(false);
    toast("All progress has been reset");
  }

  return (
    <div className="flex flex-col gap-6">
      <h2 className="text-2xl font-bold">Statistics</h2>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Overall
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold">{learnedCount}</p>
              <p className="text-xs text-muted-foreground">Words Learned</p>
            </div>
            <div>
              <p className="text-2xl font-bold">{totalReviews}</p>
              <p className="text-xs text-muted-foreground">Total Reviews</p>
            </div>
            <div>
              <p className="text-2xl font-bold">{totalCards}</p>
              <p className="text-xs text-muted-foreground">Total Cards</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Day Completion</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-5 gap-2">
            {Array.from({ length: 10 }, (_, i) => i + 1).map((day) => {
              const pct = getDayCompletionPercent(day);
              return (
                <div
                  key={day}
                  className={cn(
                    "flex flex-col items-center gap-1 rounded-lg border p-2 text-center",
                    pct === 100 && "border-emerald-500/50 bg-emerald-500/5",
                  )}
                >
                  <span className="text-xs font-medium text-muted-foreground">
                    D{day}
                  </span>
                  <span className="text-sm font-bold">{pct}%</span>
                  <Progress value={pct} className="h-1" />
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {sortedCards.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5" />
              SRS Card Details
            </CardTitle>
            <CardDescription>Sorted by ease factor (hardest first)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-2 max-h-80 overflow-y-auto">
              {sortedCards.map((card) => (
                <div
                  key={card.id}
                  className="flex items-center justify-between gap-2 rounded-lg border px-3 py-2 text-sm"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-medium truncate">{card.front}</p>
                    <p className="text-muted-foreground text-xs truncate">
                      {card.back}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge variant="outline" className="text-[10px]">
                      <RefreshCcw className="h-2.5 w-2.5 mr-0.5" />
                      {card.repetitions}
                    </Badge>
                    <Badge variant="secondary" className="text-[10px]">
                      EF {card.easeFactor.toFixed(1)}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Separator />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <Trash2 className="h-5 w-5" />
            Reset Progress
          </CardTitle>
          <CardDescription>
            This will clear all progress, SRS data, and journey status.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            variant="destructive"
            className="min-h-[44px]"
            onClick={handleReset}
          >
            {confirmReset ? "Confirm Reset — This Cannot Be Undone" : "Reset All Progress"}
          </Button>
          {confirmReset && (
            <Button
              variant="ghost"
              className="ml-2 min-h-[44px]"
              onClick={() => setConfirmReset(false)}
            >
              Cancel
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
