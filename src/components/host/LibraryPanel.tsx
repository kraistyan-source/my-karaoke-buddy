import { useRef, useState, useCallback, useEffect } from "react";
import { Search, Upload, Music, Trash2, Plus, Star, Heart, Clock, TrendingUp, FolderOpen, Copy, Eraser, AlertTriangle, RefreshCw, FolderSync, X, ArrowDownAZ, Timer, CalendarPlus } from "lucide-react";
import { LibrarySong, LibraryFilter, LibrarySort } from "@/stores/useLibrary";
import { isElectron } from "@/lib/electronBridge";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

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
  sortBy: LibrarySort;
  setSortBy: (v: LibrarySort) => void;
  onAddFiles: (files: FileList) => void;
  onRemove: (id: string) => void;
  onAddToQueue: (song: LibrarySong) => void;
  onToggleFavorite: (id: string) => void;
  onRemoveDuplicates: () => Promise<number>;
  onClearBroken: () => Promise<number>;
  onClearAllImported: () => Promise<number>;
  loading: boolean;
  watchedFolder?: string | null;
  scanning?: boolean;
  onPickWatchedFolder?: () => void;
  onClearWatchedFolder?: () => void;
  onRescanWatchedFolder?: () => void;
}

const FILTERS: { id: LibraryFilter; label: string; icon: React.ElementType }[] = [
  { id: "all", label: "TODAS", icon: Music },
  { id: "favorites", label: "FAVORITAS", icon: Heart },
  { id: "recent", label: "RECENTES", icon: Clock },
  { id: "mostPlayed", label: "TOP", icon: TrendingUp },
];

const SORTS: { id: LibrarySort; label: string; icon: React.ElementType }[] = [
  { id: "alpha", label: "A-Z", icon: ArrowDownAZ },
  { id: "duration", label: "DURAÇÃO", icon: Timer },
  { id: "addedAt", label: "RECÉM ADICIONADO", icon: CalendarPlus },
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
  sortBy,
  setSortBy,
  onAddFiles,
  onRemove,
  onAddToQueue,
  onToggleFavorite,
  onRemoveDuplicates,
  onClearBroken,
  onClearAllImported,
  loading,
  watchedFolder,
  scanning,
  onPickWatchedFolder,
  onClearWatchedFolder,
  onRescanWatchedFolder,
}: LibraryPanelProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const folderRef = useRef<HTMLInputElement>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [showTools, setShowTools] = useState(false);
  const [confirmClearAll, setConfirmClearAll] = useState(false);

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

        {/* Sort */}
        <div className="flex gap-1 items-center">
          <span className="text-[9px] text-muted-foreground font-mono mr-1">ORDENAR:</span>
          {SORTS.map((s) => (
            <button
              key={s.id}
              onClick={() => setSortBy(s.id)}
              className={cn(
                "flex items-center gap-1 px-2 py-1 rounded text-[10px] font-mono transition-all",
                sortBy === s.id
                  ? "bg-secondary/20 text-secondary border border-secondary/50"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              )}
            >
              <s.icon className="h-3 w-3" />
              {s.label}
            </button>
          ))}
        </div>

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

        {/* Watched Folder (Electron only) */}
        {isElectron() && (
          <div className="space-y-1.5">
            {watchedFolder ? (
              <div className="flex items-center gap-1.5 p-2 border border-primary/30 rounded bg-primary/5">
                <FolderSync className="h-3.5 w-3.5 text-primary flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-mono text-primary truncate">
                    PASTA MONITORADA
                  </p>
                  <p className="text-[9px] text-muted-foreground truncate" title={watchedFolder}>
                    {watchedFolder}
                  </p>
                </div>
                <button
                  onClick={onRescanWatchedFolder}
                  disabled={scanning}
                  className="p-1 rounded hover:bg-primary/20 text-primary transition-colors disabled:opacity-50"
                  title="Re-escanear pasta"
                >
                  <RefreshCw className={cn("h-3.5 w-3.5", scanning && "animate-spin")} />
                </button>
                <button
                  onClick={onClearWatchedFolder}
                  className="p-1 rounded hover:bg-destructive/20 text-muted-foreground hover:text-destructive transition-colors"
                  title="Remover pasta monitorada"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ) : (
              <button
                onClick={onPickWatchedFolder}
                className="w-full flex items-center justify-center gap-1.5 py-2 border border-dashed border-primary/40 rounded hover:border-primary hover:neon-box-primary transition-all text-muted-foreground hover:text-primary font-mono text-[11px]"
              >
                <FolderSync className="h-3.5 w-3.5" />
                DEFINIR PASTA MONITORADA
              </button>
            )}
          </div>
        )}

        {/* Library Tools */}
        <button
          onClick={() => setShowTools(!showTools)}
          className="text-[10px] text-muted-foreground font-mono hover:text-foreground transition-colors"
        >
          {showTools ? "▾ ESCONDER FERRAMENTAS" : "▸ FERRAMENTAS DA BIBLIOTECA"}
        </button>

        {showTools && (
          <div className="flex flex-col gap-1.5">
            <button
              onClick={async () => {
                const count = await onRemoveDuplicates();
                toast(count > 0 ? `${count} música(s) duplicada(s) removida(s)` : "Nenhuma duplicata encontrada");
              }}
              className="flex items-center justify-center gap-1.5 py-1.5 border border-border rounded hover:border-primary hover:bg-primary/10 transition-all text-muted-foreground hover:text-primary font-mono text-[11px]"
            >
              <Copy className="h-3.5 w-3.5" />
              REMOVER DUPLICATAS
            </button>
            <button
              onClick={async () => {
                const count = await onClearBroken();
                toast(count > 0 ? `${count} música(s) quebrada(s) removida(s)` : "Nenhuma música quebrada encontrada");
              }}
              className="flex items-center justify-center gap-1.5 py-1.5 border border-border rounded hover:border-secondary hover:bg-secondary/10 transition-all text-muted-foreground hover:text-secondary font-mono text-[11px]"
            >
              <Eraser className="h-3.5 w-3.5" />
              LIMPAR MÚSICAS QUEBRADAS
            </button>
            <button
              onClick={() => setConfirmClearAll(true)}
              className="flex items-center justify-center gap-1.5 py-1.5 border border-destructive/50 rounded hover:border-destructive hover:bg-destructive/10 transition-all text-muted-foreground hover:text-destructive font-mono text-[11px]"
            >
              <AlertTriangle className="h-3.5 w-3.5" />
              LIMPAR TODA BIBLIOTECA IMPORTADA
            </button>
          </div>
        )}

        <Dialog open={confirmClearAll} onOpenChange={setConfirmClearAll}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="font-display text-destructive">LIMPAR BIBLIOTECA</DialogTitle>
              <DialogDescription>
                Isso vai remover TODAS as músicas importadas (arquivos MP4, MP3, MKV). As músicas demo serão mantidas. Esta ação não pode ser desfeita.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline" size="sm">CANCELAR</Button>
              </DialogClose>
              <Button
                variant="destructive"
                size="sm"
                onClick={async () => {
                  const count = await onClearAllImported();
                  toast(`${count} música(s) removida(s)`);
                  setConfirmClearAll(false);
                }}
              >
                CONFIRMAR LIMPEZA
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Results count */}
      <div className="px-3 py-1.5 border-b border-border bg-muted/30">
        <span className="text-[10px] text-muted-foreground font-mono">
          {filtered.length.toLocaleString()} RESULTADOS{!search && total > 500 && filtered.length >= 500 ? " (BUSQUE PARA VER MAIS)" : ""}
        </span>
      </div>

      {/* Song list - virtualized */}
      <VirtualSongList
        filtered={filtered}
        loading={loading}
        onToggleFavorite={onToggleFavorite}
        onAddToQueue={onAddToQueue}
        onRemove={onRemove}
      />
    </div>
  );
};

// Virtualized song list - only renders visible items
const ITEM_HEIGHT = 44;
const OVERSCAN = 10;

const VirtualSongList = ({
  filtered,
  loading,
  onToggleFavorite,
  onAddToQueue,
  onRemove,
}: {
  filtered: LibrarySong[];
  loading: boolean;
  onToggleFavorite: (id: string) => void;
  onAddToQueue: (song: LibrarySong) => void;
  onRemove: (id: string) => void;
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [containerHeight, setContainerHeight] = useState(600);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      setContainerHeight(entries[0].contentRect.height);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const handleScroll = useCallback(() => {
    if (scrollRef.current) setScrollTop(scrollRef.current.scrollTop);
  }, []);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="font-mono text-sm text-muted-foreground">CARREGANDO...</p>
      </div>
    );
  }

  if (filtered.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground">
        <Music className="h-12 w-12 mb-3 opacity-30" />
        <p className="font-mono text-sm">NENHUMA MÚSICA ENCONTRADA</p>
      </div>
    );
  }

  const totalHeight = filtered.length * ITEM_HEIGHT;
  const startIdx = Math.max(0, Math.floor(scrollTop / ITEM_HEIGHT) - OVERSCAN);
  const endIdx = Math.min(filtered.length, Math.ceil((scrollTop + containerHeight) / ITEM_HEIGHT) + OVERSCAN);

  return (
    <div ref={scrollRef} className="flex-1 overflow-y-auto" onScroll={handleScroll}>
      <div style={{ height: totalHeight, position: "relative" }}>
        {filtered.slice(startIdx, endIdx).map((song, i) => {
          const idx = startIdx + i;
          return (
            <div
              key={song.id}
              className="group flex items-center gap-2 px-3 hover:bg-muted/50 absolute left-0 right-0"
              style={{ top: idx * ITEM_HEIGHT, height: ITEM_HEIGHT }}
            >
              <button
                onClick={() => onToggleFavorite(song.id)}
                className={cn(
                  "flex-shrink-0 p-0.5",
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
                <span className="text-[10px] text-muted-foreground font-mono tabular-nums">
                  {song.durationSec > 0 ? song.duration : "--:--"}
                </span>
                {song.playCount > 0 && (
                  <span className="text-[9px] text-muted-foreground/60 font-mono">{song.playCount}×</span>
                )}
                <span className={cn(
                  "text-[9px] px-1 py-0.5 rounded font-mono uppercase",
                  song.fileType === "mp4" && "bg-primary/15 text-primary",
                  song.fileType === "mp3" && "bg-secondary/15 text-secondary",
                  song.fileType === "mkv" && "bg-accent/15 text-accent"
                )}>
                  {song.fileType}
                </span>
              </div>
              <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100">
                <button
                  onClick={() => onAddToQueue(song)}
                  className="p-1 rounded hover:bg-secondary/20 text-secondary"
                  title="Adicionar à fila"
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => onRemove(song.id)}
                  className="p-1 rounded hover:bg-destructive/20 text-destructive"
                  title="Remover"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default LibraryPanel;
