import { Mic2 } from "lucide-react";
import { VisualTheme } from "@/lib/themes";

interface SingerOverlayProps {
  singerName: string;
  songTitle: string;
  artist: string;
  theme: VisualTheme;
}

const SingerOverlay = ({ singerName, songTitle, artist, theme }: SingerOverlayProps) => {
  return (
    <div
      className="absolute bottom-20 left-0 right-0 flex justify-center pointer-events-none"
      style={{ zIndex: 15 }}
    >
      <div
        className="px-8 py-4 rounded-lg backdrop-blur-md animate-fade-in"
        style={{
          background: theme.colors.overlay,
          borderBottom: `2px solid hsl(${theme.colors.glow1} / 0.5)`,
          boxShadow: `0 0 30px hsl(${theme.colors.glow1} / 0.15)`,
        }}
      >
        <div className="flex items-center gap-3 mb-1">
          <Mic2
            className="h-5 w-5 animate-pulse"
            style={{ color: `hsl(${theme.colors.glow1})` }}
          />
          <span
            className="font-display text-lg"
            style={{
              color: `hsl(${theme.colors.glow1})`,
              textShadow: `0 0 10px hsl(${theme.colors.glow1} / 0.6)`,
            }}
          >
            {singerName}
          </span>
        </div>
        <p
          className="text-sm font-display tracking-wide"
          style={{ color: theme.colors.text }}
        >
          {songTitle}
        </p>
        <p
          className="text-xs font-mono opacity-70"
          style={{ color: theme.colors.text }}
        >
          {artist}
        </p>
      </div>
    </div>
  );
};

export default SingerOverlay;
