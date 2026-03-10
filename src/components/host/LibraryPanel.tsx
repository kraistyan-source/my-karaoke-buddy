import { useRef, useState } from "react";
import { Search, Upload, Music, Trash2, Plus, Star, Heart, Clock, TrendingUp, FolderOpen } from "lucide-react";
import { LibrarySong, LibraryFilter } from "@/stores/useLibrary";
import { cn } from "@/lib/utils";

interface LibraryPanelProps {
  songs: LibrarySong[];
  filtered: LibrarySong[];
  search: string;
  setSearch: (v: string) => void;
  total: number;
  genres: string[];
  languages: string[];
  genreFilter: string | null;
  setGenreFilter: (v: string | null) => void;
  languageFilter: string | null;
  setLanguageFilter: (v: string | null) => void;
  activeFilter: LibraryFilter;
  setActiveFilter: (v: LibraryFilter) => void;
  onAddFiles: (files: FileList) => void;
  onRemove: (id: string) => void;
  onAddToQueue: (song: LibrarySong) => void;
  onToggleFavorite: (id: string) => void;
  loading: boolean;
}

const FILTERS: { id: LibraryFilter; label: string; icon: React.ElementType }[] = [
  { id: "all", label: "TODAS", icon: Music },
  { id: "favorites", label: "FAVORITAS", icon: Heart },
  { id: "recent", label: "RECENTES", icon: Clock },
  { id: "mostPlayed", label: "TOP", icon: TrendingUp },
];

const LibraryPanel = ({
  filtered,
  search,
  setSearch,
  total,
  genres,
  languages,
  genreFilter,
  setGenreFilter,
  languageFilter,
  setLanguageFilter,
  activeFilter,
  setActiveFilter,
  onAddFiles,
  onRemove,
  onAddToQueue,
  onToggleFavorite,
  loading,
}: LibraryPanelProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const folderRef = useRef<HTMLInputElement>(null);
  const [showFilters, setShowFilters] = useState(false);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-3 border-b border-border space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-base text-primary neon-text-primary">BIBLIOTECA</h2>
          <span className="text-[10px] text-muted-foreground font-mono bg-muted px-2 py-0.5 rounded">
            {loading ? "..." : `${total.toLocaleString()} MÚSICAS`}
          </span>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="BUSCAR MÚSICA OU ARTISTA..."
            className="w-full bg-muted border border-border rounded pl-10 pr-4 py-2 font-mono text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:neon-box-primary transition-all"
          />
        </div>

        {/* Quick Filters */}
        <div className="flex gap-1">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              onClick={() => setActiveFilter(f.id)}
              className={cn(
                "flex items-center gap-1 px-2 py-1 rounded text-[10px] font-mono transition-all",
                activeFilter === f.id
                  ? "bg-primary/20 text-primary border border-primary/50"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              )}
            >
              <f.icon className="h-3 w-3" />
              {f.label}
            </button>
          ))}
        </div>

        {/* Genre / Language filters */}
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="text-[10px] text-muted-foreground font-mono hover:text-foreground transition-colors"
        >
          {showFilters ? "▾ ESCONDER FILTROS" : "▸ FILTROS AVANÇADOS"}
        </button>

        {showFilters && (
          <div className="space-y-1.5">
            <div className="flex gap-1 flex-wrap">
              <button
                onClick={() => setGenreFilter(null)}
                className={cn(
                  "px-2 py-0.5 rounded text-[10px] font-mono",
                  !genreFilter ? "bg-secondary/20 text-secondary" : "text-muted-foreground hover:text-foreground"
                )}
              >
                TODOS
              </button>
              {genres.map((g) => (
                <button
                  key={g}
                  onClick={() => setGenreFilter(genreFilter === g ? null : g)}
                  className={cn(
                    "px-2 py-0.5 rounded text-[10px] font-mono",
                    genreFilter === g ? "bg-secondary/20 text-secondary" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {g}
                </button>
              ))}
            </div>
            {languages.length > 1 && (
              <div className="flex gap-1 flex-wrap">
                <button
                  onClick={() => setLanguageFilter(null)}
                  className={cn(
                    "px-2 py-0.5 rounded text-[10px] font-mono",
                    !languageFilter ? "bg-primary/20 text-primary" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  TODOS
                </button>
                {languages.map((l) => (
                  <button
                    key={l}
                    onClick={() => setLanguageFilter(languageFilter === l ? null : l)}
                    className={cn(
                      "px-2 py-0.5 rounded text-[10px] font-mono",
                      languageFilter === l ? "bg-primary/20 text-primary" : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {l}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Import buttons */}
        <div className="flex gap-2">
          <button
            onClick={() => inputRef.current?.click()}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 border border-dashed border-border rounded hover:border-secondary hover:neon-box-secondary transition-all text-muted-foreground hover:text-secondary font-mono text-[11px]"
          >
            <Upload className="h-3.5 w-3.5" />
            IMPORTAR ARQUIVOS
          </button>
          <button
            onClick={() => folderRef.current?.click()}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 border border-dashed border-border rounded hover:border-primary hover:neon-box-primary transition-all text-muted-foreground hover:text-primary font-mono text-[11px]"
          >
            <FolderOpen className="h-3.5 w-3.5" />
            IMPORTAR PASTA
          </button>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept=".mp4,.mp3,.mkv"
          multiple
          onChange={(e) => e.target.files && onAddFiles(e.target.files)}
          className="hidden"
        />
        {/* @ts-ignore - webkitdirectory is valid but not typed */}
        <input
          ref={folderRef}
          type="file"
          accept=".mp4,.mp3,.mkv"
          multiple
          {...{ webkitdirectory: "", directory: "" } as any}
          onChange={(e) => e.target.files && onAddFiles(e.target.files)}
          className="hidden"
        />
      </div>

      {/* Results count */}
      <div className="px-3 py-1.5 border-b border-border bg-muted/30">
        <span className="text-[10px] text-muted-foreground font-mono">
          {filtered.length.toLocaleString()} RESULTADOS
        </span>
      </div>

      {/* Song list */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <p className="font-mono text-sm text-muted-foreground animate-pulse">CARREGANDO...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
            <Music className="h-12 w-12 mb-3 opacity-30" />
            <p className="font-mono text-sm">NENHUMA MÚSICA ENCONTRADA</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {filtered.map((song) => (
              <div
                key={song.id}
                className="group flex items-center gap-2 px-3 py-2 hover:bg-muted/50 transition-colors"
              >
                {/* Favorite star */}
                <button
                  onClick={() => onToggleFavorite(song.id)}
                  className={cn(
                    "flex-shrink-0 p-0.5 transition-colors",
                    song.isFavorite ? "text-star" : "text-muted-foreground/30 hover:text-star/60"
                  )}
                >
                  <Star className={cn("h-3.5 w-3.5", song.isFavorite && "fill-current")} />
                </button>

                <div className="flex-1 min-w-0 cursor-pointer" onClick={() => onAddToQueue(song)}>
                  <p className="text-sm text-foreground truncate font-mono leading-tight">{song.title}</p>
                  <p className="text-[11px] text-muted-foreground truncate">{song.artist}</p>
                </div>

                <div className="flex items-center gap-1.5">
                  {song.playCount > 0 && (
                    <span className="text-[9px] text-muted-foreground/60 font-mono">{song.playCount}×</span>
                  )}
                  <span className={cn(
                    "text-[9px] px-1 py-0.5 rounded font-mono uppercase",
                    song.fileType === "mp4" && "bg-primary/15 text-primary",
                    song.fileType === "mp3" && "bg-secondary/15 text-secondary",
                    song.fileType === "mkv" && "bg-accent/15 text-accent",
                    song.fileType === "builtin" && "bg-muted text-muted-foreground"
                  )}>
                    {song.fileType === "builtin" ? "DEMO" : song.fileType}
                  </span>
                </div>

                <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => onAddToQueue(song)}
                    className="p-1 rounded hover:bg-secondary/20 text-secondary transition-colors"
                    title="Adicionar à fila"
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                  {song.fileType !== "builtin" && (
                    <button
                      onClick={() => onRemove(song.id)}
                      className="p-1 rounded hover:bg-destructive/20 text-destructive transition-colors"
                      title="Remover"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default LibraryPanel;
