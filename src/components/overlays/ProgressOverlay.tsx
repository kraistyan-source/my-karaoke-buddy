interface ProgressOverlayProps {
  progress: number; // 0-100
  color: string;    // HSL values
}

const ProgressOverlay = ({ progress, color }: ProgressOverlayProps) => {
  return (
    <div
      className="absolute bottom-0 left-0 right-0 h-1.5 pointer-events-none"
      style={{ zIndex: 16, background: `hsl(${color} / 0.1)` }}
    >
      <div
        className="h-full transition-all duration-200"
        style={{
          width: `${progress}%`,
          background: `linear-gradient(90deg, hsl(${color} / 0.6), hsl(${color}))`,
          boxShadow: `0 0 12px hsl(${color} / 0.5), 0 0 4px hsl(${color} / 0.8)`,
        }}
      />
    </div>
  );
};

export default ProgressOverlay;
