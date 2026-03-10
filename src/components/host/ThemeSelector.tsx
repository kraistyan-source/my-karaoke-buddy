import { ThemeId, themeIds, themes } from "@/lib/themes";
import { useTheme } from "@/stores/useTheme";
import { cn } from "@/lib/utils";
import { Palette } from "lucide-react";

const ThemeSelector = () => {
  const { themeId, setTheme } = useTheme();

  return (
    <div className="flex items-center gap-1.5">
      <Palette className="h-3.5 w-3.5 text-muted-foreground" />
      {themeIds.map((id) => {
        const t = themes[id];
        const active = id === themeId;
        return (
          <button
            key={id}
            onClick={() => setTheme(id)}
            className={cn(
              "px-2 py-0.5 rounded text-[9px] font-mono uppercase tracking-wider transition-all",
              active
                ? "border text-foreground"
                : "text-muted-foreground hover:text-foreground border border-transparent hover:border-border"
            )}
            style={active ? {
              borderColor: `hsl(${t.colors.glow1} / 0.6)`,
              backgroundColor: `hsl(${t.colors.glow1} / 0.1)`,
              color: `hsl(${t.colors.glow1})`,
              boxShadow: `0 0 8px hsl(${t.colors.glow1} / 0.2)`,
            } : undefined}
            title={t.description}
          >
            {t.label}
          </button>
        );
      })}
    </div>
  );
};

export default ThemeSelector;
