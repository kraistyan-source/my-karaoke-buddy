import { useState, useEffect, useCallback } from "react";
import { ArrowLeft, Pause, Play, SkipForward, Mic } from "lucide-react";
import { Song } from "@/data/songs";
import { cn } from "@/lib/utils";

interface SingScreenProps {
  song: Song;
  onBack: () => void;
}

const SingScreen = ({ song, onBack }: SingScreenProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [activeLine, setActiveLine] = useState(0);

  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      setCurrentTime((t) => t + 0.1);
    }, 100);
    return () => clearInterval(interval);
  }, [isPlaying]);

  useEffect(() => {
    let idx = -1;
    for (let i = song.lyrics.length - 1; i >= 0; i--) {
      if (song.lyrics[i].time <= currentTime) { idx = i; break; }
    }
    if (idx >= 0) setActiveLine(idx);
  }, [currentTime, song.lyrics]);

  const handlePlayPause = useCallback(() => {
    setIsPlaying((p) => !p);
  }, []);

  const handleSkip = useCallback(() => {
    const nextIdx = Math.min(activeLine + 1, song.lyrics.length - 1);
    setCurrentTime(song.lyrics[nextIdx].time);
  }, [activeLine, song.lyrics]);

  const totalDuration = song.lyrics[song.lyrics.length - 1].time + 10;
  const progress = (currentTime / totalDuration) * 100;

  return (
    <div className="fixed inset-0 bg-background z-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <button onClick={onBack} className="text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-6 w-6" />
        </button>
        <div className="text-center">
          <h2 className="font-display text-sm text-primary neon-text-primary animate-flicker">
            {song.title}
          </h2>
          <p className="text-xs text-muted-foreground">{song.artist}</p>
        </div>
        <Mic className="h-5 w-5 text-secondary animate-pulse-neon" />
      </div>

      {/* Progress bar */}
      <div className="h-1 bg-muted">
        <div
          className="h-full bg-secondary neon-box-secondary transition-all duration-100"
          style={{ width: `${Math.min(progress, 100)}%` }}
        />
      </div>

      {/* Lyrics */}
      <div className="flex-1 overflow-hidden flex flex-col items-center justify-center px-6 relative">
        <div className="vhs-scanlines absolute inset-0" />
        <div className="relative z-10 space-y-6 text-center max-w-2xl">
          {song.lyrics.map((line, i) => {
            const isPast = i < activeLine;
            const isActive = i === activeLine;
            const isFuture = i > activeLine;
            const isVisible = Math.abs(i - activeLine) <= 3;

            if (!isVisible) return null;

            return (
              <div
                key={i}
                className={cn(
                  "transition-all duration-500 font-mono",
                  isActive && "text-2xl md:text-4xl text-primary neon-text-primary font-bold animate-lyric-slide",
                  isPast && "text-lg md:text-xl text-muted-foreground/40 scale-90",
                  isFuture && "text-lg md:text-xl text-foreground/70"
                )}
              >
                {line.text}
              </div>
            );
          })}
        </div>
      </div>

      {/* Controls */}
      <div className="p-6 border-t border-border">
        <div className="flex items-center justify-center gap-8">
          <button
            onClick={handleSkip}
            className="text-muted-foreground hover:text-secondary transition-colors"
          >
            <SkipForward className="h-6 w-6" />
          </button>
          <button
            onClick={handlePlayPause}
            className={cn(
              "w-16 h-16 rounded-full border-2 flex items-center justify-center transition-all",
              isPlaying
                ? "border-primary bg-primary/10 neon-box-primary"
                : "border-secondary bg-secondary/10 neon-box-secondary"
            )}
          >
            {isPlaying ? (
              <Pause className="h-7 w-7 text-primary" />
            ) : (
              <Play className="h-7 w-7 text-secondary ml-1" />
            )}
          </button>
          <button onClick={onBack} className="text-muted-foreground hover:text-destructive transition-colors">
            <ArrowLeft className="h-6 w-6" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default SingScreen;
