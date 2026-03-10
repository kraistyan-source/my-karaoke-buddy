import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import {
  DBSong,
  getAllSongs,
  addSong,
  removeSong as dbRemoveSong,
  toggleFavorite as dbToggleFavorite,
  seedDemoSongs,
} from "@/lib/db";

export type LibrarySong = DBSong & { fileUrl?: string };

export type LibraryFilter = "all" | "favorites" | "recent" | "mostPlayed";

export function useLibrary() {
  const [songs, setSongs] = useState<LibrarySong[]>([]);
  const [search, setSearch] = useState("");
  const [genreFilter, setGenreFilter] = useState<string | null>(null);
  const [languageFilter, setLanguageFilter] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<LibraryFilter>("all");
  const [loading, setLoading] = useState(true);
  const fileUrlMap = useRef<Map<string, string>>(new Map());

  // Load songs from IndexedDB
  useEffect(() => {
    (async () => {
      await seedDemoSongs();
      const all = await getAllSongs();
      // Restore any session file URLs
      const withUrls = all.map((s) => ({
        ...s,
        fileUrl: fileUrlMap.current.get(s.id),
      }));
      setSongs(withUrls);
      setLoading(false);
    })();
  }, []);

  // Derived: genres & languages
  const genres = useMemo(() => [...new Set(songs.map((s) => s.genre).filter(Boolean))].sort(), [songs]);
  const languages = useMemo(() => [...new Set(songs.map((s) => s.language).filter(Boolean))].sort(), [songs]);

  // Search + filter
  const filtered = useMemo(() => {
    let result = songs;

    // Text search
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (s) => s.titleLower.includes(q) || s.artistLower.includes(q)
      );
    }

    // Genre
    if (genreFilter) result = result.filter((s) => s.genre === genreFilter);
    // Language
    if (languageFilter) result = result.filter((s) => s.language === languageFilter);

    // Special filters
    switch (activeFilter) {
      case "favorites":
        result = result.filter((s) => s.isFavorite);
        break;
      case "recent":
        result = [...result].filter((s) => s.lastPlayed).sort((a, b) => (b.lastPlayed || 0) - (a.lastPlayed || 0));
        break;
      case "mostPlayed":
        result = [...result].filter((s) => s.playCount > 0).sort((a, b) => b.playCount - a.playCount);
        break;
      default:
        result = [...result].sort((a, b) => a.titleLower.localeCompare(b.titleLower));
    }

    return result;
  }, [songs, search, genreFilter, languageFilter, activeFilter]);

  const addFiles = useCallback(async (files: FileList) => {
    const newSongs: LibrarySong[] = [];
    for (const file of Array.from(files)) {
      const ext = file.name.split(".").pop()?.toLowerCase();
      if (!ext || !["mp4", "mp3", "mkv"].includes(ext)) continue;

      const nameParts = file.name.replace(/\.[^.]+$/, "").split(" - ");
      const artist = nameParts.length > 1 ? nameParts[0].trim() : "Artista Desconhecido";
      const title = nameParts.length > 1 ? nameParts.slice(1).join(" - ").trim() : nameParts[0].trim();

      const url = URL.createObjectURL(file);
      const id = `import-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      fileUrlMap.current.set(id, url);

      const song: LibrarySong = {
        id,
        title,
        titleLower: title.toLowerCase(),
        artist,
        artistLower: artist.toLowerCase(),
        duration: "--:--",
        genre: "Importado",
        language: "",
        fileType: ext as "mp4" | "mp3" | "mkv",
        fileName: file.name,
        isFavorite: false,
        playCount: 0,
        addedAt: Date.now(),
        fileUrl: url,
      };

      await addSong(song);
      newSongs.push(song);
    }
    setSongs((prev) => [...prev, ...newSongs]);
  }, []);

  const removeSongById = useCallback(async (id: string) => {
    const url = fileUrlMap.current.get(id);
    if (url) {
      URL.revokeObjectURL(url);
      fileUrlMap.current.delete(id);
    }
    await dbRemoveSong(id);
    setSongs((prev) => prev.filter((s) => s.id !== id));
  }, []);

  const toggleFav = useCallback(async (id: string) => {
    const newVal = await dbToggleFavorite(id);
    setSongs((prev) => prev.map((s) => (s.id === id ? { ...s, isFavorite: newVal } : s)));
  }, []);

  // Find and remove duplicate songs (same title+artist, keep the one with highest playCount)
  const removeDuplicates = useCallback(async () => {
    const grouped = new Map<string, LibrarySong[]>();
    for (const s of songs) {
      const key = `${s.titleLower}|||${s.artistLower}`;
      const arr = grouped.get(key) || [];
      arr.push(s);
      grouped.set(key, arr);
    }
    const toRemove: string[] = [];
    for (const [, group] of grouped) {
      if (group.length <= 1) continue;
      // Keep the one with highest playCount, then earliest addedAt
      group.sort((a, b) => b.playCount - a.playCount || a.addedAt - b.addedAt);
      for (let i = 1; i < group.length; i++) {
        toRemove.push(group[i].id);
      }
    }
    if (toRemove.length === 0) return 0;
    for (const id of toRemove) {
      const url = fileUrlMap.current.get(id);
      if (url) { URL.revokeObjectURL(url); fileUrlMap.current.delete(id); }
      await dbRemoveSong(id);
    }
    setSongs((prev) => prev.filter((s) => !toRemove.includes(s.id)));
    return toRemove.length;
  }, [songs]);

  // Clear all imported (non-builtin) songs whose blob URLs are dead
  const clearBrokenSongs = useCallback(async () => {
    const broken = songs.filter(
      (s) => s.fileType !== "builtin" && !fileUrlMap.current.has(s.id)
    );
    if (broken.length === 0) return 0;
    for (const s of broken) {
      await dbRemoveSong(s.id);
    }
    setSongs((prev) => prev.filter((s) => !broken.find((b) => b.id === s.id)));
    return broken.length;
  }, [songs]);

  // Clear ALL imported songs
  const clearAllImported = useCallback(async () => {
    const imported = songs.filter((s) => s.fileType !== "builtin");
    if (imported.length === 0) return 0;
    for (const s of imported) {
      const url = fileUrlMap.current.get(s.id);
      if (url) { URL.revokeObjectURL(url); fileUrlMap.current.delete(s.id); }
      await dbRemoveSong(s.id);
    }
    setSongs((prev) => prev.filter((s) => s.fileType === "builtin"));
    return imported.length;
  }, [songs]);

  return {
    songs,
    filtered,
    search,
    setSearch,
    genreFilter,
    setGenreFilter,
    languageFilter,
    setLanguageFilter,
    activeFilter,
    setActiveFilter,
    genres,
    languages,
    addFiles,
    removeSong: removeSongById,
    toggleFavorite: toggleFav,
    removeDuplicates,
    clearBrokenSongs,
    clearAllImported,
    total: songs.length,
    loading,
  };
}
