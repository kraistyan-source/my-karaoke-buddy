import { useState } from "react";
import { Library, Users, MonitorPlay, Mic2 } from "lucide-react";
import { useLibrary } from "@/stores/useLibrary";
import { useQueue } from "@/stores/useQueue";
import LibraryPanel from "./LibraryPanel";
import QueuePanel from "./QueuePanel";
import PlayerPanel from "./PlayerPanel";
import { cn } from "@/lib/utils";

type Tab = "library" | "queue" | "player";

const tabs: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: "library", label: "BIBLIOTECA", icon: Library },
  { id: "queue", label: "FILA", icon: Users },
  { id: "player", label: "PLAYER", icon: MonitorPlay },
];

const HostDashboard = () => {
  const [activeTab, setActiveTab] = useState<Tab>("library");
  const library = useLibrary();
  const queue = useQueue();

  const handleAddToQueue = (song: typeof library.songs[0]) => {
    // Quick add: prompt for name
    const name = prompt("NOME DO CANTOR:");
    if (!name?.trim()) return;
    queue.addToQueue(name, song);
    setActiveTab("queue");
  };

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      {/* Top Bar */}
      <header className="flex items-center gap-3 px-4 py-3 border-b border-border bg-card flex-shrink-0">
        <Mic2 className="h-6 w-6 text-primary animate-pulse-neon" />
        <h1
          className="font-display text-lg text-primary neon-text-primary animate-flicker glitch-text"
          data-text="RUÍDO ROSA"
        >
          RUÍDO ROSA
        </h1>
        <span className="text-[10px] text-muted-foreground font-mono border border-border rounded px-2 py-0.5">
          HOST MODE
        </span>

        <div className="flex-1" />

        {/* Now Playing indicator */}
        {queue.currentEntry && (
          <div className="flex items-center gap-2 text-xs font-mono">
            <span className="text-muted-foreground">🎤</span>
            <span className="text-primary neon-text-primary">{queue.currentEntry.singerName}</span>
            <span className="text-muted-foreground">—</span>
            <span className="text-foreground">{queue.currentEntry.song.title}</span>
          </div>
        )}

        {/* Queue count badge */}
        <div className="flex items-center gap-1 text-xs font-mono text-muted-foreground">
          <Users className="h-3.5 w-3.5" />
          <span>{queue.queueLength}</span>
        </div>
      </header>

      {/* Main area: desktop = side by side, mobile = tabs */}
      <div className="flex-1 flex overflow-hidden">
        {/* Desktop: 3 panels */}
        <div className="hidden lg:flex flex-1 overflow-hidden">
          <div className="w-[340px] border-r border-border overflow-hidden flex-shrink-0">
            <LibraryPanel
              songs={library.songs}
              filtered={library.filtered}
              search={library.search}
              setSearch={library.setSearch}
              total={library.total}
              onAddFiles={library.addFiles}
              onRemove={library.removeSong}
              onAddToQueue={handleAddToQueue}
            />
          </div>
          <div className="w-[300px] border-r border-border overflow-hidden flex-shrink-0">
            <QueuePanel
              queue={queue.queue}
              currentEntry={queue.currentEntry}
              nextUp={queue.nextUp}
              queueLength={queue.queueLength}
              songs={library.songs}
              onAdd={queue.addToQueue}
              onRemove={queue.removeFromQueue}
              onMoveUp={queue.moveUp}
              onMoveDown={queue.moveDown}
              onPlayNext={queue.playNext}
            />
          </div>
          <div className="flex-1 overflow-hidden">
            <PlayerPanel
              currentEntry={queue.currentEntry}
              nextSingerName={queue.nextUp[0]?.singerName}
              onSkip={queue.playNext}
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
                onAddFiles={library.addFiles}
                onRemove={library.removeSong}
                onAddToQueue={handleAddToQueue}
              />
            )}
            {activeTab === "queue" && (
              <QueuePanel
                queue={queue.queue}
                currentEntry={queue.currentEntry}
                nextUp={queue.nextUp}
                queueLength={queue.queueLength}
                songs={library.songs}
                onAdd={queue.addToQueue}
                onRemove={queue.removeFromQueue}
                onMoveUp={queue.moveUp}
                onMoveDown={queue.moveDown}
                onPlayNext={queue.playNext}
              />
            )}
            {activeTab === "player" && (
              <PlayerPanel currentEntry={queue.currentEntry} onSkip={queue.playNext} />
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
