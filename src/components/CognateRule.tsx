import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { ArrowRight, Check, X } from "lucide-react";
import type { CognateRule as CognateRuleType } from "@/lib/types";

interface CognateRuleProps {
  rule: CognateRuleType;
  interactive?: boolean;
  onTryResult?: (correct: boolean) => void;
}

export function CognateRule({
  rule,
  interactive = false,
  onTryResult,
}: CognateRuleProps) {
  const [tryInput, setTryInput] = useState("");
  const [tryWord] = useState(() => {
    // Pick a random example for the "Try it" section
    if (rule.examples.length === 0) return null;
    return rule.examples[Math.floor(Math.random() * rule.examples.length)];
  });
  const [tryAnswered, setTryAnswered] = useState(false);
  const [tryCorrect, setTryCorrect] = useState(false);

  const handleTry = () => {
    if (!tryWord || !tryInput.trim()) return;
    const correct =
      tryInput.trim().toLowerCase() === tryWord.spanish.toLowerCase();
    setTryCorrect(correct);
    setTryAnswered(true);
    onTryResult?.(correct);
  };

  return (
    <Card>
      <CardContent className="pt-6 space-y-4">
        {/* Rule transformation display */}
        <div className="text-center space-y-2">
          <p className="text-sm text-muted-foreground">{rule.description}</p>
          <div className="flex items-center justify-center gap-3">
            <Badge variant="outline" className="text-base px-3 py-1 h-auto">
              <span className="font-bold">{rule.englishSuffix}</span>
            </Badge>
            <ArrowRight className="w-5 h-5 text-primary shrink-0" />
            <Badge variant="default" className="text-base px-3 py-1 h-auto">
              <span className="font-bold">{rule.spanishSuffix}</span>
            </Badge>
          </div>
        </div>

        {/* Example pairs */}
        {rule.examples.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Examples
            </p>
            <div className="grid gap-1.5">
              {rule.examples.map((ex, i) => {
                const engSuffix = rule.englishSuffix.startsWith("-") ? rule.englishSuffix.slice(1) : rule.englishSuffix;
                const spaSuffix = rule.spanishSuffix.startsWith("-") ? rule.spanishSuffix.slice(1) : rule.spanishSuffix;
                const stem = ex.english
                  .toLowerCase()
                  .slice(
                    0,
                    ex.english.length - engSuffix.length,
                  );
                const spanishStem = ex.spanish
                  .toLowerCase()
                  .slice(
                    0,
                    ex.spanish.length - spaSuffix.length,
                  );

                return (
                  <div
                    key={i}
                    className="flex items-center gap-2 text-sm rounded-md bg-muted/50 px-3 py-1.5"
                  >
                    <span>
                      {stem}
                      <span className="font-bold text-foreground">
                        {rule.englishSuffix}
                      </span>
                    </span>
                    <ArrowRight className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                    <span>
                      {spanishStem}
                      <span className="font-bold text-primary">
                        {rule.spanishSuffix}
                      </span>
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Interactive "Try it" section */}
        {interactive && tryWord && (
          <div className="border-t pt-4 space-y-3">
            <p className="text-sm font-medium">
              Try it: What's the Spanish for{" "}
              <span className="font-bold">{tryWord.english}</span>?
            </p>
            <div className="flex gap-2">
              <Input
                value={tryInput}
                onChange={(e) => setTryInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !tryAnswered) handleTry();
                }}
                placeholder="Type the Spanish word..."
                disabled={tryAnswered}
                className={cn(
                  "text-base",
                  tryAnswered && tryCorrect && "border-emerald-500",
                  tryAnswered && !tryCorrect && "border-red-500",
                )}
              />
              {!tryAnswered && (
                <Button
                  onClick={handleTry}
                  disabled={!tryInput.trim()}
                  className="min-h-[44px]"
                >
                  Check
                </Button>
              )}
            </div>
            {tryAnswered && (
              <div
                className={cn(
                  "flex items-center gap-2 text-sm font-medium p-2 rounded-md",
                  tryCorrect
                    ? "text-emerald-700 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-950/30"
                    : "text-red-700 bg-red-50 dark:text-red-400 dark:bg-red-950/30",
                )}
              >
                {tryCorrect ? (
                  <>
                    <Check className="w-4 h-4" />
                    Correct!
                  </>
                ) : (
                  <>
                    <X className="w-4 h-4" />
                    The answer was: <strong>{tryWord.spanish}</strong>
                  </>
                )}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
