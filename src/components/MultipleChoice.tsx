import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Check, X, ArrowRight } from "lucide-react";

interface MultipleChoiceProps {
  question: string;
  options: string[];
  correctIndex: number;
  onAnswer: (correct: boolean) => void;
  onNext?: () => void;
  hint?: string;
}

export function MultipleChoice({
  question,
  options,
  correctIndex,
  onAnswer,
  onNext,
  hint,
}: MultipleChoiceProps) {
  const [selected, setSelected] = useState<number | null>(null);
  const isAnswered = selected !== null;
  const isCorrect = selected === correctIndex;

  const handleSelect = (index: number) => {
    if (isAnswered) return;
    setSelected(index);

    if (onNext) {
      // Manual advance mode: record immediately, user clicks Continue
      onAnswer(index === correctIndex);
    } else {
      // Auto-advance mode: show feedback, then advance after delay
      setTimeout(() => {
        onAnswer(index === correctIndex);
      }, 1200);
    }
  };

  return (
    <Card>
      <CardContent className="pt-6 space-y-4">
        <div className="text-center space-y-2">
          <p className="text-lg font-semibold">{question}</p>
          {hint && (
            <p className="text-sm text-muted-foreground">{hint}</p>
          )}
        </div>

        <div className="grid gap-2">
          {options.map((option, i) => {
            let variant: "outline" | "default" | "destructive" = "outline";
            let extraClasses = "";

            if (isAnswered) {
              if (i === correctIndex) {
                variant = "default";
                extraClasses = "bg-emerald-600 hover:bg-emerald-600 text-white border-emerald-600";
              } else if (i === selected) {
                extraClasses = "bg-red-100 border-red-300 text-red-700 dark:bg-red-950 dark:border-red-800 dark:text-red-400";
              }
            }

            return (
              <Button
                key={i}
                variant={variant}
                className={cn(
                  "h-auto py-3 px-4 text-left justify-start text-base",
                  extraClasses,
                  !isAnswered && "hover:border-primary/50",
                )}
                onClick={() => handleSelect(i)}
                disabled={isAnswered}
              >
                <span className="mr-3 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs font-medium">
                  {isAnswered && i === correctIndex ? (
                    <Check className="w-3.5 h-3.5" />
                  ) : isAnswered && i === selected ? (
                    <X className="w-3.5 h-3.5" />
                  ) : (
                    String.fromCharCode(65 + i)
                  )}
                </span>
                {option}
              </Button>
            );
          })}
        </div>

        {isAnswered && (
          <div className="space-y-3">
            <div
              className={cn(
                "text-center text-sm font-medium p-2 rounded-md",
                isCorrect
                  ? "text-emerald-700 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-950/30"
                  : "text-red-700 bg-red-50 dark:text-red-400 dark:bg-red-950/30",
              )}
            >
              {isCorrect ? "Correct!" : `The answer was: ${options[correctIndex]}`}
            </div>
            {onNext && (
              <div className="flex justify-center">
                <Button
                  onClick={onNext}
                  className="min-h-[44px] gap-2"
                >
                  Continue
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
