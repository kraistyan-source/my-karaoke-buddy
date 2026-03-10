import { useState } from "react";
import { Users, ChevronUp, ChevronDown, X, Mic2, UserPlus, History, Clock } from "lucide-react";
import { QueueEntry } from "@/stores/useQueue";
import { LibrarySong } from "@/stores/useLibrary";
import { cn } from "@/lib/utils";

interface QueuePanelProps {
  queue: QueueEntry[];
  currentEntry: QueueEntry | null;
  nextUp: QueueEntry[];
  queueLength: number;
  singerCount: number;
  history: QueueEntry[];
  songs: LibrarySong[];
  onAdd: (singerName: string, song: LibrarySong) => void;
  onRemove: (id: string) => void;
  onMoveUp: (id: string) => void;
  onMoveDown: (id: string) => void;
  onPlayNext: () => void;
  onSkip: () => void;
}

const QueuePanel = ({
  queue,
  currentEntry,
  nextUp,
  queueLength,
  singerCount,
  history,
  songs,
  onAdd,
  onRemove,
  onMoveUp,
  onMoveDown,
  onPlayNext,
  onSkip,
}: QueuePanelProps) => {
  const [singerName, setSingerName] = useState("");
  const [songSearch, setSongSearch] = useState("");
  const [selectedSong, setSelectedSong] = useState<LibrarySong | null>(null);
  const [showSongPicker, setShowSongPicker] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  const songResults = songSearch.length > 0
    ? songs.filter(
        (s) =>
          s.titleLower?.includes(songSearch.toLowerCase()) ||
          s.artistLower?.includes(songSearch.toLowerCase()) ||
          s.title.toLowerCase().includes(songSearch.toLowerCase()) ||
          s.artist.toLowerCase().includes(songSearch.toLowerCase())
      ).slice(0, 10)
    : [];

  const handleSubmit = () => {
    if (!singerName.trim() || !selectedSong) return;
    onAdd(singerName, selectedSong);
    setSingerName("");
    setSelectedSong(null);
    setSongSearch("");
    setShowSongPicker(false);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Now Playing */}
      <div className="p-3 border-b border-border bg-primary/5">
        <div className="flex items-center justify-between mb-1.5">
          <p className="text-[10px] text-primary font-mono uppercase tracking-widest">CANTANDO AGORA</p>
          <span className="text-[10px] text-muted-foreground font-mono">#{singerCount}</span>
        </div>
        {currentEntry ? (
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center neon-box-primary flex-shrink-0">
              <Mic2 className="h-5 w-5 text-primary animate-pulse-neon" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-display text-sm text-primary neon-text-primary truncate">{currentEntry.singerName}</p>
              <p className="text-[11px] text-muted-foreground truncate">{currentEntry.song.title} — {currentEntry.song.artist}</p>
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground font-mono">NINGUÉM NO PALCO</p>
        )}
      </div>

      {/* Next Up (5 singers) */}
      {nextUp.length > 0 && (
        <div className="p-3 border-b border-border">
          <p className="text-[10px] text-secondary font-mono uppercase tracking-widest mb-1.5">PRÓXIMOS</p>
          <div className="space-y-1">
            {nextUp.map((entry, i) => (
              <div key={entry.id} className="flex items-center gap-2 text-sm">
                <span className="w-5 h-5 rounded-full bg-secondary/20 text-secondary flex items-center justify-center text-[10px] font-mono flex-shrink-0">
                  {i + 1}
                </span>
                <span className="text-foreground font-mono truncate text-xs">{entry.singerName}</span>
                <span className="text-muted-foreground text-[11px] truncate flex-1">— {entry.song.title}</span>
                <button onClick={() => onRemove(entry.id)} className="p-0.5 text-muted-foreground/40 hover:text-destructive opacity-0 group-hover:opacity-100">
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add Singer */}
      <div className="p-3 border-b border-border space-y-1.5">
        <p className="text-[10px] text-muted-foreground font-mono uppercase tracking-widest">ADICIONAR CANTOR</p>
        <input
          value={singerName}
          onChange={(e) => setSingerName(e.target.value)}
          placeholder="NOME..."
          className="w-full bg-muted border border-border rounded px-3 py-2 font-mono text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-secondary transition-all"
        />
        <div className="relative">
          <input
            value={selectedSong ? `${selectedSong.title} — ${selectedSong.artist}` : songSearch}
            onChange={(e) => {
              setSongSearch(e.target.value);
              setSelectedSong(null);
              setShowSongPicker(true);
            }}
            onFocus={() => songSearch && setShowSongPicker(true)}
            placeholder="BUSCAR MÚSICA..."
            className="w-full bg-muted border border-border rounded px-3 py-2 font-mono text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-secondary transition-all"
          />
          {showSongPicker && songResults.length > 0 && (
            <div className="absolute z-20 top-full left-0 right-0 mt-1 bg-card border border-border rounded max-h-48 overflow-y-auto">
              {songResults.map((s) => (
                <button
                  key={s.id}
                  onClick={() => {
                    setSelectedSong(s);
                    setSongSearch("");
                    setShowSongPicker(false);
                  }}
                  className="w-full text-left px-3 py-1.5 hover:bg-muted/80 transition-colors"
                >
                  <p className="text-sm text-foreground font-mono truncate">{s.title}</p>
                  <p className="text-[11px] text-muted-foreground truncate">{s.artist}</p>
                </button>
              ))}
            </div>
          )}
        </div>
        <button
          onClick={handleSubmit}
          disabled={!singerName.trim() || !selectedSong}
          className={cn(
            "w-full flex items-center justify-center gap-2 py-2 rounded font-mono text-sm transition-all",
            singerName.trim() && selectedSong
              ? "bg-secondary/20 text-secondary border border-secondary hover:bg-secondary/30 neon-box-secondary"
              : "bg-muted text-muted-foreground border border-border cursor-not-allowed"
          )}
        >
          <UserPlus className="h-4 w-4" />
          ADICIONAR
        </button>
      </div>

      {/* Full Queue */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-3">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[10px] text-muted-foreground font-mono uppercase tracking-widest">FILA</p>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-muted-foreground font-mono">{queueLength}</span>
              <button
                onClick={() => setShowHistory(!showHistory)}
                className={cn(
                  "p-1 rounded transition-colors",
                  showHistory ? "text-primary" : "text-muted-foreground hover:text-foreground"
                )}
                title="Histórico"
              >
                <History className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {showHistory ? (
            <div className="space-y-1">
              <p className="text-[10px] text-primary font-mono mb-2">HISTÓRICO DO EVENTO</p>
              {history.length === 0 ? (
                <p className="text-xs text-muted-foreground font-mono text-center py-4">NENHUM HISTÓRICO</p>
              ) : (
                history.map((entry) => (
                  <div key={entry.id} className="flex items-center gap-2 px-2 py-1.5 rounded bg-muted/20 text-xs">
                    <Clock className="h-3 w-3 text-muted-foreground/40 flex-shrink-0" />
                    <span className="text-muted-foreground font-mono truncate">{entry.singerName}</span>
                    <span className="text-muted-foreground/60 truncate">— {entry.song.title}</span>
                  </div>
                ))
              )}
            </div>
          ) : queue.length === 0 ? (
            <div className="text-center py-6">
              <Users className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
              <p className="text-xs text-muted-foreground font-mono">FILA VAZIA</p>
            </div>
          ) : (
            <div className="space-y-1">
              {queue.map((entry, i) => (
                <div
                  key={entry.id}
                  className="group flex items-center gap-1.5 px-2 py-1.5 rounded bg-muted/30 hover:bg-muted/60 transition-colors"
                >
                  <span className="text-[10px] text-muted-foreground font-mono w-4">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <span className="text-xs text-foreground font-mono truncate block">{entry.singerName}</span>
                    <span className="text-[11px] text-muted-foreground truncate block">{entry.song.title}</span>
                  </div>
                  <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => onMoveUp(entry.id)} className="p-0.5 text-muted-foreground hover:text-foreground">
                      <ChevronUp className="h-3.5 w-3.5" />
                    </button>
                    <button onClick={() => onMoveDown(entry.id)} className="p-0.5 text-muted-foreground hover:text-foreground">
                      <ChevronDown className="h-3.5 w-3.5" />
                    </button>
                    <button onClick={() => onRemove(entry.id)} className="p-0.5 text-muted-foreground hover:text-destructive">
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="p-3 border-t border-border space-y-2">
        <button
          onClick={onPlayNext}
          disabled={queue.length === 0 && !currentEntry}
          className={cn(
            "w-full py-3 rounded font-display text-sm tracking-wider transition-all",
            queue.length > 0
              ? "bg-primary/20 text-primary border border-primary hover:bg-primary/30 neon-box-primary"
              : "bg-muted text-muted-foreground border border-border cursor-not-allowed"
          )}
        >
          ▶ PRÓXIMO CANTOR
        </button>
        {currentEntry && (
          <button
            onClick={onSkip}
            className="w-full py-2 rounded font-mono text-xs text-muted-foreground border border-border hover:border-destructive hover:text-destructive transition-all"
          >
            ⏭ PULAR CANTOR ATUAL
          </button>
        )}
      </div>
    </div>
  );
};

export default QueuePanel;
