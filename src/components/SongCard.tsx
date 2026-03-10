import { Play, Clock } from "lucide-react";
import { Song } from "@/data/songs";
import { cn } from "@/lib/utils";

interface SongCardProps {
  song: Song;
  onPlay: (song: Song) => void;
  index: number;
}

const SongCard = ({ song, onPlay, index }: SongCardProps) => {
  return (
    <button
      onClick={() => onPlay(song)}
      className={cn(
        "group w-full text-left border border-border rounded bg-card hover:border-primary hover:neon-box-primary transition-all duration-300 p-4 vhs-scanlines",
        "animate-lyric-slide"
      )}
      style={{ animationDelay: `${index * 50}ms` }}
    >
      <div className="relative z-10 flex items-center gap-4">
        <div className="flex-shrink-0 w-12 h-12 rounded bg-muted flex items-center justify-center group-hover:bg-primary/20 transition-colors">
          <Play className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-display text-sm text-foreground truncate group-hover:text-primary group-hover:neon-text-primary transition-all">
            {song.title}
          </h3>
          <p className="text-xs text-muted-foreground truncate mt-1">
            {song.artist}
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Clock className="h-3 w-3" />
          <span>{song.duration}</span>
        </div>
      </div>
    </button>
  );
};

export default SongCard;
