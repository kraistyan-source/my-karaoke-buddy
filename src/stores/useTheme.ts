import { create } from "zustand";
import { ThemeId, themes, VisualTheme } from "@/lib/themes";

interface ThemeStore {
  themeId: ThemeId;
  theme: VisualTheme;
  setTheme: (id: ThemeId) => void;
}

const stored = (() => {
  try {
    const v = localStorage.getItem("ruido-rosa-theme");
    if (v && v in themes) return v as ThemeId;
  } catch {}
  return "neon" as ThemeId;
})();

export const useTheme = create<ThemeStore>((set) => ({
  themeId: stored,
  theme: themes[stored],
  setTheme: (id) => {
    localStorage.setItem("ruido-rosa-theme", id);
    set({ themeId: id, theme: themes[id] });
  },
}));
