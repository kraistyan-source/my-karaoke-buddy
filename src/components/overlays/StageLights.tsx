import { cn } from "@/lib/utils";

interface StageLightsProps {
  color1: string; // HSL values like "45 100% 55%"
  color2: string;
}

const StageLights = ({ color1, color2 }: StageLightsProps) => {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 4 }}>
      {/* Spot 1 - left */}
      <div
        className="absolute -top-20 left-[10%] w-[300px] h-[120%] animate-stage-light-1"
        style={{
          background: `conic-gradient(from 170deg, transparent 30%, hsl(${color1} / 0.15) 45%, hsl(${color1} / 0.25) 50%, hsl(${color1} / 0.15) 55%, transparent 70%)`,
          transformOrigin: "top center",
        }}
      />
      {/* Spot 2 - right */}
      <div
        className="absolute -top-20 right-[10%] w-[300px] h-[120%] animate-stage-light-2"
        style={{
          background: `conic-gradient(from 170deg, transparent 30%, hsl(${color2} / 0.15) 45%, hsl(${color2} / 0.25) 50%, hsl(${color2} / 0.15) 55%, transparent 70%)`,
          transformOrigin: "top center",
        }}
      />
      {/* Spot 3 - center */}
      <div
        className="absolute -top-20 left-[45%] w-[200px] h-[120%] animate-stage-light-3"
        style={{
          background: `conic-gradient(from 170deg, transparent 35%, hsl(${color1} / 0.1) 47%, hsl(${color1} / 0.18) 50%, hsl(${color1} / 0.1) 53%, transparent 65%)`,
          transformOrigin: "top center",
        }}
      />
      {/* Floor glow */}
      <div
        className="absolute bottom-0 left-0 right-0 h-32"
        style={{
          background: `linear-gradient(to top, hsl(${color1} / 0.08), transparent)`,
        }}
      />
    </div>
  );
};

export default StageLights;
