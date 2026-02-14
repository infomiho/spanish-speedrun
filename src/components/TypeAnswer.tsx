import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Check, X } from "lucide-react";

interface TypeAnswerProps {
  question: string;
  correctAnswer: string;
  onAnswer: (correct: boolean) => void;
  hint?: string;
  placeholder?: string;
  /** Accept minor typos (1-2 char difference) */
  fuzzy?: boolean;
}

export function TypeAnswer({
  question,
  correctAnswer,
  onAnswer,
  hint,
  placeholder = "Type your answer...",
  fuzzy = true,
}: TypeAnswerProps) {
  const [input, setInput] = useState("");
  const [isAnswered, setIsAnswered] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const checkAnswer = () => {
    if (!input.trim()) return;
    const normalizedInput = input.trim().toLowerCase();
    const normalizedCorrect = correctAnswer.trim().toLowerCase();

    let correct: boolean;
    if (fuzzy) {
      correct =
        normalizedInput === normalizedCorrect ||
        levenshtein(normalizedInput, normalizedCorrect) <= 1;
    } else {
      correct = normalizedInput === normalizedCorrect;
    }

    setIsCorrect(correct);
    setIsAnswered(true);
    setTimeout(() => {
      onAnswer(correct);
    }, 1500);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !isAnswered) {
      checkAnswer();
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

        <div className="flex gap-2">
          <Input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={isAnswered}
            className={cn(
              "text-base",
              isAnswered && isCorrect && "border-emerald-500",
              isAnswered && !isCorrect && "border-red-500",
            )}
          />
          {!isAnswered && (
            <Button onClick={checkAnswer} disabled={!input.trim()}>
              Check
            </Button>
          )}
        </div>

        {isAnswered && (
          <div
            className={cn(
              "flex items-center justify-center gap-2 text-sm font-medium p-3 rounded-md",
              isCorrect
                ? "text-emerald-700 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-950/30"
                : "text-red-700 bg-red-50 dark:text-red-400 dark:bg-red-950/30",
            )}
          >
            {isCorrect ? (
              <>
                <Check className="w-4 h-4" />
                Correct!
              </>
            ) : (
              <>
                <X className="w-4 h-4" />
                The answer was: <strong>{correctAnswer}</strong>
              </>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function levenshtein(a: string, b: string): number {
  const matrix: number[][] = [];
  for (let i = 0; i <= a.length; i++) matrix[i] = [i];
  for (let j = 0; j <= b.length; j++) matrix[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost,
      );
    }
  }
  return matrix[a.length][b.length];
}
