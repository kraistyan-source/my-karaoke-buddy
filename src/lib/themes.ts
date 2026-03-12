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
    description: "Amarelo neon com brilho dourado",
    colors: {
      glow1: "45 100% 50%",
      glow2: "38 100% 60%",
      overlay: "hsl(0 0% 4% / 0.6)",
      text: "hsl(45 20% 95%)",
      accent: "hsl(45 100% 50%)",
      particle: "hsl(38 100% 60%)",
    },
    effects: {
      scanlines: false,
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
    description: "Luzes de palco douradas com spots",
    colors: {
      glow1: "50 100% 55%",
      glow2: "30 100% 50%",
      overlay: "hsl(0 0% 0% / 0.7)",
      text: "hsl(45 100% 90%)",
      accent: "hsl(50 100% 55%)",
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
    description: "Estilo vintage dourado com tons quentes",
    colors: {
      glow1: "40 90% 50%",
      glow2: "25 80% 55%",
      overlay: "hsl(30 20% 6% / 0.65)",
      text: "hsl(40 80% 90%)",
      accent: "hsl(40 90% 50%)",
      particle: "hsl(25 80% 60%)",
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
