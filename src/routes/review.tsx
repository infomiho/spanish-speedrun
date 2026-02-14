import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useCallback } from "react";
import { useSrsStore } from "@/stores/srs";
import { FlashCard } from "@/components/FlashCard";
import { QuizResult } from "@/components/QuizResult";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Inbox, Square } from "lucide-react";
import type { SrsCard, SrsQuality, SessionResult } from "@/lib/types";

export const Route = createFileRoute("/review")({
  component: ReviewPage,
});

function ReviewPage() {
  const navigate = useNavigate();
  const getDueCards = useSrsStore((s) => s.getDueCards);
  const reviewCard = useSrsStore((s) => s.review);

  const [sessionCards] = useState<SrsCard[]>(() => getDueCards());
  const [index, setIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isComplete, setIsComplete] = useState(sessionCards.length === 0);
  const [result, setResult] = useState<SessionResult>({
    total: 0,
    correct: 0,
    incorrect: 0,
    newCards: 0,
    reviewCards: sessionCards.length,
  });

  const handleAnswer = useCallback(
    (quality: SrsQuality) => {
      const card = sessionCards[index];
      if (!card) return;

      reviewCard(card.id, quality);

      const correct = quality >= 3;
      const newResult: SessionResult = {
        ...result,
        total: result.total + 1,
        correct: result.correct + (correct ? 1 : 0),
        incorrect: result.incorrect + (correct ? 0 : 1),
      };
      setResult(newResult);
      setIsFlipped(false);

      const nextIndex = index + 1;
      if (nextIndex >= sessionCards.length) {
        setIsComplete(true);
      } else {
        setIndex(nextIndex);
      }
    },
    [index, sessionCards, reviewCard, result],
  );

  const handleStop = () => {
    setIsComplete(true);
  };

  const handleRestart = () => {
    const freshDue = getDueCards();
    if (freshDue.length === 0) {
      setIsComplete(true);
      return;
    }
    window.location.reload();
  };

  // Empty state
  if (sessionCards.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-6 py-16">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-50 dark:bg-emerald-950/30">
          <Inbox className="h-10 w-10 text-emerald-500" />
        </div>
        <div className="text-center space-y-2">
          <h2 className="text-xl font-semibold">All caught up!</h2>
          <p className="text-muted-foreground text-sm max-w-xs">
            No cards due for review. Keep learning new words and they'll appear
            here when it's time to practice.
          </p>
        </div>
        <Button asChild className="min-h-[44px]">
          <Link to="/dashboard">Back to Dashboard</Link>
        </Button>
      </div>
    );
  }

  // Complete state
  if (isComplete) {
    return (
      <div className="space-y-4">
        <QuizResult
          result={result}
          onRestart={handleRestart}
          onContinue={() => navigate({ to: "/dashboard" })}
          continueLabel="Back to Dashboard"
        />
      </div>
    );
  }

  const current = sessionCards[index];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link to="/dashboard">
            <ArrowLeft className="w-4 h-4" />
          </Link>
        </Button>
        <div className="flex-1">
          <h2 className="font-semibold text-sm">SRS Review</h2>
          <p className="text-xs text-muted-foreground">
            {sessionCards.length} cards due
          </p>
        </div>
        <Badge variant="secondary" className="tabular-nums">
          {index + 1}/{sessionCards.length}
        </Badge>
      </div>

      <FlashCard
        key={current.id}
        front={current.front}
        back={current.back}
        category={current.type}
        onAnswer={handleAnswer}
        isFlipped={isFlipped}
        onFlip={() => setIsFlipped(true)}
      />

      <div className="flex justify-center pt-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleStop}
          className="min-h-[44px] text-muted-foreground"
        >
          <Square className="w-3.5 h-3.5 mr-2" />
          End Review
        </Button>
      </div>
    </div>
  );
}
