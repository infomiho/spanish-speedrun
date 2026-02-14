import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { shuffle } from "@/lib/shuffle";
import { Check, X, ArrowRight } from "lucide-react";
import type { SentenceFrame, VocabWord } from "@/lib/types";

interface SentenceBuilderProps {
  frame: SentenceFrame;
  correctWord: VocabWord;
  distractors: VocabWord[];
  onAnswer: (correct: boolean) => void;
  onNext?: () => void;
}

export function SentenceBuilder({
  frame,
  correctWord,
  distractors,
  onAnswer,
  onNext,
}: SentenceBuilderProps) {
  const [selected, setSelected] = useState<VocabWord | null>(null);
  const isAnswered = selected !== null;
  const isCorrect = selected?.id === correctWord.id;

  const options = useMemo(() => {
    // Build shuffled options: correct + distractors
    const all = [correctWord, ...distractors];
    return shuffle(all);
  }, [correctWord, distractors]);

  // Build the English sentence with the target word bolded
  const englishSentence = frame.english.replace("___", correctWord.english);
  const englishParts = englishSentence.split(correctWord.english);

  // Build the completed Spanish sentence
  const filledTemplate = frame.template.replace("___", correctWord.spanish);

  const handleSelect = (word: VocabWord) => {
    if (isAnswered) return;
    setSelected(word);

    if (onNext) {
      // Manual advance mode: record immediately, user clicks Continue
      onAnswer(word.id === correctWord.id);
    } else {
      // Auto-advance mode: show feedback, then advance after delay
      setTimeout(() => {
        onAnswer(word.id === correctWord.id);
      }, 1200);
    }
  };

  return (
    <Card>
      <CardContent className="pt-6 space-y-5">
        {/* English target sentence */}
        <div className="text-center space-y-2">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Translate to Spanish
          </p>
          <p className="text-lg font-semibold">
            {englishParts[0]}
            <span className="text-primary font-bold">{correctWord.english}</span>
            {englishParts.slice(1).join(correctWord.english)}
          </p>
        </div>

        {/* Spanish frame with blank or completed */}
        <div className="text-center">
          <p className="text-xl font-semibold">
            {isAnswered ? (
              filledTemplate
            ) : (
              <>
                {frame.template.split("___")[0]}
                <span className="inline-block mx-1 w-24 border-b-2 border-primary/60" />
                {frame.template.split("___")[1]}
              </>
            )}
          </p>
        </div>

        {/* Option buttons */}
        <div className="grid gap-2">
          {options.map((word, i) => {
            const isThisCorrect = word.id === correctWord.id;
            const isThisSelected = selected?.id === word.id;
            let extraClasses = "";

            if (isAnswered) {
              if (isThisCorrect) {
                extraClasses = "bg-emerald-600 hover:bg-emerald-600 text-white border-emerald-600";
              } else if (isThisSelected) {
                extraClasses = "bg-red-100 border-red-300 text-red-700 dark:bg-red-950 dark:border-red-800 dark:text-red-400";
              }
            }

            return (
              <Button
                key={word.id}
                variant="outline"
                className={cn(
                  "h-auto py-3 px-4 text-left justify-start text-base",
                  extraClasses,
                  !isAnswered && "hover:border-primary/50",
                )}
                onClick={() => handleSelect(word)}
                disabled={isAnswered}
              >
                <span className="mr-3 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs font-medium">
                  {isAnswered && isThisCorrect ? (
                    <Check className="w-3.5 h-3.5" />
                  ) : isAnswered && isThisSelected ? (
                    <X className="w-3.5 h-3.5" />
                  ) : (
                    String.fromCharCode(65 + i)
                  )}
                </span>
                <span>
                  {word.spanish}
                  <span className="ml-1.5 text-xs text-muted-foreground">
                    ({word.english})
                  </span>
                </span>
              </Button>
            );
          })}
        </div>

        {/* Feedback */}
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
              {isCorrect ? "Correct!" : `The answer was: ${correctWord.spanish} (${correctWord.english})`}
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

