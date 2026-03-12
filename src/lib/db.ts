/**
 * IndexedDB database for karaoke library.
 * Handles 50k+ songs with instant search via indexed fields.
 */

const DB_NAME = "ruido-rosa-db";
const DB_VERSION = 3;

export interface DBSong {
  id: string;
  title: string;
  titleLower: string; // indexed for fast search
  artist: string;
  artistLower: string; // indexed for fast search
  duration: string;
  genre: string;
  language: string;
  fileType: "mp4" | "mp3" | "mkv" | "builtin";
  fileName?: string;
  filePath?: string;
  isFavorite: boolean;
  playCount: number;
  lastPlayed?: number;
  addedAt: number;
}

export interface DBSingerHistory {
  id: string;
  singerName: string;
  songId: string;
  songTitle: string;
  songArtist: string;
  playedAt: number;
  eventDate: string; // YYYY-MM-DD
}

export interface DBEventStats {
  id: string;
  date: string;
  totalSongs: number;
  totalSingers: number;
  duration: number; // minutes
  topSongs: { songId: string; title: string; count: number }[];
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      if (!db.objectStoreNames.contains("songs")) {
        const songStore = db.createObjectStore("songs", { keyPath: "id" });
        songStore.createIndex("titleLower", "titleLower", { unique: false });
        songStore.createIndex("artistLower", "artistLower", { unique: false });
        songStore.createIndex("genre", "genre", { unique: false });
        songStore.createIndex("language", "language", { unique: false });
        songStore.createIndex("isFavorite", "isFavorite", { unique: false });
        songStore.createIndex("playCount", "playCount", { unique: false });
        songStore.createIndex("lastPlayed", "lastPlayed", { unique: false });
        songStore.createIndex("addedAt", "addedAt", { unique: false });
      }

      if (!db.objectStoreNames.contains("singerHistory")) {
        const histStore = db.createObjectStore("singerHistory", { keyPath: "id" });
        histStore.createIndex("singerName", "singerName", { unique: false });
        histStore.createIndex("playedAt", "playedAt", { unique: false });
        histStore.createIndex("eventDate", "eventDate", { unique: false });
      }

      if (!db.objectStoreNames.contains("eventStats")) {
        db.createObjectStore("eventStats", { keyPath: "id" });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// ─── Song Operations ───

export async function getAllSongs(): Promise<DBSong[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("songs", "readonly");
    const store = tx.objectStore("songs");
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function addSong(song: DBSong): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("songs", "readwrite");
    tx.objectStore("songs").put(song);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function addSongsBatch(songs: DBSong[]): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("songs", "readwrite");
    const store = tx.objectStore("songs");
    songs.forEach((s) => store.put(s));
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function removeSong(id: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("songs", "readwrite");
    tx.objectStore("songs").delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function updateSong(id: string, updates: Partial<DBSong>): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("songs", "readwrite");
    const store = tx.objectStore("songs");
    const req = store.get(id);
    req.onsuccess = () => {
      if (req.result) {
        store.put({ ...req.result, ...updates });
      }
    };
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function toggleFavorite(id: string): Promise<boolean> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("songs", "readwrite");
    const store = tx.objectStore("songs");
    const req = store.get(id);
    req.onsuccess = () => {
      if (req.result) {
        const newVal = !req.result.isFavorite;
        store.put({ ...req.result, isFavorite: newVal });
        tx.oncomplete = () => resolve(newVal);
      } else {
        resolve(false);
      }
    };
    tx.onerror = () => reject(tx.error);
  });
}

export async function markPlayed(id: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("songs", "readwrite");
    const store = tx.objectStore("songs");
    const req = store.get(id);
    req.onsuccess = () => {
      if (req.result) {
        store.put({
          ...req.result,
          playCount: (req.result.playCount || 0) + 1,
          lastPlayed: Date.now(),
        });
      }
    };
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function getSongCount(): Promise<number> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("songs", "readonly");
    const req = tx.objectStore("songs").count();
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

// ─── Singer History ───

export async function addSingerHistory(entry: DBSingerHistory): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("singerHistory", "readwrite");
    tx.objectStore("singerHistory").put(entry);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function getSingerHistory(limit = 100): Promise<DBSingerHistory[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("singerHistory", "readonly");
    const store = tx.objectStore("singerHistory");
    const index = store.index("playedAt");
    const results: DBSingerHistory[] = [];
    const req = index.openCursor(null, "prev");
    req.onsuccess = () => {
      const cursor = req.result;
      if (cursor && results.length < limit) {
        results.push(cursor.value);
        cursor.continue();
      } else {
        resolve(results);
      }
    };
    req.onerror = () => reject(req.error);
  });
}

// ─── Clear Demo Songs ───

export async function clearDemoSongs(): Promise<void> {
  const all = await getAllSongs();
  const demos = all.filter((s) => s.fileType === "builtin");
  if (demos.length === 0) return;
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("songs", "readwrite");
    const store = tx.objectStore("songs");
    demos.forEach((s) => store.delete(s.id));
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}
