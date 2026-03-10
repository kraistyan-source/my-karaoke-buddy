export type ThemeId = "neon" | "stage" | "retro" | "minimal";

export interface VisualTheme {
  id: ThemeId;
  label: string;
  description: string;
  colors: {
    glow1: string;      // HSL string for primary glow
    glow2: string;      // HSL string for secondary glow
    overlay: string;     // background tint
    text: string;        // overlay text color
    accent: string;      // accent highlights
    particle: string;    // particle color
  };
  effects: {
    scanlines: boolean;
    particles: boolean;
    stageLights: boolean;
    glowBorder: boolean;
    animatedBg: boolean;
  };
  fonts: {
    display: string;
    body: string;
  };
}

export const themes: Record<ThemeId, VisualTheme> = {
  neon: {
    id: "neon",
    label: "NEON",
    description: "Cyberpunk neon com brilho magenta e ciano",
    colors: {
      glow1: "305 100% 50%",
      glow2: "180 100% 50%",
      overlay: "hsl(240 7% 6% / 0.6)",
      text: "hsl(0 0% 95%)",
      accent: "hsl(305 100% 50%)",
      particle: "hsl(180 100% 60%)",
    },
    effects: {
      scanlines: true,
      particles: true,
      stageLights: false,
      glowBorder: true,
      animatedBg: true,
    },
    fonts: { display: "'Bungee', cursive", body: "'Roboto Mono', monospace" },
  },
  stage: {
    id: "stage",
    label: "PALCO",
    description: "Luzes de palco dramáticas com spots coloridos",
    colors: {
      glow1: "45 100% 55%",
      glow2: "220 100% 60%",
      overlay: "hsl(0 0% 0% / 0.7)",
      text: "hsl(45 100% 90%)",
      accent: "hsl(45 100% 55%)",
      particle: "hsl(45 90% 70%)",
    },
    effects: {
      scanlines: false,
      particles: true,
      stageLights: true,
      glowBorder: false,
      animatedBg: true,
    },
    fonts: { display: "'Bungee', cursive", body: "'Roboto Mono', monospace" },
  },
  retro: {
    id: "retro",
    label: "RETRÔ",
    description: "Estilo anos 80 com gradientes quentes e VHS",
    colors: {
      glow1: "340 90% 55%",
      glow2: "270 80% 60%",
      overlay: "hsl(280 30% 8% / 0.65)",
      text: "hsl(340 80% 90%)",
      accent: "hsl(340 90% 55%)",
      particle: "hsl(270 80% 70%)",
    },
    effects: {
      scanlines: true,
      particles: true,
      stageLights: false,
      glowBorder: true,
      animatedBg: true,
    },
    fonts: { display: "'Bungee', cursive", body: "'Roboto Mono', monospace" },
  },
  minimal: {
    id: "minimal",
    label: "CLEAN",
    description: "Minimalista, sem distrações visuais",
    colors: {
      glow1: "0 0% 70%",
      glow2: "0 0% 50%",
      overlay: "hsl(0 0% 0% / 0.5)",
      text: "hsl(0 0% 95%)",
      accent: "hsl(0 0% 80%)",
      particle: "hsl(0 0% 60%)",
    },
    effects: {
      scanlines: false,
      particles: false,
      stageLights: false,
      glowBorder: false,
      animatedBg: false,
    },
    fonts: { display: "'Bungee', cursive", body: "'Roboto Mono', monospace" },
  },
};

export const themeIds = Object.keys(themes) as ThemeId[];
