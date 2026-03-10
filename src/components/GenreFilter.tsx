import { cn } from "@/lib/utils";

interface GenreFilterProps {
  genres: string[];
  selected: string | null;
  onSelect: (genre: string | null) => void;
}

const GenreFilter = ({ genres, selected, onSelect }: GenreFilterProps) => {
  return (
    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
      <button
        onClick={() => onSelect(null)}
        className={cn(
          "font-display text-xs px-4 py-2 border rounded whitespace-nowrap transition-all",
          selected === null
            ? "border-primary bg-primary/10 text-primary neon-box-primary"
            : "border-border text-muted-foreground hover:border-muted-foreground"
        )}
      >
        TODOS
      </button>
      {genres.map((genre) => (
        <button
          key={genre}
          onClick={() => onSelect(genre === selected ? null : genre)}
          className={cn(
            "font-display text-xs px-4 py-2 border rounded whitespace-nowrap transition-all",
            selected === genre
              ? "border-secondary bg-secondary/10 text-secondary neon-box-secondary"
              : "border-border text-muted-foreground hover:border-muted-foreground"
          )}
        >
          {genre.toUpperCase()}
        </button>
      ))}
    </div>
  );
};

export default GenreFilter;
