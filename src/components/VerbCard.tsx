import { useState, useRef, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Check, X } from "lucide-react";
import type { VerbEntry } from "@/lib/types";

type Pronoun = "yo" | "tú" | "él";

interface VerbCardProps {
  verb: VerbEntry;
  mode: "display" | "quiz";
  targetPronoun?: Pronoun;
  onAnswer?: (correct: boolean) => void;
}

const pronounLabels: Record<Pronoun, string> = {
  yo: "yo",
  tú: "tú",
  "él": "él/ella",
};

export function VerbCard({
  verb,
  mode,
  targetPronoun,
  onAnswer,
}: VerbCardProps) {
  const [input, setInput] = useState("");
  const [isAnswered, setIsAnswered] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [flipped, setFlipped] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (mode === "quiz") {
      inputRef.current?.focus();
    }
  }, [mode]);

  const correctAnswer = targetPronoun ? verb.conjugations[targetPronoun] : "";

  const checkAnswer = () => {
    if (!input.trim()) return;
    const normalized = input.trim().toLowerCase();
    const expected = correctAnswer.toLowerCase();
    const correct = normalized === expected;
    setIsCorrect(correct);
    setIsAnswered(true);
    setTimeout(() => {
      onAnswer?.(correct);
    }, 1500);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !isAnswered) {
      checkAnswer();
    }
  };

  const pronouns: Pronoun[] = ["yo", "tú", "él"];

  if (mode === "display") {
    return (
      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="text-center space-y-1">
            <p className="text-lg font-semibold">{verb.infinitive}</p>
            <p className="text-sm text-muted-foreground">{verb.english}</p>
          </div>

          {!flipped ? (
            <div className="flex justify-center">
              <Button
                onClick={() => setFlipped(true)}
                variant="outline"
                className="min-h-[44px]"
              >
                Show conjugations
              </Button>
            </div>
          ) : (
            <>
              <div className="rounded-lg border overflow-hidden">
                <table className="w-full text-sm">
                  <tbody>
                    {pronouns.map((p) => (
                      <tr key={p} className="border-b last:border-b-0">
                        <td className="px-4 py-2.5 font-medium text-muted-foreground w-28">
                          {pronounLabels[p]}
                        </td>
                        <td className="px-4 py-2.5 font-semibold">
                          {verb.conjugations[p]}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="flex justify-center">
                <Button
                  onClick={() => {
                    setFlipped(false);
                    onAnswer?.(true);
                  }}
                  className="min-h-[44px]"
                >
                  Got it
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    );
  }

  // Quiz mode
  return (
    <Card>
      <CardContent className="pt-6 space-y-4">
        <div className="text-center space-y-1">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Conjugate the verb
          </p>
          <p className="text-lg font-semibold">{verb.infinitive}</p>
          <p className="text-sm text-muted-foreground">({verb.english})</p>
        </div>

        <div className="rounded-lg border overflow-hidden">
          <table className="w-full text-sm">
            <tbody>
              {pronouns.map((p) => (
                <tr key={p} className="border-b last:border-b-0">
                  <td className="px-4 py-2.5 font-medium text-muted-foreground w-28">
                    {pronounLabels[p]}
                  </td>
                  <td className="px-4 py-2.5">
                    {p === targetPronoun ? (
                      isAnswered ? (
                        <span
                          className={cn(
                            "font-semibold",
                            isCorrect
                              ? "text-emerald-600"
                              : "text-red-500",
                          )}
                        >
                          {isCorrect
                            ? correctAnswer
                            : `${input} → ${correctAnswer}`}
                        </span>
                      ) : (
                        <div className="flex gap-2">
                          <Input
                            ref={inputRef}
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="???"
                            className="h-8 text-sm"
                            disabled={isAnswered}
                          />
                          <Button
                            size="sm"
                            onClick={checkAnswer}
                            disabled={!input.trim() || isAnswered}
                            className="h-8"
                          >
                            Check
                          </Button>
                        </div>
                      )
                    ) : (
                      <span className="font-semibold">
                        {verb.conjugations[p]}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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
