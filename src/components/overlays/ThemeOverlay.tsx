import { VisualTheme } from "@/lib/themes";
import ParticleEffect from "./ParticleEffect";
import StageLights from "./StageLights";
import GlowBorder from "./GlowBorder";
import SingerOverlay from "./SingerOverlay";
import ProgressOverlay from "./ProgressOverlay";
import AnimatedBackground from "./AnimatedBackground";

interface ThemeOverlayProps {
  theme: VisualTheme;
  singerName?: string;
  songTitle?: string;
  artist?: string;
  progress?: number;
  showSingerInfo?: boolean;
}

const ThemeOverlay = ({
  theme,
  singerName,
  songTitle,
  artist,
  progress = 0,
  showSingerInfo = true,
}: ThemeOverlayProps) => {
  const { effects, colors } = theme;

  return (
    <>
      {/* Animated background orbs */}
      {effects.animatedBg && (
        <AnimatedBackground color1={colors.glow1} color2={colors.glow2} />
      )}

      {/* Scanlines */}
      {effects.scanlines && (
        <div className="vhs-scanlines absolute inset-0 pointer-events-none" style={{ zIndex: 10 }} />
      )}

      {/* Stage lights */}
      {effects.stageLights && (
        <StageLights color1={colors.glow1} color2={colors.glow2} />
      )}

      {/* Particles */}
      {effects.particles && (
        <ParticleEffect color={colors.particle} count={35} />
      )}

      {/* Glow border */}
      {effects.glowBorder && (
        <GlowBorder color1={colors.glow1} color2={colors.glow2} />
      )}

      {/* Singer info overlay */}
      {showSingerInfo && singerName && songTitle && artist && (
        <SingerOverlay
          singerName={singerName}
          songTitle={songTitle}
          artist={artist}
          theme={theme}
        />
      )}

      {/* Progress bar */}
      <ProgressOverlay progress={progress} color={colors.glow1} />
    </>
  );
};

export default ThemeOverlay;
