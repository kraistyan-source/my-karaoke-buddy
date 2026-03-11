/**
 * Type-safe bridge to Electron APIs exposed via preload.js.
 * Falls back gracefully when running in browser.
 */

interface ElectronAPI {
  openDirectory: () => Promise<string | null>;
  openFiles: (filters?: { name: string; extensions: string[] }[]) => Promise<string[]>;
  readDir: (dirPath: string) => Promise<{ name: string; isDirectory: boolean; path: string }[]>;
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

export const fileExists = async (filePath: string): Promise<boolean> => {
  if (!isElectron()) return false;
  return window.electronAPI!.fileExists(filePath);
};
