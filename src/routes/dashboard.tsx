import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo } from "react";
import { Rocket, RefreshCcw, BookOpen, Puzzle, MessageSquare, Zap, Trophy, ArrowRight, Clock, Brain } from "lucide-react";
import { useSettingsStore } from "@/stores/settings";
import { useSrsStore } from "@/stores/srs";
import { getDueCards as getDueCardsLib } from "@/lib/srs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { StreakCounter } from "@/components/StreakCounter";
import { DayTimeline } from "@/components/DayTimeline";

export const Route = createFileRoute("/dashboard")({
  component: DashboardPage,
});

function DashboardPage() {
  const startDate = useSettingsStore((s) => s.startDate);
  const startJourney = useSettingsStore((s) => s.startJourney);
  const cards = useSrsStore((s) => s.cards);
  const dueCount = useMemo(
    () => getDueCardsLib(Object.values(cards)).length,
    [cards],
  );

  if (!startDate) {
    return <Onboarding onStart={startJourney} />;
  }

  return (
    <div className="flex flex-col gap-6">
      <StreakCounter />

      {dueCount > 0 && (
        <Button asChild size="lg" className="min-h-[44px] w-full gap-2 text-base">
          <Link to="/review">
            <RefreshCcw className="h-5 w-5" />
            Review Due ({dueCount})
          </Link>
        </Button>
      )}

      <DayTimeline />
    </div>
  );
}

function Onboarding({ onStart }: { onStart: () => void }) {
  const exercises = [
    {
      icon: BookOpen,
      title: "Vocabulary Flashcards",
      desc: "Learn new words with spaced repetition. Tap to reveal, rate your confidence — words you struggle with come back sooner.",
    },
    {
      icon: Puzzle,
      title: "Cognate Patterns",
      desc: "Discover suffix rules that convert English words to Spanish. Learn one rule, unlock dozens of words instantly.",
    },
    {
      icon: MessageSquare,
      title: "Sentence Frames",
      desc: "Build real sentences by filling in blanks. Practice the phrases you'll actually use in conversation.",
    },
    {
      icon: Zap,
      title: "Verb Conjugation",
      desc: "Master the most important verbs. Study conjugation patterns, then test yourself on yo, tú, and él forms.",
    },
    {
      icon: Trophy,
      title: "Daily Quiz",
      desc: "Mixed review of everything from the day. Unlocks after you complete the other exercises.",
    },
  ];

  return (
    <div className="flex flex-col gap-6 py-4">
      {/* Hero */}
      <div className="text-center space-y-3">
        <div className="inline-flex p-4 rounded-2xl bg-gradient-to-br from-red-500 to-yellow-500 text-white shadow-lg">
          <Rocket className="h-10 w-10" />
        </div>
        <h2 className="text-2xl font-bold tracking-tight">
          Learn Spanish in 10 Days
        </h2>
        <p className="text-muted-foreground text-sm max-w-md mx-auto leading-relaxed">
          A structured, daily program that takes you from zero to functional
          Spanish. Each day builds on the last — vocabulary, grammar patterns,
          real sentences, and verb conjugations working together.
        </p>
      </div>

      {/* How it works */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">How it works</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-3 items-start">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">1</div>
            <div>
              <p className="text-sm font-medium">One day at a time</p>
              <p className="text-xs text-muted-foreground">Complete Day 1 before Day 2 unlocks. Each day takes 15-30 minutes.</p>
            </div>
          </div>
          <div className="flex gap-3 items-start">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">2</div>
            <div>
              <p className="text-sm font-medium">Complete 4-5 exercises per day</p>
              <p className="text-xs text-muted-foreground">Work through vocabulary, cognates, sentence frames, verbs, then take the quiz.</p>
            </div>
          </div>
          <div className="flex gap-3 items-start">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">3</div>
            <div>
              <p className="text-sm font-medium">Review what you've learned</p>
              <p className="text-xs text-muted-foreground">Spaced repetition brings back words at the optimal time. Check the Review tab daily.</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Exercise types */}
      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide px-1">
          Exercise types
        </h3>
        <div className="grid gap-2">
          {exercises.map((ex) => (
            <div
              key={ex.title}
              className="flex gap-3 items-start rounded-lg border p-3"
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-muted">
                <ex.icon className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium">{ex.title}</p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {ex.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Tips */}
      <Card className="border-blue-200 bg-blue-50/50 dark:border-blue-900 dark:bg-blue-950/20">
        <CardContent className="pt-5 space-y-2">
          <div className="flex items-center gap-2">
            <Brain className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            <p className="text-sm font-medium text-blue-900 dark:text-blue-300">Tips for success</p>
          </div>
          <ul className="text-xs text-blue-800 dark:text-blue-300/80 space-y-1.5 ml-6 list-disc">
            <li>Be consistent — do one day every day, even if it's a quick session</li>
            <li>Don't worry about perfection. Getting 70%+ on the quiz is great progress</li>
            <li>Use the Review tab between days to reinforce what you've learned</li>
            <li>Say the words out loud as you practice — it helps with retention</li>
          </ul>
        </CardContent>
      </Card>

      {/* CTA */}
      <div className="flex flex-col items-center gap-3 pt-2 pb-4">
        <Button
          size="lg"
          className="min-h-[48px] min-w-[200px] text-base gap-2"
          onClick={onStart}
        >
          Start Day 1
          <ArrowRight className="h-4 w-4" />
        </Button>
        <p className="text-xs text-muted-foreground flex items-center gap-1">
          <Clock className="h-3 w-3" />
          ~20 minutes per day
        </p>
      </div>
    </div>
  );
}
