import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import {
  DBSong,
  getAllSongs,
  addSong,
  addSongsBatch,
  removeSong as dbRemoveSong,
  toggleFavorite as dbToggleFavorite,
  seedDemoSongs,
} from "@/lib/db";
import {
  isElectron,
  scanMediaFiles,
  getWatchedFolder,
  setWatchedFolder as saveWatchedFolder,
  openDirectory,
  localFileUrl,
  ScannedFile,
} from "@/lib/electronBridge";
import { toast } from "sonner";

export type LibrarySong = DBSong & { fileUrl?: string };

export type LibraryFilter = "all" | "favorites" | "recent" | "mostPlayed";

// Parse artist/title from filename like "Artist - Title.mp4"
function parseFileName(name: string): { artist: string; title: string } {
  const base = name.replace(/\.[^.]+$/, "");
  const parts = base.split(" - ");
  if (parts.length > 1) {
    return { artist: parts[0].trim(), title: parts.slice(1).join(" - ").trim() };
  }
  return { artist: "Artista Desconhecido", title: base.trim() };
}

// Build a DBSong from a scanned local file
function scannedFileToDB(file: ScannedFile): DBSong {
  const { artist, title } = parseFileName(file.name);
  return {
    id: `local-${file.path}`,
    title,
    titleLower: title.toLowerCase(),
    artist,
    artistLower: artist.toLowerCase(),
    duration: "--:--",
    genre: "Importado",
    language: "",
    fileType: (["mp4", "mp3", "mkv"].includes(file.ext) ? file.ext : "mp4") as DBSong["fileType"],
    fileName: file.name,
    filePath: file.path,
    isFavorite: false,
    playCount: 0,
    addedAt: Date.now(),
  };
}

export function useLibrary() {
  const [songs, setSongs] = useState<LibrarySong[]>([]);
  const [search, setSearch] = useState("");
  const [genreFilter, setGenreFilter] = useState<string | null>(null);
  const [languageFilter, setLanguageFilter] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<LibraryFilter>("all");
  const [loading, setLoading] = useState(true);
  const [watchedFolder, setWatchedFolderState] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const fileUrlMap = useRef<Map<string, string>>(new Map());

  // Scan a folder and merge new songs into DB + state
  const scanFolder = useCallback(async (folderPath: string) => {
    setScanning(true);
    try {
      const files = await scanMediaFiles(folderPath);
      if (files.length === 0) {
        setScanning(false);
        return 0;
      }

      // Get existing song IDs to avoid duplicates
      const existing = await getAllSongs();
      const existingIds = new Set(existing.map((s) => s.id));

      const newSongs: DBSong[] = [];
      for (const file of files) {
        const dbSong = scannedFileToDB(file);
        if (!existingIds.has(dbSong.id)) {
          newSongs.push(dbSong);
        }
      }

      if (newSongs.length > 0) {
        await addSongsBatch(newSongs);
      }

      // Reload all songs from DB
      const all = await getAllSongs();
      const withUrls = all.map((s) => ({
        ...s,
        fileUrl: s.filePath ? localFileUrl(s.filePath) : fileUrlMap.current.get(s.id),
      }));
      setSongs(withUrls);
      setScanning(false);
      return newSongs.length;
    } catch (err) {
      console.error("Scan folder error:", err);
      setScanning(false);
      return 0;
    }
  }, []);

  // Load songs from IndexedDB + auto-scan watched folder
  useEffect(() => {
    (async () => {
      await seedDemoSongs();
      const all = await getAllSongs();
      const withUrls = all.map((s) => ({
        ...s,
        fileUrl: s.filePath ? localFileUrl(s.filePath) : fileUrlMap.current.get(s.id),
      }));
      setSongs(withUrls);
      setLoading(false);

      // Auto-scan watched folder on startup (Electron only)
      if (isElectron()) {
        const folder = getWatchedFolder();
        if (folder) {
          setWatchedFolderState(folder);
          const count = await scanFolder(folder);
          if (count > 0) {
            toast.success(`${count} nova(s) música(s) encontrada(s) na pasta monitorada`);
          }
        }
      }
    })();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Pick and set watched folder
  const pickWatchedFolder = useCallback(async () => {
    const folder = await openDirectory();
    if (!folder) return;
    saveWatchedFolder(folder);
    setWatchedFolderState(folder);
    const count = await scanFolder(folder);
    toast.success(
      count > 0
        ? `Pasta monitorada definida! ${count} música(s) importada(s).`
        : "Pasta monitorada definida! Nenhuma música nova encontrada."
    );
  }, [scanFolder]);

  // Remove watched folder
  const clearWatchedFolder = useCallback(() => {
    saveWatchedFolder(null);
    setWatchedFolderState(null);
    toast("Pasta monitorada removida");
  }, []);

  // Re-scan watched folder manually
  const rescanWatchedFolder = useCallback(async () => {
    const folder = watchedFolder || getWatchedFolder();
    if (!folder) return;
    const count = await scanFolder(folder);
    toast.success(
      count > 0
        ? `${count} nova(s) música(s) encontrada(s)`
        : "Nenhuma música nova encontrada"
    );
  }, [watchedFolder, scanFolder]);

  // Derived: genres & languages
  const genres = useMemo(() => [...new Set(songs.map((s) => s.genre).filter(Boolean))].sort(), [songs]);
  const languages = useMemo(() => [...new Set(songs.map((s) => s.language).filter(Boolean))].sort(), [songs]);

  // Search + filter
  const filtered = useMemo(() => {
    let result = songs;

    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (s) => s.titleLower.includes(q) || s.artistLower.includes(q)
      );
    }

    if (genreFilter) result = result.filter((s) => s.genre === genreFilter);
    if (languageFilter) result = result.filter((s) => s.language === languageFilter);

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

    // Cap displayed results at 500 for performance; user can narrow with search
    if (result.length > 500 && !search) {
      result = result.slice(0, 500);
    }

    return result;
  }, [songs, search, genreFilter, languageFilter, activeFilter]);

  const addFiles = useCallback(async (files: FileList) => {
    const newSongs: LibrarySong[] = [];
    for (const file of Array.from(files)) {
      const ext = file.name.split(".").pop()?.toLowerCase();
      if (!ext || !["mp4", "mp3", "mkv"].includes(ext)) continue;

      const { artist, title } = parseFileName(file.name);
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

  const clearBrokenSongs = useCallback(async () => {
    const broken = songs.filter(
      (s) => s.fileType !== "builtin" && !s.filePath && !fileUrlMap.current.has(s.id)
    );
    if (broken.length === 0) return 0;
    for (const s of broken) {
      await dbRemoveSong(s.id);
    }
    setSongs((prev) => prev.filter((s) => !broken.find((b) => b.id === s.id)));
    return broken.length;
  }, [songs]);

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
    // Watched folder
    watchedFolder,
    scanning,
    pickWatchedFolder,
    clearWatchedFolder,
    rescanWatchedFolder,
  };
}
