import { useRef } from "react";
import { Search, Upload, Music, Trash2, Plus } from "lucide-react";
import { LibrarySong } from "@/stores/useLibrary";
import { cn } from "@/lib/utils";

interface LibraryPanelProps {
  songs: LibrarySong[];
  filtered: LibrarySong[];
  search: string;
  setSearch: (v: string) => void;
  total: number;
  onAddFiles: (files: FileList) => void;
  onRemove: (id: string) => void;
  onAddToQueue: (song: LibrarySong) => void;
}

const LibraryPanel = ({
  filtered,
  search,
  setSearch,
  total,
  onAddFiles,
  onRemove,
  onAddToQueue,
}: LibraryPanelProps) => {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-border space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg text-primary neon-text-primary">BIBLIOTECA</h2>
          <span className="text-xs text-muted-foreground font-mono">
            {total} MÚSICAS
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
            className="w-full bg-muted border border-border rounded pl-10 pr-4 py-2.5 font-mono text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:neon-box-primary transition-all"
          />
        </div>

        {/* Import */}
        <button
          onClick={() => inputRef.current?.click()}
          className="w-full flex items-center justify-center gap-2 py-2.5 border-2 border-dashed border-border rounded hover:border-secondary hover:neon-box-secondary transition-all text-muted-foreground hover:text-secondary font-mono text-sm"
        >
          <Upload className="h-4 w-4" />
          IMPORTAR MP4 / MP3
        </button>
        <input
          ref={inputRef}
          type="file"
          accept=".mp4,.mp3"
          multiple
          onChange={(e) => e.target.files && onAddFiles(e.target.files)}
          className="hidden"
        />
      </div>

      {/* Song list */}
      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
            <Music className="h-12 w-12 mb-3 opacity-30" />
            <p className="font-mono text-sm">NENHUMA MÚSICA ENCONTRADA</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {filtered.map((song) => (
              <div
                key={song.id}
                className="group flex items-center gap-3 px-4 py-3 hover:bg-muted/50 transition-colors"
              >
                <div className="flex-shrink-0 w-9 h-9 rounded bg-muted flex items-center justify-center">
                  <Music className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground truncate font-mono">{song.title}</p>
                  <p className="text-xs text-muted-foreground truncate">{song.artist}</p>
                </div>
                <span className={cn(
                  "text-[10px] px-1.5 py-0.5 rounded font-mono uppercase",
                  song.fileType === "mp4" && "bg-primary/20 text-primary",
                  song.fileType === "mp3" && "bg-secondary/20 text-secondary",
                  song.fileType === "builtin" && "bg-muted text-muted-foreground"
                )}>
                  {song.fileType === "builtin" ? "DEMO" : song.fileType}
                </span>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => onAddToQueue(song)}
                    className="p-1.5 rounded hover:bg-secondary/20 text-secondary transition-colors"
                    title="Adicionar à fila"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                  {song.fileType !== "builtin" && (
                    <button
                      onClick={() => onRemove(song.id)}
                      className="p-1.5 rounded hover:bg-destructive/20 text-destructive transition-colors"
                      title="Remover"
                    >
                      <Trash2 className="h-4 w-4" />
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
