import { useState, useCallback } from "react";
import { LibrarySong } from "./useLibrary";

export interface QueueEntry {
  id: string;
  singerName: string;
  song: LibrarySong;
  addedAt: number;
}

export function useQueue() {
  const [queue, setQueue] = useState<QueueEntry[]>([]);
  const [currentEntry, setCurrentEntry] = useState<QueueEntry | null>(null);
  const [history, setHistory] = useState<QueueEntry[]>([]);

  const addToQueue = useCallback((singerName: string, song: LibrarySong) => {
    const entry: QueueEntry = {
      id: `q-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      singerName: singerName.trim(),
      song,
      addedAt: Date.now(),
    };
    setQueue((prev) => {
      // Prevent same singer from being adjacent
      if (prev.length > 0 && prev[prev.length - 1].singerName.toLowerCase() === singerName.trim().toLowerCase()) {
        // Insert before the last entry instead
        const copy = [...prev];
        copy.splice(Math.max(0, copy.length - 1), 0, entry);
        return copy;
      }
      return [...prev, entry];
    });
  }, []);

  const playNext = useCallback(() => {
    if (currentEntry) {
      setHistory((prev) => [currentEntry, ...prev].slice(0, 50));
    }
    setQueue((prev) => {
      if (prev.length === 0) {
        setCurrentEntry(null);
        return prev;
      }
      const [next, ...rest] = prev;
      setCurrentEntry(next);
      return rest;
    });
  }, [currentEntry]);

  const removeFromQueue = useCallback((id: string) => {
    setQueue((prev) => prev.filter((e) => e.id !== id));
  }, []);

  const moveUp = useCallback((id: string) => {
    setQueue((prev) => {
      const idx = prev.findIndex((e) => e.id === id);
      if (idx <= 0) return prev;
      const copy = [...prev];
      [copy[idx - 1], copy[idx]] = [copy[idx], copy[idx - 1]];
      return copy;
    });
  }, []);

  const moveDown = useCallback((id: string) => {
    setQueue((prev) => {
      const idx = prev.findIndex((e) => e.id === id);
      if (idx < 0 || idx >= prev.length - 1) return prev;
      const copy = [...prev];
      [copy[idx], copy[idx + 1]] = [copy[idx + 1], copy[idx]];
      return copy;
    });
  }, []);

  const nextUp = queue.slice(0, 3);

  return {
    queue,
    currentEntry,
    history,
    nextUp,
    addToQueue,
    playNext,
    removeFromQueue,
    moveUp,
    moveDown,
    queueLength: queue.length,
  };
}
