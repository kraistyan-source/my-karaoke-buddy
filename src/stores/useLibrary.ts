import { useState, useCallback, useEffect } from "react";

export interface LibrarySong {
  id: string;
  title: string;
  artist: string;
  duration: string;
  genre: string;
  fileType: "mp4" | "mp3" | "builtin";
  fileUrl?: string; // object URL for imported files
  fileName?: string;
}

const STORAGE_KEY = "ruido-rosa-library";

function loadFromStorage(): LibrarySong[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return [];
}

function saveToStorage(songs: LibrarySong[]) {
  // Only save metadata, not object URLs (they're session-only)
  const toSave = songs.filter((s) => s.fileType === "builtin").map(({ fileUrl, ...rest }) => rest);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
}

// Built-in demo songs
const BUILTIN_SONGS: LibrarySong[] = [
  { id: "demo-1", title: "Evidências", artist: "Chitãozinho & Xororó", duration: "4:32", genre: "Sertanejo", fileType: "builtin" },
  { id: "demo-2", title: "Bohemian Rhapsody", artist: "Queen", duration: "5:55", genre: "Rock", fileType: "builtin" },
  { id: "demo-3", title: "Garota de Ipanema", artist: "Tom Jobim & Vinícius", duration: "3:45", genre: "Bossa Nova", fileType: "builtin" },
  { id: "demo-4", title: "Don't Stop Me Now", artist: "Queen", duration: "3:29", genre: "Rock", fileType: "builtin" },
  { id: "demo-5", title: "Ai Se Eu Te Pego", artist: "Michel Teló", duration: "2:53", genre: "Sertanejo", fileType: "builtin" },
  { id: "demo-6", title: "Sweet Child O' Mine", artist: "Guns N' Roses", duration: "5:56", genre: "Rock", fileType: "builtin" },
  { id: "demo-7", title: "Trem-Bala", artist: "Ana Vilela", duration: "4:20", genre: "Pop", fileType: "builtin" },
  { id: "demo-8", title: "Livin' on a Prayer", artist: "Bon Jovi", duration: "4:09", genre: "Rock", fileType: "builtin" },
];

export function useLibrary() {
  const [songs, setSongs] = useState<LibrarySong[]>(() => [
    ...BUILTIN_SONGS,
    ...loadFromStorage(),
  ]);
  const [search, setSearch] = useState("");

  const filtered = songs.filter((s) => {
    const q = search.toLowerCase();
    return s.title.toLowerCase().includes(q) || s.artist.toLowerCase().includes(q);
  });

  const addFiles = useCallback((files: FileList) => {
    const newSongs: LibrarySong[] = [];
    Array.from(files).forEach((file) => {
      const ext = file.name.split(".").pop()?.toLowerCase();
      if (ext !== "mp4" && ext !== "mp3") return;

      const nameParts = file.name.replace(/\.[^.]+$/, "").split(" - ");
      const artist = nameParts.length > 1 ? nameParts[0].trim() : "Artista Desconhecido";
      const title = nameParts.length > 1 ? nameParts.slice(1).join(" - ").trim() : nameParts[0].trim();

      const url = URL.createObjectURL(file);
      newSongs.push({
        id: `import-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        title,
        artist,
        duration: "--:--",
        genre: "Importado",
        fileType: ext as "mp4" | "mp3",
        fileUrl: url,
        fileName: file.name,
      });
    });
    setSongs((prev) => [...prev, ...newSongs]);
  }, []);

  const removeSong = useCallback((id: string) => {
    setSongs((prev) => {
      const song = prev.find((s) => s.id === id);
      if (song?.fileUrl) URL.revokeObjectURL(song.fileUrl);
      return prev.filter((s) => s.id !== id);
    });
  }, []);

  return { songs, filtered, search, setSearch, addFiles, removeSong, total: songs.length };
}
