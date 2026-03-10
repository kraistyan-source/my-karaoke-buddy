import { useState, useCallback } from "react";
import { LibrarySong } from "./useLibrary";
import { addSingerHistory, markPlayed, DBSingerHistory } from "@/lib/db";

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
  const [singerCount, setSingerCount] = useState(0);

  const addToQueue = useCallback((singerName: string, song: LibrarySong) => {
    const entry: QueueEntry = {
      id: `q-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      singerName: singerName.trim(),
      song,
      addedAt: Date.now(),
    };
    setQueue((prev) => {
      // Prevent same singer from being adjacent (smart rotation)
      const name = singerName.trim().toLowerCase();
      if (prev.length > 0 && prev[prev.length - 1].singerName.toLowerCase() === name) {
        const copy = [...prev];
        copy.splice(Math.max(0, copy.length - 1), 0, entry);
        return copy;
      }
      return [...prev, entry];
    });
  }, []);

  const playNext = useCallback(() => {
    if (currentEntry) {
      setHistory((prev) => [currentEntry, ...prev].slice(0, 100));
      setSingerCount((c) => c + 1);
      // Persist to DB
      const histEntry: DBSingerHistory = {
        id: `h-${Date.now()}`,
        singerName: currentEntry.singerName,
        songId: currentEntry.song.id,
        songTitle: currentEntry.song.title,
        songArtist: currentEntry.song.artist,
        playedAt: Date.now(),
        eventDate: new Date().toISOString().slice(0, 10),
      };
      addSingerHistory(histEntry).catch(() => {});
      markPlayed(currentEntry.song.id).catch(() => {});
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

  const skipCurrent = useCallback(() => {
    if (currentEntry) {
      setHistory((prev) => [{ ...currentEntry }, ...prev].slice(0, 100));
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

  const nextUp = queue.slice(0, 5);

  return {
    queue,
    currentEntry,
    history,
    nextUp,
    singerCount,
    addToQueue,
    playNext,
    skipCurrent,
    removeFromQueue,
    moveUp,
    moveDown,
    queueLength: queue.length,
  };
}
