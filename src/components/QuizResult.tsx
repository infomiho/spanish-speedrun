import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ProgressRing } from "@/components/ProgressRing";
import type { SessionResult } from "@/lib/types";
import { RotateCcw, ArrowRight, Trophy, Target, Flame } from "lucide-react";
import { useEffect, useState } from "react";

interface QuizResultProps {
  result: SessionResult;
  onRestart?: () => void;
  onContinue?: () => void;
  continueLabel?: string;
}

export function QuizResult({
  result,
  onRestart,
  onContinue,
  continueLabel = "Continue",
}: QuizResultProps) {
  const score = result.total > 0 ? Math.round((result.correct / result.total) * 100) : 0;
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    if (score >= 80) {
      setShowConfetti(true);
      const timer = setTimeout(() => setShowConfetti(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [score]);

  const getMessage = () => {
    if (score === 100) return { icon: Trophy, text: "Perfect score!", sub: "You nailed every single one!" };
    if (score >= 80) return { icon: Flame, text: "Great job!", sub: "You're making real progress!" };
    if (score >= 60) return { icon: Target, text: "Good effort!", sub: "Keep practicing to improve." };
    return { icon: Target, text: "Keep going!", sub: "Practice makes perfecto." };
  };

  const message = getMessage();
  const Icon = message.icon;

  return (
    <>
      {showConfetti && <Confetti />}
      <Card className="max-w-sm mx-auto">
        <CardContent className="pt-6 text-center space-y-6">
          <div className="flex justify-center">
            <ProgressRing value={score} size={96} strokeWidth={6}>
              <span className="text-2xl font-bold">{score}%</span>
            </ProgressRing>
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-center gap-2">
              <Icon className="w-5 h-5 text-primary" />
              <h3 className="text-lg font-semibold">{message.text}</h3>
            </div>
            <p className="text-sm text-muted-foreground">{message.sub}</p>
          </div>

          <div className="grid grid-cols-3 gap-3 text-center">
            <div>
              <p className="text-2xl font-bold text-emerald-600">{result.correct}</p>
              <p className="text-xs text-muted-foreground">Correct</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-red-500">{result.incorrect}</p>
              <p className="text-xs text-muted-foreground">Incorrect</p>
            </div>
            <div>
              <p className="text-2xl font-bold">{result.total}</p>
              <p className="text-xs text-muted-foreground">Total</p>
            </div>
          </div>

          <div className="flex gap-3">
            {onRestart && (
              <Button variant="outline" className="flex-1" onClick={onRestart}>
                <RotateCcw className="w-4 h-4 mr-2" />
                Retry
              </Button>
            )}
            {onContinue && (
              <Button className="flex-1" onClick={onContinue}>
                {continueLabel}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </>
  );
}

function Confetti() {
  const colors = ["#ef4444", "#f59e0b", "#10b981", "#3b82f6", "#8b5cf6", "#ec4899"];
  const pieces = Array.from({ length: 30 }, (_, i) => ({
    id: i,
    left: Math.random() * 100,
    delay: Math.random() * 2,
    color: colors[Math.floor(Math.random() * colors.length)],
    size: Math.random() * 8 + 4,
  }));

  return (
    <div className="fixed inset-0 pointer-events-none z-50">
      {pieces.map((piece) => (
        <div
          key={piece.id}
          className="confetti-piece"
          style={{
            left: `${piece.left}%`,
            animationDelay: `${piece.delay}s`,
            width: piece.size,
            height: piece.size,
            backgroundColor: piece.color,
            borderRadius: Math.random() > 0.5 ? "50%" : "0",
          }}
        />
      ))}
    </div>
  );
}
