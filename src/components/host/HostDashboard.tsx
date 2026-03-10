import { useState } from "react";
import { Library, Users, MonitorPlay, Mic2, Zap, BarChart3 } from "lucide-react";
import { useLibrary } from "@/stores/useLibrary";
import { useQueue } from "@/stores/useQueue";
import LibraryPanel from "./LibraryPanel";
import QueuePanel from "./QueuePanel";
import PlayerPanel from "./PlayerPanel";
import ThemeSelector from "./ThemeSelector";
import { cn } from "@/lib/utils";

type Tab = "library" | "queue" | "player";

const tabs: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: "library", label: "BIBLIOTECA", icon: Library },
  { id: "queue", label: "FILA", icon: Users },
  { id: "player", label: "PLAYER", icon: MonitorPlay },
];

const HostDashboard = () => {
  const [activeTab, setActiveTab] = useState<Tab>("library");
  const [eventMode, setEventMode] = useState(false);
  const library = useLibrary();
  const queue = useQueue();

  const handleAddToQueue = (song: typeof library.songs[0]) => {
    const name = prompt("NOME DO CANTOR:");
    if (!name?.trim()) return;
    queue.addToQueue(name, song);
    setActiveTab("queue");
  };

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      {/* Top Bar */}
      <header className="flex items-center gap-3 px-4 py-2 border-b border-border bg-card flex-shrink-0">
        <Mic2 className="h-5 w-5 text-primary animate-pulse-neon" />
        <h1
          className="font-display text-base text-primary neon-text-primary animate-flicker glitch-text"
          data-text="RUÍDO ROSA"
        >
          RUÍDO ROSA
        </h1>
        <span className="text-[9px] text-muted-foreground font-mono border border-border rounded px-1.5 py-0.5">
          KJ HOST
        </span>

        <div className="flex-1" />

        {/* Theme Selector */}
        <ThemeSelector />

        {/* Now Playing indicator */}
        {queue.currentEntry && (
          <div className="hidden md:flex items-center gap-2 text-xs font-mono">
            <Mic2 className="h-3 w-3 text-primary animate-pulse-neon" />
            <span className="text-primary">{queue.currentEntry.singerName}</span>
            <span className="text-muted-foreground">—</span>
            <span className="text-foreground truncate max-w-[200px]">{queue.currentEntry.song.title}</span>
          </div>
        )}

        {/* Stats */}
        <div className="hidden md:flex items-center gap-3 text-[10px] font-mono text-muted-foreground">
          <span className="flex items-center gap-1">
            <BarChart3 className="h-3 w-3" />
            {queue.singerCount} CANTORES
          </span>
          <span className="flex items-center gap-1">
            <Users className="h-3 w-3" />
            {queue.queueLength} NA FILA
          </span>
        </div>

        {/* Event Mode Toggle */}
        <button
          onClick={() => setEventMode(!eventMode)}
          className={cn(
            "flex items-center gap-1 px-2 py-1 rounded text-[10px] font-mono transition-all",
            eventMode
              ? "bg-primary/20 text-primary border border-primary neon-box-primary"
              : "text-muted-foreground border border-border hover:border-primary hover:text-primary"
          )}
        >
          <Zap className="h-3 w-3" />
          EVENTO
        </button>
      </header>

      {/* Main area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Desktop: 3 panels */}
        <div className="hidden lg:flex flex-1 overflow-hidden">
          <div className={cn("border-r border-border overflow-hidden flex-shrink-0", eventMode ? "w-[280px]" : "w-[340px]")}>
            <LibraryPanel
              songs={library.songs}
              filtered={library.filtered}
              search={library.search}
              setSearch={library.setSearch}
              total={library.total}
              genres={library.genres}
              languages={library.languages}
              genreFilter={library.genreFilter}
              setGenreFilter={library.setGenreFilter}
              languageFilter={library.languageFilter}
              setLanguageFilter={library.setLanguageFilter}
              activeFilter={library.activeFilter}
              setActiveFilter={library.setActiveFilter}
              onAddFiles={library.addFiles}
              onRemove={library.removeSong}
              onAddToQueue={handleAddToQueue}
              onToggleFavorite={library.toggleFavorite}
              onRemoveDuplicates={library.removeDuplicates}
              onClearBroken={library.clearBrokenSongs}
              onClearAllImported={library.clearAllImported}
              loading={library.loading}
            />
          </div>
          <div className={cn("border-r border-border overflow-hidden flex-shrink-0", eventMode ? "w-[260px]" : "w-[300px]")}>
            <QueuePanel
              queue={queue.queue}
              currentEntry={queue.currentEntry}
              nextUp={queue.nextUp}
              queueLength={queue.queueLength}
              singerCount={queue.singerCount}
              history={queue.history}
              songs={library.songs}
              onAdd={queue.addToQueue}
              onRemove={queue.removeFromQueue}
              onMoveUp={queue.moveUp}
              onMoveDown={queue.moveDown}
              onPlayNext={queue.playNext}
              onSkip={queue.skipCurrent}
            />
          </div>
          <div className="flex-1 overflow-hidden">
            <PlayerPanel
              currentEntry={queue.currentEntry}
              nextSingerName={queue.nextUp[0]?.singerName}
              onSkip={queue.playNext}
              eventMode={eventMode}
            />
          </div>
        </div>

        {/* Mobile: single panel */}
        <div className="flex flex-col flex-1 lg:hidden overflow-hidden">
          <div className="flex-1 overflow-hidden">
            {activeTab === "library" && (
              <LibraryPanel
                songs={library.songs}
                filtered={library.filtered}
                search={library.search}
                setSearch={library.setSearch}
                total={library.total}
                genres={library.genres}
                languages={library.languages}
                genreFilter={library.genreFilter}
                setGenreFilter={library.setGenreFilter}
                languageFilter={library.languageFilter}
                setLanguageFilter={library.setLanguageFilter}
                activeFilter={library.activeFilter}
                setActiveFilter={library.setActiveFilter}
                onAddFiles={library.addFiles}
                onRemove={library.removeSong}
                onAddToQueue={handleAddToQueue}
                onToggleFavorite={library.toggleFavorite}
                onRemoveDuplicates={library.removeDuplicates}
                onClearBroken={library.clearBrokenSongs}
                onClearAllImported={library.clearAllImported}
                loading={library.loading}
              />
            )}
            {activeTab === "queue" && (
              <QueuePanel
                queue={queue.queue}
                currentEntry={queue.currentEntry}
                nextUp={queue.nextUp}
                queueLength={queue.queueLength}
                singerCount={queue.singerCount}
                history={queue.history}
                songs={library.songs}
                onAdd={queue.addToQueue}
                onRemove={queue.removeFromQueue}
                onMoveUp={queue.moveUp}
                onMoveDown={queue.moveDown}
                onPlayNext={queue.playNext}
                onSkip={queue.skipCurrent}
              />
            )}
            {activeTab === "player" && (
              <PlayerPanel
                currentEntry={queue.currentEntry}
                nextSingerName={queue.nextUp[0]?.singerName}
                onSkip={queue.playNext}
                eventMode={eventMode}
              />
            )}
          </div>

          {/* Tab bar */}
          <nav className="flex border-t border-border bg-card flex-shrink-0">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex-1 flex flex-col items-center gap-1 py-3 text-[10px] font-mono transition-colors",
                  activeTab === tab.id
                    ? "text-primary neon-text-primary"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <tab.icon className="h-5 w-5" />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>
    </div>
  );
};

export default HostDashboard;
