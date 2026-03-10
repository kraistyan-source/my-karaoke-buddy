interface AnimatedBackgroundProps {
  color1: string; // HSL values
  color2: string;
}

const AnimatedBackground = ({ color1, color2 }: AnimatedBackgroundProps) => {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 1 }}>
      {/* Animated gradient orbs */}
      <div
        className="absolute w-[600px] h-[600px] rounded-full animate-bg-orb-1 blur-[120px]"
        style={{
          background: `radial-gradient(circle, hsl(${color1} / 0.15), transparent 70%)`,
          top: "-200px",
          left: "-100px",
        }}
      />
      <div
        className="absolute w-[500px] h-[500px] rounded-full animate-bg-orb-2 blur-[100px]"
        style={{
          background: `radial-gradient(circle, hsl(${color2} / 0.12), transparent 70%)`,
          bottom: "-150px",
          right: "-100px",
        }}
      />
      <div
        className="absolute w-[300px] h-[300px] rounded-full animate-bg-orb-3 blur-[80px]"
        style={{
          background: `radial-gradient(circle, hsl(${color1} / 0.08), transparent 70%)`,
          top: "40%",
          left: "50%",
        }}
      />
    </div>
  );
};

export default AnimatedBackground;
