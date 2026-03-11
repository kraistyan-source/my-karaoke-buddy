import { Star, Trophy } from "lucide-react";
import { SingScore } from "@/stores/useScoring";
import { cn } from "@/lib/utils";

interface ScoreDisplayProps {
  score: SingScore | null;
  currentScore: number;
  isScoring: boolean;
}

const ScoreDisplay = ({ score, currentScore, isScoring }: ScoreDisplayProps) => {
  if (!isScoring && !score) return null;

  const displayScore = score?.score ?? currentScore;
  const stars = score?.stars ?? (displayScore >= 90 ? 5 : displayScore >= 75 ? 4 : displayScore >= 55 ? 3 : displayScore >= 35 ? 2 : 1);

  const getMessage = (s: number) => {
    if (s >= 90) return "ESPETACULAR! 🔥";
    if (s >= 75) return "ARRASOU! 🎤";
    if (s >= 55) return "MANDOU BEM! 👏";
    if (s >= 35) return "BOA TENTATIVA! 😄";
    return "VALEU A CORAGEM! 💪";
  };

  return (
    <div className={cn(
      "flex items-center gap-3 px-3 py-2 rounded border transition-all",
      isScoring
        ? "border-secondary/40 bg-secondary/5"
        : "border-primary/40 bg-primary/5"
    )}>
      {/* Live indicator or trophy */}
      {isScoring ? (
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-destructive animate-pulse" />
          <span className="text-[9px] font-mono text-muted-foreground">AO VIVO</span>
        </div>
      ) : (
        <Trophy className="h-5 w-5 text-primary" />
      )}

      {/* Score number */}
      <span className={cn(
        "text-lg font-display font-bold tabular-nums",
        displayScore >= 75 ? "text-primary neon-text-primary" : "text-foreground"
      )}>
        {displayScore}
      </span>

      {/* Stars */}
      <div className="flex gap-0.5">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star
            key={i}
            className={cn(
              "h-3.5 w-3.5 transition-all",
              i < stars ? "text-primary fill-primary" : "text-muted-foreground/30"
            )}
          />
        ))}
      </div>

      {/* Message (only on final) */}
      {!isScoring && score && (
        <span className="text-xs font-mono text-muted-foreground ml-auto">
          {getMessage(displayScore)}
        </span>
      )}
    </div>
  );
};

export default ScoreDisplay;
