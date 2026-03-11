/**
 * Type-safe bridge to Electron APIs exposed via preload.js.
 * Falls back gracefully when running in browser.
 */

export interface ScannedFile {
  name: string;
  path: string;
  ext: string;
}

interface ElectronAPI {
  openDirectory: () => Promise<string | null>;
  openFiles: (filters?: { name: string; extensions: string[] }[]) => Promise<string[]>;
  readDir: (dirPath: string) => Promise<{ name: string; isDirectory: boolean; path: string }[]>;
  scanMediaFiles: (dirPath: string) => Promise<ScannedFile[]>;
  fileExists: (filePath: string) => Promise<boolean>;
  isElectron: boolean;
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}

export const isElectron = (): boolean => !!window.electronAPI?.isElectron;

export const openDirectory = async (): Promise<string | null> => {
  if (!isElectron()) return null;
  return window.electronAPI!.openDirectory();
};

export const openFiles = async (
  filters?: { name: string; extensions: string[] }[]
): Promise<string[]> => {
  if (!isElectron()) return [];
  return window.electronAPI!.openFiles(filters);
};

export const readDir = async (
  dirPath: string
): Promise<{ name: string; isDirectory: boolean; path: string }[]> => {
  if (!isElectron()) return [];
  return window.electronAPI!.readDir(dirPath);
};

export const scanMediaFiles = async (dirPath: string): Promise<ScannedFile[]> => {
  if (!isElectron()) return [];
  return window.electronAPI!.scanMediaFiles(dirPath);
};

export const fileExists = async (filePath: string): Promise<boolean> => {
  if (!isElectron()) return false;
  return window.electronAPI!.fileExists(filePath);
};

// Convert a local file path to a file:// URL usable by <video>/<audio>
export const localFileUrl = (filePath: string): string => {
  // Normalize backslashes to forward slashes for file:// protocol
  const normalized = filePath.replace(/\\/g, "/");
  return `file:///${normalized.replace(/^\/+/, "")}`;
};

// ─── Watched Folder Persistence ───

const WATCHED_FOLDER_KEY = "karaoke-watched-folder";

export const getWatchedFolder = (): string | null => {
  return localStorage.getItem(WATCHED_FOLDER_KEY);
};

export const setWatchedFolder = (path: string | null): void => {
  if (path) {
    localStorage.setItem(WATCHED_FOLDER_KEY, path);
  } else {
    localStorage.removeItem(WATCHED_FOLDER_KEY);
  }
};
