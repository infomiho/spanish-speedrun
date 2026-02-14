import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { SrsQuality } from "@/lib/types";
import { Check, X, Eye } from "lucide-react";

interface FlashCardProps {
  front: string;
  back: string;
  category?: string;
  onAnswer: (quality: SrsQuality) => void;
  isFlipped: boolean;
  onFlip: () => void;
}

export function FlashCard({
  front,
  back,
  category,
  onAnswer,
  isFlipped,
  onFlip,
}: FlashCardProps) {
  return (
    <div className="space-y-4">
      <div
        className="mx-auto min-h-[200px] flex flex-col items-center justify-center rounded-xl border bg-card p-6 shadow-sm cursor-pointer"
        onClick={() => !isFlipped && onFlip()}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            if (!isFlipped) onFlip();
          }
        }}
      >
        <p className="text-2xl font-bold text-center">{front}</p>

        {isFlipped ? (
          <div className="mt-4 flex flex-col items-center gap-2">
            <div className="h-px w-16 bg-border" />
            <p className="text-lg text-center text-muted-foreground">{back}</p>
            {category && (
              <Badge variant="secondary" className="capitalize">
                {category}
              </Badge>
            )}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground mt-4 flex items-center gap-1.5">
            <Eye className="w-3.5 h-3.5" />
            Tap to reveal
          </p>
        )}
      </div>

      {isFlipped && (
        <div className="flex gap-3 justify-center pt-2">
          <Button
            variant="outline"
            className="flex-1 max-w-[160px] min-h-[44px] border-red-300 text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950/30"
            onClick={() => onAnswer(1)}
          >
            <X className="w-4 h-4 mr-2" />
            Still learning
          </Button>
          <Button
            className="flex-1 max-w-[160px] min-h-[44px] bg-emerald-600 hover:bg-emerald-700 text-white"
            onClick={() => onAnswer(4)}
          >
            <Check className="w-4 h-4 mr-2" />
            I knew it
          </Button>
        </div>
      )}
    </div>
  );
}
